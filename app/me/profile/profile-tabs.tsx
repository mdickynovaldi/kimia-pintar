"use client";

import { Tabs } from "@/components/ui/tabs";
import { PasswordField } from "@/components/ui/password-field";

interface ProfileTabsProps {
  fullName: string;
  email: string;
  studentNo: string;
  initials: string;
}

export function ProfileTabs({ fullName, email, studentNo, initials }: ProfileTabsProps) {
  const profilPanel = (
    <div className="card card-pad">
      <div className="row" style={{ gap: "16px", marginBottom: "8px" }}>
        <div className="avatar lg">{initials}</div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--fg-strong)",
              fontSize: "1.1rem",
            }}
          >
            {fullName}
          </div>
          <div className="muted" style={{ fontSize: "13px" }}>
            {email}
          </div>
          <button className="btn btn-sm" style={{ marginTop: "10px" }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4M8 8l4-4 4 4" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            Ubah foto
          </button>
        </div>
      </div>

      <div className="row gap-sm" style={{ margin: "14px 0 22px" }}>
        <span className="badge accent">
          <span className="dot" />
          Peran: Siswa
        </span>
        <span className="badge ok">
          <span className="dot" />
          Status: Aktif
        </span>
      </div>

      <hr className="divider" />

      <div className="field">
        <label htmlFor="p-name">Nama lengkap</label>
        <input className="input" id="p-name" type="text" defaultValue={fullName} />
      </div>

      <div className="field">
        <label htmlFor="p-nim">NIM</label>
        <input
          className="input"
          id="p-nim"
          type="text"
          defaultValue={studentNo}
          readOnly
          style={{ background: "var(--surface-2)", color: "var(--muted)" }}
        />
        <span className="hint">Hubungi admin untuk mengubah NIM.</span>
      </div>

      <div className="field" style={{ marginBottom: "22px" }}>
        <label htmlFor="p-email">Email</label>
        <input className="input" id="p-email" type="email" defaultValue={email} />
      </div>

      <div className="row">
        <button className="btn btn-primary">Simpan perubahan</button>
        <button className="btn btn-ghost">Batal</button>
      </div>
    </div>
  );

  const keamananPanel = (
    <>
      <div className="card card-pad" style={{ marginBottom: "18px" }}>
        <h3 style={{ marginBottom: "4px" }}>Ganti kata sandi</h3>
        <p
          className="muted"
          style={{ fontSize: "13px", marginBottom: "18px" }}
        >
          Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
        </p>

        <div className="field">
          <label htmlFor="s-current">Kata sandi saat ini</label>
          <input
            className="input"
            id="s-current"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <div className="field">
          <label htmlFor="s-new">Kata sandi baru</label>
          <PasswordField
            id="s-new"
            placeholder="Kata sandi baru"
            autoComplete="new-password"
          />
        </div>

        <div className="field" style={{ marginBottom: "22px" }}>
          <label htmlFor="s-confirm">Konfirmasi kata sandi baru</label>
          <input
            className="input"
            id="s-confirm"
            type="password"
            placeholder="Ulangi kata sandi baru"
            autoComplete="new-password"
          />
        </div>

        <button className="btn btn-primary">Perbarui kata sandi</button>
      </div>

      <div className="card card-pad">
        <h3 style={{ marginBottom: "14px" }}>Sesi aktif</h3>
        <div className="row between" style={{ marginBottom: "18px" }}>
          <div className="row gap-sm">
            <span
              className="icon-btn"
              style={{ cursor: "default" }}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="13" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>Chrome · Windows</div>
              <div className="muted" style={{ fontSize: "12.5px" }}>
                Perangkat ini · aktif sekarang
              </div>
            </div>
          </div>
          <span className="badge ok">
            <span className="dot" />
            Sekarang
          </span>
        </div>
        <button className="btn btn-ghost" style={{ color: "var(--danger)" }}>
          Keluar dari semua perangkat
        </button>
      </div>
    </>
  );

  return (
    <Tabs
      items={[
        { id: "profil", label: "Profil", content: profilPanel },
        { id: "keamanan", label: "Keamanan", content: keamananPanel },
      ]}
    />
  );
}
