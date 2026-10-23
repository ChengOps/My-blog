import { useEffect, useRef, type MouseEvent } from "react";

export function useClickSparks() {
  const nodes = useRef(new Set<HTMLSpanElement>());
  useEffect(() => () => { nodes.current.forEach((node) => node.remove()); nodes.current.clear(); }, []);
  return (event: MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof Element) || event.target.closest("button, a, input, select, label")
      || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.hush === "on") return;
    const host = event.currentTarget;
    const bounds = host.getBoundingClientRect();
    if (nodes.current.size >= 5) { const oldest = nodes.current.values().next().value; if (oldest) { oldest.remove(); nodes.current.delete(oldest); } }
    const node = document.createElement("span");
    node.className = "arcade-spark"; node.setAttribute("aria-hidden", "true");
    node.style.setProperty("--spark-x", `${event.clientX - bounds.left}px`);
    node.style.setProperty("--spark-y", `${event.clientY - bounds.top}px`);
    const cleanup = () => { node.remove(); nodes.current.delete(node); };
    node.addEventListener("animationend", cleanup, { once: true }); node.addEventListener("animationcancel", cleanup, { once: true });
    nodes.current.add(node); host.appendChild(node);
  };
}
