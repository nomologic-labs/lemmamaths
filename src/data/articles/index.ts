import type { Article, ArticleSummary } from "../types";
import { materializeArticles } from "@/lib/articles/block-ids";
import { CATALOGUE } from "./catalogue";
import { centralLimitTheorem } from "./central-limit-theorem";
import { continuedFractions } from "./continued-fractions";
import { determinantVolume } from "./determinant-volume";
import { floatingPoint } from "./floating-point";
import { newtonsMethod } from "./newtons-method";

/**
 * Mock / seed article registry.
 *
 * After Phase 6, PostgreSQL is authoritative for the public site
 * (`src/lib/articles/public.ts`). This module remains as:
 * - seed source for `npm run db:seed`
 * - development fixtures
 * - unit-test content samples
 *
 * Mock source articles may omit block ids; materialization assigns deterministic
 * `blk_<slug>…` ids so seeded bodies keep stable identity.
 */
const ALL: readonly Article[] = materializeArticles([
  determinantVolume,
  newtonsMethod,
  centralLimitTheorem,
  continuedFractions,
  floatingPoint,
  ...CATALOGUE,
]);

function byNewestFirst(a: { publishedOn: string }, b: { publishedOn: string }): number {
  return b.publishedOn.localeCompare(a.publishedOn);
}

/** Every article, newest first. Includes bodies — server-side use only. */
export const ARTICLES: readonly Article[] = [...ALL].sort(byNewestFirst);

const BY_SLUG = new Map<string, Article>(ARTICLES.map((article) => [article.slug, article]));

export function toSummary(article: Article): ArticleSummary {
  const { body, ...summary } = article;
  void body;
  return summary;
}

/**
 * Every article without its body, newest first. This is the shape that may be handed
 * to client components; passing full `Article` values across that boundary would put
 * every proof, code sample and equation into the JavaScript bundle.
 */
export const ARTICLE_SUMMARIES: readonly ArticleSummary[] = ARTICLES.map(toSummary);

export function getArticle(slug: string): Article | undefined {
  return BY_SLUG.get(slug);
}

export function getArticlesByAuthor(authorId: string): ArticleSummary[] {
  return ARTICLE_SUMMARIES.filter((article) => article.authorIds.includes(authorId));
}

export function countArticlesByAuthor(authorId: string): number {
  return ARTICLE_SUMMARIES.reduce(
    (total, article) => total + (article.authorIds.includes(authorId) ? 1 : 0),
    0,
  );
}

export function countArticlesByTopic(topicId: string): number {
  return ARTICLE_SUMMARIES.reduce(
    (total, article) => total + (article.topics.includes(topicId as never) ? 1 : 0),
    0,
  );
}

/** The newest article flagged as featured, or the newest article if none is flagged. */
export function getFeaturedArticle(): ArticleSummary {
  const featured = ARTICLE_SUMMARIES.find((article) => article.featured);
  const fallback = ARTICLE_SUMMARIES[0];
  if (!featured && !fallback) throw new Error("The article registry is empty");
  return featured ?? fallback!;
}

export function getRecentArticles(count: number, excludeSlug?: string): ArticleSummary[] {
  return ARTICLE_SUMMARIES.filter((article) => article.slug !== excludeSlug).slice(0, count);
}

/** Every distinct tag in the archive, alphabetical. Used by the archive filter panel. */
export const ALL_TAGS: readonly string[] = [
  ...new Set(ARTICLE_SUMMARIES.flatMap((article) => article.tags)),
].sort((a, b) => a.localeCompare(b));
