# Decision 010 — Publishing and public database authority

Status: Accepted  
Date: 2026-08-09

## Context

Phase 5 completed review rounds and block comments. Public pages still read mock TypeScript articles. Publishing existed only as a legal workflow edge without a server action.

## Decisions

### Approve vs publish

- **Approve** (`UNDER_REVIEW` → `APPROVED`) requires `article:approve`
- **Publish** (`APPROVED` → `PUBLISHED`) requires `article:publish`
- Authors and reviewers cannot publish
- Publication uses a state-checked update (`WHERE workflow_status = 'APPROVED'`) so concurrent publishes fail safely

### Public authority

PostgreSQL is authoritative for public article and author profile data. Public data-access lives in `src/lib/articles/public.ts` and always filters `workflow_status = 'PUBLISHED'`.

Unpublished slugs return **404** on public routes (not 403).

### Mock data

`src/data/articles/` and `src/data/authors.ts` remain as seed sources and fixtures. They are not the runtime public registry after this phase.

Article seed is idempotent by slug and **does not create user accounts**. Articles whose author handles lack matching `users` + public `author_profiles` rows are skipped and reported.

### Published immutability

`PUBLISHED` is not in author or editor editable workflow sets. Normal draft save/submit cannot mutate published rows.

Creating a new editorial revision of an already-published article (fork → review → republish) is **deferred**; operators must not silently reopen published rows.

### Schema

`articles.peer_review_status` stores the public badge (`peer-reviewed` | `editorial-review` | `under-review`) separately from editorial `workflow_status`.

### Object storage

Deferred. Local `public/uploads/` remains a prototype limitation.

## Consequences

- Operators must run migrations through `0006_publishing_fields.sql`
- Seed requires real users with handles matching mock author ids before mock articles import
- Build may run without `DATABASE_URL` by treating public lists as empty, omitting the Auth.js Drizzle adapter, and signing sessions out; production still requires `DATABASE_URL`
- Root layout uses `force-dynamic` so empty build-time prerenders cannot ship a permanently empty archive
