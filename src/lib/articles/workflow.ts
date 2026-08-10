/**
 * Editorial workflow states for database-backed articles.
 * Distinct from public peer-review display metadata on published mock articles.
 *
 * Authoritative transition rules live here. Server actions must call
 * `canTransition` / `getTransition` — never accept arbitrary status changes from the client.
 */

import type { Permission } from "@/lib/auth/permissions";

export const ARTICLE_WORKFLOW_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUESTED",
  "RESUBMITTED",
  "APPROVED",
  "PUBLISHED",
] as const;

export type ArticleWorkflowStatus = (typeof ARTICLE_WORKFLOW_STATUSES)[number];

/** Statuses in which the owning author may edit body/metadata through the editor. */
export const AUTHOR_EDITABLE_STATUSES: ReadonlySet<ArticleWorkflowStatus> = new Set([
  "DRAFT",
  "REVISION_REQUESTED",
]);

/** Statuses in which editors with article:edit:any may edit regardless of ownership. */
export const EDITOR_EDITABLE_STATUSES: ReadonlySet<ArticleWorkflowStatus> = new Set([
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUESTED",
  "RESUBMITTED",
  "APPROVED",
]);

export type WorkflowActorKind = "author" | "editor";

export type WorkflowTransition = {
  from: ArticleWorkflowStatus;
  to: ArticleWorkflowStatus;
  /** Permission checked server-side (roles alone are not enough). */
  permission: Permission;
  /** When true, actor must be owner or listed author. */
  requireAuthor: boolean;
  /** Audit action written on success. */
  auditAction:
    | "article.submitted"
    | "article.resubmitted"
    | "article.review_started"
    | "article.revision_requested"
    | "article.approved"
    | "article.published";
};

/**
 * Legal transitions. Publishing is defined for completeness but no publish
 * server action is exposed in this phase.
 */
export const WORKFLOW_TRANSITIONS: readonly WorkflowTransition[] = [
  {
    from: "DRAFT",
    to: "SUBMITTED",
    permission: "article:submit",
    requireAuthor: true,
    auditAction: "article.submitted",
  },
  {
    from: "REVISION_REQUESTED",
    to: "RESUBMITTED",
    permission: "article:submit",
    requireAuthor: true,
    auditAction: "article.resubmitted",
  },
  {
    from: "SUBMITTED",
    to: "UNDER_REVIEW",
    permission: "article:approve",
    requireAuthor: false,
    auditAction: "article.review_started",
  },
  {
    from: "RESUBMITTED",
    to: "UNDER_REVIEW",
    permission: "article:approve",
    requireAuthor: false,
    auditAction: "article.review_started",
  },
  {
    from: "UNDER_REVIEW",
    to: "REVISION_REQUESTED",
    permission: "article:approve",
    requireAuthor: false,
    auditAction: "article.revision_requested",
  },
  {
    from: "UNDER_REVIEW",
    to: "APPROVED",
    permission: "article:approve",
    requireAuthor: false,
    auditAction: "article.approved",
  },
  {
    from: "APPROVED",
    to: "PUBLISHED",
    permission: "article:publish",
    requireAuthor: false,
    auditAction: "article.published",
  },
] as const;

export function isArticleWorkflowStatus(value: string): value is ArticleWorkflowStatus {
  return (ARTICLE_WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export function canAuthorEditWorkflow(status: ArticleWorkflowStatus): boolean {
  return AUTHOR_EDITABLE_STATUSES.has(status);
}

export function canEditorEditWorkflow(status: ArticleWorkflowStatus): boolean {
  return EDITOR_EDITABLE_STATUSES.has(status);
}

export function getTransition(
  from: ArticleWorkflowStatus,
  to: ArticleWorkflowStatus,
): WorkflowTransition | null {
  return WORKFLOW_TRANSITIONS.find((entry) => entry.from === from && entry.to === to) ?? null;
}

export function canTransition(from: ArticleWorkflowStatus, to: ArticleWorkflowStatus): boolean {
  return getTransition(from, to) !== null;
}

export function legalTargets(from: ArticleWorkflowStatus): ArticleWorkflowStatus[] {
  return WORKFLOW_TRANSITIONS.filter((entry) => entry.from === from).map((entry) => entry.to);
}
