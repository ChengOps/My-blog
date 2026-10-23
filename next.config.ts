import type { NextConfig } from "next";

/**
 * 默认是服务端构建（`next build` 产出 `.next/`，配 `next start` 本地预览）。
 *
 * 线上托管在 Cloudflare Pages，没有 Node 进程，需要在静态模式下构建：
 * 用 `pnpm build:static`（等价于 `NEXT_OUTPUT=static next build`），
 * 产物会进 `out/`，并额外镜像一份到 `dist/` 以便托管平台默认输出目录直接命中。
 */
const isStaticExport = process.env.NEXT_OUTPUT === "static";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingExcludes: { "/*": ["./content/posts/**/*"] },
  ...(isStaticExport
    ? {
        output: "export" as const,
        // 静态导出没有 Node 进程，next/image 的按需裁剪必须关掉。
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
