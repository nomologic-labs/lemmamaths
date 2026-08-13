import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import type { AccountRole, AccountStatus } from "./permissions";
import { isAccountRole, isAccountStatus } from "./permissions";

export type UserAccount = {
  accountRole: AccountRole;
  accountStatus: AccountStatus;
};

const DEFAULT_ACCOUNT: UserAccount = {
  accountRole: "contributor",
  accountStatus: "pending",
};

export async function loadAccountForUser(userId: string): Promise<UserAccount> {
  const [row] = await db
    .select({
      accountRole: users.accountRole,
      accountStatus: users.accountStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return DEFAULT_ACCOUNT;

  return {
    accountRole: isAccountRole(row.accountRole) ? row.accountRole : "contributor",
    accountStatus: isAccountStatus(row.accountStatus) ? row.accountStatus : "pending",
  };
}

export async function countActiveAdministrators(): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.accountRole, "administrator"), eq(users.accountStatus, "active")));

  return rows.length;
}
