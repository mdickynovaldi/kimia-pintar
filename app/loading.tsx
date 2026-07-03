// Route-level loading state shown instantly while server components fetch data.
// Applies to every route below the root layout that lacks its own loading.tsx.
export default function Loading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        padding: "40px",
      }}
      role="status"
      aria-label="Memuat"
    >
      <style>{`
        @keyframes kp-spin { to { transform: rotate(360deg); } }
        .kp-loader {
          width: 42px; height: 42px; border-radius: 50%;
          border: 3px solid var(--surface-3);
          border-top-color: var(--accent);
          animation: kp-spin .7s linear infinite;
        }
      `}</style>
      <div style={{ display: "grid", justifyItems: "center", gap: "14px" }}>
        <div className="kp-loader" />
        <span
          className="muted"
          style={{ fontSize: "13px", fontFamily: "var(--font-mono)" }}
        >
          Memuat…
        </span>
      </div>
    </div>
  );
}
