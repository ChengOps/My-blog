export type PostMetadata = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
};

export function validateMetadata(data: Record<string, unknown>, file: string): PostMetadata {
  function fail(field: string): never {
    throw new Error(`${file}: invalid or missing frontmatter field "${field}"`);
  }
  function text(field: string): string {
    const value = data[field];
    return typeof value === "string" && value.trim() ? value.trim() : fail(field);
  }
  const title = text("title");
  const summary = text("summary");
  const rawDate = data.date;
  const date = rawDate instanceof Date && !Number.isNaN(rawDate.getTime())
    ? rawDate.toISOString().slice(0, 10) : rawDate;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail("date");
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) fail("date");
  const tags = data.tags;
  if (!Array.isArray(tags) || !tags.every((tag: unknown) => typeof tag === "string" && tag.trim())) fail("tags");
  if (typeof data.draft !== "boolean") fail("draft");
  return { title, summary, date, tags: [...new Set((tags as string[]).map((tag) => tag.trim()))], draft: data.draft };
}
