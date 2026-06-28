import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getGradebook } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";

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

/** Two-letter initials from a full name, e.g. "Emmil Saputra" -> "ES". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Badge variant class for a score: ok ≥ 80, plain 60–79, danger < 60. */
function scoreClass(score: number): string {
  if (score >= 80) return "ok";
  if (score >= 60) return "";
  return "danger";
}

const QUIZ_KEYS = ["P1", "P2", "P3", "P4"] as const;

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <td className="score">
        <span className="muted mono sc">—</span>
      </td>
    );
  }
  return (
    <td className="score">
      <span className={`badge ${scoreClass(value)} mono sc`.replace("  ", " ")}>
        {value}
      </span>
    </td>
  );
}

export default async function AdminGradebookPage() {
  await requireAdmin();
  const gradebook = await getGradebook();
  return (
    <AppShell variant="admin" crumb={<b>Buku Nilai</b>}>
      <style>{pageStyles}</style>

      <div className="page-head">
        <div className="row between wrap">
          <div>
            <h1>Buku Nilai</h1>
            <p>Matriks nilai kuis seluruh siswa pada Kimia Dasar.</p>
          </div>
          <button className="btn">
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
          </button>
        </div>
      </div>

      <div className="filterbar">
        <select className="select" aria-label="Pilih mata kuliah" defaultValue="Kimia Dasar">
          <option>Kimia Dasar</option>
          <option>Kimia Organik</option>
          <option>Biokimia</option>
        </select>
        <select className="select" aria-label="Pilih kuis" defaultValue="Semua pertemuan">
          <option>Semua pertemuan</option>
          <option>Kuis Pertemuan 1</option>
          <option>Kuis Pertemuan 2</option>
          <option>Kuis Pertemuan 3</option>
          <option>Kuis Pertemuan 4</option>
        </select>
        <div className="input-group">
          <input
            className="input"
            type="search"
            placeholder="Cari siswa…"
            aria-label="Cari siswa"
          />
          <button className="trail" aria-label="Cari">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "18px" }}>
        <div className="stat">
          <div className="k">Rata-rata kelas</div>
          <div className="v mono">81</div>
          <div className="d">42 siswa terdaftar</div>
        </div>
        <div className="stat">
          <div className="k">Tingkat kelulusan</div>
          <div className="v">
            88<small>%</small>
          </div>
          <div className="d">ambang lulus ≥ 60</div>
        </div>
        <div className="stat">
          <div className="k">Total percobaan</div>
          <div className="v mono">128</div>
          <div className="d">4 kuis · Kimia Dasar</div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="stick">Siswa</th>
              <th className="score">Kuis P1</th>
              <th className="score">Kuis P2</th>
              <th className="score">Kuis P3</th>
              <th className="score">Kuis P4</th>
              <th className="score">Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            {gradebook.map((row) => (
              <tr key={row.studentId}>
                <td className="stick">
                  <div className="scell">
                    <div className="avatar sm">{initialsOf(row.studentName)}</div>
                    <div>
                      <div className="nm">{row.studentName}</div>
                      <div className="nim muted mono">{row.studentNo}</div>
                    </div>
                  </div>
                </td>
                {QUIZ_KEYS.map((q) => (
                  <ScoreCell key={q} value={row.quizScores[q] ?? null} />
                ))}
                <ScoreCell value={row.average} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ marginTop: "14px", fontSize: "12.5px" }}>
        <span className="badge info">P2</span> Analitik per-butir soal (analisis
        tingkat kesulitan dan daya beda tiap soal) akan hadir pada fase
        berikutnya.
      </p>
    </AppShell>
  );
}
