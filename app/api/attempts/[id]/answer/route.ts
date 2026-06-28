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

  const { error } = await supabase.from("attempt_answers").upsert(
    {
      attempt_id: id,
      question_id: body.questionId,
      selected_option_ids: body.selectedOptionIds ?? [],
      answer_text: body.answerText ?? null,
    },
    { onConflict: "attempt_id,question_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
