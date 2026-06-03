import { NextResponse } from "next/server";

// In-memory sliding-window rate limiter.
//
// Works per-process. On Vercel each function instance has its own memory, so
// this provides per-pod limiting — not a global hard cap. It stops naive
// abuse and accidental hammering without requiring extra infrastructure.
// Upgrade to @upstash/ratelimit + Upstash Redis for a global hard limit.
//
// Usage:
//   const ok = rateLimit(`sign:${address}`, 5, 60 * 60 * 1000); // 5/hour
//   if (!ok) return rateLimitResponse();

const windows = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  windows.set(key, hits);
  return true;
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Too many requests — please try again later." },
    { status: 429, headers: { "Retry-After": "3600" } },
  );
}
