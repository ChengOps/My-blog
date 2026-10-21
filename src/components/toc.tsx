import type { TocEntry } from "@/lib/headings";

export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  if (!entries.length) return null;
  return (
    <aside className="toc">
      <details open>
        <summary>本篇目录</summary>
        <nav aria-label="文章目录">
          <ol>{entries.map((entry) => (
            <li key={entry.id} className={entry.level === 3 ? "toc-subheading" : undefined}>
              <a href={`#${encodeURIComponent(entry.id)}`}>{entry.text}</a>
            </li>
          ))}</ol>
        </nav>
      </details>
    </aside>
  );
}
