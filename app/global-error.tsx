"use client";

/** Last-resort boundary (errors in the root layout itself). Must render its
 * own <html>/<body> because the layout crashed. Styles are inline — globals.css
 * may not have loaded. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          margin: 0,
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f7faf9",
          color: "#1c2b28",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "8px" }}>Ada yang tidak beres</h1>
          <p style={{ color: "#5b6f6a", maxWidth: "46ch", margin: "0 auto 22px" }}>
            Kimia Pintar sedang mengalami gangguan. Coba muat ulang halaman.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 22px",
              borderRadius: "10px",
              border: 0,
              cursor: "pointer",
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(140deg, #0e8074, #0b5f6e)",
            }}
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
