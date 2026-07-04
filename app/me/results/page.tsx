import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getMyResults } from "@/lib/data";
import { ResultsTable } from "./results-table";

export const metadata: Metadata = { title: "Nilai Saya" };

export default async function ResultsPage() {
  const rows = await getMyResults();

  const scored = rows.filter(
    (r): r is (typeof rows)[number] & { score: number } => r.score !== null,
  );
  const average =
    scored.length > 0
      ? Math.round(scored.reduce((sum, r) => sum + r.score, 0) / scored.length)
      : 0;
  const passed = rows.filter((r) => r.status === "lulus").length;
  const total = rows.length;
  const totalAttempts = rows.reduce((n, r) => n + r.attemptsUsed, 0);
  const awaiting = rows.filter((r) => r.status === "menunggu-penilaian").length;

  // Passing thresholds are per-quiz; show the range honestly.
  const thresholds = [...new Set(rows.map((r) => r.passingScore))].sort(
    (a, b) => a - b,
  );
  const thresholdLabel =
    thresholds.length === 0
      ? "—"
      : thresholds.length === 1
        ? `${thresholds[0]}`
        : `${thresholds[0]}–${thresholds[thresholds.length - 1]}`;

  return (
    <AppShell variant="student" crumb={<b>Nilai Saya</b>}>
      <div className="page-head">
        <h1>Nilai Saya</h1>
        <p>Skor kuis di seluruh mata kuliah.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "20px" }}>
        <div className="stat">
          <div className="k">Rata-rata nilai</div>
          <div className="v mono">{average}</div>
          <div className="d">dari {scored.length} kuis dinilai</div>
        </div>
        <div className="stat">
          <div className="k">Kuis lulus</div>
          <div className="v">
            {passed}
            <small> / {total}</small>
          </div>
          <div className="d">ambang lulus {thresholdLabel}</div>
        </div>
        <div className="stat">
          <div className="k">Total percobaan</div>
          <div className="v">{totalAttempts}</div>
          <div className="d">di semua kuis</div>
        </div>
      </div>

      <ResultsTable rows={rows} />

      {awaiting > 0 ? (
        <p className="muted" style={{ fontSize: "12.5px", marginTop: "14px" }}>
          {awaiting} kuis berisi jawaban esai yang sedang menunggu penilaian
          pengajar — nilainya akan muncul setelah dinilai.
        </p>
      ) : null}
    </AppShell>
  );
}
