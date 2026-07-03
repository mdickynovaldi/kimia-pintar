import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { startQuiz } from "@/app/actions/quiz";
import { getAttemptStats, getCourse, getMeeting, getQuiz } from "@/lib/data";

export const metadata: Metadata = { title: "Mulai Kuis" };

const quizIntroStyles = `
  .intro-card { text-align: center; padding: clamp(22px, 4vw, 40px); }
  .intro-icon {
    width: 64px; height: 64px; border-radius: var(--r-lg); margin: 0 auto 16px;
    display: grid; place-items: center; color: #fff;
    background: linear-gradient(140deg, var(--accent), var(--accent-2));
    box-shadow: var(--shadow-sm);
  }
  .intro-icon svg { width: 30px; height: 30px; }
  .rules { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: left; margin: 24px 0 4px; }
  .rule {
    display: flex; align-items: flex-start; gap: 11px;
    padding: 13px 14px; border: 1px solid var(--border); border-radius: var(--r); background: var(--surface-2);
  }
  .rule .ri {
    width: 34px; height: 34px; flex: none; border-radius: var(--r-sm);
    display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-ink);
  }
  .rule .ri svg { width: 18px; height: 18px; }
  .rule .rk { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
  .rule .rv { font-weight: 600; color: var(--fg-strong); font-size: 14px; line-height: 1.3; }
  .info-card {
    display: flex; gap: 12px; text-align: left; margin: 22px 0;
    padding: 14px 16px; border-radius: var(--r); border: 1px solid transparent;
    background: var(--warn-soft);
  }
  .info-card svg { width: 19px; height: 19px; flex: none; margin-top: 1px; color: oklch(50% 0.12 65); }
  :root[data-theme='dark'] .info-card svg { color: var(--warn); }
  .info-card p { font-size: 13.5px; color: var(--fg); }
  @media (max-width: 560px) { .rules { grid-template-columns: 1fr; } }
`;

const gradingMethodLabel: Record<string, string> = {
  highest: "Tertinggi",
  latest: "Terakhir",
  average: "Rata-rata",
  first: "Pertama",
};

const answersPolicyLabel: Record<string, string> = {
  after_submit: "Tampil setelah submit",
  after_close: "Setelah kuis ditutup",
  never: "Tidak ditampilkan",
};

export default async function QuizIntroPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { quizId } = await params;
  const { error } = await searchParams;
  const quiz = await getQuiz(quizId);
  if (!quiz) notFound();
  const [{ used, max }, course, meeting] = await Promise.all([
    getAttemptStats(quizId),
    getCourse(quiz.courseSlug),
    getMeeting(quiz.courseSlug, quiz.meetingSlug),
  ]);
  const attemptsExhausted = max !== null && used >= max;
  const remaining = max !== null ? Math.max(max - used, 0) : null;
  const courseTitle = course?.title ?? "Kursus";
  const meetingLabel = meeting?.label ?? "Pertemuan";

  return (
    <AppShell
      variant="student"
      contentClassName="narrow"
      crumb={
        <>
          {courseTitle} / {meetingLabel} / <b>Kuis</b>
        </>
      }
    >
      <style>{quizIntroStyles}</style>

      <div className="card intro-card">
        <div className="intro-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 11l3 3 8-8" />
            <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
          </svg>
        </div>
        <span className="eyebrow">
          {courseTitle} · {meetingLabel}
        </span>
        <h1 style={{ margin: "8px 0 6px" }}>{quiz.title}</h1>
        <p className="muted" style={{ margin: "0 auto", maxWidth: "48ch" }}>
          Baca aturan di bawah sebelum memulai. Pastikan koneksi stabil — waktu
          pengerjaan dimulai begitu kamu menekan &quot;Mulai Kuis&quot;.
        </p>

        <div className="rules">
          <div className="rule">
            <span className="ri">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div>
              <div className="rk">Durasi</div>
              <div className="rv">{quiz.timeLimitMinutes} menit</div>
            </div>
          </div>
          <div className="rule">
            <span className="ri">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </span>
            <div>
              <div className="rk">Jumlah soal</div>
              <div className="rv">{quiz.questions.length} soal</div>
            </div>
          </div>
          <div className="rule">
            <span className="ri">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9" />
                <path d="M3 3v6h6" />
              </svg>
            </span>
            <div>
              <div className="rk">Percobaan</div>
              <div className="rv">
                {max ?? "∞"} percobaan{" "}
                <span className="muted" style={{ fontWeight: 500 }}>
                  ({used}/{max ?? "∞"} terpakai)
                </span>
              </div>
            </div>
          </div>
          <div className="rule">
            <span className="ri">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <div className="rk">Nilai lulus</div>
              <div className="rv">{quiz.passingScore}%</div>
            </div>
          </div>
          <div className="rule">
            <span className="ri">
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
            </span>
            <div>
              <div className="rk">Metode nilai</div>
              <div className="rv">
                {gradingMethodLabel[quiz.gradingMethod] ?? "Tertinggi"}
              </div>
            </div>
          </div>
          <div className="rule">
            <span className="ri">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7M3 8V3h5M3 3l7 7M16 21h5v-5M21 21l-7-7" />
              </svg>
            </span>
            <div>
              <div className="rk">Urutan</div>
              <div className="rv">
                {quiz.shuffleQuestions ? "Soal diacak" : "Soal berurutan"}
              </div>
            </div>
          </div>
          <div className="rule">
            <span className="ri">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <div>
              <div className="rk">Jawaban benar</div>
              <div className="rv">
                {answersPolicyLabel[quiz.showCorrectAnswers] ??
                  "Tampil setelah submit"}
              </div>
            </div>
          </div>
          <div className="rule">
            <span className="ri">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 14L4 9l5-5" />
                <path d="M4 9h11a5 5 0 0 1 5 5v3" />
              </svg>
            </span>
            <div>
              <div className="rk">Navigasi</div>
              <div className="rv">
                {quiz.allowBacktrack
                  ? "Boleh kembali ke soal sebelumnya"
                  : "Tidak bisa kembali"}
              </div>
            </div>
          </div>
        </div>

        <div className="info-card">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          <p>
            Timer berjalan di server — menutup tab tidak menghentikan waktu.
            Jawaban tersimpan otomatis.
          </p>
        </div>

        <p
          className="muted"
          style={{ fontSize: "13px", marginBottom: "18px" }}
        >
          <b style={{ color: "var(--fg)" }}>
            Percobaan tersisa: {remaining ?? "∞"}
          </b>
        </p>

        {error === "start" ? (
          <p
            role="alert"
            className="badge danger"
            style={{ display: "flex", margin: "0 0 12px", width: "100%" }}
          >
            Kuis belum bisa dimulai — mungkin di luar jadwal atau percobaan
            sudah habis. Coba lagi nanti.
          </p>
        ) : null}

        <div className="stack" style={{ gap: "10px" }}>
          <form action={startQuiz}>
            <input type="hidden" name="quizId" value={quizId} />
            <button
              className="btn btn-primary btn-lg btn-block"
              type="submit"
              disabled={attemptsExhausted}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              {attemptsExhausted ? "Percobaan habis" : "Mulai Kuis"}
            </button>
          </form>
          <Link
            className="btn btn-block"
            href={`/courses/${quiz.courseSlug}/${quiz.meetingSlug}`}
          >
            Kembali ke pertemuan
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
