import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { TopicId } from "@/data/types";

export const accountRoleEnum = pgEnum("account_role", ["contributor", "administrator"]);

export const accountStatusEnum = pgEnum("account_status", ["pending", "active", "suspended"]);

/**
 * Application user account.
 *
 * Column names and types for `id`, `name`, `email`, `emailVerified`, and `image` follow
 * the Auth.js Drizzle adapter's default PostgreSQL `users` table so Phase 2 can add
 * `accounts`, `sessions`, and `verification_tokens` without renaming this table.
 *
 * Lemma-specific columns:
 * - `handle` — application-owned public slug (maps to mock `Author.id`, e.g. `nadia-okonkwo`)
 * - `accountRole` / `accountStatus` — authorization (see Decision 011)
 * - `createdAt` / `updatedAt` — audit timestamps
 *
 * Identity distinction (see docs/decisions/007-authentication-and-database.md):
 * - Google account → authentication identity (via `accounts` in Phase 2)
 * - `users` row → Lemma application identity
 * - `author_profiles` → public publishing identity
 *
 * A contributor's Google display name is stored in `name` for convenience but is NOT the
 * authoritative public Lemma author identity; `handle` and `author_profiles` are.
 */
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  /** Nullable until assigned during onboarding; unique when set. */
  handle: text("handle").unique(),
  image: text("image"),
  accountRole: accountRoleEnum("account_role").notNull().default("contributor"),
  accountStatus: accountStatusEnum("account_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Public author profile, one-to-one with a user who publishes on Lemma.
 * Corresponds to the mock `Author` type in `src/data/types.ts`.
 *
 * `user_id` references `users.id`. Public URLs use `users.handle`, not `users.name`
 * (which may mirror a Google display name but is not the authoritative author identity).
 */
export const authorProfiles = pgTable("author_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio").notNull(),
  /** Display string such as "Year 13" or "Year 13 · Editor" (mock `Author.role`). */
  affiliation: text("affiliation").notNull(),
  interests: jsonb("interests").$type<TopicId[]>().notNull().default([]),
  joinedOn: date("joined_on", { mode: "string" }).notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one }) => ({
  authorProfile: one(authorProfiles, {
    fields: [users.id],
    references: [authorProfiles.userId],
  }),
}));

export const authorProfilesRelations = relations(authorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [authorProfiles.userId],
    references: [users.id],
  }),
}));
