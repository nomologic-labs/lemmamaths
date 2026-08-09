import Link from "next/link";
import { Fragment } from "react";
import { getAuthor } from "@/data/authors";
import type { ReviewRecord } from "@/data/types";
import { REVIEW_DESCRIPTIONS, formatDate } from "@/lib/articles/labels";
import { PeerReviewBadge } from "./PeerReviewBadge";
import styles from "./ReviewNote.module.css";

export function ReviewNote({ review }: { review: ReviewRecord }) {
  const referees = (review.reviewerIds ?? [])
    .map((id) => getAuthor(id))
    .filter((author) => author !== undefined);

  return (
    <aside className={styles.note} aria-label="Review record">
      <div className={styles.head}>
        <span className={styles.label}>Review</span>
        <PeerReviewBadge status={review.status} size="large" />
      </div>
      <p className={styles.body}>{REVIEW_DESCRIPTIONS[review.status]}</p>
      {referees.length > 0 && (
        <p className={styles.referees}>
          Refereed by{" "}
          {referees.map((referee, index) => (
            <Fragment key={referee.id}>
              {index > 0 && (index === referees.length - 1 ? " and " : ", ")}
              <Link href={`/authors/${referee.id}`}>{referee.name}</Link>
            </Fragment>
          ))}
          {review.completedOn && <>, completed {formatDate(review.completedOn)}</>}.
        </p>
      )}
    </aside>
  );
}
