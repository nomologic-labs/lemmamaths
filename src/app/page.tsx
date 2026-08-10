import { BrowseArchive } from "@/components/home/BrowseArchive";
import { ExploreTopics } from "@/components/home/ExploreTopics";
import { FeaturedArticle } from "@/components/home/FeaturedArticle";
import { Hero } from "@/components/home/Hero";
import { RecentlyPublished } from "@/components/home/RecentlyPublished";
import { TOPICS } from "@/data/topics";
import { authorLookupToRecord } from "@/lib/articles/author-display";
import {
  getFeaturedArticle,
  getPublicAuthorNameMap,
  getRecentArticles,
  listPublishedSummaries,
  listPublicAuthors,
} from "@/lib/articles/public";

export default async function HomePage() {
  const [summaries, authors, nameMap, featured] = await Promise.all([
    listPublishedSummaries(),
    listPublicAuthors(),
    getPublicAuthorNameMap(),
    getFeaturedArticle(),
  ]);
  const authorNames = authorLookupToRecord(nameMap);
  const recent = await getRecentArticles(6, featured?.slug);
  const topicCounts = Object.fromEntries(
    TOPICS.map((topic) => [
      topic.id,
      summaries.reduce((n, article) => n + (article.topics.includes(topic.id) ? 1 : 0), 0),
    ]),
  );

  return (
    <>
      <Hero />
      <RecentlyPublished articles={recent} authorNames={authorNames} />
      {featured && <FeaturedArticle article={featured} authorNames={authorNames} />}
      <ExploreTopics topicCounts={topicCounts} />
      <BrowseArchive
        articleCount={summaries.length}
        authorCount={authors.length}
        topicCount={TOPICS.length}
      />
    </>
  );
}
