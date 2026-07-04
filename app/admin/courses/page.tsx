import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { Plus } from "@/components/icons";
import { getCourses } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";
import { createCourse } from "@/app/actions/admin";
import { CoursesTable } from "./courses-table";

export const metadata: Metadata = { title: "Mata Kuliah · Admin" };

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const courses = await getCourses();
  const total = courses.length;

  return (
    <AppShell variant="admin" crumb={<>Admin · <b>Mata Kuliah</b></>}>
      {error ? (
        <p
          role="alert"
          className="badge danger"
          style={{ display: "flex", marginBottom: "14px", width: "100%" }}
        >
          Gagal membuat mata kuliah: {error}
        </p>
      ) : null}
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

      <CoursesTable
        courses={courses.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          meetingCount: c.meetingCount,
          quizCount: c.quizCount,
          isPublished: c.isPublished,
        }))}
      />
    </AppShell>
  );
}
