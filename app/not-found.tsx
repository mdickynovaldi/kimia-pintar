import Link from "next/link";

/** Branded 404 — reachable from stale quiz links, mistyped slugs, etc. */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div>
        <div
          aria-hidden="true"
          style={{
            width: "72px",
            height: "72px",
            margin: "0 auto 18px",
            borderRadius: "20px",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            background: "linear-gradient(140deg, var(--accent), var(--accent-2))",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.24 21h11.52a2 2 0 0 0 1.74-2.5L14 9V3" />
          </svg>
        </div>
        <p className="eyebrow" style={{ marginBottom: "8px" }}>Error 404</p>
        <h1 style={{ marginBottom: "8px" }}>Halaman tidak ditemukan</h1>
        <p className="muted" style={{ maxWidth: "44ch", margin: "0 auto 22px" }}>
          Tautan yang kamu buka mungkin sudah dipindahkan, dihapus, atau salah
          ketik. Yuk kembali belajar.
        </p>
        <div className="row" style={{ justifyContent: "center", gap: "10px" }}>
          <Link className="btn btn-primary" href="/dashboard">
            Ke Beranda
          </Link>
          <Link className="btn" href="/courses">
            Lihat Mata Kuliah
          </Link>
        </div>
      </div>
    </main>
  );
}
