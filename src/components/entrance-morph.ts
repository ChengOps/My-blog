type Pair = { source: HTMLElement; target: HTMLElement; title?: boolean };
type Motion = { source: HTMLElement; x: number; y: number; scale: number };

const smooth = (value: number) => {
  const bounded = Math.max(0, Math.min(1, value));
  return bounded * bounded * (3 - 2 * bounded);
};

export function createEntranceMorph(cover: HTMLElement, content: HTMLElement) {
  const root = document.documentElement;
  const pairs: Pair[] = [];
  for (const [from, to, title] of [
    [".entry-title-stack", "#intro-title", true],
    [".entry-illustration", ".hero-illustration", false],
  ] as const) {
    const source = cover.querySelector<HTMLElement>(from);
    const target = content.querySelector<HTMLElement>(to);
    if (source && target) pairs.push({ source, target, title });
  }
  let motions: Motion[] = [];
  let progress = 0;
  let disposed = false;

  function draw(value: number) {
    progress = value;
    const amount = smooth(value);
    for (const motion of motions) {
      motion.source.style.transform = `translate3d(${motion.x * amount}px, ${motion.y * amount}px, 0) scale(${1 + (motion.scale - 1) * amount})`;
    }
    root.style.setProperty("--entry-reveal", String(smooth((value - 0.28) / 0.62)));
    root.style.setProperty("--entry-word-out", String(1 - smooth((value - 0.12) / 0.22)));
    root.style.setProperty("--entry-word-in", String(smooth((value - 0.36) / 0.22)));
    root.style.setProperty("--entry-chrome", String(1 - smooth(value / 0.32)));
    root.style.setProperty("--entry-details", String(smooth((value - 0.8) / 0.18)));
  }

  function measure() {
    if (disposed) return;
    // Read natural geometry only when layout changes, never in the scroll loop.
    pairs.forEach(({ source }) => { source.style.transform = "none"; });
    motions = pairs.map(({ source, target, title }) => {
      const from = source.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const scale = title
        ? Number.parseFloat(getComputedStyle(target).fontSize) / Number.parseFloat(getComputedStyle(source).fontSize)
        : to.width / from.width;
      return { source, x: to.left - from.left, y: to.top - from.top, scale };
    });
    draw(progress);
  }

  measure();
  const resize = new ResizeObserver(measure);
  resize.observe(cover);
  resize.observe(content);
  window.addEventListener("resize", measure);
  void document.fonts.ready.then(measure);
  return {
    draw,
    dispose() {
      disposed = true;
      resize.disconnect();
      window.removeEventListener("resize", measure);
      pairs.forEach(({ source }) => source.style.removeProperty("transform"));
      ["--entry-reveal", "--entry-word-out", "--entry-word-in", "--entry-chrome", "--entry-details"].forEach((name) => root.style.removeProperty(name));
    },
  };
}
