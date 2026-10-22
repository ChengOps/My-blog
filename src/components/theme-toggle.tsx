"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
const themes: Theme[] = ["system", "light", "dark"];
const labels: Record<Theme, string> = { system: "跟随系统", light: "浅色", dark: "深色" };

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let saved: Theme = "dark";
    try {
      const value = localStorage.getItem("theme");
      if (value === "light" || value === "dark" || value === "system") saved = value;
    } catch { /* Storage can be unavailable in private browsing. */ }
    setTheme(saved);
    applyTheme(saved);
  }, []);

  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(theme);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  function cycleTheme() {
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    try { localStorage.setItem("theme", next); } catch { /* Keep the choice for this page. */ }
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button type="button" className="theme-toggle" onClick={cycleTheme}
      aria-label={`当前主题：${labels[theme]}，点击切换为${labels[themes[(themes.indexOf(theme) + 1) % themes.length]]}`}>
      <span className="theme-icons" data-theme-choice={theme} aria-hidden="true">
        <svg className="theme-icon theme-icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" /></svg>
        <svg className="theme-icon theme-icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
        <svg className="theme-icon theme-icon-system" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></svg>
      </span>
      <span className="theme-label" aria-hidden="true">{labels[theme]}</span>
    </button>
  );
}
