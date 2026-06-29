import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompleteToggle } from "@/components/student/complete-toggle";
import {
  getContentProgress,
  getCourse,
  getMeeting,
  getMeetings,
  getQuiz,
} from "@/lib/data";

const meetingStyles = `
  .mlayout { display:grid; grid-template-columns: 1fr; gap:18px; }
  .prose { max-width:68ch; }
  .prose p { margin-bottom:14px; color:var(--fg); }
  .prose ul, .prose ol { padding-left:20px; margin-bottom:14px; display:flex; flex-direction:column; gap:6px; color:var(--fg); }
  .prose ul { list-style:disc; } .prose ol { list-style:decimal; }
  .prose h2 { font-size:1.25rem; margin:14px 0 8px; } .prose h3 { font-size:1.08rem; margin:12px 0 6px; }
  .prose img { max-width:100%; border-radius:var(--r-sm); margin:6px 0; }
  .prose a { color:var(--accent-2); text-decoration:underline; }
  .prose .formula { font-family:var(--font-mono); background:var(--surface-2); border:1px solid var(--border); border-radius:var(--r-sm); padding:12px 14px; margin:0 0 14px; font-size:14px; overflow-x:auto; }
  .filerow { display:flex; align-items:center; gap:13px; padding:14px 16px; border:1px solid var(--border); border-radius:var(--r); background:var(--surface-2); margin:6px 0 16px; }
  .filerow .fi { flex:none; width:40px; height:40px; border-radius:var(--r-sm); display:grid; place-items:center; background:var(--surface); border:1px solid var(--border); color:var(--accent-ink); }
  .vidframe { width:100%; aspect-ratio:16/9; border:0; border-radius:var(--r); background:#000; display:block; }
  .vidwrap { position:relative; }
  .vidwrap .cap { position:absolute; left:10px; bottom:10px; padding:4px 9px; border-radius:999px; background:rgba(8,14,20,.6); color:#fff; font:600 11px/1.4 var(--font-mono); }
  .play { width:64px; height:64px; border-radius:50%; background:rgba(255,255,255,.9); display:grid; place-items:center; box-shadow:var(--shadow); }
  .play svg { width:26px; height:26px; color:#0b3d36; margin-left:3px; }
  .toc a { display:block; padding:7px 10px; border-radius:var(--r-sm); color:var(--muted); font-size:13.5px; }
  .toc a:hover { background:var(--surface-2); color:var(--fg); text-decoration:none; }
  @media (min-width: 980px) {
    .mlayout { grid-template-columns: 1fr 280px; align-items:start; }
    .rail { position:sticky; top:calc(var(--topbar-h) + 18px); }
  }
`;

function embedUrl(video: { provider: string; driveFileId: string | null; sourceUrl: string }): string | null {
  if (video.provider === "google_drive") {
    const id =
      video.driveFileId ||
      video.sourceUrl.match(/\/file\/d\/([\w-]+)/)?.[1] ||
      video.sourceUrl.match(/[?&]id=([\w-]+)/)?.[1];
    return id ? `https://drive.google.com/file/d/${id}/preview` : null;
  }
  const yt = video.sourceUrl.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/)?.[1];
  return yt ? `https://www.youtube.com/embed/${yt}` : null;
}

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ courseSlug: string; meetingSlug: string }>;
}) {
  const { courseSlug, meetingSlug } = await params;
  const meeting = await getMeeting(courseSlug, meetingSlug);
  if (!meeting) notFound();

  const [course, allMeetings, completedIds] = await Promise.all([
    getCourse(courseSlug),
    getMeetings(courseSlug),
    getContentProgress(meeting.id),
  ]);
  const courseTitle = course?.title ?? "Kimia Dasar";
  const quiz = meeting.quizId ? await getQuiz(meeting.quizId) : undefined;

  const material = meeting.materials[0];
  const video = meeting.videos[0];
  const done = new Set(completedIds);

  // progress = completed items / total content items
  const items = [material?.id, video?.id].filter(Boolean) as string[];
  const doneCount = items.filter((id) => done.has(id)).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const idx = allMeetings.findIndex((m) => m.id === meeting.id);
  const prev = idx > 0 ? allMeetings[idx - 1] : null;
  const next = idx >= 0 && idx < allMeetings.length - 1 ? allMeetings[idx + 1] : null;

  const vidEmbed = video ? embedUrl(video) : null;

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
        <div className="stack" style={{ gap: "18px" }}>
          <div className="card card-pad">
            <span className="eyebrow">{meeting.label}</span>
            <h1 style={{ fontSize: "clamp(1.5rem,1.2rem+1.4vw,2rem)", margin: "6px 0 12px" }}>
              {meeting.title}
            </h1>
            <div className="row wrap gap-sm">
              <span className="badge accent"><span className="dot" />Tersedia</span>
              <span className="badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                ~{meeting.readingMinutes} menit baca
              </span>
            </div>
          </div>

          {/* Materi */}
          {material ? (
            <div className="card card-pad" id="materi">
              <h2 style={{ marginBottom: "14px" }}>Materi</h2>
              <div className="prose" dangerouslySetInnerHTML={{ __html: material.bodyHtml }} />

              {material.attachment ? (
                <div className="filerow">
                  <span className="fi">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "var(--fg-strong)" }}>{material.attachment.name}</div>
                    <div className="muted" style={{ fontSize: "12.5px" }}>{material.attachment.meta}</div>
                  </div>
                  <a className="btn btn-sm" href={material.attachment.url} target="_blank" rel="noopener">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 4 5-4M5 21h14" /></svg>
                    Unduh
                  </a>
                </div>
              ) : null}

              <CompleteToggle meetingId={meeting.id} itemType="material" itemId={material.id} initialDone={done.has(material.id)} label="Tandai materi selesai" />
            </div>
          ) : null}

          {/* Video */}
          {video ? (
            <div className="card card-pad" id="video">
              <h2 style={{ marginBottom: "14px" }}>Video pembelajaran</h2>
              {vidEmbed ? (
                <iframe className="vidframe" src={vidEmbed} allow="autoplay" allowFullScreen title={video.title} />
              ) : (
                <div className="vidwrap">
                  <div className="ph-img aspect-video">
                    <div className="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div>
                  </div>
                  <span className="cap">Video belum tersedia</span>
                </div>
              )}
              {video.sourceUrl ? (
                <a className="btn btn-sm" style={{ marginTop: 14 }} href={video.sourceUrl} target="_blank" rel="noopener">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 3h7v7" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>
                  Buka di sumber video
                </a>
              ) : null}
              <div style={{ marginTop: "16px" }}>
                <CompleteToggle meetingId={meeting.id} itemType="video" itemId={video.id} initialDone={done.has(video.id)} label="Tandai video selesai" />
              </div>
            </div>
          ) : null}

          {/* Kuis */}
          {meeting.quizId && quiz ? (
            <div className="card card-pad" id="kuis">
              <h2 style={{ marginBottom: "14px" }}>Kuis</h2>
              <div className="row between wrap" style={{ gap: "14px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--fg-strong)", fontSize: "1.05rem" }}>{quiz.title}</div>
                  <div className="muted" style={{ fontSize: "13px", marginTop: "4px" }}>
                    {quiz.timeLimitMinutes ?? "∞"} menit · {quiz.questions.length} soal · {quiz.maxAttempts ?? "∞"} percobaan · Nilai lulus {quiz.passingScore}
                  </div>
                </div>
                <Link className="btn btn-primary btn-lg" href={`/quiz/${meeting.quizId}`}>Mulai kuis</Link>
              </div>
            </div>
          ) : null}
        </div>

        {/* SIDE RAIL */}
        <aside className="rail">
          <div className="card card-pad">
            <h4 style={{ marginBottom: "10px" }}>Daftar isi</h4>
            <nav className="toc" style={{ margin: "0 -4px" }}>
              {material ? <a href="#materi">Materi</a> : null}
              {video ? <a href="#video">Video</a> : null}
              {meeting.quizId ? <a href="#kuis">Kuis</a> : null}
            </nav>
            <hr className="divider" />
            <div className="row between" style={{ fontSize: "13px", marginBottom: "8px" }}>
              <span className="muted">Progres pertemuan</span>
              <b>{pct}%</b>
            </div>
            <div className="progress thin"><i style={{ width: `${pct}%` }} /></div>
            <hr className="divider" />
            <div className="stack" style={{ gap: "8px" }}>
              {prev ? (
                <Link className="btn btn-sm btn-block" href={`/courses/${courseSlug}/${prev.slug}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                  {prev.label}
                </Link>
              ) : null}
              {next ? (
                <Link className="btn btn-sm btn-block btn-primary" href={`/courses/${courseSlug}/${next.slug}`}>
                  {next.label}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </Link>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
