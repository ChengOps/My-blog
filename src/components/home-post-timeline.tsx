import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";
import { tagPath } from "@/lib/urls";
import { SemanticText } from "./semantic-text";
import "@/styles/home-timeline.css";

export function HomePostTimeline({ posts }: { posts: Post[] }) {
  if (!posts.length) return <p className="empty-state">这里还没有文章，下一次再来看看。</p>;
  return (
    <div className="home-timeline">
      {posts.map((post) => (
        <article className="home-timeline-entry" key={post.slug} aria-labelledby={`latest-${post.slug}`}>
          <time className="home-timeline-date" dateTime={post.date}><span>{post.date.slice(0, 4)}</span><span>{formatDate(post.date).slice(5)}</span></time>
          <div className="post-row home-timeline-card">
            <h3 className="post-title" id={`latest-${post.slug}`}><Link href={`/posts/${post.slug}`}><SemanticText>{post.title}</SemanticText></Link></h3>
            <div className="post-meta">{post.tags.map((tag) => <Link className="pill" key={tag} href={tagPath(tag)}>{tag}</Link>)}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
