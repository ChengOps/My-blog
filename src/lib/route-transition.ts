type Origin = { x: number; y: number };
type Reveal = { pathname: string; transition?: ViewTransition; finish: () => void; cleanup: () => void };
let active: Reveal | undefined;

export function finishRouteReveal(pathname: string) {
  if (active?.pathname === pathname) active.finish();
}

export function cancelRouteReveal() {
  if (!active) return;
  active.finish();
  active.transition?.skipTransition();
  active.cleanup();
}

export function routeOrigin(event: MouseEvent, link: HTMLElement, pointer?: Origin): Origin {
  if (pointer) return pointer;
  if (event.detail !== 0 || event.clientX !== 0 || event.clientY !== 0) return { x: event.clientX, y: event.clientY };
  const rect = link.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function revealRoute(pathname: string, navigate: () => void, origin?: Origin) {
  if (active?.pathname === pathname) return;
  cancelRouteReveal();
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const quiet = () => media.matches || root.dataset.hush === "on";
  if (typeof document.startViewTransition !== "function" || quiet()) { navigate(); return; }

  const x = Math.max(0, Math.min(innerWidth, origin?.x ?? innerWidth / 2));
  const y = Math.max(0, Math.min(innerHeight, origin?.y ?? innerHeight / 2));
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty("--route-x", `${x}px`);
  root.style.setProperty("--route-y", `${y}px`);
  root.style.setProperty("--route-radius", `${radius}px`);
  root.setAttribute("data-route-reveal", "");
  let timer = 0;
  let navigated = false;
  const onQuiet = () => {
    if (!quiet()) return;
    if (!navigated) { navigated = true; navigate(); }
    cancelRouteReveal();
  };
  const observer = new MutationObserver(onQuiet);
  const run: Reveal = { pathname, finish: () => {}, cleanup: () => {
    window.clearTimeout(timer);
    observer.disconnect(); media.removeEventListener("change", onQuiet);
    if (active !== run) return;
    active = undefined;
    root.removeAttribute("data-route-reveal");
    ["--route-x", "--route-y", "--route-radius"].forEach((name) => root.style.removeProperty(name));
  } };
  active = run;
  observer.observe(root, { attributes: true, attributeFilter: ["data-hush"] });
  media.addEventListener("change", onQuiet);
  try {
    run.transition = document.startViewTransition(() => new Promise<void>((resolve) => {
      if (active !== run) { resolve(); return; }
      run.finish = () => { window.clearTimeout(timer); resolve(); };
      // A failed or unusually slow navigation must not leave rendering suspended.
      timer = window.setTimeout(() => { run.transition?.skipTransition(); run.finish(); }, 4000);
      navigated = true;
      navigate();
    }));
    void run.transition.ready.catch(() => run.finish());
    void run.transition.finished.catch(() => {}).finally(run.cleanup);
  } catch {
    run.finish(); run.cleanup();
    if (!navigated) navigate();
  }
}
