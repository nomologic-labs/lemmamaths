import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export type BootstrapAdminOptions = {
  /**
   * True when the OAuth provider confirmed the email (e.g. Google `email_verified`).
   * Auth.js `users.emailVerified` is reserved for Email/magic-link providers and is
   * typically null for Google OAuth users — do not rely on that column here.
   */
  providerEmailVerified?: boolean;
};

/**
 * Grants administrator + active when the authenticated Google email matches
 * `LEMMA_BOOTSTRAP_ADMIN_EMAIL`. Idempotent and server-side only.
 *
 * Never grant admin based on display name, domain, or client input.
 * The email must come from the Auth.js sign-in event after OAuth succeeds.
 */
export async function bootstrapAdminIfEligible(
  userId: string,
  email: string,
  options?: BootstrapAdminOptions,
): Promise<void> {
  const bootstrapEmail = process.env.LEMMA_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (!bootstrapEmail) return;

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== bootstrapEmail) return;

  // Require provider-confirmed email. Google exposes this as profile.email_verified.
  if (options?.providerEmailVerified !== true) return;

  await db
    .update(users)
    .set({
      accountRole: "administrator",
      accountStatus: "active",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
