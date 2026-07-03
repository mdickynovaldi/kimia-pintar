import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware-session";

// Next 16 renamed Middleware → Proxy (same functionality, Node.js runtime).
// This does session refresh + OPTIMISTIC auth redirects only. Real
// authorization is enforced by RLS at the database and requireAdmin() in the
// admin layout (see lib/auth/dal.ts).

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

const AUTH_PATHS = new Set(["/login", "/register"]);

export default async function proxy(request: NextRequest) {
  // Mock mode (no Supabase env yet): don't gate anything.
  if (!isSupabaseConfigured) return NextResponse.next();

  const path = request.nextUrl.pathname;

  // Fast path: no Supabase auth cookie at all → skip the session-refresh
  // network round-trip entirely (big win for anonymous landing/login loads).
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie) {
    if (PUBLIC_PATHS.has(path)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  const { response, user } = await updateSession(request);

  // Carry the refreshed/rotated Supabase session cookies onto a redirect so
  // the client isn't logged out mid-refresh (@supabase/ssr requirement).
  const redirectTo = (pathname: string, withNext = false) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    if (withNext) url.searchParams.set("next", path);
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  // Unauthenticated → bounce protected routes to /login.
  if (!user && !PUBLIC_PATHS.has(path)) return redirectTo("/login", true);

  // Authenticated users shouldn't sit on the login/register screens.
  if (user && AUTH_PATHS.has(path)) return redirectTo("/dashboard");

  return response;
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
