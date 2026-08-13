import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { topicName } from "@/data/topics";
import { authorLookupToRecord } from "@/lib/articles/author-display";
import { formatDate } from "@/lib/articles/labels";
import {
  getArticlesByAuthorHandle,
  getPublicAuthor,
  getPublicAuthorNameMap,
  listPublicAuthors,
  listPublishedSummaries,
} from "@/lib/articles/public";
import { archiveHref } from "@/lib/articles/query";
import styles from "./Author.module.css";

type AuthorPageProps = { params: Promise<{ id: string }> };

/** `id` in the URL is the public handle (not an internal UUID). */
export async function generateStaticParams() {
  const authors = await listPublicAuthors();
  return authors.map((author) => ({ id: author.id }));
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { id } = await params;
  const author = await getPublicAuthor(id);
  if (!author) return { robots: { index: false, follow: false } };
  return { title: author.name, description: author.bio };
}

/**
 * An author's page. Route param remains `/authors/[id]` for compatibility; the value is
 * the public handle.
 */
export default async function AuthorPage({ params }: AuthorPageProps) {
  const { id } = await params;
  const [author, written, summaries, nameMap] = await Promise.all([
    getPublicAuthor(id),
    getArticlesByAuthorHandle(id),
    listPublishedSummaries(),
    getPublicAuthorNameMap(),
  ]);
  if (!author) notFound();

  const authorNames = authorLookupToRecord(nameMap);
  const refereed = summaries.filter((article) =>
    article.review.reviewerIds?.includes(author.id),
  );

  return (
    <>
      <PageHeader
        eyebrow={author.role}
        title={author.name}
        lede={
          <>
            {written.length} {written.length === 1 ? "article" : "articles"} in the archive
            {refereed.length > 0 && `, ${refereed.length} refereed for other authors`}.
          </>
        }
      />
      <Container className={styles.page}>
        <div className={styles.profile}>
          <p className={styles.bio}>{author.bio}</p>
          <div className={styles.facts}>
            <div className={styles.fact}>
              <span className={styles.factKey}>Writes about</span>
              <span className={styles.factValue}>
                {author.interests.map((topic, index) => (
                  <span key={topic}>
                    {index > 0 && " · "}
                    <Link href={archiveHref({ topics: [topic] })}>{topicName(topic)}</Link>
                  </span>
                ))}
              </span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factKey}>Contributing since</span>
              <span className={styles.factValue}>{formatDate(author.joinedOn)}</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factKey}>In the archive</span>
              <span className={styles.factValue}>
                <Link href={archiveHref({ authors: [author.id] })}>
                  Filter the archive by this author
                </Link>
              </span>
            </div>
          </div>
        </div>

        <h2 className={styles.sectionLabel}>Published</h2>
        {written.length > 0 ? (
          <div className={styles.list}>
            {written.map((article) => (
              <ArticleCard
                key={article.slug}
                article={article}
                variant="list"
                showAuthor={article.authorIds.length > 1}
                authorNames={authorNames}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            Nothing published yet. They may still be reviewing other contributors&apos; articles.
          </p>
        )}

        {refereed.length > 0 && (
          <>
            <h2 className={styles.sectionLabel}>Refereed</h2>
            <p className={styles.refereed}>
              {refereed.map((article, index) => (
                <span key={article.slug}>
                  {index > 0 && "· "}
                  <Link href={`/articles/${article.slug}`}>{article.title}</Link>{" "}
                </span>
              ))}
            </p>
          </>
        )}
      </Container>
    </>
  );
}
