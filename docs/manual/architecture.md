# Architecture

## Purpose

Lemma is a Next.js application deployed on Vercel. The public reader experience loads **published** articles and public author profiles from PostgreSQL. Mock content under `src/data/` is retained for seeding and fixtures. Contributors authenticate with Google OAuth.

## Stack

| Layer | Choice | Notes |
|-------|--------|--------|
| Framework | Next.js (App Router) | React 19, TypeScript |
| Styling | CSS Modules + global tokens | No Tailwind |
| Mathematics | KaTeX | Server-rendered HTML |
| Code highlighting | Shiki | Server-only |
| Public content | PostgreSQL via `src/lib/articles/public.ts` | `PUBLISHED` only |
| Seed / fixtures | `src/data/` | Mock articles/authors for `db:seed` |
| Database | Neon PostgreSQL | Users, sessions, articles, workflow, review |
| ORM | Drizzle ORM | `src/lib/db/` |
| Authorization | Roles + permissions | `src/lib/auth/`, `src/lib/articles/access.ts` |
| Document model | `ArticleBlock[]` with stable `id` | `src/data/types.ts` |
| Deployment | Vercel | |

## High-level shape

```text
Browser
  └── Next.js App Router (src/app)
        ├── Site chrome (header, drawer, search) — client islands + server session
        ├── Public pages — published rows via src/lib/articles/public.ts
        ├── Auth routes — /login, /api/auth/*, /onboarding/*
        ├── Protected /dashboard — session, handle, and roles
        ├── Draft editor — /dashboard/drafts/* with JSONB article bodies
        ├── Published list — /dashboard/published (read-only; links to the archive)
        ├── Peer review — /dashboard/review/assigned and /dashboard/review/[articleId]
        ├── Editorial review / publish — /dashboard/review
        └── Database layer (src/lib/db) — users, sessions, roles, articles, audit log
```

## Design seams

1. **`src/lib/articles/public.ts`** — public article/author reads (`PUBLISHED` only)
2. **`src/lib/articles/query.ts`** — pure archive filtering over summaries
3. **`src/data/types.ts` `ArticleBlock` union** — editor and database document model
4. **`users.handle`** — application-owned public identity
5. **`src/lib/db/`** — database access isolated from pages
6. **`src/data/articles/`** — seed/fixture source (not runtime authority)

## Implemented vs planned

| System | Status |
|--------|--------|
| Public reader (DB published) | Implemented |
| Google OAuth + sessions | Implemented |
| Handle onboarding | Implemented |
| Protected dashboard (role-aware) | Implemented |
| Authorization / role enforcement | Implemented |
| Article database (drafts → published) | Implemented |
| Browser article editor + autosave | Implemented |
| Stable `ArticleBlock` ids | Implemented |
| Workflow transition primitives | Implemented |
| Review rounds + assignment UI | Implemented |
| Block-level review comments | Implemented |
| Reviewer decisions + author feedback | Implemented |
| Revision snapshots on submit | Implemented (no diff UI) |
| Approve + publish server actions | Implemented |
| Mock → DB seed for published articles | Implemented |
| Post-publication re-edit fork | Deferred |
| Object storage for uploads | Planned |

## Related documentation

- [Authentication](./authentication.md) — OAuth setup, sessions, onboarding, bootstrap
- [Authorization](./authorization.md) — roles, permissions, guards, audit log
- [Backend](./backend.md) — database commands and tables
- [Article editor](./article-editor.md) — block editor, autosave, preview, workflow
- [Article data](./article-data.md) — `ArticleBlock[]`, ids, database schema, validation
- [Review system](./review-system.md) — rounds, assignment, block comments, publish
- [Decision 007](../decisions/007-authentication-and-database.md) — provider choices
- [Decision 008](../decisions/008-block-ids-and-editorial-workflow.md) — block ids and workflow foundation
- [Decision 009](../decisions/009-review-rounds-and-block-comments.md) — review rounds and comments
- [Decision 010](../decisions/010-publishing-and-public-data.md) — publishing and public DB authority
