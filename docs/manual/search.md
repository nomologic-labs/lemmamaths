# Search and discovery

## Purpose

Article discovery must remain usable as the archive grows past 100 articles (`docs/decisions/005-search-and-discovery.md`). V0.1 implements URL-driven server filtering over mock summaries, plus a lightweight command-palette-style search dialog.

## Important files

```text
src/app/articles/page.tsx
src/lib/articles/query.ts
src/lib/articles/search-index.ts
src/lib/articles/labels.ts
src/components/articles/ArchiveFilters.tsx
src/components/articles/ArchiveResults.tsx
src/components/navigation/SearchDialog.tsx
```

## Archive (`/articles`)

Filtering runs **on the server** against `ARTICLE_SUMMARIES` and the URL query string.

Why not client-side filtering of a downloaded index?

- Twenty articles would allow either approach.
- The product target is 100+ articles; shipping the full catalogue (and eventually bodies) to every visitor stops scaling.
- URL state makes filtered views shareable and lets `/topics` and author pages deep-link into the same page.

### Query parameters

Parsed by `parseArchiveQuery`:

| Param | Meaning |
|-------|---------|
| `q` | Text search over title, description, authors, topics, tags |
| `topic` | Topic id (repeatable) |
| `author` | Author id (repeatable) |
| `format` | Format key (repeatable) |
| `review` | Peer-review status (repeatable) |
| `sort` | `newest` (default), `oldest`, `title`, `shortest` |

`serialiseArchiveQuery` / `filterArticles` / `computeFacets` / `countActiveFilters` live in `src/lib/articles/query.ts`.

### UI behaviour

- `ArchiveFilters` is a progressive-enhancement `<form method="get">`.
- With JavaScript, checkbox/sort changes call `router.replace` immediately; search is debounced (~320ms).
- Local control state re-seeds when the serialised URL changes (chip links, back/forward) without an effect that fights typing.
- Facet counts reflect the current filtered set where implemented by `computeFacets`.
- Empty states are handled in `ArchiveResults`.

### Topic and author entry points

- `/topics` → links like `/articles?topic=algebra`
- `/authors/[id]` → links into the author’s articles (filtered archive or listed on the author page)

No duplicated archive implementations.

## Search dialog

Opened from the header, the drawer, or the `/` keyboard shortcut (when focus is not in an input).

- Matches a compact `SearchEntry` index built in the root layout (`buildSearchIndex`).
- Fields: title, authors, topic, tags (not full article body).
- Caps results (seven) and offers “Browse the full archive” for heavier queries.
- Intentionally narrower than `/articles` — quick jump, not the discovery workbench.

## Not implemented

- Full-text search over article body text in the archive query
- Tag-only filter facet (tags are searchable via `q`)
- Year filter
- Relevance ranking beyond simple substring match
- External search engine (Meilisearch, Algolia, etc.)
