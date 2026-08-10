"use client";

import { useTransition } from "react";
import type { ReviewCommentView } from "@/lib/articles/review-store";
import { resolveReviewCommentAction } from "@/lib/articles/review-actions";
import styles from "./ReviewWorkspace.module.css";

export function AuthorFeedbackPanel({
  comments,
  canResolve,
}: {
  comments: ReviewCommentView[];
  canResolve: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (comments.length === 0) {
    return null;
  }

  return (
    <section className={styles.feedbackPanel}>
      <h2 className={styles.feedbackTitle}>Reviewer feedback</h2>
      <p className={styles.sidebarBody}>
        Comments stay attached to block ids. If you deleted a block, its comments appear as
        referring to a removed block.
      </p>
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
              <span>·</span>
              <span>{comment.blockId}</span>
              {comment.resolved && <span>· Resolved</span>}
            </div>
            <p className={styles.commentBody}>{comment.body}</p>
            {canResolve && (
              <button
                type="button"
                className={styles.buttonQuiet}
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await resolveReviewCommentAction({
                      commentId: comment.id,
                      resolved: !comment.resolved,
                    });
                    window.location.reload();
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
