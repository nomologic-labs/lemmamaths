import type { Metadata } from "next";
import { ARTICLE_SUMMARIES } from "@/data/articles";
import { computeFacets, filterArticles, parseArchiveQuery } from "@/lib/articles/query";
import { ArchiveFilters } from "@/components/articles/ArchiveFilters";
import { ArchiveResults } from "@/components/articles/ArchiveResults";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
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
 * Filtering happens here, on the server, against the URL — not in the browser against a
 * downloaded index. With twenty articles either would work; the difference shows at the
 * hundred-plus the archive is planned to reach, when shipping the whole catalogue to
 * every visitor stops being reasonable. Keeping the query in the URL is also what lets
 * /topics and the author pages be links into this page rather than second implementations
 * of it.
 */
export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const query = parseArchiveQuery(await searchParams);
  const results = filterArticles(ARTICLE_SUMMARIES, query);
  const facets = computeFacets(ARTICLE_SUMMARIES, query);

  return (
    <>
      <PageHeader
        eyebrow="Archive"
        title="Articles"
        lede="Everything Lemma has published. Search the full text of titles and abstracts, or narrow by topic, author, format and review status — the filters combine, and the result is always a link you can share."
      />
      <Container className={styles.layout}>
        <ArchiveFilters query={query} facets={facets} />
        <div className={styles.results}>
          <ArchiveResults query={query} results={results} total={ARTICLE_SUMMARIES.length} />
        </div>
      </Container>
    </>
  );
}
