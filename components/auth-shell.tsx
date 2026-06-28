import type { ReactNode } from "react";
import { Flask, Check } from "./icons";
import { ThemeToggle } from "./theme-toggle";

/** Marketing aside shared by every auth screen (login/register/forgot/reset). */
function AuthAside() {
  return (
    <aside className="auth-aside">
      <span className="auth-logo" style={{ color: "#fff" }}>
        <span className="logo" aria-hidden="true">
          <Flask width={18} height={18} />
        </span>
        Kimia Pintar
      </span>
      <h2>Belajar kimia, tanpa drama login.</h2>
      <p>
        Platform baru menggantikan situs lama yang error. Cepat, andal, dan bisa
        diakses dari ponsel.
      </p>
      <div className="pt">
        <Check strokeWidth={2.4} />
        Materi, video, dan kuis tiap pertemuan
      </div>
      <div className="pt">
        <Check strokeWidth={2.4} />
        Kuis dengan batas waktu &amp; hasil otomatis
      </div>
      <div className="pt">
        <Check strokeWidth={2.4} />
        Nilai tersimpan aman, kapan saja
      </div>
      <svg
        className="mol"
        width="280"
        height="280"
        viewBox="0 0 200 200"
        fill="none"
        stroke="#fff"
        strokeWidth={1.5}
      >
        <circle cx="60" cy="60" r="14" />
        <circle cx="140" cy="60" r="14" />
        <circle cx="100" cy="130" r="14" />
        <circle cx="40" cy="150" r="10" />
        <circle cx="160" cy="140" r="10" />
        <path d="M74 60h52M68 72 92 118M132 72 108 118M50 142l38-18M150 134l-38-12" />
      </svg>
    </aside>
  );
}

/**
 * Split auth layout: marketing aside (desktop) + the form card (children),
 * with a fixed theme toggle. Used by all four auth screens.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeToggle fab />
      <div className="auth-wrap split">
        <AuthAside />
        <main className="auth-card">{children}</main>
      </div>
    </>
  );
}
