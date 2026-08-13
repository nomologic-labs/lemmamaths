import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  validateApproveContributor,
  validateDemoteAccount,
  validateLastActiveAdministrator,
  validatePromoteAccount,
  validateRestoreAccount,
  validateSuspendAccount,
} from "./account-management-rules";
import { writeAuditEntry } from "./audit";
import { validateHandle } from "./handles";
import type { AccountRole, AccountStatus } from "./permissions";
import { countActiveAdministrators } from "./roles";

export class AccountManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountManagementError";
  }
}

async function requireTargetUser(targetUserId: string) {
  const [target] = await db
    .select({
      id: users.id,
      accountRole: users.accountRole,
      accountStatus: users.accountStatus,
      name: users.name,
      handle: users.handle,
    })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) {
    throw new AccountManagementError("User not found.");
  }

  return target;
}

async function assertNotLastActiveAdministrator(
  targetUserId: string,
  targetRole: AccountRole,
  targetStatus: AccountStatus,
): Promise<void> {
  const adminCount = await countActiveAdministrators();
  const validationError = validateLastActiveAdministrator(
    { id: targetUserId, accountRole: targetRole, accountStatus: targetStatus },
    adminCount,
  );
  if (validationError) {
    throw new AccountManagementError(validationError);
  }
}

export async function approveContributor(
  actorUserId: string,
  targetUserId: string,
): Promise<void> {
  const target = await requireTargetUser(targetUserId);
  const validationError = validateApproveContributor(actorUserId, target);
  if (validationError) {
    throw new AccountManagementError(validationError);
  }

  await db
    .update(users)
    .set({ accountStatus: "active", updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  await writeAuditEntry({
    actorUserId,
    action: "account.approved",
    targetType: "user",
    targetId: targetUserId,
  });
}

export async function suspendAccount(actorUserId: string, targetUserId: string): Promise<void> {
  const target = await requireTargetUser(targetUserId);
  const validationError = validateSuspendAccount(target);
  if (validationError) {
    throw new AccountManagementError(validationError);
  }

  await assertNotLastActiveAdministrator(targetUserId, target.accountRole, target.accountStatus);

  await db
    .update(users)
    .set({ accountStatus: "suspended", updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  await writeAuditEntry({
    actorUserId,
    action: "account.suspended",
    targetType: "user",
    targetId: targetUserId,
    metadata: { previousStatus: target.accountStatus, accountRole: target.accountRole },
  });
}

export async function restoreAccount(actorUserId: string, targetUserId: string): Promise<void> {
  const target = await requireTargetUser(targetUserId);
  const validationError = validateRestoreAccount(target);
  if (validationError) {
    throw new AccountManagementError(validationError);
  }

  await db
    .update(users)
    .set({ accountStatus: "active", updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  await writeAuditEntry({
    actorUserId,
    action: "account.restored",
    targetType: "user",
    targetId: targetUserId,
    metadata: { accountRole: target.accountRole },
  });
}

export async function promoteToAdministrator(
  actorUserId: string,
  targetUserId: string,
): Promise<void> {
  const target = await requireTargetUser(targetUserId);
  const validationError = validatePromoteAccount(actorUserId, target);
  if (validationError) {
    throw new AccountManagementError(validationError);
  }

  if (target.accountRole === "administrator") {
    return;
  }

  await db
    .update(users)
    .set({ accountRole: "administrator", updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  await writeAuditEntry({
    actorUserId,
    action: "account.promoted",
    targetType: "user",
    targetId: targetUserId,
    metadata: { previousRole: target.accountRole },
  });
}

export async function demoteToContributor(
  actorUserId: string,
  targetUserId: string,
): Promise<void> {
  const target = await requireTargetUser(targetUserId);
  const validationError = validateDemoteAccount(actorUserId, target);
  if (validationError) {
    throw new AccountManagementError(validationError);
  }

  await assertNotLastActiveAdministrator(targetUserId, target.accountRole, target.accountStatus);

  await db
    .update(users)
    .set({ accountRole: "contributor", updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  await writeAuditEntry({
    actorUserId,
    action: "account.demoted",
    targetType: "user",
    targetId: targetUserId,
    metadata: { previousRole: target.accountRole },
  });
}

export async function updateUserName(
  actorUserId: string,
  targetUserId: string,
  name: string,
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new AccountManagementError("Name cannot be empty.");
  }

  const target = await requireTargetUser(targetUserId);
  if (target.name === trimmed) return;

  await db
    .update(users)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  await writeAuditEntry({
    actorUserId,
    action: "account.name_updated",
    targetType: "user",
    targetId: targetUserId,
    metadata: { previousName: target.name, newName: trimmed },
  });
}

export async function updateUserHandle(
  actorUserId: string,
  targetUserId: string,
  rawHandle: string,
): Promise<void> {
  const validation = validateHandle(rawHandle);
  if (!validation.ok) {
    throw new AccountManagementError(validation.error);
  }

  const target = await requireTargetUser(targetUserId);
  if (target.handle === validation.handle) return;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.handle, validation.handle))
    .limit(1);

  if (existing && existing.id !== targetUserId) {
    throw new AccountManagementError("That handle is already taken.");
  }

  await db
    .update(users)
    .set({ handle: validation.handle, updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  await writeAuditEntry({
    actorUserId,
    action: "account.handle_updated",
    targetType: "user",
    targetId: targetUserId,
    metadata: { previousHandle: target.handle, newHandle: validation.handle },
  });
}

export type ManagedUser = {
  id: string;
  email: string;
  handle: string | null;
  name: string | null;
  accountRole: AccountRole;
  accountStatus: AccountStatus;
};

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      handle: users.handle,
      name: users.name,
      accountRole: users.accountRole,
      accountStatus: users.accountStatus,
    })
    .from(users)
    .orderBy(users.createdAt);

  return rows.map((user) => ({
    id: user.id,
    email: user.email,
    handle: user.handle,
    name: user.name,
    accountRole: user.accountRole,
    accountStatus: user.accountStatus,
  }));
}
