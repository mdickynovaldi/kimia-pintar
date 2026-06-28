"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";

// Admin content + enrollment mutations. Every action re-checks admin (defense in
// depth on top of RLS, which already restricts writes to is_admin()). Writes use
// the RLS-scoped client — the admin session satisfies the policies.

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function str(fd: FormData, k: string): string {
  return (fd.get(k) ?? "").toString().trim();
}
function bool(fd: FormData, k: string): boolean {
  const v = str(fd, k).toLowerCase();
  return v === "on" || v === "true" || v === "1";
}

/** Extract a Google Drive file id from a share URL or raw id. */
function driveFileId(input: string): string | null {
  if (!input) return null;
  const m =
    input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(input)) return input;
  return null;
}

// ---- Courses ---------------------------------------------------------------

export async function createCourse(fd: FormData): Promise<void> {
  await requireAdmin();
  const title = str(fd, "title") || "Mata Kuliah Baru";
  const supabase = await createClient();
  const slug = slugify(title) || `kursus-${Date.now()}`;
  const code = (str(fd, "code") || slug).toUpperCase();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      title,
      slug,
      code,
      description: str(fd, "description") || null,
      color: str(fd, "color") || "oklch(55% 0.12 178)",
      is_published: bool(fd, "is_published"),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${data.id}`);
}

export async function updateCourse(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    title: str(fd, "title"),
    description: str(fd, "description") || null,
    color: str(fd, "color") || undefined,
    is_published: bool(fd, "is_published"),
  };
  if (str(fd, "code")) patch.code = str(fd, "code").toUpperCase();
  const { error } = await supabase.from("courses").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/admin/courses");
}

export async function deleteCourse(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

// ---- Meetings --------------------------------------------------------------

export async function createMeeting(fd: FormData): Promise<void> {
  await requireAdmin();
  const courseId = str(fd, "course_id");
  if (!courseId) return;
  const title = str(fd, "title") || "Pertemuan Baru";
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("meetings")
    .select("sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const order = ((last?.sort_order as number) ?? 0) + 1;
  const baseSlug = slugify(title) || `pertemuan-${order}`;
  const { error } = await supabase.from("meetings").insert({
    course_id: courseId,
    title,
    slug: `${baseSlug}-${order}`,
    sort_order: order,
    is_published: bool(fd, "is_published"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateMeeting(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  const courseId = str(fd, "course_id");
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({
      title: str(fd, "title"),
      description: str(fd, "description") || null,
      is_published: bool(fd, "is_published"),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (courseId) revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/admin/courses`, "layout");
}

export async function deleteMeeting(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  const courseId = str(fd, "course_id");
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (courseId) revalidatePath(`/admin/courses/${courseId}`);
}

// ---- Materials -------------------------------------------------------------

export async function saveMaterial(fd: FormData): Promise<void> {
  await requireAdmin();
  const meetingId = str(fd, "meeting_id");
  const materialId = str(fd, "material_id");
  if (!meetingId) return;
  const supabase = await createClient();
  const row = {
    meeting_id: meetingId,
    title: str(fd, "title") || "Materi",
    body: str(fd, "body"),
  };
  const { error } = materialId
    ? await supabase.from("materials").update(row).eq("id", materialId)
    : await supabase.from("materials").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses`, "layout");
}

// ---- Videos ----------------------------------------------------------------

export async function saveVideo(fd: FormData): Promise<void> {
  await requireAdmin();
  const meetingId = str(fd, "meeting_id");
  const videoId = str(fd, "video_id");
  if (!meetingId) return;
  const supabase = await createClient();
  const source = str(fd, "source_url");
  const row = {
    meeting_id: meetingId,
    title: str(fd, "title") || "Video pembelajaran",
    provider: "google_drive",
    source_url: source,
    drive_file_id: driveFileId(source),
  };
  const { error } = videoId
    ? await supabase.from("videos").update(row).eq("id", videoId)
    : await supabase.from("videos").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses`, "layout");
}

// ---- Enrollments -----------------------------------------------------------

/** Bulk-set which students are enrolled in a course (checkbox list). */
export async function saveEnrollments(fd: FormData): Promise<void> {
  await requireAdmin();
  const courseId = str(fd, "course_id");
  if (!courseId) return;
  const studentIds = fd.getAll("student_id").map((s) => s.toString());
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("course_id", courseId);
  const currentIds = new Set((current ?? []).map((r) => r.student_id as string));
  const nextIds = new Set(studentIds);

  const toAdd = studentIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

  if (toAdd.length) {
    await supabase.from("enrollments").insert(
      toAdd.map((student_id) => ({ course_id: courseId, student_id, status: "active" })),
    );
  }
  if (toRemove.length) {
    await supabase
      .from("enrollments")
      .delete()
      .eq("course_id", courseId)
      .in("student_id", toRemove);
  }
  revalidatePath("/admin/enrollments");
}

// ---- Platform settings -----------------------------------------------------

export async function saveSettings(fd: FormData): Promise<void> {
  await requireAdmin();
  const num = (k: string, d: number) => {
    const v = str(fd, k);
    const n = Number(v);
    return v === "" || !Number.isFinite(n) ? d : n;
  };
  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").upsert(
    {
      id: 1,
      site_name: str(fd, "site_name") || "Kimia Pintar",
      domain: str(fd, "domain") || "kimiapintar.com",
      locale: str(fd, "locale") || "id",
      allow_registration: bool(fd, "allow_registration"),
      require_admin_approval: bool(fd, "require_admin_approval"),
      default_passing_score: num("default_passing_score", 60),
      default_grading_method: str(fd, "default_grading_method") || "highest",
      default_show_answers: str(fd, "default_show_answers") || "after_submit",
      show_score_immediately: bool(fd, "show_score_immediately"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  // Table may not exist yet (migration 0004 not applied) — ignore gracefully.
  // PostgREST reports this as PGRST205 ("schema cache") or Postgres 42P01.
  const missingTable =
    !!error &&
    (error.code === "PGRST205" ||
      error.code === "42P01" ||
      /app_settings/i.test(error.message ?? ""));
  if (error && !missingTable) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/settings");
}
