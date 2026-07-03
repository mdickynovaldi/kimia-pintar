"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { register, type AuthState } from "@/app/actions/auth";
import { PasswordField } from "@/components/ui/password-field";

/**
 * Register card. Submits to the `register` server action (Supabase signUp when
 * configured; demo redirect in mock mode).
 */
export function RegisterForm() {
  const [state, formAction, loading] = useActionState<AuthState, FormData>(
    register,
    undefined,
  );
  // Controlled so a validation error (e.g. mismatched password) doesn't wipe
  // everything the user typed when React 19 resets the form post-action.
  const [fullName, setFullName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <>
      <style>{`
  .auth-aside h2 { color: #fff; font-size: 1.7rem; max-width: 16ch; }
  .auth-aside p { color: rgba(255,255,255,.8); margin-top: 14px; max-width: 36ch; }
  .auth-aside .mol { position: absolute; right: -40px; bottom: -40px; opacity: .18; }
  .auth-aside .pt { display: flex; gap: 10px; align-items: flex-start; margin-top: 16px; color: rgba(255,255,255,.92); font-size: 14px; }
  .auth-aside .pt svg { width: 18px; height: 18px; flex: none; margin-top: 1px; color: oklch(82% 0.12 180); }
  .toggle-theme-fab { position: fixed; top: 18px; right: 18px; z-index: 5; }
`}</style>

      <span className="auth-logo" style={{ display: "none" }}></span>
      <h1 style={{ fontSize: "1.6rem" }}>Daftar akun</h1>
      <p className="muted" style={{ margin: "8px 0 24px" }}>
        Buat akun untuk mulai belajar kimia bersama kelas Bu Maya.
      </p>

      <form action={formAction}>
        <div className="field">
          <label htmlFor="nama">Nama lengkap</label>
          <input
            className="input"
            id="nama"
            name="full_name"
            type="text"
            placeholder="Mis. Emmil Saputra"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="nim">NIM</label>
          <input
            className="input mono"
            id="nim"
            name="student_no"
            type="text"
            inputMode="numeric"
            placeholder="Nomor induk mahasiswa"
            required
            autoComplete="off"
            value={studentNo}
            onChange={(e) => setStudentNo(e.target.value)}
          />
          <span className="hint">Nomor induk mahasiswa, mis. 21030210.</span>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            placeholder="nama@kampus.ac.id"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="pw">Kata sandi</label>
          <PasswordField
            id="pw"
            name="password"
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            required
            value={password}
            onChange={setPassword}
          />
        </div>
        <div className="field">
          <label htmlFor="pw2">Konfirmasi kata sandi</label>
          <PasswordField
            id="pw2"
            name="confirm"
            placeholder="Ulangi kata sandi"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={setConfirm}
          />
        </div>
        <label
          className="checkrow"
          style={{ marginBottom: "20px", alignItems: "flex-start" }}
        >
          <input type="checkbox" required style={{ marginTop: "2px" }} />{" "}
          <span>
            Saya setuju dengan ketentuan layanan dan kebijakan privasi Kimia
            Pintar.
          </span>
        </label>

        {state?.error ? (
          <p
            role="alert"
            className="badge danger"
            style={{ display: "flex", marginBottom: "14px", width: "100%" }}
          >
            {state.error}
          </p>
        ) : null}
        {state?.message ? (
          <p
            role="status"
            className="badge ok"
            style={{ display: "flex", marginBottom: "14px", width: "100%" }}
          >
            {state.message}
          </p>
        ) : null}

        <button
          className="btn btn-primary btn-block btn-lg"
          type="submit"
          disabled={loading}
        >
          {loading ? "Memproses…" : "Buat akun"}
        </button>
      </form>

      <div
        className="card card-pad"
        style={{ marginTop: "20px", background: "var(--surface-2)", border: 0 }}
      >
        <div
          className="row gap-sm"
          style={{ fontSize: "12.5px", color: "var(--muted)" }}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flex: "none", color: "var(--accent-ink)" }}
          >
            <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          Akun baru otomatis berperan sebagai <b>mahasiswa</b> dengan status{" "}
          <b>aktif</b>.
        </div>
      </div>

      <p
        className="muted center"
        style={{ marginTop: "20px", fontSize: "13.5px" }}
      >
        Sudah punya akun? <Link href="/login">Masuk</Link>
      </p>
    </>
  );
}
