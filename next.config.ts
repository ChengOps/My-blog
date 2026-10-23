import type { NextConfig } from "next";

/**
 * 默认是静态导出（`next build` 产出 `out/`），因为线上托管在
 * Cloudflare Pages，没有 Node 进程可用。
 *
 * 本地要跑 `next start` 预览时，用 `NEXT_OUTPUT=server pnpm build`
 * 切回服务端构建（产出 `.next/`）。`启动博客.cmd` 会自动带上这个开关。
 */
const isServerBuild = process.env.NEXT_OUTPUT === "server";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingExcludes: { "/*": ["./content/posts/**/*"] },
  ...(isServerBuild
    ? {}
    : {
        output: "export" as const,
        // 静态导出没有 Node 进程，next/image 的按需裁剪必须关掉。
        images: { unoptimized: true },
      }),
};

export default nextConfig;
