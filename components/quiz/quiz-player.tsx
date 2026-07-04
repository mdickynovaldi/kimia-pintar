"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { Question } from "@/lib/data/types";
import { Check, Logout } from "../icons";
import { Countdown } from "./countdown";

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

const TEXT_TYPES = new Set(["short_answer", "fill_blank", "essay"]);

function Prompt({ q }: { q: Question }) {
  if (q.promptHtml) {
    return (
      <p className="qprompt" dangerouslySetInnerHTML={{ __html: q.promptHtml }} />
    );
  }
  return <p className="qprompt">{q.prompt}</p>;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export interface InitialAnswer {
  optionIds: string[];
  text: string | null;
}

/**
 * Full client quiz runtime: sticky bar (title, real save indicator, countdown,
 * exit) + the player. Answers restore from `initialAnswers` on resume; choice
 * changes autosave immediately and text answers autosave debounced; the
 * countdown auto-submits when the server deadline passes. `allowBacktrack` and
 * `questionsPerPage` are enforced, matching what the intro screen promises.
 */
export function QuizPlayer({
  questions,
  resultHref,
  exitHref,
  attemptId,
  quizTitle,
  deadline,
  initialAnswers,
  allowBacktrack = true,
  questionsPerPage = 1,
}: {
  questions: Question[];
  resultHref: string;
  exitHref: string;
  attemptId?: string;
  quizTitle: string;
  deadline?: string;
  initialAnswers?: Record<string, InitialAnswer>;
  allowBacktrack?: boolean;
  questionsPerPage?: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const [qid, a] of Object.entries(initialAnswers ?? {})) {
      if (a.optionIds.length) init[qid] = a.optionIds;
    }
    return init;
  });
  const [texts, setTexts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const [qid, a] of Object.entries(initialAnswers ?? {})) {
      if (a.text) init[qid] = a.text;
    }
    return init;
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const debouncers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const finished = useRef(false);

  const perPage = Math.max(1, questionsPerPage);
  const pages = useMemo(() => {
    const out: Question[][] = [];
    for (let i = 0; i < questions.length; i += perPage) {
      out.push(questions.slice(i, i + perPage));
    }
    return out;
  }, [questions, perPage]);
  const [page, setPage] = useState(0);
  const onLast = page === pages.length - 1;

  const isAnswered = (q: Question) =>
    TEXT_TYPES.has(q.type)
      ? (texts[q.id] ?? "").trim().length > 0
      : (answers[q.id]?.length ?? 0) > 0;
  const answeredCount = questions.filter(isAnswered).length;

  const goPage = (i: number) => {
    const target = Math.max(0, Math.min(pages.length - 1, i));
    if (!allowBacktrack && target < page) return; // no going back
    setPage(target);
  };

  async function persist(
    questionId: string,
    optionIds: string[],
    answerText: string | null,
  ) {
    if (!attemptId) return; // mock mode: local state only
    setSaveState("saving");
    try {
      const res = await fetch(`/api/attempts/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedOptionIds: optionIds, answerText }),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }

  function onChoice(q: Question, optionId: string, checked: boolean) {
    const cur = answers[q.id] ?? [];
    const next =
      q.type === "multiple_choice"
        ? checked
          ? [...cur, optionId]
          : cur.filter((x) => x !== optionId)
        : [optionId];
    setAnswers((prev) => ({ ...prev, [q.id]: next }));
    void persist(q.id, next, null);
  }

  function onText(q: Question, value: string) {
    setTexts((prev) => ({ ...prev, [q.id]: value }));
    // Debounce keystrokes; flush 700ms after the student pauses.
    clearTimeout(debouncers.current[q.id]);
    debouncers.current[q.id] = setTimeout(() => {
      void persist(q.id, [], value.trim() ? value : null);
    }, 700);
  }

  // Cancel pending debounces and persist every text answer's current value —
  // called before submit so the last keystrokes aren't dropped by the 700ms gap.
  async function flushTextAnswers() {
    if (!attemptId) return;
    const pending = Object.entries(texts).filter(([qid]) => {
      const q = questions.find((x) => x.id === qid);
      return q && TEXT_TYPES.has(q.type);
    });
    for (const t of Object.values(debouncers.current)) clearTimeout(t);
    await Promise.all(
      pending.map(([qid, val]) => persist(qid, [], val.trim() ? val : null)),
    );
  }

  async function finish(auto = false) {
    if (finished.current) return;
    if (!attemptId) {
      router.push(resultHref);
      return;
    }
    if (!auto && answeredCount < questions.length) {
      const ok = window.confirm(
        `Masih ada ${questions.length - answeredCount} soal belum dijawab. Kirim sekarang?`,
      );
      if (!ok) return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await flushTextAnswers(); // save last keystrokes before grading
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Gagal mengirim jawaban.");
      }
      finished.current = true;
      router.push(resultHref);
    } catch (e) {
      setSubmitting(false);
      setSubmitError(
        e instanceof Error ? e.message : "Gagal mengirim jawaban. Coba lagi.",
      );
      if (auto) {
        // Deadline passed but submit failed (e.g. offline) — send the student
        // to the result page anyway; the server finalizes expired attempts.
        finished.current = true;
        router.push(resultHref);
      }
    }
  }

  const [small, big] = quizTitle.includes("—")
    ? quizTitle.split("—").map((s) => s.trim())
    : [quizTitle, quizTitle];

  return (
    <>
      <header className="quiz-bar">
        <div className="qtitle">
          {big}
          <small>{small}</small>
        </div>
        <span className="spacer" />
        {attemptId ? (
          saveState === "error" ? (
            <span className="save-ind" style={{ color: "var(--danger)" }} role="alert">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span>Gagal menyimpan</span>
            </span>
          ) : saveState === "saving" ? (
            <span className="save-ind" style={{ color: "var(--muted)" }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a9 9 0 1 0 9 9" />
              </svg>
              <span>Menyimpan…</span>
            </span>
          ) : saveState === "saved" ? (
            <span className="save-ind">
              <Check strokeWidth={2.4} />
              <span>Tersimpan</span>
            </span>
          ) : null
        ) : null}
        {deadline ? (
          <Countdown seconds={0} deadline={deadline} onExpire={() => void finish(true)} />
        ) : (
          <span className="badge">Tanpa batas waktu</span>
        )}
        <Link className="exit-link" href={exitHref}>
          <Logout />
          Keluar
        </Link>
      </header>

      <main className="quiz-main">
        <div data-quiz-player>
          {pages.map((pageQuestions, pi) => (
            <div key={pi} style={{ display: pi === page ? "" : "none" }}>
              {pageQuestions.map((q) => {
                const qIndex = questions.indexOf(q);
                const isCheckbox = q.type === "multiple_choice";
                const isText = TEXT_TYPES.has(q.type);
                return (
                  <div data-q key={q.id} style={{ marginBottom: pageQuestions.length > 1 ? "34px" : undefined }}>
                    <div className="qhead">
                      <span className="qnum">Soal {qIndex + 1}</span>
                      <span className="badge accent">{q.points} poin</span>
                      <span className="badge">{TYPE_LABEL[q.type] ?? q.type}</span>
                    </div>
                    <Prompt q={q} />
                    {isCheckbox ? (
                      <p className="qnote">Pilih semua yang benar.</p>
                    ) : null}
                    {q.type === "essay" ? (
                      <p className="qnote">
                        Jawaban esai dinilai manual oleh pengajar setelah kuis dikirim.
                      </p>
                    ) : null}
                    {isText ? (
                      <textarea
                        className="input"
                        rows={q.type === "essay" ? 8 : 3}
                        placeholder={
                          q.type === "essay"
                            ? "Tulis jawaban esaimu di sini…"
                            : "Tulis jawaban singkatmu di sini…"
                        }
                        value={texts[q.id] ?? ""}
                        onChange={(e) => onText(q, e.target.value)}
                        style={{ resize: "vertical", minHeight: q.type === "essay" ? "160px" : "76px" }}
                        aria-label={`Jawaban untuk soal ${qIndex + 1}`}
                      />
                    ) : (
                      <div className="opts">
                        {q.options.map((opt) => (
                          <label className="opt" key={opt.id}>
                            <input
                              type={isCheckbox ? "checkbox" : "radio"}
                              name={q.id}
                              value={opt.id}
                              checked={(answers[q.id] ?? []).includes(opt.id)}
                              onChange={(e) => onChoice(q, opt.id, e.target.checked)}
                            />
                            {opt.content}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <nav className="qnav" aria-label="Navigasi soal">
          {questions.map((q, i) => {
            const targetPage = Math.floor(i / perPage);
            const locked = !allowBacktrack && targetPage < page;
            return (
              <button
                key={q.id}
                type="button"
                className={`qdot${isAnswered(q) ? " answered" : ""}${targetPage === page ? " active" : ""}`}
                onClick={() => goPage(targetPage)}
                disabled={locked}
                title={locked ? "Tidak bisa kembali ke soal sebelumnya" : undefined}
                style={locked ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
              >
                {i + 1}
              </button>
            );
          })}
        </nav>
        <p className="muted" style={{ fontSize: "12px", marginTop: "4px" }}>
          {allowBacktrack
            ? "Kotak terisi = sudah dijawab. Klik nomor untuk berpindah soal."
            : "Kotak terisi = sudah dijawab. Kuis ini tidak mengizinkan kembali ke soal sebelumnya."}
        </p>

        {submitError ? (
          <p
            role="alert"
            className="badge danger"
            style={{ display: "flex", marginTop: "12px", width: "100%" }}
          >
            {submitError}
          </p>
        ) : null}
      </main>

      <footer className="qfoot">
        {allowBacktrack ? (
          <button
            type="button"
            className="btn"
            disabled={page === 0}
            onClick={() => goPage(page - 1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Sebelumnya
          </button>
        ) : null}
        <span className="qpos">
          {page + 1} / {pages.length}
        </span>
        {onLast ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void finish(false)}
            disabled={submitting}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
            {submitting ? "Mengirim…" : "Selesai & kirim"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => goPage(page + 1)}
          >
            Berikutnya
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </footer>
    </>
  );
}
