import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

type Listener = (event?: Record<string, unknown>) => void;
const source = readFileSync(new URL("../src/app/posts/posts-snap.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;

function fixture(hash = "", centered = false) {
  let writes = 0, nextTimer = 0, rowHeight = 164, cleanup = () => {}, resized = () => {};
  const timers = new Map<number, () => void>();
  const listeners = new Map<string, Listener>();
  const globalListeners = new Map<string, Listener>();
  const attributes = new Set<string>();
  function element(id = "", index = 0) {
    const classes = new Set<string>();
    return { id, classes, get offsetTop() { return index * rowHeight + (centered ? Math.max(0, (el.clientHeight - rowHeight) / 2) : 0); }, get offsetHeight() { return rowHeight; }, classList: { toggle: (name: string, on: boolean) => { writes++; if (on) classes.add(name); else classes.delete(name); } } };
  }
  const steps = [element("first"), element("second", 1), element("third", 2), element("", 3)];
  const segments = [element(), element(), element()];
  class Transition {
    playState = "running";
    pauses = 0;
    plays = 0;
    pause() { this.playState = "paused"; this.pauses++; }
    play() { this.playState = "running"; this.plays++; }
  }
  const stroke = new Transition();
  const el = { scrollTop: 0, clientHeight: 768,
    querySelectorAll: (selector: string) => selector === ".step" ? steps : segments,
    setAttribute: (name: string) => attributes.add(name), removeAttribute: (name: string) => attributes.delete(name),
    getBoundingClientRect: () => ({}), getAnimations: () => [stroke],
    addEventListener: (name: string, fn: Listener) => listeners.set(name, fn),
    removeEventListener: (name: string) => listeners.delete(name),
    scrollTo: ({ top }: { top: number }) => { el.scrollTop = top; listeners.get("scroll")?.(); },
  };
  const location = { hash };
  const exports: { PostsSnap?: (props: { children: null }) => { props: Record<string, unknown> } } = {};
  vm.runInNewContext(compiled, { exports, location, CSSTransition: Transition, Element: class {}, document: { documentElement: { dataset: {} } },
    getComputedStyle: () => ({ scrollSnapAlign: centered ? "center" : "start" }),
    ResizeObserver: class { constructor(fn: () => void) { resized = fn; } observe() {} disconnect() {} },
    window: { matchMedia: () => ({ matches: false }), setTimeout: (fn: () => void, delay: number) => { assert.equal(delay, 140); timers.set(++nextTimer, fn); return nextTimer; },
      clearTimeout: (id: number) => timers.delete(id), addEventListener: (name: string, fn: Listener) => globalListeners.set(name, fn), removeEventListener: (name: string) => globalListeners.delete(name) },
    require: (name: string) => {
      if (name === "react") return { useRef: () => ({ current: el }), useLayoutEffect: (effect: () => () => void) => { cleanup = effect(); } };
      if (name === "react/jsx-runtime") return { jsx: (_: unknown, props: Record<string, unknown>) => ({ props }) };
      throw Error(name);
    },
  });
  assert.ok(exports.PostsSnap);
  const rendered = exports.PostsSnap({ children: null });
  return { el, steps, segments, stroke, attributes, listeners, globalListeners, rendered,
    writes: () => writes, cleanup: () => cleanup(), resize: (height = rowHeight) => { rowHeight = height; resized(); },
    scroll: (top: number) => { el.scrollTop = top; listeners.get("scroll")?.(); },
    idle: () => { const pending = [...timers.values()]; timers.clear(); pending.forEach((fn) => fn()); },
    end: () => listeners.get("scrollend")?.(),
    key: (key: string, target: unknown = el) => { let prevented = false; listeners.get("keydown")?.({ key, target, preventDefault: () => { prevented = true; } }); return prevented; },
    wheel: (deltaY: number, ctrlKey = false) => { let prevented = false; listeners.get("wheel")?.({ deltaY, deltaX: 0, ctrlKey, cancelable: true, target: el, preventDefault: () => { prevented = true; } }); return prevented; },
  };
}
const active = (items: { classes: Set<string> }[]) => items.flatMap((item, index) => item.classes.has("on") ? [index] : []);

test("a wheel burst including inertial tail advances one step; a later gesture advances the next", () => {
  const f = fixture();
  for (let index = 0; index < 20; index++) assert.equal(f.wheel(2000), true);
  assert.equal(f.el.scrollTop, 164);
  f.idle();
  assert.equal(f.wheel(2000), true);
  assert.equal(f.el.scrollTop, 328);
  f.idle(); f.wheel(-2000);
  assert.equal(f.el.scrollTop, 164);
  assert.equal(f.wheel(100, true), false);
});

test("mobile centered snapping keeps deep links, keyboard and resize aligned after reserving the bottom bar", () => {
  const f = fixture("#third", true);
  assert.equal(f.el.scrollTop, 328);
  assert.deepEqual(active(f.steps), [2]);
  f.el.clientHeight = 493; f.resize(184);
  assert.equal(f.el.scrollTop, 368);
  f.key("PageUp"); f.end();
  assert.equal(f.el.scrollTop, 184);
  assert.deepEqual(active(f.steps), [1]);
  f.key("Home"); f.end();
  assert.equal(f.el.scrollTop, 0);
  assert.deepEqual(active(f.steps), [0]);
});

test("snap waits for a settled boundary; fallback and scrollend commit only once", () => {
  const f = fixture();
  assert.deepEqual(active(f.steps), [0]);
  const before = f.writes();
  f.scroll(80); f.idle(); f.end();
  assert.equal(f.writes(), before);
  assert.equal(f.stroke.playState, "paused");
  f.scroll(164); f.idle();
  assert.deepEqual(active(f.steps), [1]);
  assert.deepEqual(active(f.segments), [0]);
  const committed = f.writes(); f.end(); f.end();
  assert.equal(f.writes(), committed);
  assert.equal(f.stroke.plays, 1);
  f.scroll(0); f.end();
  assert.deepEqual(active(f.steps), [0]);
  assert.deepEqual(active(f.segments), []);
});

test("rapid movement commits the final step, supports deep links and retains resize alignment", () => {
  const f = fixture("#second");
  assert.equal(f.el.scrollTop, 164);
  assert.deepEqual(active(f.steps), [1]);
  const before = f.writes();
  for (let index = 0; index < 10; index++) f.scroll(index % 3 * 164 + 40);
  assert.equal(f.writes(), before);
  f.scroll(328); f.end(); f.idle();
  assert.deepEqual(active(f.steps), [2]);
  assert.deepEqual(active(f.segments), [0, 1]);
  f.el.clientHeight = 500; f.resize(184);
  assert.equal(f.el.scrollTop, 368);
  assert.deepEqual(active(f.steps), [2]);
  assert.equal(fixture("#%invalid").el.scrollTop, 0);
});

test("keyboard moves one compact row only on the container; Tab and Escape remain native; cleanup releases listeners", () => {
  const f = fixture();
  assert.equal(f.rendered.props.tabIndex, 0);
  assert.ok(f.rendered.props["aria-label"]);
  assert.equal(f.key("PageDown"), true); assert.equal(f.el.scrollTop, 164);
  assert.equal(f.key("ArrowDown", {}), false);
  assert.equal(f.key("Tab"), false); assert.equal(f.key("Escape"), false);
  assert.equal(f.key("End"), true); assert.equal(f.el.scrollTop, 492);
  f.cleanup();
  assert.equal(f.listeners.size, 0); assert.equal(f.globalListeners.size, 0);
  assert.equal(f.attributes.has("data-snap-ready"), false);
});
