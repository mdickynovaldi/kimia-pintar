"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { saveMeeting } from "@/app/actions/admin";
import { uploadAttachment } from "@/app/actions/upload";
import { Check } from "@/components/icons";
import type { Meeting } from "@/lib/data/types";

const styles = `
  .me-grid { display:grid; gap:18px; }
  .attach { display:flex; align-items:center; gap:12px; padding:11px 14px; border:1px solid var(--border); border-radius:var(--r); background:var(--surface-2); }
  .attach .ic { width:36px; height:36px; border-radius:9px; background:var(--danger-soft); color:var(--danger); display:grid; place-items:center; flex:none; }
  .attach .nm { flex:1; min-width:0; }
  .attach .nm b { display:block; font-size:14px; }
  .attach .nm span { font-size:12px; color:var(--faint); }
  .id-chip { display:inline-flex; align-items:center; gap:7px; padding:6px 10px; border-radius:var(--r-sm); background:var(--surface-3); border:1px solid var(--border-2); font:600 12.5px/1 var(--font-mono); color:var(--fg); }
  .id-chip .k { color:var(--faint); font-weight:500; }
  .vid-prev { position:relative; border-radius:var(--r); overflow:hidden; border:1px solid var(--border); }
  .vid-prev iframe { width:100%; aspect-ratio:16/9; display:block; border:0; }
  .switch-field { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:12px 14px; border:1px solid var(--border); border-radius:var(--r); background:var(--surface-2); }
  .switch-field .lbl { font-size:14px; font-weight:600; }
  .me-bar { position:sticky; bottom:0; margin:22px -2px -2px; padding:14px clamp(4px,2vw,18px); background:color-mix(in oklch, var(--bg) 86%, transparent); backdrop-filter:blur(12px); border-top:1px solid var(--border); display:flex; align-items:center; justify-content:flex-end; gap:10px; z-index:20; }
`;

function extractDriveId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/\/file\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
  if (m) return m[1];
  if (/^[\w-]{12,}$/.test(url)) return url;
  return null;
}
function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

function pathFromUrl(u?: string): string | null {
  if (!u) return null;
  const m = u.match(/[?&]path=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : u; // full http url stored as-is
}

export function MeetingEditor({
  meeting,
  courseId,
  quizMeta,
}: {
  meeting: Meeting;
  courseId: string;
  quizMeta?: { questions: number; minutes: number | null; attempts: number | null };
}) {
  const mat = meeting.materials[0];
  const vid = meeting.videos[0];
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(meeting.title);
  const [description, setDescription] = useState(meeting.description ?? "");
  const [isPublished, setPublished] = useState(meeting.isPublished);
  const [matTitle, setMatTitle] = useState(mat?.title ?? meeting.title);
  const [body, setBody] = useState(mat?.bodyHtml ?? "");
  const [attachment, setAttachment] = useState<{ path: string; name: string; meta: string } | null>(
    mat?.attachment
      ? { path: pathFromUrl(mat.attachment.url) ?? "", name: mat.attachment.name, meta: mat.attachment.meta }
      : null,
  );
  const vidTitle = vid?.title ?? `Video pembelajaran — ${meeting.title}`;
  const [provider, setProvider] = useState<string>(vid?.provider ?? "google_drive");
  const [sourceUrl, setSourceUrl] = useState(vid?.sourceUrl ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const driveId = provider === "google_drive" ? extractDriveId(sourceUrl) : null;
  const yt = provider === "youtube" ? ytId(sourceUrl) : null;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadAttachment(fd);
    setUploading(false);
    if (res.path) setAttachment({ path: res.path, name: res.name ?? "Lampiran", meta: res.meta ?? "" });
    else setError(res.error ?? "Gagal mengunggah berkas");
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await saveMeeting({
      meetingId: meeting.id,
      courseId,
      title,
      description,
      isPublished,
      material: {
        id: mat?.id,
        title: matTitle,
        bodyHtml: body,
        attachmentUrl: attachment ? attachment.path : null,
      },
      video: { id: vid?.id, title: vidTitle, provider, sourceUrl },
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else setError(res.error ?? "Gagal menyimpan");
  }

  return (
    <div className="me-grid">
      <style>{styles}</style>

      {/* Detail */}
      <div className="card card-pad">
        <h3 style={{ marginBottom: 14 }}>Detail pertemuan</h3>
        <div className="field">
          <label>Judul</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Deskripsi singkat</label>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {/* Material */}
      <div className="card card-pad">
        <h3 style={{ marginBottom: 14 }}>Materi</h3>
        <div className="field">
          <label>Judul materi</label>
          <input className="input" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Isi materi</label>
          <RichTextEditor value={body} onChange={setBody} placeholder="Tulis materi pembelajaran…" />
        </div>

        <label>Lampiran</label>
        {attachment ? (
          <div className="attach" style={{ marginTop: 6 }}>
            <span className="ic">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>
            </span>
            <div className="nm">
              <b>{attachment.name}</b>
              <span>{attachment.meta}</span>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAttachment(null)}>
              Hapus
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-sm" style={{ marginTop: 6 }} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Mengunggah…" : "Unggah berkas (PDF/slide/gambar)"}
          </button>
        )}
        <input ref={fileRef} type="file" hidden onChange={onPickFile} accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" />
      </div>

      {/* Video */}
      <div className="card card-pad">
        <h3 style={{ marginBottom: 14 }}>Video pembelajaran</h3>
        <div className="row gap-sm" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 160 }}>
            <label>Penyedia</label>
            <select className="select" value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="google_drive">Google Drive</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 220 }}>
            <label>Tautan video</label>
            <input className="input" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://drive.google.com/file/d/…/view" />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <span className="id-chip">
            <span className="k">ID terdeteksi:</span>
            {driveId ?? yt ?? "—"}
          </span>
        </div>
        {(driveId || yt) && (
          <div className="vid-prev" style={{ marginTop: 12 }}>
            <iframe
              src={driveId ? `https://drive.google.com/file/d/${driveId}/preview` : `https://www.youtube.com/embed/${yt}`}
              allow="autoplay"
              allowFullScreen
              title="Pratinjau video"
            />
          </div>
        )}
      </div>

      {/* Quiz */}
      <div className="card card-pad">
        <div className="row between wrap" style={{ gap: 14 }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>Kuis pertemuan</h3>
            <div className="muted" style={{ fontSize: 13 }}>
              {quizMeta
                ? `${quizMeta.questions} soal · ${quizMeta.minutes ?? "∞"} menit · ${quizMeta.attempts ?? "∞"} percobaan`
                : "Belum ada kuis untuk pertemuan ini."}
            </div>
          </div>
          {meeting.quizId ? (
            <Link className="btn btn-primary" href={`/admin/quizzes/${meeting.quizId}`}>
              Buka pembuat kuis
            </Link>
          ) : null}
        </div>
      </div>

      <div className="switch-field">
        <div>
          <div className="lbl">Terbitkan pertemuan</div>
          <div className="muted" style={{ fontSize: 12 }}>siswa hanya melihat pertemuan terbit</div>
        </div>
        <label className="switch">
          <input type="checkbox" checked={isPublished} onChange={(e) => setPublished(e.target.checked)} />
          <span className="track" />
        </label>
      </div>

      <div className="me-bar">
        {error ? <span className="badge danger" style={{ alignSelf: "center" }}>{error}</span> : null}
        {saved ? <span className="badge ok" style={{ alignSelf: "center" }}><Check /> Tersimpan</span> : null}
        <Link className="btn btn-ghost" href={`/admin/courses/${courseId}`}>Kembali</Link>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving || uploading}>
          {saving ? "Menyimpan…" : "Simpan pertemuan"}
        </button>
      </div>
    </div>
  );
}
