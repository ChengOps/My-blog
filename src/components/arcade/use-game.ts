"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { advance, createRound, deadline, play, result, type GameSpec, type Move, type Result, type Round } from "@/lib/arcade-engine";

/** 一局的结算结果。成绩只写本机，不涉及任何网络请求。 */
export type GameRun = { outcome: Result; seed: number };

export function useGame(onFinish: (run: GameRun) => void) {
  const [state, setState] = useState<Round | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState("");
  const live = useRef<Round | null>(null);
  const clock = useRef(0);
  const moves = useRef<Move[]>([]);
  const done = useRef(true);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  const finish = useCallback((at: number) => {
    if (done.current || !live.current) return;
    done.current = true;
    finishRef.current({ outcome: result(live.current, at), seed: live.current.seed });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (done.current || !live.current) return;
      const at = Math.round(performance.now() - clock.current);
      setElapsed(at);
      const next = advance(live.current, at);
      if (next !== live.current) { live.current = next; setState(next); }
      if (next.lost || at >= deadline()) finish(at);
    }, 100);
    return () => clearInterval(timer);
  }, [finish]);

  async function start(spec: GameSpec) {
    done.current = true;
    setStarting(true);
    setNotice("");
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const initial = createRound(spec, seed);
    live.current = initial;
    moves.current = [];
    clock.current = performance.now();
    done.current = false;
    setElapsed(0);
    setState(initial);
    setStarting(false);
  }

  const choose = useCallback((cell: number) => {
    if (!live.current || done.current) return;
    const move = { cell, at: Math.max(1, Math.round(performance.now() - clock.current)) };
    const current = advance(live.current, move.at);
    if (current !== live.current) { live.current = current; setState(current); }
    if (current.lost) { finish(move.at); return; }
    const next = play(current, move);
    if (next === current || next.lastAt !== move.at) return;
    moves.current.push(move); live.current = next; setState(next); setElapsed(move.at);
    if (next.done || next.lost || moves.current.length >= 3998) finish(move.at);
  }, [finish]);

  function stop() { if (live.current) finish(Math.max(1, Math.round(performance.now() - clock.current))); }
  function reset() { done.current = true; live.current = null; setState(null); }
  return { state, elapsed, starting, notice, start, choose, stop, reset };
}
