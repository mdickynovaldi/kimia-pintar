import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Plus } from "@/components/icons";
import { getCourses } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";
import { createCourse, deleteCourse } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Mata Kuliah · Admin Kimia Pintar" };

export default async function AdminCoursesPage() {
  await requireAdmin();
  const courses = await getCourses();
  const total = courses.length;
  const publishedCount = courses.filter((c) => c.isPublished).length;
  const draftCount = total - publishedCount;

  return (
    <AppShell variant="admin" crumb={<>Admin · <b>Mata Kuliah</b></>}>
      <div
        className="row between"
        style={{ marginBottom: "22px", flexWrap: "wrap", gap: "14px" }}
      >
        <div className="page-head" style={{ marginBottom: 0 }}>
          <h1>Mata Kuliah</h1>
          <p>
            Kelola {total} mata kuliah, atur pertemuan, dan kontrol status
            penerbitan.
          </p>
        </div>
        <form action={createCourse} className="row gap-sm" style={{ flexWrap: "wrap" }}>
          <input
            className="input"
            type="text"
            name="title"
            placeholder="Judul mata kuliah baru…"
            style={{ minWidth: "220px" }}
          />
          <button className="btn btn-primary" type="submit">
            <Plus />
            Buat mata kuliah
          </button>
        </form>
      </div>

      <div className="row wrap" style={{ marginBottom: "18px" }}>
        <div className="input-group" style={{ flex: 1, minWidth: "220px" }}>
          <input
            className="input"
            type="search"
            placeholder="Cari mata kuliah atau kode…"
          />
          <button className="trail" type="button" aria-label="Cari">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
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

      <div className="row wrap gap-sm" style={{ marginBottom: "18px" }}>
        <span className="badge accent">Semua · {total}</span>
        <span className="badge ok">Terbit · {publishedCount}</span>
        <span className="badge warn">Draft · {draftCount}</span>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Mata Kuliah</th>
              <th>Pertemuan</th>
              <th>Kuis</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>
                  <div style={{ fontWeight: 600, color: "var(--fg-strong)" }}>
                    {course.title}
                  </div>
                  <div className="mono muted" style={{ fontSize: "12px" }}>
                    {course.code}
                  </div>
                </td>
                <td className="num">{course.meetingCount} pertemuan</td>
                <td className="num">{course.quizCount} kuis</td>
                <td>
                  {course.isPublished ? (
                    <span className="badge ok">
                      <span className="dot"></span>Terbit
                    </span>
                  ) : (
                    <span className="badge">Draft</span>
                  )}
                </td>
                <td>
                  <div className="row gap-sm">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      style={{ fontSize: "13px", fontWeight: 600 }}
                    >
                      Edit
                    </Link>
                    <form action={deleteCourse}>
                      <input type="hidden" name="id" value={course.id} />
                      <button
                        type="submit"
                        className="btn btn-ghost"
                        style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger, #c0392b)" }}
                      >
                        Hapus
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
