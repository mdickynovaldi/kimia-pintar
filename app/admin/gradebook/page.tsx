import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getGradebook } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";
import { GradebookTable } from "./gradebook-table";

export const metadata: Metadata = { title: "Buku Nilai · Admin Kimia Pintar" };

const pageStyles = `
  .filterbar { display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }
  .filterbar .select { max-width:220px; }
  .filterbar .input-group { flex:1; min-width:180px; }
  .scell { display:flex; align-items:center; gap:11px; }
  .scell .nm { font-weight:600; color:var(--fg-strong); white-space:nowrap; }
  .scell .nim { font-size:11.5px; }
  table.tbl td.score { text-align:center; }
  table.tbl th.score { text-align:center; }
  /* sticky first column */
  table.tbl th.stick, table.tbl td.stick {
    position:sticky; left:0; z-index:2; background:var(--surface);
    border-right:1px solid var(--border);
  }
  table.tbl th.stick { background:var(--surface-2); z-index:3; }
  table.tbl tbody tr:hover td.stick { background:var(--surface-2); }
  .sc { display:inline-flex; min-width:38px; justify-content:center; }
`;

export default async function AdminGradebookPage() {
  await requireAdmin();
  const gradebook = await getGradebook();

  // Every quiz column present across the cohort (P1..Pn), sorted numerically.
  const quizKeys = [
    ...new Set(gradebook.flatMap((r) => Object.keys(r.quizScores))),
  ].sort((a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")));

  // Real summary stats (no more hardcoded 81 / 88% / 128).
  const studentCount = gradebook.length;
  const averages = gradebook
    .map((r) => r.average)
    .filter((v): v is number => v != null);
  const classAverage = averages.length
    ? Math.round(averages.reduce((a, b) => a + b, 0) / averages.length)
    : null;
  const passRate = averages.length
    ? Math.round(
        (averages.filter((v) => v >= 60).length / averages.length) * 100,
      )
    : null;
  const recordedScores = gradebook.reduce(
    (n, r) => n + Object.values(r.quizScores).filter((v) => v != null).length,
    0,
  );

  return (
    <AppShell variant="admin" crumb={<b>Buku Nilai</b>}>
      <style>{pageStyles}</style>

      <div className="page-head">
        <div className="row between wrap">
          <div>
            <h1>Buku Nilai</h1>
            <p>Matriks nilai kuis seluruh siswa pada Kimia Dasar.</p>
          </div>
          <a className="btn" href="/api/gradebook/csv" download>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5M12 15V3" />
            </svg>
            Ekspor CSV
          </a>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "18px" }}>
        <div className="stat">
          <div className="k">Rata-rata kelas</div>
          <div className="v mono">{classAverage ?? "—"}</div>
          <div className="d">{studentCount} siswa terdaftar</div>
        </div>
        <div className="stat">
          <div className="k">Tingkat kelulusan</div>
          <div className="v">
            {passRate ?? "—"}
            <small>%</small>
          </div>
          <div className="d">ambang lulus ≥ 60</div>
        </div>
        <div className="stat">
          <div className="k">Nilai tercatat</div>
          <div className="v mono">{recordedScores}</div>
          <div className="d">
            {quizKeys.length} kuis · Kimia Dasar
          </div>
        </div>
      </div>

      <GradebookTable rows={gradebook} quizKeys={quizKeys} />

      <p className="muted" style={{ marginTop: "14px", fontSize: "12.5px" }}>
        <span className="badge info">P2</span> Analitik per-butir soal (analisis
        tingkat kesulitan dan daya beda tiap soal) akan hadir pada fase
        berikutnya.
      </p>
    </AppShell>
  );
}
