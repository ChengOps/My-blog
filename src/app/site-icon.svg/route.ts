import { getPalette } from "@/lib/palette";

export const dynamic = "force-static";

export function GET() {
  const palette = getPalette();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${palette["--background"]}"/><path d="M18 16h7v12h14V16h7v32h-7V35H25v13h-7Z" fill="${palette["--foreground"]}"/></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
}
