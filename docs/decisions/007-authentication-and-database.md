Decision 007 — Authentication and Database

Status: Accepted
Date: 2026-08-09

## Decision

Lemma will use the following stack for persistent application data and authentication:

| Layer | Choice |
|-------|--------|
| Application framework | Next.js (App Router) |
| Language | TypeScript |
| Deployment | Vercel |
| Authentication | Auth.js v5 |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| Migrations | Drizzle Kit |

### Initial contributor authentication

Contributors will sign in with **personal Google accounts** via Google OAuth.

Google OAuth is implemented in **Phase 2** (not yet built). School-managed accounts are not required.

The authentication design must remain extensible so additional providers could be added later without replacing the application user model.

## Identity model

Lemma distinguishes four layers of identity:

| Layer | What it is | Authoritative for |
|-------|------------|-------------------|
| Google account | Authentication identity (OAuth subject, managed by Google) | Proving who signed in |
| Lemma `users` row | Application identity (internal UUID, email, handle) | Account ownership, audit trails |
| `author_profiles` row | Public publishing identity (bio, affiliation, interests) | What readers see on `/authors/[handle]` |
| `user_roles` rows | Authorization capabilities | What a signed-in user may do server-side |

**A contributor's Google display name must not become the authoritative public Lemma author identity.**

Google may populate `users.name` for convenience, but the public author identity is application-owned:

- `users.handle` — stable public slug (e.g. `nadia-okonkwo`), matching today's mock `Author.id`
- `author_profiles` — bio, affiliation, interests shown on author pages

Handle assignment is a Lemma onboarding step, not an automatic mirror of Google profile data.

## Rationale

### Auth.js v5

- Native Next.js App Router integration
- Standard session and OAuth patterns
- Drizzle adapter available for PostgreSQL
- Portable: auth logic is not tied to a single hosting vendor beyond standard HTTP cookies

### Neon PostgreSQL

- Serverless-compatible PostgreSQL, works well on Vercel
- Standard SQL — low lock-in compared to proprietary BaaS auth+database bundles
- Suitable for Lemma's expected scale (100+ articles, modest concurrent users)

### Drizzle ORM

- Strong TypeScript integration aligned with Lemma's explicit content types
- Lightweight compared to heavier ORMs
- Schema-as-code with generated migrations via Drizzle Kit

### Personal Google accounts

- Students already have Google accounts without school IT involvement
- Reduces password-management burden for a volunteer student publication
- OAuth defers credential storage to Google

## Tradeoffs accepted

| Choice | Benefit | Cost |
|--------|---------|------|
| Auth.js + self-managed Postgres | Portability, standard SQL, clear separation of concerns | More setup than an all-in-one BaaS |
| Google OAuth only (initially) | Simple sign-in for students | Contributors without Google need a future alternative provider |
| Application-owned handles | Stable public URLs, editorial control of author identity | Requires onboarding step after first sign-in |
| Roles granted explicitly | Prevents accidental publishing privileges | Requires admin/editor workflow to assign roles |

## Auth.js adapter compatibility (Phase 2)

Phase 1 creates a `users` table whose core columns match the Auth.js Drizzle adapter defaults:

- `id` (text, UUID)
- `name`
- `email` (unique)
- `email_verified`
- `image`

Lemma extends `users` with `handle`, `created_at`, and `updated_at`.

Phase 2 will add the standard Auth.js tables without renaming `users`:

- `accounts` — links OAuth providers to `users`
- `sessions` — database session strategy (if used)
- `verification_tokens` — only if magic-link providers are added later

These tables are **not** created in Phase 1. See `docs/manual/authentication.md` for the exact column conventions from the Auth.js Drizzle adapter documentation.

## What is implemented when

| Phase | Scope |
|-------|-------|
| Phase 0 | Decision record and manual updates |
| Phase 1 | Drizzle schema, client, migrations, seed helpers |
| Phase 2 | Auth.js, Google OAuth, sessions, handle onboarding, protected dashboard |
| Phase 3 | Authorization guards, role admin, audit log — **implemented** |
| Phase 4+ | Article persistence, editor, review workflow |

## Related decisions

- [002 — Technology Stack](./002-technology-stack.md) — Vercel deployment, deferred provider choice (now resolved for auth/database)
- [003 — Content Model](./003-content-model.md) — article metadata and author representation

## Consequences

- `DATABASE_URL` is required for database development and deployment
- `AUTH_SECRET` and Google OAuth credentials will be required in Phase 2
- Public article pages continue to read mock data from `src/data/` until a later article-migration phase
- Authorization must always be enforced server-side; UI visibility is not security (`rules/20-engineering.mdc`)
