import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that do not require authentication
const publicPaths = ["/login", "/register", "/auth/callback", "/join"];

const API_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_API_RATE_LIMIT = 120;

const API_RATE_LIMIT_OVERRIDES: Array<{ prefix: string; limit: number }> = [
  { prefix: "/api/account/delete", limit: 5 },
  { prefix: "/api/tournaments/invite", limit: 30 },
  { prefix: "/api/tournaments", limit: 60 },
  { prefix: "/api/rounds", limit: 90 },
];

type RateLimitEntry = { count: number; resetAt: number };

const globalForRateLimit = globalThis as typeof globalThis & {
  __golfApiRateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore =
  globalForRateLimit.__golfApiRateLimitStore ??
  (globalForRateLimit.__golfApiRateLimitStore = new Map<string, RateLimitEntry>());

function getApiLimit(pathname: string): number {
  for (const rule of API_RATE_LIMIT_OVERRIDES) {
    if (pathname.startsWith(rule.prefix)) return rule.limit;
  }
  return DEFAULT_API_RATE_LIMIT;
}

function getClientIdentifier(request: NextRequest, userId?: string): string {
  // Prefer authenticated user ID — cannot be spoofed
  if (userId) return `uid:${userId}`;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return `ip:${forwardedFor.split(",")[0].trim()}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;

  return "unknown-client";
}

function enforceApiRateLimit(request: NextRequest, pathname: string, userId?: string): NextResponse | null {
  const now = Date.now();
  const identifier = getClientIdentifier(request, userId);
  const limit = getApiLimit(pathname);
  // Key by route prefix match, not exact path, to prevent per-URL bypass
  const matchedPrefix = API_RATE_LIMIT_OVERRIDES.find((r) => pathname.startsWith(r.prefix))?.prefix ?? "/api";
  const key = `${identifier}:${matchedPrefix}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + API_RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return null;
}

function isPublicPath(pathname: string) {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const rateLimitResponse = enforceApiRateLimit(request, pathname, user?.id);
    if (rateLimitResponse) return rateLimitResponse;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return supabaseResponse;
  }

  // Allow public routes regardless of auth state
  if (isPublicPath(pathname)) {
    // If already logged in and visiting login/register, redirect to home
    if (user && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  // Protected routes — redirect to login if unauthenticated
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route guard — check role for /admin/* paths
  if (pathname.startsWith("/admin")) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest, icons, service worker
     * - public image assets
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
