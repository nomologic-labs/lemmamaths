import type { LemmaRole } from "./permissions";
import { hasPermission } from "./permissions";

export type ContributorNavLink = {
  href: string;
  label: string;
};

/**
 * Contributor navigation derived from authoritative permissions.
 * UI visibility only — every protected route still checks permissions server-side.
 */
export function getContributorNavLinks(roles: readonly LemmaRole[]): ContributorNavLink[] {
  const links: ContributorNavLink[] = [];

  if (hasPermission(roles, "dashboard:access")) {
    links.push({ href: "/dashboard", label: "Dashboard" });
  }

  if (hasPermission(roles, "article:create")) {
    links.push({ href: "/dashboard/drafts", label: "My drafts" });
  }

  if (hasPermission(roles, "article:review")) {
    links.push({ href: "/dashboard/review/assigned", label: "Review" });
  }

  if (hasPermission(roles, "article:approve")) {
    links.push({ href: "/dashboard/review", label: "Submissions" });
  }

  if (hasPermission(roles, "role:manage")) {
    links.push({ href: "/dashboard/admin/users", label: "Administration" });
  }

  return links;
}

export function canAccessDashboard(roles: readonly LemmaRole[]): boolean {
  return hasPermission(roles, "dashboard:access");
}

export function canManageRoles(roles: readonly LemmaRole[]): boolean {
  return hasPermission(roles, "role:manage");
}
