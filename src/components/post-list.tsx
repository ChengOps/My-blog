import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";
import { tagPath } from "@/lib/urls";

export function PostList({ posts }: { posts: Post[] }) {
  if (!posts.length) return <p className="empty-state">这里还没有文章，下一次再来看看。</p>;
  return (
    <div>
      {posts.map((post) => (
        <article className="post-row" key={post.slug}>
          <time className="post-date" dateTime={post.date}>{formatDate(post.date)}</time>
          <div>
            <h3 className="post-title"><Link href={`/posts/${post.slug}`}>{post.title}</Link></h3>
            <p className="post-summary">{post.summary}</p>
            <div className="post-meta">
              {post.tags.map((tag) => <Link className="pill" key={tag} href={tagPath(tag)}>{tag}</Link>)}
              <span aria-hidden="true">·</span><span>{post.readingMinutes} 分钟阅读</span>
            </div>
          </div>
          <span className="post-arrow" aria-hidden="true">→</span>
        </article>
      ))}
    </div>
  );
}
