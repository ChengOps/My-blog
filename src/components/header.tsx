"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { siteConfig } from "../../site.config";
import { ThemeToggle } from "./theme-toggle";
import { Ripple } from "./ripple";
import { AvatarSecret } from "./avatar-secret";

const navigation = [
  { href: "/", label: "首页" },
  { href: "/posts", label: "文章" },
  { href: "/about", label: "关于" },
];

export function Header() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const mounted = useRef(false);
  const currentHref = pathname === "/" ? "/"
    : pathname === "/posts" || pathname.startsWith("/posts/") || pathname.startsWith("/tags/") ? "/posts"
    : pathname === "/about" ? "/about" : undefined;

  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = nav?.querySelector<HTMLElement>(".nav-indicator");
    if (!nav || !indicator) return;
    let disposed = false;
    let hovered: HTMLAnchorElement | null = null;

    function measure() {
      if (disposed || !nav || !indicator) return;
      const current = nav.querySelector<HTMLAnchorElement>('.nav-link[aria-current="page"]');
      const target = hovered ?? current;
      if (!target || !nav.clientWidth) {
        nav.removeAttribute("data-indicator-ready");
        indicator.style.opacity = "0";
        return;
      }
      if (!mounted.current) indicator.style.setProperty("transition", "none", "important");
      // Layout dimensions stay stable while the link is pressed or scaling back.
      indicator.style.setProperty("--nav-x", `${target.offsetLeft}px`);
      indicator.style.setProperty("--nav-scale", String(target.offsetWidth / nav.clientWidth));
      indicator.style.opacity = hovered && hovered !== current ? "0.4" : "1";
      nav.setAttribute("data-indicator-ready", "");
      if (!mounted.current) {
        indicator.getBoundingClientRect();
        indicator.style.removeProperty("transition");
        mounted.current = true;
      }
    }

    function preview(event: PointerEvent) {
      if (!(event.target instanceof Element)) return;
      hovered = matchMedia("(hover: hover) and (pointer: fine)").matches
        ? event.target.closest<HTMLAnchorElement>(".nav-link") : null;
      measure();
    }

    function restore() { hovered = null; measure(); }

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(nav);
    window.addEventListener("resize", measure);
    nav.addEventListener("pointerover", preview);
    nav.addEventListener("pointerleave", restore);
    void document.fonts.ready.then(() => { if (!disposed) measure(); });
    return () => {
      disposed = true;
      resize.disconnect();
      window.removeEventListener("resize", measure);
      nav.removeEventListener("pointerover", preview);
      nav.removeEventListener("pointerleave", restore);
    };
  }, [pathname]);

  return (
    <header className="site-header shell">
      <Ripple />
      <div className="brand"><AvatarSecret /><Link className="brand-name" href="/" aria-label={`${siteConfig.name}. 首页`}>{siteConfig.name}.</Link></div>
      <nav ref={navRef} className="main-nav" aria-label="主导航">
        {navigation.map(({ href, label }) => (
          <Link key={href} className="nav-link" href={href} aria-current={currentHref === href ? "page" : undefined}>{label}</Link>
        ))}
        <span className="nav-indicator" aria-hidden="true" />
      </nav>
      <ThemeToggle />
    </header>
  );
}
