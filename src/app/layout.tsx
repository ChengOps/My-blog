import type { Metadata } from "next";
import { siteConfig } from "../../site.config";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { pageMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  ...pageMetadata({ title: siteConfig.title, description: siteConfig.description, path: "/" }),
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.title, template: `%s · ${siteConfig.name}` },
  authors: [{ name: siteConfig.name }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.dataset.theme=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})()`;
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <a href="#main-content" className="skip-link">跳到正文</a>
        <Header />
        <main id="main-content" className="site-main shell" tabIndex={-1}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
