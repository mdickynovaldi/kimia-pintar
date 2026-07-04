import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { QuizBuilder } from "@/components/admin/quiz-builder";
import { updateQuizSettings } from "@/app/actions/admin-quiz";
import { requireAdmin } from "@/lib/auth/dal";
import { getCourseById, getQuiz } from "@/lib/data";

export const metadata: Metadata = { title: "Pembuat Kuis · Admin" };

/** ISO → datetime-local value in WIB (UTC+7), matching how saves are parsed. */
function toWibLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

const pageStyles = `
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
  @media (max-width: 620px) { .form-grid { grid-template-columns: 1fr; } }
  .switch-field { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--r); background: var(--surface-2); margin-bottom: 12px; }
  .switch-field .lbl { font-size: 13.5px; font-weight: 600; }
  .switch-field .hint { font-size: 11.5px; color: var(--faint); margin-top: 1px; }
  .q-card { border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--shadow-sm); margin-bottom: 16px; }
  .q-head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .q-head .num { font: 700 13px/1 var(--font-mono); color: var(--muted); }
  .q-head .spacer { flex: 1; }
  .q-body { padding: 16px; }
  .prompt-box { width: 100%; padding: 11px 13px; border-radius: var(--r-sm); border: 1px solid var(--border-2); background: var(--surface-2); color: var(--fg-strong); font: 600 15px/1.45 var(--font-body); min-height: 46px; resize: vertical; }
  .prompt-box:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); background: var(--surface); }
  .opt-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--r-sm); margin-bottom: 8px; background: var(--surface); }
  .opt-row.correct { border-color: var(--success); background: var(--success-soft); }
  .opt-row .mark { width: 18px; height: 18px; accent-color: var(--accent); flex: none; }
  .opt-row .opt-input { flex: 1; border: 0; background: transparent; color: var(--fg); font: 14px/1.4 var(--font-body); padding: 4px 2px; }
  .opt-row .opt-input:focus { outline: none; }
  .opt-row .tag-ok { font: 600 11px/1 var(--font-body); color: var(--success); display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; flex: none; }
  .opt-row .tag-ok svg { width: 13px; height: 13px; }
  .opt-row .del { width: 30px; height: 30px; border: 0; background: transparent; color: var(--faint); border-radius: 6px; cursor: pointer; display: grid; place-items: center; flex: none; }
  .opt-row .del:hover { color: var(--danger); background: var(--danger-soft); }
  .pts-field { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
  .pts-field .input { width: 76px; }
  .sticky-bar { position: sticky; bottom: 0; margin: 22px 0 -2px; padding: 14px clamp(4px,2vw,18px); background: color-mix(in oklch, var(--bg) 86%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; z-index: 20; }
`;

function Switch({ name, defaultChecked }: { name: string; defaultChecked?: boolean }) {
  return (
    <label className="switch">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} value="true" />
      <span className="track" />
    </label>
  );
}

export default async function AdminQuizBuilderPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  await requireAdmin();
  const { quizId } = await params;
  const quiz = await getQuiz(quizId);
  if (!quiz) notFound();
  const course = await getCourseById(quiz.courseId);

  return (
    <AppShell
      variant="admin"
      crumb={
        <>
          <Link href="/admin/courses">Mata Kuliah</Link> /{" "}
          <Link href={`/admin/courses/${quiz.courseId}`}>
            {course?.title ?? "Kursus"}
          </Link>{" "}
          / <b>{quiz.title}</b>
        </>
      }
    >
      <style>{pageStyles}</style>

      <div className="page-head">
        <h1>Pembuat Kuis</h1>
        <p>{quiz.title}</p>
      </div>

      {/* SETTINGS */}
      <form action={updateQuizSettings} className="card" style={{ marginBottom: "20px" }}>
        <input type="hidden" name="quiz_id" value={quiz.id} />
        <div className="card-head">
          <h3>Setelan kuis</h3>
          <span className="spacer" />
          <button className="btn btn-sm btn-primary" type="submit">
            Simpan setelan
          </button>
        </div>
        <div className="card-pad">
          <div className="field">
            <label htmlFor="s-judul">Judul</label>
            <input className="input" id="s-judul" name="title" defaultValue={quiz.title} />
          </div>
          <div className="field">
            <label htmlFor="s-desc">Deskripsi</label>
            <textarea className="textarea" id="s-desc" name="description" defaultValue={quiz.description} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="s-time">Batas waktu (menit)</label>
              <input className="input" id="s-time" name="time_limit_minutes" type="number" min={0} defaultValue={quiz.timeLimitMinutes ?? ""} />
              <span className="hint">kosongkan = tanpa batas</span>
            </div>
            <div className="field">
              <label htmlFor="s-att">Maks. percobaan</label>
              <input className="input" id="s-att" name="max_attempts" type="number" min={1} defaultValue={quiz.maxAttempts ?? ""} />
              <span className="hint">kosongkan = tak terbatas</span>
            </div>
            <div className="field">
              <label htmlFor="s-pass">Nilai lulus (%)</label>
              <input className="input" id="s-pass" name="passing_score" type="number" min={0} max={100} defaultValue={quiz.passingScore} />
            </div>
            <div className="field">
              <label htmlFor="s-grade">Metode penilaian</label>
              <select className="select" id="s-grade" name="grading_method" defaultValue={quiz.gradingMethod}>
                <option value="highest">Tertinggi</option>
                <option value="latest">Terakhir</option>
                <option value="average">Rata-rata</option>
                <option value="first">Pertama</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-show">Tampilkan jawaban benar</label>
              <select className="select" id="s-show" name="show_correct_answers" defaultValue={quiz.showCorrectAnswers}>
                <option value="never">Tidak pernah</option>
                <option value="after_submit">Setelah submit</option>
                <option value="after_close">Setelah ditutup</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-qpp">Soal per halaman</label>
              <input className="input" id="s-qpp" name="questions_per_page" type="number" min={0} defaultValue={quiz.questionsPerPage} />
            </div>
            <div className="field">
              <label htmlFor="s-from">Dibuka mulai (WIB)</label>
              <input className="input" id="s-from" name="available_from" type="datetime-local" defaultValue={toWibLocal(quiz.availableFrom)} />
              <span className="hint">kosongkan = langsung terbuka</span>
            </div>
            <div className="field">
              <label htmlFor="s-until">Ditutup pada (WIB)</label>
              <input className="input" id="s-until" name="available_until" type="datetime-local" defaultValue={toWibLocal(quiz.availableUntil)} />
              <span className="hint">kosongkan = tanpa tenggat; juga dipakai kebijakan &quot;Setelah ditutup&quot;</span>
            </div>
          </div>

          <div className="switch-field">
            <div><div className="lbl">Acak soal</div><div className="hint">urutan soal diacak tiap percobaan</div></div>
            <Switch name="shuffle_questions" defaultChecked={quiz.shuffleQuestions} />
          </div>
          <div className="switch-field">
            <div><div className="lbl">Acak pilihan</div><div className="hint">urutan opsi diacak</div></div>
            <Switch name="shuffle_options" defaultChecked={quiz.shuffleOptions} />
          </div>
          <div className="switch-field">
            <div><div className="lbl">Tampilkan skor langsung</div><div className="hint">skor muncul tepat setelah submit</div></div>
            <Switch name="show_score_immediately" defaultChecked={quiz.showScoreImmediately} />
          </div>
          <div className="switch-field">
            <div><div className="lbl">Boleh kembali</div><div className="hint">izinkan navigasi ke soal sebelumnya</div></div>
            <Switch name="allow_backtrack" defaultChecked={quiz.allowBacktrack} />
          </div>
          <div className="switch-field" style={{ marginBottom: 0 }}>
            <div><div className="lbl">Terbitkan kuis</div><div className="hint">siswa hanya bisa mengerjakan kuis terbit</div></div>
            <Switch name="is_published" defaultChecked={quiz.isPublished} />
          </div>
        </div>
      </form>

      {/* QUESTIONS (interactive) */}
      <QuizBuilder quizId={quiz.id} initial={quiz.questions} />
    </AppShell>
  );
}
