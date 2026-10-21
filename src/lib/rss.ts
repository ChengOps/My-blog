import type { Post } from "./posts.ts";

export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

type FeedSite = { title: string; description: string; url: string; name: string };

export function createRss(posts: Post[], site: FeedSite): string {
  const origin = site.url.replace(/\/$/, "");
  const items = posts.filter((post) => !post.draft).map((post) => {
    const url = `${origin}/posts/${post.slug}`;
    return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><description>${escapeXml(post.summary)}</description><pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("")}</item>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(site.title)}</title><link>${escapeXml(origin)}</link><description>${escapeXml(site.description)}</description><language>zh-CN</language><atom:link href="${escapeXml(origin)}/feed.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
}
