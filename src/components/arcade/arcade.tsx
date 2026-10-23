"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gameNames, recordKey, type Game, type GameSpec, type Result } from "@/lib/arcade-engine";
import { commentAvatars, isAvatar, isRecord, type AvatarId } from "@/lib/comment-model";
import { readRecords, saveRecord } from "@/lib/arcade-records";
import { useGame, type GameRun } from "./use-game";
import { GameBoard } from "./game-board";
import { GameResult } from "./game-result";
import { LocalRecord } from "./local-record";
import { useClickSparks } from "./click-sparks";

export function Arcade() {
  const [spec, setSpec] = useState<GameSpec>({ game: "mines", mode: "levels", level: 1 });
  const [identity, setIdentity] = useState<{ nickname: string; avatar: AvatarId }>({ nickname: "路过的朋友", avatar: "cat" });
  const [records, setRecords] = useState<Record<string, Result>>({});
  const [run, setRun] = useState<GameRun | null>(null);
  const [reward, setReward] = useState({ first: false, improved: false, saved: true });
  const [hydrated, setHydrated] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const previousPhase = useRef("lobby");
  const spark = useClickSparks();
  const game = useGame((finished) => {
    const feedback = saveRecord(finished.outcome, records);
    setReward(feedback); setRun(finished);
    setRecords(feedback.records);
  });

  useEffect(() => {
    setRecords(readRecords());
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("xavier-arcade-identity") ?? localStorage.getItem("xavier-comment-identity") ?? "null");
      if (isRecord(saved) && typeof saved.nickname === "string" && saved.nickname.trim() && saved.nickname.length <= 24 && isAvatar(saved.avatar)) {
        setIdentity({ nickname: saved.nickname, avatar: saved.avatar });
      }
    } catch { /* Play remains available without local preferences. */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("xavier-arcade-identity", JSON.stringify(identity)); } catch { /* Saving identity is optional. */ }
  }, [identity, hydrated]);

  function start(next = spec) {
    if (!identity.nickname.trim() || /[\p{Cc}\p{Cf}]/u.test(identity.nickname)) return;
    setRun(null); setSpec(next); void game.start(next);
  }
  const playing = !!game.state && !run && !game.starting;
  const phase = run ? "result" : playing ? "game" : "lobby";
  useLayoutEffect(() => {
    if (previousPhase.current === phase) return;
    previousPhase.current = phase;
    stage.current?.scrollIntoView({ block: "start", behavior: "instant" });
    if (phase === "lobby") stage.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
  }, [phase]);
  const selected = commentAvatars.find((animal) => animal.id === identity.avatar)!;

  return <div className="arcade" onClick={spark}>
    <header className="arcade-heading"><div><p className="eyebrow">你找到了一点小小的玩心</p><h1>嘘，休息一局。</h1>
      <p>七位老朋友，两场小冒险。这里没有难关，只有刚刚好的小成就。</p></div><span className="arcade-heading-mark" aria-hidden="true">✧</span></header>
    <div className="arcade-layout"><div className="arcade-stage" ref={stage}>
      {run ? <GameResult key={`${run.seed}-${run.outcome.elapsed}`} run={run} {...identity} {...reward}
        onAgain={() => start()} onNext={() => start({ ...spec, level: spec.level + 1 })}
        onBack={() => { game.reset(); setRun(null); }} />
        : playing ? <GameBoard state={game.state!} elapsed={game.elapsed} avatar={identity.avatar} onChoose={game.choose} onStop={game.stop} />
          : <div className="arcade-lobby">
            <div className="arcade-game-picker" aria-label="选择小游戏">{(["mines", "2048"] as Game[]).map((id) => <button type="button" key={id}
              className="arcade-game-option" aria-pressed={spec.game === id} disabled={game.starting} onClick={() => setSpec({ game: id, mode: id === "2048" ? "endless" : "levels", level: 1 })}>
              <span className="arcade-game-symbol" aria-hidden="true">{id === "mines" ? "✳" : "▦"}</span><strong>{gameNames[id]}</strong>
              <span>{id === "mines" ? "数字藏着线索，慢慢找出安全区" : "相同数字相遇，让小小的 2 长大"}</span></button>)}</div>
            {spec.game === "mines" && <fieldset className="arcade-mode"><legend>今天想怎么玩</legend>{(["levels", "endless"] as const).map((mode) => <label key={mode}>
              <input type="radio" name="arcade-mode" checked={spec.mode === mode} disabled={game.starting} onChange={() => setSpec({ ...spec, mode, level: 1 })} />
              <span>{mode === "levels" ? "关卡模式" : "无尽模式"}</span></label>)}</fieldset>}
            {spec.mode === "levels" ? <div className="arcade-levels" aria-label="选择关卡">{[1, 2, 3, 4, 5].map((level) => {
              const cleared = records[recordKey({ ...spec, level })]?.cleared;
              return <button type="button" key={level} aria-pressed={spec.level === level} disabled={game.starting} onClick={() => setSpec({ ...spec, level })}>
                <span>{String(level).padStart(2, "0")}</span><small>{cleared ? "已通关 ✓" : level === 1 ? "轻松开始" : "慢慢进阶"}</small></button>;
            })}</div> : <p className="arcade-endless-note">{spec.game === "mines" ? "6×6 棋盘，每盘 6 颗雷。清空安全区后续上新盘，累计安全格越多，排名越靠前；触雷时结算。" : "经典 4×4，只设无尽模式。按合并得分排名，合成 2048 后仍可继续，直到无路可走。"}可随时收好这局，单局最多 30 分钟。</p>}
            <div className="arcade-identity"><Image src={selected.src} alt={selected.name} width={56} height={56} /><label>这局怎么称呼你<input value={identity.nickname} maxLength={24} disabled={game.starting}
              onChange={(event) => setIdentity({ ...identity, nickname: event.target.value })} autoComplete="nickname" /></label></div>
            <fieldset className="arcade-animals"><legend>选一位老朋友陪你</legend><div>{commentAvatars.map((animal) => <label key={animal.id}>
              <input type="radio" name="arcade-avatar" checked={identity.avatar === animal.id} disabled={game.starting} onChange={() => setIdentity({ ...identity, avatar: animal.id })} />
              <span><Image src={animal.src} alt="" width={48} height={48} /><span>{animal.name}</span></span></label>)}</div></fieldset>
            <div className="arcade-start-row"><button type="button" className="arcade-primary" disabled={game.starting || !identity.nickname.trim() || /[\p{Cc}\p{Cf}]/u.test(identity.nickname)} onClick={() => start()}>{game.starting ? "小伙伴正在准备…" : "开始这局 →"}</button><span>{spec.game === "mines" ? "难度：简单" : "经典规则"} · 支持触屏与键盘</span></div>
          </div>}
      <p className="arcade-service-note" role="status">{game.notice}</p>
    </div><LocalRecord spec={spec} personal={records[recordKey(spec)]} avatar={identity.avatar} /></div>
    <p className="arcade-footnote">累了就回到阅读里。小屋一直在这里。 <Link href="/">返回首页 →</Link></p>
  </div>;
}
