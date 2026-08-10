# Authorization

## Status

**Implemented.**

Lemma enforces contributor capabilities through server-side roles and permissions. Authentication (Google OAuth) establishes identity; authorization determines what a signed-in user may do.

Public article pages remain open to all readers and still use mock data from `src/data/`.

## Architecture

```text
Google identity
  → Lemma users row (application identity)
  → session (Auth.js database session)
  → user_roles (capabilities)
  → permissions (checked in guards / access helpers)
  → protected server operations
```

The proxy (`src/proxy.ts`) performs **coarse authentication gating only** (session + handle). It does **not** check roles or permissions.

Every sensitive operation must call the authorization layer in `src/lib/auth/guards.ts`, `src/lib/articles/access.ts`, or a server action that does.

## Roles

| Role | Purpose |
|------|---------|
| `author` | Create and submit own work |
| `reviewer` | Review assigned submissions |
| `editor` | Editorial workflow, approve, publish |
| `admin` | Manage roles (+ editorial authority) |

Roles are not mutually exclusive. A user may hold multiple roles (e.g. `author` + `reviewer`).

Signing in with Google does **not** assign any role automatically (except the optional admin bootstrap in `LEMMA_BOOTSTRAP_ADMIN_EMAIL`).

## Permissions

Defined in [`src/lib/auth/permissions.ts`](../../src/lib/auth/permissions.ts).

| Permission | Typical holders |
|------------|-----------------|
| `dashboard:access` | author, reviewer, editor, admin |
| `article:create` | author, editor, admin |
| `article:read:own` | author, editor, admin |
| `article:read:assigned` | reviewer, editor, admin |
| `article:read:any` | editor, admin |
| `article:edit:own` | author, editor, admin |
| `article:edit:assigned` | reviewer, editor, admin |
| `article:edit:any` | editor, admin |
| `article:submit` | author, editor, admin |
| `article:review` | reviewer, editor, admin |
| `article:approve` | editor, admin |
| `article:publish` | editor, admin |
| `role:manage` | admin |

Readers (signed out) and signed-in users with **no roles** have none of these permissions.

## Article access

[`src/lib/articles/access.ts`](../../src/lib/articles/access.ts):

| Function | Purpose |
|----------|---------|
| `canReadArticle` | Own / any / assigned-reviewer |
| `canEditArticleRecord` | Own (DRAFT, REVISION_REQUESTED) or edit:any through APPROVED |
| `canSubmitArticle` | Author submit/resubmit |
| `canDeleteDraft` | DRAFT only |
| `canPerformTransition` | Permission + ownership + legal workflow edge |

Workflow edges themselves are defined in [`src/lib/articles/workflow.ts`](../../src/lib/articles/workflow.ts). Invalid transitions fail safely on the server.

## Server-side guards

[`src/lib/auth/guards.ts`](../../src/lib/auth/guards.ts):

| Function | Purpose |
|----------|---------|
| `getAuthenticatedUser()` | Load session + authoritative roles from database |
| `requireSession()` | Require authentication |
| `requirePermission(permission)` | Require a specific permission |
| `requireRole(role)` | Require a specific role |

Roles are always loaded from `user_roles` at guard time. Session data is not the sole authority for permissions.

Never rely on hidden buttons, disabled buttons, client-side role checks, or URL obscurity for security.

## Dashboard access

| User state | `/dashboard` behavior |
|------------|----------------------|
| Signed out | Redirect to `/login` (proxy) |
| Signed in, no handle | Redirect to `/onboarding/handle` (proxy) |
| Signed in, handle set, no roles | "Awaiting access" page |
| Signed in with contributor role | Contributor dashboard |

## Role administration

Route: `/dashboard/admin/users`

- Requires `role:manage` (admin only)
- Lists Lemma users and their roles
- Grant and revoke roles via server actions in `src/lib/auth/admin-actions.ts`
- Admins cannot grant roles to their own account
- Revoking the last `admin` role in the system is blocked

Implementation: [`src/lib/auth/role-management.ts`](../../src/lib/auth/role-management.ts)

## Audit logging

Table: `audit_log` ([`src/lib/db/audit-schema.ts`](../../src/lib/db/audit-schema.ts))

Recorded actions:

| Action | When |
|--------|------|
| `role.granted` / `role.revoked` | Admin role changes |
| `article.submitted` / `article.resubmitted` | Author submit flow |
| `article.review_started` | Editor moves into review |
| `article.revision_requested` | Editor requests revision |
| `article.approved` | Editor approves |
| `reviewer.assigned` / `reviewer.removed` | Assignment APIs |
| `review.started` | Editor starts review (also `article.review_started` from workflow) |
| `review.comment.created` / `.updated` / `.resolved` | Block comments |
| `review.decision.submitted` | Reviewer finishes assignment |

Each entry stores `actorUserId`, `targetType`, `targetId`, `metadata` (JSONB), and `createdAt`. The actor is always taken from the authenticated server session — never from client input.

There is no audit-log UI yet.

## Navigation

Contributor links in the navigation drawer are derived from permissions via [`src/lib/auth/nav-links.ts`](../../src/lib/auth/nav-links.ts). Hiding a link is a UX convenience only; routes still enforce permissions server-side.

## Testing

```bash
npm run test:auth
npm run test:articles
```

## Review authorization

See [Review system](./review-system.md) and `src/lib/articles/review-access.ts`.

- Reviewers only see assigned articles
- Authors see feedback on their own articles
- Editors manage the queue (`article:approve`)
- Authors cannot review their own work

## Not implemented (intentionally deferred)

- Publishing UI
- Audit log viewer UI
- Author profile auto-creation

## Related documentation

- [Authentication](./authentication.md) — Google OAuth, sessions, handle onboarding
- [Article editor](./article-editor.md) — drafts, autosave, workflow actions
- [Backend](./backend.md) — database tables and migrations
- [Decision 008](../decisions/008-block-ids-and-editorial-workflow.md) — block ids and workflow foundation
