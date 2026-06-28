import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";

// Finalize + grade an attempt, server-authoritatively. Ownership is verified via
// the RLS-scoped client (a student can only read their own attempt); the actual
// finalization writes use the service-role client because attempts are
// admin-update-only under RLS and answer keys are admin-only — students must
// never be able to set their own score. Objective questions are graded
// all-or-nothing against the keys the student never sees.
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, started_at, status")
    .eq("id", id)
    .maybeSingle();

  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (attempt.status === "graded" || attempt.status === "awaiting_manual_grade") {
    return NextResponse.json({ ok: true, already: true });
  }
  if (!hasServiceRole) {
    return NextResponse.json(
      { error: "Grading requires the service-role key (server)." },
      { status: 500 },
    );
  }

  const admin = createAdminClient();

  const [{ data: quiz }, { data: questions }, { data: answers }] =
    await Promise.all([
      admin.from("quizzes").select("passing_score").eq("id", attempt.quiz_id).single(),
      admin
        .from("questions")
        .select("id, type, points, question_options(id, is_correct)")
        .eq("quiz_id", attempt.quiz_id),
      admin
        .from("attempt_answers")
        .select("question_id, selected_option_ids, answer_text")
        .eq("attempt_id", id),
    ]);

  const selByQ = new Map<string, string[]>(
    (answers ?? []).map((a) => [
      a.question_id as string,
      ((a.selected_option_ids as string[] | null) ?? []).slice().sort(),
    ]),
  );

  let score = 0;
  let max = 0;
  let needsManual = false;

  for (const q of questions ?? []) {
    const points = Number(q.points ?? 1);
    max += points;
    if (q.type === "essay") {
      needsManual = true;
      continue;
    }
    const correct = (q.question_options as Array<{ id: string; is_correct: boolean }>)
      .filter((o) => o.is_correct)
      .map((o) => o.id)
      .sort();
    const sel = selByQ.get(q.id as string) ?? [];
    const ok =
      correct.length === sel.length && correct.every((v, i) => v === sel[i]);
    await admin
      .from("attempt_answers")
      .update({ is_correct: ok, points_awarded: ok ? points : 0 })
      .eq("attempt_id", id)
      .eq("question_id", q.id as string);
    if (ok) score += points;
  }

  const pct = max > 0 ? Math.round((score / max) * 10000) / 100 : 0;
  const startedMs = new Date(attempt.started_at as string).getTime();
  const timeSpent = Math.max(0, Math.floor((Date.now() - startedMs) / 1000));

  await admin
    .from("quiz_attempts")
    .update({
      status: needsManual ? "awaiting_manual_grade" : "graded",
      score,
      max_score: max,
      percentage: pct,
      passed: max > 0 ? pct >= Number(quiz?.passing_score ?? 60) : false,
      submitted_at: new Date().toISOString(),
      time_spent_seconds: timeSpent,
    })
    .eq("id", id);

  return NextResponse.json({ ok: true, score, max, percentage: pct });
}
