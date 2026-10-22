"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const rippleTargets = "button, .nav-link, .pill";
const keyboardTargets = `${rippleTargets}, .post-title a`;

export function Ripple() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const ripples = new Set<HTMLSpanElement>();
    const pressed = new Set<HTMLElement>();
    let routeTimer: number | undefined;
    let pendingHref: string | undefined;
    let activeCard: HTMLElement | undefined;

    function removeRipple(node: HTMLSpanElement) {
      ripples.delete(node);
      node.remove();
    }

    function clearPressed() {
      pressed.forEach((element) => element.classList.remove("is-key-pressed"));
      pressed.clear();
    }

    function cancelNavigation() {
      window.clearTimeout(routeTimer);
      routeTimer = undefined;
      pendingHref = undefined;
      activeCard?.removeAttribute("data-navigating");
      activeCard = undefined;
    }

    function createRipple(element: HTMLElement, event: MouseEvent) {
      if (media.matches) return;
      // Keep at most one wave per control during rapid repeated activation.
      for (const node of ripples) if (node.parentElement === element) removeRipple(node);
      const bounds = element.getBoundingClientRect();
      const x = event.detail === 0 ? bounds.width / 2 : event.clientX - bounds.left;
      const y = event.detail === 0 ? bounds.height / 2 : event.clientY - bounds.top;
      const diameter = 2 * Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y));
      const node = document.createElement("span");
      node.className = "ripple";
      node.setAttribute("aria-hidden", "true");
      node.style.setProperty("--rx", `${x}px`);
      node.style.setProperty("--ry", `${y}px`);
      node.style.setProperty("--ripple-size", `${diameter}px`);
      node.addEventListener("animationend", () => removeRipple(node), { once: true });
      node.addEventListener("animationcancel", () => removeRipple(node), { once: true });
      ripples.add(node);
      element.appendChild(node);
    }

    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element) || event.button !== 0) return;
      const target = event.target;
      const control = target.closest<HTMLElement>(rippleTargets);
      if (control && !control.matches(":disabled, [aria-disabled='true']")) createRipple(control, event);
      const card = target.closest<HTMLElement>(".post-row");
      const link = card?.querySelector<HTMLAnchorElement>(".post-title a");
      if (!card || !link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (target.closest("a") && target.closest("a") !== link) return;
      if (target.closest("button, input, textarea, select, [contenteditable='true']")) return;
      if (link.target && link.target !== "_self" || link.hasAttribute("download") || link.origin !== location.origin) return;
      if (window.getSelection()?.toString()) return;
      event.preventDefault();
      cancelNavigation();
      const href = `${link.pathname}${link.search}${link.hash}`;
      if (media.matches) { router.push(href); return; }
      activeCard = card;
      pendingHref = href;
      card.setAttribute("data-navigating", "");
      const delay = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dur-route"));
      routeTimer = window.setTimeout(() => {
        pendingHref = undefined;
        routeTimer = undefined;
        router.push(href);
      }, delay);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!(event.target instanceof Element) || !["Enter", " "].includes(event.key)) return;
      const control = event.target.closest<HTMLElement>(keyboardTargets);
      if (!control || control.matches(":disabled, [aria-disabled='true']")) return;
      if (event.repeat) {
        if (event.key === " " && control instanceof HTMLAnchorElement) event.preventDefault();
        return;
      }
      if (!media.matches) {
        const element = control.closest<HTMLElement>(".post-title")?.closest<HTMLElement>(".post-row") ?? control;
        pressed.add(element);
        element.classList.add("is-key-pressed");
      }
      if (event.key === " " && control instanceof HTMLAnchorElement) {
        event.preventDefault();
        control.click();
      }
    }

    function onMotionChange() {
      if (media.matches) {
        ripples.forEach(removeRipple);
        clearPressed();
        if (pendingHref) {
          const href = pendingHref;
          cancelNavigation();
          router.push(href);
        }
      }
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", clearPressed, true);
    window.addEventListener("blur", clearPressed);
    media.addEventListener("change", onMotionChange);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", clearPressed, true);
      window.removeEventListener("blur", clearPressed);
      media.removeEventListener("change", onMotionChange);
      ripples.forEach(removeRipple);
      clearPressed();
      cancelNavigation();
    };
  }, [pathname, router]);

  return null;
}
