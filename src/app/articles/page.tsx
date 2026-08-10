import type { Metadata } from "next";
import { ArchiveFilters } from "@/components/articles/ArchiveFilters";
import { ArchiveResults } from "@/components/articles/ArchiveResults";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { authorLookupToRecord } from "@/lib/articles/author-display";
import {
  getPublicAuthorNameMap,
  listPublishedSummaries,
  listPublicAuthors,
} from "@/lib/articles/public";
import { computeFacets, filterArticles, parseArchiveQuery } from "@/lib/articles/query";
import styles from "./Archive.module.css";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "The complete Lemma archive. Search the full text of every article, or narrow by topic, author, format and review status.",
};

type ArchivePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The archive.
 *
 * Filtering happens here, on the server, against published DB summaries — not in the
 * browser against a downloaded index. Pure filtering stays in `query.ts`.
 */
export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const [summaries, authors, nameMap] = await Promise.all([
    listPublishedSummaries(),
    listPublicAuthors(),
    getPublicAuthorNameMap(),
  ]);
  const authorNames = authorLookupToRecord(nameMap);
  const knownAuthorIds = new Set(authors.map((author) => author.id));
  const query = parseArchiveQuery(await searchParams, knownAuthorIds);
  const results = filterArticles(summaries, query, nameMap);
  const facets = computeFacets(summaries, query, nameMap);

  return (
    <>
      <PageHeader
        eyebrow="Archive"
        title="Articles"
        lede="Everything Lemma has published. Search the full text of titles and abstracts, or narrow by topic, author, format and review status — the filters combine, and the result is always a link you can share."
      />
      <Container className={styles.layout}>
        <ArchiveFilters
          query={query}
          facets={facets}
          authors={authors.map((author) => ({ id: author.id, name: author.name }))}
        />
        <div className={styles.results}>
          <ArchiveResults
            query={query}
            results={results}
            total={summaries.length}
            authorNames={authorNames}
          />
        </div>
      </Container>
    </>
  );
}
