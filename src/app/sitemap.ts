import type { MetadataRoute } from "next";
import { siteConfig } from "../../site.config";
import { getPosts, getTags } from "@/lib/posts";
import { tagPath } from "@/lib/urls";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteConfig.url.replace(/\/$/, "");
  const posts = getPosts();
  const latestDate = posts[0] ? new Date(`${posts[0].date}T00:00:00Z`) : undefined;
  return [
    ...["", "/posts", "/about"].map((path) => ({ url: `${origin}${path}`, lastModified: latestDate })),
    ...posts.map((post) => ({ url: `${origin}/posts/${post.slug}`, lastModified: new Date(`${post.date}T00:00:00Z`) })),
    ...getTags().map(({ tag }) => ({ url: `${origin}${tagPath(tag)}`, lastModified: latestDate })),
  ];
}
