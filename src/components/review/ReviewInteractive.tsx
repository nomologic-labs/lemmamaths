"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ReviewSidebar, type SerializableReviewComment } from "./ReviewSidebar";
import styles from "./ReviewWorkspace.module.css";

type ReviewUiContextValue = {
  activeBlockId: string | null;
  setActiveBlockId: (blockId: string | null) => void;
  commentStats: Map<string, { total: number; unresolved: number }>;
  /** Block id → reader-facing name such as "Paragraph 3". */
  blockLabels: Record<string, string>;
};

const ReviewUiContext = createContext<ReviewUiContextValue | null>(null);

export function useReviewUi(): ReviewUiContextValue {
  const value = useContext(ReviewUiContext);
  if (!value) {
    throw new Error("useReviewUi must be used within ReviewInteractive");
  }
  return value;
}

type ReviewInteractiveProps = {
  articleId: string;
  comments: SerializableReviewComment[];
  blockLabels: Record<string, string>;
  canComment: boolean;
  canDecide: boolean;
  currentUserId: string;
  isEditor: boolean;
  children: ReactNode;
};

export function ReviewInteractive({
  articleId,
  comments,
  blockLabels,
  canComment,
  canDecide,
  currentUserId,
  isEditor,
  children,
}: ReviewInteractiveProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const commentStats = useMemo(() => {
    const map = new Map<string, { total: number; unresolved: number }>();
    for (const comment of comments) {
      const current = map.get(comment.blockId) ?? { total: 0, unresolved: 0 };
      current.total += 1;
      if (!comment.resolved) current.unresolved += 1;
      map.set(comment.blockId, current);
    }
    return map;
  }, [comments]);

  return (
    <ReviewUiContext.Provider
      value={{ activeBlockId, setActiveBlockId, commentStats, blockLabels }}
    >
      <div className={styles.layout}>
        <div className={styles.article}>{children}</div>
        <ReviewSidebar
          articleId={articleId}
          comments={comments}
          activeBlockId={activeBlockId}
          activeBlockLabel={activeBlockId ? (blockLabels[activeBlockId] ?? null) : null}
          onSelectBlock={setActiveBlockId}
          canComment={canComment}
          canDecide={canDecide}
          currentUserId={currentUserId}
          isEditor={isEditor}
        />
      </div>
    </ReviewUiContext.Provider>
  );
}
