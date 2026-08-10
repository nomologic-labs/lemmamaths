import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as articlesSchema from "./articles-schema";
import * as auditSchema from "./audit-schema";
import * as authSchema from "./auth-schema";
import * as schema from "./schema";

const fullSchema = {
  ...schema,
  ...authSchema,
  ...auditSchema,
  ...articlesSchema,
};

export type LemmaDatabase = ReturnType<typeof drizzle<typeof fullSchema>>;

export function hasDatabaseUrl(): boolean {
  return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0;
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local for development or to Vercel environment variables for deployment.",
    );
  }
  return url;
}

let cached: LemmaDatabase | undefined;

/** Real Drizzle instance; throws if DATABASE_URL is missing. */
export function getDb(): LemmaDatabase {
  if (!cached) {
    cached = drizzle(neon(getDatabaseUrl()), { schema: fullSchema });
  }
  return cached;
}

/**
 * Server-only Drizzle client. Lazily connects so modules can be imported during
 * `next build` without a live database; queries still require DATABASE_URL.
 *
 * Prefer `getDb()` when a concrete client must be passed to third-party adapters
 * (Auth.js) that reject Proxy wrappers.
 */
export const db: LemmaDatabase = new Proxy({} as LemmaDatabase, {
  get(_target, property, receiver) {
    const value = Reflect.get(getDb(), property, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
