# Decision 011 — Account roles and status

Status: Accepted  
Date: 2026-08-10

## Context

Lemma previously stored authorization capabilities in a separate `user_roles` table with multiple roles per user (`author`, `reviewer`, `editor`, `admin`). That model conflated account capabilities with workflow-specific reviewer assignment, required manual role grants after every sign-in, and made pending access states implicit.

## Decision

Replace multi-role grants with two columns on `users`:

| Column | Values | Purpose |
|--------|--------|---------|
| `account_role` | `contributor`, `administrator` | What the account may do when active |
| `account_status` | `pending`, `active`, `suspended` | Whether capabilities are currently granted |

### Defaults

- New Google sign-ins: `contributor` + `pending`
- Bootstrap admin email: `administrator` + `active` (idempotent on sign-in)

### Migration backfill

| Old `user_roles` | New state |
|------------------|-----------|
| `admin` | `administrator` + `active` |
| `editor` | `administrator` + `active` |
| `author` or `reviewer` | `contributor` + `active` |
| no roles | `contributor` + `pending` |

The `user_roles` table and `user_role` enum are dropped after backfill.

### Reviewer assignment

`reviewer` is removed as an account role. Contributors review only when assigned to a review round. Assignment checks remain in the review system.

### Account management

Administrators manage accounts through `/dashboard/admin/users`:

- Approve pending contributors
- Suspend and restore accounts
- Promote and demote between contributor and administrator
- Edit display names and handles

Protections preserved from the old admin model:

- No self-approval or self-promotion
- Cannot suspend or demote the last active administrator
- No hard user deletion

### Authorization loading

Permissions are derived server-side from `account_role` and `account_status` on every guarded operation. JWT/session claims are not authoritative.

## Consequences

- Simpler mental model: one role, explicit lifecycle status
- Pending users can onboard handles without gaining contributor capabilities
- Suspended users retain ownership and audit history
- `role:manage` becomes `account:manage`
- All article/review relationships are preserved through migration

## Related

- [Authorization manual](../manual/authorization.md)
- [Decision 007](./007-authentication-and-database.md) — identity model foundation
