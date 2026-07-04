"use client";

import { useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/data";

type Filter = "semua" | "terdaftar" | "segera-hadir";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "terdaftar", label: "Terdaftar" },
  { id: "segera-hadir", label: "Lainnya" },
];

/** `enrolledIds` comes from the student's REAL enrollments — a published
 * course the student isn't enrolled in shows as "Belum terdaftar", not as an
 * enrolled course. */
export function Catalog({
  courses,
  enrolledIds,
}: {
  courses: Course[];
  enrolledIds: string[];
}) {
  const [filter, setFilter] = useState<Filter>("semua");
  const enrolled = new Set(enrolledIds);
  const isEnrolled = (c: Course) => c.isPublished && enrolled.has(c.id);

  const visible = courses.filter((c) => {
    if (filter === "terdaftar") return isEnrolled(c);
    if (filter === "segera-hadir") return !isEnrolled(c);
    return true;
  });

  return (
    <>
      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip${filter === f.id ? " active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-3">
        {visible.length === 0 ? (
          <p className="muted" style={{ fontSize: "13.5px" }}>
            Tidak ada mata kuliah pada filter ini.
          </p>
        ) : null}
        {visible.map((c) =>
          isEnrolled(c) ? (
            <Link key={c.id} className="crs" href={`/courses/${c.slug}`}>
              <div className="cap" style={{ background: c.coverGradient }}>
                {c.title}
              </div>
              <div className="row between">
                <div className="ttl">{c.title}</div>
                <span className="badge ok">
                  <span className="dot" />
                  Terdaftar
                </span>
              </div>
              <div className="muted" style={{ fontSize: "12.5px" }}>
                {c.meetingCount} pertemuan
              </div>
            </Link>
          ) : (
            <div
              key={c.id}
              className="crs"
              style={{ opacity: 0.65, cursor: "default" }}
            >
              <div className="cap" style={{ background: c.coverGradient }}>
                {c.title}
              </div>
              <div className="ttl">{c.title}</div>
              <div className="muted" style={{ fontSize: "12.5px" }}>
                Belum terdaftar
              </div>
              <span className="badge warn" style={{ alignSelf: "flex-start" }}>
                <span className="dot" />
                {c.isPublished ? "Hubungi admin" : "Segera hadir"}
              </span>
            </div>
          ),
        )}
      </div>
    </>
  );
}
