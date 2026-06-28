"use server";

import { revalidatePath } from "next/cache";
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
      is_published: bool(fd, "is_published"),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/quizzes/${id}`);
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
