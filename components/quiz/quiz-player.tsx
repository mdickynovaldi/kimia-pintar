"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Question } from "@/lib/data/types";

const TYPE_LABEL: Record<string, string> = {
  single_choice: "Pilihan tunggal",
  multiple_choice: "Pilihan jamak",
  true_false: "Benar / Salah",
  short_answer: "Isian singkat",
  fill_blank: "Isian rumpang",
  matching: "Menjodohkan",
  ordering: "Pengurutan",
  essay: "Esai",
};

function Prompt({ q }: { q: Question }) {
  if (q.promptHtml) {
    return (
      <p className="qprompt" dangerouslySetInnerHTML={{ __html: q.promptHtml }} />
    );
  }
  return <p className="qprompt">{q.prompt}</p>;
}

/**
 * Client quiz player: one question at a time with a numbered navigator. When an
 * `attemptId` is provided (live backend), each change autosaves to the answer
 * route and "Selesai" submits + grades server-side, then routes to the result.
 * Without it (mock mode) "Selesai" just links to the result page.
 */
export function QuizPlayer({
  questions,
  resultHref,
  attemptId,
}: {
  questions: Question[];
  resultHref: string;
  attemptId?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const total = questions.length;
  const onLast = current === total - 1;

  const go = (i: number) => setCurrent(Math.max(0, Math.min(total - 1, i)));

  async function saveAnswer(questionId: string, optionIds: string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIds }));
    if (!attemptId) return;
    try {
      await fetch(`/api/attempts/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedOptionIds: optionIds }),
      });
    } catch {
      // best-effort autosave; the timer/submit are server-authoritative
    }
  }

  function onChange(q: Question, optionId: string, checked: boolean) {
    if (q.type === "multiple_choice") {
      const cur = answers[q.id] ?? [];
      const next = checked
        ? [...cur, optionId]
        : cur.filter((x) => x !== optionId);
      void saveAnswer(q.id, next);
    } else {
      void saveAnswer(q.id, [optionId]);
    }
  }

  async function finish() {
    if (!attemptId) {
      router.push(resultHref);
      return;
    }
    setSubmitting(true);
    try {
      await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
    } catch {
      // fall through — show the result regardless
    }
    router.push(resultHref);
  }

  return (
    <>
      <div data-quiz-player>
        {questions.map((q, i) => {
          const isCheckbox = q.type === "multiple_choice";
          return (
            <div data-q key={q.id} style={{ display: i === current ? "" : "none" }}>
              <div className="qhead">
                <span className="qnum">Soal {i + 1}</span>
                <span className="badge accent">{q.points} poin</span>
                <span className="badge">{TYPE_LABEL[q.type] ?? q.type}</span>
              </div>
              <Prompt q={q} />
              {isCheckbox ? (
                <p className="qnote">Pilih semua yang benar.</p>
              ) : null}
              <div className="opts">
                {q.options.map((opt) => (
                  <label className="opt" key={opt.id}>
                    <input
                      type={isCheckbox ? "checkbox" : "radio"}
                      name={q.id}
                      value={opt.id}
                      onChange={(e) => onChange(q, opt.id, e.target.checked)}
                    />
                    {opt.content}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <nav className="qnav" aria-label="Navigasi soal">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            className={`qdot${(answers[q.id]?.length ?? 0) > 0 ? " answered" : ""}${i === current ? " active" : ""}`}
            onClick={() => go(i)}
          >
            {i + 1}
          </button>
        ))}
      </nav>
      <p className="muted" style={{ fontSize: "12px", marginTop: "4px" }}>
        Kotak terisi = sudah dijawab. Klik nomor untuk berpindah soal.
      </p>

      <footer className="qfoot">
        <button
          type="button"
          className="btn"
          disabled={current === 0}
          onClick={() => go(current - 1)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Sebelumnya
        </button>
        <span className="qpos">
          {current + 1} / {total}
        </span>
        {onLast ? (
          attemptId ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={finish}
              disabled={submitting}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              {submitting ? "Mengirim…" : "Selesai & kirim"}
            </button>
          ) : (
            <Link className="btn btn-primary" href={resultHref}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              Selesai &amp; kirim
            </Link>
          )
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => go(current + 1)}
          >
            Berikutnya
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </footer>
    </>
  );
}
