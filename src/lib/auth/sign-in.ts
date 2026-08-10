"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle(callbackUrl?: string): Promise<void> {
  const destination =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/dashboard";

  await signIn("google", { redirectTo: destination });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
