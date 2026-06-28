import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getStudents } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";
import { setStudentActive } from "@/app/actions/admin-students";
import { StudentsInvite } from "./students-invite";

export const metadata: Metadata = { title: "Siswa · Admin Kimia Pintar" };

const pageStyles = `
  .chip-row { display:flex; gap:8px; flex-wrap:wrap; }
  .chip { padding:7px 14px; border-radius:999px; border:1px solid var(--border-2); background:var(--surface); color:var(--muted); font:600 13px/1 var(--font-body); cursor:pointer; transition:background .15s,color .15s,border-color .15s; }
  .chip:hover { background:var(--surface-2); color:var(--fg); }
  .chip.active { background:var(--accent-soft); color:var(--accent-ink); border-color:transparent; }
  .scell { display:flex; align-items:center; gap:11px; }
  .scell .nm { font-weight:600; color:var(--fg-strong); }
  .invite-panel[hidden] { display:none; }
  .filterbar { display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }
  .filterbar .input-group { flex:1; min-width:200px; }
  table.tbl td .row.gap-sm { flex-wrap:wrap; }
`;

export default async function AdminStudentsPage() {
  await requireAdmin();
  const students = await getStudents();

  return (
    <AppShell variant="admin" crumb={<b>Siswa</b>}>
      <style>{pageStyles}</style>

      <StudentsInvite />

      <div className="filterbar">
        <div className="input-group">
          <input
            className="input"
            type="search"
            placeholder="Cari nama, NIM, atau email…"
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
        <div className="chip-row">
          <button className="chip active">Semua</button>
          <button className="chip">Aktif</button>
          <button className="chip">Nonaktif</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Siswa</th>
              <th>NIM</th>
              <th>Email</th>
              <th>Mata Kuliah</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="scell">
                    <div className="avatar sm">{s.initials}</div>
                    <span className="nm">{s.fullName}</span>
                  </div>
                </td>
                <td className="mono">{s.studentNo ?? "—"}</td>
                <td className="muted">{s.email}</td>
                <td>Kimia Dasar</td>
                <td>
                  {s.isActive ? (
                    <span className="badge ok">
                      <span className="dot"></span>Aktif
                    </span>
                  ) : (
                    <span className="badge">
                      <span className="dot"></span>Nonaktif
                    </span>
                  )}
                </td>
                <td>
                  <div className="row gap-sm">
                    <Link className="btn btn-sm" href="/admin/gradebook">
                      Lihat nilai
                    </Link>
                    <form action={setStudentActive}>
                      <input type="hidden" name="student_id" value={s.id} />
                      <input
                        type="hidden"
                        name="is_active"
                        value={s.isActive ? "false" : "true"}
                      />
                      <button type="submit" className="btn btn-sm btn-ghost">
                        {s.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
