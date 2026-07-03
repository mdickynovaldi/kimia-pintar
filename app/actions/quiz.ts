"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/auth/dal";

/**
 * Start (or resume) a quiz attempt. If the student has an in-progress attempt
 * that hasn't passed its deadline, resume that one; otherwise call the
 * server-authoritative `start_quiz_attempt` RPC (validates window + attempt
 * count, sets the deadline). Redirects to the player with the real attempt id.
 */
export async function startQuiz(formData: FormData): Promise<void> {
  const quizId = (formData.get("quizId") ?? "").toString();
  if (!quizId) redirect("/dashboard");

  if (!isSupabaseConfigured) {
    redirect(`/quiz/${quizId}/attempt/att-1`); // mock mode
  }

  const supabase = await createClient();
  const user = await getSessionUser();

  // Resume an existing, still-open in-progress attempt.
  if (user) {
    const { data: open } = await supabase
      .from("quiz_attempts")
      .select("id, deadline_at")
      .eq("quiz_id", quizId)
      .eq("student_id", user.id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (open) {
      const alive =
        !open.deadline_at || new Date(open.deadline_at as string) > new Date();
      if (alive) redirect(`/quiz/${quizId}/attempt/${open.id}`);
    }
  }

  const { data, error } = await supabase.rpc("start_quiz_attempt", {
    p_quiz: quizId,
  });

  if (error || !data) {
    redirect(`/quiz/${quizId}?error=start`);
  }
  redirect(`/quiz/${quizId}/attempt/${data}`);
}
