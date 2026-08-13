import type { Permission } from "./permissions";
import { hasPermission } from "./permissions";

export type ContributorNavLink = {
  href: string;
  label: string;
};

/**
 * Contributor navigation derived from authoritative permissions.
 * UI visibility only — every protected route still checks permissions server-side.
 */
export function getContributorNavLinks(permissions: ReadonlySet<Permission>): ContributorNavLink[] {
  const links: ContributorNavLink[] = [];

  if (hasPermission(permissions, "dashboard:access")) {
    links.push({ href: "/dashboard", label: "Dashboard" });
  }

  if (hasPermission(permissions, "article:create")) {
    links.push({ href: "/dashboard/drafts", label: "My drafts" });
    links.push({ href: "/dashboard/published", label: "Published" });
  }

  if (hasPermission(permissions, "article:review")) {
    links.push({ href: "/dashboard/review/assigned", label: "Peer review" });
  }

  if (hasPermission(permissions, "article:approve")) {
    links.push({ href: "/dashboard/review", label: "Editorial review" });
  }

  if (hasPermission(permissions, "account:manage")) {
    links.push({ href: "/dashboard/admin/users", label: "Accounts" });
  }

  return links;
}

export function canAccessDashboard(permissions: ReadonlySet<Permission>): boolean {
  return hasPermission(permissions, "dashboard:access");
}

export function canManageAccounts(permissions: ReadonlySet<Permission>): boolean {
  return hasPermission(permissions, "account:manage");
}
