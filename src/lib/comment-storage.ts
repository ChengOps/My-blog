import { isId, parseCommentEntry, type CommentDraft } from "./comment-model";

export class CommentServiceError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const salt = process.env.COMMENTS_IP_SALT;
  if (!url || !key || !salt || salt.length < 32) {
    throw new CommentServiceError("留言暂未开放，请稍后来。", 503, "SETUP_REQUIRED");
  }
  if (new URL(url).protocol !== "https:") throw new CommentServiceError("留言服务暂时不可用。", 503, "SETUP_REQUIRED");
  return { url, key, salt };
}

export function commentSalt() { return config().salt; }

async function storage(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  let response: Response;
  try {
    response = await fetch(`${url}/rest/v1/${path}`, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000),
      headers: { apikey: key, ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }), "Content-Type": "application/json" } });
  } catch { throw new CommentServiceError("留言服务暂时连接不上，请稍后重试。", 502, "UNAVAILABLE"); }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data === "object" && data !== null && "message" in data ? data.message : "";
    if (message === "rate_limited") throw new CommentServiceError("发送得有些快，请一分钟后再试。", 429, "RATE_LIMITED");
    if (message === "invalid_parent") throw new CommentServiceError("这条留言已不可回复，请重新选择。", 400, "INVALID_PARENT");
    throw new CommentServiceError("留言服务暂时不可用，请稍后重试。", 502, "UNAVAILABLE");
  }
  return data;
}

export async function readComments(thread: string, before: string | null) {
  const query = new URLSearchParams({ select: "id,nickname,avatar,body,created_at,parent_id,is_author,reply_to:blog_comments!blog_comments_parent_id_fkey(nickname,status)",
    thread: `eq.${thread}`, status: "eq.approved", order: "created_at.desc,id.desc", limit: "21" });
  if (before) {
    const [date, id, extra] = before.split("|");
    if (extra !== undefined || !isId(id) || !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|\+00:00)$/.test(date) || !Number.isFinite(Date.parse(date))) {
      throw new CommentServiceError("翻页位置无效，请刷新留言。", 400, "BAD_CURSOR");
    }
    query.set("or", `(created_at.lt.${date},and(created_at.eq.${date},id.lt.${id}))`);
  }
  const data = await storage(`blog_comments?${query}`);
  if (!Array.isArray(data)) throw new CommentServiceError("留言数据暂时无法读取。", 502, "UNAVAILABLE");
  const entries = data.map(parseCommentEntry);
  const items = entries.slice(0, 20);
  const last = items.at(-1);
  return { items, next: entries.length > 20 && last ? `${last.createdAt}|${last.id}` : null };
}

export async function saveComment(draft: CommentDraft, hash: string) {
  const id = await storage("rpc/submit_blog_comment", { method: "POST", body: JSON.stringify({
    p_thread: draft.thread, p_nickname: draft.nickname, p_avatar: draft.avatar, p_body: draft.body,
    p_parent: draft.parentId, p_client_hash: hash,
  }) });
  if (!isId(id)) throw new CommentServiceError("提交结果暂时无法确认，请稍后查看。", 502, "UNAVAILABLE");
  return id;
}
