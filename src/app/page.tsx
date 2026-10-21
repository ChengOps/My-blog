import { siteConfig } from "../../site.config";
import Link from "next/link";
import { PostList } from "@/components/post-list";
import { getPosts, getTags } from "@/lib/posts";

export default function Home() {
  const posts = getPosts();
  return (
    <>
      <section className="hero" aria-labelledby="intro-title">
        <p className="eyebrow">{siteConfig.name.toUpperCase()}’S FIELD NOTES <span aria-hidden="true">/</span> 个人技术笔记</p>
        <div className="hero-grid">
          <h1 id="intro-title">把好奇心，<br /><span>写成下一行。</span></h1>
          <div>
            <p className="hero-description">你好，我是 {siteConfig.name}。<br />在这里，记录代码里的发现、AI 带来的新问题，以及书页之间的回响。</p>
            <Link className="text-link" href="/about">更多关于我 <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <p className="hero-note"><span className="status-dot" aria-hidden="true" />一个缓慢生长的数字花园</p>
      </section>
      <section className="home-latest" aria-labelledby="latest-heading">
        <div className="section-heading"><h2 id="latest-heading">最近更新 <span className="muted text-sm ml-2">{String(posts.length).padStart(2, "0")}</span></h2><Link className="text-link" href="/posts">全部文章 <span aria-hidden="true">↗</span></Link></div>
        <PostList posts={posts.slice(0, 3)} />
      </section>
      <section className="topics-section" aria-labelledby="topics-heading">
        <div className="section-heading"><h2 id="topics-heading">循着主题阅读</h2><span className="eyebrow">EXPLORE BY TOPIC</span></div>
        <div className="topics">{getTags().map(({ tag, count }) => <Link className="pill" href={`/tags/${encodeURIComponent(tag)}`} key={tag}>{tag} <span className="ml-1">{count}</span></Link>)}</div>
      </section>
    </>
  );
}
