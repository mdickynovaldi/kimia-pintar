import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Chart, Plus } from "@/components/icons";
import { getAdminDashboard } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Dasbor Admin" };

/** Badge variant for a score: ok ≥ 80, plain 60–79, warn < 60. */
function scoreCls(score: number): string {
  if (score >= 80) return "ok";
  if (score >= 60) return "";
  return "warn";
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const dash = await getAdminDashboard();

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
          <div className="v mono">{dash.totalStudents}</div>
          <div className="d">Terdaftar aktif</div>
        </div>
        <div className="stat">
          <div className="k">Mata kuliah terbit</div>
          <div className="v">
            {dash.publishedCourses}
            <small> / {dash.totalCourses}</small>
          </div>
          <div className="d">dari seluruh mata kuliah</div>
        </div>
        <div className="stat">
          <div className="k">Total kuis</div>
          <div className="v">{dash.totalQuizzes}</div>
          <div className="d">Seluruh pertemuan</div>
        </div>
        <div className="stat">
          <div className="k">Percobaan minggu ini</div>
          <div className="v mono">{dash.attemptsThisWeek}</div>
          <div className="d">7 hari terakhir</div>
        </div>
        <div className="stat">
          <div className="k">Rata-rata nilai</div>
          <div className="v mono">{dash.averageScore ?? "—"}</div>
          <div className="d">Semua kuis</div>
        </div>
        <div className="stat">
          <div className="k">Menunggu dinilai</div>
          <div className="v">{dash.pendingGrading}</div>
          <div className="d">Objektif — otomatis</div>
        </div>
      </div>

      <div className="row wrap" style={{ marginBottom: "24px" }}>
        <Link className="btn btn-primary" href="/admin/courses">
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
              {dash.recentActivity.length === 0 ? (
                <p className="muted" style={{ padding: "12px 0", fontSize: "13.5px" }}>
                  Belum ada aktivitas.
                </p>
              ) : (
                dash.recentActivity.map((a, i) => (
                  <div
                    key={i}
                    className="row gap-sm"
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        i < dash.recentActivity.length - 1
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
                ))
              )}
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
                {dash.recentAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted" style={{ textAlign: "center" }}>
                      Belum ada kuis yang dikerjakan.
                    </td>
                  </tr>
                ) : (
                  dash.recentAttempts.map((r, i) => (
                    <tr key={`${r.studentName}-${r.quizLabel}-${i}`}>
                      <td>{r.studentName}</td>
                      <td>{r.quizLabel}</td>
                      <td>
                        <span className={`badge ${scoreCls(r.score)} mono`.replace("  ", " ")}>
                          {r.score}
                        </span>
                      </td>
                      <td className="muted">{r.timeAgo}</td>
                    </tr>
                  ))
                )}
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
            % siswa dengan kuis dinilai
          </span>
        </div>
        <div className="card-pad">
          {dash.meetingCompletion.length === 0 ? (
            <p className="muted" style={{ fontSize: "13.5px" }}>
              Belum ada kuis terbit.
            </p>
          ) : (
            <div className="stack" style={{ gap: "14px" }}>
              {dash.meetingCompletion.map((m) => (
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
          )}
        </div>
      </div>
    </AppShell>
  );
}
