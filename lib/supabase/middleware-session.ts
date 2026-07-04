import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Refreshes the Supabase auth session on every request and returns the user.
 * Called from proxy.ts (Next 16's renamed middleware). Must run so server
 * components always see a fresh session cookie.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Honor an unchecked "Ingat saya": login drops a `kp-remember=0` marker, and
  // here we downgrade the rotated auth cookies to session cookies so a token
  // refresh doesn't silently re-persist them for 400 days.
  const sessionOnly = request.cookies.get("kp-remember")?.value === "0";

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          const finalOptions = sessionOnly
            ? { ...options, maxAge: undefined, expires: undefined }
            : options;
          response.cookies.set(name, value, finalOptions);
        });
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token with Supabase (do not trust
  // getSession() in server code). This also refreshes the cookie if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
