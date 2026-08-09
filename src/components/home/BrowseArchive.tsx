import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon, FilterIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./HomeSections.module.css";

export type BrowseArchiveProps = {
  articleCount: number;
  authorCount: number;
  topicCount: number;
};

export function BrowseArchive({ articleCount, authorCount, topicCount }: BrowseArchiveProps) {
  return (
    <Container as="section" className={styles.sectionTight} id="browse">
      <Reveal shift="1rem" className={styles.browse}>
        <div>
          <h2 className={styles.browseTitle}>Browse the archive</h2>
          <p className={styles.browseText}>
            Everything Lemma has published, in one place. Search the full text of titles
            and abstracts, or narrow by topic, author, format and review status — the
            filters combine, and the result is always a link you can share.
          </p>

          <dl className={styles.browseStats}>
            <div className={styles.stat}>
              <dd className={styles.statValue}>{articleCount}</dd>
              <dt className={styles.statLabel}>Articles</dt>
            </div>
            <div className={styles.stat}>
              <dd className={styles.statValue}>{authorCount}</dd>
              <dt className={styles.statLabel}>Contributors</dt>
            </div>
            <div className={styles.stat}>
              <dd className={styles.statValue}>{topicCount}</dd>
              <dt className={styles.statLabel}>Topics</dt>
            </div>
          </dl>
        </div>

        <div className={styles.browseActions}>
          <Link href="/articles" className={styles.primaryAction}>
            Open the archive
            <ArrowRightIcon size={17} />
          </Link>
          <Link href="/articles?review=peer-reviewed" className={styles.secondaryAction}>
            Peer-reviewed only
            <FilterIcon size={17} />
          </Link>
          <Link href="/authors" className={styles.secondaryAction}>
            Browse by author
            <ArrowRightIcon size={17} />
          </Link>
        </div>
      </Reveal>
    </Container>
  );
}
