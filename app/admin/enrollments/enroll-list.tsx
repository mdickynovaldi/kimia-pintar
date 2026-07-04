"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveEnrollments } from "@/app/actions/admin";

type StudentRow = {
  id: string;
  fullName: string;
  studentNo: string | null;
  initials: string;
};

export function EnrollList({
  students,
  enrolled,
  courseId,
  courseTitle,
  courses,
  courseSlug,
}: {
  students: StudentRow[];
  enrolled: string[];
  courseId: string;
  courseTitle: string;
  courses: { slug: string; title: string }[];
  courseSlug: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const enrolledSet = useMemo(() => new Set(enrolled), [enrolled]);

  const q = query.trim().toLowerCase();
  const matches = (s: StudentRow) =>
    !q ||
    s.fullName.toLowerCase().includes(q) ||
    (s.studentNo ?? "").toLowerCase().includes(q);

  const unenrolled = students.filter((s) => !enrolledSet.has(s.id));
  const enrolledStudents = students.filter((s) => enrolledSet.has(s.id));

  const visibleUnenrolled = unenrolled.filter(matches).length;
  const visibleEnrolled = enrolledStudents.filter(matches).length;

  // Keep every row mounted (only visually hidden when filtered out) so the
  // uncontrolled `defaultChecked` checkbox state survives live search.
  const renderRow = (s: StudentRow) => (
    <div className="erow" key={s.id} hidden={!matches(s)}>
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
  );

  return (
    <form action={saveEnrollments}>
      <input type="hidden" name="course_id" value={courseId} />

      <div className="ctrlbar">
        <select
          className="select"
          aria-label="Pilih mata kuliah"
          value={courseSlug}
          onChange={(e) => router.push(`/admin/enrollments?course=${e.target.value}`)}
        >
          {courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
        <div className="input-group">
          <input
            className="input"
            type="search"
            placeholder="Cari siswa berdasarkan nama atau NIM…"
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
            {unenrolled.map(renderRow)}
            {visibleUnenrolled === 0 ? (
              <div className="erow muted" style={{ justifyContent: "center" }}>
                Tidak ada siswa yang cocok.
              </div>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Terdaftar di {courseTitle}</h3>
            <span className="spacer" />
            <span className="badge ok">{enrolledStudents.length}</span>
          </div>
          <div className="card-pad scroll-list" style={{ paddingTop: "6px" }}>
            {enrolledStudents.map(renderRow)}
            {visibleEnrolled === 0 ? (
              <div className="erow muted" style={{ justifyContent: "center" }}>
                Tidak ada siswa yang cocok.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}
