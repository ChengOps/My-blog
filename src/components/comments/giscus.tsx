"use client";

import { useEffect, useRef } from "react";
import { siteConfig } from "../../../site.config";

const GISCUS_ORIGIN = "https://giscus.app";

function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark_dimmed";
}

/**
 * 留言板：Giscus（GitHub Discussions）。
 *
 * 静态导出没有服务端，原来的 /api/comments 不可用，这里改由第三方托管评论。
 * 四项配置任一为空时只渲染一段说明——不让访客看到一段报错。
 */
export function GiscusBoard({ term }: { term: string }) {
  const host = useRef<HTMLDivElement>(null);
  const { repo, repoId, category, categoryId } = siteConfig.giscus;
  const configured = Boolean(repo && repoId && categoryId);

  useEffect(() => {
    if (!configured || !host.current) return;

    const script = document.createElement("script");
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", term);
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", currentTheme());
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");
    host.current.appendChild(script);

    // 站内切换深浅色时，把新的主题推给已加载的 iframe。
    const observer = new MutationObserver(() => {
      const frame = host.current?.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
      frame?.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: currentTheme() } } },
        GISCUS_ORIGIN,
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
      const loaded = host.current?.querySelector("script");
      loaded?.remove();
    };
  }, [configured, repo, repoId, category, categoryId, term]);

  if (!configured) {
    return (
      <div className="giscus-board giscus-board--pending">
        <p>留言板还没接通。</p>
        <p className="giscus-board__hint">
          填好 <code>site.config.ts</code> 里的 giscus 四项（仓库、仓库 ID、分类、分类 ID）后重新构建即可。
        </p>
      </div>
    );
  }

  return <div className="giscus-board" ref={host} />;
}
