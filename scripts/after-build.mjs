/**
 * 构建收尾：把静态导出产物再复制一份到 `dist/`。
 *
 * 原因很实际——Cloudflare Pages 的项目若没有在面板里指定输出目录，
 * 会按默认值 `dist` 去找；而 `next build`（output: "export"）产出的是 `out/`。
 * 两个目录都放一份，两种配置都能命中，省掉一次面板操作。
 *
 * 只在 `out/index.html` 存在时才复制，服务端构建（NEXT_OUTPUT=server）下什么都不做。
 */
import { cp, rm, stat } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const out = join(root, "out");
const dist = join(root, "dist");

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

if (!(await exists(join(out, "index.html")))) {
  console.log("[after-build] 没有静态导出产物，跳过 dist 镜像。");
  process.exit(0);
}

await rm(dist, { recursive: true, force: true });
await cp(out, dist, { recursive: true });
console.log("[after-build] 已把 out/ 镜像到 dist/。");
