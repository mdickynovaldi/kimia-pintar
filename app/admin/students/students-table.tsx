"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { setStudentActive } from "@/app/actions/admin-students";

type StudentRow = {
  id: string;
  fullName: string;
  studentNo: string | null;
  email: string;
  initials: string;
  isActive: boolean;
};

type StatusFilter = "all" | "active" | "inactive";

export function StudentsTable({ students }: { students: StudentRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

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
          <button className="trail" type="button" aria-label="Cari">
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
                    <Link
                      className="btn btn-sm"
                      href={`/admin/gradebook?student=${s.id}`}
                    >
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
    </>
  );
}
