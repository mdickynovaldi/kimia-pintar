import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getCourses, getMyEnrolledCourseIds } from "@/lib/data";
import { Catalog } from "./catalog";

export const metadata: Metadata = { title: "Mata Kuliah" };

const coursesStyles = `
  .crs { display: flex; flex-direction: column; gap: 12px; padding: 16px; border:1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--shadow-sm); transition: transform .08s, border-color .15s; text-decoration:none; color:inherit; }
  .crs:hover { transform: translateY(-2px); border-color: var(--accent); text-decoration:none; }
  .crs .cap { height: 96px; border-radius: var(--r); display:flex; align-items:flex-end; padding:12px; color:#fff; font-family:var(--font-display); font-weight:700; font-size:1.05rem; }
  .crs .ttl { font-family:var(--font-display); font-weight:700; color:var(--fg-strong); }
  .chips { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
  .chip { padding:6px 13px; border-radius:999px; border:1px solid var(--border-2); background:var(--surface); color:var(--muted); font:600 13px/1 var(--font-body); cursor:pointer; }
  .chip.active { background:var(--accent-soft); color:var(--accent-ink); border-color:transparent; }
`;

export default async function CoursesPage() {
  const [courses, enrolledIds] = await Promise.all([
    getCourses(),
    getMyEnrolledCourseIds(),
  ]);

  return (
    <AppShell variant="student" crumb={<b>Mata Kuliah</b>}>
      <style>{coursesStyles}</style>

      <div className="page-head">
        <h1>Mata Kuliah</h1>
        <p>
          Jelajahi katalog mata kuliah kimia. Mulai dari yang sudah aktif,
          kursus lainnya menyusul.
        </p>
      </div>

      <Catalog courses={courses} enrolledIds={[...enrolledIds]} />
    </AppShell>
  );
}
