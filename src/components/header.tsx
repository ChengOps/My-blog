import Link from "next/link";
import { siteConfig } from "../../site.config";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="site-header shell">
      <Link className="brand" href="/" aria-label={`${siteConfig.name}，首页`}>
        <span className="brand-mark" aria-hidden="true">{siteConfig.name.slice(0, 1)}</span>{siteConfig.name}.
      </Link>
      <nav className="main-nav" aria-label="主导航">
        <Link className="nav-link" href="/posts">文章</Link>
        <Link className="nav-link" href="/about">关于</Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
