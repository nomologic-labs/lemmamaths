"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { getMissingAuthEnvVars } from "@/lib/auth/env";

export async function signInWithGoogle(callbackUrl?: string): Promise<void> {
  const missing = getMissingAuthEnvVars();
  if (missing.length > 0) {
    const params = new URLSearchParams({
      error: "Configuration",
      missing: missing.join(","),
    });
    if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) {
      params.set("callbackUrl", callbackUrl);
    }
    redirect(`/login?${params.toString()}`);
  }

  const destination =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/dashboard";

  await signIn("google", { redirectTo: destination });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
