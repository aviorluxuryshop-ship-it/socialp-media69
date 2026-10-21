import { NextResponse, type NextRequest } from "next/server";
import { checkExperimentAuth } from "@/lib/experiment-auth";

/**
 * Server-side gate for the private /experiments area (Next.js 16 "proxy", formerly
 * middleware). Runs before any route renders, so unauthenticated visitors never
 * receive the page. Public pages are not matched and are unaffected.
 *
 * - Credentials are read from EXPERIMENTS_USER / EXPERIMENTS_PASSWORD at runtime.
 * - If they are not configured, the area answers 404 (fails closed).
 * - Responses are marked noindex and uncacheable.
 */
export function proxy(request: NextRequest) {
  const result = checkExperimentAuth(request.headers.get("authorization"));

  let response: NextResponse;
  if (result === "ok") {
    response = NextResponse.next();
  } else if (result === "unconfigured") {
    response = new NextResponse("Not Found", { status: 404 });
  } else {
    response = new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Peel Auto Glass private area", charset="UTF-8"' },
    });
  }

  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export const config = {
  matcher: ["/experiments", "/experiments/:path*"],
};
