import Link from "next/link";
import { AppShell } from "@/components/app-shell";

const pageStyles = `
  .head-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
  @media (max-width: 620px) { .form-grid { grid-template-columns: 1fr; } }
  .switch-field { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--r); background: var(--surface-2); margin-bottom: 12px; }
  .switch-field .lbl { font-size: 13.5px; font-weight: 600; }
  .switch-field .hint { font-size: 11.5px; color: var(--faint); margin-top: 1px; }
  .type-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .type-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--border-2); background: var(--surface); color: var(--fg); font: 600 13px/1 var(--font-body); cursor: pointer; }
  .type-chip:hover { border-color: var(--accent); color: var(--accent-ink); background: var(--accent-soft); }
  .type-chip svg { width: 14px; height: 14px; }

  .q-card { border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--shadow-sm); margin-bottom: 16px; }
  .q-head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .q-head .grab { cursor: grab; color: var(--faint); display: grid; place-items: center; flex: none; }
  .q-head .grab:active { cursor: grabbing; }
  .q-head .num { font: 700 13px/1 var(--font-mono); color: var(--muted); }
  .q-head .spacer { flex: 1; }
  .q-body { padding: 16px; }
  .prompt-box { width: 100%; padding: 11px 13px; border-radius: var(--r-sm); border: 1px solid var(--border-2); background: var(--surface-2); color: var(--fg-strong); font: 600 15px/1.45 var(--font-body); min-height: 46px; }
  .prompt-box:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); background: var(--surface); }
  .opt-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--r-sm); margin-bottom: 8px; background: var(--surface); }
  .opt-row.correct { border-color: var(--success); background: var(--success-soft); }
  .opt-row .mark { width: 18px; height: 18px; accent-color: var(--accent); flex: none; }
  .opt-row .opt-input { flex: 1; border: 0; background: transparent; color: var(--fg); font: 14px/1.4 var(--font-body); padding: 4px 2px; }
  .opt-row .opt-input:focus { outline: none; }
  .opt-row .tag-ok { font: 600 11px/1 var(--font-body); color: var(--success); display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; flex: none; }
  .opt-row .tag-ok svg { width: 13px; height: 13px; }
  .opt-row .del { width: 30px; height: 30px; border: 0; background: transparent; color: var(--faint); border-radius: 6px; cursor: pointer; display: grid; place-items: center; flex: none; }
  .opt-row .del:hover { color: var(--danger); background: var(--danger-soft); }
  .pts { width: 92px; }
  .q-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 16px; border-top: 1px solid var(--border); background: var(--surface-2); border-radius: 0 0 var(--r-lg) var(--r-lg); }
  .sticky-bar { position: sticky; bottom: 0; margin: 22px 0 -2px; padding: 14px clamp(4px,2vw,18px); background: color-mix(in oklch, var(--bg) 86%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; z-index: 20; }
  .pts-field { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
  .pts-field .input { width: 76px; }
`;

export default async function AdminQuizBuilderPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  await params;

  return (
    <AppShell
      variant="admin"
      crumb={
        <>
          <Link href="/admin/courses">Mata Kuliah</Link> /{" "}
          <Link href="/admin/courses/crs-dasar">Kimia Dasar</Link> /{" "}
          <b>Kuis Pertemuan 4</b>
        </>
      }
    >
      <style>{pageStyles}</style>

      <div className="page-head">
        <h1>Pembuat Kuis</h1>
        <p>Kuis Pertemuan 4 — Termokimia · Kimia Dasar</p>
      </div>

      {/* SETTINGS */}
      <section className="card" style={{ marginBottom: "20px" }}>
        <div className="card-head">
          <h3>Setelan kuis</h3>
          <span className="spacer"></span>
          <span className="badge accent">4 soal</span>
        </div>
        <div className="card-pad">
          <div className="field">
            <label htmlFor="s-judul">Judul</label>
            <input
              className="input"
              id="s-judul"
              type="text"
              defaultValue="Kuis Pertemuan 4 — Termokimia"
            />
          </div>
          <div className="field">
            <label htmlFor="s-desk">Deskripsi</label>
            <textarea
              className="textarea"
              id="s-desk"
              style={{ minHeight: "70px" }}
              defaultValue="Evaluasi pemahaman entalpi, reaksi eksoterm-endoterm, dan Hukum Hess."
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="s-waktu">Batas waktu (menit)</label>
              <input
                className="input mono"
                id="s-waktu"
                type="number"
                defaultValue="20"
                min="0"
              />
            </div>
            <div className="field">
              <label htmlFor="s-coba">Maks. percobaan</label>
              <input
                className="input mono"
                id="s-coba"
                type="number"
                defaultValue="1"
                min="0"
              />
              <span className="hint">kosongkan = tak terbatas</span>
            </div>
            <div className="field">
              <label htmlFor="s-lulus">Nilai lulus (%)</label>
              <input
                className="input mono"
                id="s-lulus"
                type="number"
                defaultValue="60"
                min="0"
                max="100"
              />
            </div>
            <div className="field">
              <label htmlFor="s-metode">Metode penilaian</label>
              <select className="select" id="s-metode" defaultValue="Tertinggi">
                <option>Tertinggi</option>
                <option>Terakhir</option>
                <option>Rata-rata</option>
                <option>Pertama</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-reveal">Tampilkan jawaban benar</label>
              <select
                className="select"
                id="s-reveal"
                defaultValue="Setelah submit"
              >
                <option>Tidak pernah</option>
                <option>Setelah submit</option>
                <option>Setelah ditutup</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-perpage">Soal per halaman</label>
              <input
                className="input mono"
                id="s-perpage"
                type="number"
                defaultValue="1"
                min="1"
              />
            </div>
            <div className="field">
              <label htmlFor="s-from">Tersedia dari</label>
              <input
                className="input"
                id="s-from"
                type="datetime-local"
                defaultValue="2026-06-20T08:00"
              />
            </div>
            <div className="field">
              <label htmlFor="s-to">Tersedia sampai</label>
              <input
                className="input"
                id="s-to"
                type="datetime-local"
                defaultValue="2026-06-24T23:59"
              />
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: "4px" }}>
            <div className="switch-field">
              <div>
                <div className="lbl">Acak soal</div>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="track"></span>
              </label>
            </div>
            <div className="switch-field">
              <div>
                <div className="lbl">Acak pilihan</div>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="track"></span>
              </label>
            </div>
            <div className="switch-field">
              <div>
                <div className="lbl">Tampilkan skor langsung</div>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="track"></span>
              </label>
            </div>
            <div className="switch-field">
              <div>
                <div className="lbl">Boleh kembali</div>
                <div className="hint">izinkan navigasi ke soal sebelumnya</div>
              </div>
              <label className="switch">
                <input type="checkbox" />
                <span className="track"></span>
              </label>
            </div>
          </div>

          <div
            className="switch-field"
            style={{
              marginBottom: 0,
              background: "var(--accent-soft)",
              borderColor: "transparent",
            }}
          >
            <div>
              <div className="lbl">Terbitkan kuis</div>
              <div className="hint">tampil ke siswa setelah disimpan</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="track"></span>
            </label>
          </div>
        </div>
      </section>

      {/* QUESTION BUILDER */}
      <section className="card">
        <div className="card-head">
          <h3>Bank soal</h3>
          <span className="spacer"></span>
          <details style={{ position: "relative" }}>
            <summary className="btn btn-primary btn-sm" style={{ listStyle: "none" }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tambah soal
            </summary>
          </details>
        </div>
        <div className="card-pad">
          <div
            className="row gap-sm"
            style={{ marginBottom: "18px", flexWrap: "wrap" }}
          >
            <span
              className="faint"
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                width: "100%",
                marginBottom: "2px",
              }}
            >
              Tambah soal
            </span>
            <div className="type-chips">
              <button className="type-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
                Pilihan tunggal
              </button>
              <button className="type-chip">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M8 12l3 3 5-6" />
                </svg>
                Pilihan ganda
              </button>
              <button className="type-chip">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l4 4L19 6" />
                </svg>
                Benar/Salah
              </button>
              <button className="type-chip">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 7h16M4 12h10M4 17h7" />
                </svg>
                Isian singkat
              </button>
              <button className="type-chip">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 10h16M4 14h16M4 18h11" />
                </svg>
                Esai
              </button>
            </div>
          </div>

          {/* Q1: single_choice */}
          <div className="q-card">
            <div className="q-head">
              <span className="grab" aria-label="Seret">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.6" />
                  <circle cx="15" cy="6" r="1.6" />
                  <circle cx="9" cy="12" r="1.6" />
                  <circle cx="15" cy="12" r="1.6" />
                  <circle cx="9" cy="18" r="1.6" />
                  <circle cx="15" cy="18" r="1.6" />
                </svg>
              </span>
              <span className="num">Soal 1</span>
              <span className="badge accent">Pilihan tunggal</span>
              <span className="spacer"></span>
              <button className="icon-btn" aria-label="Hapus soal">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                </svg>
              </button>
            </div>
            <div className="q-body">
              <div
                className="prompt-box"
                contentEditable="true"
                suppressContentEditableWarning
                role="textbox"
                aria-label="Pertanyaan"
              >
                Reaksi yang melepaskan kalor ke lingkungan dan memiliki ΔH bernilai
                negatif disebut reaksi…
              </div>
              <div style={{ marginTop: "14px" }}>
                <div className="opt-row">
                  <input
                    className="mark"
                    type="radio"
                    name="q1"
                    aria-label="Tandai benar"
                  />
                  <input className="opt-input" type="text" defaultValue="Endoterm" />
                  <button className="del" aria-label="Hapus pilihan">
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
                <div className="opt-row correct">
                  <input
                    className="mark"
                    type="radio"
                    name="q1"
                    defaultChecked
                    aria-label="Tandai benar"
                  />
                  <input className="opt-input" type="text" defaultValue="Eksoterm" />
                  <span className="tag-ok">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l4 4L19 6" />
                    </svg>
                    benar
                  </span>
                  <button className="del" aria-label="Hapus pilihan">
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
                <div className="opt-row">
                  <input
                    className="mark"
                    type="radio"
                    name="q1"
                    aria-label="Tandai benar"
                  />
                  <input className="opt-input" type="text" defaultValue="Isotermal" />
                  <button className="del" aria-label="Hapus pilihan">
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
                <div className="opt-row">
                  <input
                    className="mark"
                    type="radio"
                    name="q1"
                    aria-label="Tandai benar"
                  />
                  <input className="opt-input" type="text" defaultValue="Adiabatik" />
                  <button className="del" aria-label="Hapus pilihan">
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
                <button className="btn btn-sm btn-ghost">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Tambah pilihan
                </button>
              </div>
              <div className="field" style={{ margin: "16px 0 0" }}>
                <label>Pembahasan</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: "64px" }}
                  defaultValue="Reaksi eksoterm melepas kalor sehingga entalpi produk lebih rendah dari reaktan, ΔH < 0."
                />
              </div>
            </div>
            <div className="q-foot">
              <label className="pts-field">
                Poin{" "}
                <input
                  className="input mono pts"
                  type="number"
                  defaultValue="10"
                  min="0"
                />
              </label>
              <button className="btn btn-sm btn-danger">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                </svg>
                Hapus soal
              </button>
            </div>
          </div>

          {/* Q2: multiple_choice */}
          <div className="q-card">
            <div className="q-head">
              <span className="grab" aria-label="Seret">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.6" />
                  <circle cx="15" cy="6" r="1.6" />
                  <circle cx="9" cy="12" r="1.6" />
                  <circle cx="15" cy="12" r="1.6" />
                  <circle cx="9" cy="18" r="1.6" />
                  <circle cx="15" cy="18" r="1.6" />
                </svg>
              </span>
              <span className="num">Soal 2</span>
              <span className="badge info">Pilihan ganda</span>
              <span className="spacer"></span>
              <button className="icon-btn" aria-label="Hapus soal">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                </svg>
              </button>
            </div>
            <div className="q-body">
              <div
                className="prompt-box"
                contentEditable="true"
                suppressContentEditableWarning
                role="textbox"
                aria-label="Pertanyaan"
              >
                Manakah pernyataan yang BENAR tentang reaksi endoterm? (pilih dua)
              </div>
              <div style={{ marginTop: "14px" }}>
                <div className="opt-row correct">
                  <input
                    className="mark"
                    type="checkbox"
                    defaultChecked
                    aria-label="Tandai benar"
                  />
                  <input
                    className="opt-input"
                    type="text"
                    defaultValue="Menyerap kalor dari lingkungan"
                  />
                  <span className="tag-ok">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l4 4L19 6" />
                    </svg>
                    benar
                  </span>
                  <button className="del" aria-label="Hapus pilihan">
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
                <div className="opt-row correct">
                  <input
                    className="mark"
                    type="checkbox"
                    defaultChecked
                    aria-label="Tandai benar"
                  />
                  <input
                    className="opt-input"
                    type="text"
                    defaultValue="Nilai ΔH positif"
                  />
                  <span className="tag-ok">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l4 4L19 6" />
                    </svg>
                    benar
                  </span>
                  <button className="del" aria-label="Hapus pilihan">
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
                <div className="opt-row">
                  <input
                    className="mark"
                    type="checkbox"
                    aria-label="Tandai benar"
                  />
                  <input
                    className="opt-input"
                    type="text"
                    defaultValue="Suhu lingkungan naik"
                  />
                  <button className="del" aria-label="Hapus pilihan">
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
                <div className="opt-row">
                  <input
                    className="mark"
                    type="checkbox"
                    aria-label="Tandai benar"
                  />
                  <input
                    className="opt-input"
                    type="text"
                    defaultValue="Entalpi produk lebih rendah dari reaktan"
                  />
                  <button className="del" aria-label="Hapus pilihan">
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
                <button className="btn btn-sm btn-ghost">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Tambah pilihan
                </button>
              </div>
              <div className="field" style={{ margin: "16px 0 0" }}>
                <label>Pembahasan</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: "64px" }}
                  defaultValue="Reaksi endoterm menyerap kalor (ΔH > 0), sehingga suhu lingkungan justru turun dan entalpi produk lebih tinggi."
                />
              </div>
            </div>
            <div className="q-foot">
              <label className="pts-field">
                Poin{" "}
                <input
                  className="input mono pts"
                  type="number"
                  defaultValue="15"
                  min="0"
                />
              </label>
              <button className="btn btn-sm btn-danger">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                </svg>
                Hapus soal
              </button>
            </div>
          </div>

          {/* Q3: true_false */}
          <div className="q-card">
            <div className="q-head">
              <span className="grab" aria-label="Seret">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.6" />
                  <circle cx="15" cy="6" r="1.6" />
                  <circle cx="9" cy="12" r="1.6" />
                  <circle cx="15" cy="12" r="1.6" />
                  <circle cx="9" cy="18" r="1.6" />
                  <circle cx="15" cy="18" r="1.6" />
                </svg>
              </span>
              <span className="num">Soal 3</span>
              <span className="badge">Benar/Salah</span>
              <span className="spacer"></span>
              <button className="icon-btn" aria-label="Hapus soal">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                </svg>
              </button>
            </div>
            <div className="q-body">
              <div
                className="prompt-box"
                contentEditable="true"
                suppressContentEditableWarning
                role="textbox"
                aria-label="Pertanyaan"
              >
                Menurut Hukum Hess, perubahan entalpi total suatu reaksi bergantung
                pada jalannya reaksi.
              </div>
              <div style={{ marginTop: "14px" }}>
                <div className="opt-row">
                  <input
                    className="mark"
                    type="radio"
                    name="q3"
                    aria-label="Tandai benar"
                  />
                  <input
                    className="opt-input"
                    type="text"
                    defaultValue="Benar"
                    readOnly
                  />
                  <button
                    className="del"
                    aria-label="Hapus pilihan"
                    disabled
                    style={{ opacity: 0.3 }}
                  >
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
                <div className="opt-row correct">
                  <input
                    className="mark"
                    type="radio"
                    name="q3"
                    defaultChecked
                    aria-label="Tandai benar"
                  />
                  <input
                    className="opt-input"
                    type="text"
                    defaultValue="Salah"
                    readOnly
                  />
                  <span className="tag-ok">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l4 4L19 6" />
                    </svg>
                    benar
                  </span>
                  <button
                    className="del"
                    aria-label="Hapus pilihan"
                    disabled
                    style={{ opacity: 0.3 }}
                  >
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
              </div>
              <div className="field" style={{ margin: "16px 0 0" }}>
                <label>Pembahasan</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: "60px" }}
                  defaultValue="Salah. Hukum Hess menyatakan ΔH total hanya bergantung pada keadaan awal dan akhir, bukan pada jalannya reaksi."
                />
              </div>
            </div>
            <div className="q-foot">
              <label className="pts-field">
                Poin{" "}
                <input
                  className="input mono pts"
                  type="number"
                  defaultValue="5"
                  min="0"
                />
              </label>
              <button className="btn btn-sm btn-danger">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                </svg>
                Hapus soal
              </button>
            </div>
          </div>

          {/* Q4: short_answer */}
          <div className="q-card">
            <div className="q-head">
              <span className="grab" aria-label="Seret">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.6" />
                  <circle cx="15" cy="6" r="1.6" />
                  <circle cx="9" cy="12" r="1.6" />
                  <circle cx="15" cy="12" r="1.6" />
                  <circle cx="9" cy="18" r="1.6" />
                  <circle cx="15" cy="18" r="1.6" />
                </svg>
              </span>
              <span className="num">Soal 4</span>
              <span className="badge warn">Isian singkat</span>
              <span className="spacer"></span>
              <button className="icon-btn" aria-label="Hapus soal">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                </svg>
              </button>
            </div>
            <div className="q-body">
              <div
                className="prompt-box"
                contentEditable="true"
                suppressContentEditableWarning
                role="textbox"
                aria-label="Pertanyaan"
              >
                Sebutkan satuan SI untuk perubahan entalpi reaksi (ΔH) per mol zat.
              </div>
              <div style={{ marginTop: "14px" }}>
                <label
                  className="field-label"
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Jawaban diterima
                </label>
                <div className="opt-row">
                  <span
                    className="mark"
                    style={{
                      display: "grid",
                      placeItems: "center",
                      color: "var(--success)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l4 4L19 6" />
                    </svg>
                  </span>
                  <input className="opt-input" type="text" defaultValue="kJ/mol" />
                  <button className="del" aria-label="Hapus jawaban">
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
                <div className="opt-row">
                  <span
                    className="mark"
                    style={{
                      display: "grid",
                      placeItems: "center",
                      color: "var(--success)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l4 4L19 6" />
                    </svg>
                  </span>
                  <input className="opt-input" type="text" defaultValue="kJ mol-1" />
                  <button className="del" aria-label="Hapus jawaban">
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
                <div className="opt-row">
                  <span
                    className="mark"
                    style={{
                      display: "grid",
                      placeItems: "center",
                      color: "var(--success)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l4 4L19 6" />
                    </svg>
                  </span>
                  <input
                    className="opt-input"
                    type="text"
                    defaultValue="kilojoule per mol"
                  />
                  <button className="del" aria-label="Hapus jawaban">
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
                <button className="btn btn-sm btn-ghost">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Tambah jawaban
                </button>
                <div className="checkrow" style={{ marginTop: "12px" }}>
                  <input type="checkbox" id="q4-case" />
                  <label htmlFor="q4-case" style={{ fontWeight: 500 }}>
                    Peka huruf besar/kecil
                  </label>
                </div>
              </div>
              <div className="field" style={{ margin: "16px 0 0" }}>
                <label>Pembahasan</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: "60px" }}
                  defaultValue="Perubahan entalpi reaksi dinyatakan dalam kilojoule per mol (kJ/mol)."
                />
              </div>
            </div>
            <div className="q-foot">
              <label className="pts-field">
                Poin{" "}
                <input
                  className="input mono pts"
                  type="number"
                  defaultValue="10"
                  min="0"
                />
              </label>
              <button className="btn btn-sm btn-danger">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                </svg>
                Hapus soal
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky-bar">
        <Link className="btn" href="/quiz/quiz-kd-04">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Pratinjau
        </Link>
        <button className="btn btn-primary">
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
          Simpan kuis
        </button>
      </div>
    </AppShell>
  );
}
