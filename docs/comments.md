# 开放匿名留言与文章评论

页面和接口已准备好；未配置服务时，访客可以预览头像、填写昵称，但不能提交。文章依然静态生成，只有留言接口在 Vercel 服务端运行。

## 1. 创建托管存储

在 Supabase 创建项目，在 SQL Editor 执行仓库的 `supabase/comments.sql`。此脚本创建留言表、权限、审核状态与每来源每分钟一条的限制；不需要维护独立服务器。

在项目设置取得 Project URL 和服务端 secret key（也兼容旧版 service_role key）。不要使用 anon/publishable key，不要把服务端密钥发在聊天、提交 Git 或加上 `NEXT_PUBLIC_` 前缀。

## 2. 填环境变量

本地复制 `.env.example` 为 `.env.local`；生产在 Vercel → Project → Settings → Environment Variables 填写：

| 变量 | 值 |
| --- | --- |
| `SUPABASE_URL` | 项目 HTTPS URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端 secret 或 service_role key |
| `COMMENTS_IP_SALT` | 至少 32 个字符的随机秘密值 |

可以用 `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` 在本机生成 salt。配置后重启本地服务或重新部署 Vercel。数据库只保存来源的加盐摘要，不保存原始 IP；服务托管方自己的请求日志受其设置控制。

## 3. 留言、审核与回复

访客点击页脚「留言」进入 `/guestbook`，或到文章末尾评论区。填写自定义昵称，选择夜猫、月兔、小狐、书鸟、小熊、林鹿或企鹅，输入内容后提交。无需注册；昵称不是经过身份验证的账号。勾选记住选项只会在当前设备保存昵称和头像。

若已执行过旧版建表脚本，重新执行 `supabase/comments.sql` 即可扩展为七款头像；原有留言会保留。

所有提交默认 `pending`，审核后才公开。登录 Supabase → Table Editor → `blog_comments`：把可信留言的 `status` 改为 `approved`；隐藏用 `hidden`，也可以删除。页面重新加载后显示结果。

你要以站长身份回复：在 Table Editor 新增一行，填写与原留言相同的 `thread`、原留言 `id` 作为 `parent_id`、昵称 Xavier、头像 ID、回复 `body`，设置 `status = approved`、`is_author = true`。`id` 和 `created_at` 使用默认值，`client_hash` 留空。访客接口无法自行获取「作者」身份。

普通访客可点公开留言下方「回复」，回复同样需要审核。每个文章路径单独保存讨论，与留言栏互不混合。内容按纯文本显示，不解析访客 HTML。

你要发布新文章，仍在 `content/posts/` 添加 MDX，设置 `draft: false` 后提交 Git 并推送，Vercel 自动构建；不通过留言表发布文章。

## 接入后自检

用两个浏览器分别打开留言页，提交一条留言：提交者看到待审核提示，另一个浏览器看不到。后台批准后刷新，两边都能看到。测试文章评论不会出现在另一篇文章，再测试作者回复与连续提交限制。

当前仓库已做输入、接口与模拟托管响应测试；未连接你的真实 Supabase 项目，因此真实建表、权限和跨设备持久化需配置后按上述步骤复核。审核与限频用于基础防滥用，不包含验证码服务。

服务端密钥权限说明：[Supabase 官方文档](https://supabase.com/docs/guides/database/secure-data)。头像资产与生成记录见 [visitor-avatars.md](visitor-avatars.md)。
