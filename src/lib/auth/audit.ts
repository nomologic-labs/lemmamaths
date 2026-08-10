import "server-only";

import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/audit-schema";

export type AuditAction =
  | "role.granted"
  | "role.revoked"
  | "article.submitted"
  | "article.resubmitted"
  | "article.review_started"
  | "article.revision_requested"
  | "article.approved"
  | "article.published"
  | "article.reviewer_assigned"
  | "article.reviewer_unassigned"
  | "reviewer.assigned"
  | "reviewer.removed"
  | "review.started"
  | "review.comment.created"
  | "review.comment.updated"
  | "review.comment.resolved"
  | "review.decision.submitted";

export type AuditTargetType = "user" | "article" | "article_reviewer" | "review_comment";

export async function writeAuditEntry(input: {
  actorUserId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(auditLog).values({
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata ?? {},
  });
}
