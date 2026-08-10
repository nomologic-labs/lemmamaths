/**
 * Canonical site origin for metadata, sitemap, and Auth.js alignment.
 * Prefers AUTH_URL, then Vercel’s deployment host, then localhost for dev.
 */
export function resolveSiteOrigin(): string {
  const fromAuth = process.env.AUTH_URL?.trim();
  if (fromAuth) {
    try {
      return new URL(fromAuth).origin;
    } catch {
      // fall through
    }
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

export function resolveMetadataBase(): URL {
  return new URL(resolveSiteOrigin());
}
