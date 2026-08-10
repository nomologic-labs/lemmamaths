import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userRoles } from "@/lib/db/schema";
import type { LemmaRole } from "./permissions";
import { isLemmaRole } from "./permissions";

export async function loadRolesForUser(userId: string): Promise<LemmaRole[]> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  return rows.map((row) => row.role).filter(isLemmaRole);
}

export async function countUsersWithRole(role: LemmaRole): Promise<number> {
  const rows = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .where(eq(userRoles.role, role));

  return rows.length;
}
