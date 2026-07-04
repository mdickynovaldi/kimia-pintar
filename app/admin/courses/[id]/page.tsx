import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CourseEditor } from "@/components/admin/course-editor";
import { requireAdmin } from "@/lib/auth/dal";
import { getCourseById, getMeetingsByCourseId } from "@/lib/data";

export const metadata: Metadata = { title: "Editor Mata Kuliah · Admin" };

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [course, meetings] = await Promise.all([
    getCourseById(id),
    getMeetingsByCourseId(id),
  ]);
  if (!course) notFound();

  return (
    <AppShell
      variant="admin"
      crumb={
        <>
          <Link href="/admin/courses">Mata Kuliah</Link> / <b>{course.title}</b>
        </>
      }
    >
      <div className="page-head">
        <div className="row between wrap" style={{ gap: 12 }}>
          <div>
            <h1>Edit Mata Kuliah</h1>
            <p>
              {course.code} · {meetings.length} pertemuan
            </p>
          </div>
          <Link className="btn btn-ghost" href="/admin/enrollments">
            Kelola pendaftaran
          </Link>
        </div>
      </div>

      <CourseEditor course={course} meetings={meetings} />
    </AppShell>
  );
}
