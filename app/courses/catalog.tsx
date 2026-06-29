"use client";

import { useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/data";

type Filter = "semua" | "terdaftar" | "segera-hadir";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "terdaftar", label: "Terdaftar" },
  { id: "segera-hadir", label: "Segera hadir" },
];

export function Catalog({ courses }: { courses: Course[] }) {
  const [filter, setFilter] = useState<Filter>("semua");

  const visible = courses.filter((c) => {
    if (filter === "terdaftar") return c.isPublished;
    if (filter === "segera-hadir") return !c.isPublished;
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
        {visible.map((c) =>
          c.isPublished ? (
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
                Segera hadir
              </span>
            </div>
          ),
        )}
      </div>
    </>
  );
}
