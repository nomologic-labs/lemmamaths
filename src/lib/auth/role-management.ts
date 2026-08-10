import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userRoles, users } from "@/lib/db/schema";
import { writeAuditEntry } from "./audit";
import type { LemmaRole } from "./permissions";
import { isLemmaRole } from "./permissions";
import { countUsersWithRole } from "./roles";

export class RoleManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoleManagementError";
  }
}

export async function grantRoleToUser(
  actorUserId: string,
  targetUserId: string,
  role: LemmaRole,
): Promise<void> {
  if (actorUserId === targetUserId) {
    throw new RoleManagementError("You cannot grant roles to your own account.");
  }

  if (!isLemmaRole(role)) {
    throw new RoleManagementError("Invalid role.");
  }

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) {
    throw new RoleManagementError("User not found.");
  }

  const inserted = await db
    .insert(userRoles)
    .values({
      userId: targetUserId,
      role,
      grantedBy: actorUserId,
    })
    .onConflictDoNothing({
      target: [userRoles.userId, userRoles.role],
    })
    .returning({ id: userRoles.id });

  if (inserted.length === 0) {
    return;
  }

  await writeAuditEntry({
    actorUserId,
    action: "role.granted",
    targetType: "user",
    targetId: targetUserId,
    metadata: { role },
  });
}

export async function revokeRoleFromUser(
  actorUserId: string,
  targetUserId: string,
  role: LemmaRole,
): Promise<void> {
  if (!isLemmaRole(role)) {
    throw new RoleManagementError("Invalid role.");
  }

  if (role === "admin") {
    const adminCount = await countUsersWithRole("admin");
    const [targetIsAdmin] = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(and(eq(userRoles.userId, targetUserId), eq(userRoles.role, "admin")))
      .limit(1);

    if (targetIsAdmin && adminCount <= 1) {
      throw new RoleManagementError("Cannot revoke the last admin role in the system.");
    }
  }

  const deleted = await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, targetUserId), eq(userRoles.role, role)))
    .returning({
      id: userRoles.id,
      grantedBy: userRoles.grantedBy,
      grantedAt: userRoles.grantedAt,
    });

  if (deleted.length === 0) {
    return;
  }

  const removed = deleted[0]!;

  await writeAuditEntry({
    actorUserId,
    action: "role.revoked",
    targetType: "user",
    targetId: targetUserId,
    metadata: {
      role,
      previousGrantedBy: removed.grantedBy,
      previousGrantedAt: removed.grantedAt?.toISOString() ?? null,
    },
  });
}

export type ManagedUser = {
  id: string;
  email: string;
  handle: string | null;
  name: string | null;
  roles: LemmaRole[];
};

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      handle: users.handle,
      name: users.name,
    })
    .from(users)
    .orderBy(users.createdAt);

  const roleRows = await db.select().from(userRoles);
  const rolesByUser = new Map<string, LemmaRole[]>();

  for (const row of roleRows) {
    if (!isLemmaRole(row.role)) continue;
    const existing = rolesByUser.get(row.userId) ?? [];
    existing.push(row.role);
    rolesByUser.set(row.userId, existing);
  }

  return allUsers.map((user) => ({
    ...user,
    roles: rolesByUser.get(user.id) ?? [],
  }));
}
