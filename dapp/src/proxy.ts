import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  // On app.focus-pet.xyz, proxy root to /app (URL stays clean)
  if (host.startsWith("app.") && pathname === "/") {
    return NextResponse.rewrite(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
