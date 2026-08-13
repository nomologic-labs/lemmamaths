CREATE TYPE "public"."account_role" AS ENUM('contributor', 'administrator');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_role" "account_role" DEFAULT 'contributor' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_status" "account_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
UPDATE "users" SET "account_role" = 'administrator', "account_status" = 'active'
WHERE "id" IN (
  SELECT "user_id" FROM "user_roles" WHERE "role" IN ('admin', 'editor')
);--> statement-breakpoint
UPDATE "users" SET "account_role" = 'contributor', "account_status" = 'active'
WHERE "account_status" = 'pending'
  AND "id" IN (
    SELECT "user_id" FROM "user_roles" WHERE "role" IN ('author', 'reviewer')
  );--> statement-breakpoint
DROP TABLE "user_roles";--> statement-breakpoint
DROP TYPE "public"."user_role";
