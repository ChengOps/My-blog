import { createRound, play, type GameSpec, type Move, type Round } from "../src/lib/arcade-engine.ts";

export function clearMines(spec: GameSpec, seed: number, initial?: Round, offset = 0) {
  let state = initial ?? createRound(spec, seed);
  const moves: Move[] = [];
  const apply = (cell: number) => {
    const move = { cell, at: offset + (moves.length + 1) * 15 };
    moves.push(move); state = play(state, move);
  };
  apply(0);
  while (!state.clearedBoard) {
    const cell = state.board.findIndex((value, i) => value >= 0 && !state.revealed[i]);
    if (cell < 0) throw new Error("Safe cell missing");
    apply(cell);
  }
  return { state, moves };
}
