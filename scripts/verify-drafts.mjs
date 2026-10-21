import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const marker = "PRIVATE_DRAFT_BUILD_CHECK_7E31";
const filename = path.resolve("content/posts/qa-private-draft.mdx");
assert.ok(!existsSync(filename), "Draft check refuses to overwrite an existing article");
const source = `---\ntitle: '${marker}'\ndate: '2026-10-01'\nsummary: '${marker}'\ntags: ['${marker}']\ndraft: true\n---\n${marker}`;

function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const location = path.join(directory, entry.name);
    assert.ok(!entry.name.includes("qa-private-draft"), `Draft path leaked: ${location}`);
    if (entry.isDirectory()) inspect(location);
    else assert.ok(!readFileSync(location).includes(marker), `Draft content leaked: ${location}`);
  }
}

try {
  writeFileSync(filename, source, { flag: "wx" });
  const build = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], { stdio: "inherit", env: process.env });
  assert.equal(build.status, 0, "Production build failed");
  inspect(path.resolve(".next"));
  process.stdout.write("Draft verified: no route, tag, RSS entry, source trace, or private content in .next.\n");
} finally {
  if (existsSync(filename)) unlinkSync(filename);
}
