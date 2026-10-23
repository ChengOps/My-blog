import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (typeof value !== "object" || value === null || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
function setup() {
  const hooks: unknown[] = [], cleanups: (() => void)[] = [];
  const timers = new Map<number, { at: number; callback: () => void }>();
  const routes: string[] = [];
  let cursor = 0, now = 100, id = 0;
  const react = {
    useRef: (value: unknown) => { const i = cursor++; return hooks[i] ??= { current: value }; },
    useState: (value: unknown) => { const i = cursor++; if (!(i in hooks)) hooks[i] = value; return [hooks[i], (next: unknown) => { hooks[i] = next; }]; },
    useEffect: (effect: () => () => void) => { const i = cursor++; if (!(i in hooks)) { hooks[i] = true; cleanups.push(effect()); } },
  };
  const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
  const imports: Record<string, unknown> = { react, "react/jsx-runtime": { jsx, jsxs: jsx }, "next/image": { default: "img" },
    "next/navigation": { usePathname: () => "/posts", useRouter: () => ({ push: (path: string) => routes.push(path) }) },
    "../../site.config": { siteConfig: { name: "Xavier", avatar: "/avatar.jpg" } } };
  const exports: Record<string, unknown> = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../src/components/avatar-secret.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: (name: string) => { assert.ok(name in imports, name); return imports[name]; },
    performance: { now: () => now }, document: { addEventListener: () => {}, removeEventListener: () => {} },
    setTimeout: (callback: () => void, delay: number) => { timers.set(++id, { at: now + delay, callback }); return id; },
    clearTimeout: (timer: number) => timers.delete(timer), Element: class {} });
  const tree = () => { cursor = 0; return (exports.AvatarSecret as () => Node)(); };
  const click = () => { now += 100; const button = nodes(tree()).find((node) => node.type === "button")!; (button.props.onClick as () => void)(); };
  const tick = (delay: number) => { now += delay; for (const [id, timer] of timers) if (timer.at <= now) { timers.delete(id); timer.callback(); } };
  return { tree, click, tick, routes, cleanup: () => cleanups.forEach((cleanup) => cleanup()) };
}
test("avatar shows the fifth and eighth messages before entering once, and ignores extra clicks", () => {
  const view = setup();
  for (let i = 0; i < 5; i++) view.click();
  assert.ok(nodes(view.tree()).some((node) => node.props.children === "你再点一次试试"));
  for (let i = 0; i < 3; i++) view.click();
  assert.ok(nodes(view.tree()).some((node) => node.props.children === "真拿你没办法"));
  assert.deepEqual(view.routes, []);
  view.click(); view.tick(799); assert.deepEqual(view.routes, []);
  view.tick(1); assert.deepEqual(view.routes, ["/play"]);
  view.tick(3000); assert.deepEqual(view.routes, ["/play"]);
});
test("avatar resets a broken sequence and cancels delayed navigation on unmount", () => {
  const view = setup();
  for (let i = 0; i < 5; i++) view.click();
  view.tick(1100); view.click();
  assert.ok(!nodes(view.tree()).some((node) => typeof node.props.children === "string" && node.props.children.includes("再点")));
  for (let i = 0; i < 7; i++) view.click();
  view.cleanup(); view.tick(3000); assert.deepEqual(view.routes, []);
});
