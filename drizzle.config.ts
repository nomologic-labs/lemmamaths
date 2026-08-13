import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit runs outside the Next.js runtime and does not auto-load .env.local.
// Use the same env-loading convention as Next.js (see docs/manual/authentication.md).
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local for local development or to your deployment environment.",
  );
}

export default defineConfig({
  schema: [
    "./src/lib/db/schema.ts",
    "./src/lib/db/auth-schema.ts",
    "./src/lib/db/audit-schema.ts",
    "./src/lib/db/articles-schema.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
