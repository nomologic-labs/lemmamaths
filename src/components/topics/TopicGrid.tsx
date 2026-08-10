import Link from "next/link";
import { InlineMath } from "@/components/ui/Math";
import { TOPICS } from "@/data/topics";
import { archiveHref } from "@/lib/articles/query";
import styles from "./TopicGrid.module.css";

/**
 * The nine primary topics. Each cell links into the archive with that topic already
 * selected, which is why /topics needs no article-listing code of its own — the archive
 * is the only place articles are listed and filtered.
 */
export function TopicGrid({
  headingLevel = 3,
  topicCounts = {},
}: {
  headingLevel?: 2 | 3;
  topicCounts?: Record<string, number>;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <div className={styles.grid}>
      {TOPICS.map((topic) => {
        const count = topicCounts[topic.id] ?? 0;
        return (
          <article key={topic.id} className={styles.topic}>
            <InlineMath tex={topic.glyph} className={styles.glyph} />
            <Heading className={styles.name}>
              <Link href={archiveHref({ topics: [topic.id] })}>{topic.name}</Link>
            </Heading>
            <p className={styles.blurb}>{topic.blurb}</p>
            <p className={styles.count}>
              {count} {count === 1 ? "article" : "articles"}
            </p>
          </article>
        );
      })}
    </div>
  );
}
