import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { validateMetadata } from "../src/lib/frontmatter.ts";
import { getPosts, readingMinutes } from "../src/lib/posts.ts";
import { createHeadingId } from "../src/lib/headings.ts";

const valid = { title: "测试文章", date: "2026-10-01", summary: "文章摘要", tags: ["前端"], draft: false };

test("frontmatter rejects missing fields and invalid types", () => {
  for (const field of Object.keys(valid)) {
    const data: Record<string, unknown> = { ...valid };
    delete data[field];
    assert.throws(() => validateMetadata(data, "test"), new RegExp(field));
  }
  for (const patch of [{ title: " " }, { tags: "前端" }, { tags: [5] }, { draft: "false" }]) {
    assert.throws(() => validateMetadata({ ...valid, ...patch }, "test"));
  }
});

test("dates must be real calendar dates and use YYYY-MM-DD", () => {
  for (const date of ["2026-02-30", "2026-13-01", "10/01/2026", "2026-2-1"]) {
    assert.throws(() => validateMetadata({ ...valid, date }, "test"), /date/);
  }
  assert.equal(validateMetadata({ ...valid, date: "2024-02-29" }, "test").date, "2024-02-29");
  assert.equal(validateMetadata({ ...valid, date: new Date("2026-10-01") }, "test").date, "2026-10-01");
});

test("updated is optional, validates real dates, and cannot precede publication", () => {
  assert.equal(validateMetadata(valid, "legacy.mdx").updated, undefined);
  for (const updated of ["2026-02-30", "2026-13-01", "10/21/2026", "2026-2-1", "", null, 12, new Date("invalid"), "2026-09-30"]) {
    assert.throws(() => validateMetadata({ ...valid, updated }, "example.mdx"), /example\.mdx:.*"updated"/);
  }
  assert.equal(validateMetadata({ ...valid, updated: valid.date }, "example.mdx").updated, valid.date);
  assert.equal(validateMetadata({ ...valid, updated: "2026-10-21" }, "example.mdx").updated, "2026-10-21");
  assert.equal(validateMetadata({ ...valid, updated: new Date("2026-10-21T00:00:00Z") }, "example.mdx").updated, "2026-10-21");
  assert.equal(validateMetadata({ ...valid, date: "2024-02-28", updated: "2024-02-29" }, "leap.mdx").updated, "2024-02-29");
});

test("published collection excludes draft content, sorts dates, and rejects duplicate slugs", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "blog-content-"));
  const article = (date: string, draft = false) => `---\ntitle: 文章\ndate: '${date}'\nsummary: 摘要\ntags: [前端]\ndraft: ${draft}\n---\n${draft ? "DRAFT_PRIVATE_MARKER" : "正文"}`;
  try {
    writeFileSync(path.join(directory, "older.md"), article("2026-09-01"));
    writeFileSync(path.join(directory, "newer.mdx"), article("2026-10-01"));
    writeFileSync(path.join(directory, "private.mdx"), article("2026-10-02", true));
    const posts = getPosts(directory);
    assert.deepEqual(posts.map((post) => post.slug), ["newer", "older"]);
    assert.ok(!JSON.stringify(posts).includes("DRAFT_PRIVATE_MARKER"));
    writeFileSync(path.join(directory, "older.mdx"), article("2026-09-01"));
    assert.throws(() => getPosts(directory), /duplicate slug/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("Chinese reading time and heading anchors support Unicode and duplicates", () => {
  assert.equal(readingMinutes("很短的正文"), 1);
  assert.ok(readingMinutes("文".repeat(701)) >= 3);
  const used = new Set<string>();
  assert.equal(createHeadingId("为什么选择 SSG？", used), "为什么选择-ssg");
  assert.equal(createHeadingId("为什么选择 SSG？", used), "为什么选择-ssg-2");
  assert.equal(createHeadingId("为什么选择 SSG-2", used), "为什么选择-ssg-2-2");
});
