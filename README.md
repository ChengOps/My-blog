# Hush · 思考与构建

中文个人技术博客。Next.js 15 App Router、TypeScript strict、Tailwind CSS、Markdown / MDX；所有内容页和订阅在构建时生成，无数据库。

## 1. 本地启动

使用 **Node.js 24** 和 **pnpm 11.25.0**（可运行 `npm install -g pnpm@11.25.0`）。

```sh
pnpm install
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。先修改根目录 `site.config.ts` 中的作者、站点标题、描述、正式域名、头像和社交链接；头像默认使用内置字母图，不请求第三方服务。

## 2. 写一篇文章

在 `content/posts/` 新建 `my-first-post.mdx`（也支持 `.md`）。文件名就是 URL slug，只使用小写英文字母、数字和短横线。

```mdx
---
title: '我的第一篇文章'
date: '2026-10-21'
summary: '用一两句话说明这篇文章值得阅读的原因。'
tags: ['前端', '随笔']
draft: false
---

这是正文。日期用引号包裹，采用 YYYY-MM-DD 格式。

## 一个小标题

二、三级标题会自动进入目录。支持 GFM 表格、引用与带语言名称的代码块。
```

设置 `draft: true` 保存草稿；草稿不生成详情页、标签、列表、RSS 或 sitemap，也不会复制文章源文件到部署产物。缺失必填字段、非法日期、重复 slug 会让构建失败。阅读时长同时估算中文字符与英文单词。

图片放入 `public/images/`，正文使用 `<Image src="/images/example.png" alt="具体描述图片内容" width="1200" height="800" />`，填写真实宽高。Markdown 图片也通过 `next/image` 渲染，默认预留 1200 × 675 的尺寸；非 16:9 图片优先使用显式尺寸。外链图片需要在 `next.config.ts` 中声明可信 `images.remotePatterns`。MDX 仅从仓库读取，请只接受可信作者的内容。

## 3. 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

将此仓库推送到你的 GitHub / GitLab / Bitbucket，在上方入口导入仓库并点击 **Deploy**。Vercel 会读取 `vercel.json`、Node 版本与 pnpm 锁文件，无须配置数据库或密钥。以后提交文章并推送到关联的生产分支，就会自动构建发布。

上线前把 `site.config.ts` 的 `url` 从 `https://example.com` 改为正式域名并重新部署，它决定 canonical、Open Graph、RSS 和 sitemap 中的地址。当前按钮进入 Vercel 导入流程；关联真实 Git 仓库后，你也可以在 Vercel 项目中生成针对该仓库的克隆部署按钮。

## 验证与结构

```sh
pnpm lint          # 包括 Next.js 规则；任何警告视为失败
pnpm typecheck
pnpm test          # 元数据、排序、草稿、中文锚点与 RSS
pnpm build         # 生产静态生成
pnpm start         # 查看生产版本
pnpm verify:drafts # 临时插入草稿、构建、扫描产物，最后删除测试草稿
pnpm verify:routes # pnpm start 运行时，检查全部静态路由（含中文标签）
```

```text
site.config.ts     站点唯一配置入口
content/posts/     Markdown / MDX 内容
src/app/           页面、feed.xml、sitemap、robots 和 OG 图片
src/components/    导航、主题、文章列表、目录和图片组件
src/lib/           内容校验、读取、MDX 渲染与 SEO
src/styles/        布局和正文排版
tests/             Node 内置测试，无额外测试框架
```

RSS：`/feed.xml`；站点地图：`/sitemap.xml`。主题按钮依次切换“跟随系统 → 浅色 → 深色”，选择保存在浏览器本地。375px 下代码与宽表格在容器内横向滚动，页面本身保持正常阅读宽度。

标签保留中文展示，URL 采用稳定的 ASCII 转义（例如 `/tags/_E5_89_8D_E7_AB_AF`），规避 Next.js 15 的 Unicode 静态路径匹配问题。链接、canonical 与 sitemap 使用同一个转换函数，无须手动维护标签映射。

Lighthouse 应在 `pnpm build && pnpm start` 的生产版本上验收，并在正式域名部署后复测；本地测量不能保证不同托管环境与设备始终得到相同分数。
