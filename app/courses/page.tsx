import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCourses } from "@/lib/data";

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
  const courses = await getCourses();
  const kimiaDasar = courses.find((c) => c.slug === "kimia-dasar")!;
  const comingSoon = courses.filter((c) => !c.isPublished);

  return (
    <AppShell variant="student" crumb={<b>Mata Kuliah</b>}>
      <style>{coursesStyles}</style>

      <div className="page-head">
        <h1>Mata Kuliah</h1>
        <p>
          Jelajahi katalog mata kuliah kimia. Mulai dari Kimia Dasar yang sudah
          aktif, kursus lainnya menyusul.
        </p>
      </div>

      <div className="chips">
        <button className="chip active">Semua</button>
        <button className="chip">Terdaftar</button>
        <button className="chip">Segera hadir</button>
      </div>

      <div className="grid grid-3">
        <Link className="crs" href={`/courses/${kimiaDasar.slug}`}>
          <div className="cap" style={{ background: kimiaDasar.coverGradient }}>
            {kimiaDasar.title}
          </div>
          <div className="row between">
            <div className="ttl">{kimiaDasar.title}</div>
            <span className="badge ok">
              <span className="dot" />
              Terdaftar
            </span>
          </div>
          <div className="muted" style={{ fontSize: "12.5px" }}>
            8 pertemuan · 38% selesai
          </div>
          <div className="progress thin">
            <i style={{ width: "38%" }} />
          </div>
        </Link>

        {comingSoon.map((c) => (
          <div key={c.id} className="crs" style={{ opacity: 0.65, cursor: "default" }}>
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
        ))}
      </div>
    </AppShell>
  );
}
