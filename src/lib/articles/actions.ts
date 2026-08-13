"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { writeAuditEntry } from "@/lib/auth/audit";
import { requirePermission, requireSession } from "@/lib/auth/guards";
import {
  canDeleteDraft,
  canEditArticleRecord,
  canPerformTransition,
  canPublishArticle,
  canReadArticle,
  canSetFeatured,
  canSubmitArticle,
  isPublishedImmutable,
  submitTargetStatus,
} from "@/lib/articles/access";
import {
  allocatePublicSlug,
  createDraft,
  createRevisionSnapshot,
  deleteDraft,
  getArticleById,
  saveDraft,
  toAccessRecord,
  transitionWorkflowIfStatus,
  validateAuthorUserIds,
} from "@/lib/articles/store";
import { parseSaveDraftInput } from "@/lib/articles/validation";
import type { ArticleWorkflowStatus } from "@/lib/articles/workflow";
import { draftSlugForId } from "@/lib/articles/slug";

export type ActionResult<T = void> =
  | { ok: true; data?: T; savedAt?: string }
  | { ok: false; error: string };

function formatZodError(error: ZodError): string {
  const first = error.issues[0];
  return first?.message ?? "Invalid input.";
}

function revalidateArticlePaths(articleId: string, publicSlug?: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/drafts");
  revalidatePath("/dashboard/published");
  revalidatePath(`/dashboard/drafts/${articleId}`);
  revalidatePath(`/dashboard/drafts/${articleId}/preview`);
  revalidatePath("/dashboard/review");
  revalidatePath("/dashboard/review/assigned");
  revalidatePath(`/dashboard/review/${articleId}`);
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/authors");
  revalidatePath("/topics");
  revalidatePath("/about");
  if (publicSlug) {
    revalidatePath(`/articles/${publicSlug}`);
  }
}

export async function createDraftAction(): Promise<void> {
  const user = await requirePermission("article:create");
  const draft = await createDraft(user.id);
  redirect(`/dashboard/drafts/${draft.id}`);
}

export async function saveDraftAction(input: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    const user = await requireSession();
    const parsed = parseSaveDraftInput(input);

    const article = await getArticleById(parsed.articleId);
    if (!article) {
      return { ok: false, error: "Article not found." };
    }

    if (isPublishedImmutable(article.workflowStatus)) {
      return { ok: false, error: "Published articles cannot be edited in place." };
    }

    if (!canEditArticleRecord(user.permissions, user.id, toAccessRecord(article))) {
      return { ok: false, error: "You cannot edit this article." };
    }

    const authorsValid = await validateAuthorUserIds(parsed.metadata.authorUserIds);
    if (!authorsValid) {
      return { ok: false, error: "One or more authors are not eligible." };
    }

    if (!parsed.metadata.authorUserIds.includes(user.id) && !user.permissions.has("article:edit:any")) {
      return { ok: false, error: "You must be listed as an author." };
    }

    const featured =
      parsed.metadata.featured && canSetFeatured(user.permissions)
        ? true
        : article.featured;

    const saved = await saveDraft(parsed.articleId, {
      title: parsed.metadata.title,
      standfirst: parsed.metadata.standfirst,
      description: parsed.metadata.description,
      format: parsed.metadata.format,
      topics: parsed.metadata.topics,
      tags: parsed.metadata.tags,
      featured,
      authorUserIds: parsed.metadata.authorUserIds,
      body: parsed.body,
    });

    revalidateArticlePaths(saved.id);

    return { ok: true, data: { updatedAt: saved.updatedAt.toISOString() }, savedAt: saved.updatedAt.toISOString() };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: formatZodError(error) };
    }
    return { ok: false, error: "Could not save draft." };
  }
}

/**
 * Permission-checked, state-checked workflow transition.
 * Snapshot/audit run only after the DB update succeeds so concurrent retries
 * do not leave duplicate history for a failed race loser.
 */
async function applyWorkflowTransition(
  articleId: string,
  targetStatus: ArticleWorkflowStatus,
  options?: { snapshotNote?: string },
): Promise<ActionResult> {
  try {
    const user = await requireSession();
    const article = await getArticleById(articleId);
    if (!article) {
      return { ok: false, error: "Article not found." };
    }

    const expectedFrom = article.workflowStatus;
    const transition = canPerformTransition(
      user.permissions,
      user.id,
      toAccessRecord(article),
      targetStatus,
    );
    if (!transition) {
      return { ok: false, error: "Invalid workflow transition." };
    }

    const updated = await transitionWorkflowIfStatus({
      articleId,
      expectedFrom,
      to: targetStatus,
    });
    if (!updated) {
      return {
        ok: false,
        error: "Article workflow state changed. Refresh and try again.",
      };
    }

    if (options?.snapshotNote) {
      // Snapshot the pre-transition body/metadata already loaded above.
      await createRevisionSnapshot(article, user.id, options.snapshotNote);
    }

    await writeAuditEntry({
      actorUserId: user.id,
      action: transition.auditAction,
      targetType: "article",
      targetId: articleId,
      metadata: {
        from: expectedFrom,
        to: targetStatus,
      },
    });

    revalidateArticlePaths(updated.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update article workflow." };
  }
}

/** Author: DRAFT → SUBMITTED or REVISION_REQUESTED → RESUBMITTED. */
export async function submitDraftAction(articleId: string): Promise<ActionResult> {
  try {
    const user = await requireSession();
    const article = await getArticleById(articleId);
    if (!article) {
      return { ok: false, error: "Article not found." };
    }

    if (!canSubmitArticle(user.permissions, user.id, toAccessRecord(article))) {
      return { ok: false, error: "This article cannot be submitted." };
    }

    const target = submitTargetStatus(article.workflowStatus);
    if (!target) {
      return { ok: false, error: "Invalid workflow transition." };
    }

    return applyWorkflowTransition(articleId, target, {
      snapshotNote: target === "SUBMITTED" ? "Submitted for review" : "Resubmitted after revision",
    });
  } catch {
    return { ok: false, error: "Could not submit article." };
  }
}

/** Editor/admin: SUBMITTED|RESUBMITTED → UNDER_REVIEW. */
export async function startReviewAction(articleId: string): Promise<ActionResult> {
  const user = await requireSession();
  const article = await getArticleById(articleId);
  if (!article) return { ok: false, error: "Article not found." };

  const target: ArticleWorkflowStatus = "UNDER_REVIEW";
  if (!canPerformTransition(user.permissions, user.id, toAccessRecord(article), target)) {
    return { ok: false, error: "Cannot move this article into review." };
  }
  return applyWorkflowTransition(articleId, target);
}

/** Editor/admin: UNDER_REVIEW → REVISION_REQUESTED. */
export async function requestRevisionAction(articleId: string): Promise<ActionResult> {
  return applyWorkflowTransition(articleId, "REVISION_REQUESTED");
}

/** Editor/admin: UNDER_REVIEW → APPROVED (state-checked). */
export async function approveArticleAction(articleId: string): Promise<ActionResult> {
  try {
    const user = await requireSession();
    const article = await getArticleById(articleId);
    if (!article) return { ok: false, error: "Article not found." };

    const transition = canPerformTransition(
      user.permissions,
      user.id,
      toAccessRecord(article),
      "APPROVED",
    );
    if (!transition) {
      return { ok: false, error: "This article cannot be approved." };
    }

    const updated = await transitionWorkflowIfStatus({
      articleId,
      expectedFrom: "UNDER_REVIEW",
      to: "APPROVED",
    });
    if (!updated) {
      return { ok: false, error: "Article is no longer under review." };
    }

    await writeAuditEntry({
      actorUserId: user.id,
      action: "article.approved",
      targetType: "article",
      targetId: articleId,
      metadata: { from: "UNDER_REVIEW", to: "APPROVED" },
    });

    revalidateArticlePaths(articleId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not approve article." };
  }
}

/** Editor/admin: APPROVED → PUBLISHED (state-checked; assigns public slug if needed). */
export async function publishArticleAction(articleId: string): Promise<ActionResult<{ slug: string }>> {
  try {
    const user = await requireSession();
    const article = await getArticleById(articleId);
    if (!article) return { ok: false, error: "Article not found." };

    if (!canPublishArticle(user.permissions, toAccessRecord(article))) {
      return { ok: false, error: "This article cannot be published." };
    }

    const transition = canPerformTransition(
      user.permissions,
      user.id,
      toAccessRecord(article),
      "PUBLISHED",
    );
    if (!transition) {
      return { ok: false, error: "Invalid publish transition." };
    }

    const needsPublicSlug =
      article.slug.startsWith("draft-") || article.slug === draftSlugForId(article.id);
    const publicSlug = needsPublicSlug
      ? await allocatePublicSlug(article.title, article.id)
      : article.slug;
    const publishedOn = new Date().toISOString().slice(0, 10);

    const updated = await transitionWorkflowIfStatus({
      articleId,
      expectedFrom: "APPROVED",
      to: "PUBLISHED",
      publishedOn,
      slug: publicSlug,
      peerReviewStatus:
        (article.assignedReviewerIds?.length ?? 0) > 0
          ? "peer-reviewed"
          : article.peerReviewStatus === "under-review"
            ? "editorial-review"
            : article.peerReviewStatus,
    });

    if (!updated) {
      return { ok: false, error: "Article is no longer approved for publication." };
    }

    await createRevisionSnapshot(article, user.id, "Published");

    await writeAuditEntry({
      actorUserId: user.id,
      action: "article.published",
      targetType: "article",
      targetId: articleId,
      metadata: {
        from: "APPROVED",
        to: "PUBLISHED",
        slug: publicSlug,
        publishedOn,
      },
    });

    revalidateArticlePaths(articleId, publicSlug);
    return { ok: true, data: { slug: publicSlug } };
  } catch {
    return { ok: false, error: "Could not publish article." };
  }
}

/**
 * Generic transition entry point for authorized callers.
 * Rejects illegal edges and unauthorized actors.
 */
export async function transitionArticleWorkflowAction(
  articleId: string,
  targetStatus: ArticleWorkflowStatus,
): Promise<ActionResult> {
  if (targetStatus === "PUBLISHED") {
    const result = await publishArticleAction(articleId);
    if (!result.ok) return result;
    return { ok: true };
  }
  if (targetStatus === "APPROVED") {
    return approveArticleAction(articleId);
  }
  return applyWorkflowTransition(articleId, targetStatus);
}

export async function deleteDraftAction(articleId: string): Promise<ActionResult> {
  try {
    const user = await requireSession();
    const article = await getArticleById(articleId);
    if (!article) {
      return { ok: false, error: "Article not found." };
    }

    if (!canDeleteDraft(user.permissions, user.id, toAccessRecord(article))) {
      return { ok: false, error: "You cannot delete this draft." };
    }

    await deleteDraft(articleId);
    revalidatePath("/dashboard/drafts");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete draft." };
  }
}

export async function assertArticleReadable(articleId: string) {
  const user = await requireSession();
  const article = await getArticleById(articleId);
  if (!article) return null;
  if (!canReadArticle(user.permissions, user.id, toAccessRecord(article))) {
    return null;
  }
  return { user, article };
}
