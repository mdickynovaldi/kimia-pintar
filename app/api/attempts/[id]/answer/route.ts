import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Autosave a single answer. RLS ensures only the attempt owner can write. The
// server rejects writes after the deadline or once the attempt is closed.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    questionId?: string;
    selectedOptionIds?: string[];
    answerText?: string | null;
  } | null;

  if (!body?.questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("status, deadline_at")
    .eq("id", id)
    .maybeSingle();

  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ error: "closed" }, { status: 409 });
  }
  if (attempt.deadline_at && new Date(attempt.deadline_at) < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 409 });
  }

  // NB: an upsert with onConflict would emit INSERT ... ON CONFLICT DO UPDATE
  // SET including the conflict-target columns (attempt_id/question_id). Students
  // only hold column-level UPDATE grants on the value columns (migration 0005),
  // so Postgres rejects assigning attempt_id/question_id → 403. Split into
  // UPDATE-then-INSERT so the UPDATE never touches the identity columns.
  const now = new Date().toISOString();
  const values = {
    selected_option_ids: body.selectedOptionIds ?? [],
    answer_text: body.answerText ?? null,
    answered_at: now,
  };

  const { data: updated, error: upErr } = await supabase
    .from("attempt_answers")
    .update(values)
    .eq("attempt_id", id)
    .eq("question_id", body.questionId)
    .select("id");
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  if (!updated || updated.length === 0) {
    const { error: insErr } = await supabase.from("attempt_answers").insert({
      attempt_id: id,
      question_id: body.questionId,
      ...values,
    });
    // A concurrent first-save may have inserted between our UPDATE and INSERT;
    // treat the unique-violation as success (the row now exists with a value).
    if (insErr && insErr.code !== "23505") {
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
