import type { Metadata } from "next";
import { PostList } from "@/components/post-list";
import { TagFilter } from "@/components/tag-filter";
import { getPosts } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "全部文章", description: "按时间整理的前端、AI 与阅读笔记。选择一个主题，慢慢读。", path: "/posts" });

export default function PostsPage() {
  return <>
    <header className="page-heading"><p className="eyebrow">THE ARCHIVE / 文章归档</p><h1>记录，也是思考。</h1><p>一些实践，一些发现，一些还在生长的想法。</p></header>
    <TagFilter />
    <section aria-label="全部文章"><h2 className="sr-only">按时间倒序排列的文章</h2><PostList posts={getPosts()} /></section>
  </>;
}
