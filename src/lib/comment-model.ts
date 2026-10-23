export const commentAvatars = [
  { id: "cat", name: "夜猫", src: "/avatars/cat.webp" },
  { id: "rabbit", name: "月兔", src: "/avatars/rabbit.webp" },
  { id: "fox", name: "小狐", src: "/avatars/fox.webp" },
  { id: "bird", name: "书鸟", src: "/avatars/bird.webp" },
  { id: "bear", name: "小熊", src: "/avatars/bear.webp" },
  { id: "deer", name: "林鹿", src: "/avatars/deer.webp" },
  { id: "penguin", name: "企鹅", src: "/avatars/penguin.webp" },
] as const;
export type AvatarId = typeof commentAvatars[number]["id"];
export type CommentEntry = {
  id: string; nickname: string; avatar: AvatarId; body: string;
  createdAt: string; parentId: string | null; replyTo: string | null; isAuthor: boolean;
};
export type CommentDraft = { thread: string; nickname: string; avatar: AvatarId; body: string; parentId: string | null };
export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
export const isAvatar = (value: unknown): value is AvatarId => commentAvatars.some((avatar) => avatar.id === value);
export const isThread = (value: unknown): value is string => typeof value === "string" && value.length <= 160 && /^\/(?:guestbook|posts\/[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(value);
export const isId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const unsafeName = /[\p{Cc}\p{Cf}]/u;

export function parseCommentDraft(value: unknown): CommentDraft {
  if (!isRecord(value) || !isThread(value.thread) || !isAvatar(value.avatar)) throw new Error("留言页面或头像无效，请刷新后重试。");
  if (typeof value.nickname !== "string" || typeof value.body !== "string") throw new Error("请填写昵称和留言内容。");
  const nickname = value.nickname.trim().normalize("NFC");
  const body = value.body.trim().normalize("NFC");
  if (!nickname || nickname.length > 24 || unsafeName.test(nickname)) throw new Error("昵称请填写 1–24 个字符，不包含换行或隐藏字符。");
  if (!body || body.length > 2000 || body.includes(String.fromCharCode(0))) throw new Error("留言请填写 1–2000 个字符。");
  const parentId = value.parentId ?? null;
  if (parentId !== null && !isId(parentId)) throw new Error("回复对象无效，请重新选择。");
  return { thread: value.thread, nickname, avatar: value.avatar, body, parentId };
}

export function parseCommentEntry(value: unknown): CommentEntry {
  if (!isRecord(value) || !isId(value.id) || typeof value.nickname !== "string" || !isAvatar(value.avatar)
    || typeof value.body !== "string" || typeof value.created_at !== "string" || !Number.isFinite(Date.parse(value.created_at))
    || typeof value.is_author !== "boolean" || value.parent_id !== null && !isId(value.parent_id)) throw new Error("留言数据暂时无法读取。");
  const replyTo = isRecord(value.reply_to) && value.reply_to.status === "approved" && typeof value.reply_to.nickname === "string" ? value.reply_to.nickname : null;
  return { id: value.id, nickname: value.nickname, avatar: value.avatar, body: value.body,
    createdAt: value.created_at, parentId: value.parent_id as string | null, replyTo, isAuthor: value.is_author };
}
