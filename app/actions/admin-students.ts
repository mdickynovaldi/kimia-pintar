"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/dal";
import { hasServiceRole, isSupabaseConfigured } from "@/lib/supabase/env";

export type StudentActionState = { error?: string; message?: string } | undefined;

function str(fd: FormData, k: string): string {
  return (fd.get(k) ?? "").toString().trim();
}

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Invite/create a student. Creates the auth user via the Admin API (the
 * handle_new_user trigger makes the profile; `invited: true` keeps the account
 * active even in approval mode), optionally enrolls them, and emails a
 * set-password link through the /auth/confirm callback. Requires the
 * service-role key. Every step's error is surfaced — no silent "sent" lies.
 */
export async function createStudent(
  _prev: StudentActionState,
  fd: FormData,
): Promise<StudentActionState> {
  await requireAdmin();
  const email = str(fd, "email");
  const fullName = str(fd, "full_name");
  const studentNo = str(fd, "student_no");
  const courseId = str(fd, "course_id");

  if (!email || !fullName) {
    return { error: "Nama dan email wajib diisi." };
  }
  if (!hasServiceRole) {
    return { error: "Butuh service-role key untuk membuat akun siswa." };
  }

  const admin = createAdminClient();
  // Cryptographically random throwaway — the student sets their own password
  // via the invite link, this value is never shown to anyone.
  const tempPassword = `kp-${randomBytes(24).toString("base64url")}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    // full_name/student_no are non-privileged (user_metadata). role + invited go
    // in app_metadata — the ONLY channel handle_new_user trusts (self-signup
    // can't set it), so invited students land active without granting a way in.
    user_metadata: { full_name: fullName, student_no: studentNo || null },
    app_metadata: { role: "student", invited: "true" },
  });
  if (error) return { error: error.message };

  const { error: profileErr } = await admin
    .from("profiles")
    .update({ full_name: fullName, student_no: studentNo || null, role: "student" })
    .eq("id", data.user.id);
  if (profileErr) {
    return { error: `Akun dibuat, tetapi profil gagal disimpan: ${profileErr.message}` };
  }

  if (courseId) {
    const { error: enrollErr } = await admin.from("enrollments").upsert(
      { course_id: courseId, student_id: data.user.id, status: "active" },
      { onConflict: "course_id,student_id" },
    );
    if (enrollErr) {
      return {
        error: `Akun dibuat, tetapi pendaftaran kursus gagal: ${enrollErr.message}`,
      };
    }
  }

  // Build a set-password link the /auth/confirm callback can actually consume.
  // resetPasswordForEmail on the admin (implicit-flow) client would send a link
  // whose tokens arrive in the URL *fragment*, which the route handler can't
  // read → dead link. generateLink gives us a token_hash we route through
  // verifyOtp instead. It does NOT send an email, so we return the link for the
  // admin to share (works without any SMTP/template configuration).
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  revalidatePath("/admin/students");
  if (linkErr || !link?.properties?.hashed_token) {
    return {
      message: `Akun ${email} dibuat. Minta siswa memakai "Lupa sandi" di halaman masuk untuk mengatur kata sandi.`,
    };
  }
  const origin = await siteOrigin();
  const setupUrl = `${origin}/auth/confirm?token_hash=${link.properties.hashed_token}&type=recovery&next=/reset-password`;
  return {
    message: `Akun ${email} dibuat. Bagikan tautan atur kata sandi ini ke siswa (berlaku terbatas): ${setupUrl}`,
  };
}

export async function setStudentActive(fd: FormData): Promise<void> {
  await requireAdmin();
  if (!isSupabaseConfigured) return; // mock mode no-op
  const studentId = (fd.get("student_id") ?? "").toString();
  const active = (fd.get("is_active") ?? "").toString() === "true";
  if (!studentId) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_active: active }).eq("id", studentId);
  revalidatePath("/admin/students");
}
