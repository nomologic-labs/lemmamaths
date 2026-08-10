/**
 * CLI entry point for syncing mock author profiles and published articles.
 *
 * Usage (requires DATABASE_URL in the environment):
 *   npm run db:seed
 *
 * This script does not create accounts or invent emails. It:
 * 1. Upserts `author_profiles` for users whose `handle` matches a mock author id
 * 2. Imports mock articles as PUBLISHED rows when all author handles resolve
 *
 * Articles whose authors lack matching users are skipped (not fabricated).
 */

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  const {
    syncAuthorProfilesFromMock,
    seedPublishedArticlesFromMock,
    listMockAuthorHandles,
  } = await import("../../src/lib/db/seed");

  console.log("Mock author handles available for profile sync:");
  for (const handle of listMockAuthorHandles()) {
    console.log(`  - ${handle}`);
  }

  const profiles = await syncAuthorProfilesFromMock();

  if (profiles.created.length > 0) {
    console.log("\nCreated author profiles:", profiles.created.join(", "));
  }
  if (profiles.skipped.length > 0) {
    console.log("Updated or already present:", profiles.skipped.join(", "));
  }
  if (profiles.unlinkedHandles.length > 0) {
    console.log(
      "\nNo user account with matching handle — claim these handles via Google sign-in + onboarding before article seed can import related articles:",
      profiles.unlinkedHandles.join(", "),
    );
  }

  console.log("\nSeeding published mock articles…");
  const articles = await seedPublishedArticlesFromMock();

  if (articles.created.length > 0) {
    console.log("Imported articles:", articles.created.join(", "));
  }
  if (articles.skipped.length > 0) {
    console.log("Already present (skipped):", articles.skipped.join(", "));
  }
  if (articles.blocked.length > 0) {
    console.log("\nBlocked (missing author mapping):");
    for (const entry of articles.blocked) {
      console.log(`  - ${entry.slug}: missing handles [${entry.missingHandles.join(", ")}]`);
    }
    console.log(
      "\nRequired mapping: each mock article authorId must match an existing users.handle with a public author_profiles row. Do not invent emails or fake accounts.",
    );
  }

  console.log("\nSeed complete.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
