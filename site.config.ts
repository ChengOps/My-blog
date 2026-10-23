/**
 * 站点级配置。
 *
 * NEXT_PUBLIC_* 会在构建时内联进产物（canonical、Open Graph、RSS、sitemap、
 * 页脚与关于页的链接都读它们），所以改了值必须重新构建。
 *
 * 关于缺省值的两种态度：
 *   - 站点地址是硬性的：没有它，canonical / RSS / sitemap 全是错的，宁可构建失败。
 *     但它可以由托管平台自动提供（Cloudflare Pages 的 CF_PAGES_URL 等），
 *     所以"没配环境变量"不等于"没地址"。
 *   - 联系邮箱和 GitHub 是软性的：没有它们，页面上少两个链接而已，不该挡住构建。
 */

const isProductionBuild = typeof window === "undefined" && process.env.NODE_ENV === "production";

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

/** 平台自带的地址可能不带协议，补齐后再用。 */
function withProtocol(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/**
 * 站点地址的候选顺序：显式配置优先，其次各托管平台自动注入的地址。
 * 这样在 Cloudflare Pages 上即使一个变量都没配，也能先跑起来，
 * 等绑定好域名再把 NEXT_PUBLIC_SITE_URL 填成正式地址即可。
 */
const urlCandidates: Array<[string, string]> = [
  ["NEXT_PUBLIC_SITE_URL", env("NEXT_PUBLIC_SITE_URL")],
  ["CF_PAGES_URL", env("CF_PAGES_URL")],
  ["DEPLOY_PRIME_URL", env("DEPLOY_PRIME_URL")],
  ["VERCEL_URL", env("VERCEL_URL")],
];

const configuredUrl = urlCandidates.find(([, value]) => value !== "");

const siteUrl = configuredUrl
  ? configuredUrl[0] === "NEXT_PUBLIC_SITE_URL" || /^https?:\/\//i.test(configuredUrl[1])
    ? configuredUrl[1]
    : withProtocol(configuredUrl[1])
  : "";

if (isProductionBuild && siteUrl === "") {
  throw new Error(
    `[site.config] 找不到站点地址。\n` +
      `请设置 NEXT_PUBLIC_SITE_URL（例如 https://xavier.notes）；\n` +
      `在 Cloudflare Pages 上也可以留空，构建时会自动使用 CF_PAGES_URL。`,
  );
}

if (isProductionBuild && /example\.com/i.test(siteUrl)) {
  throw new Error(
    `[site.config] NEXT_PUBLIC_SITE_URL 仍是占位值「${siteUrl}」。\n` +
      `请替换成真实地址后再构建，否则站点的规范化地址会是错的。`,
  );
}

/** 软性配置：缺失或仍是占位值时返回空串，由调用方决定要不要渲染。 */
function optional(name: string, isPlaceholder: (value: string) => boolean): string {
  const value = env(name);
  if (value === "" || isPlaceholder(value)) return "";
  return value;
}

const contactEmail = optional("NEXT_PUBLIC_CONTACT_EMAIL", (value) =>
  /@example\.(com|org|net)$/i.test(value),
);

const githubUrl = optional("NEXT_PUBLIC_GITHUB_URL", (value) => /your-username/i.test(value));

export const siteConfig = {
  title: "Xavier · 思考与构建",
  name: "Xavier",
  description: "关于前端、AI 与阅读的长期笔记。记录实践，也记录尚未想明白的问题。",
  /** 生产构建保证非空；本地开发缺省为 localhost。 */
  url: siteUrl === "" ? "http://localhost:3000" : siteUrl,
  locale: "zh_CN",
  avatar: "/avatar.jpg",
  /** 空串表示未配置，页面上不渲染对应入口。 */
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
    repo: env("NEXT_PUBLIC_GISCUS_REPO"),
    repoId: env("NEXT_PUBLIC_GISCUS_REPO_ID"),
    category: env("NEXT_PUBLIC_GISCUS_CATEGORY") || "Announcements",
    categoryId: env("NEXT_PUBLIC_GISCUS_CATEGORY_ID"),
  },
} as const;
