import Link from "next/link";
import { getPosts, getTags } from "@/lib/posts";
import { tagPath } from "@/lib/urls";

export function TagFilter({ active }: { active?: string }) {
  return (
    <nav className="filter-bar" aria-label="按标签筛选文章">
      <Link href="/posts" className="pill" aria-current={!active ? "page" : undefined}>全部 <span>{getPosts().length}</span></Link>
      {getTags().map(({ tag, count }) => (
        <Link key={tag} className="pill" href={tagPath(tag)} aria-current={tag === active ? "page" : undefined}>{tag} <span>{count}</span></Link>
      ))}
    </nav>
  );
}
