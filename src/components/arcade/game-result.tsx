import Image from "next/image";
import { useEffect, useRef } from "react";
import { formatTime, scoreUnits } from "@/lib/arcade-engine";
import { commentAvatars, type AvatarId } from "@/lib/comment-model";
import type { GameRun } from "./use-game";

type Props = { run: GameRun; avatar: AvatarId; nickname: string; first: boolean; improved: boolean; saved: boolean;
  onAgain: () => void; onNext: () => void; onBack: () => void };

export function GameResult({ run, avatar, nickname, first, improved, saved, onAgain, onNext, onBack }: Props) {
  const focus = useRef<HTMLHeadingElement>(null);
  useEffect(() => { focus.current?.focus({ preventScroll: true }); }, []);
  const outcome = run.outcome;
  const animal = commentAvatars.find((option) => option.id === avatar)!;
  const title = first ? outcome.mode === "levels" ? "第一次通关，收下这枚小印章。" : "第一条纪录，已经闪闪发亮。"
    : improved ? "比上一次的自己，更进一步。" : outcome.cleared ? "这一关，轻轻松松。" : "休息一下，也很棒。";

  return <section className="arcade-result" aria-label="这一局的收获">
    <div className="arcade-celebration" data-celebrate={first || improved}>
      <Image src={animal.src} alt={animal.name} width={92} height={92} />
      {(first || improved) && <span className="arcade-stamp">{improved ? "新纪录" : "初见成就"}</span>}
      <span className="arcade-orbit" aria-hidden="true">✦</span><span className="arcade-orbit" aria-hidden="true">✧</span>
    </div>
    <p className="eyebrow">{outcome.mode === "levels" ? `第 ${outcome.level} 关 · ${outcome.cleared ? "已完成" : "下次继续"}` : "无尽模式 · 本局已收好"}</p>
    <h2 ref={focus} tabIndex={-1}>{title}</h2>
    <p className="arcade-result-score">{outcome.mode === "levels" ? formatTime(outcome.elapsed) : `${outcome.score} ${scoreUnits[outcome.game]}`}</p>
    <p className="muted">{improved ? "新的个人最佳，值得好好记住。" : first ? "每个小小的开始，都值得被庆祝。" : "没有失败惩罚，想玩的时候再来。"}</p>
    <p className="muted">{nickname}，这一局的成绩已经记在这台设备上。</p>
    {!saved && <p role="status">浏览器未允许本机存储，刷新后纪录可能丢失。</p>}
    <div className="arcade-actions"><button type="button" className="arcade-primary" onClick={outcome.cleared && outcome.level < 5 ? onNext : onAgain}>{outcome.cleared && outcome.level < 5 ? "下一关" : "再玩一局"}</button>
      <button type="button" className="arcade-secondary" onClick={onBack}>回到小屋</button></div>
  </section>;
}
