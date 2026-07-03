import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Tabs } from "@/components/ui/tabs";
import { getCourse, getMeetings, getMyResults } from "@/lib/data";

export const metadata: Metadata = { title: "Kimia Dasar" };

const courseStyles = `
  .hero {
    background: linear-gradient(150deg, oklch(28% 0.06 200), oklch(21% 0.045 235));
    color: #fff; border-radius: var(--r-xl); padding: clamp(22px,3.4vw,34px); position: relative; overflow: hidden; margin-bottom: 24px;
  }
  .hero .eyebrow { color: oklch(85% 0.1 180); }
  .hero h1 { color: #fff; margin: 10px 0 8px; }
  .hero p { color: rgba(255,255,255,.8); max-width: 56ch; }
  .hero .progress { background: rgba(255,255,255,.18); margin: 18px 0 8px; max-width: 420px; }
  .hero .progress > i { background: oklch(82% 0.13 180); }
  .hero .mol { position: absolute; right: -30px; top: -34px; opacity: .14; }
  .hero .hbadges { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; position:relative; }
  .hero .hbadge { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; background:rgba(255,255,255,.12); color:#fff; font:600 12px/1 var(--font-body); }
  .mtg { display:flex; align-items:center; gap:14px; padding:16px 18px; border-bottom:1px solid var(--border); }
  .mtg:last-child { border-bottom:0; }
  .mtg .num { flex:none; width:40px; height:40px; border-radius:var(--r-sm); display:grid; place-items:center; background:var(--surface-2); border:1px solid var(--border); font:700 14px/1 var(--font-mono); color:var(--muted); }
  .mtg .mid { min-width:0; flex:1; }
  .mtg .mtl { font-weight:600; color:var(--fg-strong); }
  .mtg .mmeta { font-size:12px; color:var(--faint); margin-top:2px; }
  .mtg.locked { opacity:.62; }
  .lock { color:var(--faint); width:18px; height:18px; }
`;

const LockIcon = () => (
  <svg
    className="lock"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const [course, meetings, allResults] = await Promise.all([
    getCourse(courseSlug),
    getMeetings(courseSlug),
    getMyResults(),
  ]);
  if (!course) notFound();
  const results = allResults.filter((r) => r.courseTitle === course.title);

  const totalMeetings = meetings.length;
  const completedCount = meetings.filter((m) => m.state === "completed").length;
  const progressPct =
    totalMeetings > 0 ? Math.round((completedCount / totalMeetings) * 100) : 0;
  const quizCount = meetings.filter((m) => m.quizId).length;

  const statusBadge: Record<
    (typeof results)[number]["status"],
    { className: string; label: string }
  > = {
    lulus: { className: "badge ok", label: "Lulus" },
    "belum-lulus": { className: "badge warn", label: "Belum lulus" },
    "belum-dikerjakan": { className: "badge", label: "Belum dikerjakan" },
  };

  const pertemuan = (
    <div className="card">
      {meetings.map((m) => (
        <div
          key={m.id}
          className={`mtg${m.state === "locked" ? " locked" : ""}`}
        >
          <div className="num">{String(m.order).padStart(2, "0")}</div>
          <div className="mid">
            <div className="mtl">{m.title}</div>
            <div className="mmeta">
              {m.materials.length} materi · {m.videos.length} video
              {m.quizId ? " · Kuis" : ""}
            </div>
          </div>
          {m.state === "completed" && (
            <>
              <span className="badge ok">
                <span className="dot" />
                Selesai
              </span>
              <Link
                className="btn btn-sm"
                href={`/courses/${course.slug}/${m.slug}`}
              >
                Buka
              </Link>
            </>
          )}
          {m.state === "available" && (
            <>
              <span className="badge accent">
                <span className="dot" />
                Tersedia
              </span>
              <Link
                className="btn btn-sm btn-primary"
                href={`/courses/${course.slug}/${m.slug}`}
              >
                Lanjutkan
              </Link>
            </>
          )}
          {m.state === "locked" && (
            <>
              <span className="badge">
                <span className="dot" />
                Terkunci
              </span>
              <LockIcon />
            </>
          )}
        </div>
      ))}
    </div>
  );

  const ikhtisar = (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <div className="card card-pad">
        <h3 style={{ marginBottom: "10px" }}>Tentang mata kuliah</h3>
        <p className="muted" style={{ maxWidth: "62ch", marginBottom: "18px" }}>
          Kimia Dasar membangun pemahaman fundamental tentang materi,
          perubahannya, dan energi yang menyertainya. Setiap pertemuan
          menggabungkan teori, contoh soal, dan latihan kuis untuk menguji
          pemahaman.
        </p>
        <h4 style={{ marginBottom: "10px" }}>Capaian pembelajaran</h4>
        <ul
          className="muted"
          style={{
            paddingLeft: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            maxWidth: "62ch",
          }}
        >
          <li>Menghitung mol, massa molar, dan persamaan reaksi setara.</li>
          <li>Menjelaskan konfigurasi elektron dan tabel periodik.</li>
          <li>Membedakan ikatan ion, kovalen, dan logam.</li>
          <li>Menerapkan konsep entalpi pada reaksi eksoterm dan endoterm.</li>
          <li>
            Menganalisis laju reaksi, kesetimbangan, serta reaksi asam-basa dan
            redoks.
          </li>
        </ul>
      </div>
      <div className="card card-pad">
        <h4 style={{ marginBottom: "14px" }}>Pengajar</h4>
        <div className="row gap-sm">
          <div className="avatar lg">BM</div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--fg-strong)" }}>
              Bu Maya
            </div>
            <div className="muted" style={{ fontSize: "13px" }}>
              Dosen Kimia · Kimia Pintar
            </div>
          </div>
        </div>
        <hr className="divider" />
        <p className="muted" style={{ fontSize: "13.5px" }}>
          Mengampu Kimia Dasar dengan fokus pada pendekatan konseptual dan
          latihan terbimbing. Tersedia untuk tanya jawab setiap pertemuan.
        </p>
      </div>
    </div>
  );

  const nilai = (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Pertemuan</th>
            <th>Skor</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, idx) => {
            const badge = statusBadge[r.status];
            return (
              <tr key={r.attemptId ?? `${r.quizId}-${idx}`}>
                <td>
                  {r.meetingLabel} — {r.meetingTitle}
                </td>
                <td className="num">{r.score ?? "—"}</td>
                <td>
                  <span className={badge.className}>
                    <span className="dot" />
                    {badge.label}
                  </span>
                </td>
                <td>
                  {r.attemptId ? (
                    <Link
                      href={`/quiz/${r.quizId}/result/${r.attemptId}`}
                      style={{ fontSize: "13px" }}
                    >
                      Lihat
                    </Link>
                  ) : (
                    <Link
                      href={`/quiz/${r.quizId}`}
                      style={{ fontSize: "13px" }}
                    >
                      Mulai
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppShell
      variant="student"
      crumb={
        <>
          <Link href="/courses">Mata Kuliah</Link> / <b>{course.title}</b>
        </>
      }
    >
      <style>{courseStyles}</style>

      <section className="hero">
        <svg
          className="mol"
          width="220"
          height="220"
          viewBox="0 0 200 200"
          fill="none"
          stroke="#fff"
          strokeWidth={1.5}
        >
          <circle cx="60" cy="60" r="14" />
          <circle cx="140" cy="60" r="14" />
          <circle cx="100" cy="130" r="14" />
          <path d="M74 60h52M68 72 92 118M132 72 108 118" />
        </svg>
        <span className="eyebrow">{course.slug.toUpperCase()}</span>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        <div className="progress">
          <i style={{ width: `${progressPct}%` }} />
        </div>
        <div
          className="row gap-sm"
          style={{ fontSize: "13px", color: "rgba(255,255,255,.78)" }}
        >
          <span>{progressPct}% selesai</span>
          <span>·</span>
          <span>
            {completedCount} dari {totalMeetings} pertemuan
          </span>
        </div>
        <div className="hbadges">
          <span className="hbadge">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            Bu Maya
          </span>
          <span className="hbadge">{totalMeetings} pertemuan</span>
          <span className="hbadge">{quizCount} kuis</span>
          <span className="hbadge">
            <span
              className="dot"
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "oklch(82% 0.13 158)",
              }}
            />
            Terdaftar
          </span>
        </div>
      </section>

      <Tabs
        items={[
          { id: "pertemuan", label: "Pertemuan", content: pertemuan },
          { id: "ikhtisar", label: "Ikhtisar", content: ikhtisar },
          { id: "nilai", label: "Nilai", content: nilai },
        ]}
      />
    </AppShell>
  );
}
