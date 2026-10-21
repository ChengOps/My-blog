import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TableOfContents } from "@/components/toc";
import { PostNavigation } from "@/components/post-navigation";
import { getPost, getPosts, formatDate } from "@/lib/posts";
import { renderPost } from "@/lib/mdx";
import { pageMetadata } from "@/lib/seo";
import { tagPath } from "@/lib/urls";

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
  return (
    <article className="article-page">
      <header className="article-header">
        <Link className="text-link" href="/posts">← 返回文章列表</Link>
        <div className="post-meta mt-8"><time dateTime={post.date}>{formatDate(post.date)}</time><span aria-hidden="true">/</span><span>{post.readingMinutes} 分钟阅读</span></div>
        <h1>{post.title}</h1>
        <p className="article-summary">{post.summary}</p>
        <div className="topics mt-5">{post.tags.map((tag) => <Link key={tag} className="pill" href={tagPath(tag)}>{tag}</Link>)}</div>
      </header>
      <div className="article-body-layout">
        <TableOfContents entries={toc} />
        <div className="article-content">
          <div className="prose">{content}</div>
          <p className="article-end"><span aria-hidden="true">◇</span> 谢谢你读到这里。</p>
          <PostNavigation previous={posts[index + 1]} next={posts[index - 1]} />
        </div>
      </div>
    </article>
  );
}
