import { getAuthor } from "@/data/authors";
import { topicName } from "@/data/topics";
import { ARTICLE_SUMMARIES } from "@/data/articles";
import type { ArticleFormat } from "@/data/types";

/**
 * The slim index behind the header's search dialog.
 *
 * It is built on the server and handed to the client component as props, and it
 * deliberately omits descriptions and standfirsts: those are most of the weight of an
 * ArticleSummary and a result row does not display them. At twenty articles this is a
 * few kilobytes. Past a hundred it should be fetched on first open rather than shipped
 * with every page, which is the point at which this function grows a route handler.
 *
 * The archive page at /articles does not use this — it filters server-side. See
 * src/lib/articles/query.ts for why the two work differently.
 */
export interface SearchEntry {
  slug: string;
  title: string;
  authors: string;
  topic: string;
  format: ArticleFormat;
  /** Pre-lowercased haystack, so the dialog does no string work per keystroke. */
  match: string;
}

export function buildSearchIndex(): SearchEntry[] {
  return ARTICLE_SUMMARIES.map((article) => {
    const authors = article.authorIds.map((id) => getAuthor(id)?.name ?? "").join(", ");
    const topics = article.topics.map(topicName);
    return {
      slug: article.slug,
      title: article.title,
      authors,
      topic: topics[0] ?? "",
      format: article.format,
      match: [article.title, authors, topics.join(" "), article.tags.join(" ")]
        .join(" ")
        .toLowerCase(),
    };
  });
}
