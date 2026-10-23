import type { GameSpec, Move, Round } from "./arcade-engine.ts";
import { randomStep } from "./arcade-random.ts";

export const MINE_SIDE = 6;
export const MINE_CELLS = MINE_SIDE * MINE_SIDE;
export function mineCount(spec: GameSpec) { return spec.mode === "levels" ? [4, 5, 6, 7, 8][spec.level - 1] : 6; }
export function mineNeighbors(cell: number) {
  const row = Math.floor(cell / MINE_SIDE), col = cell % MINE_SIDE;
  const cells: number[] = [];
  for (let y = Math.max(0, row - 1); y <= Math.min(MINE_SIDE - 1, row + 1); y++) {
    for (let x = Math.max(0, col - 1); x <= Math.min(MINE_SIDE - 1, col + 1); x++) {
      if (y * MINE_SIDE + x !== cell) cells.push(y * MINE_SIDE + x);
    }
  }
  return cells;
}
export function mineLayout(spec: GameSpec, seed: number, first: number, round = 0) {
  const safe = new Set([first, ...mineNeighbors(first)]);
  const candidates = Array.from({ length: MINE_CELLS }, (_, i) => i).filter((cell) => !safe.has(cell));
  let rng = randomStep((seed + Math.imul(round, 0x9e3779b9)) >>> 0);
  for (let i = candidates.length - 1; i > 0; i--) {
    rng = randomStep(rng); const j = rng % (i + 1);
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const board = Array<number>(MINE_CELLS).fill(0);
  candidates.slice(0, mineCount(spec)).forEach((cell) => { board[cell] = -1; });
  return board.map((value, cell) => value === -1 ? -1 : mineNeighbors(cell).filter((near) => board[near] === -1).length);
}
export function playMines(state: Round, move: Move): Round {
  if (state.clearedBoard || move.cell < 0 || move.cell >= 2 * MINE_CELLS) return state;
  const cell = move.cell % MINE_CELLS;
  if (state.revealed[cell]) return state;
  if (move.cell >= MINE_CELLS) {
    const flags = [...state.flags];
    if (!flags[cell] && flags.filter(Boolean).length >= mineCount(state.spec)) return state;
    flags[cell] = !flags[cell];
    return { ...state, flags, lastAt: move.at, steps: state.steps + 1 };
  }
  if (state.flags[cell]) return state;
  const board = state.armed ? state.board : mineLayout(state.spec, state.seed, cell, state.round);
  const revealed = [...state.revealed];
  if (board[cell] === -1) {
    revealed[cell] = true;
    return { ...state, board, revealed, armed: true, lost: true, lastAt: move.at };
  }
  const queue = [cell];
  let opened = 0;
  while (queue.length) {
    const next = queue.pop()!;
    if (revealed[next] || state.flags[next] || board[next] === -1) continue;
    revealed[next] = true; opened++;
    if (board[next] === 0) queue.push(...mineNeighbors(next));
  }
  const clearedBoard = revealed.filter(Boolean).length === MINE_CELLS - mineCount(state.spec);
  return { ...state, board, revealed, armed: true, hits: state.hits + opened, steps: state.steps + 1,
    lastAt: move.at, clearedBoard, done: clearedBoard && state.spec.mode === "levels" };
}
