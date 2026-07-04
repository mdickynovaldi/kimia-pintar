import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  getAttempt,
  getAttemptState,
  getAttemptStats,
  getCourse,
  getMeeting,
  getQuiz,
} from "@/lib/data";
import type { GradingMethod } from "@/lib/data";

export const metadata: Metadata = { title: "Hasil Kuis" };

const GRADING_METHOD_LABELS: Record<GradingMethod, string> = {
  highest: "tertinggi",
  latest: "terakhir",
  average: "rata-rata",
  first: "pertama",
};

const POLICY_NOTES: Record<string, string> = {
  after_submit: "jawaban benar ditampilkan setelah submit",
  after_close: "jawaban benar ditampilkan setelah kuis ditutup",
  never: "kunci jawaban tidak ditampilkan untuk kuis ini",
};

const pageStyles = `
  .hero { display: grid; grid-template-columns: auto 1fr; gap: clamp(18px, 4vw, 36px); align-items: center; }
  .score-ring {
    width: 132px; height: 132px; flex: none; border-radius: 50%;
    display: grid; place-items: center; text-align: center;
    background: radial-gradient(closest-side, var(--surface) 78%, transparent 79%),
                conic-gradient(var(--accent) 0 80%, var(--surface-3) 80%);
  }
  .score-ring .big { font-family: var(--font-mono); font-size: 2.4rem; font-weight: 700; color: var(--fg-strong); line-height: 1; }
  .score-ring .max { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }
  .hero .metrics { display: flex; flex-wrap: wrap; gap: 22px; margin: 14px 0 16px; }
  .hero .metrics .m .mk { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
  .hero .metrics .m .mv { font-weight: 700; color: var(--fg-strong); font-size: 1.05rem; }
  .note-line { display: flex; gap: 9px; align-items: flex-start; font-size: 13px; color: var(--muted); margin-top: 4px; }
  .note-line svg { width: 16px; height: 16px; flex: none; margin-top: 2px; color: var(--accent-ink); }

  .rev { padding: 18px 20px; }
  .rev .rtop { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
  .rev .rnum { font-family: var(--font-mono); font-size: 11.5px; font-weight: 600; color: var(--muted); white-space: nowrap; padding-top: 2px; }
  .rev .rprompt { font-family: var(--font-display); font-weight: 700; color: var(--fg-strong); font-size: 1rem; line-height: 1.4; flex: 1; }
  .rev .mark { width: 26px; height: 26px; flex: none; border-radius: 50%; display: grid; place-items: center; color: #fff; }
  .rev .mark svg { width: 15px; height: 15px; }
  .rev .mark.ok { background: var(--success); }
  .rev .mark.no { background: var(--danger); }
  .rev .mark.pend { background: var(--warn); }
  .ans-row { display: flex; gap: 8px; font-size: 13.5px; padding: 6px 0; align-items: baseline; }
  .ans-row .lbl { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .03em; text-transform: uppercase; color: var(--faint); width: 96px; flex: none; }
  .ans-row .val { color: var(--fg); white-space: pre-wrap; }
  .ans-row .val.wrong { color: var(--danger); }
  .ans-row .val.right { color: var(--success); font-weight: 600; }
  .explain { margin-top: 10px; padding: 11px 13px; border-radius: var(--r-sm); background: var(--surface-2); font-size: 13px; color: var(--muted); }
  .explain b { color: var(--fg); font-weight: 600; }
  .formula { font-family: var(--font-mono); }
  @media (max-width: 560px) {
    .hero { grid-template-columns: 1fr; justify-items: center; text-align: center; }
    .hero .metrics { justify-content: center; }
    .ans-row { flex-direction: column; gap: 2px; }
    .ans-row .lbl { width: auto; }
  }
`;

export default async function QuizResultPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>;
}) {
  const { quizId, attemptId } = await params;
  const [initialAttempt, quiz] = await Promise.all([
    getAttempt(attemptId),
    getQuiz(quizId),
  ]);
  let attempt = initialAttempt;
  if (!attempt || !quiz) notFound();

  // An attempt that is still open has no result yet.
  if (attempt.status === "in_progress") {
    const state = await getAttemptState(attemptId);
    const expired =
      !!state?.deadlineAt && new Date(state.deadlineAt) < new Date();
    if (!expired) redirect(`/quiz/${quizId}/attempt/${attemptId}`);
    // Timer ran out: finalize (grades what was saved) then re-read.
    await getAttemptStats(quizId);
    attempt = await getAttempt(attemptId);
    if (!attempt) notFound();
  }

  const [{ max: maxAttempts }, course, meeting] = await Promise.all([
    getAttemptStats(quizId),
    getCourse(quiz.courseSlug),
    getMeeting(quiz.courseSlug, quiz.meetingSlug),
  ]);

  const pending = attempt.status === "awaiting_manual_grade";
  const pct = attempt.percentage ?? 0;
  const gradingLabel = GRADING_METHOD_LABELS[quiz.gradingMethod];
  const policyNote =
    POLICY_NOTES[quiz.showCorrectAnswers] ?? POLICY_NOTES.after_submit;

  return (
    <AppShell
      variant="student"
      contentClassName="narrow"
      crumb={
        <>
          {course?.title ?? "Kursus"} / {meeting?.label ?? "Pertemuan"} /{" "}
          <b>Hasil</b>
        </>
      }
    >
      <style>{pageStyles}</style>

      {/* Hero */}
      <div className="card card-pad hero" style={{ marginBottom: "22px" }}>
        <div
          className="score-ring"
          aria-hidden="true"
          style={{
            background: `radial-gradient(closest-side, var(--surface) 78%, transparent 79%), conic-gradient(var(--accent) 0 ${pending ? 0 : pct}%, var(--surface-3) ${pending ? 0 : pct}%)`,
          }}
        >
          <div>
            <div className="big">{pending ? "…" : attempt.score}</div>
            <div className="max">/ {attempt.maxScore ?? "—"}</div>
          </div>
        </div>
        <div>
          <div className="row gap-sm" style={{ marginBottom: "6px" }}>
            <span className="eyebrow">{quiz.title}</span>
            {pending ? (
              <span className="badge warn">
                <span className="dot" />
                Menunggu penilaian
              </span>
            ) : attempt.passed ? (
              <span className="badge ok">
                <span className="dot" />
                Lulus
              </span>
            ) : (
              <span className="badge warn">
                <span className="dot" />
                Belum lulus
              </span>
            )}
          </div>
          <h1 style={{ marginBottom: "2px" }}>
            {pending
              ? "Jawaban terkirim!"
              : attempt.passed
                ? "Kerja bagus!"
                : "Belum lulus, coba lagi"}
          </h1>
          <p className="muted" style={{ fontSize: "13.5px" }}>
            {pending
              ? "Sebagian jawaban (esai) dinilai manual oleh pengajar. Nilai akhir muncul setelah penilaian selesai."
              : attempt.passed
                ? `Nilai kamu melampaui ambang lulus ${quiz.passingScore}%.`
                : `Nilai kamu di bawah ambang lulus ${quiz.passingScore}%.`}
          </p>
          <div className="metrics">
            <div className="m">
              <div className="mk">Persentase</div>
              <div className="mv mono">{pending ? "—" : `${pct}%`}</div>
            </div>
            <div className="m">
              <div className="mk">Jawaban benar</div>
              <div className="mv">
                {attempt.correctCount} dari {attempt.questionCount}
              </div>
            </div>
            <div className="m">
              <div className="mk">Waktu</div>
              <div className="mv mono">{attempt.timeSpentLabel}</div>
            </div>
            <div className="m">
              <div className="mk">Percobaan</div>
              <div className="mv">
                {attempt.attemptNumber} dari {maxAttempts ?? "∞"}
              </div>
            </div>
          </div>
          <div className="note-line">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
            <span>
              Kebijakan jawaban: {policyNote} (<i>{quiz.showCorrectAnswers}</i>
              ).{" "}
              {pending ? null : (
                <>
                  Nilai tercatat:{" "}
                  <b style={{ color: "var(--fg)" }}>
                    {attempt.score} ({gradingLabel})
                  </b>
                  .
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="row between" style={{ marginBottom: "14px" }}>
        <h2>Pembahasan jawaban</h2>
        <span className="badge accent">{attempt.review.length} soal ditinjau</span>
      </div>

      <div className="stack" style={{ gap: "14px" }}>
        {attempt.review.map((r, i) => (
          <div key={r.questionId} className="card rev">
            <div className="rtop">
              <span className="rnum">Soal {i + 1}</span>
              {r.promptHtml ? (
                <span
                  className="rprompt"
                  dangerouslySetInnerHTML={{ __html: r.promptHtml }}
                />
              ) : (
                <span className="rprompt">{r.prompt}</span>
              )}
              {r.pending ? (
                <span className="mark pend" title="Menunggu penilaian">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>
              ) : r.isCorrect ? (
                <span className="mark ok" title="Benar">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              ) : (
                <span className="mark no" title="Salah">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </span>
              )}
            </div>
            <div className="ans-row">
              <span className="lbl">Jawabanmu</span>
              <span
                className={`val ${r.pending ? "" : r.isCorrect ? "right" : "wrong"}`}
              >
                {r.given}
              </span>
            </div>
            {r.pending ? (
              <div className="ans-row">
                <span className="lbl">Status</span>
                <span className="val">Menunggu penilaian pengajar</span>
              </div>
            ) : (
              <div className="ans-row">
                <span className="lbl">Kunci</span>
                <span className={`val${r.isCorrect ? "" : " right"}`}>
                  {r.correct}
                </span>
              </div>
            )}
            {r.explanation ? (
              <div className="explain">
                <b>Pembahasan:</b> {r.explanation}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="row wrap" style={{ marginTop: "24px" }}>
        <Link
          className="btn"
          href={`/courses/${quiz.courseSlug}/${quiz.meetingSlug}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Kembali ke pertemuan
        </Link>
        <Link className="btn btn-primary" href="/me/results">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="M7 14l3-4 4 3 5-7" />
          </svg>
          Lihat semua nilai
        </Link>
      </div>
    </AppShell>
  );
}
