import type { Permission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import {
  isArticleAuthor,
  type ArticleAccessInput,
} from "./access";

export type ReviewDecision = "request_revisions" | "recommend_approval";

export const REVIEW_DECISIONS = [
  "request_revisions",
  "recommend_approval",
] as const;

export function canManageReviewQueue(permissions: ReadonlySet<Permission>): boolean {
  return hasPermission(permissions, "article:approve");
}

export function canAccessAssignedReviews(permissions: ReadonlySet<Permission>): boolean {
  return hasPermission(permissions, "article:review");
}

/** Reviewers must not referee their own work. */
export function canBeAssignedAsReviewer(
  reviewerUserId: string,
  article: ArticleAccessInput,
): boolean {
  return !isArticleAuthor(reviewerUserId, article);
}

export function canReviewAssignedArticle(
  permissions: ReadonlySet<Permission>,
  userId: string,
  article: ArticleAccessInput,
): boolean {
  if (!hasPermission(permissions, "article:review")) return false;
  if (isArticleAuthor(userId, article)) return false;
  return article.assignedReviewerIds?.includes(userId) ?? false;
}

export function canCreateReviewComment(
  permissions: ReadonlySet<Permission>,
  userId: string,
  article: ArticleAccessInput,
  options: { assignmentActive: boolean; roundOpen: boolean },
): boolean {
  if (!options.roundOpen) return false;
  if (isArticleAuthor(userId, article)) return false;
  if (hasPermission(permissions, "article:approve")) return true;
  if (!options.assignmentActive) return false;
  return canReviewAssignedArticle(permissions, userId, article);
}

export function canEditReviewComment(input: {
  permissions: ReadonlySet<Permission>;
  userId: string;
  commentAuthorId: string;
  article: ArticleAccessInput;
}): boolean {
  if (input.commentAuthorId === input.userId) return true;
  return hasPermission(input.permissions, "article:approve");
}

export function canResolveReviewComment(input: {
  permissions: ReadonlySet<Permission>;
  userId: string;
  commentAuthorId: string;
  article: ArticleAccessInput;
}): boolean {
  if (input.commentAuthorId === input.userId) return true;
  if (hasPermission(input.permissions, "article:approve")) return true;
  if (
    hasPermission(input.permissions, "article:edit:own") &&
    isArticleAuthor(input.userId, input.article)
  ) {
    return true;
  }
  return false;
}

export function canSubmitReviewDecision(
  permissions: ReadonlySet<Permission>,
  userId: string,
  article: ArticleAccessInput,
  options: { assignmentActive: boolean; roundOpen: boolean },
): boolean {
  if (!options.assignmentActive || !options.roundOpen) return false;
  return canReviewAssignedArticle(permissions, userId, article);
}

export function canViewReviewFeedback(
  permissions: ReadonlySet<Permission>,
  userId: string,
  article: ArticleAccessInput,
): boolean {
  if (hasPermission(permissions, "article:read:any")) return true;
  if (hasPermission(permissions, "article:read:own") && isArticleAuthor(userId, article)) {
    return true;
  }
  return canReviewAssignedArticle(permissions, userId, article);
}

export function isReviewDecision(value: string): value is ReviewDecision {
  return (REVIEW_DECISIONS as readonly string[]).includes(value);
}
