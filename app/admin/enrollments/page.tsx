import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCourse, getEnrollments, getStudents } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";
import { saveEnrollments } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Pendaftaran · Admin Kimia Pintar" };

const pageStyles = `
  .enroll-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  @media (max-width: 860px){ .enroll-grid { grid-template-columns:1fr; } }
  .ctrlbar { display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }
  .ctrlbar .select { max-width:240px; }
  .ctrlbar .input-group { flex:1; min-width:200px; }
  .erow { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid var(--border); }
  .erow:last-child { border-bottom:0; }
  .erow .who { display:flex; align-items:center; gap:10px; min-width:0; flex:1; }
  .erow .who .nm { font-weight:600; color:var(--fg-strong); }
  .erow .who .nim { font-size:12px; }
  .erow .checkrow { margin-right:2px; }
  .scroll-list { max-height:480px; overflow-y:auto; }
`;

export default async function AdminEnrollmentsPage() {
  await requireAdmin();

  const course = await getCourse("kimia-dasar");
  if (!course) notFound();

  const [students, enrollments] = await Promise.all([
    getStudents(),
    getEnrollments(),
  ]);

  const enrolledSet = new Set(
    enrollments
      .filter((e) => e.courseId === course.id && e.status === "active")
      .map((e) => e.studentId),
  );
  const enrolled = students.filter((s) => enrolledSet.has(s.id));
  const unenrolled = students.filter((s) => !enrolledSet.has(s.id));

  return (
    <AppShell variant="admin" crumb={<b>Pendaftaran</b>}>
      <style>{pageStyles}</style>

      <div className="page-head">
        <h1>Pendaftaran</h1>
        <p>Daftarkan siswa ke mata kuliah.</p>
      </div>

      <form action={saveEnrollments}>
        <input type="hidden" name="course_id" value={course.id} />

        <div className="ctrlbar">
          <select className="select" aria-label="Pilih mata kuliah" defaultValue="Kimia Dasar">
            <option>Kimia Dasar</option>
            <option>Kimia Organik</option>
            <option>Biokimia</option>
          </select>
          <div className="input-group">
            <input
              className="input"
              type="search"
              placeholder="Cari siswa berdasarkan nama atau NIM…"
              aria-label="Cari siswa"
            />
            <button type="button" className="trail" aria-label="Cari">
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
          <button type="submit" className="btn btn-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Simpan pendaftaran
          </button>
        </div>

        <div className="enroll-grid">
          <div className="card">
            <div className="card-head">
              <h3>Siswa belum terdaftar</h3>
              <span className="spacer" />
              <span className="badge">{unenrolled.length}</span>
            </div>
            <div className="card-pad scroll-list" style={{ paddingTop: "6px" }}>
              {unenrolled.map((s) => (
                <div className="erow" key={s.id}>
                  <label className="checkrow">
                    <input
                      type="checkbox"
                      name="student_id"
                      value={s.id}
                      defaultChecked={enrolledSet.has(s.id)}
                      aria-label={`Pilih ${s.fullName}`}
                    />
                  </label>
                  <div className="who">
                    <div className="avatar sm">{s.initials}</div>
                    <div>
                      <div className="nm">{s.fullName}</div>
                      <div className="nim muted mono">{s.studentNo}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Terdaftar di {course.title}</h3>
              <span className="spacer" />
              <span className="badge ok">{enrolled.length}</span>
            </div>
            <div className="card-pad scroll-list" style={{ paddingTop: "6px" }}>
              {enrolled.map((s) => (
                <div className="erow" key={s.id}>
                  <label className="checkrow">
                    <input
                      type="checkbox"
                      name="student_id"
                      value={s.id}
                      defaultChecked={enrolledSet.has(s.id)}
                      aria-label={`Pilih ${s.fullName}`}
                    />
                  </label>
                  <div className="who">
                    <div className="avatar sm">{s.initials}</div>
                    <div>
                      <div className="nm">{s.fullName}</div>
                      <div className="nim muted mono">{s.studentNo}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
