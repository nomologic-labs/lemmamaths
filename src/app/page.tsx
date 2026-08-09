import { BrowseArchive } from "@/components/home/BrowseArchive";
import { ExploreTopics } from "@/components/home/ExploreTopics";
import { FeaturedArticle } from "@/components/home/FeaturedArticle";
import { Hero } from "@/components/home/Hero";
import { RecentlyPublished } from "@/components/home/RecentlyPublished";
import { ARTICLE_SUMMARIES, getFeaturedArticle, getRecentArticles } from "@/data/articles";
import { AUTHORS } from "@/data/authors";
import { TOPICS } from "@/data/topics";

export default function HomePage() {
  const featured = getFeaturedArticle();
  // The lead article gets its own section further down, so it is not repeated here.
  const recent = getRecentArticles(6, featured.slug);

  return (
    <>
      <Hero />
      <RecentlyPublished articles={recent} />
      <FeaturedArticle article={featured} />
      <ExploreTopics />
      <BrowseArchive
        articleCount={ARTICLE_SUMMARIES.length}
        authorCount={AUTHORS.length}
        topicCount={TOPICS.length}
      />
    </>
  );
}
