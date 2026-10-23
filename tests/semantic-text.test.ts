import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const exports: { SemanticText?: (props: { children: ReactNode }) => ReactNode } = {};
const source = readFileSync(new URL("../src/components/semantic-text.tsx", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports, require: createRequire(import.meta.url) });
if (!exports.SemanticText) throw new Error("Missing SemanticText component");
const SemanticText = exports.SemanticText;

function variants(html: string): string[] {
  return Array.from(html.matchAll(/<span class="semantic-(?:desktop|mobile)">([\s\S]*?)<\/span>/g), (match) => match[1]);
}

test("semantic text keeps words intact without changing copied text or punctuation", () => {
  for (const text of ["把 AI 当作结对伙伴，而不是答案机器", "「优化的终点不是分数，是读者不再等待。」", "中文 English 👋，混合内容。", "UninterruptedEnglishWord".repeat(12)]) {
    const html = renderToStaticMarkup(createElement(SemanticText, { children: text }));
    const [desktop, mobile] = variants(html);
    assert.equal(desktop, text);
    assert.equal(mobile.replace(/<[^>]*>/g, ""), text);
    if (text.includes("伙伴")) assert.ok(mobile.includes("伙伴"));
    if (text.includes("分数")) assert.ok(mobile.includes("分数"));
  }
});

test("semantic text preserves nested MDX paragraphs, emphasis and link attributes", () => {
  const children = createElement("p", { className: "existing" }, createElement("em", null, "伙伴"), "，", createElement("a", { href: "#quote" }, "分数"));
  const html = renderToStaticMarkup(createElement(SemanticText, { children }));
  assert.equal((html.match(/<p class="existing">/g) ?? []).length, 1);
  assert.equal((html.match(/<em>/g) ?? []).length, 1);
  assert.equal((html.match(/<a href="#quote">/g) ?? []).length, 1);
  assert.deepEqual(variants(html), ["伙伴", "伙伴", "，", "，", "分数", "分数"]);
});

test("semantic break opportunities keep opening and closing punctuation with adjacent words", () => {
  assert.equal(variants(renderToStaticMarkup(createElement(SemanticText, { children: "「伙伴，分数。」" })))[1], '「伙伴，<wbr/>分数。」');
});
