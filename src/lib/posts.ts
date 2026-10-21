import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { validateMetadata, type PostMetadata } from "./frontmatter.ts";

export type Post = PostMetadata & { slug: string; content: string; readingMinutes: number };
const contentDirectory = path.join(process.cwd(), "content/posts");

export function readingMinutes(content: string): number {
  const text = content.replace(/<[^>]*>/g, " ");
  const characters = text.match(/\p{Script=Han}/gu)?.length ?? 0;
  const words = text.replace(/\p{Script=Han}/gu, " ").match(/[a-zA-Z0-9]+/g)?.length ?? 0;
  return Math.max(1, Math.ceil(characters / 350 + words / 200));
}

export function getPosts(directory = contentDirectory): Post[] {
  const slugs = new Set<string>();
  return readdirSync(directory).filter((file) => /\.mdx?$/.test(file)).flatMap((file) => {
    const slug = file.replace(/\.mdx?$/, "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${file}: use a lowercase kebab-case slug`);
    if (slugs.has(slug)) throw new Error(`${file}: duplicate slug "${slug}"`);
    slugs.add(slug);
    const { data, content } = matter(readFileSync(path.join(directory, file), "utf8"));
    const metadata = validateMetadata(data, file);
    if (metadata.draft) return [];
    return [{ ...metadata, slug, content, readingMinutes: readingMinutes(content) }];
  }).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((post) => post.slug === slug);
}

export function getTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of getPosts()) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-CN"));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
