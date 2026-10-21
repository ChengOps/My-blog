// ASCII path segments avoid Next.js 15's Unicode prerender matching issue.
export function tagSegment(tag: string): string {
  return encodeURIComponent(tag).replaceAll("_", "%5F").replaceAll("%", "_");
}

export function tagPath(tag: string): string {
  return `/tags/${tagSegment(tag)}`;
}
