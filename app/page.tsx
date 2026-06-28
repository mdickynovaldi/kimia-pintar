import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Kimia Pintar — LMS Kimia",
  description:
    "LMS kimia untuk belajar terstruktur: materi, video, dan kuis bernilai otomatis. Andal, cepat, bisa dari ponsel.",
};

const styles = `
  /* ---- Landing-specific layout (reuses app.css tokens) ---- */
  .lp { max-width: 1140px; margin: 0 auto; padding: 0 clamp(18px, 4vw, 32px); }
  .lp-wide { max-width: 1280px; }

  /* Nav */
  .lp-nav { position: sticky; top: 0; z-index: 50; background: color-mix(in oklch, var(--bg) 80%, transparent); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--border); }
  .lp-nav .row { height: 66px; }
  .lp-nav nav { display: flex; gap: 26px; margin-left: 30px; }
  .lp-nav nav a { color: var(--muted); font-size: 14px; font-weight: 500; }
  .lp-nav nav a:hover { color: var(--fg); text-decoration: none; }
  @media (max-width: 820px) { .lp-nav nav { display: none; } }

  /* Hero */
  .hero { padding: clamp(48px, 8vw, 92px) 0 clamp(40px, 6vw, 64px); display: grid; grid-template-columns: 1.05fr 0.95fr; gap: clamp(28px, 4vw, 56px); align-items: center; }
  @media (max-width: 920px) { .hero { grid-template-columns: 1fr; } }
  .hero h1 { font-size: clamp(2.2rem, 1.3rem + 3.6vw, 3.6rem); line-height: 1.04; letter-spacing: -0.03em; }
  .hero h1 .hl { color: var(--accent-ink); }
  .hero p.lead { font-size: clamp(1.02rem, 0.98rem + 0.4vw, 1.18rem); color: var(--muted); max-width: 52ch; margin-top: 18px; }
  .hero .cta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
  .hero .micro { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 22px; color: var(--faint); font-size: 13px; }
  .hero .micro span { display: inline-flex; align-items: center; gap: 7px; }
  .hero .micro svg { width: 16px; height: 16px; color: var(--accent); }

  /* Hero product visual */
  .hero-vis { position: relative; }
  .hero-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); box-shadow: var(--shadow-lg); padding: 18px; }
  .hero-card .bar { display: flex; align-items: center; gap: 8px; padding-bottom: 14px; border-bottom: 1px solid var(--border); margin-bottom: 14px; }
  .hero-card .bar .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border-2); }
  .hero-card .bar .u { margin-left: auto; font-size: 12px; color: var(--faint); font-family: var(--font-mono); }
  .lesson { display: flex; gap: 12px; align-items: center; padding: 11px; border-radius: var(--r); border: 1px solid var(--border); margin-bottom: 9px; }
  .lesson .nch { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; font-family: var(--font-mono); font-weight: 600; font-size: 13px; background: var(--accent-soft); color: var(--accent-ink); flex: none; }
  .lesson .t { font-weight: 600; font-size: 14px; }
  .lesson .m { font-size: 12px; color: var(--muted); }
  .hero-float { position: absolute; right: -14px; bottom: -22px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--shadow); padding: 13px 16px; display: flex; align-items: center; gap: 11px; }
  @media (max-width: 460px) { .hero-float { display: none; } }
  .hero-float .ring { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-family: var(--font-mono); font-weight: 700; color: var(--success); background: var(--success-soft); flex: none; }

  /* Logo strip */
  .strip { padding: 8px 0 36px; }
  .strip .lab { text-align: center; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); margin-bottom: 18px; }
  .strip .courses { display: flex; flex-wrap: wrap; justify-content: center; gap: 9px; }
  .chip { padding: 7px 14px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); font-size: 13px; font-weight: 500; color: var(--muted); }
  .chip.on { color: var(--accent-ink); border-color: color-mix(in oklch, var(--accent) 40%, var(--border)); background: var(--accent-soft); }

  /* Section scaffolding */
  .sec { padding: clamp(44px, 7vw, 84px) 0; }
  .sec-tag { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-ink); font-weight: 600; }
  .sec h2 { font-size: clamp(1.6rem, 1.2rem + 1.6vw, 2.3rem); letter-spacing: -0.02em; margin-top: 12px; max-width: 20ch; }
  .sec .sub { color: var(--muted); max-width: 56ch; margin-top: 12px; }

  /* Features */
  .feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 38px; }
  @media (max-width: 900px) { .feat-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 600px) { .feat-grid { grid-template-columns: 1fr; } }
  .feat { padding: 24px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); }
  .feat .ic { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-ink); margin-bottom: 16px; }
  .feat .ic svg { width: 22px; height: 22px; }
  .feat h3 { font-size: 1.06rem; margin-bottom: 7px; }
  .feat p { font-size: 14px; color: var(--muted); }
  .feat.span2 { grid-column: span 2; display: flex; gap: 22px; align-items: center; background: linear-gradient(150deg, oklch(28% 0.06 200), oklch(20% 0.045 235)); border: 0; color: #fff; }
  @media (max-width: 600px) { .feat.span2 { grid-column: span 1; flex-direction: column; align-items: flex-start; } }
  .feat.span2 .ic { background: rgba(255,255,255,.12); color: oklch(85% 0.1 180); }
  .feat.span2 h3 { color: #fff; }
  .feat.span2 p { color: rgba(255,255,255,.78); }

  /* How it works */
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 38px; counter-reset: s; }
  @media (max-width: 760px) { .steps { grid-template-columns: 1fr; } }
  .step { position: relative; padding: 24px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); }
  .step .n { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--accent-ink); border: 1px solid var(--border); border-radius: 999px; width: 34px; height: 34px; display: grid; place-items: center; margin-bottom: 14px; }
  .step h3 { font-size: 1.04rem; margin-bottom: 6px; }
  .step p { font-size: 14px; color: var(--muted); }

  /* Quiz spotlight */
  .spot { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(24px, 4vw, 52px); align-items: center; }
  @media (max-width: 860px) { .spot { grid-template-columns: 1fr; } }
  .spot ul { list-style: none; margin-top: 22px; display: flex; flex-direction: column; gap: 14px; }
  .spot li { display: flex; gap: 12px; font-size: 14.5px; }
  .spot li svg { width: 20px; height: 20px; color: var(--accent); flex: none; margin-top: 1px; }
  .spot li b { font-weight: 600; }
  .quiz-demo { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); box-shadow: var(--shadow); padding: 22px; }
  .quiz-demo .qh { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .quiz-demo .timer { font-family: var(--font-mono); font-weight: 600; font-size: 13px; padding: 5px 11px; border-radius: 999px; background: var(--warn-soft); color: oklch(50% 0.12 65); }
  :root[data-theme='dark'] .quiz-demo .timer { color: var(--warn); }
  .quiz-demo .qp { font-weight: 600; margin-bottom: 14px; }
  .opt { display: flex; align-items: center; gap: 11px; padding: 12px 14px; border: 1px solid var(--border-2); border-radius: var(--r); margin-bottom: 9px; font-size: 14px; }
  .opt .rd { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border-2); flex: none; }
  .opt.sel { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-ink); font-weight: 600; }
  .opt.sel .rd { border-color: var(--accent); background: var(--accent); box-shadow: inset 0 0 0 3px var(--surface); }

  /* For teachers */
  .teach { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-xl); padding: clamp(26px, 4vw, 44px); display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 32px; align-items: center; }
  @media (max-width: 800px) { .teach { grid-template-columns: 1fr; } }
  .teach .ministat { display: flex; gap: 26px; margin-top: 22px; flex-wrap: wrap; }
  .teach .ministat .v { font-family: var(--font-display); font-size: 1.7rem; font-weight: 800; color: var(--fg-strong); letter-spacing: -0.02em; }
  .teach .ministat .k { font-size: 12.5px; color: var(--muted); }
  .teach-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--shadow-sm); padding: 18px; }
  .teach-card .crow { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 13.5px; }
  .teach-card .crow:last-child { border-bottom: 0; }
  .teach-card .crow .st { margin-left: auto; }

  /* CTA */
  .cta-band { position: relative; overflow: hidden; border-radius: var(--r-xl); padding: clamp(36px, 6vw, 64px); text-align: center; background: linear-gradient(150deg, oklch(30% 0.07 195), oklch(21% 0.05 240)); color: #fff; }
  .cta-band h2 { color: #fff; font-size: clamp(1.7rem, 1.2rem + 2vw, 2.6rem); letter-spacing: -0.02em; max-width: 20ch; margin: 0 auto; }
  .cta-band p { color: rgba(255,255,255,.8); margin: 14px auto 0; max-width: 50ch; }
  .cta-band .cta { display: flex; gap: 12px; justify-content: center; margin-top: 26px; flex-wrap: wrap; }
  .cta-band .mol { position: absolute; opacity: .14; }

  /* Footer */
  .lp-foot { border-top: 1px solid var(--border); padding: 38px 0; margin-top: clamp(40px, 6vw, 72px); }
  .lp-foot .grid { display: flex; flex-wrap: wrap; gap: 30px; justify-content: space-between; }
  .lp-foot .col h4 { font-size: 12px; font-family: var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); margin-bottom: 12px; }
  .lp-foot .col a { display: block; color: var(--muted); font-size: 14px; margin-bottom: 8px; }
  .lp-foot .col a:hover { color: var(--fg); text-decoration: none; }
  .lp-foot .legal { margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--border); color: var(--faint); font-size: 13px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
`;

export default function Page() {
  return (
    <>
      <style>{styles}</style>

      {/* NAV */}
      <header className="lp-nav">
        <div className="lp lp-wide row">
          <Link
            href="/"
            className="brand"
            style={{ padding: 0, textDecoration: "none" }}
          >
            <span className="logo" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 3h6M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5V3" />
                <path d="M7 14h10" />
              </svg>
            </span>
            Kimia Pintar
          </Link>
          <nav>
            <a href="#fitur">Fitur</a>
            <a href="#cara">Cara kerja</a>
            <a href="#kuis">Kuis</a>
            <a href="#pengajar">Untuk pengajar</a>
          </nav>
          <span className="spacer" style={{ flex: 1 }}></span>
          <ThemeToggle />
          <Link href="/login" className="btn btn-sm" style={{ marginLeft: "6px" }}>
            Masuk
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Daftar gratis
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="lp lp-wide hero">
        <div>
          <span className="badge accent" style={{ marginBottom: "18px" }}>
            <span className="dot"></span>LMS Kimia · Bahasa Indonesia
          </span>
          <h1>
            Belajar kimia jadi <span className="hl">runtut</span>, dari materi
            sampai nilai.
          </h1>
          <p className="lead">
            Satu tempat untuk membaca materi, menonton video pembelajaran, dan
            mengerjakan kuis bernilai otomatis — terstruktur per pertemuan.
            Cepat, andal, dan bisa diakses dari ponsel maupun laptop.
          </p>
          <div className="cta">
            <Link href="/register" className="btn btn-primary btn-lg">
              Mulai belajar gratis
            </Link>
            <a href="#cara" className="btn btn-lg">
              Lihat cara kerjanya
            </a>
          </div>
          <div className="micro">
            <span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Tanpa biaya untuk siswa
            </span>
            <span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Login andal, nilai tersimpan aman
            </span>
            <span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Optimal di HP
            </span>
          </div>
        </div>

        <div className="hero-vis">
          <div className="hero-card">
            <div className="bar">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="u">kimiapintar.com</span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: ".04em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: "10px",
              }}
            >
              Kimia Dasar · Pertemuan
            </div>
            <div className="lesson">
              <span className="nch">01</span>
              <div>
                <div className="t">Stoikiometri</div>
                <div className="m">Materi · Video · Kuis</div>
              </div>
              <span className="badge ok" style={{ marginLeft: "auto" }}>
                <span className="dot"></span>Selesai
              </span>
            </div>
            <div
              className="lesson"
              style={{
                borderColor:
                  "color-mix(in oklch,var(--accent) 35%,var(--border))",
              }}
            >
              <span className="nch">04</span>
              <div>
                <div className="t">Termokimia</div>
                <div className="m">Lanjutkan — 45%</div>
              </div>
              <span className="badge accent" style={{ marginLeft: "auto" }}>
                Lanjut
              </span>
            </div>
            <div className="lesson">
              <span
                className="nch"
                style={{ background: "var(--surface-3)", color: "var(--faint)" }}
              >
                07
              </span>
              <div>
                <div className="t">Asam-Basa</div>
                <div className="m">Terkunci</div>
              </div>
            </div>
          </div>
          <div className="hero-float">
            <span className="ring">90</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>Kuis lulus</div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                Ikatan Kimia · otomatis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COURSE STRIP */}
      <div className="lp strip">
        <div className="lab">Tujuh mata kuliah kimia dalam satu platform</div>
        <div className="courses">
          <span className="chip on">Kimia Dasar</span>
          <span className="chip">Kimia Organik</span>
          <span className="chip">Kimia Anorganik</span>
          <span className="chip">Biokimia</span>
          <span className="chip">Kimia Analitik</span>
          <span className="chip">Kimia Fisika</span>
          <span className="chip">Kimia Instrumen</span>
        </div>
      </div>

      {/* FEATURES */}
      <section className="sec lp" id="fitur">
        <span className="sec-tag">Yang kamu dapatkan</span>
        <h2>Semua bahan belajar, tertata per pertemuan.</h2>
        <p className="sub">
          Tidak perlu mencari file di banyak tempat. Setiap pertemuan punya
          materi, video, dan kuisnya sendiri.
        </p>

        <div className="feat-grid">
          <div className="feat span2">
            <div className="ic">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 3 14 9-14 9z" />
              </svg>
            </div>
            <div>
              <h3>Video pembelajaran yang nempel di materi</h3>
              <p>
                Tonton penjelasan langsung di halaman pertemuan, tepat di
                samping bacaan dan rumusnya. Tetap di satu layar, tanpa berpindah
                aplikasi.
              </p>
            </div>
          </div>
          <div className="feat">
            <div className="ic">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 5a2 2 0 0 1 2-2h11v16H6a2 2 0 0 0-2 2z" />
                <path d="M9 7h5M9 11h5" />
              </svg>
            </div>
            <h3>Materi &amp; lampiran</h3>
            <p>
              Bacaan terformat dengan rumus kimia, plus modul PDF yang bisa
              diunduh.
            </p>
          </div>
          <div className="feat">
            <div className="ic">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 11l3 3 8-8" />
                <path d="M21 12a9 9 0 1 1-5.6-8.3" />
              </svg>
            </div>
            <h3>Kuis bernilai otomatis</h3>
            <p>
              Batas waktu, beragam tipe soal, dan skor langsung keluar setelah
              kirim.
            </p>
          </div>
          <div className="feat">
            <div className="ic">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M7 14l3-4 4 3 5-7" />
              </svg>
            </div>
            <h3>Progres &amp; nilai</h3>
            <p>Pantau pertemuan yang selesai dan nilai kuis lintas mata kuliah.</p>
          </div>
          <div className="feat">
            <div className="ic">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3>Andal &amp; aman</h3>
            <p>
              Login stabil dan jawaban kuis tersimpan otomatis — tak hilang saat
              sinyal putus.
            </p>
          </div>
          <div className="feat">
            <div className="ic">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
            </div>
            <h3>Mobile-first</h3>
            <p>
              Dirancang untuk layar HP dulu — nyaman dibaca dan dikerjakan di
              mana saja.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sec lp" id="cara">
        <span className="sec-tag">Cara kerja</span>
        <h2>Dari masuk sampai dapat nilai, tiga langkah.</h2>
        <div className="steps">
          <div className="step">
            <div className="n">1</div>
            <h3>Masuk ke kelas</h3>
            <p>Login dengan akun kampusmu, lalu pilih mata kuliah yang kamu ikuti.</p>
          </div>
          <div className="step">
            <div className="n">2</div>
            <h3>Pelajari pertemuan</h3>
            <p>Baca materi, tonton video, dan tandai bagian yang sudah selesai.</p>
          </div>
          <div className="step">
            <div className="n">3</div>
            <h3>Kerjakan kuis</h3>
            <p>
              Selesaikan kuis sebelum tenggat, kirim, dan lihat skor &amp;
              pembahasannya.
            </p>
          </div>
        </div>
      </section>

      {/* QUIZ SPOTLIGHT */}
      <section className="sec lp" id="kuis">
        <div className="spot">
          <div>
            <span className="sec-tag">Mesin kuis</span>
            <h2>Kuis yang adil, terukur, dan langsung dinilai.</h2>
            <p className="sub">
              Aturan kuis bisa diatur dosen — waktu, jumlah percobaan, sampai
              kapan jawaban benar boleh dilihat.
            </p>
            <ul>
              <li>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span>
                  <b>Batas waktu di sisi server</b> — menutup tab tidak
                  menghentikan timer.
                </span>
              </li>
              <li>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>
                  <b>Beragam tipe soal</b> — pilihan tunggal, pilihan ganda, dan
                  benar/salah.
                </span>
              </li>
              <li>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                <span>
                  <b>Tersimpan otomatis</b> tiap jawaban — aman dari koneksi yang
                  putus.
                </span>
              </li>
              <li>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>
                  <b>Pembahasan</b> muncul sesuai kebijakan, lengkap dengan
                  jawaban benar.
                </span>
              </li>
            </ul>
            <Link
              href="/quiz/quiz-kd-04"
              className="btn btn-primary"
              style={{ marginTop: "26px" }}
            >
              Coba alur kuis
            </Link>
          </div>

          <div className="quiz-demo" aria-hidden="true">
            <div className="qh">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--muted)",
                }}
              >
                Soal 1 / 10
              </span>
              <span className="timer">19:24</span>
            </div>
            <div className="qp">
              Reaksi yang melepaskan kalor ke lingkungan disebut…
            </div>
            <div className="opt sel">
              <span className="rd"></span>Reaksi eksoterm
            </div>
            <div className="opt">
              <span className="rd"></span>Reaksi endoterm
            </div>
            <div className="opt">
              <span className="rd"></span>Reaksi isotermal
            </div>
            <div className="opt">
              <span className="rd"></span>Reaksi adiabatik
            </div>
            <div className="row between" style={{ marginTop: "16px" }}>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--faint)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Tersimpan otomatis ✓
              </span>
              <span className="btn btn-primary btn-sm">Berikutnya →</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOR TEACHERS */}
      <section className="sec lp" id="pengajar">
        <div className="teach">
          <div>
            <span className="sec-tag">Untuk dosen &amp; pengajar</span>
            <h2 style={{ maxWidth: "18ch" }}>
              Susun kelas tanpa ribet kode atau plugin.
            </h2>
            <p className="sub">
              Buat mata kuliah, atur pertemuan, unggah materi, tautkan video,
              dan bangun kuis lewat antarmuka admin — lalu pantau nilai semua
              siswa dalam satu buku nilai.
            </p>
            <div className="ministat">
              <div>
                <div className="v">7</div>
                <div className="k">mata kuliah siap</div>
              </div>
              <div>
                <div className="v">CRUD</div>
                <div className="k">materi, video &amp; kuis</div>
              </div>
              <div>
                <div className="v">CSV</div>
                <div className="k">ekspor buku nilai</div>
              </div>
            </div>
            <Link href="/login" className="btn" style={{ marginTop: "24px" }}>
              Masuk sebagai admin
            </Link>
          </div>
          <div className="teach-card">
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: "6px",
              }}
            >
              Buku nilai · Kimia Dasar
            </div>
            <div className="crow">
              <div className="avatar sm">ES</div>Emmil Saputra
              <span className="st badge ok mono">90</span>
            </div>
            <div className="crow">
              <div className="avatar sm">NR</div>Nadia Rahma
              <span className="st badge ok mono">85</span>
            </div>
            <div className="crow">
              <div className="avatar sm">BP</div>Bagus Pratama
              <span className="st badge warn mono">58</span>
            </div>
            <div className="crow">
              <div className="avatar sm">SW</div>Siti Wulandari
              <span className="st badge ok mono">92</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp" style={{ paddingBottom: "8px" }}>
        <div className="cta-band">
          <svg
            className="mol"
            style={{ right: "-30px", top: "-30px" }}
            width="220"
            height="220"
            viewBox="0 0 200 200"
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
          >
            <circle cx="60" cy="60" r="14" />
            <circle cx="140" cy="60" r="14" />
            <circle cx="100" cy="130" r="14" />
            <path d="M74 60h52M68 72 92 118M132 72 108 118" />
          </svg>
          <h2>Siap mulai belajar kimia hari ini?</h2>
          <p>
            Buat akun gratis, masuk ke Kimia Dasar, dan kerjakan kuis pertamamu
            dalam hitungan menit.
          </p>
          <div className="cta">
            <Link
              href="/register"
              className="btn btn-lg"
              style={{ background: "#fff", color: "#06302b" }}
            >
              Daftar gratis
            </Link>
            <Link
              href="/login"
              className="btn btn-lg btn-ghost"
              style={{ color: "#fff", border: "1px solid rgba(255,255,255,.32)" }}
            >
              Sudah punya akun? Masuk
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-foot">
        <div className="lp lp-wide">
          <div className="grid">
            <div style={{ maxWidth: "260px" }}>
              <span className="brand" style={{ padding: 0 }}>
                <span className="logo" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 3h6M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5V3" />
                    <path d="M7 14h10" />
                  </svg>
                </span>
                Kimia Pintar
              </span>
              <p
                className="muted"
                style={{ fontSize: "13.5px", marginTop: "10px" }}
              >
                Learning management system kimia untuk belajar terstruktur —
                materi, video, dan kuis dalam satu tempat.
              </p>
            </div>
            <div className="col">
              <h4>Produk</h4>
              <a href="#fitur">Fitur</a>
              <a href="#kuis">Kuis</a>
              <Link href="/courses">Mata kuliah</Link>
              <a href="#cara">Cara kerja</a>
            </div>
            <div className="col">
              <h4>Akun</h4>
              <Link href="/login">Masuk</Link>
              <Link href="/register">Daftar</Link>
              <Link href="/forgot-password">Lupa sandi</Link>
            </div>
            <div className="col">
              <h4>Pengajar</h4>
              <Link href="/login">Masuk admin</Link>
              <a href="#pengajar">Kelola kelas</a>
              <Link href="/admin/gradebook">Buku nilai</Link>
            </div>
          </div>
          <div className="legal">
            <span>© 2026 Kimia Pintar · kimiapintar.com</span>
            <span>Dibuat untuk Bu Maya &amp; mahasiswanya</span>
          </div>
        </div>
      </footer>
    </>
  );
}
