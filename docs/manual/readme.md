# Lemma Technical Manual

This manual documents the **current** implementation of the Lemma website.

It describes how the system works today — not planned features. Public reading uses published PostgreSQL articles; contributors use Google OAuth, drafts/review/publish workflows, and a browser editor.

## Before Making Changes

1. Read every file in `rules/` (project rules).
2. Read relevant files in `docs/decisions/`.
3. Read the relevant sections of this manual.
4. Inspect the source under `src/`.

Do not assume a previous chat conversation is required to understand the system.

## What exists today

- Public reader experience (DB-backed published articles, topics, authors, search)
- Visual identity (parchment / leather palette, logo, typography)
- Google OAuth, handle onboarding, roles/permissions, audit log
- Database-backed articles with `ArticleBlock[]` bodies and stable block ids
- Browser article editor with autosave, preview, and author submit/resubmit
- Editorial workflow with review rounds, approve, and publish
- Reviewer assignment UI, block-level comments, reviewer decisions, author feedback
- Revision snapshots on submit/resubmit/publish
- Idempotent mock → DB seed (`npm run db:seed`)

## What does not exist yet

- Object storage for uploaded images
- Post-publication fork / re-edit workflow
- Revision diff UI / email notifications
- Executable author content (intentionally never)

## Manual Index

### Architecture

- [Architecture](./architecture.md) — stack, seams, and what is deferred
- [Frontend](./frontend.md) — app routes, components, styling
- [Backend](./backend.md) — database, migrations, server routes

### Content and discovery

- [Content system](./content-system.md) — typed articles, authors, topics, mock data
- [Article data](./article-data.md) — `ArticleBlock[]`, ids, DB schema, validation
- [Article rendering](./article-rendering.md) — KaTeX, statements, figures, code
- [Article editor](./article-editor.md) — drafting, autosave, workflow actions
- [Search and archive](./search.md) — URL-driven filtering and the search dialog
- [Media](./media.md) — static figures, brand assets, upload prototype limits

### Chrome and theming

- [Navigation](./navigation.md) — header, drawer, search, footer
- [Theme system](./theme.md) — tokens, persistence, reduced motion

### Auth, roles, review

- [Authentication](./authentication.md)
- [Authorization](./authorization.md)
- [Review system](./review-system.md) — workflow foundation vs planned UI

### Operations

- [Deployment](./deployment.md)
- [Troubleshooting](./troubleshooting.md)
- [Dependencies](./dependencies.md)

## Important source roots

```text
rules/                 Project rules (authoritative)
docs/decisions/        Accepted product/architecture decisions
docs/manual/           This manual
src/app/               Next.js App Router pages
src/components/        UI by domain (brand, navigation, home, articles, editor, …)
src/data/              Topics + mock seed/fixture articles and authors
src/lib/articles/      Public reads, draft store, validation, workflow, review
src/lib/auth/          Guards, permissions, audit
src/lib/db/            Drizzle schemas and client
src/styles/            Design tokens and global CSS
public/brand/          Logo reference and field SVGs
public/figures/        Mock article figures (PNG)
drizzle/               SQL migrations
```

## Documentation principle

Describe reality. If a feature is only a foundation (for example reviewer assignment without UI), say so. When behaviour changes, update the matching manual page in the same change.
