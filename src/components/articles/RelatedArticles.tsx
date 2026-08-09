import type { ArticleSummary } from "@/data/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ArticleCard } from "./ArticleCard";
import styles from "./RelatedArticles.module.css";

/**
 * Suggestions are scored by shared topics and tags in `findRelated`, not chosen by hand,
 * so an article added later can appear here without anyone editing the ones it relates
 * to. Nothing is shown when nothing scores — an empty row of cards would say less than
 * the footer that follows it.
 */
export function RelatedArticles({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;

  return (
    <section className={styles.related} aria-labelledby="related-heading">
      <Container>
        <h2 id="related-heading" className={styles.label}>
          Related reading
        </h2>
        <div className={styles.grid}>
          {articles.map((article, index) => (
            <Reveal key={article.slug} delay={index * 70}>
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
