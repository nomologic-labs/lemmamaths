import type { AccountRole, AccountStatus } from "./permissions";

export type AccountTarget = {
  id: string;
  accountRole: AccountRole;
  accountStatus: AccountStatus;
};

export function validateApproveContributor(
  actorUserId: string,
  target: AccountTarget,
): string | null {
  if (actorUserId === target.id) {
    return "You cannot approve your own account.";
  }
  if (target.accountStatus !== "pending") {
    return "Only pending accounts can be approved.";
  }
  if (target.accountRole !== "contributor") {
    return "Only pending contributors can be approved.";
  }
  return null;
}

export function validatePromoteAccount(actorUserId: string, target: AccountTarget): string | null {
  if (actorUserId === target.id) {
    return "You cannot promote your own account.";
  }
  if (target.accountStatus !== "active") {
    return "Only active accounts can be promoted.";
  }
  return null;
}

export function validateDemoteAccount(actorUserId: string, target: AccountTarget): string | null {
  if (actorUserId === target.id) {
    return "You cannot demote your own account.";
  }
  if (target.accountStatus !== "active") {
    return "Only active accounts can be demoted.";
  }
  if (target.accountRole !== "administrator") {
    return "Only administrators can be demoted.";
  }
  return null;
}

export function validateSuspendAccount(target: AccountTarget): string | null {
  if (target.accountStatus !== "active") {
    return "Only active accounts can be suspended.";
  }
  return null;
}

export function validateRestoreAccount(target: AccountTarget): string | null {
  if (target.accountStatus !== "suspended") {
    return "Only suspended accounts can be restored.";
  }
  return null;
}

export function validateLastActiveAdministrator(
  target: AccountTarget,
  activeAdministratorCount: number,
): string | null {
  if (
    target.accountRole === "administrator" &&
    target.accountStatus === "active" &&
    activeAdministratorCount <= 1
  ) {
    return "Cannot remove the last active administrator.";
  }
  return null;
}
