import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as model from "../src/lib/comment-model.ts";

const id = "11111111-1111-4111-8111-111111111111";
const draft = { thread: "/guestbook", nickname: "  路过的读者  ", avatar: "cat", body: "  你好，Xavier！  " };
type Environment = Record<string, string>;
type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
type Storage = { readComments: (thread: string, before: string | null) => Promise<{ items: model.CommentEntry[]; next: string | null }> };
type Route = { GET: (request: Request) => Promise<Response>; POST: (request: Request) => Promise<Response> };
function load(file: string, imports: Record<string, unknown>, env: Environment, fetcher: Fetcher): Record<string, unknown> {
  const exports = {};
  const source = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: (name: string) => { assert.ok(name in imports, name); return imports[name]; },
      process: { env }, fetch: fetcher, Response, Request, URL, URLSearchParams, AbortSignal, Buffer });
  return exports;
}
function setup(fetcher: Fetcher, env: Environment = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test", COMMENTS_IP_SALT: "test-salt-12345678901234567890123456789" }) {
  const storage = load("lib/comment-storage.ts", { "./comment-model": model }, env, fetcher);
  const route = load("server/legacy-api/comments/route.ts", { "node:crypto": { createHmac }, "@/lib/comment-model": model, "@/lib/comment-storage": storage }, env, fetcher);
  return { storage: storage as unknown as Storage, route: route as unknown as Route };
}
function post(body: unknown, origin = "https://blog.example.com") {
  return new Request("https://blog.example.com/api/comments", { method: "POST", headers: { "Content-Type": "application/json", origin, "x-forwarded-for": "192.0.2.1" }, body: JSON.stringify(body) });
}

test("anonymous input validates nickname, avatar, thread and length without accepting privileges", () => {
  assert.deepEqual(model.parseCommentDraft({ ...draft, status: "approved", is_author: true }),
    { thread: "/guestbook", nickname: "路过的读者", avatar: "cat", body: "你好，Xavier！", parentId: null });
  for (const change of [{ nickname: "\n" }, { nickname: "a\u200bb" }, { nickname: "x".repeat(25) },
    { body: "x".repeat(2001) }, { body: "\u0000" }, { avatar: "https://bad.test" }, { thread: "/posts/../secret" }, { parentId: "bad" }]) {
    assert.throws(() => model.parseCommentDraft({ ...draft, ...change }));
  }
});

test("every selectable avatar is accepted by both the submit API and the database constraint", async () => {
  const schema = readFileSync(new URL("../supabase/comments.sql", import.meta.url), "utf8");
  const allowed = schema.match(/check \(avatar in \(([^)]+)\)\)/)?.[1].match(/'[^']+'/g)?.map((value) => value.slice(1, -1));
  assert.deepEqual(allowed, model.commentAvatars.map((avatar) => avatar.id));
  for (const avatar of model.commentAvatars) {
    const { route } = setup(async (_, init) => {
      assert.equal((JSON.parse(String(init.body)) as { p_avatar: string }).p_avatar, avatar.id);
      return Response.json(id);
    });
    assert.equal((await route.POST(post({ ...draft, avatar: avatar.id }))).status, 201);
  }
});

test("unconfigured service returns honest 503; invalid and cross-origin submissions are rejected", async () => {
  const { route } = setup(async () => { throw Error("must not fetch"); }, {});
  assert.equal((await route.GET(new Request("https://blog.example.com/api/comments?thread=/guestbook"))).status, 503);
  assert.equal((await route.POST(post(draft))).status, 503);
  assert.equal((await route.POST(post({ ...draft, avatar: "bad" }))).status, 400);
  assert.equal((await route.POST(post(draft, "https://other.test"))).status, 403);
  assert.equal((await route.POST(post({ ...draft, body: "x".repeat(17000) }))).status, 413);
});

test("submit uses restricted RPC fields, hashes the source and returns pending only", async () => {
  const { route } = setup(async (url, init) => {
    assert.equal(new URL(url).pathname, "/rest/v1/rpc/submit_blog_comment");
    const sent = JSON.parse(String(init.body)) as Record<string, unknown>;
    assert.deepEqual(Object.keys(sent).sort(), ["p_avatar", "p_body", "p_client_hash", "p_nickname", "p_parent", "p_thread"]);
    assert.match(String(sent.p_client_hash), /^[a-f0-9]{64}$/);
    assert.equal(sent.p_nickname, "路过的读者");
    assert.equal((init.headers as Record<string, string>).Authorization, undefined);
    return Response.json(id);
  });
  const response = await route.POST(post({ ...draft, status: "approved", is_author: true }));
  assert.equal(response.status, 201);
  assert.equal((await response.json() as { status: string }).status, "pending");
});

test("reading separates threads, exposes approved only and preserves microsecond pagination", async () => {
  const date = "2026-10-22T01:02:03.123456+00:00";
  const { storage } = setup(async (url) => {
    const query = new URL(url).searchParams;
    assert.equal(query.get("thread"), "eq./posts/build-a-quiet-web");
    assert.equal(query.get("status"), "eq.approved");
    assert.ok(query.get("or")?.includes(date));
    return Response.json(Array.from({ length: 21 }, () => ({ id, nickname: "读者", avatar: "rabbit", body: "问候", created_at: date,
      parent_id: id, is_author: false, reply_to: { nickname: "隐藏内容", status: "hidden" } })));
  });
  const page = await storage.readComments("/posts/build-a-quiet-web", `${date}|${id}`);
  assert.equal(page.items.length, 20);
  assert.equal(page.items[0].replyTo, null);
  assert.equal(page.next, `${date}|${id}`);
  await assert.rejects(storage.readComments("/guestbook", `bad|${id}`));
});

test("backend rate limits are readable and backend details are never exposed", async () => {
  for (const [message, status] of [["rate_limited", 429], ["invalid_parent", 400], ["private database details", 502]] as const) {
    const { route } = setup(async () => Response.json({ message }, { status: 400 }));
    const response = await route.POST(post(draft));
    assert.equal(response.status, status);
    assert.ok(!(await response.text()).includes("private database details"));
  }
});
