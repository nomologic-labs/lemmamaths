import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody, headingId } from "@/components/articles/ArticleBody";
import { ArticleContents, type ContentsEntry } from "@/components/articles/ArticleContents";
import { ArticleHeader } from "@/components/articles/ArticleHeader";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { ReviewNote } from "@/components/articles/ReviewNote";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { authorLookupToRecord, resolveAuthorName } from "@/lib/articles/author-display";
import {
  getPublishedArticle,
  getPublicAuthorNameMap,
  listPublishedSlugs,
  listPublishedSummaries,
} from "@/lib/articles/public";
import { findRelated } from "@/lib/articles/query";
import styles from "./Article.module.css";

type ArticlePageProps = { params: Promise<{ slug: string }> };

/** Pre-render known published slugs when the database is available at build time. */
export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { robots: { index: false, follow: false } };

  const nameMap = await getPublicAuthorNameMap();
  const authors = article.authorIds
    .map((id) => nameMap.get(id))
    .filter((name): name is string => Boolean(name));

  return {
    title: article.title,
    description: article.description,
    authors: authors.map((name) => ({ name })),
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      publishedTime: article.publishedOn,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const [article, summaries, nameMap] = await Promise.all([
    getPublishedArticle(slug),
    listPublishedSummaries(),
    getPublicAuthorNameMap(),
  ]);
  if (!article) notFound();

  const authorNames = authorLookupToRecord(nameMap);
  // Authors without a public profile still get a byline from their handle; only
  // those with a profile page are linked.
  const authorOverrides = article.authorIds.map((id) => ({
    id,
    name: resolveAuthorName(id, nameMap),
    href: nameMap.has(id) ? `/authors/${id}` : undefined,
  }));

  const contents: ContentsEntry[] = article.body
    .filter((block) => block.kind === "heading")
    .map((block) => ({ id: headingId(block.text), text: block.text, level: block.level }));

  const related = findRelated(summaries, article);
  const year = new Date(`${article.publishedOn}T00:00:00Z`).getUTCFullYear();

  return (
    <>
      <Container className={styles.layout}>
        <article className={styles.main}>
          <ArticleHeader article={article} authorOverrides={authorOverrides} />
          <ArticleBody blocks={article.body} />
          <ReviewNote review={article.review} authorNames={authorNames} />

          <div className={styles.foot}>
            <Link href="/articles" className={styles.back}>
              <ArrowRightIcon size={16} />
              All articles
            </Link>
            <span className={styles.cite}>
              Lemma · {year} · {article.slug}
            </span>
          </div>
        </article>

        <div className={styles.rail}>
          <ArticleContents entries={contents} />
        </div>
      </Container>

      <RelatedArticles articles={related} authorNames={authorNames} />
    </>
  );
}
