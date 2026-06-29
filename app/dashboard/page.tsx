import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  getCourses,
  getCurrentUser,
  getMeetings,
  getMyResults,
} from "@/lib/data";

export const metadata: Metadata = { title: "Beranda" };

const dashboardStyles = `
  .continue {
    background: linear-gradient(150deg, oklch(28% 0.06 200), oklch(21% 0.045 235));
    color: #fff; border-radius: var(--r-xl); padding: clamp(20px,3vw,30px); position: relative; overflow: hidden;
  }
  .continue .eyebrow { color: oklch(85% 0.1 180); }
  .continue h2 { color: #fff; margin: 8px 0 4px; }
  .continue p { color: rgba(255,255,255,.78); max-width: 46ch; }
  .continue .progress { background: rgba(255,255,255,.18); margin: 18px 0; max-width: 380px; }
  .continue .progress > i { background: oklch(82% 0.13 180); }
  .continue .mol { position: absolute; right: -30px; top: -30px; opacity: .14; }
  .crs { display: flex; flex-direction: column; gap: 12px; padding: 16px; border:1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--shadow-sm); transition: transform .08s, border-color .15s; text-decoration:none; color:inherit; }
  .crs:hover { transform: translateY(-2px); border-color: var(--accent); text-decoration:none; }
  .crs .cap { height: 84px; border-radius: var(--r); display:flex; align-items:flex-end; padding:10px; color:#fff; font-family:var(--font-display); font-weight:700; }
  .crs .ttl { font-family:var(--font-display); font-weight:700; color:var(--fg-strong); }
`;

export default async function DashboardPage() {
  const [courses, user, results, meetings] = await Promise.all([
    getCourses(),
    getCurrentUser(),
    getMyResults(),
    getMeetings("kimia-dasar"),
  ]);
  const kimiaDasar = (courses.find((c) => c.slug === "kimia-dasar") ??
    courses[0])!;
  const comingSoon = courses.filter((c) => !c.isPublished).slice(0, 2);
  const recent = results.slice().reverse().slice(0, 3);

  // --- Stat-card computations (all derived from real data) ------------------
  // "Kursus aktif": enrolled published courses. Kimia Dasar is the one the
  // student is enrolled in; denominator is the full catalog size.
  const enrolledCount = kimiaDasar.isPublished ? 1 : 0;
  const totalCourses = courses.length;

  // "Pertemuan selesai": meetings with a graded passing attempt. A passing
  // attempt shows up in results as status 'lulus'.
  const totalMeetings = meetings.length;
  const completedMeetings = results.filter((r) => r.status === "lulus").length;
  const progressPct =
    totalMeetings > 0
      ? Math.round((completedMeetings / totalMeetings) * 100)
      : 0;

  // "Rata-rata nilai": average of the scored quiz results.
  const scoredResults = results.filter(
    (r): r is typeof r & { score: number } => r.score !== null,
  );
  const avgScore =
    scoredResults.length > 0
      ? Math.round(
          scoredResults.reduce((sum, r) => sum + r.score, 0) /
            scoredResults.length,
        )
      : null;

  // "Kuis menunggu": meetings that have a quiz but no graded attempt yet.
  const gradedQuizIds = new Set(
    results
      .filter((r) => r.status !== "belum-dikerjakan")
      .map((r) => r.quizId),
  );
  const pendingQuizMeetings = meetings.filter(
    (m) => m.quizId !== null && !gradedQuizIds.has(m.quizId),
  );
  const pendingCount = pendingQuizMeetings.length;
  const nextPending = pendingQuizMeetings[0];

  // "Lanjut belajar": first meeting not yet completed.
  const nextMeeting =
    meetings.find((m) => m.state !== "completed") ?? meetings[0];

  const scoreBadge = (score: number | null) => {
    if (score === null) return "badge";
    return score >= 80 ? "badge ok mono" : "badge warn mono";
  };

  return (
    <AppShell
      crumb={
        <>
          Halo, <b>{user.fullName.split(" ")[0]}</b> 👋
        </>
      }
    >
      <style>{dashboardStyles}</style>

      <div className="grid grid-4" style={{ marginBottom: "18px" }}>
        <div className="stat">
          <div className="k">Kursus aktif</div>
          <div className="v">
            {enrolledCount}
            <small> / {totalCourses}</small>
          </div>
          <div className="d">{kimiaDasar.title}</div>
        </div>
        <div className="stat">
          <div className="k">Pertemuan selesai</div>
          <div className="v">
            {completedMeetings}
            <small> / {totalMeetings}</small>
          </div>
          <div className="d">{progressPct}% progres</div>
        </div>
        <div className="stat">
          <div className="k">Rata-rata nilai</div>
          <div className="v mono">{avgScore ?? "—"}</div>
          <div className="d">dari {scoredResults.length} kuis</div>
        </div>
        <div className="stat">
          <div className="k">Kuis menunggu</div>
          <div className="v">{pendingCount}</div>
          <div className="d">
            {nextPending
              ? `${nextPending.label} · ${nextPending.title}`
              : "Tidak ada"}
          </div>
        </div>
      </div>

      <div className="continue" style={{ marginBottom: "22px" }}>
        <svg
          className="mol"
          width="220"
          height="220"
          viewBox="0 0 200 200"
          fill="none"
          stroke="#fff"
          strokeWidth={1.5}
        >
          <circle cx="60" cy="60" r="14" />
          <circle cx="140" cy="60" r="14" />
          <circle cx="100" cy="130" r="14" />
          <path d="M74 60h52M68 72 92 118M132 72 108 118" />
        </svg>
        <span className="eyebrow">Lanjut belajar</span>
        <h2>
          {nextMeeting.label} — {nextMeeting.title}
        </h2>
        <p>
          Lanjutkan materi “{nextMeeting.title}”, lalu kerjakan kuis sebelum
          tenggat.
        </p>
        <div className="progress">
          <i style={{ width: `${progressPct}%` }} />
        </div>
        <div className="row gap-sm">
          <Link
            className="btn btn-lg"
            style={{ background: "#fff", color: "#06302b" }}
            href={`/courses/kimia-dasar/${nextMeeting.slug}`}
          >
            Lanjutkan materi
          </Link>
          {nextMeeting.quizId && (
            <Link
              className="btn btn-lg btn-ghost"
              style={{ color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}
              href={`/quiz/${nextMeeting.quizId}`}
            >
              Mulai kuis
            </Link>
          )}
        </div>
      </div>

      <div className="row between" style={{ marginBottom: "14px" }}>
        <h2>Mata kuliah saya</h2>
        <Link href="/courses" className="btn btn-sm btn-ghost">
          Lihat semua →
        </Link>
      </div>
      <div className="grid grid-3" style={{ marginBottom: "26px" }}>
        <Link className="crs" href={`/courses/${kimiaDasar.slug}`}>
          <div className="cap" style={{ background: kimiaDasar.coverGradient }}>
            {kimiaDasar.title}
          </div>
          <div>
            <div className="ttl">{kimiaDasar.title}</div>
            <div className="muted" style={{ fontSize: "12.5px" }}>
              {totalMeetings} pertemuan · {progressPct}% selesai
            </div>
          </div>
          <div className="progress thin">
            <i style={{ width: `${progressPct}%` }} />
          </div>
        </Link>
        {comingSoon.map((c) => (
          <div key={c.id} className="crs" style={{ opacity: 0.7, cursor: "default" }}>
            <div className="cap" style={{ background: c.coverGradient }}>
              {c.title}
            </div>
            <div>
              <div className="ttl">{c.title}</div>
              <div className="muted" style={{ fontSize: "12.5px" }}>
                Belum terdaftar
              </div>
            </div>
            <span className="badge warn" style={{ alignSelf: "flex-start" }}>
              <span className="dot" />
              Segera hadir
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Hasil kuis terbaru</h3>
            <span className="spacer" />
            <Link href="/me/results" style={{ fontSize: "13px" }}>
              Semua nilai
            </Link>
          </div>
          <div className="card-pad" style={{ paddingTop: "6px" }}>
            <div className="stack" style={{ gap: 0 }}>
              {recent.map((r, i) => (
                <div
                  key={r.quizId}
                  className="row between"
                  style={{
                    padding: "12px 0",
                    borderBottom:
                      i < recent.length - 1 ? "1px solid var(--border)" : undefined,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {r.meetingLabel.replace("Pertemuan", "Pertemuan")} — {r.meetingTitle}
                    </div>
                    <div className="muted" style={{ fontSize: "12.5px" }}>
                      {r.courseTitle}
                    </div>
                  </div>
                  <span className={scoreBadge(r.score)}>{r.score ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Tenggat &amp; pengumuman</h3>
          </div>
          <div className="card-pad" style={{ paddingTop: "6px" }}>
            <div
              className="row gap-sm"
              style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}
            >
              <span className="badge danger" style={{ flex: "none" }}>
                <span className="dot" />
                Besok
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>Kuis Pertemuan 4 — Termokimia</div>
                <div className="muted" style={{ fontSize: "12.5px" }}>
                  Batas 24 Jun, 23:59 · 20 menit · 1 percobaan
                </div>
              </div>
            </div>
            <div className="row gap-sm" style={{ padding: "12px 0" }}>
              <span className="badge info" style={{ flex: "none" }}>
                Info
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>Materi Pertemuan 5 sudah terbit</div>
                <div className="muted" style={{ fontSize: "12.5px" }}>
                  Laju Reaksi — Bu Maya · 3 hari lalu
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
