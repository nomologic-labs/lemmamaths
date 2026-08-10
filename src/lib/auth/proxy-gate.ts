import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type AuthProxyRequest = NextRequest & {
  auth: {
    user?: {
      id?: string;
      handle?: string | null;
    };
  } | null;
};

/**
 * Coarse authentication gate for protected routes.
 * Role and permission checks belong in server components and server actions — not here.
 */
export function runAuthProxyGate(request: AuthProxyRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const session = request.auth;
  const isAuthenticated = Boolean(session?.user?.id);
  const handle = session?.user?.handle ?? null;

  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (!handle) {
      const onboardingUrl = new URL("/onboarding/handle", request.nextUrl.origin);
      onboardingUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  if (pathname.startsWith("/onboarding")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (handle && pathname.startsWith("/onboarding/handle")) {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
    }
  }

  if (pathname === "/login" && isAuthenticated) {
    if (handle) {
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
      if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) {
        return NextResponse.redirect(new URL(callbackUrl, request.nextUrl.origin));
      }
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
    }

    return NextResponse.redirect(new URL("/onboarding/handle", request.nextUrl.origin));
  }

  return NextResponse.next();
}
