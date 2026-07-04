"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitManualGrades } from "@/app/actions/admin-quiz";
import type { GradingDetail } from "@/lib/data/types";

const TYPE_LABEL: Record<string, string> = {
  single_choice: "Pilihan tunggal",
  multiple_choice: "Pilihan jamak",
  true_false: "Benar / Salah",
  short_answer: "Isian singkat",
  fill_blank: "Isian rumpang",
  essay: "Esai",
};

/** Manual-grading form: essay/manual questions get a point input + feedback;
 * auto-graded questions render read-only for context. Saving finalizes the
 * attempt via save_manual_grades (score, percentage, passed, status=graded). */
export function GradingForm({ detail }: { detail: GradingDetail }) {
  const router = useRouter();
  const manual = detail.answers.filter((a) => a.needsManual);
  const auto = detail.answers.filter((a) => !a.needsManual);

  const [points, setPoints] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const a of manual) {
      init[a.questionId] =
        a.pointsAwarded != null ? String(a.pointsAwarded) : "";
    }
    return init;
  });
  const [feedback, setFeedback] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const a of manual) init[a.questionId] = a.feedback ?? "";
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const incomplete = manual.some(
    (a) =>
      points[a.questionId] === "" ||
      Number.isNaN(Number(points[a.questionId])),
  );

  async function save() {
    setSaving(true);
    setError(null);
    const res = await submitManualGrades(
      detail.attemptId,
      manual.map((a) => ({
        questionId: a.questionId,
        points: Math.min(Math.max(Number(points[a.questionId]), 0), a.points),
        feedback: feedback[a.questionId] || null,
      })),
    );
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Gagal menyimpan penilaian.");
      return;
    }
    router.push("/admin/grading");
    router.refresh();
  }

  return (
    <div className="stack" style={{ gap: "14px" }}>
      {manual.map((a, i) => (
        <div key={a.questionId} className="card card-pad">
          <div className="row gap-sm" style={{ marginBottom: "8px" }}>
            <span className="badge accent">Perlu dinilai</span>
            <span className="badge">{TYPE_LABEL[a.type] ?? a.type}</span>
            <span className="badge">maks {a.points} poin</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--fg-strong)", marginBottom: "10px" }}>
            {i + 1}. {a.prompt}
          </div>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "var(--r-sm)",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
              marginBottom: "14px",
            }}
          >
            {a.given}
          </div>
          <div className="row wrap" style={{ gap: "14px", alignItems: "flex-start" }}>
            <div className="field" style={{ marginBottom: 0, width: "140px" }}>
              <label htmlFor={`pts-${a.questionId}`}>Poin (0–{a.points})</label>
              <input
                className="input mono"
                id={`pts-${a.questionId}`}
                type="number"
                min={0}
                max={a.points}
                step="0.5"
                value={points[a.questionId]}
                onChange={(e) =>
                  setPoints((p) => ({ ...p, [a.questionId]: e.target.value }))
                }
              />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: "220px" }}>
              <label htmlFor={`fb-${a.questionId}`}>Umpan balik (opsional)</label>
              <input
                className="input"
                id={`fb-${a.questionId}`}
                type="text"
                placeholder="Catatan untuk siswa…"
                value={feedback[a.questionId]}
                onChange={(e) =>
                  setFeedback((f) => ({ ...f, [a.questionId]: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      ))}

      {auto.length > 0 ? (
        <div className="card card-pad">
          <h3 style={{ marginBottom: "12px" }}>Soal objektif (dinilai otomatis)</h3>
          <div className="stack" style={{ gap: "10px" }}>
            {auto.map((a, i) => (
              <div
                key={a.questionId}
                className="row between"
                style={{
                  gap: "12px",
                  padding: "10px 0",
                  borderBottom:
                    i < auto.length - 1 ? "1px solid var(--border)" : undefined,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{a.prompt}</div>
                  <div className="muted" style={{ fontSize: "12.5px" }}>
                    Jawaban: {a.given}
                  </div>
                </div>
                <span className="badge mono" style={{ flex: "none" }}>
                  {a.pointsAwarded ?? 0}/{a.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="badge danger" style={{ display: "flex", width: "100%" }}>
          {error}
        </p>
      ) : null}

      <div className="row" style={{ justifyContent: "flex-end", gap: "10px" }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={save}
          disabled={saving || incomplete}
          title={incomplete ? "Isi poin untuk semua soal yang perlu dinilai" : undefined}
        >
          {saving ? "Menyimpan…" : "Simpan penilaian & terbitkan nilai"}
        </button>
      </div>
    </div>
  );
}
