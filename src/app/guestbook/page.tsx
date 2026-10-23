import type { Metadata } from "next";
import { GiscusBoard } from "@/components/comments/giscus";
import { pageMetadata } from "@/lib/seo";
import "./guestbook.css";

export const metadata: Metadata = pageMetadata({
  title: "访客留言", description: "留一个想法、一声问候，或一个值得讨论的问题。", path: "/guestbook",
});

export default function GuestbookPage() {
  return (
    <div className="guestbook-page">
      <header className="page-heading guestbook-intro">
        <p className="eyebrow">访客留言</p>
        <h1>留一句话，再继续前行。</h1>
        <p>关于这个网站，关于一篇笔记，或者只是路过的一声问候。</p>
        <div className="guestbook-postmark" aria-hidden="true">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="36" cy="36" r="33" /><circle cx="36" cy="36" r="28" strokeDasharray="2 5" />
            <path d="M20 26h32v23H20z" /><path d="m20 26 16 13 16-13M20 49l12-13m20 13L40 36" />
          </svg>
          <span>不必认真开场，<br />一声你好也很好。</span>
        </div>
        <ol className="guestbook-guide" aria-label="留言步骤">
          <li><span aria-hidden="true">01</span>选一个头像，写下你的名字</li>
          <li><span aria-hidden="true">02</span>留下一声问候，或一个想法</li>
          <li><span aria-hidden="true">03</span>审核通过后，在这里相遇</li>
        </ol>
      </header>
      <GiscusBoard term="/guestbook" />
    </div>
  );
}
