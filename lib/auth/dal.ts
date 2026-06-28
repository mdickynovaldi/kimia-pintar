import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { rowToProfile } from "@/lib/data/map";
import { currentAdmin, currentStudent } from "@/lib/data/mock";
import type { Profile } from "@/lib/data/types";

/**
 * Resolve the signed-in user's profile (id, role, name…) for the current
 * request. Memoized per render pass via React `cache`. Returns null when not
 * signed in. In mock mode (no Supabase env) returns null so the UI uses its
 * design defaults.
 */
export const getSessionUser = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return rowToProfile(profile, user.email);
});

/** Require any signed-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<Profile> {
  if (!isSupabaseConfigured) return currentStudent; // mock mode
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Require an admin; redirect students to /dashboard, anon to /login. */
export async function requireAdmin(): Promise<Profile> {
  if (!isSupabaseConfigured) return currentAdmin; // mock mode
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
