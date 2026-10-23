"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { isAvatar, isId, isRecord, type CommentEntry } from "@/lib/comment-model";
import { CommentForm } from "./form";
import { CommentList } from "./list";

function pageData(value: unknown): { items: CommentEntry[]; next: string | null } {
  if (!isRecord(value) || !Array.isArray(value.items) || value.next !== null && typeof value.next !== "string") throw new Error("留言数据暂时无法读取。");
  const items = value.items.map((entry: unknown): CommentEntry => {
    if (!isRecord(entry) || !isId(entry.id) || typeof entry.nickname !== "string" || !isAvatar(entry.avatar)
      || typeof entry.body !== "string" || typeof entry.createdAt !== "string" || !Number.isFinite(Date.parse(entry.createdAt))
      || typeof entry.isAuthor !== "boolean" || entry.parentId !== null && !isId(entry.parentId)
      || entry.replyTo !== null && typeof entry.replyTo !== "string") throw new Error("留言数据暂时无法读取。");
    return { id: entry.id, nickname: entry.nickname, avatar: entry.avatar, body: entry.body, createdAt: entry.createdAt,
      parentId: entry.parentId as string | null, replyTo: entry.replyTo as string | null, isAuthor: entry.isAuthor };
  });
  return { items, next: value.next as string | null };
}

export function Comments({ thread, title = "留言栏" }: { thread: string; title?: string }) {
  const heading = useId();
  const requestRef = useRef<AbortController | null>(null);
  const [items, setItems] = useState<CommentEntry[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<CommentEntry | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (before?: string) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true); setError("");
    try {
      const query = new URLSearchParams({ thread });
      if (before) query.set("before", before);
      const response = await fetch(`/api/comments?${query}`, { signal: controller.signal, cache: "no-store" });
      const data: unknown = await response.json();
      if (!response.ok) {
        if (isRecord(data) && data.code === "SETUP_REQUIRED") setReady(false);
        throw new Error(isRecord(data) && typeof data.message === "string" ? data.message : "留言暂时无法读取。");
      }
      const page = pageData(data);
      setItems((previous) => before ? [...previous, ...page.items.filter((entry) => !previous.some((item) => item.id === entry.id))] : page.items);
      setNext(page.next); setReady(true);
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "网络暂时不可用，请稍后重试。");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }, [thread]);

  useEffect(() => { void load(); return () => requestRef.current?.abort(); }, [load]);

  return (
    <section className="comments-panel" id="comments" aria-labelledby={heading}>
      <header className="comments-heading"><h2 id={heading}>{title}</h2><p>给想法留一个回声。</p></header>
      {error && <div className="comments-notice" role="status"><p>{error}</p><button type="button" disabled={busy} onClick={() => void load()}>重新加载</button></div>}
      <CommentForm thread={thread} ready={ready} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
      {items.length > 0 && <CommentList items={items} onReply={setReplyTo} />}
      {ready && !busy && items.length === 0 && <p className="comments-empty">还没有留言，欢迎留下第一句话。</p>}
      {busy && <p className="comment-status" role="status">正在读取留言…</p>}
      {next && <button className="comment-more" type="button" disabled={busy} onClick={() => void load(next)}>再看一些留言</button>}
    </section>
  );
}
