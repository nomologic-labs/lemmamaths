import "server-only";

import { and, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import type { ArticleBlock, ArticleFormat, PeerReviewStatus, TopicId } from "@/data/types";
import { db } from "@/lib/db/client";
import {
  articleAuthors,
  articleReviewers,
  articleRevisions,
  articles,
} from "@/lib/db/articles-schema";
import { users } from "@/lib/db/schema";
import type { ArticleWorkflowStatus } from "./workflow";
import { createBlockId, ensureBlockIds } from "./block-ids";
import { estimateReadingMinutes } from "./reading-time";
import { draftSlugForId, slugifyTitle } from "./slug";
import type { ArticleAccessInput } from "./access";

export type DraftArticle = {
  id: string;
  slug: string;
  title: string;
  standfirst: string | null;
  description: string;
  format: ArticleFormat;
  readingMinutes: number;
  topics: TopicId[];
  tags: string[];
  body: ArticleBlock[];
  workflowStatus: ArticleWorkflowStatus;
  featured: boolean;
  peerReviewStatus: PeerReviewStatus;
  createdById: string;
  publishedOn: string | null;
  createdAt: Date;
  updatedAt: Date;
  authorUserIds: string[];
  assignedReviewerIds: string[];
};

export type DraftSummary = Omit<DraftArticle, "body">;

export type EligibleAuthor = {
  id: string;
  handle: string;
  name: string | null;
};


function mapArticleRow(
  row: typeof articles.$inferSelect,
  authorUserIds: string[],
  assignedReviewerIds: string[] = [],
): DraftArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    standfirst: row.standfirst,
    description: row.description,
    format: row.format,
    readingMinutes: row.readingMinutes,
    topics: row.topics,
    tags: row.tags,
    body: ensureBlockIds(row.body ?? []),
    workflowStatus: row.workflowStatus,
    featured: row.featured,
    peerReviewStatus: row.peerReviewStatus,
    createdById: row.createdById,
    publishedOn: row.publishedOn,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    authorUserIds,
    assignedReviewerIds,
  };
}

export function toAccessRecord(article: ArticleAccessInput): ArticleAccessInput {
  return {
    id: article.id,
    createdById: article.createdById,
    workflowStatus: article.workflowStatus,
    authorUserIds: article.authorUserIds,
    assignedReviewerIds: article.assignedReviewerIds ?? [],
  };
}

async function loadAuthorIds(articleId: string): Promise<string[]> {
  const links = await db
    .select({ userId: articleAuthors.userId })
    .from(articleAuthors)
    .where(eq(articleAuthors.articleId, articleId))
    .orderBy(articleAuthors.sortOrder);
  return links.map((link) => link.userId);
}

async function loadAssignedReviewerIds(articleId: string): Promise<string[]> {
  const rows = await db
    .select({ reviewerUserId: articleReviewers.reviewerUserId })
    .from(articleReviewers)
    .where(
      and(eq(articleReviewers.articleId, articleId), ne(articleReviewers.status, "withdrawn")),
    );
  return [...new Set(rows.map((row) => row.reviewerUserId))];
}

export async function getArticleById(id: string): Promise<DraftArticle | null> {
  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  const row = rows[0];
  if (!row) return null;
  const [authorUserIds, assignedReviewerIds] = await Promise.all([
    loadAuthorIds(id),
    loadAssignedReviewerIds(id),
  ]);
  return mapArticleRow(row, authorUserIds, assignedReviewerIds);
}

export async function listDraftsForUser(userId: string): Promise<DraftSummary[]> {
  const authorLinks = await db
    .select({ articleId: articleAuthors.articleId })
    .from(articleAuthors)
    .where(eq(articleAuthors.userId, userId));

  const owned = await db
    .select()
    .from(articles)
    .where(eq(articles.createdById, userId))
    .orderBy(desc(articles.updatedAt));

  const linkedIds = authorLinks.map((link) => link.articleId);
  const linked =
    linkedIds.length > 0
      ? await db
          .select()
          .from(articles)
          .where(inArray(articles.id, linkedIds))
          .orderBy(desc(articles.updatedAt))
      : [];

  const byId = new Map<string, typeof articles.$inferSelect>();
  for (const row of [...owned, ...linked]) {
    byId.set(row.id, row);
  }

  const result: DraftSummary[] = [];
  for (const row of byId.values()) {
    const article = await getArticleById(row.id);
    if (!article) continue;
    const { body, ...summary } = article;
    void body;
    result.push(summary);
  }

  return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function listAllArticles(): Promise<DraftSummary[]> {
  const rows = await db.select().from(articles).orderBy(desc(articles.updatedAt));
  const result: DraftSummary[] = [];
  for (const row of rows) {
    const article = await getArticleById(row.id);
    if (!article) continue;
    const { body, ...summary } = article;
    void body;
    result.push(summary);
  }
  return result;
}

function defaultDraftBody(): ArticleBlock[] {
  return [
    {
      id: createBlockId(),
      kind: "paragraph",
      content: [""],
    },
  ];
}

export async function createDraft(createdById: string): Promise<DraftArticle> {
  const id = crypto.randomUUID();
  const slug = draftSlugForId(id);
  const now = new Date();

  await db.insert(articles).values({
    id,
    slug,
    title: "Untitled",
    description: "",
    body: defaultDraftBody(),
    createdById,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(articleAuthors).values({
    articleId: id,
    userId: createdById,
    sortOrder: 0,
  });

  const article = await getArticleById(id);
  if (!article) throw new Error("Failed to create draft.");
  return article;
}

export type SaveDraftInput = {
  title: string;
  standfirst?: string;
  description: string;
  format: ArticleFormat;
  topics: TopicId[];
  tags: string[];
  featured?: boolean;
  authorUserIds: string[];
  body: ArticleBlock[];
};

export async function saveDraft(
  articleId: string,
  input: SaveDraftInput,
): Promise<DraftArticle> {
  const body = ensureBlockIds(input.body);
  const readingMinutes = estimateReadingMinutes(body);
  const now = new Date();

  await db
    .update(articles)
    .set({
      title: input.title,
      standfirst: input.standfirst ?? null,
      description: input.description,
      format: input.format,
      topics: input.topics,
      tags: input.tags,
      body,
      readingMinutes,
      featured: input.featured ?? false,
      updatedAt: now,
    })
    .where(eq(articles.id, articleId));

  await db.delete(articleAuthors).where(eq(articleAuthors.articleId, articleId));
  await db.insert(articleAuthors).values(
    input.authorUserIds.map((userId, index) => ({
      articleId,
      userId,
      sortOrder: index,
    })),
  );

  const article = await getArticleById(articleId);
  if (!article) throw new Error("Article not found after save.");
  return article;
}

export async function updateWorkflowStatus(
  articleId: string,
  status: ArticleWorkflowStatus,
  publishedOn?: string,
): Promise<DraftArticle> {
  await db
    .update(articles)
    .set({
      workflowStatus: status,
      publishedOn: publishedOn ?? null,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, articleId));

  const article = await getArticleById(articleId);
  if (!article) throw new Error("Article not found after workflow update.");
  return article;
}

/**
 * State-checked workflow update. Returns null if the row was not in `expectedFrom`
 * (concurrent transition or stale client).
 */
export async function transitionWorkflowIfStatus(input: {
  articleId: string;
  expectedFrom: ArticleWorkflowStatus;
  to: ArticleWorkflowStatus;
  publishedOn?: string | null;
  slug?: string;
  peerReviewStatus?: PeerReviewStatus;
}): Promise<DraftArticle | null> {
  const patch: Partial<typeof articles.$inferInsert> = {
    workflowStatus: input.to,
    updatedAt: new Date(),
  };
  if (input.publishedOn !== undefined) {
    patch.publishedOn = input.publishedOn;
  }
  if (input.slug !== undefined) {
    patch.slug = input.slug;
  }
  if (input.peerReviewStatus !== undefined) {
    patch.peerReviewStatus = input.peerReviewStatus;
  }

  const rows = await db
    .update(articles)
    .set(patch)
    .where(
      and(eq(articles.id, input.articleId), eq(articles.workflowStatus, input.expectedFrom)),
    )
    .returning({ id: articles.id });

  if (rows.length === 0) return null;
  return getArticleById(input.articleId);
}

export async function allocatePublicSlug(title: string, articleId: string): Promise<string> {
  const base = slugifyTitle(title);
  const existing = await db
    .select({ id: articles.id, slug: articles.slug })
    .from(articles)
    .where(eq(articles.slug, base))
    .limit(1);

  if (!existing[0] || existing[0].id === articleId) {
    return base;
  }

  for (let attempt = 2; attempt < 50; attempt += 1) {
    const candidate = `${base}-${attempt}`;
    const clash = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, candidate))
      .limit(1);
    if (!clash[0] || clash[0].id === articleId) {
      return candidate;
    }
  }

  return `${base}-${articleId.slice(0, 8)}`;
}

export async function deleteDraft(articleId: string): Promise<void> {
  await db.delete(articles).where(eq(articles.id, articleId));
}

/**
 * Snapshot the current article into article_revisions.
 * Used at intentional workflow moments (submit/resubmit), not every autosave.
 */
export async function createRevisionSnapshot(
  article: DraftArticle,
  savedById: string,
  note?: string,
): Promise<void> {
  const maxRows = await db
    .select({
      value: sql<number>`coalesce(max(${articleRevisions.revisionNumber}), 0)`,
    })
    .from(articleRevisions)
    .where(eq(articleRevisions.articleId, article.id));

  const nextNumber = Number(maxRows[0]?.value ?? 0) + 1;

  await db.insert(articleRevisions).values({
    id: crypto.randomUUID(),
    articleId: article.id,
    revisionNumber: nextNumber,
    title: article.title,
    standfirst: article.standfirst,
    description: article.description,
    format: article.format,
    topics: article.topics,
    tags: article.tags,
    body: article.body,
    authorUserIds: article.authorUserIds,
    workflowStatus: article.workflowStatus,
    savedById,
    note: note ?? null,
  });
}

export async function listEligibleAuthors(): Promise<EligibleAuthor[]> {
  const rows = await db
    .select({
      id: users.id,
      handle: users.handle,
      name: users.name,
    })
    .from(users)
    .where(and(isNotNull(users.handle), eq(users.accountStatus, "active")));

  const byId = new Map<string, EligibleAuthor>();
  for (const row of rows) {
    if (!row.handle) continue;
    byId.set(row.id, {
      id: row.id,
      handle: row.handle,
      name: row.name,
    });
  }

  return [...byId.values()].sort((a, b) => a.handle.localeCompare(b.handle));
}

export async function getAuthorDisplays(
  authorUserIds: readonly string[],
): Promise<{ id: string; name: string }[]> {
  if (authorUserIds.length === 0) return [];
  const rows = await db
    .select({ id: users.id, handle: users.handle, name: users.name })
    .from(users)
    .where(inArray(users.id, authorUserIds));

  const byId = new Map(rows.map((row) => [row.id, row]));
  return authorUserIds.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    const handle = row.handle?.trim() || null;
    const name = row.name?.trim() || (handle ? `@${handle}` : null);
    if (!handle || !name) return [];
    return [{ id: handle, name }];
  });
}

export async function validateAuthorUserIds(authorUserIds: string[]): Promise<boolean> {
  if (authorUserIds.length === 0) return false;
  const eligible = await listEligibleAuthors();
  const allowed = new Set(eligible.map((author) => author.id));
  return authorUserIds.every((id) => allowed.has(id));
}
