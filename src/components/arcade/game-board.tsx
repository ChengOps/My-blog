import Image from "next/image";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { commentAvatars, type AvatarId } from "@/lib/comment-model";
import { gameNames, goal, type Round } from "@/lib/arcade-engine";
import { MinesBoard } from "./mines-board";
import { MergeBoard } from "./merge-board";

type Props = { state: Round; elapsed: number; avatar: AvatarId; onChoose: (cell: number) => void; onStop: () => void };
export function GameBoard({ state, elapsed, avatar, onChoose, onStop }: Props) {
  const animal = commentAvatars.find((option) => option.id === avatar)!;
  const focus = useRef<HTMLHeadingElement>(null);
  useEffect(() => { focus.current?.focus({ preventScroll: true }); }, []);
  const mines = state.spec.game === "mines";
  const opened = state.revealed.filter(Boolean).length;
  const highest = Math.max(...state.board);
  function keyDown(event: KeyboardEvent<HTMLElement>) {
    if (mines || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
      || event.target instanceof Element && event.target.closest("input, textarea, [contenteditable]")) return;
    const keys = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"];
    const direction = keys.indexOf(event.key);
    if (direction >= 0) { event.preventDefault(); onChoose(direction); }
  }
  return <section className="arcade-game" aria-label={gameNames[state.spec.game]} onKeyDown={keyDown}>
    <div className="arcade-game-heading"><div><p className="eyebrow">{state.spec.mode === "levels" ? `第 ${state.spec.level} 关` : mines ? `无尽模式 · 第 ${state.round + 1} 盘` : "经典无尽"}</p>
      <h2 ref={focus} tabIndex={-1}>{gameNames[state.spec.game]}</h2></div><Image src={animal.src} alt={`由${animal.name}陪你玩`} width={56} height={56} /></div>
    <div className="arcade-stats"><span>{mines ? "安全区" : "得分"} <strong>{mines ? `${opened} / ${goal(state)} 格` : state.hits}</strong></span>
      <span>用时 <strong>{(elapsed / 1000).toFixed(1)} 秒</strong></span></div>
    <p className="arcade-instruction">{mines ? "揭开全部安全格即可过关。先从空白区域向外推理，拿不准的格子可以先插旗。" : "相同数字相遇就会合并，每个方块每步只合并一次。试着让最大的数字留在角落。"}</p>
    {mines ? <MinesBoard key={state.round} state={state} onChoose={onChoose} /> : <MergeBoard state={state} onChoose={onChoose} />}
    <p className="arcade-live" role="status" aria-live="polite">{mines ? state.clearedBoard ? "这一片已安全，下一盘马上开始。"
      : state.spec.mode === "endless" ? `累计揭开 ${state.hits} 格安全区，已完成 ${state.round} 盘。` : "不必赶时间，每一次判断都算数。"
      : `最高方块 ${highest} · 已移动 ${state.steps} 步。${highest >= 2048 ? "2048 达成！还可以继续向上合并。" : "慢慢合并，总会更进一步。"}`}</p>
    <button type="button" className="arcade-text-button" onClick={onStop}>{state.spec.mode === "endless" ? "收好这局" : "结束这局"}</button>
  </section>;
}
