import { createHmac } from "node:crypto";
import { isThread, parseCommentDraft } from "@/lib/comment-model";
import { CommentServiceError, commentSalt, readComments, saveComment } from "@/lib/comment-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function failure(error: unknown) {
  if (error instanceof CommentServiceError) return reply({ message: error.message, code: error.code }, error.status);
  return reply({ message: "留言服务暂时不可用，请稍后重试。", code: "UNAVAILABLE" }, 502);
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const thread = query.get("thread");
  if (!isThread(thread)) return reply({ message: "留言页面无效。", code: "BAD_INPUT" }, 400);
  try { return reply(await readComments(thread, query.get("before"))); }
  catch (error) { return failure(error); }
}

async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new CommentServiceError("请使用留言表单提交。", 415, "BAD_INPUT");
  const reader = request.body?.getReader();
  if (!reader) throw new CommentServiceError("请填写留言内容。", 400, "BAD_INPUT");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) { await reader.cancel(); throw new CommentServiceError("留言内容过长。", 413, "BAD_INPUT"); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; }
  catch { throw new CommentServiceError("留言格式无效，请重新提交。", 400, "BAD_INPUT"); }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return reply({ message: "请从本站留言页面提交。", code: "BAD_ORIGIN" }, 403);
  try {
    let draft;
    try { draft = parseCommentDraft(await readBody(request)); }
    catch (error) {
      if (error instanceof CommentServiceError) throw error;
      return reply({ message: error instanceof Error ? error.message : "留言内容无效。", code: "BAD_INPUT" }, 400);
    }
    const ip = (request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
    const hash = createHmac("sha256", commentSalt()).update(ip).digest("hex");
    await saveComment(draft, hash);
    return reply({ message: "留言已提交，审核通过后会公开显示。", status: "pending" }, 201);
  } catch (error) { return failure(error); }
}
