"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Start (or resume) a quiz attempt. Calls the server-authoritative
 * `start_quiz_attempt` RPC which validates the window + attempt count and sets
 * the deadline, then routes to the player with the real attempt id.
 */
export async function startQuiz(formData: FormData): Promise<void> {
  const quizId = (formData.get("quizId") ?? "").toString();
  if (!quizId) redirect("/dashboard");

  if (!isSupabaseConfigured) {
    redirect(`/quiz/${quizId}/attempt/att-1`); // mock mode
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_quiz_attempt", {
    p_quiz: quizId,
  });

  if (error || !data) {
    redirect(`/quiz/${quizId}?error=start`);
  }
  redirect(`/quiz/${quizId}/attempt/${data}`);
}
