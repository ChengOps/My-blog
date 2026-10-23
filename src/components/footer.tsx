import { siteConfig } from "../../site.config";
import { HushButton } from "./hush-toggle";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer shell">
      <p>© {new Date().getFullYear()} {siteConfig.name} <span aria-hidden="true">/</span> 保持好奇，持续记录。</p>
      <nav className="footer-links" aria-label="更多链接">
        <a href="/feed.xml">RSS 订阅 <span aria-hidden="true">↗</span></a>
        <a href={siteConfig.social.github}>GitHub <span aria-hidden="true">↗</span></a>
        <a href={`mailto:${siteConfig.email}`}>联系</a>
        <Link href="/guestbook">留言</Link>
        <form action="/" method="get"><button type="submit" className="hush-button" name="intro" value="1">重看封面</button></form>
        <HushButton />
      </nav>
    </footer>
  );
}
