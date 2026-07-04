"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";
import type { QuestionType } from "@/lib/data/types";

function str(fd: FormData, k: string): string {
  return (fd.get(k) ?? "").toString().trim();
}
function numOrNull(fd: FormData, k: string): number | null {
  const v = str(fd, k);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function bool(fd: FormData, k: string): boolean {
  const v = str(fd, k).toLowerCase();
  return v === "on" || v === "true" || v === "1";
}
/** datetime-local input value → ISO. Values are entered in WIB (UTC+7) —
 * appended explicitly so the result doesn't depend on the server timezone. */
function tsOrNull(fd: FormData, k: string): string | null {
  const v = str(fd, k);
  if (!v) return null;
  const wib = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? `${v}:00+07:00` : v;
  const d = new Date(wib);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Create a (draft) quiz for a meeting, then open the builder. One quiz per
 * meeting: if one already exists we just open it. */
export async function createQuiz(fd: FormData): Promise<void> {
  await requireAdmin();
  const meetingId = str(fd, "meeting_id");
  if (!meetingId) redirect("/admin/courses");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("quizzes")
    .select("id")
    .eq("meeting_id", meetingId)
    .maybeSingle();
  if (existing) redirect(`/admin/quizzes/${existing.id}`);

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, course_id, title, sort_order")
    .eq("id", meetingId)
    .maybeSingle();
  if (!meeting) throw new Error("Pertemuan tidak ditemukan.");

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      meeting_id: meetingId,
      course_id: meeting.course_id,
      title: `Kuis Pertemuan ${meeting.sort_order} — ${meeting.title}`,
      is_published: false,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/courses/${meeting.course_id}/meetings/${meetingId}`);
  redirect(`/admin/quizzes/${data.id}`);
}

export async function updateQuizSettings(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "quiz_id");
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("quizzes")
    .update({
      title: str(fd, "title"),
      description: str(fd, "description") || null,
      time_limit_minutes: numOrNull(fd, "time_limit_minutes"),
      max_attempts: numOrNull(fd, "max_attempts"),
      passing_score: numOrNull(fd, "passing_score") ?? 60,
      grading_method: str(fd, "grading_method") || "highest",
      show_correct_answers: str(fd, "show_correct_answers") || "after_submit",
      questions_per_page: numOrNull(fd, "questions_per_page") ?? 1,
      shuffle_questions: bool(fd, "shuffle_questions"),
      shuffle_options: bool(fd, "shuffle_options"),
      show_score_immediately: bool(fd, "show_score_immediately"),
      allow_backtrack: bool(fd, "allow_backtrack"),
      available_from: tsOrNull(fd, "available_from"),
      available_until: tsOrNull(fd, "available_until"),
      is_published: bool(fd, "is_published"),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/quizzes/${id}`);
}

/** Persist manual grades for an attempt's essay/manual questions and finalize
 * it (delegates scoring to the save_manual_grades RPC). */
export async function submitManualGrades(
  attemptId: string,
  grades: { questionId: string; points: number; feedback?: string | null }[],
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!attemptId) return { ok: false, error: "attemptId kosong" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_manual_grades", {
    p_attempt: attemptId,
    p_grades: grades.map((g) => ({
      question_id: g.questionId,
      points: g.points,
      feedback: g.feedback ?? null,
    })),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/grading");
  revalidatePath("/admin/gradebook");
  return { ok: true };
}

export interface QuestionInput {
  id?: string;
  type: QuestionType;
  prompt: string;
  points: number;
  explanation?: string;
  options: { id?: string; content: string; isCorrect: boolean }[];
}

/**
 * Full save of a quiz's questions. Diff-based: existing questions (by id) are
 * updated, new ones inserted, removed ones deleted. Options are replaced per
 * question (attempt_answers store option ids in an array, not an FK, so this is
 * safe). Returns {ok} for the client builder.
 */
export async function saveQuizQuestions(
  quizId: string,
  questions: QuestionInput[],
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!quizId) return { ok: false, error: "quizId kosong" };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("questions")
    .select("id")
    .eq("quiz_id", quizId);
  const existingIds = new Set((existing ?? []).map((q) => q.id as string));
  const keptIds = new Set<string>();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const row = {
      quiz_id: quizId,
      type: q.type,
      prompt: q.prompt || "Pertanyaan",
      points: Number.isFinite(q.points) ? q.points : 1,
      explanation: q.explanation || null,
      sort_order: i + 1,
    };

    let questionId = q.id && existingIds.has(q.id) ? q.id : undefined;
    if (questionId) {
      const { error } = await supabase.from("questions").update(row).eq("id", questionId);
      if (error) return { ok: false, error: error.message };
    } else {
      const { data, error } = await supabase
        .from("questions")
        .insert(row)
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      questionId = data.id as string;
    }
    keptIds.add(questionId);

    // Diff options by id (update existing, insert new, delete removed) so option
    // ids are preserved — past attempts store selected option ids in an array.
    const { data: existingOpts } = await supabase
      .from("question_options")
      .select("id")
      .eq("question_id", questionId);
    const existingOptIds = new Set((existingOpts ?? []).map((o) => o.id as string));
    const keptOptIds = new Set<string>();
    for (let idx = 0; idx < q.options.length; idx++) {
      const o = q.options[idx];
      const orow = {
        question_id: questionId,
        content: o.content || `Pilihan ${idx + 1}`,
        is_correct: !!o.isCorrect,
        sort_order: idx + 1,
      };
      if (o.id && existingOptIds.has(o.id)) {
        const { error: e } = await supabase.from("question_options").update(orow).eq("id", o.id);
        if (e) return { ok: false, error: e.message };
        keptOptIds.add(o.id);
      } else {
        const { error: e } = await supabase.from("question_options").insert(orow);
        if (e) return { ok: false, error: e.message };
      }
    }
    const optsToDelete = [...existingOptIds].filter((id) => !keptOptIds.has(id));
    if (optsToDelete.length) {
      await supabase.from("question_options").delete().in("id", optsToDelete);
    }
  }

  // Delete questions removed in the editor.
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length) {
    await supabase.from("questions").delete().in("id", toDelete);
  }

  revalidatePath(`/admin/quizzes/${quizId}`);
  return { ok: true };
}
