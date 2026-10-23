/**
 * 静态构建：给 Cloudflare Pages 这类托管平台用。
 *
 * 做两件事：
 *   1. 以 NEXT_OUTPUT=static 跑 `next build`，产物进 `out/`；
 *   2. 把 `out/` 镜像一份到 `dist/`，因为平台若没在面板里指定输出目录，
 *      默认会去找 `dist`。两个目录都在，哪种配置都能命中。
 *
 * 用 Node 而不是 shell 的 `A=1 cmd` 写法，是因为 Windows 的 cmd 不支持那种语法，
 * 而你在本机直接敲 `pnpm build:static` 时同样要能跑通。
 */
import { spawnSync } from "node:child_process";
import { cp, rm, stat } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");

const build = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_OUTPUT: "static" },
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const out = join(root, "out");
const dist = join(root, "dist");

const hasIndex = await stat(join(out, "index.html")).then(
  () => true,
  () => false,
);

if (!hasIndex) {
  console.error("[build:static] 没有找到 out/index.html，跳过 dist 镜像。");
  process.exit(1);
}

await rm(dist, { recursive: true, force: true });
await cp(out, dist, { recursive: true });
console.log("[build:static] 已把 out/ 镜像到 dist/。");
