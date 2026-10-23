"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export function PostsSnap({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const steps = Array.from(el.querySelectorAll<HTMLElement>(".step"));
    const segments = Array.from(el.querySelectorAll<HTMLElement>(".seg"));
    let current = -1;
    let timer = 0;
    let wheelTimer = 0;
    let wheelLocked = false;
    let paused: Animation[] = [];
    const resume = () => { paused.forEach((animation) => animation.play()); paused = []; };
    const top = (index: number) => {
      const step = steps[Math.max(0, Math.min(steps.length - 1, index))];
      const inset = getComputedStyle(step).scrollSnapAlign === "center" ? Math.max(0, (el.clientHeight - step.offsetHeight) / 2) : 0;
      return Math.max(0, step.offsetTop - inset);
    };
    const nearest = () => steps.reduce((best, _, index) => Math.abs(top(index) - el.scrollTop) < Math.abs(top(best) - el.scrollTop) ? index : best, 0);

    function commit() {
      if (!el || !el.clientHeight) return;
      const index = nearest();
      // Ignore an idle gap before native snapping has reached the step boundary.
      if (Math.abs(el.scrollTop - top(index)) > 1) return;
      window.clearTimeout(timer);
      resume();
      if (current === index) return;
      current = index;
      steps.forEach((step, k) => step.classList.toggle("on", k === index));
      segments.forEach((segment, k) => segment.classList.toggle("on", k < index));
    }

    function onScroll() {
      window.clearTimeout(timer);
      // Freeze an unfinished stroke if the reader starts the next gesture early.
      for (const animation of el!.getAnimations({ subtree: true })) {
        if (animation instanceof CSSTransition && animation.playState === "running") {
          animation.pause(); paused.push(animation);
        }
      }
      timer = window.setTimeout(commit, 140);
    }

    function jumpToHash() {
      let slug = "";
      try { slug = decodeURIComponent(location.hash.slice(1)); } catch { /* Invalid fragment falls back to the first step. */ }
      const index = steps.findIndex((step) => slug !== "" && step.id === slug);
      el!.scrollTop = top(index);
      commit();
    }

    function onWheel(event: WheelEvent) {
      if (!el || event.ctrlKey || !event.cancelable || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const copy = event.target instanceof Element ? event.target.closest<HTMLElement>(".step-copy") : null;
      if (copy && (event.deltaY > 0 ? copy.scrollTop + copy.clientHeight < copy.scrollHeight - 1 : copy.scrollTop > 1)) return;
      event.preventDefault();
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => { wheelLocked = false; }, 140);
      if (wheelLocked) return;
      wheelLocked = true;
      const index = nearest() + Math.sign(event.deltaY);
      const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.hush === "on";
      el.scrollTo({ top: top(index), behavior: quiet ? "instant" : "smooth" });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.target !== el || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const direction = ["ArrowDown", "PageDown"].includes(event.key) ? 1 : ["ArrowUp", "PageUp"].includes(event.key) ? -1 : 0;
      if (!direction && !["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === "Home" ? 0 : event.key === "End" ? steps.length - 1
        : nearest() + direction;
      el!.scrollTo({ top: top(index), behavior: "instant" });
    }

    el.setAttribute("data-snap-initializing", "");
    el.setAttribute("data-snap-ready", "");
    jumpToHash();
    el.getBoundingClientRect();
    el.removeAttribute("data-snap-initializing");
    let height = el.clientHeight, rowHeight = steps[0].offsetHeight;
    const resize = new ResizeObserver(() => {
      if (height === el.clientHeight && rowHeight === steps[0].offsetHeight) return;
      height = el.clientHeight; rowHeight = steps[0].offsetHeight;
      el.scrollTop = top(current);
      commit();
    });
    resize.observe(el);
    resize.observe(steps[0]);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", commit);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("keydown", onKeyDown);
    window.addEventListener("hashchange", jumpToHash);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(wheelTimer);
      resume(); resize.disconnect();
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", commit);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("hashchange", jumpToHash);
      el.removeAttribute("data-snap-ready");
    };
  }, []);

  return <div ref={ref} className="posts-snap snap" tabIndex={0} aria-label="文章时间线，可用方向键和 PageDown 逐篇阅读">{children}</div>;
}
