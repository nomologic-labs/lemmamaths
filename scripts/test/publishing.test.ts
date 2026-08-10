import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ARTICLES, ARTICLE_SUMMARIES, getArticle } from "../../src/data/articles";
import { AUTHORS } from "../../src/data/authors";
import { formatAuthorNames } from "../../src/lib/articles/author-display";
import { filterArticles, parseArchiveQuery } from "../../src/lib/articles/query";
import type { ArticleSummary } from "../../src/data/types";

/**
 * Publishing / public-data unit tests that do not require DATABASE_URL.
 * DB-backed public reads (`getPublishedArticle`, seed import) need a live database.
 */

const PUBLISHED: ArticleSummary["review"]["status"] = "peer-reviewed";

function summary(partial: Partial<ArticleSummary> & Pick<ArticleSummary, "slug" | "title">): ArticleSummary {
  return {
    standfirst: undefined,
    authorIds: ["nadia-okonkwo"],
    publishedOn: "2024-01-01",
    updatedOn: "2024-01-01",
    description: "desc",
    topics: ["algebra"],
    tags: ["test"],
    format: "article",
    readingMinutes: 5,
    review: { status: PUBLISHED },
    ...partial,
  };
}

describe("public visibility semantics (pure)", () => {
  it("archive filtering only sees the summaries it is given (published corpus)", () => {
    const publishedOnly = [
      summary({ slug: "a", title: "Alpha" }),
      summary({ slug: "b", title: "Beta", authorIds: ["tomas-lindqvist"] }),
    ];
    const results = filterArticles(publishedOnly, parseArchiveQuery({}));
    assert.equal(results.length, 2);
    assert.ok(results.every((article) => article.slug === "a" || article.slug === "b"));
  });

  it("unpublished slugs are absent from a published-only corpus (not-found semantics)", () => {
    const publishedOnly = [summary({ slug: "live", title: "Live" })];
    assert.equal(
      publishedOnly.find((article) => article.slug === "draft-secret"),
      undefined,
    );
    assert.equal(
      filterArticles(publishedOnly, parseArchiveQuery({ q: "draft-secret" })).length,
      0,
    );
  });

  it("public author display never formats emails or UUIDs as the public id", () => {
    const names = formatAuthorNames(["nadia-okonkwo"], {
      "nadia-okonkwo": "Nadia Okonkwo",
    });
    assert.equal(names, "Nadia Okonkwo");
    assert.equal(formatAuthorNames(["unknown-handle"]), "unknown-handle");
    assert.doesNotMatch(names, /@/);
    assert.doesNotMatch(names, /[0-9a-f]{8}-[0-9a-f]{4}/i);
  });
});

describe("mock seed source integrity", () => {
  it("mock articles keep stable public slugs and author handles", () => {
    assert.ok(ARTICLES.length > 0);
    for (const article of ARTICLES) {
      assert.ok(article.slug.length > 0);
      assert.ok(article.authorIds.length > 0);
      for (const authorId of article.authorIds) {
        assert.ok(
          AUTHORS.some((author) => author.id === authorId),
          `unknown mock author ${authorId} on ${article.slug}`,
        );
      }
      for (const block of article.body) {
        assert.ok(block.id.startsWith("blk_"));
      }
    }
  });

  it("mock registry getArticle finds published fixtures by slug", () => {
    const first = ARTICLE_SUMMARIES[0];
    assert.ok(first);
    const found = getArticle(first.slug);
    assert.ok(found);
    assert.equal(found.slug, first.slug);
  });
});
