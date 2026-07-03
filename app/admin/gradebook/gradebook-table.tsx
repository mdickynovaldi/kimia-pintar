"use client";

import { useMemo, useState } from "react";
import type { GradebookRow } from "@/lib/data/types";

/** Two-letter initials from a full name, e.g. "Emmil Saputra" -> "ES". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Badge variant class for a score: ok ≥ 80, plain 60–79, danger < 60. */
function scoreClass(score: number): string {
  if (score >= 80) return "ok";
  if (score >= 60) return "";
  return "danger";
}

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <td className="score">
        <span className="muted mono sc">—</span>
      </td>
    );
  }
  return (
    <td className="score">
      <span className={`badge ${scoreClass(value)} mono sc`.replace("  ", " ")}>
        {value}
      </span>
    </td>
  );
}

export function GradebookTable({
  rows,
  quizKeys,
}: {
  rows: GradebookRow[];
  quizKeys: string[];
}) {
  const [query, setQuery] = useState("");
  const [quizFilter, setQuizFilter] = useState<string>("all");

  const visibleKeys = quizFilter === "all" ? quizKeys : [quizFilter];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentNo.toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <>
      <div className="filterbar">
        <select
          className="select"
          aria-label="Pilih kuis"
          value={quizFilter}
          onChange={(e) => setQuizFilter(e.target.value)}
        >
          <option value="all">Semua pertemuan</option>
          {quizKeys.map((k) => (
            <option key={k} value={k}>
              Kuis {k}
            </option>
          ))}
        </select>
        <div className="input-group">
          <input
            className="input"
            type="search"
            placeholder="Cari siswa…"
            aria-label="Cari siswa"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="trail" aria-label="Cari" type="button">
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
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="stick">Siswa</th>
              {visibleKeys.map((k) => (
                <th key={k} className="score">
                  Kuis {k}
                </th>
              ))}
              <th className="score">Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.studentId}>
                <td className="stick">
                  <div className="scell">
                    <div className="avatar sm">{initialsOf(row.studentName)}</div>
                    <div>
                      <div className="nm">{row.studentName}</div>
                      <div className="nim muted mono">{row.studentNo}</div>
                    </div>
                  </div>
                </td>
                {visibleKeys.map((k) => (
                  <ScoreCell key={k} value={row.quizScores[k] ?? null} />
                ))}
                <ScoreCell value={row.average} />
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={visibleKeys.length + 2} className="muted" style={{ textAlign: "center", padding: "22px" }}>
                  Tidak ada siswa yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
