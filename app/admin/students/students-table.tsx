"use client";

import { useEffect, useMemo, useState } from "react";
import { setStudentActive } from "@/app/actions/admin-students";

type StudentRow = {
  id: string;
  fullName: string;
  studentNo: string | null;
  email: string;
  initials: string;
  isActive: boolean;
  quizScores: Record<string, number | null>;
  average: number | null;
};

type StatusFilter = "all" | "active" | "inactive";

const modalStyles = `
  .modal-scrim { position: fixed; inset: 0; background: rgba(8,12,20,.55); z-index: 90; display: grid; place-items: center; padding: 18px; }
  .modal-card { width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto; }
  .modal-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--border); }
  .modal-head .spacer { flex: 1; }
  .grade-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--border); }
  .grade-row:last-child { border-bottom: 0; }
`;

/** Badge variant for a score: ok >= 80, plain 60-79, danger < 60. */
function scoreClass(score: number): string {
  if (score >= 80) return "ok";
  if (score >= 60) return "";
  return "danger";
}

function GradesModal({
  student,
  onClose,
}: {
  student: StudentRow;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const entries = Object.entries(student.quizScores).sort(
    (a, b) => Number(a[0].replace(/\D/g, "")) - Number(b[0].replace(/\D/g, "")),
  );

  return (
    <div className="modal-scrim" onClick={onClose} role="presentation">
      <div
        className="card modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Nilai ${student.fullName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="avatar">{student.initials}</div>
          <div>
            <h3 style={{ marginBottom: 2 }}>{student.fullName}</h3>
            <div className="muted mono" style={{ fontSize: "12px" }}>
              {student.studentNo ?? "—"} · {student.email}
            </div>
          </div>
          <span className="spacer" />
          <button
            type="button"
            className="icon-btn"
            aria-label="Tutup"
            onClick={onClose}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="card-pad">
          {entries.length === 0 ? (
            <p className="muted" style={{ fontSize: "13.5px" }}>
              Belum ada nilai kuis untuk siswa ini.
            </p>
          ) : (
            <>
              {entries.map(([label, score]) => (
                <div className="grade-row" key={label}>
                  <span style={{ fontWeight: 600 }}>Kuis {label}</span>
                  {score == null ? (
                    <span className="muted mono">—</span>
                  ) : (
                    <span className={`badge ${scoreClass(score)} mono`.replace("  ", " ")}>
                      {score}
                    </span>
                  )}
                </div>
              ))}
              <div className="grade-row" style={{ borderTop: "1px solid var(--border)", marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: "var(--fg-strong)" }}>
                  Rata-rata
                </span>
                {student.average == null ? (
                  <span className="muted mono">—</span>
                ) : (
                  <span className={`badge ${scoreClass(student.average)} mono`.replace("  ", " ")}>
                    {student.average}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentsTable({ students }: { students: StudentRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [viewing, setViewing] = useState<StudentRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (status === "active" && !s.isActive) return false;
      if (status === "inactive" && s.isActive) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        (s.studentNo ?? "").toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }, [students, query, status]);

  return (
    <>
      <style>{modalStyles}</style>
      <div className="filterbar">
        <div className="input-group">
          <input
            className="input"
            type="search"
            placeholder="Cari nama, NIM, atau email…"
            aria-label="Cari siswa"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="trail" aria-hidden="true">
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
          </span>
        </div>
        <div className="chip-row">
          <button
            type="button"
            className={status === "all" ? "chip active" : "chip"}
            onClick={() => setStatus("all")}
          >
            Semua
          </button>
          <button
            type="button"
            className={status === "active" ? "chip active" : "chip"}
            onClick={() => setStatus("active")}
          >
            Aktif
          </button>
          <button
            type="button"
            className={status === "inactive" ? "chip active" : "chip"}
            onClick={() => setStatus("inactive")}
          >
            Nonaktif
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Siswa</th>
              <th>NIM</th>
              <th>Email</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="scell">
                    <div className="avatar sm">{s.initials}</div>
                    <span className="nm">{s.fullName}</span>
                  </div>
                </td>
                <td className="mono">{s.studentNo ?? "—"}</td>
                <td className="muted">{s.email}</td>
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
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setViewing(s)}
                    >
                      Lihat nilai
                    </button>
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: "center" }}>
                  Tidak ada siswa yang cocok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {viewing ? (
        <GradesModal student={viewing} onClose={() => setViewing(null)} />
      ) : null}
    </>
  );
}
