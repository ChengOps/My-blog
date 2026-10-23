import type { Metadata } from "next";
import Link from "next/link";
import { PostsSnap } from "./posts-snap";
import { Footer } from "@/components/footer";
import { TagFilter } from "@/components/tag-filter";
import { SemanticText } from "@/components/semantic-text";
import { formatDate, getPosts } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { tagPath } from "@/lib/urls";
import "./posts.css";

export const metadata: Metadata = pageMetadata({ title: "全部文章", description: "按时间整理的前端、AI 与阅读笔记。选择一个主题，慢慢读。", path: "/posts" });

export default function PostsPage() {
  const posts = getPosts();
  return (
    <div className="posts-archive">
      <div className="posts-intro">
        <header className="page-heading"><p className="eyebrow">文章归档 · 共 {posts.length} 篇</p><h1>记录，也是思考。</h1><p>一些实践，一些发现，一些还在生长的想法。</p></header>
        <TagFilter />
      </div>
    <PostsSnap>
      {posts.map((post, index) => (
        <section className="step" data-idx={index} id={post.slug} key={post.slug} aria-labelledby={`${post.slug}-title`}>
          <div className="step-inner">
            <span className="tl-line" aria-hidden="true" />
            {index > 0 && <span className="seg" aria-hidden="true" />}
            <span className="node" aria-hidden="true" />
            <time className="timeline-date" dateTime={post.date}><span>{post.date.slice(0, 4)}</span><span>{formatDate(post.date).slice(5)}</span></time>
            <div className="step-copy">
              <article className="card">
                <h2 className="post-title" id={`${post.slug}-title`}><Link href={`/posts/${post.slug}`}><SemanticText>{post.title}</SemanticText></Link></h2>
                <div className="post-meta">{post.tags.map((tag) => <Link className="pill" key={tag} href={tagPath(tag)}>{tag}</Link>)}</div>
              </article>
            </div>
          </div>
        </section>
      ))}
      <section className="step step-footer" data-idx={posts.length} aria-label="页脚">
        <div className="step-inner">
          <span className="tl-line" aria-hidden="true" />
          {posts.length > 0 && <span className="seg" aria-hidden="true" />}
          <span className="node" aria-hidden="true" />
          <div className="step-copy">{posts.length === 0 && <h1 className="post-title">这里还没有文章，下一次再来看看。</h1>}<Footer /></div>
        </div>
      </section>
    </PostsSnap>
    </div>
  );
}
