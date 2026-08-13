"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createReviewCommentAction,
  resolveReviewCommentAction,
  submitReviewDecisionAction,
  updateReviewCommentAction,
} from "@/lib/articles/review-actions";
import type { ReviewCommentView } from "@/lib/articles/review-store";
import styles from "./ReviewWorkspace.module.css";

export type SerializableReviewComment = Omit<
  ReviewCommentView,
  "createdAt" | "updatedAt" | "resolvedAt"
> & {
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

type ReviewSidebarProps = {
  articleId: string;
  comments: SerializableReviewComment[];
  activeBlockId: string | null;
  activeBlockLabel: string | null;
  onSelectBlock: (blockId: string | null) => void;
  canComment: boolean;
  canDecide: boolean;
  currentUserId: string;
  isEditor: boolean;
};

export function ReviewSidebar({
  articleId,
  comments,
  activeBlockId,
  activeBlockLabel,
  onSelectBlock,
  canComment,
  canDecide,
  currentUserId,
  isEditor,
}: ReviewSidebarProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const commentsByBlock = useMemo(() => {
    const map = new Map<string, SerializableReviewComment[]>();
    for (const comment of comments) {
      const list = map.get(comment.blockId) ?? [];
      list.push(comment);
      map.set(comment.blockId, list);
    }
    return map;
  }, [comments]);

  const orphaned = comments.filter((comment) => !comment.blockPresent);
  const activeComments = activeBlockId ? (commentsByBlock.get(activeBlockId) ?? []) : [];

  function submitComment() {
    if (!activeBlockId || !draft.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createReviewCommentAction({
        articleId,
        blockId: activeBlockId,
        body: draft.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft("");
      router.refresh();
    });
  }

  function submitDecision(decision: "request_revisions" | "recommend_approval") {
    setError(null);
    startTransition(async () => {
      const result = await submitReviewDecisionAction({ articleId, decision });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>{activeBlockId ? "Comments" : "Peer review"}</h2>
      {!activeBlockId && (
        <p className={styles.sidebarBody}>
          Choose a block in the article to read or leave comments on it. Comments stay with that
          block if blocks are reordered, and carry into later review rounds.
        </p>
      )}

      {activeBlockId && (
        <>
          <p className={styles.meta}>{activeBlockLabel ?? "Selected block"}</p>
          <button type="button" className={styles.buttonQuiet} onClick={() => onSelectBlock(null)}>
            Clear selection
          </button>
          <ul className={styles.commentList}>
            {activeComments.length === 0 && (
              <li className={styles.sidebarBody}>No comments on this block yet.</li>
            )}
            {activeComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isEditor={isEditor}
                canResolve={comment.authorUserId === currentUserId || isEditor}
                pending={pending}
                onError={setError}
              />
            ))}
          </ul>

          {canComment && (
            <div className={styles.form}>
              <label className={styles.label}>
                Add comment
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={4000}
                />
              </label>
              <button
                type="button"
                className={styles.buttonPrimary}
                disabled={pending || !draft.trim()}
                onClick={submitComment}
              >
                Save comment
              </button>
            </div>
          )}
        </>
      )}

      {orphaned.length > 0 && (
        <div>
          <h3 className={styles.sidebarTitle}>Removed blocks</h3>
          <p className={styles.sidebarBody}>
            These comments refer to blocks that are no longer in the article.
          </p>
          <ul className={styles.commentList}>
            {orphaned.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isEditor={isEditor}
                canResolve={comment.authorUserId === currentUserId || isEditor}
                pending={pending}
                onError={setError}
              />
            ))}
          </ul>
        </div>
      )}

      {canDecide && (
        <div className={styles.form}>
          <h3 className={styles.sidebarTitle}>Your recommendation</h3>
          <p className={styles.sidebarBody}>
            Sending your recommendation completes your assignment for this round. An
            administrator makes the final decision on the article.
          </p>
          <div className={styles.decisionRow}>
            <button
              type="button"
              className={styles.button}
              disabled={pending}
              onClick={() => submitDecision("request_revisions")}
            >
              Recommend revisions
            </button>
            <button
              type="button"
              className={styles.buttonPrimary}
              disabled={pending}
              onClick={() => submitDecision("recommend_approval")}
            >
              Recommend approval
            </button>
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </aside>
  );
}

function CommentCard({
  comment,
  currentUserId,
  isEditor,
  canResolve,
  pending,
  onError,
}: {
  comment: SerializableReviewComment;
  currentUserId: string;
  isEditor: boolean;
  canResolve: boolean;
  pending: boolean;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [cardPending, startCardTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const canEdit = comment.authorUserId === currentUserId || isEditor;
  const createdLabel = new Date(comment.createdAt).toLocaleString("en-GB");
  const busy = pending || cardPending;

  return (
    <li className={styles.comment} data-orphaned={comment.blockPresent ? "false" : "true"}>
      {!comment.blockPresent && (
        <p className={styles.orphanNote}>Refers to a block no longer in the article.</p>
      )}
      <div className={styles.commentMeta}>
        <span>@{comment.authorHandle ?? "reviewer"}</span>
        <span>·</span>
        <span>Round {comment.roundNumber}</span>
        <span>·</span>
        <span>{createdLabel}</span>
        {comment.resolved && <span>· Addressed</span>}
      </div>
      {editing ? (
        <div className={styles.form}>
          <textarea
            className={styles.textarea}
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className={styles.decisionRow}>
            <button
              type="button"
              className={styles.buttonPrimary}
              disabled={busy}
              onClick={() => {
                onError(null);
                startCardTransition(async () => {
                  const result = await updateReviewCommentAction({
                    commentId: comment.id,
                    body,
                  });
                  if (!result.ok) {
                    onError(result.error);
                    return;
                  }
                  setEditing(false);
                  router.refresh();
                });
              }}
            >
              Save
            </button>
            <button type="button" className={styles.buttonQuiet} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.commentBody}>{comment.body}</p>
      )}
      <div className={styles.blockActions}>
        {canEdit && !editing && (
          <button type="button" className={styles.buttonQuiet} disabled={busy} onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
        {canResolve && (
          <button
            type="button"
            className={styles.buttonQuiet}
            disabled={busy}
            onClick={() => {
              onError(null);
              startCardTransition(async () => {
                const result = await resolveReviewCommentAction({
                  commentId: comment.id,
                  resolved: !comment.resolved,
                });
                if (!result.ok) {
                  onError(result.error);
                  return;
                }
                router.refresh();
              });
            }}
          >
            {comment.resolved ? "Reopen" : "Mark addressed"}
          </button>
        )}
      </div>
    </li>
  );
}
