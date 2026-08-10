# Content system (mock data / seed)

## Purpose

Typed content models and mock fixtures live under `src/data/`. **Runtime public pages** load published articles from PostgreSQL (`src/lib/articles/public.ts`). Mock modules remain the seed source (`npm run db:seed`) and test fixtures — not the live public registry.

## Important files

```text
src/data/types.ts                 Article, Author, Topic, ArticleBlock unions
src/data/topics.ts                Nine primary topics
src/data/authors.ts               Mock authors
src/data/articles/index.ts        Registry API (getArticle, summaries, …)
src/data/articles/catalogue.ts    Shorter articles
src/data/articles/*.ts            Long-form rich articles (one file each)
```

## Counts (current)

- **20** articles (5 long-form with rich bodies + figures/code; 15 shorter catalogue pieces)
- **9** topics (fixed product list)
- Multiple mock authors with bios, roles, and interests

## Article shape

See `Article` in `src/data/types.ts`. Metadata includes:

- `title`, `slug`, `standfirst?`, `description`
- `authorIds[]`, `publishedOn`, `updatedOn?`
- `topics[]`, `tags[]`, `format`, `readingMinutes`
- `review` (`peer-reviewed` | `editorial-review` | `under-review`)
- `featured?` (homepage featured slot)
- `body: ArticleBlock[]`

Formats: `article` | `investigation` | `essay` | `problem-set` | `report`.

## Why a block tree (not Markdown/MDX)

Documented in the header of `src/data/types.ts`:

1. A future student-facing editor needs a block document model.
2. MDX is executable JavaScript — unsafe for submitted student content.
3. A closed `ArticleBlock` union stores cleanly and can later support block-addressed review comments.

## ArticleBlock kinds implemented

| Kind | Role |
|------|------|
| `heading` | `h2` / `h3` only (page title is `h1`) |
| `paragraph` | Inline nodes (text, math, emphasis, strong, code, link) |
| `math` | Display equation (+ optional tag) |
| `statement` | definition, theorem, lemma, proposition, corollary, example, remark, exercise |
| `proof` | Proof with optional “of …” and tombstone |
| `list` | Ordered / unordered |
| `figure` | PNG/JPEG under `/public`, alt, dimensions, caption |
| `code` | Source + language; highlighted at render time |
| `quote` | Block quote + attribution |

## Registry API

`src/data/articles/index.ts` exports:

- `ARTICLES` — full articles, newest first (server-side only)
- `ARTICLE_SUMMARIES` — bodies stripped for client-safe lists
- `getArticle(slug)`
- `getArticlesByAuthor`, `countArticlesByAuthor`, `countArticlesByTopic`
- `getFeaturedArticle`, `getRecentArticles`
- `ALL_TAGS`

**Rule:** do not pass full `Article` values into client components. Bodies would inflate the client bundle. Pass `ArticleSummary` instead.

## Authors

`src/data/authors.ts` — `id` is the URL segment and the stable key articles reference. Treat it as a future public handle, not a database surrogate key.

## Topics

`src/data/topics.ts` — the nine ids from the core rules. Narrower subjects are **tags**, not new topics.
