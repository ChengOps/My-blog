/**
 * 站点级配置。
 *
 * 三个 NEXT_PUBLIC_* 变量会在构建时内联进产物（canonical、Open Graph、RSS、
 * sitemap、页脚与关于页的链接都读它们），所以：
 *   1. 改了值必须重新构建，修改运行时环境变量不会生效；
 *   2. 生产构建缺少它们、或仍是占位值时直接抛错，避免把 example.com 发到线上。
 */

const isProductionBuild = typeof window === "undefined" && process.env.NODE_ENV === "production";

function required(
  name: string,
  fallback: string,
  isPlaceholder: (value: string) => boolean,
): string {
  const value = process.env[name]?.trim();

  if (!value) {
    if (isProductionBuild) {
      throw new Error(
        `[site.config] 缺少环境变量 ${name}。\n` +
          `生产构建必须有真实值，否则 canonical、RSS、sitemap 与分享卡片都会指向占位地址。\n` +
          `本地请写入 .env.local；线上请在托管平台的环境变量中配置后重新构建。`,
      );
    }
    return fallback;
  }

  if (isProductionBuild && isPlaceholder(value)) {
    throw new Error(
      `[site.config] ${name} 仍是占位值「${value}」。\n` +
        `请替换成真实值后再构建，否则站点的规范化地址会是错的。`,
    );
  }

  return value;
}

const siteUrl = required(
  "NEXT_PUBLIC_SITE_URL",
  "http://localhost:3000",
  (value) => /example\.com/i.test(value),
);

if (isProductionBuild && !/^https?:\/\//.test(siteUrl)) {
  throw new Error(
    `[site.config] NEXT_PUBLIC_SITE_URL 必须是完整地址，例如 https://xavier.notes，当前为「${siteUrl}」。`,
  );
}

const contactEmail = required(
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "hello@example.com",
  (value) => /@example\.(com|org|net)$/i.test(value),
);

const githubUrl = required(
  "NEXT_PUBLIC_GITHUB_URL",
  "https://github.com/",
  (value) => /your-username/i.test(value),
);

export const siteConfig = {
  title: "Xavier · 思考与构建",
  name: "Xavier",
  description: "关于前端、AI 与阅读的长期笔记。记录实践，也记录尚未想明白的问题。",
  url: siteUrl,
  locale: "zh_CN",
  avatar: "/avatar.jpg",
  email: contactEmail,
  social: {
    github: githubUrl,
  },
  /**
   * 留言板（Giscus，基于 GitHub Discussions）。
   * 四个值都在 https://giscus.app 页面填仓库后生成，均为公开信息，可以进仓库。
   * 任一项为空时，留言页只显示一段说明，不会报错——这是静态托管下的正常状态。
   */
  giscus: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO?.trim() ?? "",
    repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID?.trim() ?? "",
    category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY?.trim() || "Announcements",
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID?.trim() ?? "",
  },
} as const;
