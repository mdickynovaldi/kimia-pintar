"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { requestPasswordReset, type AuthState } from "@/app/actions/auth";

/**
 * Forgot-password card. Submits to `requestPasswordReset` (Supabase
 * resetPasswordForEmail when configured). The action returns a neutral message
 * regardless of whether the email exists (no account enumeration); we show the
 * "check your email" state once that message comes back.
 */
export function ForgotForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    undefined,
  );
  const sent = Boolean(state?.message);
  // Keep the submitted email so the success state can show it and "Kirim ulang"
  // can re-submit the reset request for the same address.
  const [email, setEmail] = useState("");

  return (
    <>
      <style>{`
  .auth-card { max-width: 440px; }
  .toggle-theme-fab { position: fixed; top: 18px; right: 18px; z-index: 5; }
  .auth-logo.top { display: inline-flex; }
  .auth-logo.top .logo { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(140deg, var(--accent), var(--accent-2)); display: grid; place-items: center; color: #fff; flex: none; box-shadow: var(--shadow-sm); }
  .mail-ico { width: 48px; height: 48px; border-radius: 12px; background: var(--accent-soft); color: var(--accent-ink); display: grid; place-items: center; flex: none; }
  .mail-ico svg { width: 24px; height: 24px; }
`}</style>

      <span className="auth-logo top">
        <span className="logo" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 3h6M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5V3" />
            <path d="M7 14h10" />
          </svg>
        </span>
        Kimia Pintar
      </span>

      {/* Form state */}
      {!sent && (
        <div className="card card-pad" id="form-state">
          <h1 style={{ fontSize: "1.5rem" }}>Lupa kata sandi?</h1>
          <p className="muted" style={{ margin: "8px 0 22px" }}>
            Masukkan email akunmu. Kami akan mengirim tautan untuk mengatur ulang
            kata sandi.
          </p>

          <form action={formAction}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                placeholder="nama@kampus.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <button
              className="btn btn-primary btn-block btn-lg"
              type="submit"
              disabled={pending}
            >
              {pending ? "Mengirim…" : "Kirim tautan reset"}
            </button>
          </form>

          <div
            className="row gap-sm"
            style={{
              marginTop: "18px",
              fontSize: "12.5px",
              color: "var(--muted)",
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
              style={{ flex: "none", color: "var(--accent-ink)", marginTop: "1px" }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Jika email terdaftar, kami kirim tautan reset. Demi keamanan, kami
            tidak memberi tahu apakah email ada di sistem.
          </div>
        </div>
      )}

      {/* Success state */}
      {sent && (
        <div className="card card-pad" id="sent-state">
          <div className="row gap-sm" style={{ marginBottom: "16px" }}>
            <div className="mail-ico">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: "1.3rem" }}>Cek email kamu</h1>
              <p className="muted" style={{ fontSize: "13.5px", marginTop: "2px" }}>
                Jika email terdaftar, tautan reset sudah dikirim.
              </p>
            </div>
          </div>
          <div
            className="card card-pad"
            style={{
              background: "var(--surface-2)",
              border: 0,
              fontSize: "13.5px",
              color: "var(--muted)",
            }}
          >
            Buka email di <b>{email}</b> lalu klik tautan dari{" "}
            <b>no-reply@kimiapintar.com</b>. Tautan berlaku terbatas dan hanya
            bisa dipakai sekali. Cek folder spam bila tidak muncul dalam beberapa
            menit.
          </div>
          <a
            className="btn btn-primary btn-block btn-lg"
            href="https://mail.google.com"
            target="_blank"
            rel="noopener"
            style={{ marginTop: "18px" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            Buka email
          </a>
          <div
            className="row between"
            style={{ marginTop: "16px", fontSize: "13.5px" }}
          >
            <form action={formAction} style={{ display: "contents" }}>
              <input type="hidden" name="email" value={email} />
              <button
                type="submit"
                disabled={pending}
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  font: "inherit",
                  color: "var(--accent-2)",
                  cursor: "pointer",
                }}
              >
                {pending ? "Mengirim…" : "Kirim ulang"}
              </button>
            </form>
            <Link href="/login">Kembali ke Masuk</Link>
          </div>
        </div>
      )}

      <p
        className="muted center"
        style={{ marginTop: "20px", fontSize: "13.5px" }}
      >
        Ingat kata sandimu? <Link href="/login">Kembali ke Masuk</Link>
      </p>
    </>
  );
}
