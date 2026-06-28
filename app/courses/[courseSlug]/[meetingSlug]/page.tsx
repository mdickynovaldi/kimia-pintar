import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCourse, getMeeting } from "@/lib/data";

export const metadata: Metadata = { title: "Pertemuan — Kimia Pintar" };

const meetingStyles = `
  .mlayout { display:grid; grid-template-columns: 1fr; gap:18px; }
  .prose { max-width:68ch; }
  .prose p { margin-bottom:14px; color:var(--fg); }
  .prose ul { padding-left:20px; margin-bottom:14px; display:flex; flex-direction:column; gap:6px; color:var(--fg); }
  .prose .formula { font-family:var(--font-mono); background:var(--surface-2); border:1px solid var(--border); border-radius:var(--r-sm); padding:12px 14px; margin:0 0 14px; font-size:14px; overflow-x:auto; }
  .filerow { display:flex; align-items:center; gap:13px; padding:14px 16px; border:1px solid var(--border); border-radius:var(--r); background:var(--surface-2); margin:6px 0 16px; }
  .filerow .fi { flex:none; width:40px; height:40px; border-radius:var(--r-sm); display:grid; place-items:center; background:var(--surface); border:1px solid var(--border); color:var(--accent-ink); }
  .play { width:64px; height:64px; border-radius:50%; background:rgba(255,255,255,.9); display:grid; place-items:center; box-shadow:var(--shadow); }
  .play svg { width:26px; height:26px; color:#0b3d36; margin-left:3px; }
  .vidwrap { position:relative; }
  .vidwrap .cap { position:absolute; left:10px; bottom:10px; padding:4px 9px; border-radius:999px; background:rgba(8,14,20,.6); color:#fff; font:600 11px/1.4 var(--font-mono); }
  .toc a { display:block; padding:7px 10px; border-radius:var(--r-sm); color:var(--muted); font-size:13.5px; }
  .toc a:hover { background:var(--surface-2); color:var(--fg); text-decoration:none; }
  @media (min-width: 980px) {
    .mlayout { grid-template-columns: 1fr 280px; align-items:start; }
    .rail { position:sticky; top:calc(var(--topbar-h) + 18px); }
  }
`;

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ courseSlug: string; meetingSlug: string }>;
}) {
  const { courseSlug, meetingSlug } = await params;
  const meeting = await getMeeting(courseSlug, meetingSlug);
  if (!meeting) notFound();

  const course = await getCourse(courseSlug);
  const courseTitle = course?.title ?? "Kimia Dasar";

  const material = meeting.materials[0];
  const video = meeting.videos[0];

  return (
    <AppShell
      variant="student"
      crumb={
        <>
          <Link href={`/courses/${courseSlug}`}>{courseTitle}</Link> /{" "}
          <b>{meeting.label}</b>
        </>
      }
    >
      <style>{meetingStyles}</style>

      <div className="mlayout">
        {/* MAIN COLUMN */}
        <div className="stack" style={{ gap: "18px" }}>
          {/* Header */}
          <div className="card card-pad">
            <span className="eyebrow">{meeting.label}</span>
            <h1
              style={{
                fontSize: "clamp(1.5rem,1.2rem+1.4vw,2rem)",
                margin: "6px 0 12px",
              }}
            >
              {meeting.title}
            </h1>
            <div className="row wrap gap-sm">
              <span className="badge accent">
                <span className="dot" />
                Tersedia
              </span>
              <span className="badge">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                ~{meeting.readingMinutes} menit baca
              </span>
            </div>
          </div>

          {/* Materi */}
          <div className="card card-pad" id="materi">
            <h2 style={{ marginBottom: "14px" }}>Materi</h2>
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: material.bodyHtml }}
            />

            {material.attachment ? (
              <div className="filerow">
                <span className="fi">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 3v5h5" />
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  </svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--fg-strong)" }}>
                    {material.attachment.name}
                  </div>
                  <div className="muted" style={{ fontSize: "12.5px" }}>
                    {material.attachment.meta}
                  </div>
                </div>
                <a className="btn btn-sm" href={material.attachment.url}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v12M7 11l5 4 5-4M5 21h14" />
                  </svg>
                  Unduh
                </a>
              </div>
            ) : null}

            <label className="checkrow">
              <input type="checkbox" /> Tandai materi selesai
            </label>
          </div>

          {/* Video */}
          <div className="card card-pad" id="video">
            <h2 style={{ marginBottom: "14px" }}>Video pembelajaran</h2>
            <div className="vidwrap">
              <div className="ph-img aspect-video">
                <div className="play">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <span className="cap">Video pembelajaran · Google Drive</span>
            </div>
            <p className="muted" style={{ fontSize: "13.5px", margin: "14px 0" }}>
              Video diputar langsung dari Google Drive. Jika pemutar tidak muncul,
              buka tautan cadangan di bawah ini.
            </p>
            <a
              className="btn btn-sm"
              href={video.sourceUrl}
              target="_blank"
              rel="noopener"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 3h7v7" />
                <path d="M10 14 21 3" />
                <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
              Buka di Google Drive
            </a>
            <div style={{ marginTop: "16px" }}>
              <label className="checkrow">
                <input type="checkbox" /> Tandai video selesai
              </label>
            </div>
          </div>

          {/* Kuis */}
          <div className="card card-pad" id="kuis">
            <h2 style={{ marginBottom: "14px" }}>Kuis</h2>
            <div className="row between wrap" style={{ gap: "14px" }}>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--fg-strong)",
                    fontSize: "1.05rem",
                  }}
                >
                  Kuis Pertemuan 4 — Termokimia
                </div>
                <div className="muted" style={{ fontSize: "13px", marginTop: "4px" }}>
                  20 menit · 10 soal · 1 percobaan · Nilai lulus 60
                </div>
                <div style={{ marginTop: "8px" }}>
                  <span className="badge">
                    <span className="dot" />
                    Belum dikerjakan
                  </span>
                </div>
              </div>
              {meeting.quizId ? (
                <Link
                  className="btn btn-primary btn-lg"
                  href={`/quiz/${meeting.quizId}`}
                >
                  Mulai kuis
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* SIDE RAIL */}
        <aside className="rail">
          <div className="card card-pad">
            <h4 style={{ marginBottom: "10px" }}>Daftar isi</h4>
            <nav className="toc" style={{ margin: "0 -4px" }}>
              <a href="#materi">Materi</a>
              <a href="#video">Video</a>
              <a href="#kuis">Kuis</a>
            </nav>
            <hr className="divider" />
            <div
              className="row between"
              style={{ fontSize: "13px", marginBottom: "8px" }}
            >
              <span className="muted">Progres pertemuan</span>
              <b>50%</b>
            </div>
            <div className="progress thin">
              <i style={{ width: "50%" }} />
            </div>
            <hr className="divider" />
            <div className="stack" style={{ gap: "8px" }}>
              <Link className="btn btn-sm btn-block" href="/courses/kimia-dasar/ikatan-kimia">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 6l-6 6 6 6" />
                </svg>
                Pertemuan 3
              </Link>
              <Link
                className="btn btn-sm btn-block btn-primary"
                href="/courses/kimia-dasar/laju-reaksi"
              >
                Pertemuan 5
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
