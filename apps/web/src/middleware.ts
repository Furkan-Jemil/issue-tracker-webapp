import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global auth guard middleware.
 *
 * Protects all /(main) pages and API routes (except auth endpoints and health)
 * by verifying the presence of the better-auth session cookie.
 *
 * This acts as defence-in-depth on top of the per-page `getAppSession()` checks.
 * A single missed server-component check no longer exposes the route.
 *
 * Cookie name: "better-auth.session_token" (better-auth default).
 */

// Routes that do NOT require authentication
const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/api/auth",
  "/api/health",
]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Allow all /api/auth/* sub-paths (better-auth internals)
  if (pathname.startsWith("/api/auth/")) return true;
  // Static assets, _next internals
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/uploads/")) return true;
  return false;
}

function hasSession(request: NextRequest): boolean {
  // better-auth stores the session in one of these cookies depending on config
  return (
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__session") ||
    request.cookies.has("app-session")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths through without checking auth
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check session cookie
  if (!hasSession(request)) {
    // API routes → return 401 JSON (don't redirect, clients need JSON)
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Pages → redirect to login, preserving the intended destination
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
