import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Server-side Supabase client bound to the request cookies (RLS-scoped to the
 * signed-in user). Use in Server Components, Server Actions, and Route Handlers.
 * Next 16: `cookies()` is async.
 *
 * `persistSession: false` downgrades the auth cookies to session cookies (no
 * maxAge/expires) so they clear when the browser closes — this is what powers
 * an unchecked "Ingat saya" on login.
 */
export async function createClient(opts?: { persistSession?: boolean }) {
  const cookieStore = await cookies();
  const persist = opts?.persistSession ?? true;
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalOptions = persist
              ? options
              : { ...options, maxAge: undefined, expires: undefined };
            cookieStore.set(name, value, finalOptions);
          });
        } catch {
          // Called from a Server Component (cookies are read-only there).
          // Session refresh happens in proxy.ts, so this is safe to ignore.
        }
      },
    },
  });
}
