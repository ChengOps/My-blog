export function ArticleGlyph({ slug, size = 26 }: { slug: string; size?: number }) {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(slug)) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  let state = hash || 0x9e3779b9;
  function next() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  }

  const cells: { row: number; column: number; color: string }[] = [];
  for (let row = 0; row < 5; row++) {
    for (let column = 0; column < 3; column++) {
      if (next() % 5 >= 3) continue;
      const color = next() & 1 ? "var(--accent)" : "var(--secondary)";
      cells.push({ row, column, color });
      if (column !== 2) cells.push({ row, column: 4 - column, color });
    }
  }

  return (
    <svg className="article-glyph" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      {cells.map(({ row, column, color }) => (
        <rect key={`${row}-${column}`} x={column * 20.5} y={row * 20.5} width="18" height="18" rx="3" fill={color} />
      ))}
    </svg>
  );
}
