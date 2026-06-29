"use client";

import { useState } from "react";
import { saveQuizQuestions, type QuestionInput } from "@/app/actions/admin-quiz";
import type { Question, QuestionType } from "@/lib/data/types";
import { Check, Plus } from "@/components/icons";

type LocalOption = { key: string; id?: string; content: string; isCorrect: boolean };
type LocalQuestion = {
  key: string;
  id?: string;
  type: QuestionType;
  prompt: string;
  points: number;
  explanation: string;
  options: LocalOption[];
};

// All domain types appear so a question's existing type never blanks the select;
// only the choice types get an option editor (others noted as manual/unsupported).
const TYPES: { value: QuestionType; label: string }[] = [
  { value: "single_choice", label: "Pilihan tunggal" },
  { value: "multiple_choice", label: "Pilihan jamak" },
  { value: "true_false", label: "Benar / Salah" },
  { value: "short_answer", label: "Isian singkat" },
  { value: "essay", label: "Esai (nilai manual)" },
];

const CHOICE_TYPES = new Set(["single_choice", "multiple_choice", "true_false"]);

let counter = 0;
const uid = () => `tmp-${counter++}`;

function fromQuestion(q: Question): LocalQuestion {
  return {
    key: uid(),
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    points: q.points,
    explanation: q.explanation ?? "",
    options: q.options.map((o) => ({
      key: uid(),
      id: o.id,
      content: o.content,
      isCorrect: o.isCorrect,
    })),
  };
}

function blankQuestion(): LocalQuestion {
  return {
    key: uid(),
    type: "single_choice",
    prompt: "",
    points: 1,
    explanation: "",
    options: [
      { key: uid(), content: "", isCorrect: true },
      { key: uid(), content: "", isCorrect: false },
    ],
  };
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

export function QuizBuilder({
  quizId,
  initial,
}: {
  quizId: string;
  initial: Question[];
}) {
  const [questions, setQuestions] = useState<LocalQuestion[]>(
    initial.map(fromQuestion),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (key: string, fn: (q: LocalQuestion) => LocalQuestion) =>
    setQuestions((qs) => qs.map((q) => (q.key === key ? fn(q) : q)));

  const addQuestion = () => setQuestions((qs) => [...qs, blankQuestion()]);
  const removeQuestion = (key: string) =>
    setQuestions((qs) => qs.filter((q) => q.key !== key));

  const setType = (key: string, type: QuestionType) =>
    patch(key, (q) => {
      if (type === "true_false") {
        return {
          ...q,
          type,
          options: [
            { key: uid(), content: "Benar", isCorrect: true },
            { key: uid(), content: "Salah", isCorrect: false },
          ],
        };
      }
      if (!CHOICE_TYPES.has(type)) {
        // essay / short_answer / etc. carry no choice options
        return { ...q, type, options: [] };
      }
      // (re)entering a choice type needs at least two options
      const opts =
        q.options.length >= 2
          ? q.options
          : [
              { key: uid(), content: "", isCorrect: true },
              { key: uid(), content: "", isCorrect: false },
            ];
      return { ...q, type, options: opts };
    });

  const toggleCorrect = (qKey: string, oKey: string) =>
    patch(qKey, (q) => {
      const single = q.type !== "multiple_choice";
      return {
        ...q,
        options: q.options.map((o) =>
          o.key === oKey
            ? { ...o, isCorrect: single ? true : !o.isCorrect }
            : single
              ? { ...o, isCorrect: false }
              : o,
        ),
      };
    });

  const addOption = (qKey: string) =>
    patch(qKey, (q) => ({
      ...q,
      options: [...q.options, { key: uid(), content: "", isCorrect: false }],
    }));
  const removeOption = (qKey: string, oKey: string) =>
    patch(qKey, (q) => {
      if (q.options.length <= 2) return q; // keep at least two choices
      const options = q.options.filter((o) => o.key !== oKey);
      // ensure at least one correct option remains for choice types
      if (CHOICE_TYPES.has(q.type) && !options.some((o) => o.isCorrect)) {
        options[0] = { ...options[0], isCorrect: true };
      }
      return { ...q, options };
    });

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const payload: QuestionInput[] = questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      points: q.points,
      explanation: q.explanation,
      options: q.options.map((o) => ({ id: o.id, content: o.content, isCorrect: o.isCorrect })),
    }));
    const res = await saveQuizQuestions(quizId, payload);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(res.error ?? "Gagal menyimpan");
    }
  }

  return (
    <section>
      <div className="row between" style={{ margin: "26px 0 14px" }}>
        <h3>Bank soal</h3>
        <span className="badge accent">{questions.length} soal</span>
      </div>

      {questions.map((q, qi) => (
        <div className="q-card" key={q.key}>
          <div className="q-head">
            <span className="num">Soal {qi + 1}</span>
            <select
              className="select"
              style={{ width: "auto" }}
              value={q.type}
              onChange={(e) => setType(q.key, e.target.value as QuestionType)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="spacer" />
            <span className="pts-field">
              Poin
              <input
                className="input"
                type="number"
                min={0}
                step={1}
                value={Number.isFinite(q.points) ? q.points : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  patch(q.key, (x) => ({
                    ...x,
                    points: v === "" ? Number.NaN : Math.max(0, Number(v) || 0),
                  }));
                }}
                onBlur={(e) => {
                  if (e.target.value === "")
                    patch(q.key, (x) => ({ ...x, points: 1 }));
                }}
              />
            </span>
            <button
              type="button"
              className="icon-btn"
              aria-label="Hapus soal"
              onClick={() => removeQuestion(q.key)}
            >
              <TrashIcon />
            </button>
          </div>

          <div className="q-body">
            <textarea
              className="prompt-box"
              placeholder="Tulis pertanyaan…"
              value={q.prompt}
              onChange={(e) => patch(q.key, (x) => ({ ...x, prompt: e.target.value }))}
            />

            {CHOICE_TYPES.has(q.type) ? (
            <div style={{ marginTop: "12px" }}>
              {q.options.map((o) => (
                <div className={`opt-row${o.isCorrect ? " correct" : ""}`} key={o.key}>
                  <input
                    className="mark"
                    type={q.type === "multiple_choice" ? "checkbox" : "radio"}
                    name={`correct-${q.key}`}
                    checked={o.isCorrect}
                    onChange={() => toggleCorrect(q.key, o.key)}
                    aria-label="Tandai benar"
                  />
                  <input
                    className="opt-input"
                    placeholder="Teks pilihan…"
                    value={o.content}
                    onChange={(e) =>
                      patch(q.key, (x) => ({
                        ...x,
                        options: x.options.map((oo) =>
                          oo.key === o.key ? { ...oo, content: e.target.value } : oo,
                        ),
                      }))
                    }
                  />
                  {o.isCorrect ? (
                    <span className="tag-ok">
                      <Check /> benar
                    </span>
                  ) : null}
                  {q.type !== "true_false" ? (
                    <button
                      type="button"
                      className="del"
                      aria-label="Hapus pilihan"
                      onClick={() => removeOption(q.key, o.key)}
                    >
                      <TrashIcon />
                    </button>
                  ) : null}
                </div>
              ))}
              {q.type !== "true_false" ? (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => addOption(q.key)}
                  style={{ marginTop: "4px" }}
                >
                  <Plus /> Tambah pilihan
                </button>
              ) : null}
            </div>
            ) : (
              <p className="muted" style={{ fontSize: "13px", marginTop: "12px" }}>
                {q.type === "essay"
                  ? "Jawaban esai dinilai manual oleh admin."
                  : "Tipe ini tidak memakai pilihan jawaban."}
              </p>
            )}

            <div className="field" style={{ marginTop: "14px", marginBottom: 0 }}>
              <label>Pembahasan (opsional)</label>
              <textarea
                className="textarea"
                style={{ minHeight: "64px" }}
                placeholder="Penjelasan jawaban, tampil saat peninjauan…"
                value={q.explanation}
                onChange={(e) =>
                  patch(q.key, (x) => ({ ...x, explanation: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="btn btn-block" onClick={addQuestion}>
        <Plus /> Tambah soal
      </button>

      <div className="sticky-bar">
        {error ? (
          <span className="badge danger" style={{ alignSelf: "center" }}>
            {error}
          </span>
        ) : null}
        {saved ? (
          <span className="badge ok" style={{ alignSelf: "center" }}>
            <Check /> Tersimpan
          </span>
        ) : null}
        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Menyimpan…" : "Simpan soal"}
        </button>
      </div>
    </section>
  );
}
