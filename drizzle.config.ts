import { defineConfig } from "drizzle-kit";

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
    url: process.env.DATABASE_URL!,
  },
});
