import { useLayoutEffect, useRef } from "react";
import "./submit-button.css";

type Props = { ready: boolean; busy: boolean; success: boolean; error: boolean };

export function CommentSubmit({ ready, busy, success, error }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const state = busy ? "sending" : success ? "success" : error ? "error" : "idle";
  const label = !ready ? "留言暂未开放" : busy ? "正在提交留言" : success ? "已提交，等待审核" : error ? "提交失败，点击重试" : "提交留言";

  useLayoutEffect(() => {
    const button = ref.current;
    if (!button) return;
    const measure = () => {
      button.style.setProperty("--send-collapse", String(button.clientHeight / button.clientWidth));
      button.style.setProperty("--send-diameter", `${button.clientHeight}px`);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(button);
    return () => resize.disconnect();
  }, []);

  return (
    <span className="comment-send-shell" data-state={state}>
      <button ref={ref} type="submit" className="comment-submit comment-send" disabled={!ready || busy || success} aria-label={label}>
        <span className="comment-send-surface" aria-hidden="true" />
        <span className="comment-send-circle" aria-hidden="true" />
        <span className="comment-send-label" aria-hidden="true">{ready ? "提交留言" : "留言暂未开放"}</span>
        <svg className="guestbook-send-icon" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m4 11 16-7-7 16-3-6-6-3Z" /><path d="m10 14 10-10" /></svg>
        <span className="comment-send-spinner" aria-hidden="true" />
        <span className="comment-send-tick" aria-hidden="true" />
      </button>
      <span className="comment-send-burst" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <i key={index} />)}</span>
    </span>
  );
}
