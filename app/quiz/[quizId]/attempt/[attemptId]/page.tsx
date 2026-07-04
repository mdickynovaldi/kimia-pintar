import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { getAttemptState, getQuiz, getSanitizedQuestions } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Pengerjaan Kuis" };

const quizStyles = `
  .quiz-shell { min-height: 100vh; display: flex; flex-direction: column; }
  .quiz-bar {
    position: sticky; top: 0; z-index: 30;
    display: flex; align-items: center; gap: 14px;
    height: var(--topbar-h); padding: 0 clamp(14px, 3vw, 28px);
    background: color-mix(in oklch, var(--bg) 85%, transparent);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }
  .quiz-bar .qtitle { font-family: var(--font-display); font-weight: 700; color: var(--fg-strong); font-size: 14.5px; letter-spacing: -.01em; }
  .quiz-bar .qtitle small { display: block; font-family: var(--font-mono); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
  .quiz-bar .spacer { flex: 1; }
  .timer {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 12px; border-radius: 999px;
    border: 1px solid var(--border-2); background: var(--surface);
    font-size: 15px; font-weight: 600; color: var(--fg-strong);
  }
  .timer svg { width: 16px; height: 16px; color: var(--accent-ink); }
  .timer .mono.warn { color: var(--warn); }
  .timer.warn-state { border-color: var(--warn); background: var(--warn-soft); }
  .timer .mono.over { color: var(--danger); }
  .timer.over-state { border-color: var(--danger); background: var(--danger-soft); }
  .save-ind { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--success); font-weight: 600; }
  .save-ind svg { width: 15px; height: 15px; }
  .exit-link { font-size: 13px; color: var(--muted); display: inline-flex; align-items: center; gap: 5px; }
  .exit-link svg { width: 15px; height: 15px; }
  .quiz-main { flex: 1; width: 100%; max-width: 760px; margin: 0 auto; padding: clamp(18px, 3vw, 32px); }
  .qhead { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .qnum { font-family: var(--font-mono); font-size: 12px; font-weight: 600; color: var(--muted); }
  .qprompt { font-family: var(--font-display); font-weight: 700; color: var(--fg-strong); font-size: 1.18rem; line-height: 1.35; margin-bottom: 4px; }
  .qnote { font-size: 12.5px; color: var(--muted); margin-bottom: 16px; }
  .opts { display: flex; flex-direction: column; gap: 10px; }
  .opt {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 15px; border: 1.5px solid var(--border-2); border-radius: var(--r);
    background: var(--surface); cursor: pointer; transition: border-color .12s, background .12s;
    font-size: 14.5px;
  }
  .opt:hover { border-color: var(--accent); background: var(--surface-2); }
  .opt input { width: 19px; height: 19px; flex: none; accent-color: var(--accent); margin: 0; }
  .opt:has(:checked) { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-ink); font-weight: 600; }
  .qnav { display: flex; flex-wrap: wrap; gap: 8px; margin: 28px 0 6px; }
  .qdot {
    width: 40px; height: 40px; flex: none; border-radius: var(--r-sm);
    border: 1.5px solid var(--border-2); background: var(--surface);
    color: var(--muted); font: 600 14px/1 var(--font-mono); cursor: pointer;
    display: grid; place-items: center; transition: all .12s;
  }
  .qdot:hover { border-color: var(--accent); }
  .qdot.answered { background: var(--accent-soft); color: var(--accent-ink); border-color: transparent; }
  .qdot.active { outline: 2px solid var(--accent); outline-offset: 2px; border-color: var(--accent); }
  .qfoot {
    position: sticky; bottom: 0;
    display: flex; align-items: center; gap: 12px;
    padding: 14px clamp(14px, 3vw, 28px);
    border-top: 1px solid var(--border);
    background: color-mix(in oklch, var(--bg) 88%, transparent);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  }
  .qfoot .qpos { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--muted); margin: 0 auto; }
  .formula { font-family: var(--font-mono); }
  @media (max-width: 480px) {
    .quiz-bar .save-ind span { display: none; }
    .qfoot .btn { flex: 1; }
    .qfoot .qpos { width: 100%; order: -1; text-align: center; margin: 0 0 4px; }
    .qfoot { flex-wrap: wrap; }
  }
`;

export default async function QuizAttemptPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>;
}) {
  const { quizId, attemptId } = await params;
  const quiz = await getQuiz(quizId);
  if (!quiz) notFound();

  // Attempt state: ownership (via RLS), status, server deadline, saved answers.
  const state = await getAttemptState(attemptId);
  if (!state) notFound();

  // Finalized (or timer-expired) attempts don't reopen the player.
  const expired =
    !!state.deadlineAt && new Date(state.deadlineAt) < new Date();
  if (state.status !== "in_progress" || expired) {
    redirect(`/quiz/${quizId}/result/${attemptId}`);
  }

  // Sanitized questions, shuffled per-attempt when the quiz asks for it.
  const questions = await getSanitizedQuestions(quizId, attemptId);

  return (
    <div className="quiz-shell">
      <style>{quizStyles}</style>
      <QuizPlayer
        questions={questions}
        quizTitle={quiz.title}
        resultHref={`/quiz/${quizId}/result/${attemptId}`}
        exitHref={`/courses/${quiz.courseSlug}/${quiz.meetingSlug}`}
        attemptId={isSupabaseConfigured ? attemptId : undefined}
        deadline={state.deadlineAt ?? undefined}
        initialAnswers={state.answers}
        allowBacktrack={quiz.allowBacktrack}
        questionsPerPage={quiz.questionsPerPage}
      />
    </div>
  );
}
