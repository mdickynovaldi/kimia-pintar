"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/dal";
import { hasServiceRole, isSupabaseConfigured } from "@/lib/supabase/env";

export type StudentActionState = { error?: string; message?: string } | undefined;

function str(fd: FormData, k: string): string {
  return (fd.get(k) ?? "").toString().trim();
}

/**
 * Invite/create a student. Creates the auth user via the Admin API (the
 * handle_new_user trigger makes the profile), optionally enrolls them, and emails
 * a confirmation link. Requires the service-role key.
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
  const tempPassword = `kp-${Math.abs(hash(email + fullName))}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: false,
    user_metadata: { full_name: fullName, student_no: studentNo || null, role: "student" },
  });
  if (error) return { error: error.message };

  await admin
    .from("profiles")
    .update({ full_name: fullName, student_no: studentNo || null, role: "student" })
    .eq("id", data.user.id);

  if (courseId) {
    await admin.from("enrollments").upsert(
      { course_id: courseId, student_id: data.user.id, status: "active" },
      { onConflict: "course_id,student_id" },
    );
  }

  // Send an invite/confirmation email so they can set their password.
  await admin.auth.resetPasswordForEmail(email);

  revalidatePath("/admin/students");
  return { message: `Undangan dikirim ke ${email}.` };
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

// tiny deterministic hash for a temp password seed (not security-sensitive;
// the student resets via the email link anyway)
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h | 0;
}
