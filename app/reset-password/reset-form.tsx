"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/app/actions/auth";
import { PasswordField } from "@/components/ui/password-field";

/**
 * Reset-password card. Submits to `updatePassword` (Supabase
 * updateUser({ password }) using the session from the email link). On success
 * the action redirects to /login.
 */
export function ResetForm() {
  const [state, formAction, loading] = useActionState<AuthState, FormData>(
    updatePassword,
    undefined,
  );

  return (
    <>
      <style>{`
  .auth-card { max-width: 440px; }
  .toggle-theme-fab { position: fixed; top: 18px; right: 18px; z-index: 5; }
  .auth-logo.top { display: inline-flex; }
  .auth-logo.top .logo { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(140deg, var(--accent), var(--accent-2)); display: grid; place-items: center; color: #fff; flex: none; box-shadow: var(--shadow-sm); }
`}</style>

      <div className="card card-pad">
        <h1 style={{ fontSize: "1.5rem" }}>Atur ulang kata sandi</h1>
        <p className="muted" style={{ margin: "8px 0 20px" }}>
          Buat kata sandi baru untuk akun <b>emmil@kampus.ac.id</b>.
        </p>

        <div
          className="row gap-sm"
          style={{
            marginBottom: "20px",
            padding: "11px 13px",
            borderRadius: "var(--r-sm)",
            background: "var(--warn-soft)",
            fontSize: "12.5px",
            color: "oklch(50% 0.12 65)",
          }}
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
            style={{ flex: "none", marginTop: "1px" }}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          Tautan ini hanya bisa dipakai sekali dan berlaku untuk waktu terbatas.
          Selesaikan sekarang sebelum kedaluwarsa.
        </div>

        <form action={formAction}>
          <div className="field">
            <label htmlFor="pw">Kata sandi baru</label>
            <PasswordField
              id="pw"
              name="password"
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              required
            />
            <span className="hint">
              Minimal 8 karakter, kombinasi huruf &amp; angka.
            </span>
          </div>
          <div className="field">
            <label htmlFor="pw2">Konfirmasi kata sandi baru</label>
            <PasswordField
              id="pw2"
              name="confirm"
              placeholder="Ulangi kata sandi baru"
              autoComplete="new-password"
              required
            />
          </div>

          {state?.error ? (
            <p
              role="alert"
              className="badge danger"
              style={{ display: "flex", margin: "0 0 14px", width: "100%" }}
            >
              {state.error}
            </p>
          ) : null}

          <button
            className="btn btn-primary btn-block btn-lg"
            type="submit"
            style={{ marginTop: "4px" }}
            disabled={loading}
          >
            {loading ? "Memproses…" : "Simpan kata sandi"}
          </button>
        </form>
      </div>

      <p
        className="muted center"
        style={{ marginTop: "20px", fontSize: "13.5px" }}
      >
        Tautan kedaluwarsa? <Link href="/forgot-password">Minta tautan baru</Link>{" "}
        · <Link href="/login">Kembali ke Masuk</Link>
      </p>
    </>
  );
}
