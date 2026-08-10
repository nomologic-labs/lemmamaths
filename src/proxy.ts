import { auth } from "@/auth";
import { runAuthProxyGate } from "@/lib/auth/proxy-gate";

export default auth((request) => runAuthProxyGate(request));

export const config = {
  // `/dashboard` itself stays public; only nested contributor tools require auth.
  matcher: ["/dashboard/:path+", "/onboarding/:path*", "/login"],
};
