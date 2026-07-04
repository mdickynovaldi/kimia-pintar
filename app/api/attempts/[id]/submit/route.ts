import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Finalize + grade an attempt. All grading now lives in ONE place: the
// grade_attempt RPC (SECURITY DEFINER, supabase/migrations/0005). It handles
// objective set-equality (an empty key never awards points), short_answer
// text-matching, essays → awaiting_manual_grade with percentage/passed left
// NULL, and it backfills answer rows for unanswered questions so the review is
// complete. Ownership is enforced by the RPC (student_id = auth.uid()).
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ ok: true, already: true });
  }

  const { error } = await supabase.rpc("grade_attempt", { p_attempt: id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: graded } = await supabase
    .from("quiz_attempts")
    .select("score, max_score, percentage, status")
    .eq("id", id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    score: graded?.score ?? null,
    max: graded?.max_score ?? null,
    percentage: graded?.percentage ?? null,
    status: graded?.status ?? "graded",
  });
}
