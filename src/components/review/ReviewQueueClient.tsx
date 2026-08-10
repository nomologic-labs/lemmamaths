"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { publishArticleAction } from "@/lib/articles/actions";
import {
  assignReviewerAction,
  editorApproveArticleAction,
  editorRequestRevisionAction,
  removeReviewerAction,
  startArticleReviewAction,
} from "@/lib/articles/review-actions";
import type { ReviewQueueItem } from "@/lib/articles/review-store";
import { WORKFLOW_LABELS } from "@/lib/articles/workflow-labels";
import styles from "./ReviewWorkspace.module.css";

type EligibleReviewer = { id: string; handle: string; name: string | null };

export function ReviewQueueClient({
  items,
  eligibleReviewers,
}: {
  items: ReviewQueueItem[];
  eligibleReviewers: EligibleReviewer[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return <p className={styles.empty}>No submissions in the editorial queue yet.</p>;
  }

  return (
    <div>
      {error && <p className={styles.error}>{error}</p>}
      <ul className={styles.queueList}>
        {items.map((item) => (
          <li key={item.id} className={styles.queueItem}>
            <div>
              <h2 className={styles.itemTitle}>
                <Link href={`/dashboard/review/${item.id}`}>{item.title}</Link>
              </h2>
              <p className={styles.itemMeta}>
                <span>{WORKFLOW_LABELS[item.workflowStatus]}</span>
                <span>·</span>
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
                  ? "none"
                  : item.assignedReviewers
                      .map((reviewer) => {
                        const decision = reviewer.decision
                          ? ` (${reviewer.decision.replaceAll("_", " ")})`
                          : "";
                        return `@${reviewer.handle ?? "user"} [${reviewer.status}]${decision}`;
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
                    else window.location.reload();
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
                        else window.location.reload();
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
                      else window.location.reload();
                    });
                  }}
                >
                  Start review
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
                        else window.location.reload();
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
                        else window.location.reload();
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
                      else window.location.reload();
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
                    View public article
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
