"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "../../site.config";
import { ThemeToggle } from "./theme-toggle";
import { Ripple } from "./ripple";

export function Header() {
  const pathname = usePathname();
  return (
    <header className="site-header shell">
      <Ripple />
      <Link className="brand" href="/" aria-label={`${siteConfig.name}. 首页`}>
        <Image className="brand-mark" src={siteConfig.avatar} width={28} height={28} alt={`${siteConfig.name} 的头像`} />{siteConfig.name}.
      </Link>
      <nav className="main-nav" aria-label="主导航">
        <Link className="nav-link" href="/posts" aria-current={pathname.startsWith("/posts") || pathname.startsWith("/tags/") ? "page" : undefined}>文章</Link>
        <Link className="nav-link" href="/about" aria-current={pathname === "/about" ? "page" : undefined}>关于</Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
