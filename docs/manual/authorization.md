# Authorization

## Status

**Implemented.**

Lemma enforces contributor capabilities through server-side account roles, account status, and permissions. Authentication (Google OAuth) establishes identity; authorization determines what a signed-in user may do.

Public article pages remain open to all readers.

## Architecture

```text
Google identity
  → Lemma users row (application identity + account_role + account_status)
  → session (Auth.js database session)
  → permissions (derived from role + status, checked in guards / access helpers)
  → protected server operations
```

The proxy (`src/proxy.ts`) performs **coarse authentication gating only** (session + handle). It does **not** check roles or permissions.

Every sensitive operation must call the authorization layer in `src/lib/auth/guards.ts`, `src/lib/articles/access.ts`, or a server action that does.

Account role and status are always loaded from the `users` table at guard time. Session data is not the authority for permissions.

## Account roles

| Role | Purpose |
|------|---------|
| `contributor` | Create and submit own work; review when assigned to a round |
| `administrator` | Full editorial workflow plus account management |

A user holds exactly one account role.

## Account status

| Status | Purpose |
|--------|---------|
| `pending` | Signed in; may complete handle onboarding; no contributor capabilities |
| `active` | Contributor or administrator capabilities apply |
| `suspended` | Session may persist; all contributor/administrator capabilities denied server-side |

New Google sign-ins default to `contributor` + `pending`. The bootstrap email (`LEMMA_BOOTSTRAP_ADMIN_EMAIL`) becomes `administrator` + `active`.

## Review assignment vs account role

There is no `reviewer` account role. A contributor becomes a reviewer only when explicitly assigned to an article review round. Assignment checks, self-review prevention, round checks, and comment/decision authorization remain in `src/lib/articles/review-access.ts`.

The `contributor` role does **not** grant access to other contributors' unpublished articles.

## Permissions

Defined in [`src/lib/auth/permissions.ts`](../../src/lib/auth/permissions.ts). Permissions are granted only when `account_status === active`.

| Permission | Active contributor | Active administrator |
|------------|-------------------|----------------------|
| `dashboard:access` | yes | yes |
| `article:create` | yes | yes |
| `article:read:own` | yes | yes |
| `article:read:assigned` | yes (assigned rounds only) | yes |
| `article:read:any` | no | yes |
| `article:edit:own` | yes | yes |
| `article:edit:any` | no | yes |
| `article:submit` | yes | yes |
| `article:review` | yes (assigned rounds only) | yes |
| `article:approve` | no | yes |
| `article:publish` | no | yes |
| `account:manage` | no | yes |

Pending and suspended accounts receive **no** permissions.

## Article access

[`src/lib/articles/access.ts`](../../src/lib/articles/access.ts) checks permissions against article ownership and workflow state. Invalid transitions fail safely on the server.

## Server-side guards

[`src/lib/auth/guards.ts`](../../src/lib/auth/guards.ts):

| Function | Purpose |
|----------|---------|
| `getAuthenticatedUser()` | Load session + authoritative account role/status from database |
| `requireSession()` | Require authentication |
| `requirePermission(permission)` | Require active account with a specific permission |
| `requireAccountRole(role)` | Require active account with a specific role |

Never rely on hidden buttons, disabled buttons, client-side checks, or URL obscurity for security.

## Dashboard access

| User state | `/dashboard` behavior |
|------------|----------------------|
| Signed out | Sign-in prompt |
| Signed in, no handle | Redirect to `/onboarding/handle` (proxy) |
| Signed in, `pending` | Awaiting-approval message |
| Signed in, `suspended` | Suspended-account message |
| Signed in, `active` contributor | Contributor dashboard: My drafts, Peer review, Published |
| Signed in, `active` administrator | Contributor tools plus Editorial review and Accounts |

Pending users may complete and maintain handle onboarding.

## Account administration

Route: `/dashboard/admin/users`

- Requires `account:manage` (active administrator only)
- Approve pending contributors
- Suspend and restore accounts
- Promote contributors to administrators and demote administrators
- Edit user display names and handles
- Cannot self-approve or self-promote
- Cannot suspend or demote the last active administrator
- Users are never hard-deleted

Implementation: [`src/lib/auth/account-management.ts`](../../src/lib/auth/account-management.ts)

## Audit logging

Account-management actions recorded in `audit_log`:

| Action | When |
|--------|------|
| `account.approved` | Pending contributor approved |
| `account.suspended` | Active account suspended |
| `account.restored` | Suspended account restored |
| `account.promoted` | Contributor promoted to administrator |
| `account.demoted` | Administrator demoted to contributor |
| `account.name_updated` | Display name changed |
| `account.handle_updated` | Handle changed |

Article and review audit events are unchanged.

## Navigation

Contributor links are derived from permissions via [`src/lib/auth/nav-links.ts`](../../src/lib/auth/nav-links.ts). Hiding a link is a UX convenience only; routes still enforce permissions server-side.

## Testing

```bash
npm run test:auth
npm run test:articles
npm run test:review
```

## Related documentation

- [Authentication](./authentication.md) — Google OAuth, sessions, handle onboarding
- [Decision 011](../decisions/011-account-roles-and-status.md) — account role and status model
