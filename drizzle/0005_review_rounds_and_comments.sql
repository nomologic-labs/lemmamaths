DO $$ BEGIN
 CREATE TYPE "public"."article_review_round_status" AS ENUM('OPEN', 'COMPLETED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."article_review_decision" AS ENUM('request_revisions', 'recommend_approval');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_review_rounds" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"round_number" integer NOT NULL,
	"status" "article_review_round_status" DEFAULT 'OPEN' NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "article_review_rounds" ADD CONSTRAINT "article_review_rounds_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_review_rounds" ADD CONSTRAINT "article_review_rounds_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "article_review_rounds_article_number_uidx" ON "article_review_rounds" USING btree ("article_id","round_number");
--> statement-breakpoint
ALTER TABLE "article_reviewers" ADD COLUMN IF NOT EXISTS "round_id" text;
--> statement-breakpoint
-- Backfill: one OPEN round per article that already has reviewer rows.
INSERT INTO "article_review_rounds" ("id", "article_id", "round_number", "status", "created_by_id", "created_at")
SELECT
  gen_random_uuid()::text,
  ar."article_id",
  1,
  'OPEN',
  MIN(ar."assigned_by_id"),
  MIN(ar."assigned_at")
FROM "article_reviewers" ar
WHERE ar."round_id" IS NULL
GROUP BY ar."article_id"
ON CONFLICT ("article_id", "round_number") DO NOTHING;
--> statement-breakpoint
UPDATE "article_reviewers" ar
SET "round_id" = rounds."id"
FROM "article_review_rounds" rounds
WHERE ar."round_id" IS NULL
  AND rounds."article_id" = ar."article_id"
  AND rounds."round_number" = 1;
--> statement-breakpoint
-- Remaining rows without a round (should be none) get a synthetic round.
INSERT INTO "article_review_rounds" ("id", "article_id", "round_number", "status", "created_by_id")
SELECT
  gen_random_uuid()::text,
  ar."article_id",
  1,
  'OPEN',
  ar."assigned_by_id"
FROM "article_reviewers" ar
WHERE ar."round_id" IS NULL
ON CONFLICT ("article_id", "round_number") DO NOTHING;
--> statement-breakpoint
UPDATE "article_reviewers" ar
SET "round_id" = rounds."id"
FROM "article_review_rounds" rounds
WHERE ar."round_id" IS NULL
  AND rounds."article_id" = ar."article_id"
  AND rounds."round_number" = 1;
--> statement-breakpoint
ALTER TABLE "article_reviewers" ALTER COLUMN "round_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "article_reviewers" ADD CONSTRAINT "article_reviewers_round_id_article_review_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."article_review_rounds"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DROP INDEX IF EXISTS "article_reviewers_article_reviewer_uidx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "article_reviewers_round_reviewer_uidx" ON "article_reviewers" USING btree ("round_id","reviewer_user_id");
--> statement-breakpoint
-- Migrate free-text decision values into the enum column via a staged rename.
ALTER TABLE "article_reviewers" ADD COLUMN IF NOT EXISTS "decision_enum" "article_review_decision";
--> statement-breakpoint
UPDATE "article_reviewers"
SET "decision_enum" = CASE
  WHEN "decision" IN ('request_revisions', 'revise', 'revision') THEN 'request_revisions'::"article_review_decision"
  WHEN "decision" IN ('recommend_approval', 'approve', 'approval') THEN 'recommend_approval'::"article_review_decision"
  ELSE NULL
END;
--> statement-breakpoint
ALTER TABLE "article_reviewers" DROP COLUMN IF EXISTS "decision";
--> statement-breakpoint
ALTER TABLE "article_reviewers" RENAME COLUMN "decision_enum" TO "decision";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_review_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"round_id" text NOT NULL,
	"assignment_id" text,
	"author_user_id" text NOT NULL,
	"block_id" text NOT NULL,
	"body" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_by_id" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article_review_comments" ADD CONSTRAINT "article_review_comments_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_review_comments" ADD CONSTRAINT "article_review_comments_round_id_article_review_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."article_review_rounds"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_review_comments" ADD CONSTRAINT "article_review_comments_assignment_id_article_reviewers_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."article_reviewers"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_review_comments" ADD CONSTRAINT "article_review_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_review_comments" ADD CONSTRAINT "article_review_comments_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
