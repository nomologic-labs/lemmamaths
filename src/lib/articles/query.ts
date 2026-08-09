import { AUTHORS, getAuthor } from "@/data/authors";
import { isTopicId, topicName } from "@/data/topics";
import type { ArticleFormat, ArticleSummary, PeerReviewStatus, TopicId } from "@/data/types";
import { FORMAT_ORDER, REVIEW_ORDER } from "./labels";

/*
 * Archive search and filtering.
 *
 * The query lives in the URL and the filtering runs on the server. That is a deliberate
 * choice rather than the easiest one: with twenty mock articles, filtering in the
 * browser would be simpler, but the archive is specified to grow past a hundred, and at
 * that point shipping the whole index to every visitor stops being reasonable. Keeping
 * `filterArticles` a pure function over ArticleSummary[] means the day the articles move
 * into a database, this file is where the change happens — the components above it take
 * a list and do not care where it came from.
 *
 * Putting the query in the URL also makes filtered views linkable, which is what makes
 * /topics work without a second implementation of the archive.
 */

export type SortKey = "newest" | "oldest" | "title" | "shortest";

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  title: "Title A–Z",
  shortest: "Shortest read",
};

export const SORT_KEYS: readonly SortKey[] = ["newest", "oldest", "title", "shortest"];

export interface ArchiveQuery {
  search: string;
  topics: TopicId[];
  authors: string[];
  formats: ArticleFormat[];
  review: PeerReviewStatus[];
  sort: SortKey;
}

export const EMPTY_QUERY: ArchiveQuery = {
  search: "",
  topics: [],
  authors: [],
  formats: [],
  review: [],
  sort: "newest",
};

/** Anything the reader has to actively clear. Sort order is not a filter. */
export function countActiveFilters(query: ArchiveQuery): number {
  return (
    (query.search.trim() ? 1 : 0) +
    query.topics.length +
    query.authors.length +
    query.formats.length +
    query.review.length
  );
}

export function hasActiveFilters(query: ArchiveQuery): boolean {
  return countActiveFilters(query) > 0;
}

// ---------------------------------------------------------------- URL <-> query

/** Accepts Next's `searchParams`, where a repeated key arrives as an array. */
type RawParams = Record<string, string | string[] | undefined>;

function readList(params: RawParams, key: string): string[] {
  const raw = params[key];
  if (raw === undefined) return [];
  const values = Array.isArray(raw) ? raw : [raw];
  return values.flatMap((value) => value.split(",")).map((v) => v.trim()).filter(Boolean);
}

function readOne(params: RawParams, key: string): string {
  const raw = params[key];
  if (raw === undefined) return "";
  return (Array.isArray(raw) ? raw[0] : raw) ?? "";
}

const AUTHOR_IDS = new Set(AUTHORS.map((a) => a.id));
const FORMATS = new Set<string>(FORMAT_ORDER);
const REVIEWS = new Set<string>(REVIEW_ORDER);

/** Unknown values are dropped rather than rejected, so a stale link still works. */
export function parseArchiveQuery(params: RawParams): ArchiveQuery {
  const sort = readOne(params, "sort");
  return {
    search: readOne(params, "q").slice(0, 120),
    topics: readList(params, "topic").filter(isTopicId),
    authors: readList(params, "author").filter((id) => AUTHOR_IDS.has(id)),
    formats: readList(params, "format").filter((f): f is ArticleFormat => FORMATS.has(f)),
    review: readList(params, "review").filter((r): r is PeerReviewStatus => REVIEWS.has(r)),
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : "newest",
  };
}

/** Produces "?topic=algebra&sort=title", omitting defaults to keep links tidy. */
export function serialiseArchiveQuery(query: ArchiveQuery): string {
  const params = new URLSearchParams();
  if (query.search.trim()) params.set("q", query.search.trim());
  for (const topic of query.topics) params.append("topic", topic);
  for (const author of query.authors) params.append("author", author);
  for (const format of query.formats) params.append("format", format);
  for (const review of query.review) params.append("review", review);
  if (query.sort !== "newest") params.set("sort", query.sort);
  const search = params.toString();
  return search ? `?${search}` : "";
}

export function archiveHref(query: Partial<ArchiveQuery>): string {
  return `/articles${serialiseArchiveQuery({ ...EMPTY_QUERY, ...query })}`;
}

// ---------------------------------------------------------------- Matching

/**
 * The text an article can be found by. Author and topic names are folded in so that
 * typing "Okonkwo" or "topology" into the search box does the obvious thing without the
 * reader having to discover the corresponding filter first.
 */
function haystack(article: ArticleSummary): string {
  const authors = article.authorIds.map((id) => getAuthor(id)?.name ?? "").join(" ");
  const topics = article.topics.map(topicName).join(" ");
  return [
    article.title,
    article.standfirst ?? "",
    article.description,
    authors,
    topics,
    article.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

/** Every term must appear somewhere, so extra words narrow rather than widen. */
function matchesSearch(article: ArticleSummary, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const text = haystack(article);
  return terms.every((term) => text.includes(term));
}

function matchesFilters(article: ArticleSummary, query: ArchiveQuery): boolean {
  if (query.topics.length && !query.topics.some((t) => article.topics.includes(t))) return false;
  if (query.authors.length && !query.authors.some((a) => article.authorIds.includes(a))) return false;
  if (query.formats.length && !query.formats.includes(article.format)) return false;
  if (query.review.length && !query.review.includes(article.review.status)) return false;
  return true;
}

/**
 * Ranks a title hit above a description hit so that searching an exact title puts it
 * first. Only consulted when there is a search term; otherwise `sort` decides.
 */
function relevance(article: ArticleSummary, terms: string[]): number {
  const title = article.title.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (title.startsWith(term)) score += 6;
    else if (title.includes(term)) score += 4;
    if (article.tags.some((tag) => tag.toLowerCase().includes(term))) score += 2;
    if (article.description.toLowerCase().includes(term)) score += 1;
  }
  return score;
}

const COMPARATORS: Record<SortKey, (a: ArticleSummary, b: ArticleSummary) => number> = {
  newest: (a, b) => b.publishedOn.localeCompare(a.publishedOn),
  oldest: (a, b) => a.publishedOn.localeCompare(b.publishedOn),
  title: (a, b) => a.title.localeCompare(b.title),
  shortest: (a, b) => a.readingMinutes - b.readingMinutes || b.publishedOn.localeCompare(a.publishedOn),
};

export function filterArticles(
  articles: readonly ArticleSummary[],
  query: ArchiveQuery,
): ArticleSummary[] {
  const terms = query.search.toLowerCase().split(/\s+/).filter(Boolean);
  const matched = articles.filter(
    (article) => matchesFilters(article, query) && matchesSearch(article, terms),
  );

  if (terms.length > 0) {
    return matched.sort(
      (a, b) => relevance(b, terms) - relevance(a, terms) || COMPARATORS[query.sort](a, b),
    );
  }
  return matched.sort(COMPARATORS[query.sort]);
}

/**
 * How many articles each filter value would match, given everything *else* the reader
 * has already chosen. Showing these counts is what stops a filter panel from offering
 * combinations that lead to an empty page.
 */
export interface FacetCounts {
  topics: Record<string, number>;
  authors: Record<string, number>;
  formats: Record<string, number>;
  review: Record<string, number>;
}

export function computeFacets(
  articles: readonly ArticleSummary[],
  query: ArchiveQuery,
): FacetCounts {
  const terms = query.search.toLowerCase().split(/\s+/).filter(Boolean);
  const counts: FacetCounts = { topics: {}, authors: {}, formats: {}, review: {} };

  const tally = (record: Record<string, number>, key: string) => {
    record[key] = (record[key] ?? 0) + 1;
  };

  for (const article of articles) {
    if (!matchesSearch(article, terms)) continue;

    // Each facet is counted against the query with that facet's own selection removed,
    // so a selected value still shows how many results it contributes rather than
    // collapsing to the current total.
    if (matchesFilters(article, { ...query, topics: [] })) {
      for (const topic of article.topics) tally(counts.topics, topic);
    }
    if (matchesFilters(article, { ...query, authors: [] })) {
      for (const author of article.authorIds) tally(counts.authors, author);
    }
    if (matchesFilters(article, { ...query, formats: [] })) tally(counts.formats, article.format);
    if (matchesFilters(article, { ...query, review: [] })) tally(counts.review, article.review.status);
  }

  return counts;
}

/**
 * Related articles, scored by shared topics then shared tags. Deterministic, so the
 * same article always shows the same suggestions.
 */
export function findRelated(
  articles: readonly ArticleSummary[],
  article: { slug: string; topics: readonly TopicId[]; tags: readonly string[] },
  limit = 3,
): ArticleSummary[] {
  const tags = new Set(article.tags);
  return articles
    .filter((candidate) => candidate.slug !== article.slug)
    .map((candidate) => {
      const sharedTopics = candidate.topics.filter((t) => article.topics.includes(t)).length;
      const sharedTags = candidate.tags.filter((t) => tags.has(t)).length;
      return { candidate, score: sharedTopics * 3 + sharedTags };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.candidate.publishedOn.localeCompare(a.candidate.publishedOn),
    )
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
