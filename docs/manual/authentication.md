# Authentication

## Status

**Not implemented in V0.1.**

There are no user accounts, sessions, OAuth providers, or authorization checks. All public pages are readable without signing in.

## Prototype implications

- Author names on articles are mock data (`src/data/authors.ts`), not linked accounts.
- `/dashboard` is not protected because there is nothing to protect yet.
- Do not add a client-only “login” that pretends to authorize publishing.

## Future constraint

When authentication is added, choose a provider deliberately and record it in `docs/decisions/`. Never trust client-side checks for publishing or review actions (`rules/20-engineering.mdc`).
