import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compileMDX } from "next-mdx-remote/rsc";
import { remarkPullQuotes } from "../src/lib/pull-quotes.ts";

async function render(source: string) {
  const { content } = await compileMDX({
    source,
    components: { Pull: ({ children }: { children: ReactNode }) => createElement("figure", { className: "pull-quote" }, children) },
    options: { mdxOptions: { remarkPlugins: [remarkPullQuotes] } },
  });
  return renderToStaticMarkup(content);
}

test("standalone and inline Pull quotes produce valid block markup without losing prose", async () => {
  assert.equal(await render("<Pull>独立引用。</Pull>"), '<figure class="pull-quote">独立引用。</figure>');
  assert.equal(await render("前文<Pull>段落中间的引用。</Pull>后文。"), '<p>前文</p>\n<figure class="pull-quote">段落中间的引用。</figure>\n<p>后文。</p>');
  assert.equal(await render("<Pull>第一处</Pull>以及<Pull>第二处</Pull>"), '<figure class="pull-quote">第一处</figure>\n<p>以及</p>\n<figure class="pull-quote">第二处</figure>');
  assert.equal(await render("普通段落。"), '<p>普通段落。</p>');
});
