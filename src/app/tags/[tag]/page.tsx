import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostList } from "@/components/post-list";
import { TagFilter } from "@/components/tag-filter";
import { getPosts, getTags } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { tagPath, tagSegment } from "@/lib/urls";

type Props = { params: Promise<{ tag: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return getTags().map(({ tag }) => ({ tag: tagSegment(tag) })); }

async function resolveTag(params: Props["params"]): Promise<string> {
  const { tag: parameter } = await params;
  const match = getTags().find(({ tag }) => tagSegment(tag) === parameter);
  if (!match) notFound();
  return match.tag;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = await resolveTag(params);
  return pageMetadata({ title: `${tag} · 标签`, description: `阅读「${tag}」主题下的全部文章。`, path: tagPath(tag) });
}

export default async function TagPage({ params }: Props) {
  const tag = await resolveTag(params);
  const posts = getPosts().filter((post) => post.tags.includes(tag));
  if (!posts.length) notFound();
  return <>
    <header className="page-heading"><p className="eyebrow">主题 · {tag}</p><h1>{tag}</h1><p>共 {posts.length} 篇文章，从这里开始一条新的阅读路径。</p></header>
    <TagFilter active={tag} />
    <section aria-label={`${tag}主题文章`}><h2 className="sr-only">{tag}文章列表</h2><PostList posts={posts} /></section>
  </>;
}
