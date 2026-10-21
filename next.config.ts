import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingExcludes: { "/*": ["./content/posts/**/*"] },
};

export default nextConfig;
