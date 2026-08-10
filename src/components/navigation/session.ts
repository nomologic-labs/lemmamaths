import type { ContributorNavLink } from "@/lib/auth/nav-links";

export type NavSessionUser = {
  handle: string | null;
  name: string | null;
};

export type NavSession = {
  user: NavSessionUser;
  contributorLinks: readonly ContributorNavLink[];
} | null;

export function navDisplayLabel(user: NavSessionUser): string {
  if (user.handle) return `@${user.handle}`;
  if (user.name) return user.name;
  return "Contributor";
}
