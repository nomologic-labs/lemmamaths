import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, ARTICLE_SUMMARIES, getArticle } from "@/data/articles";
import { getAuthor } from "@/data/authors";
import { findRelated } from "@/lib/articles/query";
import { ArticleBody, headingId } from "@/components/articles/ArticleBody";
import { ArticleContents, type ContentsEntry } from "@/components/articles/ArticleContents";
import { ArticleHeader } from "@/components/articles/ArticleHeader";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { ReviewNote } from "@/components/articles/ReviewNote";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import styles from "./Article.module.css";

type ArticlePageProps = { params: Promise<{ slug: string }> };

/** Every article is known at build time, so each page is pre-rendered. */
export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  const authors = article.authorIds
    .map((id) => getAuthor(id)?.name)
    .filter((name) => name !== undefined);

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
  const article = getArticle(slug);
  if (!article) notFound();

  const contents: ContentsEntry[] = article.body
    .filter((block) => block.kind === "heading")
    .map((block) => ({ id: headingId(block.text), text: block.text, level: block.level }));

  const related = findRelated(ARTICLE_SUMMARIES, article);
  const year = new Date(`${article.publishedOn}T00:00:00Z`).getUTCFullYear();

  return (
    <>
      <Container className={styles.layout}>
        <article className={styles.main}>
          <ArticleHeader article={article} />
          <ArticleBody blocks={article.body} />
          <ReviewNote review={article.review} />

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

      <RelatedArticles articles={related} />
    </>
  );
}
