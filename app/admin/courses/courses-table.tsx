"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { deleteCourse } from "@/app/actions/admin";

type CourseRow = {
  id: string;
  code: string;
  title: string;
  meetingCount: number;
  quizCount: number;
  isPublished: boolean;
};

type StatusFilter = "all" | "published" | "draft";

export function CoursesTable({ courses }: { courses: CourseRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const total = courses.length;
  const publishedCount = useMemo(
    () => courses.filter((c) => c.isPublished).length,
    [courses],
  );
  const draftCount = total - publishedCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (status === "published" && !c.isPublished) return false;
      if (status === "draft" && c.isPublished) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      );
    });
  }, [courses, query, status]);

  return (
    <>
      <div className="row wrap" style={{ marginBottom: "18px" }}>
        <div className="input-group" style={{ flex: 1, minWidth: "220px" }}>
          <input
            className="input"
            type="search"
            placeholder="Cari mata kuliah atau kode…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="trail" aria-hidden="true">
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
          </span>
        </div>
      </div>

      <div className="row wrap gap-sm" style={{ marginBottom: "18px" }}>
        <button
          type="button"
          className="badge accent"
          aria-pressed={status === "all"}
          onClick={() => setStatus("all")}
          style={{
            cursor: "pointer",
            opacity: status === "all" ? 1 : 0.55,
          }}
        >
          Semua · {total}
        </button>
        <button
          type="button"
          className="badge ok"
          aria-pressed={status === "published"}
          onClick={() => setStatus("published")}
          style={{
            cursor: "pointer",
            opacity: status === "published" ? 1 : 0.55,
          }}
        >
          Terbit · {publishedCount}
        </button>
        <button
          type="button"
          className="badge warn"
          aria-pressed={status === "draft"}
          onClick={() => setStatus("draft")}
          style={{
            cursor: "pointer",
            opacity: status === "draft" ? 1 : 0.55,
          }}
        >
          Draft · {draftCount}
        </button>
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
            {filtered.map((course) => (
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
                    <form
                      action={deleteCourse}
                      onSubmit={(e) => {
                        if (
                          !window.confirm(
                            `Hapus mata kuliah “${course.title}”? Tindakan ini tidak dapat dibatalkan.`,
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="id" value={course.id} />
                      <button
                        type="submit"
                        className="btn btn-ghost"
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--danger, #c0392b)",
                        }}
                      >
                        Hapus
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: "center" }}>
                  Tidak ada mata kuliah yang cocok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
