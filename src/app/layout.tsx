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
  icons: { icon: "/site-icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `(function(){var t='dark';try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark'||s==='system')t=s}catch(e){}document.documentElement.dataset.theme=t==='light'||(t==='system'&&!matchMedia('(prefers-color-scheme: dark)').matches)?'light':'dark'})()`;
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
