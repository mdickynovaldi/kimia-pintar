import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getAttempt } from "@/lib/data";

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
  .ans-row { display: flex; gap: 8px; font-size: 13.5px; padding: 6px 0; align-items: baseline; }
  .ans-row .lbl { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .03em; text-transform: uppercase; color: var(--faint); width: 96px; flex: none; }
  .ans-row .val { color: var(--fg); }
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
  const { attemptId } = await params;
  const attempt = await getAttempt(attemptId);
  if (!attempt) notFound();
  const pct = attempt.percentage ?? 0;

  return (
    <AppShell
      variant="student"
      contentClassName="narrow"
      crumb={
        <>
          Kimia Dasar / Pertemuan 4 / <b>Hasil</b>
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
            background: `radial-gradient(closest-side, var(--surface) 78%, transparent 79%), conic-gradient(var(--accent) 0 ${pct}%, var(--surface-3) ${pct}%)`,
          }}
        >
          <div>
            <div className="big">{attempt.score}</div>
            <div className="max">/ {attempt.maxScore}</div>
          </div>
        </div>
        <div>
          <div className="row gap-sm" style={{ marginBottom: "6px" }}>
            <span className="eyebrow">Kuis Pertemuan 4 — Termokimia</span>
            {attempt.passed ? (
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
          <h1 style={{ marginBottom: "2px" }}>Kerja bagus, Emmil!</h1>
          <p className="muted" style={{ fontSize: "13.5px" }}>
            Nilai kamu melampaui ambang lulus 60%.
          </p>
          <div className="metrics">
            <div className="m">
              <div className="mk">Persentase</div>
              <div className="mv mono">{pct}%</div>
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
              <div className="mv">{attempt.attemptNumber} dari 1</div>
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
              Kebijakan jawaban: jawaban benar ditampilkan setelah submit (
              <i>after_submit</i>). Nilai tercatat:{" "}
              <b style={{ color: "var(--fg)" }}>{attempt.score} (tertinggi)</b>.
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
              {r.isCorrect ? (
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
              <span className={`val ${r.isCorrect ? "right" : "wrong"}`}>
                {r.given}
              </span>
            </div>
            <div className="ans-row">
              <span className="lbl">Kunci</span>
              <span className={`val${r.isCorrect ? "" : " right"}`}>
                {r.correct}
              </span>
            </div>
            {r.explanation ? (
              <div className="explain">
                <b>Pembahasan:</b> {r.explanation}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="row wrap" style={{ marginTop: "24px" }}>
        <Link className="btn" href="/courses/kimia-dasar/termokimia">
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
