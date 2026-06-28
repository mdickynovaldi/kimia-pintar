import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Finalize + grade an attempt. Records time spent, marks it submitted, then runs
// the server-side `grade_attempt` RPC (objective questions graded with the
// answer keys the student never sees). RLS scopes everything to the owner.
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("started_at, status")
    .eq("id", id)
    .maybeSingle();

  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (attempt.status === "in_progress") {
    const startedMs = new Date(attempt.started_at as string).getTime();
    const timeSpent = Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
    await supabase
      .from("quiz_attempts")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        time_spent_seconds: timeSpent,
      })
      .eq("id", id);
  }

  const { error } = await supabase.rpc("grade_attempt", { p_attempt: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
