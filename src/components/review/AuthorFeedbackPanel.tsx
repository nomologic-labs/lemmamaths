"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReviewCommentView } from "@/lib/articles/review-store";
import { resolveReviewCommentAction } from "@/lib/articles/review-actions";
import styles from "./ReviewWorkspace.module.css";

export function AuthorFeedbackPanel({
  comments,
  blockLabels,
  canResolve,
}: {
  comments: ReviewCommentView[];
  blockLabels: Record<string, string>;
  canResolve: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (comments.length === 0) {
    return null;
  }

  return (
    <section className={styles.feedbackPanel}>
      <h2 className={styles.feedbackTitle}>Reviewer feedback</h2>
      <p className={styles.sidebarBody}>
        Each comment is attached to one block of your article. Mark a comment as addressed once
        you have made the change. If you deleted the block a comment refers to, it is shown as
        referring to a removed block.
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <ul className={styles.commentList}>
        {comments.map((comment) => (
          <li
            key={comment.id}
            className={styles.comment}
            data-orphaned={comment.blockPresent ? "false" : "true"}
          >
            {!comment.blockPresent && (
              <p className={styles.orphanNote}>Refers to a block no longer in the article.</p>
            )}
            <div className={styles.commentMeta}>
              <span>@{comment.authorHandle ?? "reviewer"}</span>
              <span>·</span>
              <span>Round {comment.roundNumber}</span>
              {blockLabels[comment.blockId] ? (
                <>
                  <span>·</span>
                  <span>{blockLabels[comment.blockId]}</span>
                </>
              ) : null}
              {comment.resolved && <span>· Addressed</span>}
            </div>
            <p className={styles.commentBody}>{comment.body}</p>
            {canResolve && (
              <button
                type="button"
                className={styles.buttonQuiet}
                disabled={pending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await resolveReviewCommentAction({
                      commentId: comment.id,
                      resolved: !comment.resolved,
                    });
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    router.refresh();
                  });
                }}
              >
                {comment.resolved ? "Reopen" : "Mark addressed"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
