import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Application-owned public handle; null until onboarding completes. */
      handle: string | null;
    } & DefaultSession["user"];
  }
}
