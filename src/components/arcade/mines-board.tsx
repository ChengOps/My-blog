import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { commentAvatars } from "@/lib/comment-model";
import { MINE_CELLS, MINE_SIDE, mineCount } from "@/lib/arcade-mines";
import type { Round } from "@/lib/arcade-engine";

export function MinesBoard({ state, onChoose }: { state: Round; onChoose: (cell: number) => void }) {
  const [flagging, setFlagging] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.round > 0 && document.activeElement === document.body) grid.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [state.round]);
  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLButtonElement) || event.ctrlKey || event.metaKey || event.altKey) return;
    const cell = Number(event.target.dataset.cell);
    if (!Number.isInteger(cell)) return;
    if (event.key.toLowerCase() === "f") { event.preventDefault(); onChoose(cell + MINE_CELLS); return; }
    const offsets: Record<string, number> = { ArrowUp: -MINE_SIDE, ArrowDown: MINE_SIDE, ArrowLeft: -1, ArrowRight: 1 };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const next = cell + offsets[event.key];
    if (next < 0 || next >= MINE_CELLS || Math.abs(next % MINE_SIDE - cell % MINE_SIDE) > 1) return;
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-cell="${next}"]`)?.focus();
  }
  return <>
    <div className="mines-tools"><span>地雷 {mineCount(state.spec)} · 已插旗 {state.flags.filter(Boolean).length}</span>
      <button type="button" className="arcade-secondary" aria-pressed={flagging} onClick={() => setFlagging(!flagging)}>{flagging ? "插旗中 · 切回揭开" : "揭开中 · 切换插旗"}</button></div>
    <div ref={grid} className="mines-board" role="group" aria-label="6 行 6 列扫雷棋盘，方向键移动，回车揭开，F 插旗" onKeyDown={keyDown}>
      {state.board.map((value, cell) => {
        const open = state.revealed[cell], flag = state.flags[cell];
        const animal = commentAvatars[cell % commentAvatars.length];
        const label = open ? value === 0 ? "空白" : value < 0 ? "地雷" : `周围 ${value} 颗雷` : flag ? "已插旗" : "未揭开";
        return <button type="button" key={cell} className="mine-cell" data-cell={cell} data-open={open} data-flag={flag}
          aria-label={`第 ${Math.floor(cell / MINE_SIDE) + 1} 行第 ${cell % MINE_SIDE + 1} 列，${label}`}
          aria-disabled={open || state.clearedBoard || undefined} onClick={() => onChoose(cell + (flagging ? MINE_CELLS : 0))}
          onContextMenu={(event) => { event.preventDefault(); onChoose(cell + MINE_CELLS); }}>
          {open ? <span key={`open-${state.round}`}>{value > 0 ? value : value < 0 ? "✳" : "·"}</span>
            : flag ? <Image src={animal.src} alt="" width={28} height={28} /> : <span aria-hidden="true">＋</span>}
        </button>;
      })}
    </div>
    <p className="arcade-caption">首击与周围一圈始终安全。数字表示相邻八格中的雷数；右键或 F 也能插旗。</p>
  </>;
}
