"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { writeAuditEntry } from "@/lib/auth/audit";
import { requireSession } from "@/lib/auth/guards";
import { collectBlockIds } from "@/lib/articles/block-ids";
import {
  canBeAssignedAsReviewer,
  canCreateReviewComment,
  canEditReviewComment,
  canManageReviewQueue,
  canResolveReviewComment,
  canSubmitReviewDecision,
  canViewReviewFeedback,
} from "@/lib/articles/review-access";
import {
  assignReviewerToRound,
  completeOpenRound,
  createReviewComment,
  ensureOpenRound,
  getActiveAssignment,
  getOpenRound,
  getReviewCommentById,
  setReviewCommentResolved,
  submitAssignmentDecision,
  updateReviewCommentBody,
  withdrawReviewerAssignment,
} from "@/lib/articles/review-store";
import { toAccessRecord } from "@/lib/articles/store";
import { getArticleById } from "@/lib/articles/store";
import {
  parseAssignReviewerInput,
  parseCreateReviewCommentInput,
  parseRemoveReviewerInput,
  parseResolveReviewCommentInput,
  parseSubmitReviewDecisionInput,
  parseUpdateReviewCommentInput,
} from "@/lib/articles/review-validation";
import {
  approveArticleAction,
  requestRevisionAction,
  startReviewAction,
  type ActionResult,
} from "@/lib/articles/actions";

function formatZodError(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

function revalidateReviewPaths(articleId: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/review");
  revalidatePath("/dashboard/review/assigned");
  revalidatePath(`/dashboard/review/${articleId}`);
  revalidatePath("/dashboard/drafts");
  revalidatePath("/dashboard/published");
  revalidatePath(`/dashboard/drafts/${articleId}`);
  revalidatePath(`/dashboard/drafts/${articleId}/preview`);
}

export async function assignReviewerAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireSession();
    if (!canManageReviewQueue(user.permissions)) {
      return { ok: false, error: "You cannot assign reviewers." };
    }

    const parsed = parseAssignReviewerInput(input);
    const article = await getArticleById(parsed.articleId);
    if (!article) return { ok: false, error: "Article not found." };

    if (!canBeAssignedAsReviewer(parsed.reviewerUserId, toAccessRecord(article))) {
      return { ok: false, error: "Authors cannot be assigned as reviewers of their own article." };
    }

    const assignableStatuses = new Set([
      "SUBMITTED",
      "UNDER_REVIEW",
      "RESUBMITTED",
      "REVISION_REQUESTED",
    ]);
    if (!assignableStatuses.has(article.workflowStatus)) {
      return { ok: false, error: "This article is not in a reviewable state." };
    }

    const round = await ensureOpenRound(article.id, user.id);
    const assignment = await assignReviewerToRound({
      articleId: article.id,
      roundId: round.id,
      reviewerUserId: parsed.reviewerUserId,
      assignedById: user.id,
    });

    await writeAuditEntry({
      actorUserId: user.id,
      action: "reviewer.assigned",
      targetType: "article_reviewer",
      targetId: assignment.id,
      metadata: {
        articleId: article.id,
        reviewerUserId: parsed.reviewerUserId,
        roundId: round.id,
        roundNumber: round.roundNumber,
      },
    });

    revalidateReviewPaths(article.id);
    return { ok: true };
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: formatZodError(error) };
    return { ok: false, error: "Could not assign reviewer." };
  }
}

export async function removeReviewerAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireSession();
    if (!canManageReviewQueue(user.permissions)) {
      return { ok: false, error: "You cannot remove reviewers." };
    }

    const parsed = parseRemoveReviewerInput(input);
    const removed = await withdrawReviewerAssignment(parsed);
    if (!removed) return { ok: false, error: "No active assignment found." };

    await writeAuditEntry({
      actorUserId: user.id,
      action: "reviewer.removed",
      targetType: "article",
      targetId: parsed.articleId,
      metadata: { reviewerUserId: parsed.reviewerUserId },
    });

    revalidateReviewPaths(parsed.articleId);
    return { ok: true };
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: formatZodError(error) };
    return { ok: false, error: "Could not remove reviewer." };
  }
}

export async function startArticleReviewAction(articleId: string): Promise<ActionResult> {
  const user = await requireSession();
  if (!canManageReviewQueue(user.permissions)) {
    return { ok: false, error: "You cannot start review." };
  }

  const article = await getArticleById(articleId);
  if (!article) return { ok: false, error: "Article not found." };

  await ensureOpenRound(articleId, user.id);
  const result = await startReviewAction(articleId);
  if (!result.ok) return result;

  await writeAuditEntry({
    actorUserId: user.id,
    action: "review.started",
    targetType: "article",
    targetId: articleId,
    metadata: { from: article.workflowStatus, to: "UNDER_REVIEW" },
  });

  revalidateReviewPaths(articleId);
  return { ok: true };
}

export async function editorRequestRevisionAction(articleId: string): Promise<ActionResult> {
  const user = await requireSession();
  if (!canManageReviewQueue(user.permissions)) {
    return { ok: false, error: "You cannot request revisions." };
  }
  const result = await requestRevisionAction(articleId);
  if (!result.ok) return result;
  await completeOpenRound(articleId);
  revalidateReviewPaths(articleId);
  return { ok: true };
}

export async function editorApproveArticleAction(articleId: string): Promise<ActionResult> {
  const user = await requireSession();
  if (!canManageReviewQueue(user.permissions)) {
    return { ok: false, error: "You cannot approve articles." };
  }
  const result = await approveArticleAction(articleId);
  if (!result.ok) return result;
  await completeOpenRound(articleId);
  revalidateReviewPaths(articleId);
  return { ok: true };
}

export async function createReviewCommentAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireSession();
    const parsed = parseCreateReviewCommentInput(input);
    const article = await getArticleById(parsed.articleId);
    if (!article) return { ok: false, error: "Article not found." };

    const assignment = await getActiveAssignment(article.id, user.id);
    const round = assignment?.round ?? (await getOpenRound(article.id));
    if (!round || round.status !== "OPEN") {
      return { ok: false, error: "There is no open review round." };
    }

    const mayComment = canCreateReviewComment(user.permissions, user.id, toAccessRecord(article), {
      assignmentActive: Boolean(assignment),
      roundOpen: true,
    });
    if (!mayComment) {
      return { ok: false, error: "You cannot comment on this article." };
    }

    const blockIds = collectBlockIds(article.body);
    if (!blockIds.has(parsed.blockId)) {
      return { ok: false, error: "That block is not in the current article." };
    }

    const comment = await createReviewComment({
      articleId: article.id,
      roundId: round.id,
      assignmentId: assignment?.id ?? null,
      authorUserId: user.id,
      blockId: parsed.blockId,
      body: parsed.body,
    });

    await writeAuditEntry({
      actorUserId: user.id,
      action: "review.comment.created",
      targetType: "review_comment",
      targetId: comment.id,
      metadata: {
        articleId: article.id,
        blockId: parsed.blockId,
        roundId: round.id,
      },
    });

    revalidateReviewPaths(article.id);
    return { ok: true };
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: formatZodError(error) };
    return { ok: false, error: "Could not create comment." };
  }
}

export async function updateReviewCommentAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireSession();
    const parsed = parseUpdateReviewCommentInput(input);
    const comment = await getReviewCommentById(parsed.commentId);
    if (!comment) return { ok: false, error: "Comment not found." };

    const article = await getArticleById(comment.articleId);
    if (!article) return { ok: false, error: "Article not found." };

    if (
      !canEditReviewComment({
        permissions: user.permissions,
        userId: user.id,
        commentAuthorId: comment.authorUserId,
        article: toAccessRecord(article),
      })
    ) {
      return { ok: false, error: "You cannot edit this comment." };
    }

    await updateReviewCommentBody(comment.id, parsed.body);
    await writeAuditEntry({
      actorUserId: user.id,
      action: "review.comment.updated",
      targetType: "review_comment",
      targetId: comment.id,
      metadata: { articleId: article.id },
    });

    revalidateReviewPaths(article.id);
    return { ok: true };
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: formatZodError(error) };
    return { ok: false, error: "Could not update comment." };
  }
}

export async function resolveReviewCommentAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireSession();
    const parsed = parseResolveReviewCommentInput(input);
    const comment = await getReviewCommentById(parsed.commentId);
    if (!comment) return { ok: false, error: "Comment not found." };

    const article = await getArticleById(comment.articleId);
    if (!article) return { ok: false, error: "Article not found." };

    if (
      !canResolveReviewComment({
        permissions: user.permissions,
        userId: user.id,
        commentAuthorId: comment.authorUserId,
        article: toAccessRecord(article),
      })
    ) {
      return { ok: false, error: "You cannot resolve this comment." };
    }

    await setReviewCommentResolved({
      commentId: comment.id,
      resolved: parsed.resolved,
      actorUserId: user.id,
    });

    await writeAuditEntry({
      actorUserId: user.id,
      action: parsed.resolved ? "review.comment.resolved" : "review.comment.updated",
      targetType: "review_comment",
      targetId: comment.id,
      metadata: { articleId: article.id, resolved: parsed.resolved },
    });

    revalidateReviewPaths(article.id);
    return { ok: true };
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: formatZodError(error) };
    return { ok: false, error: "Could not update comment." };
  }
}

export async function submitReviewDecisionAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireSession();
    const parsed = parseSubmitReviewDecisionInput(input);
    const article = await getArticleById(parsed.articleId);
    if (!article) return { ok: false, error: "Article not found." };

    const assignment = await getActiveAssignment(article.id, user.id);
    if (
      !assignment ||
      !canSubmitReviewDecision(user.permissions, user.id, toAccessRecord(article), {
        assignmentActive: true,
        roundOpen: assignment.round.status === "OPEN",
      })
    ) {
      return { ok: false, error: "You cannot submit a decision for this article." };
    }

    if (article.workflowStatus !== "UNDER_REVIEW") {
      return { ok: false, error: "Decisions can only be submitted while the article is under review." };
    }

    await submitAssignmentDecision({
      assignmentId: assignment.id,
      decision: parsed.decision,
    });

    await writeAuditEntry({
      actorUserId: user.id,
      action: "review.decision.submitted",
      targetType: "article_reviewer",
      targetId: assignment.id,
      metadata: {
        articleId: article.id,
        decision: parsed.decision,
        roundId: assignment.roundId,
      },
    });

    revalidateReviewPaths(article.id);
    return { ok: true };
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: formatZodError(error) };
    return { ok: false, error: "Could not submit decision." };
  }
}

export async function assertCanViewReview(articleId: string) {
  const user = await requireSession();
  const article = await getArticleById(articleId);
  if (!article) return null;
  if (!canViewReviewFeedback(user.permissions, user.id, toAccessRecord(article))) {
    return null;
  }
  return { user, article };
}
