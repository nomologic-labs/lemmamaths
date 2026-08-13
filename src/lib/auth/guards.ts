import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canEditArticleRecord } from "@/lib/articles/access";
import { getArticleById, toAccessRecord } from "@/lib/articles/store";
import { hasDatabaseUrl } from "@/lib/db/client";
import type { AccountRole, AccountStatus, Permission } from "./permissions";
import { hasPermission, permissionsForAccount } from "./permissions";
import { loadAccountForUser } from "./roles";

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
  accountRole: AccountRole;
  accountStatus: AccountStatus;
  permissions: ReadonlySet<Permission>;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  // Build/collect without DATABASE_URL: treat as signed out rather than crashing.
  if (!hasDatabaseUrl()) return null;

  const session = await auth();
  if (!session?.user?.id) return null;

  const account = await loadAccountForUser(session.user.id);
  const permissions = permissionsForAccount(account.accountRole, account.accountStatus);

  return {
    id: session.user.id,
    handle: session.user.handle ?? null,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    accountRole: account.accountRole,
    accountStatus: account.accountStatus,
    permissions,
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

export async function requireAccountRole(role: AccountRole): Promise<AuthenticatedUser> {
  const user = await requireSession();
  if (user.accountRole !== role) {
    throw new AuthorizationError("FORBIDDEN", `Missing account role: ${role}`);
  }
  if (user.accountStatus !== "active") {
    throw new AuthorizationError("FORBIDDEN", "Account is not active.");
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
  const account = await loadAccountForUser(userId);
  const permissions = permissionsForAccount(account.accountRole, account.accountStatus);
  const article = await getArticleById(articleId);

  if (article) {
    return canEditArticleRecord(permissions, userId, toAccessRecord(article));
  }

  if (hasPermission(permissions, "article:edit:any")) {
    return true;
  }

  if (!context) {
    return false;
  }

  if (hasPermission(permissions, "article:edit:own") && context.ownerId === userId) {
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
