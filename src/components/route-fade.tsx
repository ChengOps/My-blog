"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cancelRouteReveal, finishRouteReveal } from "@/lib/route-transition";

export function RouteFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const firstMount = useRef(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (document.documentElement.hasAttribute("data-route-reveal")) contentRef.current?.setAttribute("data-route-native", "");
    finishRouteReveal(pathname);
  }, [pathname]);
  useEffect(() => cancelRouteReveal, []);

  useEffect(() => {
    firstMount.current = false;
  }, []);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [pathname]);

  return <div ref={contentRef} key={pathname} className="route-fade" data-route-enter={firstMount.current ? undefined : "true"}>{children}</div>;
}
