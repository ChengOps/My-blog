import Image from "next/image";
import { formatTime, scoreUnits, type GameSpec, type Result } from "@/lib/arcade-engine";
import { commentAvatars } from "@/lib/comment-model";

/**
 * 本机纪录面板。
 *
 * 这里原本是联网排行榜。线上榜已被移除：成绩只存在这台设备的 localStorage 里，
 * 不上传、不公开、不需要任何服务端。
 */
export function LocalRecord({ spec, personal, avatar }: { spec: GameSpec; personal?: Result; avatar?: string }) {
  const animal = commentAvatars.find((option) => option.id === avatar);
  const label = spec.mode === "levels"
    ? `第 ${spec.level} 关 · 通关越快越好`
    : `${spec.game === "mines" ? "累计安全格" : "合并得分"}越多越好`;

  return <aside className="arcade-ranking" aria-label="本机纪录">
    <div className="arcade-ranking-heading"><h2>本机纪录</h2><span className="arcade-caption">只存这台设备</span></div>
    <p className="arcade-caption">{label}</p>
    <div className="arcade-personal">
      {animal && <Image src={animal.src} alt="" width={28} height={28} />}
      <span>本机最佳</span>
      <strong>{personal ? (spec.mode === "levels" ? formatTime(personal.elapsed) : `${personal.score} ${scoreUnits[spec.game]}`) : "等你留下第一笔"}</strong>
    </div>
    <p className="arcade-caption">{personal ? "打破它，只在这台设备上更新。" : "开一局，就会在这里留下第一条纪录。"}</p>
    <p className="arcade-caption">换设备、换浏览器或清理站点数据后，纪录不会同步过来。</p>
  </aside>;
}
