ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "peer_review_status" text DEFAULT 'editorial-review' NOT NULL;
