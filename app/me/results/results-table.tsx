"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ResultRow } from "@/lib/data";

const ALL = "Semua mata kuliah";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

function statusBadge(status: ResultRow["status"]) {
  switch (status) {
    case "lulus":
      return { className: "badge ok", label: "Lulus", dot: true };
    case "belum-lulus":
      return { className: "badge warn", label: "Belum lulus", dot: true };
    case "menunggu-penilaian":
      return { className: "badge info", label: "Menunggu penilaian", dot: true };
    default:
      return { className: "badge", label: "Belum dikerjakan", dot: false };
  }
}

export function ResultsTable({ rows }: { rows: ResultRow[] }) {
  const [course, setCourse] = useState<string>(ALL);

  const courses = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const r of rows) {
      if (!seen.has(r.courseTitle)) {
        seen.add(r.courseTitle);
        list.push(r.courseTitle);
      }
    }
    return list;
  }, [rows]);

  const filtered = useMemo(
    () => (course === ALL ? rows : rows.filter((r) => r.courseTitle === course)),
    [rows, course],
  );

  return (
    <>
      <div className="row wrap" style={{ marginBottom: "16px", gap: "8px" }}>
        <div className="field" style={{ marginBottom: 0, minWidth: "220px" }}>
          <label htmlFor="f-course">Mata kuliah</label>
          <select
            className="select"
            id="f-course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          >
            <option>{ALL}</option>
            {courses.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="row gap-sm" style={{ alignSelf: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            className={course === ALL ? "badge accent" : "badge"}
            onClick={() => setCourse(ALL)}
            style={{ cursor: "pointer" }}
          >
            {course === ALL && <span className="dot" />}
            {ALL}
          </button>
          {courses.map((c) => (
            <button
              type="button"
              key={c}
              className={course === c ? "badge accent" : "badge"}
              onClick={() => setCourse(c)}
              style={{ cursor: "pointer" }}
            >
              {course === c && <span className="dot" />}
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Kuis</th>
              <th>Mata Kuliah</th>
              <th>Tanggal</th>
              <th>Percobaan</th>
              <th>Skor</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const badge = statusBadge(r.status);
              const done = r.attemptId !== null;
              const href = done
                ? `/quiz/${r.quizId}/result/${r.attemptId}`
                : `/quiz/${r.quizId}`;
              return (
                <tr key={r.quizId}>
                  <td>
                    <Link
                      href={href}
                      style={{ fontWeight: 600, color: "var(--fg-strong)" }}
                    >
                      {r.meetingLabel} — {r.meetingTitle}
                    </Link>
                  </td>
                  <td className="muted">{r.courseTitle}</td>
                  <td className="muted nowrap">
                    {r.date ? dateFmt.format(new Date(r.date)) : "—"}
                  </td>
                  <td className="mono">
                    {r.attemptsUsed}/{r.maxAttempts ?? "∞"}
                  </td>
                  <td className="mono">{r.score ?? "—"}</td>
                  <td>
                    <span className={badge.className}>
                      {badge.dot && <span className="dot" />}
                      {badge.label}
                    </span>
                  </td>
                  <td className="nowrap">
                    <Link className="btn btn-sm btn-ghost" href={href}>
                      {done ? "Lihat" : "Mulai"}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: "center" }}>
                  Tidak ada nilai yang cocok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
