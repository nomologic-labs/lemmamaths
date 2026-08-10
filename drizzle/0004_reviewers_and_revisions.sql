DO $$ BEGIN
 CREATE TYPE "public"."article_reviewer_status" AS ENUM('assigned', 'completed', 'withdrawn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_reviewers" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"reviewer_user_id" text NOT NULL,
	"assigned_by_id" text NOT NULL,
	"status" "article_reviewer_status" DEFAULT 'assigned' NOT NULL,
	"decision" text,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"revision_number" integer NOT NULL,
	"title" text NOT NULL,
	"standfirst" text,
	"description" text NOT NULL,
	"format" text NOT NULL,
	"topics" jsonb NOT NULL,
	"tags" jsonb NOT NULL,
	"body" jsonb NOT NULL,
	"author_user_ids" jsonb NOT NULL,
	"workflow_status" "article_workflow" NOT NULL,
	"saved_by_id" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article_reviewers" ADD CONSTRAINT "article_reviewers_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_reviewers" ADD CONSTRAINT "article_reviewers_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_reviewers" ADD CONSTRAINT "article_reviewers_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_saved_by_id_users_id_fk" FOREIGN KEY ("saved_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "article_reviewers_article_reviewer_uidx" ON "article_reviewers" USING btree ("article_id","reviewer_user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "article_revisions_article_number_uidx" ON "article_revisions" USING btree ("article_id","revision_number");
