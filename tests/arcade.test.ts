import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as engine from "../src/lib/arcade-engine.ts";
import { mineLayout, mineNeighbors, mineCount, MINE_CELLS } from "../src/lib/arcade-mines.ts";
import { shiftTiles, canMove } from "../src/lib/arcade-2048.ts";
import * as comments from "../src/lib/comment-model.ts";
import { clearMines } from "./arcade-helpers.ts";

function load(file: string, imports: Record<string, unknown>, env: Record<string, string> = {}, globals: Record<string, unknown> = {}) {
  const exports: Record<string, unknown> = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: (name: string) => { assert.ok(name in imports, name); return imports[name]; },
    process: { env }, Buffer, URL, Date, Response, Request, AbortSignal, ...globals });
  return exports;
}

const mines: engine.GameSpec = { game: "mines", mode: "levels", level: 1 };
const merge: engine.GameSpec = { game: "2048", mode: "endless", level: 1 };
test("all mine layouts are deterministic and protect the first cell and its eight neighbors", () => {
  for (let level = 1; level <= 5; level++) for (let seed = 0; seed < 10; seed++) for (const first of [0, 14, 35]) {
    const spec = { ...mines, level }, board = mineLayout(spec, seed, first);
    assert.deepEqual(board, mineLayout(spec, seed, first));
    assert.equal(board.filter((value) => value < 0).length, mineCount(spec));
    for (const cell of [first, ...mineNeighbors(first)]) assert.ok(board[cell] >= 0);
    board.forEach((value, cell) => {
      if (value >= 0) assert.equal(value, mineNeighbors(cell).filter((near) => board[near] < 0).length);
    });
  }
});
test("all five mine levels flood empty regions and clear only after every safe cell is revealed", () => {
  for (let level = 1; level <= 5; level++) {
    const spec = { ...mines, level }, { state, moves } = clearMines(spec, 42);
    assert.ok(state.done); assert.equal(state.hits, MINE_CELLS - mineCount(spec));
    assert.deepEqual(engine.replay(spec, 42, moves, state.lastAt), engine.result(state, state.lastAt));
    assert.throws(() => engine.replay(spec, 42, moves.slice(0, -1), state.lastAt));
    assert.equal(engine.play(state, { cell: 1, at: state.lastAt + 10 }), state);
  }
});
test("flags are reversible, limited, cannot be revealed, and neither flagging nor repeated clicks earns points", () => {
  let state = engine.createRound(mines, 42);
  state = engine.play(state, { cell: MINE_CELLS, at: 10 });
  assert.ok(state.flags[0]); assert.equal(state.hits, 0); assert.equal(state.armed, false);
  assert.equal(engine.play(state, { cell: 0, at: 20 }), state);
  for (let i = 1; i < mineCount(mines); i++) state = engine.play(state, { cell: MINE_CELLS + i, at: 20 + i });
  assert.equal(engine.play(state, { cell: MINE_CELLS + 9, at: 30 }), state);
  state = engine.play(state, { cell: MINE_CELLS, at: 40 });
  state = engine.play(state, { cell: 0, at: 50 });
  assert.ok(state.armed); assert.ok(!state.lost); assert.ok(state.hits > 0);
  assert.equal(engine.play(state, { cell: 0, at: 60 }), state);
});
test("mine hits end a run; endless boards accumulate safe cells and wait before resetting", () => {
  const spec: engine.GameSpec = { ...mines, mode: "endless" };
  const first = clearMines(spec, 42);
  assert.ok(!first.state.done);
  assert.equal(engine.advance(first.state, first.state.lastAt + engine.ROUND_MS - 1), first.state);
  const next = engine.advance(first.state, first.state.lastAt + engine.ROUND_MS);
  assert.equal(next.round, 1); assert.equal(next.hits, 30); assert.equal(next.armed, false);
  const second = clearMines(spec, 42, next, next.roundAt);
  assert.equal(second.state.hits, 60);
  const moves = [...first.moves, ...second.moves];
  assert.equal(engine.replay(spec, 42, moves, second.state.lastAt).score, 60);
  let hit = engine.play(engine.createRound(spec, 42), { cell: 0, at: 10 });
  hit = engine.play(hit, { cell: hit.board.indexOf(-1), at: 20 });
  assert.ok(hit.lost);
  assert.equal(engine.play(hit, { cell: 1, at: 30 }), hit);
  assert.ok(engine.advance(next, engine.deadline()).lost);
});
test("2048 merges once per tile per move, in all four directions, and scores the merged values", () => {
  const ids = Array.from({ length: 16 }, (_, i) => i + 1);
  const line = [2, 2, 2, 2, ...Array<number>(12).fill(0)];
  const left = shiftTiles(line, ids, 3);
  assert.deepEqual(left.board.slice(0, 4), [4, 4, 0, 0]); assert.equal(left.score, 8);
  assert.deepEqual(shiftTiles(line, ids, 1).board.slice(0, 4), [0, 0, 4, 4]);
  const mixed = [2, 2, 4, 0, ...Array<number>(12).fill(0)];
  assert.deepEqual(shiftTiles(mixed, ids, 3).board.slice(0, 4), [4, 4, 0, 0]);
  const column = [2, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0];
  assert.deepEqual([0, 4, 8, 12].map((i) => shiftTiles(column, ids, 0).board[i]), [4, 8, 0, 0]);
  assert.deepEqual([0, 4, 8, 12].map((i) => shiftTiles(column, ids, 2).board[i]), [0, 0, 4, 8]);
});
test("2048 starts with two tiles, ignores no-ops, spawns deterministically and never clears as a level", () => {
  let state = engine.createRound(merge, 42);
  assert.deepEqual(state, engine.createRound(merge, 42)); assert.equal(state.board.filter(Boolean).length, 2);
  const one = { ...state, board: [2, ...Array<number>(15).fill(0)] };
  assert.equal(engine.play(one, { cell: 3, at: 10 }), one);
  const moves: engine.Move[] = [];
  for (let i = 1; i <= 100 && !state.lost; i++) {
    const move = { cell: i % 4, at: i * 100 }, next = engine.play(state, move);
    if (next !== state) { moves.push(move); state = next; }
    assert.ok(!state.done); assert.equal(state.board.reduce((a, b) => a + b, 0) % 2, 0);
    assert.equal(new Set(state.ids.filter(Boolean)).size, state.board.filter(Boolean).length);
  }
  assert.ok(state.hits > 0);
  assert.deepEqual(engine.replay(merge, 42, moves, state.lastAt), engine.result(state, state.lastAt));
  const checker = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  assert.ok(!canMove(checker)); assert.ok(canMove([2, 2, ...checker.slice(2)]));
  const high = { ...one, board: [1024, 1024, ...Array<number>(14).fill(0)] };
  const reached = engine.play(high, { cell: 3, at: 10 });
  assert.ok(reached.board.includes(2048)); assert.equal(reached.hits, 2048); assert.ok(!reached.done);
  const almostFull = { ...state, lost: false, lastAt: 0,
    board: [2, 2, 8, 16, 8, 16, 32, 64, 16, 32, 64, 128, 32, 64, 128, 256] };
  const blocked = engine.play(almostFull, { cell: 3, at: 10 });
  assert.ok(blocked.lost); assert.ok(!canMove(blocked.board));
  assert.equal(engine.play(blocked, { cell: 0, at: 20 }), blocked);
});
test("replay rejects illegal moves, terminal input, old games and every 2048 level configuration", () => {
  for (const game of ["slide", "tower", "stars", "pairs"]) assert.equal(engine.isSpec({ ...mines, game }), false);
  for (let level = 1; level <= 5; level++) {
    assert.equal(engine.isSpec({ ...merge, mode: "levels", level }), false);
    assert.throws(() => engine.createRound({ ...merge, mode: "levels", level }, 42));
  }
  assert.throws(() => engine.replay(mines, 42, [{ cell: -1, at: 10 }], 10));
  assert.throws(() => engine.replay(merge, 42, [{ cell: 4, at: 10 }], 10));
  const { state, moves } = clearMines(mines, 42);
  assert.throws(() => engine.replay(mines, 42, [...moves, { cell: 0, at: state.lastAt + 10 }], state.lastAt + 10));
  assert.throws(() => engine.replay(mines, 42, moves, state.lastAt - 1));
  assert.equal(engine.isSpec({ ...merge, level: 2 }), false);
  assert.equal(engine.isSpec({ ...mines, mode: "endless", level: 2 }), false);
  assert.ok(engine.better({ ...merge, score: 100, elapsed: 200, cleared: false }, { ...merge, score: 80, elapsed: 100, cleared: false }));
});
test("new personal records preserve first clears and improvements while ignoring legacy records", () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  const records = load("lib/arcade-records.ts", { "./arcade-engine": engine, "./comment-model": comments }, {}, { localStorage: storage }) as { saveRecord: (result: engine.Result) => { first: boolean; improved: boolean; saved: boolean }; readRecords: () => Record<string, engine.Result> };
  const first: engine.Result = { ...mines, elapsed: 10000, score: 1, cleared: true };
  values.set("xavier-arcade-records-v3", JSON.stringify({ "mines:levels:1": first }));
  assert.equal(Object.keys(records.readRecords()).length, 0);
  assert.equal(records.saveRecord(first).first, true);
  assert.equal(records.saveRecord({ ...first, elapsed: 5000 }).improved, true);
  assert.equal(records.saveRecord({ ...first, elapsed: 8000 }).improved, false);
  assert.equal(records.readRecords()[engine.recordKey(first)].elapsed, 5000);
  assert.equal(records.saveRecord({ ...first, level: 2, cleared: false }).first, false);
  values.clear(); storage.setItem = () => { throw new Error("storage denied"); };
  assert.equal(records.saveRecord(first).saved, false);
});
