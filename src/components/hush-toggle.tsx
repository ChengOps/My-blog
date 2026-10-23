"use client";

import { useEffect, useRef, useState } from "react";

export function toggleHush() {
  document.dispatchEvent(new Event("hush:toggle"));
}

export function HushButton() {
  const [quiet, setQuiet] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setQuiet(root.dataset.hush === "on");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-hush"] });
    return () => observer.disconnect();
  }, []);
  return (
    <button type="button" className="hush-button" onClick={toggleHush} aria-pressed={quiet}>
      {quiet ? "取消静音" : <>静音<span className="hush-hint"> (H)</span></>}
    </button>
  );
}

export function HushToggle() {
  const noticeRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: number | undefined;
    let clearTimer: number | undefined;

    function clearTimers() {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "h" || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
        || event.repeat || event.isComposing || event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea"))) return;

      event.preventDefault();
      toggle();
    }

    function toggle() {
      const root = document.documentElement;
      const quiet = root.dataset.hush !== "on";
      if (quiet) root.dataset.hush = "on";
      else delete root.dataset.hush;
      try {
        if (quiet) localStorage.setItem("hush", "on");
        else localStorage.removeItem("hush");
      } catch { /* Keep the preference for this page if storage is unavailable. */ }

      clearTimers();
      setMessage(quiet ? "已安静" : "已恢复");
      setVisible(true);
      const notice = noticeRef.current;
      if (!notice) return;
      const holdValue = getComputedStyle(notice).getPropertyValue("--hush-notice-duration").trim();
      const hold = Number.parseFloat(holdValue) * (holdValue.endsWith("ms") ? 1 : 1000);
      hideTimer = window.setTimeout(() => {
        setVisible(false);
        const fade = Number.parseFloat(getComputedStyle(notice).transitionDuration) * 1000;
        clearTimer = window.setTimeout(() => setMessage(""), fade);
      }, hold);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("hush:toggle", toggle);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("hush:toggle", toggle);
      clearTimers();
    };
  }, []);

  return (
    <div ref={noticeRef} className="hush-notice" role="status" aria-live="polite" aria-atomic="true"
      data-visible={visible ? "true" : undefined}>{message}</div>
  );
}
