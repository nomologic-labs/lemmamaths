import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canEditArticleRecord } from "@/lib/articles/access";
import { getArticleById, toAccessRecord } from "@/lib/articles/store";
import { hasDatabaseUrl } from "@/lib/db/client";
import type { LemmaRole, Permission } from "./permissions";
import { hasPermission, permissionsForRoles } from "./permissions";
import { loadRolesForUser } from "./roles";

export class AuthorizationError extends Error {
  readonly code: "UNAUTHENTICATED" | "FORBIDDEN";

  constructor(code: "UNAUTHENTICATED" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export type AuthenticatedUser = {
  id: string;
  handle: string | null;
  email: string | null;
  name: string | null;
  roles: LemmaRole[];
  permissions: ReadonlySet<Permission>;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  // Build/collect without DATABASE_URL: treat as signed out rather than crashing.
  if (!hasDatabaseUrl()) return null;

  const session = await auth();
  if (!session?.user?.id) return null;

  const roles = await loadRolesForUser(session.user.id);

  return {
    id: session.user.id,
    handle: session.user.handle ?? null,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    roles,
    permissions: permissionsForRoles(roles),
  };
}

export async function requireSession(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AuthorizationError("UNAUTHENTICATED", "Authentication required.");
  }
  return user;
}

export async function requirePermission(permission: Permission): Promise<AuthenticatedUser> {
  const user = await requireSession();
  if (!user.permissions.has(permission)) {
    throw new AuthorizationError("FORBIDDEN", `Missing permission: ${permission}`);
  }
  return user;
}

export async function requireRole(role: LemmaRole): Promise<AuthenticatedUser> {
  const user = await requireSession();
  if (!user.roles.includes(role)) {
    throw new AuthorizationError("FORBIDDEN", `Missing role: ${role}`);
  }
  return user;
}

export type ArticleEditContext = {
  ownerId?: string;
  assignedReviewerIds?: readonly string[];
};

/**
 * Resource-aware article edit check using persisted workflow state.
 */
export async function canEditArticle(
  userId: string,
  articleId: string,
  context?: ArticleEditContext,
): Promise<boolean> {
  const roles = await loadRolesForUser(userId);
  const article = await getArticleById(articleId);

  if (article) {
    return canEditArticleRecord(roles, userId, toAccessRecord(article));
  }

  if (hasPermission(roles, "article:edit:any")) {
    return true;
  }

  if (!context) {
    return false;
  }

  if (hasPermission(roles, "article:edit:own") && context.ownerId === userId) {
    return true;
  }

  if (
    hasPermission(roles, "article:edit:assigned") &&
    context.assignedReviewerIds?.includes(userId)
  ) {
    return true;
  }

  return false;
}

/** Redirect helpers for server components. */
export function redirectToLogin(callbackPath: string): never {
  redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
}

export function redirectToForbidden(): never {
  redirect("/dashboard");
}
