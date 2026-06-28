import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Chart, Plus } from "@/components/icons";
import { meetingCompletion, recentActivity, totalStudents } from "@/lib/data";

export const metadata: Metadata = { title: "Dasbor Admin" };

export default function AdminDashboardPage() {
  const recentQuizzes = [
    { name: "Emmil Saputra", quiz: "P3 — Ikatan Kimia", score: 90, cls: "ok", time: "12 mnt" },
    { name: "Dian Pratama", quiz: "P2 — Struktur Atom", score: 78, cls: "", time: "5 jam" },
    { name: "Rara Fitri", quiz: "P1 — Stoikiometri", score: 68, cls: "warn", time: "6 jam" },
    { name: "Budi Santoso", quiz: "P3 — Ikatan Kimia", score: 85, cls: "ok", time: "1 hari" },
    { name: "Nadia Putri", quiz: "P4 — Termokimia", score: 92, cls: "ok", time: "1 hari" },
  ];

  return (
    <AppShell variant="admin" crumb={<>Admin · <b>Dasbor</b></>}>
      <div className="page-head">
        <h1>Dasbor Admin</h1>
        <p>
          Ringkasan platform Kimia Pintar — kelola mata kuliah, siswa, dan
          penilaian dari satu tempat.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "18px" }}>
        <div className="stat">
          <div className="k">Total siswa</div>
          <div className="v mono">{totalStudents}</div>
          <div className="d">Terdaftar aktif</div>
        </div>
        <div className="stat">
          <div className="k">Mata kuliah terbit</div>
          <div className="v">1<small> / 7</small></div>
          <div className="d">Kimia Dasar</div>
        </div>
        <div className="stat">
          <div className="k">Total kuis</div>
          <div className="v">4</div>
          <div className="d">Pertemuan 1–4</div>
        </div>
        <div className="stat">
          <div className="k">Percobaan minggu ini</div>
          <div className="v mono">128</div>
          <div className="d">+18% vs minggu lalu</div>
        </div>
        <div className="stat">
          <div className="k">Rata-rata nilai</div>
          <div className="v mono">81</div>
          <div className="d">Semua kuis</div>
        </div>
        <div className="stat">
          <div className="k">Menunggu dinilai</div>
          <div className="v">0</div>
          <div className="d">Objektif — otomatis</div>
        </div>
      </div>

      <div className="row wrap" style={{ marginBottom: "24px" }}>
        <Link className="btn btn-primary" href="/admin/courses/crs-dasar">
          <Plus />
          Buat mata kuliah
        </Link>
        <Link className="btn" href="/admin/students">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" />
          </svg>
          Undang siswa
        </Link>
        <Link className="btn" href="/admin/gradebook">
          <Chart />
          Buku nilai
        </Link>
      </div>

      <div className="grid grid-2" style={{ marginBottom: "24px" }}>
        <div className="card">
          <div className="card-head">
            <h3>Aktivitas terbaru</h3>
          </div>
          <div className="card-pad" style={{ paddingTop: "6px" }}>
            <div className="stack" style={{ gap: 0 }}>
              {recentActivity.map((a, i) => (
                <div
                  key={i}
                  className="row gap-sm"
                  style={{
                    padding: "12px 0",
                    borderBottom:
                      i < recentActivity.length - 1
                        ? "1px solid var(--border)"
                        : undefined,
                  }}
                >
                  <div className="avatar sm">{a.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{a.text}</div>
                    <div className="muted" style={{ fontSize: "12.5px" }}>
                      {a.meta}
                    </div>
                  </div>
                  <span className="faint nowrap" style={{ fontSize: "12px" }}>
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Kuis terbaru dikerjakan</h3>
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Kuis</th>
                  <th>Skor</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentQuizzes.map((r) => (
                  <tr key={r.name + r.quiz}>
                    <td>{r.name}</td>
                    <td>{r.quiz}</td>
                    <td>
                      <span className={`badge ${r.cls} mono`.replace("  ", " ")}>
                        {r.score}
                      </span>
                    </td>
                    <td className="muted">{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Penyelesaian per pertemuan</h3>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: "13px" }}>
            Kimia Dasar
          </span>
        </div>
        <div className="card-pad">
          <div className="stack" style={{ gap: "14px" }}>
            {meetingCompletion.map((m) => (
              <div key={m.label} className="row gap-sm">
                <span
                  className="mono nowrap"
                  style={{ width: "34px", fontSize: "12.5px", color: "var(--muted)" }}
                >
                  {m.label}
                </span>
                <div className="progress" style={{ flex: 1 }}>
                  <i style={{ width: `${m.pct}%` }} />
                </div>
                <span
                  className="mono nowrap"
                  style={{ width: "42px", textAlign: "right", fontSize: "12.5px" }}
                >
                  {m.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
