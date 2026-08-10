# Backend

## Status

Lemma has a **PostgreSQL database layer**, **Google OAuth authentication**, **role-based authorization**, **database-backed articles** (drafts through published), and **editorial review + publishing**.

Public reading uses PostgreSQL via `src/lib/articles/public.ts` (published rows only). Mock data under `src/data/` is a seed/fixture source.

### Implemented

- PostgreSQL schema via Drizzle ORM (Neon)
- Auth.js v5 with Google OAuth and database sessions
- Role-based authorization with audit logging
- Admin role management at `/dashboard/admin/users`
- Article persistence with JSONB bodies and stable block ids
- Draft editor server actions (`src/lib/articles/actions.ts`)
- Workflow transitions including approve + publish (state-checked)
- Review rounds, reviewer assignment, block comments, decisions
- Public article/author reads from PostgreSQL
- Idempotent seed for mock authors + published articles (`npm run db:seed`)
- SQL migrations in `drizzle/` through `0006_publishing_fields.sql`

### Not implemented

- REST or GraphQL API beyond Auth.js and article upload routes
- Object storage (images use local `public/uploads/` — not multi-instance ready)
- Background jobs
- Post-publication fork/re-edit workflow UI

## What the server does today

On the server, Next.js:

1. Loads published articles/authors from PostgreSQL for public pages
2. Filters summaries for `/articles` using pure logic in `src/lib/articles/query.ts`
3. Renders KaTeX and Shiki HTML for article bodies
4. Authenticates contributors via Auth.js
5. Persists drafts and workflow transitions with audit events
6. Soft-handles missing `DATABASE_URL` at import/build (empty public lists / signed-out); runtime still requires a database in production

`server-only` guards `src/lib/db/client.ts` and auth helpers so database credentials never enter the client bundle.

## Database layer

| Piece | Location |
|-------|----------|
| Lemma schema | `src/lib/db/schema.ts` |
| Auth.js schema | `src/lib/db/auth-schema.ts` |
| Audit schema | `src/lib/db/audit-schema.ts` |
| Articles schema | `src/lib/db/articles-schema.ts` |
| Public reads | `src/lib/articles/public.ts` |
| Article store / actions | `src/lib/articles/store.ts`, `actions.ts` |
| Workflow rules | `src/lib/articles/workflow.ts` |
| Client | `src/lib/db/client.ts` (lazy; `hasDatabaseUrl()`) |
| Migrations | `drizzle/` |

### Commands

```bash
npm run db:generate   # regenerate migration SQL after schema changes
npm run db:migrate    # apply pending migrations to DATABASE_URL
npm run db:seed       # sync author profiles + import mock PUBLISHED articles (idempotent)
```

Seed does **not** create user accounts. Mock articles import only when every author handle resolves to an existing user with a public `author_profiles` row.

## Publishing

- `approveArticleAction` — `UNDER_REVIEW` → `APPROVED`
- `publishArticleAction` — `APPROVED` → `PUBLISHED` (sets `published_on`, public slug, audit `article.published`)
- Editorial UI: Publish button on `/dashboard/review` for approved items

See [Decision 010](../decisions/010-publishing-and-public-data.md).

## Related

- [Article data](./article-data.md)
- [Authentication](./authentication.md)
- [Authorization](./authorization.md)
- [Review system](./review-system.md)
- [Deployment](./deployment.md)
