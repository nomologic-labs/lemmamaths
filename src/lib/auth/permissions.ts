/**
 * Lemma authorization vocabulary.
 *
 * Permissions are capabilities checked server-side. Roles map to sets of permissions.
 * Public article reading does not require a permission — it is open to all readers.
 */

export const LEMMA_ROLES = ["author", "reviewer", "editor", "admin"] as const;

export type LemmaRole = (typeof LEMMA_ROLES)[number];

export const PERMISSIONS = [
  "dashboard:access",
  "article:create",
  "article:read:own",
  "article:read:assigned",
  "article:read:any",
  "article:edit:own",
  "article:edit:assigned",
  "article:edit:any",
  "article:submit",
  "article:review",
  "article:approve",
  "article:publish",
  "role:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<LemmaRole, readonly Permission[]> = {
  author: [
    "dashboard:access",
    "article:create",
    "article:read:own",
    "article:edit:own",
    "article:submit",
  ],
  reviewer: [
    "dashboard:access",
    "article:read:assigned",
    "article:edit:assigned",
    "article:review",
  ],
  editor: [
    "dashboard:access",
    "article:create",
    "article:read:own",
    "article:read:assigned",
    "article:read:any",
    "article:edit:own",
    "article:edit:assigned",
    "article:edit:any",
    "article:submit",
    "article:review",
    "article:approve",
    "article:publish",
  ],
  admin: [
    "dashboard:access",
    "article:create",
    "article:read:own",
    "article:read:assigned",
    "article:read:any",
    "article:edit:own",
    "article:edit:assigned",
    "article:edit:any",
    "article:submit",
    "article:review",
    "article:approve",
    "article:publish",
    "role:manage",
  ],
};

export function isLemmaRole(value: string): value is LemmaRole {
  return (LEMMA_ROLES as readonly string[]).includes(value);
}

export function permissionsForRoles(roles: readonly LemmaRole[]): ReadonlySet<Permission> {
  const granted = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      granted.add(permission);
    }
  }
  return granted;
}

export function hasPermission(
  roles: readonly LemmaRole[],
  permission: Permission,
): boolean {
  return permissionsForRoles(roles).has(permission);
}

export function hasAnyRole(roles: readonly LemmaRole[]): boolean {
  return roles.length > 0;
}
