"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { validateHandle } from "@/lib/auth/handles";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export type ClaimHandleState = {
  error?: string;
};

export async function claimHandle(
  _prevState: ClaimHandleState,
  formData: FormData,
): Promise<ClaimHandleState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const raw = formData.get("handle");
  if (typeof raw !== "string") {
    return { error: "Enter a handle." };
  }

  const validation = validateHandle(raw);
  if (!validation.ok) {
    return { error: validation.error };
  }

  const [current] = await db
    .select({ handle: users.handle })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (current?.handle) {
    redirect("/dashboard");
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.handle, validation.handle))
    .limit(1);

  if (existing) {
    return { error: "That handle is already taken." };
  }

  const updated = await db
    .update(users)
    .set({
      handle: validation.handle,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id))
    .returning({ handle: users.handle });

  if (!updated[0]) {
    return { error: "Could not save your handle. Try again." };
  }

  const callbackUrl = formData.get("callbackUrl");
  if (typeof callbackUrl === "string" && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
    redirect(callbackUrl);
  }

  redirect("/dashboard");
}
