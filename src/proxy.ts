import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "election_session";

/**
 * Proxy (formerly middleware) — protects /admin routes.
 * Only checks cookie presence; full session DB validation is
 * done inside each protected API route via validateSession().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionId = request.cookies.get(COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
