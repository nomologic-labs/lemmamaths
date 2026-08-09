# Architecture (V0.1)

## Purpose

V0.1 is a **static/mock-data prototype** of the Lemma reader experience, deployed as a Next.js application that is compatible with Vercel.

The goal is to prove product and visual direction without locking in database, auth, or object-storage providers (see `docs/decisions/002-technology-stack.md`).

## Stack

| Layer | Choice | Notes |
|-------|--------|--------|
| Framework | Next.js (App Router) | React 19, TypeScript |
| Styling | CSS Modules + global tokens | No Tailwind in V0.1 |
| Mathematics | KaTeX | Server-rendered HTML via `katex` |
| Code highlighting | Shiki | Server-only; dual light/dark themes |
| Content | Typed TypeScript modules under `src/data/` | Not Markdown/MDX |
| Deployment target | Vercel | Not yet configured for a specific project |

## High-level shape

```text
Browser
  └── Next.js App Router (src/app)
        ├── Site chrome (header, drawer, search) — client islands
        ├── Pages — mostly Server Components
        ├── Article body rendering (KaTeX + Shiki on server)
        └── Mock registry (src/data/articles)
```

There is no API layer, no database, and no authenticated session.

## Design seams for later phases

These boundaries are intentional so V0.1 can grow without a rewrite:

1. **`src/data/articles/index.ts`** — `getArticle`, `ARTICLE_SUMMARIES`, etc. When articles move to a database, these functions become async data accessors; pages already call them as a registry API.
2. **`src/lib/articles/query.ts`** — pure `filterArticles(summaries, query)`. A future search index or SQL query can replace the body of this module while keeping URL parameter shapes.
3. **`src/data/types.ts` `ArticleBlock` union** — closed content model aimed at a future block editor. Bodies are not MDX, so user content cannot execute arbitrary JavaScript.
4. **Author `id` strings** — public handles (`nadia-okonkwo`) rather than opaque keys, so real accounts can later carry the same handle.

## Rendering model

- Most pages are Server Components.
- Client Components are limited to interactive chrome: theme, drawer, search dialog, archive filter form, reveal-on-scroll, code copy button.
- Article pages are statically generated via `generateStaticParams`.
- The archive (`/articles`) is dynamic because it reads URL search params on the server.

## Explicitly deferred

Do not look for these in the codebase as production systems:

- Authentication / sessions
- Database or ORM
- File uploads / object storage
- Peer-review workflow backend
- Browser article editor
- Server-side Python for graphs
- Production full-text search infrastructure

Placeholder UI exists only for **Author Dashboard** (`/dashboard`) to reserve navigation space.
