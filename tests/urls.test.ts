import assert from "node:assert/strict";
import { test } from "node:test";
import { tagPath, tagSegment } from "../src/lib/urls.ts";

test("tag paths use stable ASCII segments without escaping collisions", () => {
  const tags = ["前端", "AI", "C++", "a_b", "a%", "a/b", "_E5_89_8D_E7_AB_AF"];
  const segments = tags.map(tagSegment);
  assert.equal(new Set(segments).size, tags.length);
  assert.ok(segments.every((segment) => /^[a-zA-Z0-9_!'()*.-]+$/.test(segment)));
  assert.equal(tagPath("AI"), "/tags/AI");
  assert.equal(tagPath("前端"), "/tags/_E5_89_8D_E7_AB_AF");
});
