import Link from "next/link";
import type { Post } from "@/lib/posts";

export function PostNavigation({ previous, next }: { previous?: Post; next?: Post }) {
  return (
    <nav className="post-navigation" aria-label="上一篇和下一篇">
      {previous ? <Link href={`/posts/${previous.slug}`}><span>← 上一篇</span><strong>{previous.title}</strong></Link> : <div />}
      {next ? <Link href={`/posts/${next.slug}`} className="next-post"><span>下一篇 →</span><strong>{next.title}</strong></Link> : <div />}
    </nav>
  );
}
