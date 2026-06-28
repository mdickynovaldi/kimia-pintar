import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getMyResults, type ResultRow } from "@/lib/data";

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

function statusBadge(status: ResultRow["status"]) {
  switch (status) {
    case "lulus":
      return { className: "badge ok", label: "Lulus", dot: true };
    case "belum-lulus":
      return { className: "badge warn", label: "Belum lulus", dot: true };
    default:
      return { className: "badge", label: "Belum dikerjakan", dot: false };
  }
}

export default async function ResultsPage() {
  const studentResults = await getMyResults();
  const rows = studentResults
    .slice()
    .sort(
      (a, b) =>
        (rowMeta[a.meetingLabel]?.order ?? 99) -
        (rowMeta[b.meetingLabel]?.order ?? 99),
    );

  return (
    <AppShell variant="student" crumb={<b>Nilai Saya</b>}>
      <div className="page-head">
        <h1>Nilai Saya</h1>
        <p>Skor kuis di seluruh mata kuliah.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "20px" }}>
        <div className="stat">
          <div className="k">Rata-rata nilai</div>
          <div className="v mono">82</div>
          <div className="d">dari 4 kuis</div>
        </div>
        <div className="stat">
          <div className="k">Kuis lulus</div>
          <div className="v">
            3<small> / 4</small>
          </div>
          <div className="d">batas lulus 75</div>
        </div>
        <div className="stat">
          <div className="k">Total percobaan</div>
          <div className="v">4</div>
          <div className="d">semua kuis objektif</div>
        </div>
      </div>

      <div className="row wrap" style={{ marginBottom: "16px", gap: "8px" }}>
        <div className="field" style={{ marginBottom: 0, minWidth: "220px" }}>
          <label htmlFor="f-course">Mata kuliah</label>
          <select className="select" id="f-course" defaultValue="Semua mata kuliah">
            <option>Semua mata kuliah</option>
            <option>Kimia Dasar</option>
          </select>
        </div>
        <div className="row gap-sm" style={{ alignSelf: "flex-end", flexWrap: "wrap" }}>
          <span className="badge accent">
            <span className="dot" />
            Semua mata kuliah
          </span>
          <span className="badge">Kimia Dasar</span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Kuis</th>
              <th>Mata Kuliah</th>
              <th>Tanggal</th>
              <th>Percobaan</th>
              <th>Skor</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = rowMeta[r.meetingLabel];
              const badge = statusBadge(r.status);
              const done = r.status !== "belum-dikerjakan" && r.attemptId !== null;
              const href = done
                ? `/quiz/${r.quizId}/result/${r.attemptId}`
                : `/quiz/${r.quizId}`;
              return (
                <tr key={r.quizId}>
                  <td>
                    <Link
                      href={href}
                      style={{ fontWeight: 600, color: "var(--fg-strong)" }}
                    >
                      {r.meetingLabel} — {r.meetingTitle}
                    </Link>
                  </td>
                  <td className="muted">{r.courseTitle}</td>
                  <td className="muted nowrap">{meta?.date}</td>
                  <td className="mono">{meta?.attempts}</td>
                  <td className="mono">{r.score ?? "—"}</td>
                  <td>
                    <span className={badge.className}>
                      {badge.dot && <span className="dot" />}
                      {badge.label}
                    </span>
                  </td>
                  <td className="nowrap">
                    <Link className="btn btn-sm btn-ghost" href={href}>
                      {done ? "Lihat" : "Mulai"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ fontSize: "12.5px", marginTop: "14px" }}>
        Semua kuis dinilai otomatis (objektif). Tidak ada esai yang menunggu
        penilaian.
      </p>
    </AppShell>
  );
}
