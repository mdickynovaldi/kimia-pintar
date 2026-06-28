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

  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Unauthenticated → bounce protected routes to /login.
  if (!user && !PUBLIC_PATHS.has(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Authenticated users shouldn't sit on the login/register screens.
  if (user && AUTH_PATHS.has(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
