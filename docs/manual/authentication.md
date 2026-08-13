# Authentication

## Status

**Implemented.** Google OAuth sign-in, handle onboarding, and permission-based authorization all work end to end.

Contributors sign in with a personal Google account, choose a Lemma handle on first sign-in, and reach the contributor dashboard once an administrator approves the account. See [Authorization](./authorization.md).

Public article pages read published PostgreSQL rows. Signing in does not by itself grant roles or publish content.

## What is implemented

| Feature | Status |
|---------|--------|
| Google OAuth via Auth.js v5 | Implemented |
| Database-backed sessions | Implemented |
| `/login` page | Implemented |
| Handle onboarding (`/onboarding/handle`) | Implemented |
| Protected `/dashboard` | Implemented |
| Navigation sign-in / sign-out | Implemented |
| Admin bootstrap via `LEMMA_BOOTSTRAP_ADMIN_EMAIL` | Implemented |
| Role-based authorization | Implemented — see [Authorization](./authorization.md) |
| Article persistence / editor / publish | Implemented — server-authorized via roles |

## Identity model

Lemma separates four concepts (see [Decision 007](../decisions/007-authentication-and-database.md)):

1. **Google account** — authentication identity (OAuth)
2. **`users` row** — Lemma application identity (internal UUID, email, handle)
3. **`author_profiles` row** — public publishing identity (never created automatically)
4. **`users.account_role` / `users.account_status`** — authorization (see [Decision 011](../decisions/011-account-roles-and-status.md))

A contributor's Google display name is stored in `users.name` for convenience but is **not** the public Lemma identity. The application-owned `handle` (e.g. `nadia-okonkwo`) is chosen during onboarding and is normally immutable.

Signing in with Google creates a `contributor` account in `pending` status. An administrator must approve the account before drafting, review, or editorial tools become available (except handle onboarding).

## Authentication flow

```text
Reader → /login → Google OAuth → Auth.js creates/links user + session
       → (new user, no handle) → /onboarding/handle → claim handle
       → /dashboard
```

Returning users with an existing handle skip onboarding.

Proxy (`src/proxy.ts`) performs coarse route gating only:

- `/dashboard` requires a session and a handle
- `/onboarding/*` requires a session
- `/login` redirects authenticated users away

Role and permission checks are enforced in server components and server actions — not in the proxy.

## Session architecture

- **Framework:** Auth.js v5 (`next-auth@5.0.0-beta.32`)
- **Strategy:** `database` — session rows in the `session` table
- **Adapter:** `@auth/drizzle-adapter` with Lemma's `users` table plus standard `account`, `session`, and `verificationToken` tables
- **Cookie:** HTTP-only session token managed by Auth.js (server-validated)

The session callback enriches `session.user` with:

- `id` — Lemma `users.id`
- `handle` — nullable until onboarding completes

## Handle onboarding

New users must choose a handle before entering `/dashboard`.

Validation (`src/lib/auth/handles.ts`):

- 3–24 characters
- Lowercase letters, numbers, hyphens only
- Must begin with a letter
- Cannot end with a hyphen or contain consecutive hyphens
- Must not match a reserved system handle (`admin`, `login`, `dashboard`, `articles`, …)

Handles are **not** derived from Google display names. Mock author profiles are **not** copied automatically.

Server action: `claimHandle` in `src/lib/auth/actions.ts`.

## Admin bootstrap

If `LEMMA_BOOTSTRAP_ADMIN_EMAIL` is set, the first Google sign-in with that exact email becomes `administrator` + `active` idempotently (`src/lib/auth/bootstrap-admin.ts`), provided Google’s OIDC profile has `email_verified: true`.

- Compared server-side only against the Auth.js sign-in event email (from Google OAuth)
- Requires Google `profile.email_verified === true` (not Auth.js `users.emailVerified`, which is for Email/magic-link providers and stays null for OAuth)
- Never exposed to the client
- Never based on display name, domain, or client input
- Uses `UPDATE users SET account_role = 'administrator', account_status = 'active'`

To bootstrap the founding admin:

1. Set `LEMMA_BOOTSTRAP_ADMIN_EMAIL=you@example.com` in `.env.local` / Vercel
2. Apply database migrations
3. Sign in with that Google account
4. Remove or rotate the env var after bootstrap if desired (existing administrator account remains)

## Google OAuth setup

### Google Cloud Console

1. Create a project (or use an existing one)
2. Configure the **OAuth consent screen** (External; add test users while in testing mode)
3. Create **OAuth 2.0 Client ID** credentials (Web application)
4. Add **Authorized JavaScript origins:**
   - Local: `http://localhost:3000`
   - Production: `https://your-production-domain`
5. Add **Authorized redirect URIs:**
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-production-domain/api/auth/callback/google`

Copy the client ID and secret into environment variables (never commit them).

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon PostgreSQL (pooled connection string recommended) |
| `AUTH_SECRET` | Yes | Session encryption (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `AUTH_URL` | Production | Canonical site URL (e.g. `https://lemma.example`) |
| `AUTH_TRUST_HOST` | Vercel | Set to `true` if Auth.js cannot infer the host |
| `LEMMA_BOOTSTRAP_ADMIN_EMAIL` | Optional | Bootstrap first admin by verified email |

See `.env.example`.

## Local development

1. Copy `.env.example` → `.env.local` and fill in values
2. Apply migrations: `npm run db:migrate`
3. Start the dev server: `npm run dev`
4. Visit `http://localhost:3000/login`

## Important files

```text
src/auth.ts                              Auth.js configuration
src/proxy.ts                             Coarse auth route gating (Next.js 16)
src/app/api/auth/[...nextauth]/route.ts    Auth.js route handler
src/app/login/page.tsx                     Sign-in page
src/app/onboarding/handle/                 Handle onboarding
src/lib/auth/actions.ts                    claimHandle server action
src/lib/auth/bootstrap-admin.ts            Admin bootstrap
src/lib/auth/handles.ts                    Handle validation
src/lib/db/auth-schema.ts                  Auth.js adapter tables
```

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Redirect loop on login | `AUTH_URL` / `AUTH_TRUST_HOST` mismatch with actual origin |
| `OAuthCallback` error | Redirect URI in Google Console does not match `/api/auth/callback/google` |
| Session not persisting | `AUTH_SECRET` missing or changed between restarts |
| Dashboard redirects to onboarding | User has no `handle` yet — complete `/onboarding/handle` |
| `DATABASE_URL is not set` | Missing env var when auth or DB code runs |
| Migration errors | Run `npm run db:migrate` after pulling schema changes |

OAuth end-to-end testing requires real Google credentials and an applied migration against a live database.

## Security constraints

- Every capability is a permission checked server-side in `src/lib/auth/permissions.ts` and `src/lib/auth/guards.ts`; review and publishing are authorized there, not in the UI
- Never trust client-side session display for security decisions
- Never trust client-provided user IDs
- OAuth secrets exist only in server environment variables (`src/auth.ts`)

## Not implemented

- Self-service author profile creation. `author_profiles` rows are not created at sign-up, so
  a contributor has no public author page until one exists. Articles by an author without a
  profile still carry a byline (their handle); the byline is simply not a link.
