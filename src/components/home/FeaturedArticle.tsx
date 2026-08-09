import Link from "next/link";
import { PeerReviewBadge } from "@/components/articles/PeerReviewBadge";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { getAuthors } from "@/data/authors";
import { topicName } from "@/data/topics";
import type { ArticleSummary } from "@/data/types";
import { FORMAT_LABELS, formatDate, formatReadingTime } from "@/lib/articles/labels";
import { archiveHref } from "@/lib/articles/query";
import styles from "./HomeSections.module.css";

/**
 * The lead article, given a spread of its own. The right-hand column is a colophon —
 * the block of metadata a journal prints beside a featured piece — which keeps the
 * left-hand column free for nothing but type.
 */
export function FeaturedArticle({ article }: { article: ArticleSummary }) {
  const authors = getAuthors(article.authorIds);
  const referees = getAuthors(article.review.reviewerIds ?? []);

  return (
    <section className={styles.featured} aria-labelledby="featured-heading">
      <Container className={styles.featuredInner}>
        <Reveal shift="1rem">
          <p className={styles.featuredEyebrow}>
            <span>Featured</span>
          </p>

          <h2 id="featured-heading" className={styles.featuredTitle}>
            <Link href={`/articles/${article.slug}`}>{article.title}</Link>
          </h2>

          {article.standfirst && <p className={styles.featuredStandfirst}>{article.standfirst}</p>}

          <p className={styles.featuredDescription}>{article.description}</p>

          <Link href={`/articles/${article.slug}`} className={styles.featuredAction}>
            Read the article
            <ArrowRightIcon size={16} />
          </Link>
        </Reveal>

        <Reveal delay={120} shift="1rem" className={styles.colophon}>
          <div className={styles.colophonRow}>
            <span className={styles.colophonKey}>
              {authors.length === 1 ? "Author" : "Authors"}
            </span>
            <span className={styles.colophonValue}>
              {authors.map((author, i) => (
                <span key={author.id}>
                  {i > 0 && ", "}
                  <Link href={`/authors/${author.id}`}>{author.name}</Link>
                </span>
              ))}
            </span>
          </div>

          <div className={styles.colophonRow}>
            <span className={styles.colophonKey}>Published</span>
            <span className={styles.colophonValue}>
              {formatDate(article.publishedOn)} · {formatReadingTime(article.readingMinutes)}
            </span>
          </div>

          <div className={styles.colophonRow}>
            <span className={styles.colophonKey}>Filed under</span>
            <span className={styles.colophonValue}>
              {article.topics.map(topicName).join(", ")} · {FORMAT_LABELS[article.format]}
            </span>
          </div>

          <div className={styles.colophonRow}>
            <span className={styles.colophonKey}>Review</span>
            <span className={styles.colophonValue}>
              <PeerReviewBadge status={article.review.status} size="large" />
              {referees.length > 0 && (
                <>
                  <br />
                  Refereed by {referees.map((r) => r.name).join(" and ")}
                </>
              )}
            </span>
          </div>

          <div className={styles.colophonRow}>
            <span className={styles.colophonKey}>Tags</span>
            <span className={styles.tagRow}>
              {article.tags.slice(0, 5).map((tag) => (
                <Link key={tag} href={archiveHref({ search: tag })} className={styles.tag}>
                  {tag}
                </Link>
              ))}
            </span>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
