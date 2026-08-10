import { TopicGrid } from "@/components/topics/TopicGrid";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import styles from "./HomeSections.module.css";

export function ExploreTopics({ topicCounts }: { topicCounts?: Record<string, number> }) {
  return (
    <Container as="section" className={styles.section} id="topics">
      <Reveal shift="1rem">
        <SectionHeading
          eyebrow="Explore"
          title="Explore mathematics"
          description="Nine fields. Everything Lemma publishes is filed under at least one of them; narrower subjects are tags."
          action={{ href: "/topics", label: "About the topics" }}
        />
      </Reveal>
      <Reveal delay={80} shift="1rem">
        <TopicGrid topicCounts={topicCounts} />
      </Reveal>
    </Container>
  );
}
