// apps/web/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Public routes
  const publicPaths = ["/", "/login", "/api/health", "/api/auth"];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // 1.a) Mini rate-limit ONLY for /api/auth/*
  if (pathname.startsWith("/api/auth")) {
    // ip fallback compatible
    const ipHeader = req.headers.get("x-forwarded-for") || "";
    const ip = ipHeader.split(",")[0]?.trim() || "local";

    // use a simple in-memory store for dev
    const g = globalThis as unknown as {
      __RL__?: Map<string, number[]>;
    };
    if (!g.__RL__) g.__RL__ = new Map<string, number[]>();

    const key = `rl:${ip}`;
    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    const limit = 5; // 5 req/min/IP

    const hits = (g.__RL__.get(key) || []).filter((t) => now - t < windowMs);
    hits.push(now);
    g.__RL__.set(key, hits);

    if (hits.length > limit) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  if (isPublic) return NextResponse.next();

  // 2) Protected pages: check NextAuth session cookie
  const hasSessionCookie =
    req.cookies.get("next-auth.session-token") !== undefined ||
    req.cookies.get("__Secure-next-auth.session-token") !== undefined;

  if (!hasSessionCookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/api/auth/:path*"],
};
