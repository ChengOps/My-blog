"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { commentAvatars, isAvatar, isRecord, parseCommentDraft, type CommentEntry } from "@/lib/comment-model";
import { CommentIdentity, type VisitorIdentity } from "./identity";
import { CommentSubmit } from "./submit-button";

type Props = { thread: string; ready: boolean; replyTo: CommentEntry | null; onCancelReply: () => void };
const identityKey = "xavier-comment-identity";

export function CommentForm({ thread, ready, replyTo, onCancelReply }: Props) {
  const id = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const sending = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const [identity, setIdentity] = useState<VisitorIdentity>({ nickname: "", avatar: "cat", remember: true });
  const [hydrated, setHydrated] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const guestbook = thread === "/guestbook";
  const avatar = commentAvatars.find((option) => option.id === identity.avatar)!;

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(identityKey) ?? "null");
      if (isRecord(saved) && typeof saved.nickname === "string" && saved.nickname.length <= 24 && isAvatar(saved.avatar)) {
        setIdentity({ nickname: saved.nickname, avatar: saved.avatar, remember: true });
      }
    } catch { /* The form works when local preferences are unavailable. */ }
    setHydrated(true);
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (identity.remember) localStorage.setItem(identityKey, JSON.stringify({ nickname: identity.nickname, avatar: identity.avatar }));
      else localStorage.removeItem(identityKey);
    } catch { /* Remembering is optional. */ }
  }, [identity, hydrated]);

  useEffect(() => { if (replyTo) textRef.current?.focus(); }, [replyTo]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    setError(""); setMessage("");
    if (!ready) { setError("留言暂未开放，请稍后来。"); return; }
    let draft;
    try { draft = parseCommentDraft({ thread, ...identity, body, parentId: replyTo?.id ?? null }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "请检查留言内容。"); return; }
    sending.current = true;
    setBusy(true);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft), signal: controller.signal });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(isRecord(data) && typeof data.message === "string" ? data.message : "暂时无法提交，请稍后重试。");
      if (!isRecord(data) || data.status !== "pending") throw new Error("提交结果暂时无法确认，请稍后查看。");
      setBody("");
      onCancelReply();
      setMessage("留言已提交，审核通过后会公开显示。");
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "网络暂时不可用，请稍后重试。");
    } finally {
      sending.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  const feedback = <><p className="comment-error" id={`${id}-error`} role="alert">{error}</p><p className="comment-status" role="status" aria-live="polite">{message}</p></>;

  return (
    <form className="comment-form" onSubmit={submit} aria-busy={busy}>
      {guestbook && <div className="guestbook-identity-preview" aria-label="留言身份预览">
        <Image key={avatar.id} src={avatar.src} alt={`${avatar.name}头像`} width={48} height={48} className="comment-avatar" sizes="48px" />
        <div><strong>{identity.nickname.trim() || "路过的朋友"}</strong><p>以{avatar.name}的模样，留下一点回声</p></div>
        <span className="guestbook-paper-label" aria-hidden="true">一张小纸条</span>
      </div>}
      <CommentIdentity id={`${id}-name`} value={identity} onChange={setIdentity} />
      {replyTo && <div className="comment-reply-context"><p>正在回复 {replyTo.nickname}</p><button type="button" onClick={onCancelReply}>取消回复</button></div>}
      <label className="comment-body-label" htmlFor={`${id}-body`}>想说的话</label>
      <textarea ref={textRef} id={`${id}-body`} name="body" value={body} disabled={guestbook && busy} required maxLength={2000} rows={5}
        placeholder="留一个想法、一声问候，或一个值得讨论的问题。"
        aria-describedby={`${id}-help ${id}-error`} onChange={(event) => { setBody(event.target.value); setMessage(""); }} />
      <div className="comment-form-note" id={`${id}-help`}><span>无需注册 · 公开留言 · 审核后显示</span><span>{body.length} / 2000</span></div>
      {!guestbook && feedback}
      {guestbook ? <CommentSubmit ready={ready} busy={busy} success={message !== ""} error={error !== ""} />
        : <button type="submit" className="comment-submit" disabled={!ready || busy}>{busy ? "正在提交…" : "提交留言"}</button>}
      {guestbook && feedback}
    </form>
  );
}
