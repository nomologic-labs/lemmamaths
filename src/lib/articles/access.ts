import type { Permission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import type { ArticleWorkflowStatus } from "./workflow";
import {
  canAuthorEditWorkflow,
  canEditorEditWorkflow,
  getTransition,
  type WorkflowTransition,
} from "./workflow";

export type ArticleAccessRecord = {
  id: string;
  createdById: string;
  workflowStatus: ArticleWorkflowStatus;
  authorUserIds: readonly string[];
  /** Reviewer user ids currently assigned (from article_reviewers). */
  assignedReviewerIds?: readonly string[];
};

export type ArticleAccessInput = ArticleAccessRecord;

export function isArticleAuthor(userId: string, article: ArticleAccessInput): boolean {
  return article.createdById === userId || article.authorUserIds.includes(userId);
}

export function canReadArticle(
  permissions: ReadonlySet<Permission>,
  userId: string,
  article: ArticleAccessInput,
): boolean {
  if (hasPermission(permissions, "article:read:any")) return true;
  if (hasPermission(permissions, "article:read:own") && isArticleAuthor(userId, article)) {
    return true;
  }
  if (
    hasPermission(permissions, "article:read:assigned") &&
    (article.assignedReviewerIds?.includes(userId) ?? false)
  ) {
    return true;
  }
  return false;
}

export function canEditArticleRecord(
  permissions: ReadonlySet<Permission>,
  userId: string,
  article: ArticleAccessInput,
): boolean {
  if (hasPermission(permissions, "article:edit:any") && canEditorEditWorkflow(article.workflowStatus)) {
    return true;
  }

  if (
    isArticleAuthor(userId, article) &&
    hasPermission(permissions, "article:edit:own") &&
    canAuthorEditWorkflow(article.workflowStatus)
  ) {
    return true;
  }

  return false;
}

export function canSubmitArticle(
  permissions: ReadonlySet<Permission>,
  userId: string,
  article: ArticleAccessInput,
): boolean {
  if (!hasPermission(permissions, "article:submit")) return false;
  if (!isArticleAuthor(userId, article)) return false;
  if (article.workflowStatus === "DRAFT") return true;
  if (article.workflowStatus === "REVISION_REQUESTED") return true;
  return false;
}

export function canDeleteDraft(
  permissions: ReadonlySet<Permission>,
  userId: string,
  article: ArticleAccessInput,
): boolean {
  if (article.workflowStatus !== "DRAFT") return false;
  if (hasPermission(permissions, "article:edit:any")) return true;
  return article.createdById === userId && hasPermission(permissions, "article:edit:own");
}

export function canSetFeatured(permissions: ReadonlySet<Permission>): boolean {
  return hasPermission(permissions, "article:publish") || hasPermission(permissions, "article:edit:any");
}

/** Administrator publish gate: permission + APPROVED status. */
export function canPublishArticle(
  permissions: ReadonlySet<Permission>,
  article: ArticleAccessInput,
): boolean {
  if (!hasPermission(permissions, "article:publish")) return false;
  return article.workflowStatus === "APPROVED";
}

/** Published articles are immutable through the normal draft editor. */
export function isPublishedImmutable(status: ArticleWorkflowStatus): boolean {
  return status === "PUBLISHED";
}

export function submitTargetStatus(
  status: ArticleWorkflowStatus,
): ArticleWorkflowStatus | null {
  if (status === "DRAFT") return "SUBMITTED";
  if (status === "REVISION_REQUESTED") return "RESUBMITTED";
  return null;
}

/**
 * Whether the user may perform a specific workflow transition.
 * Permission, ownership (when required), and legal edge must all hold.
 */
export function canPerformTransition(
  permissions: ReadonlySet<Permission>,
  userId: string,
  article: ArticleAccessInput,
  to: ArticleWorkflowStatus,
): WorkflowTransition | null {
  const transition = getTransition(article.workflowStatus, to);
  if (!transition) return null;
  if (!hasPermission(permissions, transition.permission)) return null;
  if (transition.requireAuthor && !isArticleAuthor(userId, article)) return null;
  return transition;
}

/** @deprecated Prefer canPerformTransition + getTransition. */
export function requiredPermissionForTransition(
  from: ArticleWorkflowStatus,
  to: ArticleWorkflowStatus,
): Permission | null {
  return getTransition(from, to)?.permission ?? null;
}
