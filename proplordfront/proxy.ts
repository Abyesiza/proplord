import { NextResponse, type NextRequest } from "next/server";

/** Optimistic gate: only checks the cookie exists; the dashboard layout validates the session. */
export function proxy(request: NextRequest) {
  if (request.cookies.has("pl_session")) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/dashboard/:path*"] };
