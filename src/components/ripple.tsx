"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { revealRoute, routeOrigin } from "@/lib/route-transition";

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
    let pointer: { x: number; y: number } | undefined;

    function rememberPointer(event: PointerEvent) {
      pointer = event.isPrimary && event.button === 0 ? { x: event.clientX, y: event.clientY } : undefined;
    }

    function clearPointer() { pointer = undefined; }

    function removeRipple(node: HTMLSpanElement) {
      ripples.delete(node);
      node.remove();
    }

    function clearPressed() {
      clearPointer();
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

    function createRipple(element: HTMLElement, event: MouseEvent, point?: { x: number; y: number }) {
      if (media.matches) return;
      // Keep at most one wave per control during rapid repeated activation.
      for (const node of ripples) if (node.parentElement === element) removeRipple(node);
      const bounds = element.getBoundingClientRect();
      const origin = routeOrigin(event, element, point);
      const x = origin.x - bounds.left;
      const y = origin.y - bounds.top;
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
      const point = pointer;
      clearPointer();
      if (!(event.target instanceof Element) || event.button !== 0) return;
      let target = event.target;
      // Native root snapshots receive pointer hits while their contents are captured.
      // Resolve a second navigation click against the persistent header's live bounds.
      if (target === document.documentElement && document.documentElement.hasAttribute("data-route-reveal")) {
        const link = Array.from(document.querySelectorAll<HTMLAnchorElement>(".site-header a[href]")).find((anchor) => {
          const rect = anchor.getBoundingClientRect();
          const x = point?.x ?? event.clientX, y = point?.y ?? event.clientY;
          return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        });
        if (link) target = link;
      }
      const control = target.closest<HTMLElement>(rippleTargets);
      if (control && !control.matches(":disabled, [aria-disabled='true']")) createRipple(control, event, point);
      const card = target.closest<HTMLElement>(".post-row");
      const titleLink = card?.querySelector<HTMLAnchorElement>(".post-title a");
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      const link = anchor ?? titleLink;
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (target.closest("button, input, textarea, select, [contenteditable='true']")) return;
      if (link.target && link.target !== "_self" || link.hasAttribute("download") || link.origin !== location.origin) return;
      if (link.pathname === location.pathname || /\.[a-z0-9]+$/i.test(link.pathname)) return;
      if (window.getSelection()?.toString()) return;
      event.preventDefault();
      cancelNavigation();
      const href = `${link.pathname}${link.search}${link.hash}`;
      const origin = routeOrigin(event, link, point);
      const navigate = () => revealRoute(link.pathname, () => router.push(href), origin);
      if (!card || anchor && anchor !== titleLink) { navigate(); return; }
      if (media.matches) { router.push(href); return; }
      activeCard = card;
      pendingHref = href;
      card.setAttribute("data-navigating", "");
      const delay = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dur-route"));
      routeTimer = window.setTimeout(() => {
        pendingHref = undefined;
        routeTimer = undefined;
        navigate();
      }, delay);
    }

    function onKeyDown(event: KeyboardEvent) {
      clearPointer();
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

    document.addEventListener("pointerdown", rememberPointer, true);
    document.addEventListener("pointerup", rememberPointer, true);
    document.addEventListener("pointercancel", clearPointer, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", clearPressed, true);
    window.addEventListener("blur", clearPressed);
    media.addEventListener("change", onMotionChange);
    return () => {
      document.removeEventListener("pointerdown", rememberPointer, true);
      document.removeEventListener("pointerup", rememberPointer, true);
      document.removeEventListener("pointercancel", clearPointer, true);
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
