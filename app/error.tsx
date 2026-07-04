"use client";

import Link from "next/link";

/** Route-level error boundary: Supabase outages, failed queries, action
 * throws — users get a branded Indonesian recovery screen, not the default
 * unstyled English "Application error". */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
            background: "linear-gradient(140deg, var(--danger), oklch(55% 0.18 15))",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        </div>
        <p className="eyebrow" style={{ marginBottom: "8px" }}>Terjadi kesalahan</p>
        <h1 style={{ marginBottom: "8px" }}>Ada yang tidak beres</h1>
        <p className="muted" style={{ maxWidth: "46ch", margin: "0 auto 10px" }}>
          Permintaanmu gagal diproses. Coba lagi — bila masih bermasalah,
          hubungi admin.
        </p>
        {error?.message ? (
          <p
            className="muted mono"
            style={{ fontSize: "12px", margin: "0 auto 22px", maxWidth: "60ch", wordBreak: "break-word" }}
          >
            {error.message}
          </p>
        ) : null}
        <div className="row" style={{ justifyContent: "center", gap: "10px" }}>
          <button className="btn btn-primary" type="button" onClick={reset}>
            Coba lagi
          </button>
          <Link className="btn" href="/dashboard">
            Ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
