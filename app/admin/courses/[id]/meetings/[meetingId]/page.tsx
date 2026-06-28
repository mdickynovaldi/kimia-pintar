import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getMeetingById } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";
import { updateMeeting, saveMaterial, saveVideo } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Edit Pertemuan · Admin Kimia Pintar" };

const pageStyles = `
  .head-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .rte-bar { display: flex; flex-wrap: wrap; gap: 4px; padding: 7px; border: 1px solid var(--border-2); border-bottom: 0; border-radius: var(--r-sm) var(--r-sm) 0 0; background: var(--surface-2); }
  .rte-btn { width: 34px; height: 32px; display: grid; place-items: center; border-radius: 7px; border: 0; background: transparent; color: var(--muted); cursor: pointer; font: 700 13px/1 var(--font-body); }
  .rte-btn:hover { background: var(--surface-3); color: var(--fg); }
  .rte-btn svg { width: 17px; height: 17px; }
  .rte-sep { width: 1px; background: var(--border); margin: 4px 2px; }
  .rte-area { border-radius: 0 0 var(--r-sm) var(--r-sm); min-height: 200px; }
  .attach { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border: 1px solid var(--border); border-radius: var(--r); background: var(--surface-2); }
  .attach .ic { width: 36px; height: 36px; border-radius: 9px; background: var(--danger-soft); color: var(--danger); display: grid; place-items: center; flex: none; }
  .attach .nm { flex: 1; min-width: 0; }
  .attach .nm b { display: block; font-size: 14px; }
  .attach .nm span { font-size: 12px; color: var(--faint); }
  .dropzone { border: 1.5px dashed var(--border-2); min-height: 96px; cursor: pointer; padding: 16px; text-align: center; gap: 6px; flex-direction: column; }
  .dropzone:hover { border-color: var(--accent); }
  .id-chip { display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: var(--r-sm); background: var(--surface-3); border: 1px solid var(--border-2); font: 600 12.5px/1 var(--font-mono); color: var(--fg); }
  .id-chip .k { color: var(--faint); font-weight: 500; }
  .vid-prev { position: relative; }
  .vid-prev .play { position: absolute; inset: 0; display: grid; place-items: center; }
  .vid-prev .play .circ { width: 56px; height: 56px; border-radius: 50%; background: rgba(0,0,0,.55); color: #fff; display: grid; place-items: center; }
  .vid-prev .lbl { position: absolute; left: 12px; bottom: 12px; font: 600 11px/1 var(--font-mono); color: #fff; background: rgba(0,0,0,.5); padding: 5px 9px; border-radius: 6px; }
  .switch-field { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
  .switch-field .lbl { font-size: 14px; font-weight: 600; }
  .sticky-bar { position: sticky; bottom: 0; margin: 22px -2px -2px; padding: 14px clamp(4px,2vw,18px); background: color-mix(in oklch, var(--bg) 86%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; z-index: 20; }
`;

export default async function AdminMeetingEditPage({
  params,
}: {
  params: Promise<{ id: string; meetingId: string }>;
}) {
  await requireAdmin();

  const { id, meetingId } = await params;
  const meeting = await getMeetingById(meetingId);
  if (!meeting) notFound();

  const material = meeting.materials[0];
  const video = meeting.videos[0];

  return (
    <AppShell
      variant="admin"
      contentClassName="narrow"
      crumb={
        <>
          <Link href="/admin/courses">Mata Kuliah</Link> /{" "}
          <Link href={`/admin/courses/${id}`}>Kimia Dasar</Link> /{" "}
          <b>{meeting.label}</b>
        </>
      }
    >
      <style>{pageStyles}</style>

      <div className="page-head">
        <div className="row between wrap" style={{ gap: "16px" }}>
          <div>
            <h1>Edit Pertemuan</h1>
            <p>
              {meeting.label} — {meeting.title}
            </p>
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: "18px" }}>
        {/* DETAIL PERTEMUAN */}
        <form action={updateMeeting} id="meeting-form">
          <input type="hidden" name="id" value={meeting.id} />
          <input type="hidden" name="course_id" value={id} />
          <section className="card">
            <div className="card-head">
              <h3>Detail pertemuan</h3>
              <div
                className="row gap-sm"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                <span>Terbit</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="is_published"
                    value="true"
                    defaultChecked={meeting.isPublished}
                  />
                  <span className="track"></span>
                </label>
              </div>
            </div>
            <div className="card-pad">
              <div className="field">
                <label htmlFor="m-judul">Judul</label>
                <input
                  className="input"
                  id="m-judul"
                  name="title"
                  type="text"
                  defaultValue={meeting.title}
                />
              </div>
              <div className="grid grid-2">
                <div className="field">
                  <label htmlFor="m-slug">Slug</label>
                  <input
                    className="input mono"
                    id="m-slug"
                    type="text"
                    defaultValue={meeting.slug}
                    disabled
                  />
                </div>
                <div className="field">
                  <label htmlFor="m-urut">Urutan</label>
                  <input
                    className="input mono"
                    id="m-urut"
                    type="number"
                    defaultValue={meeting.order}
                    min="1"
                    disabled
                  />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="m-desk">Deskripsi</label>
                <textarea
                  className="textarea"
                  id="m-desk"
                  name="description"
                  defaultValue={meeting.description}
                />
              </div>
              <div className="row" style={{ justifyContent: "flex-end", marginTop: "14px" }}>
                <button type="submit" className="btn btn-primary">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <path d="M17 21v-8H7v8M7 3v5h8" />
                  </svg>
                  Simpan detail
                </button>
              </div>
            </div>
          </section>
        </form>

        {/* MATERI */}
        <form action={saveMaterial}>
          <input type="hidden" name="meeting_id" value={meeting.id} />
          {material?.id ? (
            <input type="hidden" name="material_id" value={material.id} />
          ) : null}
          <section className="card">
            <div className="card-head">
              <h3>Materi</h3>
            </div>
            <div className="card-pad">
              <div className="field">
                <label htmlFor="m-mat-judul">Judul materi</label>
                <input
                  className="input"
                  id="m-mat-judul"
                  name="title"
                  type="text"
                  defaultValue={material?.title ?? ""}
                />
              </div>
              <div className="field">
                <label>Isi materi</label>
                <div className="rte-bar" role="toolbar" aria-label="Format teks">
                  <button
                    type="button"
                    className="rte-btn"
                    title="Tebal"
                    style={{ fontWeight: 800 }}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className="rte-btn"
                    title="Miring"
                    style={{ fontStyle: "italic", fontFamily: "var(--font-display)" }}
                  >
                    I
                  </button>
                  <button type="button" className="rte-btn" title="Judul H2">
                    H2
                  </button>
                  <span className="rte-sep"></span>
                  <button type="button" className="rte-btn" title="Daftar">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                  </button>
                  <button type="button" className="rte-btn" title="Tautan">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                    </svg>
                  </button>
                  <button type="button" className="rte-btn" title="Gambar">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </button>
                  <span className="rte-sep"></span>
                  <button type="button" className="rte-btn" title="Rumus / formula">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 4H8.5a2 2 0 0 0-2 2.3l1.4 9.4A2 2 0 0 1 5.9 18H5" />
                      <path d="M19 9l-7 7M12 9l7 7" />
                    </svg>
                  </button>
                </div>
                <textarea
                  className="textarea rte-area"
                  aria-label="Isi materi"
                  name="body"
                  defaultValue={material?.bodyHtml ?? ""}
                />
              </div>

              <label
                className="field-label"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Lampiran
              </label>
              <div className="attach" style={{ marginBottom: "12px" }}>
                <span className="ic">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                    <path d="M14 3v5h5" />
                  </svg>
                </span>
                <div className="nm">
                  <b>Modul Termokimia.pdf</b>
                  <span>2.4 MB · PDF</span>
                </div>
                <button type="button" className="icon-btn" aria-label="Hapus lampiran">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="ph-img dropzone" role="button" tabIndex={0}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V4M7 9l5-5 5 5" />
                  <path d="M5 20h14" />
                </svg>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "var(--muted)",
                    fontSize: "13px",
                  }}
                >
                  Seret berkas atau{" "}
                  <b style={{ color: "var(--accent-ink)" }}>unggah berkas</b>
                </div>
                <div>PDF / DOCX / PPTX · maks 25 MB</div>
              </div>

              <div className="row" style={{ justifyContent: "flex-end", marginTop: "14px" }}>
                <button type="submit" className="btn btn-primary">
                  Simpan materi
                </button>
              </div>
            </div>
          </section>
        </form>

        {/* VIDEO */}
        <form action={saveVideo}>
          <input type="hidden" name="meeting_id" value={meeting.id} />
          {video?.id ? (
            <input type="hidden" name="video_id" value={video.id} />
          ) : null}
          <section className="card">
            <div className="card-head">
              <h3>Video</h3>
            </div>
            <div className="card-pad">
              <div className="field">
                <label htmlFor="v-judul">Judul video</label>
                <input
                  className="input"
                  id="v-judul"
                  name="title"
                  type="text"
                  defaultValue={video?.title ?? ""}
                />
              </div>
              <div className="grid grid-2">
                <div className="field">
                  <label htmlFor="v-prov">Penyedia</label>
                  <select className="select" id="v-prov" defaultValue="Google Drive">
                    <option>Google Drive</option>
                    <option>YouTube</option>
                    <option>Vimeo</option>
                    <option>Tautan langsung (MP4)</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="v-link">Tautan / ID Google Drive</label>
                  <input
                    className="input mono"
                    id="v-link"
                    name="source_url"
                    type="text"
                    defaultValue={video?.sourceUrl ?? ""}
                  />
                </div>
              </div>
              <div className="field">
                <label>ID terdeteksi</label>
                <span className="id-chip">
                  <span className="k">file id</span> {video?.driveFileId ?? "—"}
                </span>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Pratinjau</label>
                <div className="ph-img aspect-video vid-prev">
                  <span className="play">
                    <span className="circ">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                  <span className="lbl">Pratinjau</span>
                </div>
                <span className="hint">
                  Pastikan berbagi: <b>Siapa saja dengan link – Pelihat</b>.
                </span>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", marginTop: "14px" }}>
                <button type="submit" className="btn btn-primary">
                  Simpan video
                </button>
              </div>
            </div>
          </section>
        </form>

        {/* KUIS */}
        <section className="card">
          <div className="card-head">
            <h3>Kuis</h3>
          </div>
          <div className="card-pad">
            <div className="row between wrap" style={{ gap: "14px" }}>
              <div className="row gap-sm">
                <span className="avatar" style={{ borderRadius: "10px" }}>
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
                    <path d="M9 11l3 3 8-8" />
                    <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
                  </svg>
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    Kuis {meeting.label} — {meeting.title}
                  </div>
                  <div className="muted" style={{ fontSize: "13px" }}>
                    10 soal · 20 menit · 1 percobaan
                  </div>
                </div>
              </div>
              {meeting.quizId ? (
                <Link
                  className="btn btn-primary btn-sm"
                  href={`/admin/quizzes/${meeting.quizId}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </svg>
                  Edit kuis
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <div className="sticky-bar">
        <Link className="btn" href={`/admin/courses/${id}`}>
          Batal
        </Link>
        <button type="submit" form="meeting-form" className="btn btn-primary">
          Simpan pertemuan
        </button>
      </div>
    </AppShell>
  );
}
