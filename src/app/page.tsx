import { siteConfig } from "../../site.config";
import Link from "next/link";
import Image from "next/image";
import { HomePostTimeline } from "@/components/home-post-timeline";
import { HairlineRule } from "@/components/hairline-rule";
import { HomeEntrance } from "@/components/home-entrance";
import { getPosts, getTags } from "@/lib/posts";
import { tagPath } from "@/lib/urls";

export default function Home() {
  const posts = getPosts();
  return (
    <HomeEntrance>
      <section className="hero" aria-labelledby="intro-title">
        <p className="eyebrow">个人技术笔记 · 自 2026</p>
        <div className="hero-grid">
          <h1 id="intro-title">把好奇心，<br /><span>写成下一行。</span></h1>
          <div>
            <Image className="hero-illustration" src="/illustrations/window-desk.webp" alt="" width={672} height={384} sizes="(max-width: 640px) 144px, 224px" />
            <p className="hero-description">你好，我是 {siteConfig.name}。<br />在这里，记录代码里的发现、AI 带来的新问题，以及书页之间的回响。</p>
            <Link className="text-link" href="/about">更多关于我 <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <p className="hero-note"><span className="status-dot" aria-hidden="true" />一个缓慢生长的数字花园</p>
      </section>
      <section className="home-latest" aria-labelledby="latest-heading">
        <HairlineRule />
        <div className="section-heading"><h2 id="latest-heading">最近更新 <span className="muted text-sm ml-2">{String(posts.length).padStart(2, "0")}</span></h2><Link className="text-link" href="/posts">全部文章 <span aria-hidden="true">→</span></Link></div>
        <HomePostTimeline posts={posts.slice(0, 3)} />
      </section>
      <section className="topics-section" aria-labelledby="topics-heading">
        <HairlineRule variant={2} />
        <div className="section-heading"><h2 id="topics-heading">循着主题阅读</h2><span className="eyebrow">按主题</span></div>
        <div className="topics">{getTags().map(({ tag, count }) => <Link className="pill" href={tagPath(tag)} key={tag}>{tag} <span className="ml-1">{count}</span></Link>)}</div>
      </section>
    </HomeEntrance>
  );
}
