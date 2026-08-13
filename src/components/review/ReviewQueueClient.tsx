"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { publishArticleAction } from "@/lib/articles/actions";
import {
  assignReviewerAction,
  editorApproveArticleAction,
  editorRequestRevisionAction,
  removeReviewerAction,
  startArticleReviewAction,
} from "@/lib/articles/review-actions";
import type { ReviewQueueItem } from "@/lib/articles/review-store";
import { assignmentStatusLabel, reviewDecisionLabel } from "@/lib/articles/review-labels";
import { WORKFLOW_LABELS } from "@/lib/articles/workflow-labels";
import { StatusPill } from "@/components/ui/StatusPill";
import styles from "./ReviewWorkspace.module.css";

type EligibleReviewer = { id: string; handle: string; name: string | null };

export function ReviewQueueClient({
  items,
  eligibleReviewers,
}: {
  items: ReviewQueueItem[];
  eligibleReviewers: EligibleReviewer[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return (
      <p className={styles.empty}>
        Nothing waiting for editorial review. Articles appear here once a contributor submits
        them for peer review.
      </p>
    );
  }

  return (
    <div className={styles.queueWrap}>
      {error && <p className={styles.error}>{error}</p>}
      <ul className={styles.queueList}>
        {items.map((item) => (
          <li key={item.id} className={styles.queueItem}>
            <div>
              <h2 className={styles.itemTitle}>
                <Link href={`/dashboard/review/${item.id}`}>{item.title}</Link>
              </h2>
              <p className={styles.itemMeta}>
                <StatusPill>{WORKFLOW_LABELS[item.workflowStatus]}</StatusPill>
                <span>{item.authorHandles.map((handle) => `@${handle}`).join(", ")}</span>
                <span>·</span>
                <span>
                  Updated{" "}
                  {new Date(item.updatedAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {item.openRoundNumber != null && (
                  <>
                    <span>·</span>
                    <span>Round {item.openRoundNumber}</span>
                  </>
                )}
              </p>
              <p className={styles.itemMeta}>
                Reviewers:{" "}
                {item.assignedReviewers.length === 0
                  ? "none assigned yet"
                  : item.assignedReviewers
                      .map((reviewer) => {
                        const decision = reviewDecisionLabel(reviewer.decision);
                        const state = decision ?? assignmentStatusLabel(reviewer.status);
                        return `@${reviewer.handle ?? "user"} — ${state}`;
                      })
                      .join("; ")}
              </p>
            </div>

            <div className={styles.itemActions}>
              <label className={styles.label}>
                Assign reviewer
                <select
                  className={styles.select}
                  value={selections[item.id] ?? ""}
                  onChange={(event) =>
                    setSelections((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  {eligibleReviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      @{reviewer.handle}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={styles.button}
                disabled={pending || !selections[item.id]}
                onClick={() => {
                  const reviewerUserId = selections[item.id];
                  if (!reviewerUserId) return;
                  setError(null);
                  startTransition(async () => {
                    const result = await assignReviewerAction({
                      articleId: item.id,
                      reviewerUserId,
                    });
                    if (!result.ok) setError(result.error);
                    else router.refresh();
                  });
                }}
              >
                Assign
              </button>

              {item.assignedReviewers
                .filter((reviewer) => reviewer.status === "assigned")
                .map((reviewer) => (
                  <button
                    key={reviewer.userId}
                    type="button"
                    className={styles.buttonQuiet}
                    disabled={pending}
                    onClick={() => {
                      setError(null);
                      startTransition(async () => {
                        const result = await removeReviewerAction({
                          articleId: item.id,
                          reviewerUserId: reviewer.userId,
                        });
                        if (!result.ok) setError(result.error);
                        else router.refresh();
                      });
                    }}
                  >
                    Remove @{reviewer.handle}
                  </button>
                ))}

              {(item.workflowStatus === "SUBMITTED" || item.workflowStatus === "RESUBMITTED") && (
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await startArticleReviewAction(item.id);
                      if (!result.ok) setError(result.error);
                      else router.refresh();
                    });
                  }}
                >
                  Start peer review
                </button>
              )}

              {item.workflowStatus === "UNDER_REVIEW" && (
                <>
                  <button
                    type="button"
                    className={styles.button}
                    disabled={pending}
                    onClick={() => {
                      setError(null);
                      startTransition(async () => {
                        const result = await editorRequestRevisionAction(item.id);
                        if (!result.ok) setError(result.error);
                        else router.refresh();
                      });
                    }}
                  >
                    Request revisions
                  </button>
                  <button
                    type="button"
                    className={styles.buttonPrimary}
                    disabled={pending}
                    onClick={() => {
                      setError(null);
                      startTransition(async () => {
                        const result = await editorApproveArticleAction(item.id);
                        if (!result.ok) setError(result.error);
                        else router.refresh();
                      });
                    }}
                  >
                    Approve
                  </button>
                </>
              )}

              {item.workflowStatus === "APPROVED" && (
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await publishArticleAction(item.id);
                      if (!result.ok) setError(result.error);
                      else router.refresh();
                    });
                  }}
                >
                  Publish
                </button>
              )}

              {item.workflowStatus === "PUBLISHED" && (
                <p className={styles.itemMeta}>
                  Published{item.publishedOn ? ` ${item.publishedOn}` : ""}
                  {" · "}
                  <Link href={`/articles/${item.slug}`} className={styles.link}>
                    Read in the archive
                  </Link>
                </p>
              )}

              <Link href={`/dashboard/review/${item.id}`} className={styles.link}>
                Open review
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
