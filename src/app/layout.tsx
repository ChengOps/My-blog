import type { Metadata } from "next";
import { siteConfig } from "../../site.config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: siteConfig.title, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
