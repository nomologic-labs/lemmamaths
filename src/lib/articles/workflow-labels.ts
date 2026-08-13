import type { ArticleWorkflowStatus } from "./workflow";

export const WORKFLOW_LABELS: Record<ArticleWorkflowStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "In peer review",
  REVISION_REQUESTED: "Revision requested",
  RESUBMITTED: "Resubmitted",
  APPROVED: "Approved",
  PUBLISHED: "Published",
};

/**
 * What the state means to the contributor who wrote the article, and what they do next.
 * Written for a student who has not used an academic publishing system before.
 */
export const WORKFLOW_CONTRIBUTOR_HINTS: Record<ArticleWorkflowStatus, string> = {
  DRAFT: "Only you can see this. Submit it for peer review when it is ready.",
  SUBMITTED: "Waiting for an administrator to assign a reviewer. You cannot edit it while it is with the reviewers.",
  UNDER_REVIEW: "A reviewer is reading your article. You cannot edit it until a decision comes back.",
  REVISION_REQUESTED: "Reviewers have asked for changes. Edit your draft, then resubmit it for peer review.",
  RESUBMITTED: "Your revised article is back with the reviewers. You cannot edit it until a decision comes back.",
  APPROVED: "Approved for publication. An administrator will publish it to the archive.",
  PUBLISHED: "Published in the archive and readable by anyone. Published articles can no longer be edited.",
};

export function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
