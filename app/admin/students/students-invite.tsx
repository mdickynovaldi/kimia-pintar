"use client";

import { useActionState, useState } from "react";
import { createStudent, type StudentActionState } from "@/app/actions/admin-students";

export function StudentsInvite() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<StudentActionState, FormData>(
    createStudent,
    undefined,
  );

  return (
    <>
      <div className="page-head">
        <div className="row between wrap">
          <div>
            <h1>Siswa</h1>
            <p>Kelola siswa terdaftar dan undang siswa baru ke platform.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
            Undang siswa
          </button>
        </div>
      </div>

      <form
        className="card invite-panel"
        id="invitePanel"
        hidden={!open}
        style={{ marginBottom: "18px" }}
        action={formAction}
      >
        <div className="card-head">
          <h3>Undang siswa baru</h3>
          <span className="spacer"></span>
        </div>
        <div className="card-pad">
          <div className="grid grid-3">
            <div className="field">
              <label htmlFor="iv-nama">Nama lengkap</label>
              <input
                className="input"
                id="iv-nama"
                name="full_name"
                placeholder="mis. Rifqi Maulana"
              />
            </div>
            <div className="field">
              <label htmlFor="iv-nim">NIM</label>
              <input
                className="input mono"
                id="iv-nim"
                name="student_no"
                placeholder="21030243"
              />
            </div>
            <div className="field">
              <label htmlFor="iv-email">Email</label>
              <input
                className="input"
                id="iv-email"
                name="email"
                type="email"
                placeholder="nama@kampus.ac.id"
              />
            </div>
          </div>

          {state?.error ? (
            <p className="muted" role="alert" style={{ color: "var(--danger, #d33)" }}>
              {state.error}
            </p>
          ) : null}
          {state?.message ? (
            <p className="muted" role="status">
              {state.message}
            </p>
          ) : null}

          <div className="row gap-sm">
            <button type="submit" className="btn btn-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2 11 13M22 2 15 22l-4-9-9-4z" />
              </svg>
              Kirim undangan
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
            >
              Batal
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
