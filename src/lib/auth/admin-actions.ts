"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import {
  AccountManagementError,
  approveContributor,
  demoteToContributor,
  promoteToAdministrator,
  restoreAccount,
  suspendAccount,
  updateUserHandle,
  updateUserName,
} from "@/lib/auth/account-management";

export type AccountActionState = {
  error?: string;
  success?: string;
};

function readUserId(formData: FormData): string | null {
  const value = formData.get("userId");
  return typeof value === "string" && value ? value : null;
}

async function runAccountAction(
  formData: FormData,
  action: (actorId: string, targetUserId: string) => Promise<void>,
  successMessage: string,
): Promise<AccountActionState> {
  try {
    const actor = await requirePermission("account:manage");
    const targetUserId = readUserId(formData);
    if (!targetUserId) {
      return { error: "Invalid user." };
    }

    await action(actor.id, targetUserId);
    revalidatePath("/dashboard/admin/users");
    revalidatePath("/dashboard");
    return { success: successMessage };
  } catch (error) {
    if (error instanceof AccountManagementError) {
      return { error: error.message };
    }
    return { error: "Could not complete account action." };
  }
}

export async function approveAccountAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  return runAccountAction(formData, approveContributor, "Contributor approved.");
}

export async function suspendAccountAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  return runAccountAction(formData, suspendAccount, "Account suspended.");
}

export async function restoreAccountAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  return runAccountAction(formData, restoreAccount, "Account restored.");
}

export async function promoteAccountAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  return runAccountAction(formData, promoteToAdministrator, "Promoted to administrator.");
}

export async function demoteAccountAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  return runAccountAction(formData, demoteToContributor, "Demoted to contributor.");
}

export async function updateUserNameAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const actor = await requirePermission("account:manage");
    const targetUserId = readUserId(formData);
    const name = formData.get("name");

    if (!targetUserId) {
      return { error: "Invalid user." };
    }
    if (typeof name !== "string") {
      return { error: "Enter a name." };
    }

    await updateUserName(actor.id, targetUserId, name);
    revalidatePath("/dashboard/admin/users");
    return { success: "Name updated." };
  } catch (error) {
    if (error instanceof AccountManagementError) {
      return { error: error.message };
    }
    return { error: "Could not update name." };
  }
}

export async function updateUserHandleAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const actor = await requirePermission("account:manage");
    const targetUserId = readUserId(formData);
    const handle = formData.get("handle");

    if (!targetUserId) {
      return { error: "Invalid user." };
    }
    if (typeof handle !== "string") {
      return { error: "Enter a handle." };
    }

    await updateUserHandle(actor.id, targetUserId, handle);
    revalidatePath("/dashboard/admin/users");
    return { success: "Handle updated." };
  } catch (error) {
    if (error instanceof AccountManagementError) {
      return { error: error.message };
    }
    return { error: "Could not update handle." };
  }
}
