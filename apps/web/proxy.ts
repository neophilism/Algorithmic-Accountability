import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { evaluateAccess } from "./lib/access";

/** Keep public fictional demonstration open; fail closed for real data.
 * An anonymous health probe is the only application endpoint excluded.
 */
export function proxy(request: NextRequest) {
  const decision = evaluateAccess(request.headers.get("authorization"));
  if (decision === "unconfigured") {
    return new NextResponse("Operator access is not configured", {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }
  if (decision === "unauthorized") {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "www-authenticate": 'Basic realm="Algorithmic Accountability", charset="UTF-8"',
        "cache-control": "no-store",
      },
    });
  }
  const response = NextResponse.next();
  response.headers.set("cache-control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!api/engine-health|_next/static|_next/image|favicon.ico).*)"],
};
