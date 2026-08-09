import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLE_SUMMARIES, getArticlesByAuthor } from "@/data/articles";
import { AUTHORS, getAuthor } from "@/data/authors";
import { topicName } from "@/data/topics";
import { formatDate } from "@/lib/articles/labels";
import { archiveHref } from "@/lib/articles/query";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import styles from "./Author.module.css";

type AuthorPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return AUTHORS.map((author) => ({ id: author.id }));
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { id } = await params;
  const author = getAuthor(id);
  if (!author) return {};
  return { title: author.name, description: author.bio };
}

/**
 * An author's page.
 *
 * The article list is the archive's own card, and "everything by this author" is a link
 * into the archive rather than a second listing here — the same arrangement /topics
 * uses. When authors become real accounts, this page gains ownership and settings; the
 * public half of it does not have to change.
 */
export default async function AuthorPage({ params }: AuthorPageProps) {
  const { id } = await params;
  const author = getAuthor(id);
  if (!author) notFound();

  const written = getArticlesByAuthor(author.id);
  const refereed = ARTICLE_SUMMARIES.filter((article) =>
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
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            Nothing published yet. {author.name.split(" ")[0]} is currently refereeing for
            other authors.
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
