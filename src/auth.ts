import "server-only";

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { bootstrapAdminIfEligible } from "@/lib/auth/bootstrap-admin";
import { accounts, sessions, verificationTokens } from "@/lib/db/auth-schema";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/**
 * Auth.js config. When DATABASE_URL is absent (local build without secrets), omit
 * the Drizzle adapter so `next build` can collect routes. Production runtime must
 * set DATABASE_URL; sessions then use the database strategy.
 */
const databaseConfigured = hasDatabaseUrl();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  ...(databaseConfigured
    ? {
        adapter: DrizzleAdapter(getDb(), {
          usersTable: users,
          accountsTable: accounts,
          sessionsTable: sessions,
          verificationTokensTable: verificationTokens,
        }),
        session: { strategy: "database" as const },
      }
    : {
        session: { strategy: "jwt" as const },
      }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  callbacks: {
    async session({ session, user, token }) {
      const userId = user?.id ?? token?.sub;
      if (!userId) return session;

      session.user.id = userId;

      if (!databaseConfigured) {
        session.user.handle = null;
        return session;
      }

      const [row] = await getDb()
        .select({ handle: users.handle })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      session.user.handle = row?.handle ?? null;
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (!databaseConfigured || !user.id || !user.email) return;

      // Google returns `email_verified` on the OIDC profile. Auth.js does not copy that
      // into `users.emailVerified` (that column is for Email/magic-link providers).
      const providerEmailVerified =
        account?.provider === "google" &&
        Boolean((profile as { email_verified?: boolean } | undefined)?.email_verified);

      await bootstrapAdminIfEligible(user.id, user.email, { providerEmailVerified });
    },
  },
});
