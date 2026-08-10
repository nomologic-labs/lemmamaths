import "server-only";

import { and, eq } from "drizzle-orm";
import { ARTICLES } from "@/data/articles";
import { AUTHORS } from "@/data/authors";
import { ensureBlockIds } from "@/lib/articles/block-ids";
import { articleAuthors, articles } from "./articles-schema";
import { db } from "./client";
import { authorProfiles, users } from "./schema";

export interface SeedAuthorProfilesResult {
  /** Mock handles with no matching `users.handle` row yet. */
  unlinkedHandles: string[];
  /** Profiles created on this run. */
  created: string[];
  /** Profiles already present; left unchanged. */
  skipped: string[];
}

export interface SeedPublishedArticlesResult {
  /** Slugs imported on this run. */
  created: string[];
  /** Slugs already present; left unchanged. */
  skipped: string[];
  /** Slugs skipped because one or more author handles lack a matching user + public profile. */
  blocked: { slug: string; missingHandles: string[] }[];
}

/**
 * Returns mock author handles from `src/data/authors.ts` that can become Lemma profiles.
 * Does not touch the database.
 */
export function listMockAuthorHandles(): readonly string[] {
  return AUTHORS.map((author) => author.id);
}

/**
 * Upserts a public author profile for an existing user from mock data.
 * Safe to call when a user has claimed a handle that matches a mock author id.
 */
export async function applyAuthorProfileFromMock(userId: string, handle: string): Promise<boolean> {
  const mock = AUTHORS.find((author) => author.id === handle);
  if (!mock) return false;

  await db
    .insert(authorProfiles)
    .values({
      userId,
      bio: mock.bio,
      affiliation: mock.role,
      interests: [...mock.interests],
      joinedOn: mock.joinedOn,
      isPublic: true,
    })
    .onConflictDoUpdate({
      target: authorProfiles.userId,
      set: {
        bio: mock.bio,
        affiliation: mock.role,
        interests: [...mock.interests],
        joinedOn: mock.joinedOn,
        updatedAt: new Date(),
      },
    });

  return true;
}

/**
 * Links mock author profile data to users who already have a matching `handle`.
 *
 * Does NOT create user accounts or invent email addresses. Does NOT grant roles.
 * Idempotent: existing profiles are skipped unless mock data changed (then updated).
 */
export async function syncAuthorProfilesFromMock(): Promise<SeedAuthorProfilesResult> {
  const result: SeedAuthorProfilesResult = {
    unlinkedHandles: [],
    created: [],
    skipped: [],
  };

  for (const mock of AUTHORS) {
    const [user] = await db.select().from(users).where(eq(users.handle, mock.id)).limit(1);

    if (!user) {
      result.unlinkedHandles.push(mock.id);
      continue;
    }

    const [existing] = await db
      .select({ userId: authorProfiles.userId })
      .from(authorProfiles)
      .where(eq(authorProfiles.userId, user.id))
      .limit(1);

    await applyAuthorProfileFromMock(user.id, mock.id);

    if (existing) {
      result.skipped.push(mock.id);
    } else {
      result.created.push(mock.id);
    }
  }

  return result;
}

async function resolvePublicAuthorUserId(handle: string): Promise<string | null> {
  const rows = await db
    .select({ userId: users.id })
    .from(users)
    .innerJoin(authorProfiles, eq(authorProfiles.userId, users.id))
    .where(and(eq(users.handle, handle), eq(authorProfiles.isPublic, true)))
    .limit(1);
  return rows[0]?.userId ?? null;
}

/**
 * Imports mock published articles from `src/data/articles/` as `PUBLISHED` rows.
 *
 * Idempotent by slug. Does NOT create users. Articles whose author handles are missing
 * (no matching user with a public author profile) are skipped and reported.
 */
export async function seedPublishedArticlesFromMock(): Promise<SeedPublishedArticlesResult> {
  const result: SeedPublishedArticlesResult = {
    created: [],
    skipped: [],
    blocked: [],
  };

  for (const article of ARTICLES) {
    const [existing] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, article.slug))
      .limit(1);

    if (existing) {
      result.skipped.push(article.slug);
      continue;
    }

    const authorUserIds: string[] = [];
    const missingHandles: string[] = [];
    for (const handle of article.authorIds) {
      const userId = await resolvePublicAuthorUserId(handle);
      if (!userId) missingHandles.push(handle);
      else authorUserIds.push(userId);
    }

    if (missingHandles.length > 0 || authorUserIds.length === 0) {
      result.blocked.push({ slug: article.slug, missingHandles });
      continue;
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const body = ensureBlockIds(article.body);

    await db.insert(articles).values({
      id,
      slug: article.slug,
      title: article.title,
      standfirst: article.standfirst ?? null,
      description: article.description,
      format: article.format,
      readingMinutes: article.readingMinutes,
      topics: [...article.topics],
      tags: [...article.tags],
      body,
      workflowStatus: "PUBLISHED",
      featured: Boolean(article.featured),
      peerReviewStatus: article.review.status,
      createdById: authorUserIds[0]!,
      publishedOn: article.publishedOn,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(articleAuthors).values(
      authorUserIds.map((userId, sortOrder) => ({
        articleId: id,
        userId,
        sortOrder,
      })),
    );

    result.created.push(article.slug);
  }

  return result;
}
