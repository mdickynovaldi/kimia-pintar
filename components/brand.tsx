import { Flask } from "./icons";

/** Sidebar brand lockup: gradient flask chip + wordmark (+ optional Admin tag). */
export function Brand({ admin = false }: { admin?: boolean }) {
  return (
    <span className="brand">
      <span className="logo" aria-hidden="true">
        <Flask width={18} height={18} />
      </span>
      Kimia Pintar
      {admin ? <span className="badge accent">Admin</span> : null}
    </span>
  );
}
