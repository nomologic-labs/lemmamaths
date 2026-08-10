/** Draft slug from article id; unique and stable without requiring a title. */
export function draftSlugForId(id: string): string {
  return `draft-${id}`;
}

export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "untitled";
}
