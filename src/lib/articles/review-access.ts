import { hasPermission, type LemmaRole } from "@/lib/auth/permissions";
import {
  isArticleAuthor,
  type ArticleAccessInput,
} from "./access";

export type ReviewDecision = "request_revisions" | "recommend_approval";

export const REVIEW_DECISIONS = [
  "request_revisions",
  "recommend_approval",
] as const;

export function canManageReviewQueue(roles: readonly LemmaRole[]): boolean {
  return hasPermission(roles, "article:approve");
}

export function canAccessAssignedReviews(roles: readonly LemmaRole[]): boolean {
  return hasPermission(roles, "article:review");
}

/** Reviewers must not referee their own work. */
export function canBeAssignedAsReviewer(
  reviewerUserId: string,
  article: ArticleAccessInput,
): boolean {
  return !isArticleAuthor(reviewerUserId, article);
}

export function canReviewAssignedArticle(
  roles: readonly LemmaRole[],
  userId: string,
  article: ArticleAccessInput,
): boolean {
  if (!hasPermission(roles, "article:review")) return false;
  if (isArticleAuthor(userId, article)) return false;
  return article.assignedReviewerIds?.includes(userId) ?? false;
}

export function canCreateReviewComment(
  roles: readonly LemmaRole[],
  userId: string,
  article: ArticleAccessInput,
  options: { assignmentActive: boolean; roundOpen: boolean },
): boolean {
  if (!options.roundOpen) return false;
  if (isArticleAuthor(userId, article)) return false;
  if (hasPermission(roles, "article:approve")) return true;
  if (!options.assignmentActive) return false;
  return canReviewAssignedArticle(roles, userId, article);
}

export function canEditReviewComment(input: {
  roles: readonly LemmaRole[];
  userId: string;
  commentAuthorId: string;
  article: ArticleAccessInput;
}): boolean {
  if (input.commentAuthorId === input.userId) return true;
  return hasPermission(input.roles, "article:approve");
}

export function canResolveReviewComment(input: {
  roles: readonly LemmaRole[];
  userId: string;
  commentAuthorId: string;
  article: ArticleAccessInput;
}): boolean {
  if (input.commentAuthorId === input.userId) return true;
  if (hasPermission(input.roles, "article:approve")) return true;
  if (
    hasPermission(input.roles, "article:edit:own") &&
    isArticleAuthor(input.userId, input.article)
  ) {
    return true;
  }
  return false;
}

export function canSubmitReviewDecision(
  roles: readonly LemmaRole[],
  userId: string,
  article: ArticleAccessInput,
  options: { assignmentActive: boolean; roundOpen: boolean },
): boolean {
  if (!options.assignmentActive || !options.roundOpen) return false;
  return canReviewAssignedArticle(roles, userId, article);
}

export function canViewReviewFeedback(
  roles: readonly LemmaRole[],
  userId: string,
  article: ArticleAccessInput,
): boolean {
  if (hasPermission(roles, "article:read:any")) return true;
  if (hasPermission(roles, "article:read:own") && isArticleAuthor(userId, article)) {
    return true;
  }
  return canReviewAssignedArticle(roles, userId, article);
}

export function isReviewDecision(value: string): value is ReviewDecision {
  return (REVIEW_DECISIONS as readonly string[]).includes(value);
}
