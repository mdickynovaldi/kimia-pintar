import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getMyResults } from "@/lib/data";
import { ResultsTable, type ResultTableRow } from "./results-table";

export const metadata: Metadata = { title: "Nilai Saya" };

// Per-row presentational literals reproduced from the source prototype
// (the data layer does not carry the date / attempt-count columns). Keyed by
// meetingLabel so the table stays wired to studentResults for the rest.
const rowMeta: Record<string, { date: string; attempts: string; order: number }> = {
  "Pertemuan 3": { date: "22 Jun 2026", attempts: "1/1", order: 0 },
  "Pertemuan 2": { date: "15 Jun 2026", attempts: "1/1", order: 1 },
  "Pertemuan 4": { date: "24 Jun 2026", attempts: "1/1", order: 2 },
  "Pertemuan 1": { date: "08 Jun 2026", attempts: "2/2", order: 3 },
};

export default async function ResultsPage() {
  const studentResults = await getMyResults();
  const rows: ResultTableRow[] = studentResults
    .slice()
    .sort(
      (a, b) =>
        (rowMeta[a.meetingLabel]?.order ?? 99) -
        (rowMeta[b.meetingLabel]?.order ?? 99),
    )
    .map((r) => ({
      ...r,
      date: rowMeta[r.meetingLabel]?.date,
      attempts: rowMeta[r.meetingLabel]?.attempts,
    }));

  const scored = rows.filter((r): r is ResultTableRow & { score: number } =>
    r.score !== null,
  );
  const average =
    scored.length > 0
      ? Math.round(scored.reduce((sum, r) => sum + r.score, 0) / scored.length)
      : 0;
  const passed = rows.filter((r) => r.status === "lulus").length;
  const total = rows.length;

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
          <div className="d">dari {scored.length} kuis</div>
        </div>
        <div className="stat">
          <div className="k">Kuis lulus</div>
          <div className="v">
            {passed}
            <small> / {total}</small>
          </div>
          <div className="d">batas lulus 75</div>
        </div>
        <div className="stat">
          <div className="k">Total percobaan</div>
          <div className="v">{total}</div>
          <div className="d">semua kuis objektif</div>
        </div>
      </div>

      <ResultsTable rows={rows} />

      <p className="muted" style={{ fontSize: "12.5px", marginTop: "14px" }}>
        Semua kuis dinilai otomatis (objektif). Tidak ada esai yang menunggu
        penilaian.
      </p>
    </AppShell>
  );
}
