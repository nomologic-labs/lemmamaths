import { ArticleCard } from "@/components/articles/ArticleCard";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ArticleSummary } from "@/data/types";
import styles from "./HomeSections.module.css";

export function RecentlyPublished({
  articles,
  authorNames,
}: {
  articles: readonly ArticleSummary[];
  authorNames?: Record<string, string>;
}) {
  return (
    <Container as="section" className={styles.section} id="recent">
      <Reveal shift="1rem">
        <SectionHeading
          eyebrow="Latest"
          title="Recently published"
          description="New work from across the nine fields, most recent first."
          action={{ href: "/articles", label: "All articles" }}
        />
      </Reveal>

      <div className={styles.grid}>
        {articles.map((article, index) => (
          <Reveal
            key={article.slug}
            // Stagger by column so a row appears to settle together rather than
            // sweeping across the page one card at a time.
            delay={(index % 3) * 90}
            shift="1.25rem"
          >
            <ArticleCard article={article} authorNames={authorNames} />
          </Reveal>
        ))}
      </div>
    </Container>
  );
}
