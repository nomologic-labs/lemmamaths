# Backend

## Status in V0.1

Lemma V0.1 has **no application backend** beyond what Next.js provides for rendering.

There is:

- no REST or GraphQL API
- no database
- no authentication service
- no object storage
- no background jobs

## What the server does today

On the server (or at build time), Next.js:

1. Imports the typed mock registry from `src/data/`.
2. Filters article summaries for `/articles` using `src/lib/articles/query.ts`.
3. Renders KaTeX and Shiki HTML for article bodies.
4. Statically generates `/articles/[slug]` and `/authors/[id]` pages.

`server-only` is used in `src/lib/code/highlight.ts` so Shiki never enters the client bundle (`next.config.ts` also lists `shiki` under `serverExternalPackages`).

## Future backend

Database, auth, and storage providers are **not chosen yet** (`docs/decisions/002-technology-stack.md`). Do not hard-code a vendor in application code until a decision record accepts one.

When a backend arrives, prefer extending the existing seams documented in [Architecture](./architecture.md) rather than inventing a parallel content path.
