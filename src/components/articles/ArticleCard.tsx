import Link from "next/link";
import { topicName } from "@/data/topics";
import type { ArticleSummary } from "@/data/types";
import { formatAuthorNames } from "@/lib/articles/author-display";
import { FORMAT_LABELS, formatDateShort, formatReadingTime } from "@/lib/articles/labels";
import { PeerReviewBadge } from "./PeerReviewBadge";
import styles from "./ArticleCard.module.css";

export type ArticleCardProps = {
  article: ArticleSummary;
  /** `grid` for the homepage and topic pages, `list` for the archive. */
  variant?: "grid" | "list";
  /** Set on the first card of a section so the page has a sensible heading outline. */
  headingLevel?: 2 | 3;
  /** Off on an author's own page, where every row would carry the same name. */
  showAuthor?: boolean;
  /** Public handle → display name. Required for correct author lines once mock data is not the registry. */
  authorNames?: Record<string, string>;
};

export function ArticleCard({
  article,
  variant = "grid",
  headingLevel = 3,
  showAuthor = true,
  authorNames,
}: ArticleCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const primaryTopic = article.topics[0];

  return (
    <article
      className={[styles.card, variant === "list" ? styles.list : ""].filter(Boolean).join(" ")}
    >
      <p className={styles.eyebrow}>
        {primaryTopic && <span>{topicName(primaryTopic)}</span>}
        <span className={styles.format}>{FORMAT_LABELS[article.format]}</span>
      </p>

      <Heading className={styles.title}>
        <Link href={`/articles/${article.slug}`} className={styles.link}>
          {article.title}
        </Link>
      </Heading>

      <p className={styles.description}>{article.description}</p>

      <div className={styles.meta}>
        {showAuthor && (
          <span className={styles.author}>
            {formatAuthorNames(article.authorIds, authorNames)}
          </span>
        )}
        <span className={styles.dates}>
          <span>{formatDateShort(article.publishedOn)}</span>
          <span className={styles.dot} aria-hidden="true">
            ·
          </span>
          <span>{formatReadingTime(article.readingMinutes)}</span>
        </span>
        <PeerReviewBadge status={article.review.status} />
      </div>
    </article>
  );
}
