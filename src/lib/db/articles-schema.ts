import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { ArticleBlock, ArticleFormat, PeerReviewStatus, TopicId } from "@/data/types";
import { users } from "./schema";
import type { ArticleWorkflowStatus } from "@/lib/articles/workflow";

export const articleWorkflowEnum = pgEnum("article_workflow", [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUESTED",
  "RESUBMITTED",
  "APPROVED",
  "PUBLISHED",
]);

export const articleReviewerStatusEnum = pgEnum("article_reviewer_status", [
  "assigned",
  "completed",
  "withdrawn",
]);

export const articleReviewRoundStatusEnum = pgEnum("article_review_round_status", [
  "OPEN",
  "COMPLETED",
]);

export const articleReviewDecisionEnum = pgEnum("article_review_decision", [
  "request_revisions",
  "recommend_approval",
]);

/**
 * Database-backed articles for the editor and future publishing pipeline.
 * Public mock articles in src/data/ remain separate until a migration phase.
 */
export const articles = pgTable("articles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull().default("Untitled"),
  standfirst: text("standfirst"),
  description: text("description").notNull().default(""),
  format: text("format").$type<ArticleFormat>().notNull().default("article"),
  readingMinutes: integer("reading_minutes").notNull().default(1),
  topics: jsonb("topics").$type<TopicId[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  body: jsonb("body").$type<ArticleBlock[]>().notNull().default([]),
  workflowStatus: articleWorkflowEnum("workflow_status")
    .$type<ArticleWorkflowStatus>()
    .notNull()
    .default("DRAFT"),
  featured: boolean("featured").notNull().default(false),
  /** Public badge; distinct from editorial workflow_status. */
  peerReviewStatus: text("peer_review_status")
    .$type<PeerReviewStatus>()
    .notNull()
    .default("editorial-review"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  publishedOn: date("published_on", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const articleAuthors = pgTable(
  "article_authors",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.articleId, table.userId] }),
  }),
);

/**
 * One editorial review cycle for an article. Comments and assignments hang off the round
 * so historical feedback survives author revisions.
 */
export const articleReviewRounds = pgTable(
  "article_review_rounds",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    roundNumber: integer("round_number").notNull(),
    status: articleReviewRoundStatusEnum("status").notNull().default("OPEN"),
    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => ({
    articleRoundUnique: uniqueIndex("article_review_rounds_article_number_uidx").on(
      table.articleId,
      table.roundNumber,
    ),
  }),
);

/**
 * Reviewer assignment for a specific review round.
 */
export const articleReviewers = pgTable(
  "article_reviewers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    roundId: text("round_id")
      .notNull()
      .references(() => articleReviewRounds.id, { onDelete: "cascade" }),
    reviewerUserId: text("reviewer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assignedById: text("assigned_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: articleReviewerStatusEnum("status").notNull().default("assigned"),
    decision: articleReviewDecisionEnum("decision"),
    assignedAt: timestamp("assigned_at", { mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => ({
    roundReviewerUnique: uniqueIndex("article_reviewers_round_reviewer_uidx").on(
      table.roundId,
      table.reviewerUserId,
    ),
  }),
);

/**
 * Block-level review comments. `blockId` is ArticleBlock.id — never an array index.
 */
export const articleReviewComments = pgTable("article_review_comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  articleId: text("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  roundId: text("round_id")
    .notNull()
    .references(() => articleReviewRounds.id, { onDelete: "cascade" }),
  assignmentId: text("assignment_id").references(() => articleReviewers.id, {
    onDelete: "set null",
  }),
  authorUserId: text("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  blockId: text("block_id").notNull(),
  body: text("body").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  resolvedById: text("resolved_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  resolvedAt: timestamp("resolved_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Revision snapshots seam. Not a full VCS — rows capture metadata + body at
 * intentional points (e.g. submit). Diffing and revision UI are future work.
 */
export const articleRevisions = pgTable(
  "article_revisions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    title: text("title").notNull(),
    standfirst: text("standfirst"),
    description: text("description").notNull(),
    format: text("format").$type<ArticleFormat>().notNull(),
    topics: jsonb("topics").$type<TopicId[]>().notNull(),
    tags: jsonb("tags").$type<string[]>().notNull(),
    body: jsonb("body").$type<ArticleBlock[]>().notNull(),
    authorUserIds: jsonb("author_user_ids").$type<string[]>().notNull(),
    workflowStatus: articleWorkflowEnum("workflow_status")
      .$type<ArticleWorkflowStatus>()
      .notNull(),
    savedById: text("saved_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    note: text("note"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    articleRevisionUnique: uniqueIndex("article_revisions_article_number_uidx").on(
      table.articleId,
      table.revisionNumber,
    ),
  }),
);

export const articlesRelations = relations(articles, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [articles.createdById],
    references: [users.id],
  }),
  authorLinks: many(articleAuthors),
  reviewRounds: many(articleReviewRounds),
  reviewers: many(articleReviewers),
  reviewComments: many(articleReviewComments),
  revisions: many(articleRevisions),
}));

export const articleAuthorsRelations = relations(articleAuthors, ({ one }) => ({
  article: one(articles, {
    fields: [articleAuthors.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [articleAuthors.userId],
    references: [users.id],
  }),
}));

export const articleReviewRoundsRelations = relations(articleReviewRounds, ({ one, many }) => ({
  article: one(articles, {
    fields: [articleReviewRounds.articleId],
    references: [articles.id],
  }),
  createdBy: one(users, {
    fields: [articleReviewRounds.createdById],
    references: [users.id],
  }),
  assignments: many(articleReviewers),
  comments: many(articleReviewComments),
}));

export const articleReviewersRelations = relations(articleReviewers, ({ one, many }) => ({
  article: one(articles, {
    fields: [articleReviewers.articleId],
    references: [articles.id],
  }),
  round: one(articleReviewRounds, {
    fields: [articleReviewers.roundId],
    references: [articleReviewRounds.id],
  }),
  reviewer: one(users, {
    fields: [articleReviewers.reviewerUserId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [articleReviewers.assignedById],
    references: [users.id],
  }),
  comments: many(articleReviewComments),
}));

export const articleReviewCommentsRelations = relations(articleReviewComments, ({ one }) => ({
  article: one(articles, {
    fields: [articleReviewComments.articleId],
    references: [articles.id],
  }),
  round: one(articleReviewRounds, {
    fields: [articleReviewComments.roundId],
    references: [articleReviewRounds.id],
  }),
  assignment: one(articleReviewers, {
    fields: [articleReviewComments.assignmentId],
    references: [articleReviewers.id],
  }),
  author: one(users, {
    fields: [articleReviewComments.authorUserId],
    references: [users.id],
  }),
}));

export const articleRevisionsRelations = relations(articleRevisions, ({ one }) => ({
  article: one(articles, {
    fields: [articleRevisions.articleId],
    references: [articles.id],
  }),
  savedBy: one(users, {
    fields: [articleRevisions.savedById],
    references: [users.id],
  }),
}));
