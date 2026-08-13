# Article data

## Canonical model

Article bodies are `ArticleBlock[]` defined in `src/data/types.ts`. This is the only document model — not Markdown, MDX, or HTML.

Every block has a stable `id` (`blk_…`). Review comments reference these ids, not array indexes.

Inline content uses `InlineNode` (strings, math, emphasis, strong, code, links). Block kinds include headings, paragraphs, display math, statements, proofs, lists, figures, code, and quotes.

## Storage

### Public archive (readers)

PostgreSQL is authoritative for published content. Public pages call `src/lib/articles/public.ts`:

| Function | Behaviour |
|----------|-----------|
| `getPublishedArticle(slug)` / `getArticle(slug)` | `workflow_status = PUBLISHED` only; else undefined |
| `listPublishedSummaries()` / `getPublicSummaries()` | Published summaries only |
| `listPublicAuthors()` / `getPublicAuthor(handle)` | Public `author_profiles` + `users.handle` |

Unpublished slugs return **404** on `/articles/[slug]` (not 403). Public queries never leak draft/submitted/approved existence.

### Mock data (seed / fixtures)

`src/data/articles/` and `src/data/authors.ts` remain as seed sources and fixtures. They are **not** the runtime public registry.

Import with `npm run db:seed` (idempotent by slug; does not create users).

### Database (contributors + publishing)

| Table | Purpose |
|-------|---------|
| `articles` | Metadata + `body` JSONB + `workflow_status` + `peer_review_status` |
| `article_authors` | Many-to-many link to `users` with sort order |
| `article_review_rounds` | Review rounds (`OPEN` / `COMPLETED`) |
| `article_reviewers` | Per-round reviewer assignments + decisions |
| `article_review_comments` | Block-level comments (`block_id` → `ArticleBlock.id`) |
| `article_revisions` | Intentional body/metadata snapshots (not full VCS) |

Schema: `src/lib/db/articles-schema.ts`  
Migrations: `drizzle/0003_articles.sql` … `drizzle/0007_account_role_status.sql`

### Article row fields

| Column | Type | Notes |
|--------|------|-------|
| `id` | text (UUID) | Primary key (never used as public author id) |
| `slug` | text | Unique; `draft-{id}` until publish assigns a public slug |
| `title`, `standfirst`, `description` | text | Metadata |
| `format` | text | `ArticleFormat` |
| `reading_minutes` | integer | Estimated on save |
| `topics`, `tags` | jsonb | Typed arrays |
| `body` | jsonb | `ArticleBlock[]` with required `id` per block |
| `workflow_status` | enum | Editorial workflow including `PUBLISHED` |
| `peer_review_status` | text | Public badge (`peer-reviewed` / `editorial-review` / `under-review`) |
| `featured` | boolean | Editor-controlled |
| `created_by_id` | text | Owner |
| `published_on` | date | Set on publish |

## Publishing

- `approveArticleAction`: `UNDER_REVIEW` → `APPROVED` (state-checked)
- `publishArticleAction`: `APPROVED` → `PUBLISHED` (state-checked; sets `published_on`, public slug, audit)

Published rows are immutable through the normal draft editor. Fork → re-review → republish of an already-published article is deferred (see Decision 010).

## Author relationships (public)

```text
article → article_authors → users.handle → author_profiles (is_public)
```

Public pages use handles (`/authors/[handle]`). Email and internal UUIDs are not exposed.

## Related

- Decision [010](../decisions/010-publishing-and-public-data.md)
- [Article editor](./article-editor.md)
- [Review system](./review-system.md)
