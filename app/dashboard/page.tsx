import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  getCourses,
  getCurrentUser,
  getMeetings,
  getMyEnrolledCourseIds,
  getMyResults,
  getRecentAnnouncements,
  getUpcomingDeadlines,
} from "@/lib/data";
import type { Meeting } from "@/lib/data";

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
  .empty-line { padding: 14px 0; color: var(--muted); font-size: 13.5px; }
`;

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

function deadlineBadge(iso: string): { cls: string; label: string } {
  const days = Math.floor(
    (new Date(iso).getTime() - Date.now()) / (24 * 3600 * 1000),
  );
  if (days < 1) return { cls: "badge danger", label: "Hari ini" };
  if (days < 2) return { cls: "badge danger", label: "Besok" };
  if (days < 7) return { cls: "badge warn", label: `${days} hari` };
  return { cls: "badge info", label: `${days} hari` };
}

function relTime(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} mnt lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}

export default async function DashboardPage() {
  const [courses, user, results, enrolledIds, deadlines, announcements] =
    await Promise.all([
      getCourses(),
      getCurrentUser(),
      getMyResults(),
      getMyEnrolledCourseIds(),
      getUpcomingDeadlines(),
      getRecentAnnouncements(),
    ]);

  // Courses the student is actually enrolled in (published only).
  const enrolled = courses.filter(
    (c) => c.isPublished && enrolledIds.has(c.id),
  );
  const others = courses
    .filter((c) => !enrolled.some((e) => e.id === c.id))
    .slice(0, Math.max(0, 3 - enrolled.length));

  // Per-course meetings for progress (small N — one query per enrolled course).
  const meetingsByCourse = new Map<string, Meeting[]>(
    await Promise.all(
      enrolled.map(
        async (c) => [c.id, await getMeetings(c.slug)] as [string, Meeting[]],
      ),
    ),
  );
  const primary = enrolled[0] ?? null;
  const meetings = primary ? (meetingsByCourse.get(primary.id) ?? []) : [];

  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter(
    (m) => m.state === "completed",
  ).length;
  const progressPct =
    totalMeetings > 0
      ? Math.round((completedMeetings / totalMeetings) * 100)
      : 0;

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

  const pendingRows = results.filter((r) => r.status === "belum-dikerjakan");
  const nextMeeting =
    meetings.find((m) => m.state === "available") ??
    meetings.find((m) => m.state !== "completed") ??
    null;

  const recent = results
    .filter((r) => r.date !== null)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 3);

  const scoreBadge = (score: number | null) => {
    if (score === null) return "badge";
    return score >= 80 ? "badge ok mono" : "badge warn mono";
  };

  const progressOf = (courseId: string) => {
    const ms = meetingsByCourse.get(courseId) ?? [];
    if (!ms.length) return 0;
    return Math.round(
      (ms.filter((m) => m.state === "completed").length / ms.length) * 100,
    );
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
            {enrolled.length}
            <small> / {courses.length}</small>
          </div>
          <div className="d">{primary?.title ?? "Belum terdaftar kursus"}</div>
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
          <div className="v">{pendingRows.length}</div>
          <div className="d">
            {pendingRows[0]
              ? `${pendingRows[0].meetingLabel} · ${pendingRows[0].meetingTitle}`
              : "Tidak ada"}
          </div>
        </div>
      </div>

      {primary && nextMeeting ? (
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
            Lanjutkan materi “{nextMeeting.title}”, lalu kerjakan kuisnya untuk
            membuka pertemuan berikutnya.
          </p>
          <div className="progress">
            <i style={{ width: `${progressPct}%` }} />
          </div>
          <div className="row gap-sm">
            <Link
              className="btn btn-lg"
              style={{ background: "#fff", color: "#06302b" }}
              href={`/courses/${primary.slug}/${nextMeeting.slug}`}
            >
              Lanjutkan materi
            </Link>
            {nextMeeting.quizId && nextMeeting.state === "available" && (
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
      ) : (
        <div className="continue" style={{ marginBottom: "22px" }}>
          <span className="eyebrow">
            {primary ? "Semua pertemuan selesai" : "Belum ada kursus"}
          </span>
          <h2>
            {primary
              ? "Kerja bagus — semua pertemuan tuntas! 🎉"
              : "Kamu belum terdaftar di kursus mana pun"}
          </h2>
          <p>
            {primary
              ? "Pantau nilai kamu di halaman Nilai Saya, atau tinjau kembali materi kapan saja."
              : "Hubungi admin untuk didaftarkan, atau tunggu kursus baru terbit."}
          </p>
          <div className="row gap-sm" style={{ marginTop: "16px" }}>
            <Link
              className="btn btn-lg"
              style={{ background: "#fff", color: "#06302b" }}
              href={primary ? "/me/results" : "/courses"}
            >
              {primary ? "Lihat nilai saya" : "Jelajahi katalog"}
            </Link>
          </div>
        </div>
      )}

      <div className="row between" style={{ marginBottom: "14px" }}>
        <h2>Mata kuliah saya</h2>
        <Link href="/courses" className="btn btn-sm btn-ghost">
          Lihat semua →
        </Link>
      </div>
      <div className="grid grid-3" style={{ marginBottom: "26px" }}>
        {enrolled.length === 0 ? (
          <p className="empty-line">
            Belum ada kursus yang bisa diikuti saat ini.
          </p>
        ) : (
          enrolled.slice(0, 3).map((c) => {
            const pct = progressOf(c.id);
            const count = meetingsByCourse.get(c.id)?.length ?? 0;
            return (
              <Link key={c.id} className="crs" href={`/courses/${c.slug}`}>
                <div className="cap" style={{ background: c.coverGradient }}>
                  {c.title}
                </div>
                <div>
                  <div className="ttl">{c.title}</div>
                  <div className="muted" style={{ fontSize: "12.5px" }}>
                    {count} pertemuan · {pct}% selesai
                  </div>
                </div>
                <div className="progress thin">
                  <i style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })
        )}
        {others.map((c) => (
          <div
            key={c.id}
            className="crs"
            style={{ opacity: 0.7, cursor: "default" }}
          >
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
              {recent.length === 0 ? (
                <p className="empty-line">
                  Belum ada kuis yang dikerjakan — hasilmu akan muncul di sini.
                </p>
              ) : (
                recent.map((r, i) => (
                  <div
                    key={r.quizId}
                    className="row between"
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        i < recent.length - 1
                          ? "1px solid var(--border)"
                          : undefined,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {r.meetingLabel} — {r.meetingTitle}
                      </div>
                      <div className="muted" style={{ fontSize: "12.5px" }}>
                        {r.courseTitle}
                      </div>
                    </div>
                    <span className={scoreBadge(r.score)}>{r.score ?? "—"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Tenggat &amp; pengumuman</h3>
          </div>
          <div className="card-pad" style={{ paddingTop: "6px" }}>
            {deadlines.length === 0 && announcements.length === 0 ? (
              <p className="empty-line">
                Tidak ada tenggat dalam waktu dekat. Santai, tapi jangan lupa
                belajar. ✨
              </p>
            ) : (
              <>
                {deadlines.map((d, i) => {
                  const badge = deadlineBadge(d.availableUntil);
                  return (
                    <div
                      key={d.quizId}
                      className="row gap-sm"
                      style={{
                        padding: "12px 0",
                        borderBottom:
                          i < deadlines.length - 1 || announcements.length > 0
                            ? "1px solid var(--border)"
                            : undefined,
                      }}
                    >
                      <span className={badge.cls} style={{ flex: "none" }}>
                        <span className="dot" />
                        {badge.label}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{d.quizTitle}</div>
                        <div className="muted" style={{ fontSize: "12.5px" }}>
                          Batas {dateFmt.format(new Date(d.availableUntil))}
                          {d.timeLimitMinutes
                            ? ` · ${d.timeLimitMinutes} menit`
                            : ""}
                          {d.maxAttempts
                            ? ` · ${d.maxAttempts} percobaan`
                            : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {announcements.map((a, i) => (
                  <div
                    key={`${a.title}-${i}`}
                    className="row gap-sm"
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        i < announcements.length - 1
                          ? "1px solid var(--border)"
                          : undefined,
                    }}
                  >
                    <span className="badge info" style={{ flex: "none" }}>
                      Info
                    </span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{a.title}</div>
                      <div className="muted" style={{ fontSize: "12.5px" }}>
                        {a.meta} · {relTime(a.publishedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
