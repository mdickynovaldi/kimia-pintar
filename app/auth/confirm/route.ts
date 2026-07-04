import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Only same-site relative paths (prevents open-redirect). */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}

/**
 * Auth email callback. Every Supabase email link (password recovery, email
 * confirmation, invite) lands here first; we turn the one-time token into a
 * cookie session, then forward to `next` (e.g. /reset-password). Without this
 * route the PKCE `?code=` in the email could never become a session and the
 * whole reset/confirm flow dead-ends.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (ok) {
    // Deactivated / not-yet-approved accounts must not walk in via an email
    // link (the is_active gate in login() alone wouldn't cover this path).
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", user.id)
        .single();
      if (profile && !profile.is_active) {
        await supabase.auth.signOut();
        const fail = new URL("/login", url.origin);
        fail.searchParams.set("error", "inactive");
        return NextResponse.redirect(fail);
      }
    }
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const fail = new URL("/login", url.origin);
  fail.searchParams.set("error", "link");
  return NextResponse.redirect(fail);
}
