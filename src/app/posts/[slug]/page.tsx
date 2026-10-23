import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TableOfContents } from "@/components/toc";
import { PostNavigation } from "@/components/post-navigation";
import { ArticleGlyph } from "@/components/article-glyph";
import { HairlineRule } from "@/components/hairline-rule";
import { SemanticText } from "@/components/semantic-text";
import { Comments } from "@/components/comments/board";
import { getPost, getPosts, formatDate } from "@/lib/posts";
import { renderPost } from "@/lib/mdx";
import { pageMetadata } from "@/lib/seo";
import { tagPath } from "@/lib/urls";
import { siteConfig } from "../../../../site.config";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return getPosts().map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) notFound();
  return pageMetadata({ title: post.title, description: post.summary, path: `/posts/${post.slug}`, date: post.date, tags: post.tags });
}

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const { content, toc } = await renderPost(post.content);
  const posts = getPosts();
  const index = posts.findIndex((entry) => entry.slug === post.slug);
  const writtenAt = new Date(`${post.date}T00:00:00Z`);
  return (
    <article className="article-page">
      <header className="article-header">
        <Link className="text-link" href="/posts">← 返回文章列表</Link>
        <div className="post-meta mt-8"><ArticleGlyph slug={post.slug} /><time dateTime={post.date}>{formatDate(post.date)}</time><span aria-hidden="true">/</span><span>{post.readingMinutes} 分钟阅读</span>
          {post.updated && post.updated !== post.date && (
            <><span className="post-updated-separator" aria-hidden="true">/</span><span className="post-updated">最后更新 {formatDate(post.updated)}</span></>
          )}
        </div>
        <h1><SemanticText>{post.title}</SemanticText></h1>
        <p className="article-summary">{post.summary}</p>
        <div className="topics mt-5">{post.tags.map((tag) => <Link key={tag} className="pill" href={tagPath(tag)}>{tag}</Link>)}</div>
      </header>
      <div className="article-body-layout">
        <HairlineRule variant={3} />
        <TableOfContents entries={toc} />
        <div className="article-content">
          <div className="prose">{content}</div>
          <p className="article-signature">—— {siteConfig.name}，写于 <time dateTime={post.date}>{writtenAt.getUTCFullYear()} 年 {writtenAt.getUTCMonth() + 1} 月 {writtenAt.getUTCDate()} 日</time></p>
          <p className="article-end"><span aria-hidden="true">◇</span> 谢谢你读到这里。</p>
          <PostNavigation previous={posts[index + 1]} next={posts[index - 1]} />
          <Comments thread={`/posts/${post.slug}`} title="文章评论" />
        </div>
      </div>
    </article>
  );
}
