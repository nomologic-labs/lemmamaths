import type { ReviewDecision } from "./review-access";

/** A reviewer's recommendation. Administrators make the binding decision. */
export const REVIEW_DECISION_LABELS: Record<ReviewDecision, string> = {
  request_revisions: "Revisions recommended",
  recommend_approval: "Approval recommended",
};

export type ReviewAssignmentStatus = "assigned" | "completed" | "withdrawn";

export const ASSIGNMENT_STATUS_LABELS: Record<ReviewAssignmentStatus, string> = {
  assigned: "Not yet reviewed",
  completed: "Review submitted",
  withdrawn: "Withdrawn",
};

export function reviewDecisionLabel(decision: string | null): string | null {
  if (!decision) return null;
  return REVIEW_DECISION_LABELS[decision as ReviewDecision] ?? decision.replaceAll("_", " ");
}

export function assignmentStatusLabel(status: string): string {
  return ASSIGNMENT_STATUS_LABELS[status as ReviewAssignmentStatus] ?? status;
}
