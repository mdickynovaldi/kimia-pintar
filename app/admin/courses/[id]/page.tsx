import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Tabs } from "@/components/ui/tabs";
import { getCourseById, getMeetingsByCourseId } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";
import {
  updateCourse,
  createMeeting,
  deleteMeeting,
} from "@/app/actions/admin";

export const metadata: Metadata = { title: "Edit Mata Kuliah · Admin Kimia Pintar" };

const pageStyles = `
  .head-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .swatch-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .swatch { width: 34px; height: 34px; border-radius: 9px; border: 2px solid var(--border-2); cursor: pointer; padding: 0; position: relative; }
  .swatch.on { border-color: var(--fg-strong); box-shadow: 0 0 0 3px var(--accent-soft); }
  .swatch.on::after { content: ''; position: absolute; inset: 0; display: grid; place-items: center; }
  .dropzone { border: 1.5px dashed var(--border-2); min-height: 130px; cursor: pointer; padding: 18px; text-align: center; gap: 8px; flex-direction: column; }
  .dropzone:hover { border-color: var(--accent); }
  .switch-field { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--r); background: var(--surface-2); }
  .switch-field .lbl { font-size: 14px; font-weight: 600; }
  .switch-field .hint { font-size: 12px; color: var(--faint); margin-top: 2px; }
  .meet-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--r); background: var(--surface); margin-bottom: 10px; }
  .meet-row .grab { cursor: grab; color: var(--faint); display: grid; place-items: center; flex: none; }
  .meet-row .grab:active { cursor: grabbing; }
  .num-chip { width: 28px; height: 28px; border-radius: 8px; background: var(--accent-soft); color: var(--accent-ink); display: grid; place-items: center; font: 700 13px/1 var(--font-mono); flex: none; }
  .meet-row .ttl { font-weight: 600; flex: 1; min-width: 0; }
  .meet-row .ttl small { display: block; font-weight: 500; color: var(--faint); font-size: 12px; }
  .meet-actions { display: flex; align-items: center; gap: 8px; flex: none; }
  @media (max-width: 560px) { .meet-row .ttl small { display: none; } }
`;

function GrabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </svg>
  );
}

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) notFound();
  const meetings = await getMeetingsByCourseId(id);

  const detailPanel = (
    <div className="card card-pad" style={{ maxWidth: "720px" }}>
      <form id="course-form" action={updateCourse}>
        <input type="hidden" name="id" value={course.id} />
        <div className="field">
          <label htmlFor="c-judul">Judul</label>
          <input className="input" id="c-judul" name="title" type="text" defaultValue={course.title} />
        </div>
        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="c-kode">Kode</label>
            <input className="input mono" id="c-kode" name="code" type="text" defaultValue={course.code} />
          </div>
          <div className="field">
            <label htmlFor="c-slug">Slug</label>
            <input className="input mono" id="c-slug" type="text" defaultValue={course.slug} readOnly />
            <span className="hint">kimiapintar.id/kursus/{course.slug}</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="c-desk">Deskripsi</label>
          <textarea className="textarea" id="c-desk" name="description" defaultValue={course.description} />
        </div>
        <div className="field">
          <label>Warna aksen</label>
          <input type="hidden" name="color" defaultValue={course.color} />
          <div className="swatch-row" role="radiogroup" aria-label="Warna aksen">
            <button type="button" className="swatch on" style={{ background: "oklch(58% 0.11 178)" }} aria-label="Teal" aria-pressed="true"></button>
            <button type="button" className="swatch" style={{ background: "oklch(56% 0.13 255)" }} aria-label="Biru"></button>
            <button type="button" className="swatch" style={{ background: "oklch(60% 0.1 300)" }} aria-label="Ungu"></button>
            <button type="button" className="swatch" style={{ background: "oklch(62% 0.1 60)" }} aria-label="Oranye"></button>
            <button type="button" className="swatch" style={{ background: "oklch(58% 0.13 155)" }} aria-label="Hijau"></button>
            <button type="button" className="swatch" style={{ background: "oklch(58% 0.18 25)" }} aria-label="Merah"></button>
          </div>
        </div>
        <div className="field">
          <label>Gambar sampul</label>
          <div className="ph-img dropzone" role="button" tabIndex={0}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15l-5-5L5 21" />
              <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <circle cx="8.5" cy="8.5" r="1.5" />
            </svg>
            <div style={{ fontFamily: "var(--font-body)", color: "var(--muted)", fontSize: "13px" }}>
              Seret berkas ke sini atau <b style={{ color: "var(--accent-ink)" }}>pilih gambar</b>
            </div>
            <div>PNG / JPG · maks 2 MB · rasio 16:9</div>
          </div>
        </div>
        <div className="switch-field">
          <div>
            <div className="lbl">Terbit mata kuliah</div>
            <div className="hint">Saat aktif, kursus tampil di katalog siswa.</div>
          </div>
          <label className="switch">
            <input type="checkbox" name="is_published" value="true" defaultChecked={course.isPublished} />
            <span className="track"></span>
          </label>
        </div>
      </form>
    </div>
  );

  const pertemuanPanel = (
    <div className="card card-pad" style={{ maxWidth: "820px" }}>
      <div className="row between wrap" style={{ marginBottom: "16px", gap: "10px" }}>
        <div>
          <h3 style={{ marginBottom: "2px" }}>Daftar pertemuan</h3>
          <span className="faint" style={{ fontSize: "13px" }}>
            {meetings.length} pertemuan · seret untuk mengubah urutan
          </span>
        </div>
        <form action={createMeeting} className="row gap-sm wrap" style={{ alignItems: "center" }}>
          <input type="hidden" name="course_id" value={course.id} />
          <input className="input" name="title" type="text" placeholder="Judul pertemuan baru" />
          <button type="submit" className="btn btn-primary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Tambah pertemuan
          </button>
        </form>
      </div>

      <div role="list">
        {meetings.map((m) => (
          <div className="meet-row" role="listitem" draggable="true" key={m.id}>
            <span className="grab" aria-label="Seret">
              <GrabIcon />
            </span>
            <span className="num-chip">{m.order}</span>
            <div className="ttl">
              {m.title} <small>{m.description}</small>
            </div>
            <div className="meet-actions">
              <label className="switch" title="Status terbit">
                <input type="checkbox" defaultChecked={m.isPublished} disabled />
                <span className="track"></span>
              </label>
              {m.quizId ? (
                <Link className="btn btn-sm btn-ghost" href={`/admin/quizzes/${m.quizId}`}>
                  Kuis
                </Link>
              ) : null}
              <Link className="btn btn-sm btn-ghost" href={`/admin/courses/${course.id}/meetings/${m.id}`}>
                Edit
              </Link>
              <form action={deleteMeeting}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="course_id" value={course.id} />
                <button type="submit" className="icon-btn" aria-label="Hapus">
                  <TrashIcon />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const pendaftaranPanel = (
    <div className="card card-pad" style={{ maxWidth: "820px" }}>
      <div className="row between wrap" style={{ marginBottom: "16px", gap: "10px" }}>
        <div>
          <h3 style={{ marginBottom: "2px" }}>Pendaftaran</h3>
          <span className="faint" style={{ fontSize: "13px" }}>
            <b style={{ color: "var(--fg)" }}>42 siswa</b> terdaftar di {course.title}
          </span>
        </div>
        <Link className="btn btn-sm" href="/admin/enrollments">
          Kelola pendaftaran →
        </Link>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Siswa</th>
              <th>Email</th>
              <th>Progres</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="row gap-sm">
                  <span className="avatar sm">ES</span>Emmil Saputra
                </div>
              </td>
              <td className="muted">emmil@siswa.id</td>
              <td className="mono">38%</td>
              <td>
                <span className="badge ok">
                  <span className="dot"></span>Aktif
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <div className="row gap-sm">
                  <span className="avatar sm">DR</span>Dewi Rahma
                </div>
              </td>
              <td className="muted">dewi@siswa.id</td>
              <td className="mono">75%</td>
              <td>
                <span className="badge ok">
                  <span className="dot"></span>Aktif
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <div className="row gap-sm">
                  <span className="avatar sm">FA</span>Fajar Anwar
                </div>
              </td>
              <td className="muted">fajar@siswa.id</td>
              <td className="mono">12%</td>
              <td>
                <span className="badge warn">
                  <span className="dot"></span>Tertinggal
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <div className="row gap-sm">
                  <span className="avatar sm">NK</span>Nadia Kusuma
                </div>
              </td>
              <td className="muted">nadia@siswa.id</td>
              <td className="mono">88%</td>
              <td>
                <span className="badge ok">
                  <span className="dot"></span>Aktif
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="center" style={{ marginTop: "14px" }}>
        <Link href="/admin/enrollments" style={{ fontSize: "13px" }}>
          Lihat 42 siswa terdaftar →
        </Link>
      </div>
    </div>
  );

  return (
    <AppShell
      variant="admin"
      crumb={
        <>
          <Link href="/admin/courses">Mata Kuliah</Link> / <b>{course.title}</b>
        </>
      }
    >
      <style>{pageStyles}</style>

      <div className="page-head">
        <div className="row between wrap" style={{ gap: "16px" }}>
          <div>
            <h1>Edit Mata Kuliah</h1>
            <p>Kelola detail, pertemuan, dan pendaftaran untuk {course.title}.</p>
          </div>
          <div className="head-actions">
            <div className="switch-field" style={{ padding: "8px 12px", background: "transparent", border: 0 }}>
              <span className="lbl">Terbit</span>
              <label className="switch">
                <input type="checkbox" name="is_published" value="true" form="course-form" defaultChecked={course.isPublished} />
                <span className="track"></span>
              </label>
            </div>
            <button type="submit" form="course-form" className="btn btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <path d="M17 21v-8H7v8M7 3v5h8" />
              </svg>
              Simpan
            </button>
          </div>
        </div>
      </div>

      <Tabs
        items={[
          { id: "detail", label: "Detail", content: detailPanel },
          { id: "pertemuan", label: "Pertemuan", content: pertemuanPanel },
          { id: "pendaftaran", label: "Pendaftaran", content: pendaftaranPanel },
        ]}
      />
    </AppShell>
  );
}
