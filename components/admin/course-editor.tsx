"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  deleteMeeting,
  reorderMeetings,
  toggleMeetingPublish,
  updateCourse,
} from "@/app/actions/admin";
import { uploadImage } from "@/app/actions/upload";
import { Check } from "@/components/icons";
import type { Course, Meeting } from "@/lib/data/types";

const PALETTE = [
  "oklch(55% 0.12 178)",
  "oklch(60% 0.1 300)",
  "oklch(58% 0.12 145)",
  "oklch(62% 0.1 60)",
  "oklch(60% 0.12 250)",
  "oklch(60% 0.12 20)",
];

const styles = `
  .ce-grid { display:grid; gap:18px; }
  .swatch-row { display:flex; gap:10px; flex-wrap:wrap; }
  .swatch { width:34px; height:34px; border-radius:9px; border:2px solid var(--border-2); cursor:pointer; padding:0; position:relative; }
  .swatch.on { border-color:var(--fg-strong); box-shadow:0 0 0 3px var(--accent-soft); }
  .cover-prev { height:120px; border-radius:var(--r); display:flex; align-items:flex-end; padding:12px; color:#fff; font-family:var(--font-display); font-weight:700; background-size:cover; background-position:center; }
  .meet-row { display:flex; align-items:center; gap:12px; padding:12px 14px; border:1px solid var(--border); border-radius:var(--r); background:var(--surface); margin-bottom:10px; }
  .meet-row .grab { cursor:grab; color:var(--faint); display:grid; place-items:center; flex:none; touch-action:none; }
  .meet-row .grab:active { cursor:grabbing; }
  .num-chip { width:28px; height:28px; border-radius:8px; background:var(--accent-soft); color:var(--accent-ink); display:grid; place-items:center; font:700 13px/1 var(--font-mono); flex:none; }
  .meet-row .ttl { font-weight:600; flex:1; min-width:0; }
  .meet-row .ttl small { display:block; font-weight:500; color:var(--faint); font-size:12px; }
  .ce-bar { position:sticky; bottom:0; margin:8px -2px -2px; padding:14px clamp(4px,2vw,18px); background:color-mix(in oklch, var(--bg) 86%, transparent); backdrop-filter:blur(12px); border-top:1px solid var(--border); display:flex; align-items:center; justify-content:flex-end; gap:10px; z-index:20; }
`;

function GrabIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" />
    </svg>
  );
}

function MeetingRow({
  m,
  index,
  courseId,
}: {
  m: Meeting;
  index: number;
  courseId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: m.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="meet-row">
      <span className="grab" {...attributes} {...listeners} aria-label="Seret untuk urutkan">
        <GrabIcon />
      </span>
      <span className="num-chip">{String(index + 1).padStart(2, "0")}</span>
      <div className="ttl">
        {m.title}
        <small>{m.isPublished ? "Terbit" : "Draf"}</small>
      </div>
      <form action={toggleMeetingPublish}>
        <input type="hidden" name="id" value={m.id} />
        <input type="hidden" name="course_id" value={courseId} />
        <input type="hidden" name="is_published" value={(!m.isPublished).toString()} />
        <button type="submit" className="btn btn-sm btn-ghost" title={m.isPublished ? "Sembunyikan" : "Terbitkan"}>
          {m.isPublished ? "Sembunyikan" : "Terbitkan"}
        </button>
      </form>
      <Link className="btn btn-sm" href={`/admin/courses/${courseId}/meetings/${m.id}`}>
        Edit
      </Link>
      {m.quizId ? (
        <Link className="btn btn-sm btn-ghost" href={`/admin/quizzes/${m.quizId}`}>
          Kuis
        </Link>
      ) : null}
      <form action={deleteMeeting}>
        <input type="hidden" name="id" value={m.id} />
        <input type="hidden" name="course_id" value={courseId} />
        <button
          type="submit"
          className="icon-btn"
          aria-label="Hapus pertemuan"
          title="Hapus"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
        </button>
      </form>
    </div>
  );
}

export function CourseEditor({
  course,
  meetings: initialMeetings,
}: {
  course: Course;
  meetings: Meeting[];
}) {
  const coverRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(course.title);
  const [code, setCode] = useState(course.code);
  const [description, setDescription] = useState(course.description ?? "");
  const [color, setColor] = useState(course.color);
  const [coverUrl, setCoverUrl] = useState<string>(course.coverImageUrl ?? "");
  const [isPublished, setPublished] = useState(course.isPublished);
  const [meetings, setMeetings] = useState(initialMeetings);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [newMeeting, setNewMeeting] = useState("");

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = meetings.findIndex((m) => m.id === active.id);
    const newIndex = meetings.findIndex((m) => m.id === over.id);
    const next = arrayMove(meetings, oldIndex, newIndex);
    setMeetings(next);
    await reorderMeetings(course.id, next.map((m) => m.id));
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadImage(fd);
    setUploading(false);
    if (res.url) setCoverUrl(res.url);
    else setError(res.error ?? "Gagal mengunggah");
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.set("id", course.id);
    fd.set("title", title);
    fd.set("code", code);
    fd.set("description", description);
    fd.set("color", color);
    fd.set("cover_image_url", coverUrl);
    if (isPublished) fd.set("is_published", "true");
    try {
      await updateCourse(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    }
    setSaving(false);
  }

  return (
    <div className="ce-grid">
      <style>{styles}</style>

      <div className="card card-pad">
        <h3 style={{ marginBottom: 14 }}>Detail mata kuliah</h3>
        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
          <div className="field">
            <label>Judul</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Kode</label>
            <input className="input mono" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Deskripsi</label>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="field">
          <label>Warna aksen</label>
          <div className="swatch-row">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${color === c ? " on" : ""}`}
                style={{ background: c }}
                aria-label={`Warna ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Gambar sampul</label>
          <div
            className="cover-prev"
            style={{ background: coverUrl ? `url(${coverUrl})` : course.coverGradient, backgroundSize: "cover" }}
          >
            {title}
          </div>
          <div className="row gap-sm" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-sm" onClick={() => coverRef.current?.click()} disabled={uploading}>
              {uploading ? "Mengunggah…" : "Pilih gambar sampul"}
            </button>
            {coverUrl ? (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCoverUrl("")}>
                Hapus sampul
              </button>
            ) : null}
            <input ref={coverRef} type="file" accept="image/*" hidden onChange={onCover} />
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h3>Pertemuan</h3>
          <span className="muted" style={{ fontSize: 13 }}>seret untuk mengubah urutan</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={meetings.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            {meetings.map((m, i) => (
              <MeetingRow key={m.id} m={m} index={i} courseId={course.id} />
            ))}
          </SortableContext>
        </DndContext>
        {meetings.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>Belum ada pertemuan.</p>
        ) : null}

        <form
          action={async (fd) => {
            const { createMeeting } = await import("@/app/actions/admin");
            await createMeeting(fd);
            setNewMeeting("");
          }}
          className="row gap-sm"
          style={{ marginTop: 12 }}
        >
          <input type="hidden" name="course_id" value={course.id} />
          <input
            className="input"
            name="title"
            placeholder="Judul pertemuan baru…"
            value={newMeeting}
            onChange={(e) => setNewMeeting(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">Tambah pertemuan</button>
        </form>
      </div>

      <div className="card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div>
          <div style={{ fontWeight: 600 }}>Terbitkan mata kuliah</div>
          <div className="muted" style={{ fontSize: 12 }}>kursus terbit terlihat oleh siswa</div>
        </div>
        <label className="switch">
          <input type="checkbox" checked={isPublished} onChange={(e) => setPublished(e.target.checked)} />
          <span className="track" />
        </label>
      </div>

      <div className="ce-bar">
        {error ? <span className="badge danger" style={{ alignSelf: "center" }}>{error}</span> : null}
        {saved ? <span className="badge ok" style={{ alignSelf: "center" }}><Check /> Tersimpan</span> : null}
        <Link className="btn btn-ghost" href="/admin/courses">Kembali</Link>
        <button type="button" className="btn btn-primary" onClick={saveSettings} disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan mata kuliah"}
        </button>
      </div>
    </div>
  );
}
