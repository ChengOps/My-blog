import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

type Routes = typeof import("../src/lib/route-transition.ts");
const source = readFileSync(new URL("../src/lib/route-transition.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

function fixture({ supported = true, hush = false, reduced = false, throws = false } = {}) {
  const attrs = new Set<string>(), styles = new Map<string, string>(), timers = new Map<number, () => void>();
  let lastTimer = 0, mutation = () => {}, disconnected = 0;
  const mediaListeners = new Set<() => void>();
  const root = { dataset: {} as Record<string, string>, setAttribute: (name: string) => attrs.add(name), removeAttribute: (name: string) => attrs.delete(name),
    style: { setProperty: (key: string, value: string) => styles.set(key, value), removeProperty: (key: string) => styles.delete(key) } };
  if (hush) root.dataset.hush = "on";
  const media = { matches: reduced, addEventListener: (_: string, fn: () => void) => mediaListeners.add(fn), removeEventListener: (_: string, fn: () => void) => mediaListeners.delete(fn) };
  const transitions: { begin: () => Promise<void>; end: () => void; skips: number }[] = [];
  const start = (update: () => Promise<void>) => {
    if (throws) throw Error("native API unavailable");
    let ready = () => {}, end = () => {};
    const readyPromise = new Promise<void>((resolve) => { ready = resolve; });
    const finished = new Promise<void>((resolve) => { end = resolve; });
    const entry = { begin: async () => { await update(); ready(); }, end, skips: 0 };
    transitions.push(entry);
    return { ready: readyPromise, finished, skipTransition: () => { entry.skips++; } };
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, innerWidth: 390, innerHeight: 844,
    document: { documentElement: root, ...(supported ? { startViewTransition: start } : {}) },
    MutationObserver: class { constructor(fn: () => void) { mutation = fn; } observe() {} disconnect() { disconnected++; } },
    window: { matchMedia: () => media, setTimeout: (fn: () => void, duration: number) => { assert.equal(duration, 4000); timers.set(++lastTimer, fn); return lastTimer; }, clearTimeout: (id: number) => timers.delete(id) },
  });
  return { routes: exports as Routes, attrs, styles, transitions, timers, mediaListeners, disconnected: () => disconnected,
    quiet: () => { root.dataset.hush = "on"; mutation(); }, reduce: () => { media.matches = true; mediaListeners.forEach((fn) => fn()); },
    expire: () => { [...timers.values()].forEach((fn) => fn()); } };
}

test("reveal starts at the click, covers the viewport and waits for the matching route commit", async () => {
  const f = fixture(); let navigations = 0, captured = false;
  f.routes.revealRoute("/posts", () => { navigations++; }, { x: 350, y: 30 });
  assert.equal(navigations, 0);
  assert.equal(f.styles.get("--route-x"), "350px");
  assert.ok(Number.parseFloat(f.styles.get("--route-radius")!) >= Math.hypot(350, 814));
  const update = f.transitions[0].begin().then(() => { captured = true; });
  assert.equal(navigations, 1); await flush(); assert.equal(captured, false);
  f.routes.finishRouteReveal("/about"); await flush(); assert.equal(captured, false);
  f.routes.finishRouteReveal("/posts"); await update;
  assert.equal(f.attrs.has("data-route-reveal"), true);
  f.transitions[0].end(); await flush();
  assert.equal(f.attrs.size, 0); assert.equal(f.styles.size, 0); assert.equal(f.timers.size, 0);
  assert.equal(f.mediaListeners.size, 0); assert.equal(f.disconnected(), 1);
});

test("unsupported, quiet and reduced motion navigation works without native animation", () => {
  for (const options of [{ supported: false }, { hush: true }, { reduced: true }, { throws: true }]) {
    const f = fixture(options); let count = 0;
    f.routes.revealRoute("/about", () => { count++; });
    assert.equal(count, 1); assert.equal(f.transitions.length, 0); assert.equal(f.attrs.size, 0);
  }
});

test("keyboard origin is the link center; pointer origin is retained", () => {
  const { routes } = fixture();
  const link = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 80, height: 40 }) } as unknown as HTMLElement;
  const keyboard = routes.routeOrigin({ detail: 0, clientX: 0, clientY: 0 } as MouseEvent, link);
  const pointer = routes.routeOrigin({ detail: 1, clientX: 27, clientY: 31 } as MouseEvent, link);
  assert.equal(keyboard.x, 50); assert.equal(keyboard.y, 40);
  assert.equal(pointer.x, 27); assert.equal(pointer.y, 31);
});

test("a zero-detail click with real coordinates keeps the touch position", () => {
  const { routes } = fixture();
  const link = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 80, height: 40 }) } as unknown as HTMLElement;
  const origin = routes.routeOrigin({ detail: 0, clientX: 27, clientY: 31 } as MouseEvent, link);
  assert.equal(origin.x, 27); assert.equal(origin.y, 31);
});

test("recorded pointer position survives a zero-coordinate click and delayed navigation, including the viewport corner", () => {
  for (const point of [{ x: 27, y: 31 }, { x: 0, y: 0 }]) {
    const f = fixture();
    const link = { getBoundingClientRect: () => { throw Error("must not replace the pointer with element geometry"); } } as unknown as HTMLElement;
    const origin = f.routes.routeOrigin({ detail: 0, clientX: 0, clientY: 0 } as MouseEvent, link, point);
    f.routes.revealRoute("/posts", () => {}, origin);
    assert.equal(f.styles.get("--route-x"), `${point.x}px`);
    assert.equal(f.styles.get("--route-y"), `${point.y}px`);
    f.routes.cancelRouteReveal();
  }
});

test("rapid navigation drops an obsolete queued update and old cleanup cannot erase the new reveal", async () => {
  const f = fixture(); const visited: string[] = [];
  f.routes.revealRoute("/posts", () => visited.push("posts"));
  f.routes.revealRoute("/about", () => visited.push("about"), { x: 20, y: 30 });
  assert.equal(f.transitions[0].skips, 1);
  await f.transitions[0].begin(); f.transitions[0].end(); await flush();
  assert.equal(f.styles.get("--route-x"), "20px");
  const update = f.transitions[1].begin();
  f.routes.revealRoute("/about", () => visited.push("duplicate"));
  f.routes.finishRouteReveal("/about"); await update;
  f.transitions[1].end(); await flush();
  assert.deepEqual(visited, ["about"]); assert.equal(f.attrs.size, 0);
});

test("quiet mode before capture still navigates; motion changes and timeout release a pending capture", async () => {
  const before = fixture(); let count = 0;
  before.routes.revealRoute("/posts", () => { count++; });
  before.quiet(); await before.transitions[0].begin();
  assert.equal(count, 1); assert.equal(before.attrs.size, 0);
  for (const action of ["reduce", "expire"] as const) {
    const f = fixture();
    f.routes.revealRoute("/posts", () => {});
    const update = f.transitions[0].begin();
    f[action](); await update;
    assert.equal(f.transitions[0].skips, 1);
    f.transitions[0].end(); await flush();
    assert.equal(f.attrs.size, 0); assert.equal(f.timers.size, 0);
  }
});
