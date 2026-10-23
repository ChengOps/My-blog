import type { Metadata } from "next";
import { siteConfig } from "../../site.config";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RouteFade } from "@/components/route-fade";
import { HushToggle } from "@/components/hush-toggle";
import { pageMetadata } from "@/lib/seo";
import { ENTRANCE_STORAGE_KEY, ENTRANCE_REMEMBER_MS } from "@/lib/entrance-preference";
import "./globals.css";

export const metadata: Metadata = {
  ...pageMetadata({ title: siteConfig.title, description: siteConfig.description, path: "/" }),
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.title, template: `%s · ${siteConfig.name}` },
  authors: [{ name: siteConfig.name }],
  icons: { icon: "/site-icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `(function(){var t='dark';try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark'||s==='system')t=s;if(localStorage.getItem('hush')==='on')document.documentElement.dataset.hush='on'}catch(e){}document.documentElement.dataset.theme=t==='light'||(t==='system'&&!matchMedia('(prefers-color-scheme: dark)').matches)?'light':'dark'})()`;
  const entranceScript = `(function(){var replay=new URLSearchParams(location.search).get('intro')==='1',remembered=false;try{var raw=localStorage.getItem(${JSON.stringify(ENTRANCE_STORAGE_KEY)}),until=Number(raw),now=Date.now();remembered=raw===null?sessionStorage.getItem('hush-entry')==='entered':Number.isFinite(until)&&until>now&&until<=now+${ENTRANCE_REMEMBER_MS}}catch(e){try{remembered=sessionStorage.getItem('hush-entry')==='entered'}catch(e){}}var show=location.pathname==='/'&&(replay||!location.hash)&&(replay||!remembered);try{if(!show)sessionStorage.setItem('hush-entry','entered')}catch(e){}document.documentElement.dataset.homeEntry=show?'pending':'entered'})()`;
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `${themeScript};${entranceScript}` }} /></head>
      <body>
        <a href="#main-content" className="skip-link">跳到正文</a>
        <Header />
        <main id="main-content" className="site-main shell" tabIndex={-1}><RouteFade>{children}</RouteFade></main>
        <Footer />
        <HushToggle />
      </body>
    </html>
  );
}
