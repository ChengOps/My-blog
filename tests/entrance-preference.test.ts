import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { ENTRANCE_STORAGE_KEY, ENTRANCE_REMEMBER_MS } from "../src/lib/entrance-preference.ts";

const now = Date.UTC(2026, 9, 22);
const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
const script = layout.match(/const entranceScript = `([^`]+)`/)?.[1];
assert.ok(script);
const bootScript = vm.runInNewContext(`\`${script}\``, { ENTRANCE_STORAGE_KEY, ENTRANCE_REMEMBER_MS }) as string;
type Visit = { until?: string; session?: boolean; pathname?: string; hash?: string; search?: string; denyLocal?: boolean; denySession?: boolean };

function visit({ until, session = false, pathname = "/", hash = "", search = "", denyLocal = false, denySession = false }: Visit = {}) {
  const root = { dataset: {} as Record<string, string> };
  vm.runInNewContext(bootScript, {
    document: { documentElement: root }, location: { pathname, hash, search }, URLSearchParams,
    Date: { now: () => now },
    localStorage: { getItem: () => { if (denyLocal) throw Error("storage denied"); return until ?? null; } },
    sessionStorage: {
      getItem: () => { if (denySession) throw Error("storage denied"); return session ? "entered" : null; },
      setItem: () => { if (denySession) throw Error("storage denied"); },
    },
  });
  return root.dataset.homeEntry;
}

test("entrance preference skips returning visits until the seven-day expiry", () => {
  assert.equal(visit(), "pending");
  assert.equal(visit({ until: String(now + ENTRANCE_REMEMBER_MS) }), "entered");
  assert.equal(visit({ until: String(now + 1) }), "entered");
  assert.equal(visit({ until: String(now), session: true }), "pending");
  assert.equal(visit({ until: String(now - 1), session: true }), "pending");
  for (const until of ["invalid", "Infinity", "", "0", String(now + ENTRANCE_REMEMBER_MS + 1)]) {
    assert.equal(visit({ until }), "pending");
  }
});

test("replay bypasses a valid preference while deep links remain accessible", () => {
  const until = String(now + ENTRANCE_REMEMBER_MS);
  assert.equal(visit({ until, session: true, search: "?intro=1" }), "pending");
  assert.equal(visit({ until, search: "?intro=0" }), "entered");
  assert.equal(visit({ pathname: "/posts/build-a-quiet-web", search: "?intro=1" }), "entered");
  assert.equal(visit({ hash: "#main-content" }), "entered");
});

test("blocked storage falls back safely and completing entry records expiry", () => {
  assert.equal(visit({ denyLocal: true, session: true }), "entered");
  assert.equal(visit({ denyLocal: true, denySession: true }), "pending");
  assert.equal(visit({ denySession: true, until: String(now + 1) }), "entered");
  const persistent = new Map<string, string>(), temporary = new Map<string, string>();
  const exports: { rememberEntrance?: () => void } = {};
  const source = readFileSync(new URL("../src/lib/entrance-preference.ts", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, Date: { now: () => now },
    localStorage: { setItem: (key: string, value: string) => persistent.set(key, value) },
    sessionStorage: { setItem: (key: string, value: string) => temporary.set(key, value) },
  });
  assert.ok(exports.rememberEntrance);
  exports.rememberEntrance();
  assert.equal(persistent.get(ENTRANCE_STORAGE_KEY), String(now + ENTRANCE_REMEMBER_MS));
  assert.equal(temporary.get("hush-entry"), "entered");
});
