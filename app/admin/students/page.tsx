import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getGradebook, getStudents } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";
import { StudentsInvite } from "./students-invite";
import { StudentsTable } from "./students-table";

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
  const [students, gradebook] = await Promise.all([
    getStudents(),
    getGradebook(),
  ]);
  const gradesById = new Map(gradebook.map((g) => [g.studentId, g]));

  const rows = students.map((s) => {
    const g = gradesById.get(s.id);
    return {
      id: s.id,
      fullName: s.fullName,
      studentNo: s.studentNo,
      email: s.email,
      initials: s.initials,
      isActive: s.isActive,
      quizScores: g?.quizScores ?? {},
      average: g?.average ?? null,
    };
  });

  return (
    <AppShell variant="admin" crumb={<b>Siswa</b>}>
      <style>{pageStyles}</style>

      <StudentsInvite />

      <StudentsTable students={rows} />
    </AppShell>
  );
}
