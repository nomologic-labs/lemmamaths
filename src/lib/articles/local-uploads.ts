/**
 * Local filesystem uploads under `public/uploads/` are only durable on a single
 * persistent host. Vercel’s filesystem is ephemeral — never enable uploads there.
 */
export function areLocalUploadsEnabled(): boolean {
  if (process.env.VERCEL) return false;

  if (process.env.NODE_ENV === "production") {
    // Opt-in only for a deliberately single-node production host.
    return process.env.LEMMA_ALLOW_LOCAL_UPLOADS === "true";
  }

  return true;
}
