import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "../../../site.config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "关于", description: `关于 ${siteConfig.name}，以及这个记录代码、AI 与阅读的数字花园。`, path: "/about" });

export default function AboutPage() {
  return (
    <div className="about-layout">
      <article>
        <header className="page-heading pt-0"><p className="eyebrow">A LITTLE ABOUT ME / 关于我</p><h1>你好，我是 {siteConfig.name}。</h1><p>写代码，也写下代码之外的思考。</p></header>
        <div className="prose">
          <p>欢迎来到我的个人博客。这里是一处慢慢整理的数字花园：有前端开发的实践，有与 AI 协作的探索，也有读书时留下的问题。</p>
          <h2>为什么写在这里</h2>
          <p>有些知识，只有试着解释给别人听，才会发现自己究竟理解了多少。我把写作当作整理思路的方式，也希望这些记录能成为你解决问题时的一点参考。</p>
          <p>我偏爱清楚的表达、简单可靠的工具，以及能在日常中持续的小习惯。文章会尽量交代背景、过程和局限；如果发现新的理解，也会回来更新。</p>
          <h2>你可以读到什么</h2>
          <ul><li>前端：页面体验、工程实践与可维护的代码。</li><li>AI：把工具放进真实工作流之后的观察与反思。</li><li>阅读：书页与生活之间，值得留下的联系。</li></ul>
          <h2>保持联系</h2>
          <p>如果某篇文章让你想到一个问题，欢迎通过<a href={`mailto:${siteConfig.email}`}>邮件</a>交流。也可以订阅 <a href="/feed.xml">RSS</a>，在自己喜欢的阅读器里接收更新。</p>
        </div>
        <Link className="text-link inline-block mt-10" href="/posts">从一篇文章开始 →</Link>
      </article>
      <aside className="about-aside" aria-label="作者名片">
        <Image src={siteConfig.avatar} width={80} height={80} alt={`${siteConfig.name} 的字母头像`} />
        <h2 className="font-semibold">{siteConfig.name}</h2><p>开发者 · 阅读者 · 记录者</p><p>保持好奇，持续记录。</p>
        <a className="text-link inline-block mt-4" href={siteConfig.social.github}>GitHub ↗</a>
      </aside>
    </div>
  );
}
