import Link from "next/link";
import { topicName } from "@/data/topics";
import type { ArticleSummary } from "@/data/types";
import { resolveAuthorName } from "@/lib/articles/author-display";
import { FORMAT_LABELS, REVIEW_LABELS } from "@/lib/articles/labels";
import {
  archiveHref,
  countActiveFilters,
  type ArchiveQuery,
} from "@/lib/articles/query";
import { ArrowRightIcon, CloseIcon } from "@/components/ui/icons";
import { ArticleCard } from "./ArticleCard";
import styles from "./ArchiveResults.module.css";

export type ArchiveResultsProps = {
  query: ArchiveQuery;
  results: ArticleSummary[];
  /** Size of the unfiltered archive, for the "n of m" line. */
  total: number;
  authorNames?: Record<string, string>;
};

type Chip = { key: string; kind: string; label: string; href: string };

/**
 * Every chip is a link to the query with one value removed. Building them on the server
 * means active filters can be undone without JavaScript, and it keeps this component
 * free of any duplicate of the filter state that lives in `ArchiveFilters`.
 */
function buildChips(query: ArchiveQuery, authorNames?: Record<string, string>): Chip[] {
  const chips: Chip[] = [];
  const without = <K extends keyof ArchiveQuery>(key: K, value: string) => ({
    ...query,
    [key]: (query[key] as string[]).filter((entry) => entry !== value),
  });

  if (query.search.trim()) {
    chips.push({
      key: "q",
      kind: "Search",
      label: query.search.trim(),
      href: archiveHref({ ...query, search: "" }),
    });
  }
  for (const topic of query.topics) {
    chips.push({
      key: `topic-${topic}`,
      kind: "Topic",
      label: topicName(topic),
      href: archiveHref(without("topics", topic)),
    });
  }
  for (const author of query.authors) {
    chips.push({
      key: `author-${author}`,
      kind: "Author",
      label: resolveAuthorName(author, authorNames),
      href: archiveHref(without("authors", author)),
    });
  }
  for (const format of query.formats) {
    chips.push({
      key: `format-${format}`,
      kind: "Format",
      label: FORMAT_LABELS[format],
      href: archiveHref(without("formats", format)),
    });
  }
  for (const status of query.review) {
    chips.push({
      key: `review-${status}`,
      kind: "Review",
      label: REVIEW_LABELS[status],
      href: archiveHref(without("review", status)),
    });
  }
  return chips;
}

/**
 * Nearby queries worth offering when nothing matched. Dropping the search term is tried
 * first because a typo is the most likely cause of an empty archive; after that each
 * filter group is dropped in turn.
 */
function buildEscapeRoutes(query: ArchiveQuery): { label: string; href: string }[] {
  const routes: { label: string; href: string }[] = [];
  if (query.search.trim()) {
    routes.push({
      label: countActiveFilters(query) > 1 ? "Keep the filters, drop the search" : "Clear the search",
      href: archiveHref({ ...query, search: "" }),
    });
  }
  if (query.topics.length) {
    routes.push({ label: "Any topic", href: archiveHref({ ...query, topics: [] }) });
  }
  if (query.authors.length) {
    routes.push({ label: "Any author", href: archiveHref({ ...query, authors: [] }) });
  }
  if (query.formats.length || query.review.length) {
    routes.push({
      label: "Any format or review status",
      href: archiveHref({ ...query, formats: [], review: [] }),
    });
  }
  return routes.slice(0, 3);
}

export function ArchiveResults({
  query,
  results,
  total,
  authorNames,
}: ArchiveResultsProps) {
  const chips = buildChips(query, authorNames);
  const filtered = chips.length > 0;

  return (
    <div>
      {filtered && (
        <div className={styles.chips}>
          <span className={styles.chipsLabel}>Filtered by</span>
          {chips.map((chip) => (
            <Link key={chip.key} href={chip.href} className={styles.chip} scroll={false}>
              <span>
                <span className={styles.chipKind}>{chip.kind}: </span>
                {chip.label}
              </span>
              <CloseIcon size={13} />
              <span className="visually-hidden">Remove this filter</span>
            </Link>
          ))}
          <Link href="/articles" className={styles.clearAll} scroll={false}>
            Clear all
          </Link>
        </div>
      )}

      {/* A live region so a screen reader hears the count change as filters are applied.
          When nothing matched it is announced but not drawn, because the empty state
          below says the same thing at full size. */}
      <div className={results.length === 0 ? undefined : styles.summary}>
        <p className={results.length === 0 ? "visually-hidden" : styles.count} role="status">
          {results.length === 0 ? (
            "No articles match these filters"
          ) : filtered ? (
            <>
              <strong>{results.length}</strong>
              {results.length === 1 ? " article" : " articles"} of {total}
            </>
          ) : (
            <>
              <strong>{total}</strong> articles, newest first
            </>
          )}
        </p>
      </div>

      {results.length > 0 ? (
        <div className={styles.list}>
          {results.map((article) => (
            <ArticleCard
              key={article.slug}
              article={article}
              variant="list"
              authorNames={authorNames}
            />
          ))}
        </div>
      ) : (
        <EmptyState query={query} />
      )}
    </div>
  );
}

function EmptyState({ query }: { query: ArchiveQuery }) {
  const routes = buildEscapeRoutes(query);
  const term = query.search.trim();

  return (
    <div className={styles.empty}>
      <h2 className={styles.emptyTitle}>Nothing here yet</h2>
      <p className={styles.emptyBody}>
        {term ? (
          <>
            No article matches <em>{term}</em> with the filters you have set. The archive
            searches titles, abstracts, author names, topics and tags.
          </>
        ) : (
          <>
            No article carries every filter you have set. Lemma is young, so some
            combinations genuinely have nothing in them yet.
          </>
        )}
      </p>
      <div className={styles.suggestions}>
        {routes.map((route) => (
          <Link key={route.href} href={route.href} className={styles.suggestion} scroll={false}>
            {route.label}
            <ArrowRightIcon size={15} />
          </Link>
        ))}
      </div>
    </div>
  );
}
