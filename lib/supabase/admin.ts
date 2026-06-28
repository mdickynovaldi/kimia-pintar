import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env";

/**
 * Privileged service-role client — BYPASSES RLS. Server-only; never import into
 * client code. Use only for trusted admin operations (e.g. inviting/creating
 * student accounts). Prefer the RLS-scoped `createClient()` everywhere else.
 */
export function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
