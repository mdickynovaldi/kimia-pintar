"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AuthState = { error?: string; message?: string } | undefined;

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function str(formData: FormData, key: string): string {
  return (formData.get(key) ?? "").toString().trim();
}

/** Only allow same-site relative paths as a post-login destination (prevents
 * open-redirect: rejects absolute URLs, scheme-relative //host, and backslashes). */
function safeNext(next: string): string {
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "";
  }
  return next;
}

// ---- Login -----------------------------------------------------------------
export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = str(formData, "email");
  const password = str(formData, "password");
  const next = safeNext(str(formData, "next"));
  const remember = str(formData, "remember") === "true";

  if (!isSupabaseConfigured) redirect(next || "/dashboard"); // mock mode

  if (!email || !password) return { error: "Email dan kata sandi wajib diisi." };

  // Unchecked "Ingat saya" → session cookies that clear on browser close.
  const supabase = await createClient({ persistSession: remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Email atau kata sandi salah." };
  }

  // Route admins to the admin dashboard.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let dest = next || "/dashboard";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin" && !next) dest = "/admin";
  }
  redirect(dest);
}

// ---- Register --------------------------------------------------------------
export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = str(formData, "full_name");
  const email = str(formData, "email");
  const studentNo = str(formData, "student_no");
  const password = str(formData, "password");
  const confirm = str(formData, "confirm");

  if (!isSupabaseConfigured) redirect("/dashboard"); // mock mode

  if (!fullName || !email || password.length < 8) {
    return { error: "Lengkapi nama, email, dan kata sandi (min. 8 karakter)." };
  }
  if (confirm && password !== confirm) {
    return { error: "Konfirmasi kata sandi tidak cocok." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/login`,
      data: { full_name: fullName, student_no: studentNo || null, role: "student" },
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is required, there is no session yet.
  if (!data.session) {
    return {
      message:
        "Akun dibuat. Cek email kamu untuk tautan konfirmasi sebelum masuk.",
    };
  }
  redirect("/dashboard");
}

// ---- Logout ----------------------------------------------------------------
export async function logout(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

// ---- Forgot password (neutral response — no account enumeration) -----------
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = str(formData, "email");
  if (!email) return { error: "Masukkan email kamu." };

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await siteOrigin()}/reset-password`,
    });
  }
  return {
    message:
      "Jika email terdaftar, kami telah mengirim tautan atur ulang kata sandi.",
  };
}

// ---- Reset password (from the email link's session) ------------------------
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = str(formData, "password");
  const confirm = str(formData, "confirm");

  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };
  if (password !== confirm) return { error: "Konfirmasi kata sandi tidak cocok." };

  if (!isSupabaseConfigured) redirect("/login"); // mock mode

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/login");
}
