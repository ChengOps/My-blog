import type { Metadata } from "next";
import { siteConfig } from "../../site.config";

type PageInfo = { title: string; description: string; path: string; date?: string; tags?: string[] };

export function pageMetadata({ title, description, path, date, tags }: PageInfo): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      types: { "application/rss+xml": [{ url: "/feed.xml", title: `${siteConfig.name} 的博客订阅` }] },
    },
    openGraph: {
      title, description, url: path, siteName: siteConfig.title, locale: siteConfig.locale,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.title }],
      ...(date ? { type: "article", publishedTime: `${date}T00:00:00Z`, authors: [siteConfig.name], tags } : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  };
}
