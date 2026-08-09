import type { Metadata } from "next";
import { TopicGrid } from "@/components/topics/TopicGrid";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import styles from "./Topics.module.css";

export const metadata: Metadata = {
  title: "Topics",
  description:
    "The nine fields Lemma publishes under: algebra, calculus, linear algebra, topology, arithmetic, statistics and probability, number theory, computer science and numerical analysis.",
};

/**
 * Nine cells, each a link into the archive with that topic selected. There is no topic
 * page beyond this one and no second article listing: a filtered archive URL already is
 * the topic view, and keeping it that way means filtering behaves identically wherever
 * the reader arrives from.
 */
export default function TopicsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Fields"
        title="Topics"
        lede="Every article is filed under at least one of these nine. They are deliberately broad — narrower subjects live as tags, which the archive searches alongside everything else."
      />
      <Container className={styles.page}>
        <TopicGrid headingLevel={2} />
        <p className={styles.note}>
          Choosing a topic opens the archive already filtered, so you can add an author,
          a format or a search term on top of it.
        </p>
      </Container>
    </>
  );
}
