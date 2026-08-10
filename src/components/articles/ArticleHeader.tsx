import Link from "next/link";
import { Fragment } from "react";
import { topicName } from "@/data/topics";
import type { Article } from "@/data/types";
import { FORMAT_LABELS, formatDate, formatReadingTime } from "@/lib/articles/labels";
import { archiveHref } from "@/lib/articles/query";
import { PeerReviewBadge } from "./PeerReviewBadge";
import styles from "./ArticleHeader.module.css";

/**
 * Everything above the first paragraph. Each piece of metadata that identifies a set of
 * articles — topic, author, tag — is a link into the archive with that filter applied,
 * so the reader can always leave an article sideways rather than only backwards.
 */
export function ArticleHeader({
  article,
  authorOverrides,
}: {
  article: Article;
  authorOverrides?: { id: string; name: string }[];
}) {
  const authors = authorOverrides ?? [];

  return (
    <header className={styles.header}>
      <p className={styles.breadcrumb}>
        {article.topics.map((topic, index) => (
          <Fragment key={topic}>
            {index > 0 && <span className={styles.separator}>·</span>}
            <Link href={archiveHref({ topics: [topic] })}>{topicName(topic)}</Link>
          </Fragment>
        ))}
        <span className={styles.separator}>·</span>
        <span>{FORMAT_LABELS[article.format]}</span>
      </p>

      <h1 className={styles.title}>{article.title}</h1>

      {article.standfirst && <p className={styles.standfirst}>{article.standfirst}</p>}

      <div className={styles.meta}>
        <p className={styles.authors}>
          {authors.map((author, index) => (
            <Fragment key={author.id}>
              {index > 0 && (index === authors.length - 1 ? " and " : ", ")}
              <Link href={`/authors/${author.id}`}>{author.name}</Link>
            </Fragment>
          ))}
        </p>
        <p className={styles.facts}>
          {formatDate(article.publishedOn)}
          <span className={styles.separator}>·</span>
          {formatReadingTime(article.readingMinutes)}
          <span className={styles.separator}>·</span>
          <PeerReviewBadge status={article.review.status} />
        </p>
      </div>

      {article.tags.length > 0 && (
        <ul className={styles.tags}>
          {article.tags.map((tag) => (
            <li key={tag}>
              <Link href={archiveHref({ search: tag })}>{tag}</Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
