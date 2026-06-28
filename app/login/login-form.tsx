"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { login, type AuthState } from "@/app/actions/auth";
import { PasswordField } from "@/components/ui/password-field";

/**
 * Login card. Submits to the `login` server action (Supabase signInWithPassword
 * when configured; demo redirect in mock mode). Errors render inline.
 */
export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    undefined,
  );

  return (
    <>
      <h1 style={{ fontSize: "1.6rem" }}>Masuk ke akun</h1>
      <p className="muted" style={{ margin: "8px 0 24px" }}>
        Gunakan email dan kata sandi yang terdaftar.
      </p>

      <form action={formAction}>
        <input type="hidden" name="next" value={next} />
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            placeholder="nama@kampus.ac.id"
            defaultValue="emmil@kampus.ac.id"
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <div className="row between">
            <label htmlFor="pw">Kata sandi</label>
            <Link href="/forgot-password" style={{ fontSize: "12.5px" }}>
              Lupa sandi?
            </Link>
          </div>
          <PasswordField id="pw" name="password" defaultValue="rahasia123" required />
        </div>
        <label className="checkrow" style={{ marginBottom: "20px" }}>
          <input type="checkbox" defaultChecked /> Ingat saya di perangkat ini
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

        <button
          className="btn btn-primary btn-block btn-lg"
          type="submit"
          disabled={pending}
        >
          {pending ? "Memproses…" : "Masuk"}
        </button>
      </form>

      <p
        className="muted center"
        style={{ marginTop: "20px", fontSize: "13.5px" }}
      >
        Belum punya akun? <Link href="/register">Daftar di sini</Link>
      </p>
      <div
        className="card card-pad"
        style={{ marginTop: "22px", background: "var(--surface-2)", border: 0 }}
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
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Sesi aman berbasis cookie. Masalah login situs lama sudah teratasi di
          versi ini.
        </div>
      </div>
    </>
  );
}
