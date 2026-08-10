import "server-only";

import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import type { Article, ArticleSummary, Author, PeerReviewStatus } from "@/data/types";
import { hasDatabaseUrl, db } from "@/lib/db/client";
import { articleAuthors, articles } from "@/lib/db/articles-schema";
import { authorProfiles, users } from "@/lib/db/schema";
import { ensureBlockIds } from "./block-ids";

/**
 * Public article/author reads. Always filters to PUBLISHED articles.
 * Pages must use this layer — never query Drizzle for public content directly.
 */

export type PublicAuthor = Author;

function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

async function loadHandleMap(
  userIds: readonly string[],
): Promise<Map<string, { handle: string; name: string | null }>> {
  if (userIds.length === 0) return new Map();
  const rows = await db
    .select({ id: users.id, handle: users.handle, name: users.name })
    .from(users)
    .where(inArray(users.id, [...userIds]));
  const map = new Map<string, { handle: string; name: string | null }>();
  for (const row of rows) {
    if (!row.handle) continue;
    map.set(row.id, { handle: row.handle, name: row.name });
  }
  return map;
}

async function authorHandlesForArticle(articleId: string): Promise<string[]> {
  const links = await db
    .select({ userId: articleAuthors.userId })
    .from(articleAuthors)
    .where(eq(articleAuthors.articleId, articleId))
    .orderBy(articleAuthors.sortOrder);
  const handleMap = await loadHandleMap(links.map((link) => link.userId));
  return links
    .map((link) => handleMap.get(link.userId)?.handle)
    .filter((handle): handle is string => Boolean(handle));
}

function mapSummary(
  row: typeof articles.$inferSelect,
  authorIds: string[],
): ArticleSummary {
  return {
    slug: row.slug,
    title: row.title,
    standfirst: row.standfirst ?? undefined,
    authorIds,
    publishedOn: row.publishedOn ?? toDateString(row.createdAt),
    updatedOn: toDateString(row.updatedAt),
    description: row.description,
    topics: row.topics,
    tags: row.tags,
    format: row.format,
    readingMinutes: row.readingMinutes,
    review: { status: row.peerReviewStatus },
    featured: row.featured || undefined,
  };
}

function mapArticle(
  row: typeof articles.$inferSelect,
  authorIds: string[],
): Article {
  return {
    ...mapSummary(row, authorIds),
    body: ensureBlockIds(row.body ?? []),
  };
}

/** Published article by public slug, or undefined (never leaks unpublished rows). */
export async function getPublishedArticle(slug: string): Promise<Article | undefined> {
  if (!hasDatabaseUrl()) return undefined;
  const rows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.workflowStatus, "PUBLISHED")))
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;
  const authorIds = await authorHandlesForArticle(row.id);
  return mapArticle(row, authorIds);
}

/** Alias matching the historical registry API. */
export async function getArticle(slug: string): Promise<Article | undefined> {
  return getPublishedArticle(slug);
}

export async function listPublishedSummaries(): Promise<ArticleSummary[]> {
  if (!hasDatabaseUrl()) return [];
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.workflowStatus, "PUBLISHED"))
    .orderBy(desc(articles.publishedOn), desc(articles.updatedAt));

  const summaries: ArticleSummary[] = [];
  for (const row of rows) {
    const authorIds = await authorHandlesForArticle(row.id);
    summaries.push(mapSummary(row, authorIds));
  }
  return summaries;
}

export async function getPublicSummaries(): Promise<ArticleSummary[]> {
  return listPublishedSummaries();
}

export async function listPublishedSlugs(): Promise<string[]> {
  if (!hasDatabaseUrl()) return [];
  const rows = await db
    .select({ slug: articles.slug })
    .from(articles)
    .where(eq(articles.workflowStatus, "PUBLISHED"));
  return rows.map((row) => row.slug);
}

export async function getFeaturedArticle(): Promise<ArticleSummary | undefined> {
  const summaries = await listPublishedSummaries();
  return summaries.find((article) => article.featured) ?? summaries[0];
}

export async function getRecentArticles(
  count: number,
  excludeSlug?: string,
): Promise<ArticleSummary[]> {
  const summaries = await listPublishedSummaries();
  return summaries.filter((article) => article.slug !== excludeSlug).slice(0, count);
}

export async function getArticlesByAuthorHandle(handle: string): Promise<ArticleSummary[]> {
  const summaries = await listPublishedSummaries();
  return summaries.filter((article) => article.authorIds.includes(handle));
}

export async function countArticlesByAuthorHandle(handle: string): Promise<number> {
  return (await getArticlesByAuthorHandle(handle)).length;
}

export async function countArticlesByTopic(topicId: string): Promise<number> {
  const summaries = await listPublishedSummaries();
  return summaries.reduce(
    (total, article) => total + (article.topics.includes(topicId as never) ? 1 : 0),
    0,
  );
}

export async function listPublicAuthors(): Promise<PublicAuthor[]> {
  if (!hasDatabaseUrl()) return [];
  const rows = await db
    .select({
      handle: users.handle,
      name: users.name,
      bio: authorProfiles.bio,
      affiliation: authorProfiles.affiliation,
      interests: authorProfiles.interests,
      joinedOn: authorProfiles.joinedOn,
    })
    .from(authorProfiles)
    .innerJoin(users, eq(users.id, authorProfiles.userId))
    .where(and(eq(authorProfiles.isPublic, true), isNotNull(users.handle)));

  return rows
    .filter((row): row is typeof row & { handle: string } => Boolean(row.handle))
    .map((row) => ({
      id: row.handle,
      name: row.name ?? `@${row.handle}`,
      role: row.affiliation,
      bio: row.bio,
      interests: row.interests,
      joinedOn: row.joinedOn,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPublicAuthor(handle: string): Promise<PublicAuthor | undefined> {
  if (!hasDatabaseUrl()) return undefined;
  const rows = await db
    .select({
      handle: users.handle,
      name: users.name,
      bio: authorProfiles.bio,
      affiliation: authorProfiles.affiliation,
      interests: authorProfiles.interests,
      joinedOn: authorProfiles.joinedOn,
    })
    .from(authorProfiles)
    .innerJoin(users, eq(users.id, authorProfiles.userId))
    .where(
      and(
        eq(users.handle, handle),
        eq(authorProfiles.isPublic, true),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row?.handle) return undefined;
  return {
    id: row.handle,
    name: row.name ?? `@${row.handle}`,
    role: row.affiliation,
    bio: row.bio,
    interests: row.interests,
    joinedOn: row.joinedOn,
  };
}

export async function getPublicAuthorNameMap(): Promise<Map<string, string>> {
  const authors = await listPublicAuthors();
  return new Map(authors.map((author) => [author.id, author.name]));
}

export async function allPublishedTags(): Promise<string[]> {
  const summaries = await listPublishedSummaries();
  return [...new Set(summaries.flatMap((article) => article.tags))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export type { PeerReviewStatus };
