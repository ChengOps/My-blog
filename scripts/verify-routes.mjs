import assert from "node:assert/strict";
import process from "node:process";
import { getPosts, getTags } from "../src/lib/posts.ts";
import { tagPath } from "../src/lib/urls.ts";

const routes = [
  "/", "/posts", "/about", "/guestbook",
  ...getPosts().map((post) => `/posts/${post.slug}`),
  ...getTags().map(({ tag }) => tagPath(tag)),
  "/feed.xml", "/sitemap.xml", "/robots.txt", "/opengraph-image",
];
for (const route of routes) {
  const response = await globalThis.fetch(`http://127.0.0.1:3000${route}`);
  assert.equal(response.status, 200, `${route} must be directly accessible`);
}
for (const route of ["/missing", "/posts/qa-private-draft", "/tags/missing"]) {
  const response = await globalThis.fetch(`http://127.0.0.1:3000${route}`);
  assert.equal(response.status, 404, `${route} must return HTTP 404`);
}
process.stdout.write(`${routes.length} generated routes and 3 missing routes verified.\n`);
