/**
 * Lemma authorization vocabulary.
 *
 * Permissions are capabilities checked server-side. Account role maps to a set of
 * permissions when account_status is active. Public article reading does not
 * require a permission — it is open to all readers.
 */

export const ACCOUNT_ROLES = ["contributor", "administrator"] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export const ACCOUNT_STATUSES = ["pending", "active", "suspended"] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const PERMISSIONS = [
  "dashboard:access",
  "article:create",
  "article:read:own",
  "article:read:assigned",
  "article:read:any",
  "article:edit:own",
  "article:edit:any",
  "article:submit",
  "article:review",
  "article:approve",
  "article:publish",
  "account:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AccountRole, readonly Permission[]> = {
  contributor: [
    "dashboard:access",
    "article:create",
    "article:read:own",
    "article:read:assigned",
    "article:edit:own",
    "article:submit",
    "article:review",
  ],
  administrator: [
    "dashboard:access",
    "article:create",
    "article:read:own",
    "article:read:assigned",
    "article:read:any",
    "article:edit:own",
    "article:edit:any",
    "article:submit",
    "article:review",
    "article:approve",
    "article:publish",
    "account:manage",
  ],
};

export function isAccountRole(value: string): value is AccountRole {
  return (ACCOUNT_ROLES as readonly string[]).includes(value);
}

export function isAccountStatus(value: string): value is AccountStatus {
  return (ACCOUNT_STATUSES as readonly string[]).includes(value);
}

export function permissionsForRole(role: AccountRole): ReadonlySet<Permission> {
  return new Set(ROLE_PERMISSIONS[role]);
}

/** Active accounts receive role permissions; pending and suspended receive none. */
export function permissionsForAccount(
  role: AccountRole,
  status: AccountStatus,
): ReadonlySet<Permission> {
  if (status !== "active") {
    return new Set();
  }
  return permissionsForRole(role);
}

export function hasPermission(
  permissions: ReadonlySet<Permission>,
  permission: Permission,
): boolean {
  return permissions.has(permission);
}

export function isActiveAccount(status: AccountStatus): boolean {
  return status === "active";
}
