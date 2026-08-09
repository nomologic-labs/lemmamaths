import Link from "next/link";
import { Fragment } from "react";
import { getAuthor } from "@/data/authors";
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
export function ArticleHeader({ article }: { article: Article }) {
  const authors = article.authorIds.map((id) => getAuthor(id)).filter((a) => a !== undefined);

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

      <div className={styles.byline}>
        <span className={styles.authors}>
          {authors.map((author, index) => (
            <Fragment key={author.id}>
              {index > 0 && (index === authors.length - 1 ? " and " : ", ")}
              <Link href={`/authors/${author.id}`}>{author.name}</Link>
            </Fragment>
          ))}
        </span>
        <span className={styles.dates}>
          {formatDate(article.publishedOn)}
          {article.updatedOn && (
            <span className={styles.updated}> · updated {formatDate(article.updatedOn)}</span>
          )}
        </span>
        <span>{formatReadingTime(article.readingMinutes)}</span>
        <PeerReviewBadge status={article.review.status} />
      </div>

      <div className={styles.tags}>
        {article.tags.map((tag) => (
          <Link key={tag} href={`/articles?q=${encodeURIComponent(tag)}`} className={styles.tag}>
            {tag}
          </Link>
        ))}
      </div>
    </header>
  );
}
