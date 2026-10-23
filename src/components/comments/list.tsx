import Image from "next/image";
import { commentAvatars, type CommentEntry } from "@/lib/comment-model";

const dateFormat = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai" });
export function CommentList({ items, onReply }: { items: CommentEntry[]; onReply: (entry: CommentEntry) => void }) {
  return (
    <div className="comment-list">
      {items.map((entry) => {
        const avatar = commentAvatars.find((option) => option.id === entry.avatar)!;
        return (
          <article className="comment-item" key={entry.id}>
            <Image src={avatar.src} alt={`${avatar.name}头像`} width={40} height={40} className="comment-avatar" sizes="40px" />
            <div className="comment-item-content">
              <header className="comment-item-meta"><strong>{entry.nickname}</strong><span>{entry.isAuthor ? "作者" : "访客"}</span><time dateTime={entry.createdAt}>{dateFormat.format(new Date(entry.createdAt))}</time></header>
              {entry.replyTo && <p className="comment-reply-to">回复 {entry.replyTo}</p>}
              <p className="comment-text">{entry.body}</p>
              <button type="button" className="comment-reply-button" onClick={() => onReply(entry)} aria-label={`回复 ${entry.nickname}`}>回复</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
