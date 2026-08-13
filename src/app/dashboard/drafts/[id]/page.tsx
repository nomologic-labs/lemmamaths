import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { metadataFromArticle, toEditorBlocks } from "@/lib/articles/editor-types";
import { AuthorFeedbackPanel } from "@/components/review/AuthorFeedbackPanel";
import {
  canEditArticleRecord,
  canReadArticle,
  canSetFeatured,
  canSubmitArticle,
  isArticleAuthor,
} from "@/lib/articles/access";
import { collectBlockIds } from "@/lib/articles/block-ids";
import { buildBlockLabels } from "@/lib/articles/block-labels";
import { canResolveReviewComment, canViewReviewFeedback } from "@/lib/articles/review-access";
import { listCommentsForArticle } from "@/lib/articles/review-store";
import { areLocalUploadsEnabled } from "@/lib/articles/local-uploads";
import {
  getArticleById,
  listEligibleAuthors,
  toAccessRecord,
} from "@/lib/articles/store";
import { getAuthenticatedUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Edit draft",
  robots: { index: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DraftEditorPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/login?callbackUrl=/dashboard/drafts/${id}`);
  if (!user.handle) redirect(`/onboarding/handle?callbackUrl=/dashboard/drafts/${id}`);

  const article = await getArticleById(id);
  if (!article || !canReadArticle(user.permissions, user.id, toAccessRecord(article))) {
    notFound();
  }

  if (!canEditArticleRecord(user.permissions, user.id, toAccessRecord(article))) {
    redirect(`/dashboard/drafts/${id}/preview`);
  }

  const eligibleAuthors = await listEligibleAuthors();
  const access = toAccessRecord(article);
  const comments =
    canViewReviewFeedback(user.permissions, user.id, access) &&
    (article.workflowStatus === "REVISION_REQUESTED" ||
      article.workflowStatus === "UNDER_REVIEW" ||
      article.workflowStatus === "RESUBMITTED" ||
      article.workflowStatus === "APPROVED")
      ? await listCommentsForArticle(article.id, collectBlockIds(article.body))
      : [];

  return (
    <Container>
      {comments.length > 0 && (
        <AuthorFeedbackPanel
          comments={comments}
          blockLabels={buildBlockLabels(article.body)}
          canResolve={
            isArticleAuthor(user.id, access) ||
            comments.some((comment) =>
              canResolveReviewComment({
                permissions: user.permissions,
                userId: user.id,
                commentAuthorId: comment.authorUserId,
                article: access,
              }),
            )
          }
        />
      )}
      <ArticleEditor
        articleId={article.id}
        initialMetadata={metadataFromArticle(article)}
        initialBlocks={toEditorBlocks(article.body)}
        workflowStatus={article.workflowStatus}
        eligibleAuthors={eligibleAuthors}
        canEditFeatured={canSetFeatured(user.permissions)}
        canSubmit={canSubmitArticle(user.permissions, user.id, toAccessRecord(article))}
        lastSavedAt={article.updatedAt.toISOString()}
        uploadsEnabled={areLocalUploadsEnabled()}
      />
    </Container>
  );
}
