import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleBody } from "@/components/articles/ArticleBody";
import { ArticleHeader } from "@/components/articles/ArticleHeader";
import { Container } from "@/components/ui/Container";
import { StatusPill } from "@/components/ui/StatusPill";
import { ArrowRightIcon } from "@/components/ui/icons";
import { canEditArticleRecord, canReadArticle } from "@/lib/articles/access";
import {
  WORKFLOW_CONTRIBUTOR_HINTS,
  WORKFLOW_LABELS,
} from "@/lib/articles/workflow-labels";
import { getArticleById, getAuthorDisplays, toAccessRecord } from "@/lib/articles/store";
import type { Article } from "@/data/types";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import styles from "./Preview.module.css";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DraftPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/login?callbackUrl=/dashboard/drafts/${id}/preview`);
  if (!user.handle) redirect(`/onboarding/handle?callbackUrl=/dashboard/drafts/${id}/preview`);

  const article = await getArticleById(id);
  if (!article || !canReadArticle(user.permissions, user.id, toAccessRecord(article))) {
    notFound();
  }

  const authorOverrides = await getAuthorDisplays(article.authorUserIds);
  const editable = canEditArticleRecord(user.permissions, user.id, toAccessRecord(article));

  const previewArticle: Article = {
    slug: article.slug,
    title: article.title,
    standfirst: article.standfirst ?? undefined,
    authorIds: authorOverrides.map((author) => author.id),
    publishedOn: article.publishedOn ?? new Date().toISOString().slice(0, 10),
    description: article.description,
    topics: article.topics,
    tags: article.tags,
    format: article.format,
    readingMinutes: article.readingMinutes,
    review: { status: article.peerReviewStatus },
    featured: article.featured,
    body: article.body,
  };

  const published = article.workflowStatus === "PUBLISHED";

  return (
    <Container className={styles.page}>
      <header className={styles.toolbar}>
        <Link
          href={published ? "/dashboard/published" : "/dashboard/drafts"}
          className={`${styles.link} ${styles.linkBack}`}
        >
          <ArrowRightIcon size={16} />
          {published ? "Published" : "My drafts"}
        </Link>
        {editable && (
          <Link href={`/dashboard/drafts/${id}`} className={styles.link}>
            Edit
          </Link>
        )}
        {published && (
          <Link href={`/articles/${article.slug}`} className={styles.link}>
            Read in the archive
          </Link>
        )}
        <span className={styles.state}>
          <StatusPill tone="accent">{WORKFLOW_LABELS[article.workflowStatus]}</StatusPill>
        </span>
      </header>

      <p className={styles.hint}>
        This is how the article will look when it is published.{" "}
        {WORKFLOW_CONTRIBUTOR_HINTS[article.workflowStatus]}
      </p>

      <article>
        <ArticleHeader article={previewArticle} authorOverrides={authorOverrides} />
        <ArticleBody blocks={previewArticle.body} />
      </article>
    </Container>
  );
}
