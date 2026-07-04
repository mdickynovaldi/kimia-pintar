import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getCourses, getEnrollments, getStudents } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";
import { EnrollList } from "./enroll-list";

export const metadata: Metadata = { title: "Pendaftaran · Admin" };

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

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  await requireAdmin();
  const { course: courseParam } = await searchParams;

  const [courses, students, enrollments] = await Promise.all([
    getCourses(),
    getStudents(),
    getEnrollments(),
  ]);

  // Any course can receive enrollments — no hardcoded slug. Default to the
  // first published course, else the first course.
  const course =
    courses.find((c) => c.slug === courseParam) ??
    courses.find((c) => c.isPublished) ??
    courses[0];

  if (!course) {
    return (
      <AppShell variant="admin" crumb={<b>Pendaftaran</b>}>
        <div className="page-head">
          <h1>Pendaftaran</h1>
          <p>Belum ada mata kuliah — buat dulu di menu Mata Kuliah.</p>
        </div>
      </AppShell>
    );
  }

  const enrolled = enrollments
    .filter((e) => e.courseId === course.id && e.status === "active")
    .map((e) => e.studentId);

  const studentRows = students.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    studentNo: s.studentNo,
    initials: s.initials,
  }));

  return (
    <AppShell variant="admin" crumb={<b>Pendaftaran</b>}>
      <style>{pageStyles}</style>

      <div className="page-head">
        <h1>Pendaftaran</h1>
        <p>
          Daftarkan siswa ke mata kuliah. Siswa baru otomatis terdaftar ke
          kursus terbit — kelola pengecualian di sini.
        </p>
      </div>

      <EnrollList
        key={course.id}
        students={studentRows}
        enrolled={enrolled}
        courseId={course.id}
        courseTitle={course.title}
        courses={courses.map((c) => ({ slug: c.slug, title: c.title }))}
        courseSlug={course.slug}
      />
    </AppShell>
  );
}
