import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleBody } from "@/components/articles/ArticleBody";
import { ArticleHeader } from "@/components/articles/ArticleHeader";
import { Container } from "@/components/ui/Container";
import { ReviewBlockChrome } from "@/components/review/ReviewBlockChrome";
import { ReviewInteractive } from "@/components/review/ReviewInteractive";
import type { Article } from "@/data/types";
import { collectBlockIds } from "@/lib/articles/block-ids";
import {
  canCreateReviewComment,
  canManageReviewQueue,
  canSubmitReviewDecision,
  canViewReviewFeedback,
} from "@/lib/articles/review-access";
import {
  getActiveAssignment,
  getOpenRound,
  listCommentsForArticle,
} from "@/lib/articles/review-store";
import { getArticleById, getAuthorDisplays, toAccessRecord } from "@/lib/articles/store";
import { WORKFLOW_LABELS } from "@/lib/articles/workflow-labels";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import styles from "@/components/review/ReviewWorkspace.module.css";

export const metadata: Metadata = {
  title: "Review article",
  robots: { index: false },
};

type PageProps = {
  params: Promise<{ articleId: string }>;
};

export default async function ReviewArticlePage({ params }: PageProps) {
  const { articleId } = await params;
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/login?callbackUrl=/dashboard/review/${articleId}`);
  if (!user.handle) redirect(`/onboarding/handle?callbackUrl=/dashboard/review/${articleId}`);

  const article = await getArticleById(articleId);
  if (!article || !canViewReviewFeedback(user.roles, user.id, toAccessRecord(article))) {
    notFound();
  }

  const assignment = await getActiveAssignment(article.id, user.id);
  const openRound = assignment?.round ?? (await getOpenRound(article.id));
  const presentIds = collectBlockIds(article.body);
  const comments = await listCommentsForArticle(article.id, presentIds);
  const authorOverrides = await getAuthorDisplays(article.authorUserIds);

  const canComment = canCreateReviewComment(user.roles, user.id, toAccessRecord(article), {
    assignmentActive: Boolean(assignment),
    roundOpen: openRound?.status === "OPEN",
  });
  const canDecide = canSubmitReviewDecision(user.roles, user.id, toAccessRecord(article), {
    assignmentActive: Boolean(assignment),
    roundOpen: openRound?.status === "OPEN",
  });

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
    review: { status: "under-review" },
    featured: article.featured,
    body: article.body,
  };

  const serializableComments = comments.map((comment) => ({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    resolvedAt: comment.resolvedAt ? comment.resolvedAt.toISOString() : null,
  }));

  return (
    <Container className={styles.page}>
      <header className={styles.toolbar}>
        <div className={styles.links}>
          <Link href="/dashboard/review/assigned" className={styles.link}>
            ← Assigned
          </Link>
          {canManageReviewQueue(user.roles) && (
            <Link href="/dashboard/review" className={styles.link}>
              Queue
            </Link>
          )}
          <Link href={`/dashboard/drafts/${article.id}/preview`} className={styles.link}>
            Preview
          </Link>
        </div>
        <p className={styles.meta}>
          <span>{WORKFLOW_LABELS[article.workflowStatus]}</span>
          {assignment && (
            <>
              <span>·</span>
              <span>Round {assignment.round.roundNumber}</span>
              <span>·</span>
              <span>{assignment.status}</span>
            </>
          )}
        </p>
      </header>

      <article className={styles.article}>
        <ArticleHeader article={previewArticle} authorOverrides={authorOverrides} />
      </article>

      <ReviewInteractive
        articleId={article.id}
        comments={serializableComments}
        canComment={canComment}
        canDecide={canDecide}
        currentUserId={user.id}
        isEditor={canManageReviewQueue(user.roles)}
      >
        <ArticleBody
          blocks={article.body}
          wrapBlock={(block, content) => (
            <ReviewBlockChrome blockId={block.id} kind={block.kind}>
              {content}
            </ReviewBlockChrome>
          )}
        />
      </ReviewInteractive>
    </Container>
  );
}
