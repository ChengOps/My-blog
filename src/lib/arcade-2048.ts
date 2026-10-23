import { randomStep } from "./arcade-random.ts";
import type { Move, Round } from "./arcade-engine.ts";

export type TileBoard = { board: number[]; ids: number[]; nextId: number; rng: number };
export function spawnTile(state: TileBoard): TileBoard {
  const empty = state.board.flatMap((value, cell) => value === 0 ? [cell] : []);
  if (!empty.length) return state;
  const position = randomStep(state.rng), rng = randomStep(position);
  const cell = empty[position % empty.length];
  const board = [...state.board], ids = [...state.ids];
  board[cell] = rng / 0x100000000 < 0.9 ? 2 : 4;
  ids[cell] = state.nextId;
  return { board, ids, rng, nextId: state.nextId + 1 };
}
// Directions: up, right, down, left. Read each lane from its destination edge.
export function shiftTiles(board: number[], ids: number[], direction: number) {
  const next = Array<number>(16).fill(0), nextIds = Array<number>(16).fill(0);
  let score = 0;
  for (let lane = 0; lane < 4; lane++) {
    const cells = Array.from({ length: 4 }, (_, step) => direction === 0 ? step * 4 + lane
      : direction === 1 ? lane * 4 + 3 - step : direction === 2 ? (3 - step) * 4 + lane : lane * 4 + step);
    const filled = cells.filter((cell) => board[cell]);
    let target = 0;
    for (let i = 0; i < filled.length; i++) {
      const cell = filled[i];
      let value = board[cell];
      if (i + 1 < filled.length && value === board[filled[i + 1]]) { value *= 2; score += value; i++; }
      next[cells[target]] = value; nextIds[cells[target]] = ids[cell]; target++;
    }
  }
  return { board: next, ids: nextIds, score, changed: next.some((value, i) => value !== board[i]) };
}
export function canMove(board: number[]) {
  return board.some((value, i) => value === 0 || i % 4 < 3 && value === board[i + 1] || i < 12 && value === board[i + 4]);
}
export function play2048(state: Round, move: Move): Round {
  if (move.cell < 0 || move.cell > 3) return state;
  const shifted = shiftTiles(state.board, state.ids, move.cell);
  if (!shifted.changed) return state;
  const spawned = spawnTile({ ...state, ...shifted });
  return { ...state, ...spawned, hits: state.hits + shifted.score, steps: state.steps + 1,
    lastAt: move.at, lost: !canMove(spawned.board) };
}
