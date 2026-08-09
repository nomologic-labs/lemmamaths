import { EditorialIcon, InReviewIcon, ReviewedIcon } from "@/components/ui/icons";
import type { PeerReviewStatus } from "@/data/types";
import { REVIEW_DESCRIPTIONS, REVIEW_LABELS } from "@/lib/articles/labels";
import styles from "./PeerReviewBadge.module.css";

const STYLE_BY_STATUS: Record<PeerReviewStatus, { className: string; Icon: typeof ReviewedIcon }> = {
  "peer-reviewed": { className: styles.peerReviewed!, Icon: ReviewedIcon },
  "editorial-review": { className: styles.editorialReview!, Icon: EditorialIcon },
  "under-review": { className: styles.underReview!, Icon: InReviewIcon },
};

export type PeerReviewBadgeProps = {
  status: PeerReviewStatus;
  size?: "small" | "large";
};

export function PeerReviewBadge({ status, size = "small" }: PeerReviewBadgeProps) {
  const { className, Icon } = STYLE_BY_STATUS[status];
  return (
    <span
      className={[styles.badge, className, size === "large" ? styles.large : ""]
        .filter(Boolean)
        .join(" ")}
      title={REVIEW_DESCRIPTIONS[status]}
    >
      <Icon size={size === "large" ? 16 : 14} className={styles.icon} />
      {REVIEW_LABELS[status]}
    </span>
  );
}
