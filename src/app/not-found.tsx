import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "页面未找到", description: "这条路径还没有留下笔记，回到首页继续阅读。", robots: { index: false, follow: false } };

export default function NotFound() {
  return <div className="error-page"><p className="eyebrow">404 / A PATH NOT TAKEN</p><h1>这一页，还没有写下。</h1><p>链接可能有误，文章也可能已经搬家。回到熟悉的地方，继续找一篇好文章。</p><Link href="/" className="text-link">← 回到首页</Link></div>;
}
