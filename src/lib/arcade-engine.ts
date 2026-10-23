import { MINE_CELLS, mineCount, playMines } from "./arcade-mines.ts";
import { play2048, spawnTile } from "./arcade-2048.ts";

export type Game = "mines" | "2048";
export type Mode = "levels" | "endless";
export type GameSpec = { game: Game; mode: Mode; level: number };
export type Move = { cell: number; at: number };
export type Round = {
  spec: GameSpec; seed: number; board: number[]; revealed: boolean[]; flags: boolean[]; armed: boolean;
  ids: number[]; nextId: number; rng: number; hits: number; round: number; steps: number;
  lastAt: number; roundAt: number; clearedBoard: boolean; done: boolean; lost: boolean;
};
export type Result = GameSpec & { score: number; elapsed: number; cleared: boolean };
export const RULESET = 4;
export const gameNames = { mines: "扫雷", "2048": "2048" };
export const scoreUnits = { mines: "格安全区", "2048": "分" };
export const ROUND_MS = 600;
export const MAX_RUN_MS = 1800000;
export function goal(state: Round) { return MINE_CELLS - mineCount(state.spec); }
export function deadline() { return MAX_RUN_MS; }
export function createRound(spec: GameSpec, seed: number): Round {
  if (!isSpec(spec)) throw new Error("请选择有效的游戏和关卡。");
  const size = spec.game === "mines" ? MINE_CELLS : 16;
  const initial: Round = { spec, seed, board: Array<number>(size).fill(0),
    revealed: Array<boolean>(size).fill(false), flags: Array<boolean>(size).fill(false), armed: false,
    ids: Array<number>(size).fill(0), nextId: 1, rng: seed >>> 0, hits: 0, round: 0, steps: 0,
    lastAt: 0, roundAt: 0, clearedBoard: false, done: false, lost: false };
  return spec.game === "2048" ? { ...initial, ...spawnTile(spawnTile(initial)) } : initial;
}
export function advance(state: Round, at: number): Round {
  if (state.done || state.lost) return state;
  if (at >= MAX_RUN_MS) return { ...state, lost: true, lastAt: MAX_RUN_MS };
  if (state.clearedBoard && state.spec.mode === "endless" && at >= state.lastAt + ROUND_MS) {
    return { ...createRound(state.spec, state.seed), round: state.round + 1, hits: state.hits, steps: state.steps,
      lastAt: state.lastAt, roundAt: state.lastAt + ROUND_MS };
  }
  return state;
}
export function play(state: Round, move: Move): Round {
  if (!Number.isInteger(move.cell) || !Number.isInteger(move.at) || move.at < 1 || move.at < state.lastAt || move.at >= MAX_RUN_MS) return state;
  const current = advance(state, move.at);
  if (current.done || current.lost) return current;
  return current.spec.game === "mines" ? playMines(current, move) : play2048(current, move);
}
export function result(state: Round, elapsed: number): Result {
  const current = advance(state, elapsed);
  return { ...current.spec, score: current.hits, elapsed: current.done || current.lost ? current.lastAt : Math.min(elapsed, MAX_RUN_MS), cleared: current.done };
}
export function replay(spec: GameSpec, seed: number, moves: Move[], elapsed: number): Result {
  if (!isSpec(spec) || !Number.isInteger(elapsed) || elapsed < 1 || elapsed > MAX_RUN_MS || moves.length > 4000) throw new Error("这一局的记录无效。");
  let state = createRound(spec, seed);
  let previous = 0;
  for (const move of moves) {
    if (!Number.isInteger(move.cell) || !Number.isInteger(move.at) || move.at < 1 || move.at < previous || move.at > elapsed) throw new Error("操作顺序无效。");
    const before = advance(state, move.at);
    const next = play(before, move);
    if (next === before || next.lastAt !== move.at) throw new Error("操作记录无效。");
    state = next; previous = move.at;
  }
  const outcome = result(state, elapsed);
  if (outcome.score < 1 || spec.mode === "levels" && !outcome.cleared) throw new Error("完成有效的一局后才能提交成绩。");
  return outcome;
}
export function isSpec(value: unknown): value is GameSpec {
  if (typeof value !== "object" || value === null) return false;
  const spec = value as Record<string, unknown>;
  if (spec.game === "2048") return spec.mode === "endless" && spec.level === 1;
  return spec.game === "mines" && (spec.mode === "levels" || spec.mode === "endless")
    && Number.isInteger(spec.level) && Number(spec.level) >= 1 && Number(spec.level) <= 5 && (spec.mode !== "endless" || spec.level === 1);
}
export function better(a: Result, b: Result) { return a.mode === "levels" ? a.elapsed < b.elapsed : a.score > b.score || a.score === b.score && a.elapsed < b.elapsed; }
export function recordKey(spec: GameSpec) { return `${spec.game}:${spec.mode}:${spec.level}`; }
export function formatTime(ms: number) { return `${(ms / 1000).toFixed(2)} 秒`; }
