import { siteConfig } from "../../site.config";

export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="intro-title">
        <p className="eyebrow">{siteConfig.name.toUpperCase()}’S FIELD NOTES <span aria-hidden="true">/</span> 个人技术笔记</p>
        <div className="hero-grid">
          <h1 id="intro-title">把好奇心，<br /><span>写成下一行。</span></h1>
          <div>
            <p className="hero-description">你好，我是 {siteConfig.name}。<br />在这里，记录代码里的发现、AI 带来的新问题，以及书页之间的回响。</p>
            <a className="text-link" href="/about">更多关于我 <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <p className="hero-note"><span className="status-dot" aria-hidden="true" />一个缓慢生长的数字花园</p>
      </section>
      <section className="home-latest"><div className="section-heading"><h2>最近更新</h2><span className="eyebrow">THE LATEST</span></div><p className="muted">文字正在生长。</p></section>
    </>
  );
}
