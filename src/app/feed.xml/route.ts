import { siteConfig } from "../../../site.config";
import { getPosts } from "@/lib/posts";
import { createRss } from "@/lib/rss";

export const dynamic = "force-static";

export function GET() {
  return new Response(createRss(getPosts(), siteConfig), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
