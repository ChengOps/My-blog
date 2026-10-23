export type PostMetadata = {
  title: string;
  date: string;
  updated?: string;
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
  function calendarDate(field: "date" | "updated"): string {
    const raw = data[field];
    const value = raw instanceof Date && !Number.isNaN(raw.getTime())
      ? raw.toISOString().slice(0, 10) : raw;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(field);
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail(field);
    return value;
  }
  const title = text("title");
  const summary = text("summary");
  const date = calendarDate("date");
  const updated = data.updated === undefined ? undefined : calendarDate("updated");
  if (updated && updated < date) fail("updated");
  const tags = data.tags;
  if (!Array.isArray(tags) || !tags.every((tag: unknown) => typeof tag === "string" && tag.trim())) fail("tags");
  if (typeof data.draft !== "boolean") fail("draft");
  return { title, summary, date, updated, tags: [...new Set((tags as string[]).map((tag) => tag.trim()))], draft: data.draft };
}
