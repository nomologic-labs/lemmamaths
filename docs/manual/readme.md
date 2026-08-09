# Lemma Technical Manual

This manual documents the **current** implementation of the Lemma website (V0.1 prototype).

It describes how the system works today — a polished, navigable front-end with typed mock content — not the eventual production backend.

## Before Making Changes

1. Read every file in `rules/` (project rules; equivalent to the `.cursor/rules/` references in older notes).
2. Read relevant files in `docs/decisions/`.
3. Read the relevant sections of this manual.
4. Inspect the source under `src/`.

Do not assume a previous chat conversation is required to understand the system.

## What V0.1 Is

Lemma V0.1 is a visual and product prototype. It validates:

- visual identity (parchment / leather palette, logo, typography)
- navigation drawer
- homepage experience
- article discovery and reading
- light / dark themes
- responsive behaviour

It does **not** include authentication, a database, real accounts, production CMS, peer-review backend, or server-side code execution.

## Manual Index

### Architecture

- [Architecture](./architecture.md) — stack, seams, and what is deferred
- [Frontend](./frontend.md) — app routes, components, styling
- [Backend](./backend.md) — what exists today (almost nothing server-side beyond rendering)

### Content and discovery

- [Content system](./content-system.md) — typed articles, authors, topics, mock data
- [Article rendering](./article-rendering.md) — KaTeX, statements, figures, code
- [Search and archive](./search.md) — URL-driven filtering and the search dialog
- [Media](./media.md) — static figures and brand assets

### Chrome and theming

- [Navigation](./navigation.md) — header, drawer, search, footer
- [Theme system](./theme.md) — tokens, persistence, reduced motion

### Not yet implemented

These pages exist so agents know the systems are **out of scope for V0.1**, not missing docs:

- [Article editor](./article-editor.md)
- [Authentication](./authentication.md)
- [Review system](./review-system.md)

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
src/components/        UI by domain (brand, navigation, home, articles, …)
src/data/              Typed mock authors, topics, articles
src/lib/               Theme, query, math, code highlighting
src/styles/            Design tokens and global CSS
public/brand/          Logo reference and field SVGs
public/figures/        Article figures (PNG)
```

## Documentation principle

Describe reality. If a feature is only a placeholder (for example `/dashboard`), say so. When behaviour changes, update the matching manual page in the same change.
