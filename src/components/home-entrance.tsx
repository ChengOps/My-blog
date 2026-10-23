"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { siteConfig } from "../../site.config";
import { createEntranceMorph } from "./entrance-morph";
import { rememberEntrance } from "@/lib/entrance-preference";

export function HomeEntrance({ children }: { children: ReactNode }) {
  const coverRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const enterRef = useRef<() => void>(() => {});
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (!coverRef.current || root.dataset.homeEntry !== "pending") { setVisible(false); return; }
    const background = [contentRef.current, document.querySelector<HTMLElement>(".site-header"),
      document.querySelector<HTMLElement>(".site-footer")];
    const previousInert = background.map((element) => element?.inert ?? false);
    background.forEach((element) => { if (element) element.inert = true; });
    const morph = createEntranceMorph(coverRef.current, contentRef.current!);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let active = true, progress = 0, target = 0, frame = 0, previousTime = 0;
    let automatic: { start: number; from: number; duration: number } | undefined;
    let touch: { x: number; y: number; lastY: number } | undefined;
    const quiet = () => media.matches || root.dataset.hush === "on";
    const distance = () => Math.max(320, Math.min(720, window.innerHeight * 0.65));

    function restore() {
      background.forEach((element, index) => { if (element) element.inert = previousInert[index]; });
    }

    function finish() {
      if (!active) return;
      active = false;
      window.cancelAnimationFrame(frame);
      root.dataset.homeEntry = "entered";
      morph.dispose();
      root.style.removeProperty("--entry-progress");
      rememberEntrance();
      const url = new URL(window.location.href);
      if (url.searchParams.get("intro") === "1") {
        url.searchParams.delete("intro");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
      restore();
      setVisible(false);
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }

    function paint(time: number) {
      frame = 0;
      if (!active) return;
      const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
      previousTime = time;
      if (automatic) {
        if (!automatic.start) automatic.start = time;
        const fraction = Math.min(1, (time - automatic.start) / automatic.duration);
        progress = automatic.from + (1 - automatic.from) * (1 - Math.pow(1 - fraction, 3));
        target = progress;
        if (fraction === 1) { finish(); return; }
      } else {
        // A short frame-rate-independent catch-up softens discrete mouse-wheel ticks.
        progress += (target - progress) * (1 - Math.exp(-elapsed / 55));
        if (Math.abs(target - progress) < 0.0001) progress = target;
        if (progress === 1) { finish(); return; }
      }
      root.style.setProperty("--entry-progress", String(progress));
      morph.draw(progress);
      root.dataset.homeEntry = progress === 0 ? "pending" : "leaving";
      if (automatic || progress !== target) frame = window.requestAnimationFrame(paint);
      else previousTime = 0;
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(paint);
    }

    function move(delta: number) {
      if (!active || delta === 0) return;
      if (quiet()) { if (delta > 0) finish(); return; }
      if (automatic) { automatic = undefined; target = progress; }
      target = Math.max(0, Math.min(1, target + delta / distance()));
      schedule();
    }

    function enter() {
      if (!active || automatic) return;
      if (quiet()) { finish(); return; }
      const value = getComputedStyle(root).getPropertyValue("--dur-slow").trim();
      const duration = Number.parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
      automatic = { start: 0, from: progress, duration: duration * (1 - progress) };
      previousTime = 0;
      schedule();
    }

    function onWheel(event: WheelEvent) {
      if (!active || event.ctrlKey || event.metaKey || event.deltaY === 0) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      move(event.deltaY * unit);
    }

    function onTouchStart(event: TouchEvent) {
      if (!active) return;
      const point = event.touches.length === 1 ? event.touches[0] : undefined;
      touch = point ? { x: point.clientX, y: point.clientY, lastY: point.clientY } : undefined;
    }

    function onTouchMove(event: TouchEvent) {
      if (!active || !touch || event.touches.length !== 1) return;
      const point = event.touches[0];
      if (Math.abs(point.clientY - touch.y) <= Math.abs(point.clientX - touch.x)) return;
      event.preventDefault();
      move(touch.lastY - point.clientY);
      touch.lastY = point.clientY;
    }

    function onTouchEnd() { touch = undefined; }

    function onKeyDown(event: KeyboardEvent) {
      if (!active || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (event.key === "Tab") { event.preventDefault(); buttonRef.current?.focus(); }
      const step = { ArrowDown: 0.15, ArrowUp: -0.15, PageDown: 0.6, PageUp: -0.6 }[event.key];
      if (step !== undefined) { event.preventDefault(); move(step * distance()); }
    }

    function motionChanged() {
      if (active && quiet() && (target > 0 || automatic)) finish();
    }

    enterRef.current = enter;
    const observer = new MutationObserver(motionChanged);
    observer.observe(root, { attributes: true, attributeFilter: ["data-hush"] });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    media.addEventListener("change", motionChanged);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      morph.dispose();
      restore();
      root.style.removeProperty("--entry-progress");
      root.dataset.homeEntry = window.location.pathname !== "/" || !active ? "entered" : "pending";
      enterRef.current = () => {};
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      document.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", motionChanged);
    };
  }, []);

  return (
    <>
      {visible && <section ref={coverRef} className="home-entry" role="dialog" aria-modal="true" aria-labelledby="entry-title">
        <div className="entry-top"><span>{siteConfig.name}.</span><span>个人技术笔记 · 自 2026</span></div>
        <div className="entry-scene">
          <div>
            <p className="eyebrow">前端 / AI / 阅读</p>
            <div className="entry-title-stack">
              <h1 id="entry-title"><span className="entry-title-character"><span className="entry-word-out">让</span><span className="entry-word-in" aria-hidden="true">把</span></span>好奇心，<br />
                <span className="entry-title-line"><span className="entry-word-out">慢慢生长。</span><span className="entry-word-in" aria-hidden="true">写成下一行。</span></span>
              </h1>
            </div>
            <p className="entry-description">在代码与书页之间，留一点安静。</p>
          </div>
          <Image className="entry-illustration" src="/illustrations/window-desk.webp" alt="" width={672} height={384} sizes="(max-width: 640px) 200px, 360px" />
        </div>
        <div className="entry-bottom">
          <button ref={buttonRef} type="button" className="entry-button" onClick={() => enterRef.current()}>进入笔记 <span aria-hidden="true">↓</span></button>
          <p>点击进入，或<span className="entry-scroll-hint">向下滚动</span><span className="entry-swipe-hint">向上滑动</span></p>
        </div>
      </section>}
      <div ref={contentRef} className="home-entry-content">{children}</div>
    </>
  );
}
