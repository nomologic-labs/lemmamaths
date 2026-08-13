"use client";

import type { ReactNode } from "react";
import type { ArticleBlock } from "@/data/types";
import { BLOCK_KIND_LABELS } from "@/lib/articles/block-labels";
import { useReviewUi } from "./ReviewInteractive";
import styles from "./ReviewWorkspace.module.css";

type ReviewBlockChromeProps = {
  blockId: string;
  kind: ArticleBlock["kind"];
  children: ReactNode;
};

export function ReviewBlockChrome({ blockId, kind, children }: ReviewBlockChromeProps) {
  const { activeBlockId, setActiveBlockId, commentStats, blockLabels } = useReviewUi();
  const stats = commentStats.get(blockId) ?? { total: 0, unresolved: 0 };

  return (
    <div
      className={styles.blockChrome}
      data-has-comments={stats.total > 0 ? "true" : "false"}
      data-active={activeBlockId === blockId ? "true" : "false"}
    >
      {children}
      <div className={styles.blockActions}>
        <button type="button" className={styles.chip} onClick={() => setActiveBlockId(blockId)}>
          {stats.total > 0
            ? `${stats.total} comment${stats.total === 1 ? "" : "s"}${
                stats.unresolved ? ` · ${stats.unresolved} open` : ""
              }`
            : "Comment"}
        </button>
        <span className={styles.meta}>{blockLabels[blockId] ?? BLOCK_KIND_LABELS[kind]}</span>
      </div>
    </div>
  );
}
