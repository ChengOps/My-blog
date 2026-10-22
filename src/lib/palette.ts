import { readFileSync } from "node:fs";
import path from "node:path";

// ImageResponse and SVG assets have no document CSS; resolve the same root tokens at build time.
export function getPalette(): Record<string, string> {
  const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
  const root = css.match(/:root\s*\{([^}]+)\}/)?.[1];
  if (!root) throw new Error("Missing root color tokens");
  return Object.fromEntries([...root.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
}
