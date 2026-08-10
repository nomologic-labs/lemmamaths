/**
 * Author-controlled URL policy for article content.
 * Enforced at validation/storage and again at render time.
 */

const MAX_HREF_LENGTH = 2_048;
const MAX_FIGURE_SRC_LENGTH = 500;

/** True for https?, http?, or a single-slash site-relative path (not //…). */
export function isSafeHref(value: string): boolean {
  if (typeof value !== "string") return false;
  const href = value.trim();
  if (!href || href.length > MAX_HREF_LENGTH) return false;

  if (href.startsWith("/") && !href.startsWith("//")) {
    if (href.includes("\\") || href.includes("..")) return false;
    return true;
  }

  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    return false;
  }

  return parsed.protocol === "https:" || parsed.protocol === "http:";
}

/**
 * Figure sources for the beta local-media model: only site paths under
 * `/uploads/` (local prototype uploads) or `/figures/` (checked-in assets).
 */
export function isSafeFigureSrc(value: string): boolean {
  if (typeof value !== "string") return false;
  const src = value.trim();
  if (!src || src.length > MAX_FIGURE_SRC_LENGTH) return false;
  if (!src.startsWith("/") || src.startsWith("//")) return false;
  if (src.includes("\\") || src.includes("..")) return false;
  return src.startsWith("/uploads/") || src.startsWith("/figures/");
}
