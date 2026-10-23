"use client";

import { useEffect, useRef, useState } from "react";
import type { TocEntry } from "@/lib/headings";

export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll<HTMLElement>(".prose h2, .prose h3"))
      .filter((heading) => entries.some((entry) => entry.id === heading.id));
    if (!headings.length) return;
    const visible = new Set<Element>();
    function updateCurrent() {
      const current = headings.find((heading) => visible.has(heading));
      const passed = headings.filter((heading) => heading.getBoundingClientRect().top <= innerHeight * 0.25);
      setActiveId((current ?? passed.at(-1) ?? headings[0]).id);
    }
    function updateBetweenHeadings() {
      if (!visible.size) updateCurrent();
    }
    const observer = new IntersectionObserver((changes) => {
      for (const change of changes) {
        if (change.isIntersecting) visible.add(change.target);
        else visible.delete(change.target);
      }
      updateCurrent();
    }, { rootMargin: "-25% 0px -65% 0px" });
    headings.forEach((heading) => observer.observe(heading));
    updateCurrent();
    window.addEventListener("scroll", updateBetweenHeadings, { passive: true });
    // Reconcile jumps that skip the observer band entirely.
    window.addEventListener("scrollend", updateCurrent, { passive: true });
    window.addEventListener("resize", updateCurrent);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateBetweenHeadings);
      window.removeEventListener("scrollend", updateCurrent);
      window.removeEventListener("resize", updateCurrent);
    };
  }, [entries]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    function updateIndicator() {
      if (!list) return;
      const link = list.querySelector<HTMLAnchorElement>("a[aria-current]");
      if (!link || !list.getBoundingClientRect().width) return;
      const bounds = link.getBoundingClientRect();
      const height = Number.parseFloat(getComputedStyle(list, "::before").height);
      const offset = bounds.top - list.getBoundingClientRect().top + (bounds.height - height) / 2;
      list.style.setProperty("--toc-offset", `${offset}px`);
    }
    updateIndicator();
    const resize = new ResizeObserver(updateIndicator);
    resize.observe(list);
    const details = list.closest("details");
    details?.addEventListener("toggle", updateIndicator);
    return () => {
      resize.disconnect();
      details?.removeEventListener("toggle", updateIndicator);
    };
  }, [activeId]);

  if (!entries.length) return null;
  return (
    <aside className="toc">
      <details open>
        <summary>本篇目录</summary>
        <nav aria-label="文章目录">
          <ol ref={listRef} data-active={activeId || undefined}>{entries.map((entry) => (
            <li key={entry.id} className={entry.level === 3 ? "toc-subheading" : undefined}>
              <a href={`#${encodeURIComponent(entry.id)}`} className={activeId === entry.id ? "is-active" : undefined}
                aria-current={activeId === entry.id ? "true" : undefined}>{entry.text}</a>
            </li>
          ))}</ol>
        </nav>
      </details>
    </aside>
  );
}
