const paths = {
  1: [
    "M0 4 C133 4 267 2.8 400 4",
    "M400 4 C533 5.2 667 5 800 4",
    "M800 4 C933 3 1067 4 1200 4",
  ],
  2: [
    "M0 4 C133 4 267 5.1 400 4",
    "M400 4 C533 2.9 667 3.2 800 4",
    "M800 4 C933 4.8 1067 4 1200 4",
  ],
  3: [
    "M0 4 C133 4 267 3.2 400 4",
    "M400 4 C533 4.8 667 5.2 800 4",
    "M800 4 C933 2.8 1067 4 1200 4",
  ],
};

export function HairlineRule({ variant = 1 }: { variant?: 1 | 2 | 3 }) {
  return (
    <svg className="hairline-rule" viewBox="0 0 1200 8" preserveAspectRatio="none" width="100%" height="6" aria-hidden="true" focusable="false">
      {paths[variant].map((d) => (
        <path key={d} d={d} stroke="var(--border)" fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
