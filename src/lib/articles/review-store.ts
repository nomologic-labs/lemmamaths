import "server-only";

import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  articleAuthors,
  articleReviewComments,
  articleReviewRounds,
  articleReviewers,
  articles,
} from "@/lib/db/articles-schema";
import { userRoles, users } from "@/lib/db/schema";
import type { ArticleWorkflowStatus } from "./workflow";
import type { ReviewDecision } from "./review-access";

export type ReviewRoundStatus = "OPEN" | "COMPLETED";

export type ReviewRound = {
  id: string;
  articleId: string;
  roundNumber: number;
  status: ReviewRoundStatus;
  createdById: string;
  createdAt: Date;
  completedAt: Date | null;
};

export type ReviewAssignment = {
  id: string;
  articleId: string;
  roundId: string;
  reviewerUserId: string;
  assignedById: string;
  status: "assigned" | "completed" | "withdrawn";
  decision: ReviewDecision | null;
  assignedAt: Date;
  completedAt: Date | null;
};

export type ReviewComment = {
  id: string;
  articleId: string;
  roundId: string;
  assignmentId: string | null;
  authorUserId: string;
  blockId: string;
  body: string;
  resolved: boolean;
  resolvedById: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ReviewCommentView = ReviewComment & {
  authorHandle: string | null;
  authorName: string | null;
  roundNumber: number;
  blockPresent: boolean;
};

export type ReviewQueueItem = {
  id: string;
  title: string;
  slug: string;
  workflowStatus: ArticleWorkflowStatus;
  publishedOn: string | null;
  updatedAt: Date;
  createdAt: Date;
  authorHandles: string[];
  assignedReviewers: { userId: string; handle: string | null; status: string; decision: string | null }[];
  openRoundNumber: number | null;
};

export type AssignedReviewItem = {
  articleId: string;
  title: string;
  workflowStatus: ArticleWorkflowStatus;
  assignedAt: Date;
  assignmentStatus: "assigned" | "completed" | "withdrawn";
  decision: ReviewDecision | null;
  authorHandles: string[];
  roundNumber: number;
  roundStatus: ReviewRoundStatus;
};

async function nextRoundNumber(articleId: string): Promise<number> {
  const rows = await db
    .select({
      value: sql<number>`coalesce(max(${articleReviewRounds.roundNumber}), 0)`,
    })
    .from(articleReviewRounds)
    .where(eq(articleReviewRounds.articleId, articleId));
  return Number(rows[0]?.value ?? 0) + 1;
}

export async function getOpenRound(articleId: string): Promise<ReviewRound | null> {
  const rows = await db
    .select()
    .from(articleReviewRounds)
    .where(
      and(eq(articleReviewRounds.articleId, articleId), eq(articleReviewRounds.status, "OPEN")),
    )
    .orderBy(desc(articleReviewRounds.roundNumber))
    .limit(1);
  return rows[0] ?? null;
}

export async function listRoundsForArticle(articleId: string): Promise<ReviewRound[]> {
  return db
    .select()
    .from(articleReviewRounds)
    .where(eq(articleReviewRounds.articleId, articleId))
    .orderBy(desc(articleReviewRounds.roundNumber));
}

export async function ensureOpenRound(
  articleId: string,
  createdById: string,
): Promise<ReviewRound> {
  const existing = await getOpenRound(articleId);
  if (existing) return existing;

  const roundNumber = await nextRoundNumber(articleId);
  const [row] = await db
    .insert(articleReviewRounds)
    .values({
      id: crypto.randomUUID(),
      articleId,
      roundNumber,
      status: "OPEN",
      createdById,
    })
    .returning();
  if (!row) throw new Error("Failed to create review round.");
  return row;
}

export async function completeOpenRound(articleId: string): Promise<ReviewRound | null> {
  const open = await getOpenRound(articleId);
  if (!open) return null;
  const [row] = await db
    .update(articleReviewRounds)
    .set({ status: "COMPLETED", completedAt: new Date() })
    .where(eq(articleReviewRounds.id, open.id))
    .returning();
  return row ?? null;
}

export async function getActiveAssignment(
  articleId: string,
  reviewerUserId: string,
): Promise<(ReviewAssignment & { round: ReviewRound }) | null> {
  const open = await getOpenRound(articleId);
  if (!open) return null;
  const rows = await db
    .select()
    .from(articleReviewers)
    .where(
      and(
        eq(articleReviewers.roundId, open.id),
        eq(articleReviewers.reviewerUserId, reviewerUserId),
        eq(articleReviewers.status, "assigned"),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { ...row, decision: row.decision as ReviewDecision | null, round: open };
}

export async function listAssignmentsForRound(roundId: string): Promise<ReviewAssignment[]> {
  const rows = await db
    .select()
    .from(articleReviewers)
    .where(eq(articleReviewers.roundId, roundId))
    .orderBy(articleReviewers.assignedAt);
  return rows.map((row) => ({
    ...row,
    decision: row.decision as ReviewDecision | null,
  }));
}

export async function assignReviewerToRound(input: {
  articleId: string;
  roundId: string;
  reviewerUserId: string;
  assignedById: string;
}): Promise<ReviewAssignment> {
  const existing = await db
    .select()
    .from(articleReviewers)
    .where(
      and(
        eq(articleReviewers.roundId, input.roundId),
        eq(articleReviewers.reviewerUserId, input.reviewerUserId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    const [row] = await db
      .update(articleReviewers)
      .set({
        status: "assigned",
        assignedById: input.assignedById,
        assignedAt: new Date(),
        completedAt: null,
        decision: null,
      })
      .where(eq(articleReviewers.id, existing[0].id))
      .returning();
    if (!row) throw new Error("Failed to reassign reviewer.");
    return { ...row, decision: row.decision as ReviewDecision | null };
  }

  const [row] = await db
    .insert(articleReviewers)
    .values({
      id: crypto.randomUUID(),
      articleId: input.articleId,
      roundId: input.roundId,
      reviewerUserId: input.reviewerUserId,
      assignedById: input.assignedById,
      status: "assigned",
    })
    .returning();
  if (!row) throw new Error("Failed to assign reviewer.");
  return { ...row, decision: row.decision as ReviewDecision | null };
}

export async function withdrawReviewerAssignment(input: {
  articleId: string;
  reviewerUserId: string;
}): Promise<boolean> {
  const open = await getOpenRound(input.articleId);
  if (!open) return false;
  const updated = await db
    .update(articleReviewers)
    .set({ status: "withdrawn", completedAt: new Date() })
    .where(
      and(
        eq(articleReviewers.roundId, open.id),
        eq(articleReviewers.reviewerUserId, input.reviewerUserId),
        eq(articleReviewers.status, "assigned"),
      ),
    )
    .returning({ id: articleReviewers.id });
  return updated.length > 0;
}

export async function submitAssignmentDecision(input: {
  assignmentId: string;
  decision: ReviewDecision;
}): Promise<ReviewAssignment> {
  const [row] = await db
    .update(articleReviewers)
    .set({
      decision: input.decision,
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(articleReviewers.id, input.assignmentId))
    .returning();
  if (!row) throw new Error("Failed to submit review decision.");
  return { ...row, decision: row.decision as ReviewDecision | null };
}

export async function createReviewComment(input: {
  articleId: string;
  roundId: string;
  assignmentId: string | null;
  authorUserId: string;
  blockId: string;
  body: string;
}): Promise<ReviewComment> {
  const now = new Date();
  const [row] = await db
    .insert(articleReviewComments)
    .values({
      id: crypto.randomUUID(),
      articleId: input.articleId,
      roundId: input.roundId,
      assignmentId: input.assignmentId,
      authorUserId: input.authorUserId,
      blockId: input.blockId,
      body: input.body,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("Failed to create comment.");
  return row;
}

export async function getReviewCommentById(commentId: string): Promise<ReviewComment | null> {
  const rows = await db
    .select()
    .from(articleReviewComments)
    .where(eq(articleReviewComments.id, commentId))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateReviewCommentBody(
  commentId: string,
  body: string,
): Promise<ReviewComment> {
  const [row] = await db
    .update(articleReviewComments)
    .set({ body, updatedAt: new Date() })
    .where(eq(articleReviewComments.id, commentId))
    .returning();
  if (!row) throw new Error("Comment not found.");
  return row;
}

export async function setReviewCommentResolved(input: {
  commentId: string;
  resolved: boolean;
  actorUserId: string;
}): Promise<ReviewComment> {
  const [row] = await db
    .update(articleReviewComments)
    .set({
      resolved: input.resolved,
      resolvedById: input.resolved ? input.actorUserId : null,
      resolvedAt: input.resolved ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(articleReviewComments.id, input.commentId))
    .returning();
  if (!row) throw new Error("Comment not found.");
  return row;
}

export async function listCommentsForArticle(
  articleId: string,
  presentBlockIds: ReadonlySet<string>,
): Promise<ReviewCommentView[]> {
  const rows = await db
    .select({
      comment: articleReviewComments,
      authorHandle: users.handle,
      authorName: users.name,
      roundNumber: articleReviewRounds.roundNumber,
    })
    .from(articleReviewComments)
    .innerJoin(users, eq(users.id, articleReviewComments.authorUserId))
    .innerJoin(articleReviewRounds, eq(articleReviewRounds.id, articleReviewComments.roundId))
    .where(eq(articleReviewComments.articleId, articleId))
    .orderBy(desc(articleReviewRounds.roundNumber), articleReviewComments.createdAt);

  return rows.map((row) => ({
    ...row.comment,
    authorHandle: row.authorHandle,
    authorName: row.authorName,
    roundNumber: row.roundNumber,
    blockPresent: presentBlockIds.has(row.comment.blockId),
  }));
}

export async function listEligibleReviewers(): Promise<
  { id: string; handle: string; name: string | null }[]
> {
  const rows = await db
    .select({
      id: users.id,
      handle: users.handle,
      name: users.name,
      role: userRoles.role,
    })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .where(inArray(userRoles.role, ["reviewer", "editor", "admin"]));

  const byId = new Map<string, { id: string; handle: string; name: string | null }>();
  for (const row of rows) {
    if (!row.handle) continue;
    byId.set(row.id, { id: row.id, handle: row.handle, name: row.name });
  }
  return [...byId.values()].sort((a, b) => a.handle.localeCompare(b.handle));
}

async function authorHandlesForArticle(articleId: string): Promise<string[]> {
  const rows = await db
    .select({ handle: users.handle })
    .from(articleAuthors)
    .innerJoin(users, eq(users.id, articleAuthors.userId))
    .where(eq(articleAuthors.articleId, articleId))
    .orderBy(articleAuthors.sortOrder);
  return rows.map((row) => row.handle ?? "unknown");
}

export async function listReviewQueue(): Promise<ReviewQueueItem[]> {
  const rows = await db
    .select()
    .from(articles)
    .where(
      inArray(articles.workflowStatus, [
        "SUBMITTED",
        "UNDER_REVIEW",
        "REVISION_REQUESTED",
        "RESUBMITTED",
        "APPROVED",
        "PUBLISHED",
      ]),
    )
    .orderBy(desc(articles.updatedAt));

  const items: ReviewQueueItem[] = [];
  for (const row of rows) {
    const open = await getOpenRound(row.id);
    const assignments = open ? await listAssignmentsForRound(open.id) : [];
    const reviewerIds = assignments.map((entry) => entry.reviewerUserId);
    const handles =
      reviewerIds.length > 0
        ? await db
            .select({ id: users.id, handle: users.handle })
            .from(users)
            .where(inArray(users.id, reviewerIds))
        : [];
    const handleById = new Map(handles.map((entry) => [entry.id, entry.handle]));

    items.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      workflowStatus: row.workflowStatus,
      publishedOn: row.publishedOn,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      authorHandles: await authorHandlesForArticle(row.id),
      openRoundNumber: open?.roundNumber ?? null,
      assignedReviewers: assignments
        .filter((entry) => entry.status !== "withdrawn")
        .map((entry) => ({
          userId: entry.reviewerUserId,
          handle: handleById.get(entry.reviewerUserId) ?? null,
          status: entry.status,
          decision: entry.decision,
        })),
    });
  }
  return items;
}

export async function listAssignedReviewsForUser(userId: string): Promise<AssignedReviewItem[]> {
  const rows = await db
    .select({
      assignment: articleReviewers,
      article: articles,
      round: articleReviewRounds,
    })
    .from(articleReviewers)
    .innerJoin(articles, eq(articles.id, articleReviewers.articleId))
    .innerJoin(articleReviewRounds, eq(articleReviewRounds.id, articleReviewers.roundId))
    .where(
      and(eq(articleReviewers.reviewerUserId, userId), ne(articleReviewers.status, "withdrawn")),
    )
    .orderBy(desc(articleReviewers.assignedAt));

  const items: AssignedReviewItem[] = [];
  for (const row of rows) {
    items.push({
      articleId: row.article.id,
      title: row.article.title,
      workflowStatus: row.article.workflowStatus,
      assignedAt: row.assignment.assignedAt,
      assignmentStatus: row.assignment.status,
      decision: row.assignment.decision as ReviewDecision | null,
      authorHandles: await authorHandlesForArticle(row.article.id),
      roundNumber: row.round.roundNumber,
      roundStatus: row.round.status,
    });
  }
  return items;
}
