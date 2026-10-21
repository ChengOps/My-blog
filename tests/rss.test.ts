import assert from "node:assert/strict";
import { test } from "node:test";
import { createRss, escapeXml } from "../src/lib/rss.ts";

test("RSS escapes XML, emits absolute URLs and UTC dates, and excludes drafts", () => {
  const post = { title: '标题 <&> "测试"', summary: "摘要 & 内容", date: "2026-10-01", tags: ["A&B"], draft: false, slug: "hello", content: "正文", readingMinutes: 1 };
  const feed = createRss([post, { ...post, draft: true, title: "PRIVATE_DRAFT" }], { title: "博客", description: "描述", name: "Hush", url: "https://example.com/" });
  assert.ok(feed.includes("标题 &lt;&amp;&gt; &quot;测试&quot;"));
  assert.ok(feed.includes("https://example.com/posts/hello"));
  assert.ok(feed.includes("Thu, 01 Oct 2026 00:00:00 GMT"));
  assert.ok(!feed.includes("PRIVATE_DRAFT"));
  assert.equal(escapeXml("'"), "&apos;");
});
