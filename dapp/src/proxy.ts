import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that live under /app but are served at root on app.focus-pet.xyz
const SUBDOMAIN_REWRITES: Record<string, string> = {
  "/leaderboard": "/app/leaderboard",
  "/history":     "/app/history",
};

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (host === "app.focus-pet.xyz") {
    // Rewrite root to /app
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/app", request.url));
    }
    // /app is a localhost-only path — redirect to clean root on subdomain
    if (pathname === "/app" || pathname.startsWith("/app/")) {
      const subpath = pathname.slice(4) || "/";
      return NextResponse.redirect(new URL(subpath, request.url), 301);
    }
    // Rewrite clean subdomain paths to /app/* equivalents
    for (const [from, to] of Object.entries(SUBDOMAIN_REWRITES)) {
      if (pathname === from || pathname.startsWith(from + "/")) {
        return NextResponse.rewrite(new URL(to + pathname.slice(from.length), request.url));
      }
    }
  }

  // On focus-pet.xyz, redirect any app routes to app.focus-pet.xyz
  if (host === "focus-pet.xyz") {
    const appPaths = ["/app", "/leaderboard", "/history"];
    const isAppRoute = appPaths.some((r) => pathname === r || pathname.startsWith(r + "/"));
    if (isAppRoute) {
      // Map old /leaderboard → app.focus-pet.xyz/leaderboard (not /app/leaderboard)
      const cleanPath = pathname.startsWith("/app/") ? pathname.slice(4) : pathname;
      return NextResponse.redirect(new URL(`https://app.focus-pet.xyz${cleanPath}`), 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
