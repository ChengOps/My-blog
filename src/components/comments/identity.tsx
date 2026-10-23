import Image from "next/image";
import { commentAvatars, type AvatarId } from "@/lib/comment-model";

export type VisitorIdentity = { nickname: string; avatar: AvatarId; remember: boolean };
type Props = { id: string; value: VisitorIdentity; onChange: (value: VisitorIdentity) => void };

export function CommentIdentity({ id, value, onChange }: Props) {
  return (
    <div className="comment-identity">
      <label className="comment-name" htmlFor={id}>
        <span>你的昵称</span>
        <input id={id} name="nickname" value={value.nickname} required maxLength={24} autoComplete="nickname"
          placeholder="怎么称呼你？" onChange={(event) => onChange({ ...value, nickname: event.target.value })} />
      </label>
      <fieldset className="comment-avatar-picker">
        <legend>选一个头像</legend>
        <div className="comment-avatar-options">
          {commentAvatars.map((avatar) => (
            <label className="comment-avatar-option" key={avatar.id}>
              <input type="radio" name={`${id}-avatar`} value={avatar.id} checked={value.avatar === avatar.id}
                onChange={() => onChange({ ...value, avatar: avatar.id })} />
              <Image src={avatar.src} alt="" width={48} height={48} className="comment-avatar" sizes="48px" />
              <span>{avatar.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="comment-remember">
        <input type="checkbox" checked={value.remember} onChange={(event) => onChange({ ...value, remember: event.target.checked })} />
        <span className="comment-remember-box" aria-hidden="true"><span className="comment-remember-tick" /></span>
        <span>在此设备记住昵称和头像</span>
      </label>
    </div>
  );
}
