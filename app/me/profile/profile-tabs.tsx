"use client";

import { useActionState, useRef, useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { PasswordField } from "@/components/ui/password-field";
import {
  changePassword,
  updateProfile,
  type ProfileState,
} from "@/app/actions/profile";
import { logout } from "@/app/actions/auth";
import { uploadImage } from "@/app/actions/upload";

interface ProfileTabsProps {
  fullName: string;
  email: string;
  studentNo: string;
  initials: string;
  avatarUrl?: string | null;
}

function Notice({ state }: { state: ProfileState }) {
  if (!state) return null;
  if (state.error)
    return (
      <p className="badge danger" style={{ display: "flex", margin: "0 0 12px", width: "100%" }}>
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p className="badge ok" style={{ display: "flex", margin: "0 0 12px", width: "100%" }}>
        {state.message}
      </p>
    );
  return null;
}

export function ProfileTabs({
  fullName,
  email,
  studentNo,
  initials,
  avatarUrl: initialAvatar,
}: ProfileTabsProps) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(initialAvatar ?? "");
  const [uploading, setUploading] = useState(false);
  const [profileState, profileAction, profilePending] = useActionState<ProfileState, FormData>(updateProfile, undefined);
  const [pwState, pwAction, pwPending] = useActionState<ProfileState, FormData>(changePassword, undefined);

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadImage(fd);
      if (res.url) setAvatarUrl(res.url);
      else alert(res.error ?? "Gagal mengunggah foto");
    } catch {
      alert("Gagal mengunggah foto");
    } finally {
      setUploading(false);
    }
  }

  const profilPanel = (
    <form action={profileAction} className="card card-pad">
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      <div className="row" style={{ gap: "16px", marginBottom: "8px" }}>
        <div
          className="avatar lg"
          style={
            avatarUrl
              ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: "cover", color: "transparent" }
              : undefined
          }
        >
          {initials}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--fg-strong)", fontSize: "1.1rem" }}>
            {fullName}
          </div>
          <div className="muted" style={{ fontSize: "13px" }}>{email}</div>
          <button type="button" className="btn btn-sm" style={{ marginTop: "10px" }} onClick={() => avatarRef.current?.click()} disabled={uploading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M8 8l4-4 4 4" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
            {uploading ? "Mengunggah…" : "Ubah foto"}
          </button>
          <input ref={avatarRef} type="file" accept="image/*" hidden onChange={onAvatar} />
        </div>
      </div>

      <div className="row gap-sm" style={{ margin: "14px 0 22px" }}>
        <span className="badge accent"><span className="dot" />Peran: Siswa</span>
        <span className="badge ok"><span className="dot" />Status: Aktif</span>
      </div>

      <hr className="divider" />

      <div className="field">
        <label htmlFor="p-name">Nama lengkap</label>
        <input className="input" id="p-name" name="full_name" type="text" defaultValue={fullName} required />
      </div>
      <div className="field">
        <label htmlFor="p-nim">NIM</label>
        <input className="input" id="p-nim" type="text" defaultValue={studentNo} readOnly style={{ background: "var(--surface-2)", color: "var(--muted)" }} />
        <span className="hint">Hubungi admin untuk mengubah NIM.</span>
      </div>
      <div className="field" style={{ marginBottom: "22px" }}>
        <label htmlFor="p-email">Email</label>
        <input className="input" id="p-email" type="email" defaultValue={email} readOnly style={{ background: "var(--surface-2)", color: "var(--muted)" }} />
        <span className="hint">Email akun dikelola lewat autentikasi.</span>
      </div>

      <Notice state={profileState} />
      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={profilePending}>
          {profilePending ? "Menyimpan…" : "Simpan perubahan"}
        </button>
        <button className="btn btn-ghost" type="reset">Batal</button>
      </div>
    </form>
  );

  const keamananPanel = (
    <>
      <form action={pwAction} className="card card-pad" style={{ marginBottom: "18px" }}>
        <h3 style={{ marginBottom: "4px" }}>Ganti kata sandi</h3>
        <p className="muted" style={{ fontSize: "13px", marginBottom: "18px" }}>
          Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
        </p>
        <div className="field">
          <label htmlFor="s-new">Kata sandi baru</label>
          <PasswordField id="s-new" name="password" placeholder="Kata sandi baru" autoComplete="new-password" required />
        </div>
        <div className="field" style={{ marginBottom: "22px" }}>
          <label htmlFor="s-confirm">Konfirmasi kata sandi baru</label>
          <PasswordField id="s-confirm" name="confirm" placeholder="Ulangi kata sandi baru" autoComplete="new-password" required />
        </div>
        <Notice state={pwState} />
        <button className="btn btn-primary" type="submit" disabled={pwPending}>
          {pwPending ? "Memproses…" : "Perbarui kata sandi"}
        </button>
      </form>

      <div className="card card-pad">
        <h3 style={{ marginBottom: "14px" }}>Sesi aktif</h3>
        <div className="row between" style={{ marginBottom: "18px" }}>
          <div className="row gap-sm">
            <span className="icon-btn" style={{ cursor: "default" }} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>Sesi perangkat ini</div>
              <div className="muted" style={{ fontSize: "12.5px" }}>aktif sekarang</div>
            </div>
          </div>
          <span className="badge ok"><span className="dot" />Sekarang</span>
        </div>
        <form action={logout}>
          <button className="btn btn-ghost" type="submit" style={{ color: "var(--danger)" }}>
            Keluar dari semua perangkat
          </button>
        </form>
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
