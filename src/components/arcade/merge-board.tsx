import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { commentAvatars } from "@/lib/comment-model";
import type { Round } from "@/lib/arcade-engine";

const directions = ["向上", "向右", "向下", "向左"];
export function MergeBoard({ state, onChoose }: { state: Round; onChoose: (cell: number) => void }) {
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  return <>
    <div className="merge-board" role="group" aria-label="2048 棋盘，方向键或滑动合并相同数字" tabIndex={0}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerCancel={() => { pointer.current = null; }} onPointerUp={(event) => {
        const start = pointer.current; pointer.current = null;
        if (!start || start.id !== event.pointerId) return;
        const x = event.clientX - start.x, y = event.clientY - start.y;
        if (Math.max(Math.abs(x), Math.abs(y)) < 24) return;
        onChoose(Math.abs(x) > Math.abs(y) ? x > 0 ? 1 : 3 : y > 0 ? 2 : 0);
      }}>
      <div className="merge-slots" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} />)}</div>
      {state.board.map((value, cell) => {
        if (!value) return null;
        const animal = commentAvatars[(Math.log2(value) - 1) % commentAvatars.length];
        return <span key={state.ids[cell]} className="merge-piece" style={{ "--tile-col": cell % 4, "--tile-row": Math.floor(cell / 4) } as CSSProperties}>
          <span key={value} className="merge-tile" data-large={value >= 1024} aria-label={`第 ${Math.floor(cell / 4) + 1} 行第 ${cell % 4 + 1} 列：${value}`}>
            <Image src={animal.src} alt="" width={32} height={32} /><strong>{value}</strong>
          </span></span>;
      })}
    </div>
    <div className="merge-controls" aria-label="移动方向">{directions.map((label, i) => <button type="button" key={label} className="arcade-secondary" aria-label={label} onClick={() => onChoose(i)}>{["↑", "→", "↓", "←"][i]}</button>)}</div>
    <p className="arcade-caption">方向键、棋盘内滑动或下方箭头均可操作。合成 2048 后可以继续；无效移动不生成新方块。</p>
  </>;
}
