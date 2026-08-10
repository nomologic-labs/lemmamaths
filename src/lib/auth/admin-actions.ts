"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { isLemmaRole, type LemmaRole } from "@/lib/auth/permissions";
import { grantRoleToUser, revokeRoleFromUser, RoleManagementError } from "@/lib/auth/role-management";

export type RoleActionState = {
  error?: string;
  success?: string;
};

function readRole(value: FormDataEntryValue | null): LemmaRole | null {
  if (typeof value !== "string" || !isLemmaRole(value)) return null;
  return value;
}

export async function grantRoleAction(
  _prevState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  try {
    const actor = await requirePermission("role:manage");
    const targetUserId = formData.get("userId");
    const role = readRole(formData.get("role"));

    if (typeof targetUserId !== "string" || !targetUserId) {
      return { error: "Invalid user." };
    }
    if (!role) {
      return { error: "Invalid role." };
    }

    await grantRoleToUser(actor.id, targetUserId, role);
    revalidatePath("/dashboard/admin/users");
    revalidatePath("/dashboard");

    return { success: `Granted ${role}.` };
  } catch (error) {
    if (error instanceof RoleManagementError) {
      return { error: error.message };
    }
    return { error: "Could not grant role." };
  }
}

export async function revokeRoleAction(
  _prevState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  try {
    const actor = await requirePermission("role:manage");
    const targetUserId = formData.get("userId");
    const role = readRole(formData.get("role"));

    if (typeof targetUserId !== "string" || !targetUserId) {
      return { error: "Invalid user." };
    }
    if (!role) {
      return { error: "Invalid role." };
    }

    await revokeRoleFromUser(actor.id, targetUserId, role);
    revalidatePath("/dashboard/admin/users");
    revalidatePath("/dashboard");

    return { success: `Revoked ${role}.` };
  } catch (error) {
    if (error instanceof RoleManagementError) {
      return { error: error.message };
    }
    return { error: "Could not revoke role." };
  }
}
