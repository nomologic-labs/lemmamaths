import { topicName } from "@/data/topics";
import type { ArticleFormat } from "@/data/types";
import { getPublicAuthorNameMap, listPublishedSummaries } from "./public";
import { resolveAuthorName } from "./author-display";

/**
 * The slim index behind the header's search dialog.
 *
 * It is built on the server from published DB articles and handed to the client as
 * props. Descriptions and standfirsts are omitted deliberately.
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

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const [summaries, nameMap] = await Promise.all([
    listPublishedSummaries(),
    getPublicAuthorNameMap(),
  ]);

  return summaries.map((article) => {
    const authors = article.authorIds
      .map((id) => resolveAuthorName(id, nameMap))
      .join(", ");
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
