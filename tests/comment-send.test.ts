import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as model from "../src/lib/comment-model.ts";

type Node = { type: string; props: Record<string, unknown> };
type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
const source = readFileSync(new URL("../src/components/comments/form.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;

function fixture(fetcher: Fetcher, ready = true) {
  const slots: unknown[] = [];
  let cursor = 0;
  const react = {
    useId: () => "send-test", useEffect: () => {},
    useRef: (initial: unknown) => { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useState: (initial: unknown) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value: unknown) => { slots[index] = value; }];
    },
  };
  const exports: { CommentForm?: (props: Record<string, unknown>) => Node } = {};
  const imports: Record<string, unknown> = {
    react, "react/jsx-runtime": { jsx: (type: string, props: Record<string, unknown>) => ({ type, props }), jsxs: (type: string, props: Record<string, unknown>) => ({ type, props }) },
    "next/image": { default: "image" }, "@/lib/comment-model": model,
    "./identity": { CommentIdentity: "identity" }, "./submit-button": { CommentSubmit: "send-control" },
  };
  vm.runInNewContext(compiled, { exports, AbortController, fetch: fetcher, require: (name: string) => { assert.ok(name in imports, name); return imports[name]; } });
  assert.ok(exports.CommentForm);
  const render = () => { cursor = 0; return exports.CommentForm!({ thread: "/guestbook", ready, replyTo: null, onCancelReply: () => {} }); };
  function find(type: string, node: unknown = render()): Node {
    if (typeof node !== "object" || node === null || !("props" in node)) throw Error(`Missing ${type}`);
    const element = node as Node;
    if (element.type === type) return element;
    for (const child of [element.props.children].flat()) {
      try { return find(type, child); } catch { /* Continue with the next child. */ }
    }
    throw Error(`Missing ${type}`);
  }
  const write = (text: string) => (find("textarea").props.onChange as (event: { target: { value: string } }) => void)({ target: { value: text } });
  (find("identity").props.onChange as (value: unknown) => void)({ nickname: "动效测试", avatar: "bear", remember: false });
  write("一条测试留言");
  return { find, write, submit: () => (render().props.onSubmit as (event: { preventDefault: () => void }) => Promise<void>)({ preventDefault() {} }) };
}

test("send feedback waits for confirmation and repeated submits make only one request", async () => {
  let calls = 0;
  let resolve: (response: Response) => void = () => {};
  const response = new Promise<Response>((done) => { resolve = done; });
  const f = fixture(async () => { calls++; return response; });
  const first = f.submit();
  assert.equal(f.find("send-control").props.busy, true);
  assert.equal(f.find("send-control").props.success, false);
  await f.submit();
  assert.equal(calls, 1);
  resolve(Response.json({ status: "pending" }));
  await first;
  assert.equal(f.find("send-control").props.busy, false);
  assert.equal(f.find("send-control").props.success, true);
  assert.equal(f.find("textarea").props.value, "");
  f.write("再写一条");
  assert.equal(f.find("send-control").props.success, false);
});

test("failed or unconfirmed sends preserve the draft and never celebrate", async () => {
  for (const response of [Response.json({ message: "测试失败" }, { status: 502 }), Response.json({ status: "approved" })]) {
    const f = fixture(async () => response);
    await f.submit();
    const feedback = f.find("send-control").props;
    assert.equal(feedback.success, false);
    assert.equal(feedback.busy, false);
    assert.equal(feedback.error, true);
    assert.equal(f.find("textarea").props.value, "一条测试留言");
  }
});

test("unavailable and invalid forms do not start a send", async () => {
  let calls = 0;
  const fetcher = async () => { calls++; throw Error("must not send"); };
  const unavailable = fixture(fetcher, false);
  await unavailable.submit();
  assert.equal(unavailable.find("send-control").props.busy, false);
  assert.equal(unavailable.find("send-control").props.success, false);
  const empty = fixture(fetcher);
  empty.write("");
  await empty.submit();
  assert.equal(empty.find("send-control").props.busy, false);
  assert.equal(empty.find("send-control").props.success, false);
  assert.equal(calls, 0);
});
