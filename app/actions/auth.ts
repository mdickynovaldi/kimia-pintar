"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole, isSupabaseConfigured } from "@/lib/supabase/env";

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

  // Unchecked "Ingat saya" → session cookies that clear on browser close. The
  // marker cookie lets the proxy keep them session-only across token refreshes.
  const cookieStore = await cookies();
  if (remember) cookieStore.delete("kp-remember");
  else cookieStore.set("kp-remember", "0", { httpOnly: true, sameSite: "lax", path: "/" });
  const supabase = await createClient({ persistSession: remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/not confirmed/i.test(error.message)) {
      return {
        error:
          "Email kamu belum dikonfirmasi. Cek kotak masuk untuk tautan konfirmasi.",
      };
    }
    return { error: "Email atau kata sandi salah." };
  }

  // Deactivated / not-yet-approved accounts may not enter.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let dest = next || "/dashboard";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();
    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return {
        error:
          "Akun kamu belum aktif — menunggu persetujuan admin atau telah dinonaktifkan.",
      };
    }
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

  // Platform settings gate self-registration. app_settings is only readable by
  // signed-in users, so read with the service client (defaults apply if absent).
  let allowRegistration = true;
  let requireApproval = false;
  if (hasServiceRole) {
    const admin = createAdminClient();
    const { data: settings } = await admin
      .from("app_settings")
      .select("allow_registration, require_admin_approval")
      .eq("id", 1)
      .maybeSingle();
    if (settings) {
      allowRegistration = settings.allow_registration;
      requireApproval = settings.require_admin_approval;
    }
  }
  if (!allowRegistration) {
    return {
      error:
        "Registrasi mandiri sedang ditutup. Hubungi admin untuk dibuatkan akun.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=/login`,
      data: { full_name: fullName, student_no: studentNo || null, role: "student" },
    },
  });
  if (error) return { error: error.message };

  // Approval mode: the handle_new_user trigger creates the profile inactive;
  // the account can't log in until an admin activates it.
  if (requireApproval) {
    if (data.session) await supabase.auth.signOut();
    return {
      message:
        "Akun dibuat dan menunggu persetujuan admin. Kamu akan bisa masuk setelah disetujui.",
    };
  }

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
      // Land on the PKCE callback first — it exchanges the one-time code for a
      // session, then forwards to the reset form.
      redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
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
