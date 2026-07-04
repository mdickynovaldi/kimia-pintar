import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/auth/dal";
import {
  attemptStatusLabel,
  rowToCourse,
  rowToMaterial,
  rowToMeeting,
  rowToProfile,
  rowToQuestion,
  rowToQuiz,
  rowToVideo,
} from "./map";
import { DEFAULT_SETTINGS } from "./types";
import type {
  ActivityItem,
  AdminDashboardData,
  AnnouncementItem,
  AttemptState,
  Course,
  GradebookRow,
  GradingAnswer,
  GradingDetail,
  GradingQueueItem,
  Meeting,
  PlatformSettings,
  Profile,
  Question,
  Quiz,
  QuizAttempt,
  ResultRow,
  UpcomingDeadline,
} from "./types";

type Row = Record<string, unknown>;

// ---- helpers ---------------------------------------------------------------

/** Quiz ids the current user has a graded attempt on (→ meeting "completed"). */
async function completedQuizIds(): Promise<Set<string>> {
  const user = await getSessionUser();
  if (!user) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, status")
    .eq("student_id", user.id)
    .eq("status", "graded");
  return new Set((data ?? []).map((r) => r.quiz_id as string));
}

// ---- courses ---------------------------------------------------------------

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*, meetings(count), quizzes(count)")
    .order("sort_order");
  return (data ?? []).map((row: Row) =>
    rowToCourse(
      row,
      ((row.meetings as Array<{ count: number }>)?.[0]?.count) ?? 0,
      ((row.quizzes as Array<{ count: number }>)?.[0]?.count) ?? 0,
    ),
  );
}

export async function getPublishedCourses(): Promise<Course[]> {
  return (await getCourses()).filter((c) => c.isPublished);
}

export async function getCourse(slug: string): Promise<Course | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*, meetings(count), quizzes(count)")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return undefined;
  return rowToCourse(
    data,
    ((data.meetings as Array<{ count: number }>)?.[0]?.count) ?? 0,
    ((data.quizzes as Array<{ count: number }>)?.[0]?.count) ?? 0,
  );
}

// ---- meetings --------------------------------------------------------------

export async function getMeetings(courseSlug: string): Promise<Meeting[]> {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", courseSlug)
    .maybeSingle();
  if (!course) return [];

  const [{ data: rows }, completed] = await Promise.all([
    supabase
      .from("meetings")
      .select("*, quizzes(id), materials(id), videos(id)")
      .eq("course_id", course.id)
      .order("sort_order"),
    completedQuizIds(),
  ]);

  // Sequential unlock: a meeting is "completed" when its quiz has a graded
  // attempt. Meetings stay unlocked until you hit an UNCOMPLETED quiz meeting —
  // that one is available, everything after it is locked. Quiz-less meetings
  // never block progression (avoids a permanent deadlock on content-only
  // meetings that can never be "completed").
  let blocked = false;
  return (rows ?? []).map((row: Row) => {
    const quizId = (row.quizzes as Array<{ id: string }>)?.[0]?.id ?? null;
    const isCompleted = quizId ? completed.has(quizId) : false;
    let state: "completed" | "available" | "locked";
    if (isCompleted) {
      state = "completed";
    } else if (blocked) {
      state = "locked";
    } else {
      state = "available";
      if (quizId) blocked = true; // must pass this quiz before later meetings
    }
    // Shallow material/video stubs so list views can show real counts without
    // hydrating full content (the meeting page hydrates via getMeeting).
    const materialStubs = ((row.materials as Array<{ id: string }>) ?? []).map(
      (m) => ({ id: m.id }),
    );
    const videoStubs = ((row.videos as Array<{ id: string }>) ?? []).map(
      (v) => ({ id: v.id }),
    );
    return rowToMeeting(row, {
      courseSlug,
      state,
      quizId,
      materials: materialStubs as Meeting["materials"],
      videos: videoStubs as Meeting["videos"],
    });
  });
}

/** Quizzes with a real future deadline (available_until), for the dashboard's
 * "Tenggat" card. RLS scopes this to the student's enrolled courses. */
export async function getUpcomingDeadlines(): Promise<UpcomingDeadline[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quizzes")
    .select("id, title, time_limit_minutes, max_attempts, available_until, meetings(sort_order)")
    .eq("is_published", true)
    .not("available_until", "is", null)
    .gt("available_until", new Date().toISOString())
    .order("available_until")
    .limit(3);
  return (data ?? []).map((q) => ({
    quizId: q.id as string,
    quizTitle: q.title as string,
    meetingLabel: `Pertemuan ${(q.meetings as { sort_order?: number } | null)?.sort_order ?? ""}`,
    availableUntil: q.available_until as string,
    timeLimitMinutes: (q.time_limit_minutes as number | null) ?? null,
    maxAttempts: (q.max_attempts as number | null) ?? null,
  }));
}

/** Recently-published meetings (announcement feed on the dashboard). */
export async function getRecentAnnouncements(): Promise<AnnouncementItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select("title, sort_order, updated_at, courses(title, instructor)")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(2);
  return (data ?? []).map((m) => {
    const course = m.courses as { title?: string; instructor?: string } | null;
    return {
      title: `Materi Pertemuan ${m.sort_order} sudah terbit`,
      meta: `${m.title} — ${course?.instructor ?? course?.title ?? ""}`,
      publishedAt: (m.updated_at as string) ?? "",
    };
  });
}

/** Course ids the current student is actively enrolled in. */
export async function getMyEnrolledCourseIds(): Promise<Set<string>> {
  const user = await getSessionUser();
  if (!user) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", user.id)
    .eq("status", "active");
  return new Set((data ?? []).map((r) => r.course_id as string));
}

export async function getMeeting(
  courseSlug: string,
  meetingSlug: string,
): Promise<Meeting | undefined> {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", courseSlug)
    .maybeSingle();
  if (!course) return undefined;

  const { data: m } = await supabase
    .from("meetings")
    .select("*")
    .eq("course_id", course.id)
    .eq("slug", meetingSlug)
    .maybeSingle();
  if (!m) return undefined;

  const [{ data: materials }, { data: videos }, { data: quiz }, completed] =
    await Promise.all([
      supabase.from("materials").select("*").eq("meeting_id", m.id).order("sort_order"),
      supabase.from("videos").select("*").eq("meeting_id", m.id).order("sort_order"),
      supabase.from("quizzes").select("id").eq("meeting_id", m.id).maybeSingle(),
      completedQuizIds(),
    ]);

  const quizId = (quiz?.id as string) ?? null;
  const state = quizId && completed.has(quizId) ? "completed" : "available";

  return rowToMeeting(m, {
    courseSlug,
    state,
    quizId,
    materials: (materials ?? []).map(rowToMaterial),
    videos: (videos ?? []).map(rowToVideo),
  });
}

/** Admin: course by id (for the course editor route /admin/courses/[id]). */
export async function getCourseById(id: string): Promise<Course | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*, meetings(count), quizzes(count)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return undefined;
  return rowToCourse(
    data,
    ((data.meetings as Array<{ count: number }>)?.[0]?.count) ?? 0,
    ((data.quizzes as Array<{ count: number }>)?.[0]?.count) ?? 0,
  );
}

/** Admin: meetings of a course by id (publish-state, not student progress). */
export async function getMeetingsByCourseId(courseId: string): Promise<Meeting[]> {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();
  const slug = (course?.slug as string) ?? "";
  const { data: rows } = await supabase
    .from("meetings")
    .select("*, quizzes(id)")
    .eq("course_id", courseId)
    .order("sort_order");
  return (rows ?? []).map((row: Row) =>
    rowToMeeting(row, {
      courseSlug: slug,
      state: (row.is_published as boolean) ? "available" : "locked",
      quizId: (row.quizzes as Array<{ id: string }>)?.[0]?.id ?? null,
    }),
  );
}

/** Admin: full meeting by id with materials + videos (for the meeting editor). */
export async function getMeetingById(
  meetingId: string,
): Promise<Meeting | undefined> {
  const supabase = await createClient();
  const { data: m } = await supabase
    .from("meetings")
    .select("*, courses(slug)")
    .eq("id", meetingId)
    .maybeSingle();
  if (!m) return undefined;
  const courseSlug = (m.courses as { slug?: string } | null)?.slug ?? "";
  const [{ data: materials }, { data: videos }, { data: quiz }] =
    await Promise.all([
      supabase.from("materials").select("*").eq("meeting_id", m.id).order("sort_order"),
      supabase.from("videos").select("*").eq("meeting_id", m.id).order("sort_order"),
      supabase.from("quizzes").select("id").eq("meeting_id", m.id).maybeSingle(),
    ]);
  return rowToMeeting(m, {
    courseSlug,
    state: "available",
    quizId: (quiz?.id as string) ?? null,
    materials: (materials ?? []).map(rowToMaterial),
    videos: (videos ?? []).map(rowToVideo),
  });
}

// ---- quizzes ---------------------------------------------------------------

/** Full quiz WITH answer keys — admin/owner server use only (RLS-guarded). */
export async function getQuiz(quizId: string): Promise<Quiz | undefined> {
  const supabase = await createClient();
  const { data: q } = await supabase
    .from("quizzes")
    .select("*, meetings(slug), courses(slug)")
    .eq("id", quizId)
    .maybeSingle();
  if (!q) return undefined;

  const meetingSlug =
    (q.meetings as { slug?: string } | null)?.slug ?? "";
  const courseSlug = (q.courses as { slug?: string } | null)?.slug ?? "";

  // question_options is admin-only via RLS; use the service-role client when
  // available so the admin builder + result review can read keys server-side.
  const reader = hasServiceRole ? createAdminClient() : supabase;
  const { data: questions } = await reader
    .from("questions")
    .select("*, question_options(*)")
    .eq("quiz_id", quizId)
    .order("sort_order");

  const mapped: Question[] = (questions ?? []).map((row: Row) =>
    rowToQuestion({ ...row, options: row.question_options }),
  );

  return rowToQuiz(q, { courseSlug, meetingSlug, questions: mapped });
}

/** Sanitized questions for the student player — NO `is_correct`. Uses the RPC.
 * `seed` (the attempt id) makes shuffle_questions/shuffle_options stable per
 * attempt while differing between attempts. */
export async function getSanitizedQuestions(
  quizId: string,
  seed?: string,
): Promise<Question[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_quiz_questions", {
    p_quiz: quizId,
    p_seed: seed ?? null,
  });
  const arr = (data as Row[]) ?? [];
  return arr.map((row) =>
    rowToQuestion({
      ...row,
      // RPC already omits is_correct; options come through without keys.
    }),
  );
}

// ---- attempts --------------------------------------------------------------

export async function getAttempt(attemptId: string): Promise<QuizAttempt | null> {
  const supabase = await createClient();
  const user = await getSessionUser();

  const { data: a } = await supabase
    .from("quiz_attempts")
    .select("*, quizzes(show_correct_answers, passing_score, available_until)")
    .eq("id", attemptId)
    .maybeSingle();
  if (!a) return null;

  // ownership guard (RLS already enforces this; double-check in code)
  if (user && a.student_id !== user.id && user.role !== "admin") return null;

  const quizMeta = a.quizzes as {
    show_correct_answers?: string;
    passing_score?: number;
    available_until?: string | null;
  } | null;
  const policy = quizMeta?.show_correct_answers ?? "after_submit";
  // Keys are NEVER revealed while the attempt is still open (otherwise a second
  // tab on the result URL leaks answers mid-quiz). after_close additionally
  // requires the availability window to have actually closed — a NULL
  // available_until means the quiz never closes, so nothing is revealed.
  const finished = a.status !== "in_progress";
  const closed =
    !!quizMeta?.available_until &&
    new Date(quizMeta.available_until) < new Date();
  const reveal =
    finished && (policy === "after_submit" || (policy === "after_close" && closed));

  const { data: answers } = await supabase
    .from("attempt_answers")
    .select("*, questions(prompt, explanation, sort_order, type)")
    .eq("attempt_id", attemptId);

  // Map option ids → text so we can render the student's chosen options ("given")
  // and, when policy allows, the correct answers. Options are admin-only via RLS,
  // so this read uses the service-role client server-side.
  const optionText = new Map<string, string>(); // optionId → content
  const correctById = new Map<string, string>(); // questionId → correct contents
  if (hasServiceRole) {
    const admin = createAdminClient();
    const qIds = (answers ?? []).map((x) => x.question_id as string);
    if (qIds.length) {
      const { data: opts } = await admin
        .from("question_options")
        .select("id, question_id, content, is_correct")
        .in("question_id", qIds);
      const grouped = new Map<string, string[]>();
      for (const o of opts ?? []) {
        optionText.set(o.id as string, o.content as string);
        if (o.is_correct) {
          const arr = grouped.get(o.question_id as string) ?? [];
          arr.push(o.content as string);
          grouped.set(o.question_id as string, arr);
        }
      }
      for (const [qid, contents] of grouped) correctById.set(qid, contents.join(", "));
    }
  }

  const review = (answers ?? [])
    .sort(
      (x, y) =>
        ((x.questions as { sort_order?: number })?.sort_order ?? 0) -
        ((y.questions as { sort_order?: number })?.sort_order ?? 0),
    )
    .map((row) => {
      const q = row.questions as {
        prompt?: string;
        explanation?: string;
        type?: string;
      } | null;
      const selected = (row.selected_option_ids as string[] | null) ?? [];
      const given =
        (row.answer_text as string) ||
        selected.map((id) => optionText.get(id) ?? "—").join(", ") ||
        "—";
      // Manual-graded items carry is_correct = NULL until an admin scores them.
      const pending =
        row.is_correct == null &&
        (a.status as string) === "awaiting_manual_grade";
      return {
        questionId: row.question_id as string,
        prompt: q?.prompt ?? "",
        given,
        correct: reveal ? (correctById.get(row.question_id as string) ?? "—") : "—",
        isCorrect: (row.is_correct as boolean | null) ?? false,
        pending,
        explanation: reveal ? q?.explanation ?? undefined : undefined,
      };
    });

  const attempt: QuizAttempt = {
    id: a.id as string,
    quizId: a.quiz_id as string,
    studentId: a.student_id as string,
    attemptNumber: (a.attempt_number as number) ?? 1,
    status: a.status as QuizAttempt["status"],
    score: (a.score as number | null) ?? null,
    maxScore: (a.max_score as number | null) ?? null,
    percentage: (a.percentage as number | null) ?? null,
    passed: (a.passed as boolean | null) ?? null,
    correctCount: review.filter((r) => r.isCorrect).length,
    questionCount: review.length,
    timeSpentLabel: secondsToLabel(a.time_spent_seconds as number | null),
    startedAt: (a.started_at as string) ?? "",
    submittedAt: (a.submitted_at as string | null) ?? null,
    review,
  };
  return attempt;
}

function secondsToLabel(s: number | null): string {
  if (!s || s < 0) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
}

/** Lightweight attempt state for the player: status, deadline, and the saved
 * answers so a reload/resume restores everything the student already did. */
export async function getAttemptState(
  attemptId: string,
): Promise<AttemptState | null> {
  const supabase = await createClient();
  const { data: a } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, status, deadline_at")
    .eq("id", attemptId)
    .maybeSingle();
  if (!a) return null;

  const answers: AttemptState["answers"] = {};
  const { data: rows } = await supabase
    .from("attempt_answers")
    .select("question_id, selected_option_ids, answer_text")
    .eq("attempt_id", attemptId);
  for (const r of rows ?? []) {
    answers[r.question_id as string] = {
      optionIds: (r.selected_option_ids as string[] | null) ?? [],
      text: (r.answer_text as string | null) ?? null,
    };
  }

  return {
    id: a.id as string,
    quizId: a.quiz_id as string,
    status: a.status as AttemptState["status"],
    deadlineAt: (a.deadline_at as string | null) ?? null,
    answers,
  };
}

// ---- progress + attempt stats ----------------------------------------------

/** Completed item ids (materials/videos) for the current user in a meeting. */
export async function getContentProgress(meetingId: string): Promise<string[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_progress")
    .select("item_id")
    .eq("student_id", user.id)
    .eq("meeting_id", meetingId)
    .eq("completed", true);
  return (data ?? []).map((r) => r.item_id as string);
}

/** Attempts used vs allowed for the current user on a quiz. */
export async function getAttemptStats(
  quizId: string,
): Promise<{ used: number; max: number | null }> {
  const supabase = await createClient();
  const { data: q } = await supabase
    .from("quizzes")
    .select("max_attempts")
    .eq("id", quizId)
    .maybeSingle();
  const max = (q?.max_attempts as number | null) ?? null;
  const user = await getSessionUser();
  if (!user) return { used: 0, max };
  // Grade any timer-expired in_progress attempt first so the counter here and
  // the limit inside start_quiz_attempt always agree (no zombie lockouts).
  await supabase.rpc("finalize_expired_attempts", { p_quiz: quizId });
  // Only FINALIZED attempts consume the limit — an open (still alive)
  // in_progress attempt is resumable (see startQuiz), not a used-up try.
  const { count } = await supabase
    .from("quiz_attempts")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", quizId)
    .eq("student_id", user.id)
    .neq("status", "in_progress");
  return { used: count ?? 0, max };
}

// ---- students / enrollments ------------------------------------------------

export async function getStudents(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name");
  const rows = data ?? [];

  // Emails live in auth.users, not profiles — fetch them via the admin API.
  const emailById = new Map<string, string>();
  if (hasServiceRole && rows.length) {
    const admin = createAdminClient();
    for (let page = 1; page <= 10; page++) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      const users = list?.users ?? [];
      for (const u of users) if (u.email) emailById.set(u.id, u.email);
      if (users.length < 200) break;
    }
  }
  return rows.map((r: Row) =>
    rowToProfile(r, emailById.get(r.id as string) ?? null),
  );
}

export async function getEnrollments() {
  const supabase = await createClient();
  const { data } = await supabase.from("enrollments").select("*");
  return (data ?? []).map((r: Row) => ({
    id: r.id as string,
    courseId: r.course_id as string,
    studentId: r.student_id as string,
    status: r.status as "active" | "completed" | "dropped",
    enrolledAt: (r.enrolled_at as string) ?? "",
  }));
}

// ---- gradebook + results ---------------------------------------------------

export async function getGradebook(): Promise<GradebookRow[]> {
  const supabase = await createClient();
  const [{ data: students }, { data: attempts }, { data: quizzes }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, student_no").eq("role", "student"),
      supabase
        .from("quiz_attempts")
        .select("id, student_id, quiz_id, percentage, status, submitted_at"),
      supabase.from("quizzes").select("id, grading_method, meetings(sort_order)"),
    ]);

  const quizMeta = new Map<string, { label: string; method: string }>();
  for (const q of quizzes ?? []) {
    const order = (q.meetings as { sort_order?: number } | null)?.sort_order;
    if (order) {
      quizMeta.set(q.id as string, {
        label: `P${order}`,
        method: (q.grading_method as string) ?? "highest",
      });
    }
  }

  return (students ?? []).map((s) => {
    const scores: Record<string, number | null> = {};
    for (const [quizId, meta] of quizMeta) {
      const graded = (attempts ?? [])
        .filter(
          (a) =>
            a.student_id === s.id &&
            a.quiz_id === quizId &&
            a.status === "graded" &&
            a.percentage != null,
        )
        .map((a) => ({
          id: a.id as string,
          pct: Number(a.percentage),
          submittedAt: (a.submitted_at as string | null) ?? null,
        }));
      const recorded = applyGradingMethod(graded, meta.method);
      if (recorded) scores[meta.label] = recorded.score;
    }
    const vals = Object.values(scores).filter((v): v is number => v != null);
    const average = vals.length
      ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length)
      : null;
    return {
      studentId: s.id as string,
      studentName: s.full_name as string,
      studentNo: (s.student_no as string) ?? "—",
      quizScores: scores,
      average,
    };
  });
}

/** Relative time in Indonesian, e.g. "12 mnt", "5 jam", "1 hari". */
function timeAgoId(iso: string | null | undefined): string {
  if (!iso) return "—";
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "baru saja";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} mnt`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam`;
  return `${Math.floor(hours / 24)} hari`;
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const supabase = await createClient();
  const [{ data: students }, { data: courses }, { data: quizzes }, { data: attempts }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .eq("role", "student"),
      supabase.from("courses").select("id, is_published"),
      supabase.from("quizzes").select("id, meetings(sort_order, title)"),
      supabase
        .from("quiz_attempts")
        .select("student_id, quiz_id, percentage, status, submitted_at")
        .neq("status", "in_progress")
        .order("submitted_at", { ascending: false })
        .limit(500),
    ]);

  const nameById = new Map(
    (students ?? []).map((s) => [s.id as string, s.full_name as string]),
  );
  const quizMeta = new Map<string, { order: number; title: string }>();
  for (const q of quizzes ?? []) {
    const m = q.meetings as { sort_order?: number; title?: string } | null;
    if (m?.sort_order) {
      quizMeta.set(q.id as string, { order: m.sort_order, title: m.title ?? "" });
    }
  }
  const quizLabelOf = (quizId: string): string => {
    const m = quizMeta.get(quizId);
    return m ? `P${m.order} — ${m.title}` : "Kuis";
  };

  const graded = (attempts ?? []).filter((a) => a.status === "graded");
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;

  // Distinct graded students per quiz → completion % per meeting.
  const doneByQuiz = new Map<string, Set<string>>();
  for (const a of graded) {
    const set = doneByQuiz.get(a.quiz_id as string) ?? new Set<string>();
    set.add(a.student_id as string);
    doneByQuiz.set(a.quiz_id as string, set);
  }
  const totalStudents = (students ?? []).length;
  const meetingCompletion = [...quizMeta.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .map(([quizId, m]) => ({
      label: `P${m.order}`,
      pct: totalStudents
        ? Math.round(((doneByQuiz.get(quizId)?.size ?? 0) / totalStudents) * 100)
        : 0,
    }));

  const recentAttempts = graded.slice(0, 5).map((a) => ({
    studentName: nameById.get(a.student_id as string) ?? "Siswa",
    quizLabel: quizLabelOf(a.quiz_id as string),
    score: Math.round(Number(a.percentage ?? 0)),
    timeAgo: timeAgoId(a.submitted_at as string | null),
  }));

  // Activity feed: recent submissions + recent registrations, newest first.
  const initialsOf = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : ""))
      .toUpperCase();
  };
  const events: { at: number; item: ActivityItem }[] = [];
  for (const a of graded.slice(0, 10)) {
    if (!a.submitted_at) continue;
    const name = nameById.get(a.student_id as string) ?? "Siswa";
    events.push({
      at: new Date(a.submitted_at as string).getTime(),
      item: {
        initials: initialsOf(name),
        text: `${name} menyelesaikan kuis`,
        meta: `${quizLabelOf(a.quiz_id as string)} · skor ${Math.round(Number(a.percentage ?? 0))}`,
        time: timeAgoId(a.submitted_at as string),
      },
    });
  }
  for (const s of students ?? []) {
    if (!s.created_at) continue;
    const name = s.full_name as string;
    events.push({
      at: new Date(s.created_at as string).getTime(),
      item: {
        initials: initialsOf(name),
        text: `${name} mendaftar sebagai siswa baru`,
        meta: "Pendaftaran mandiri",
        time: timeAgoId(s.created_at as string),
      },
    });
  }
  const recentActivity = events
    .sort((a, b) => b.at - a.at)
    .slice(0, 4)
    .map((e) => e.item);

  const scores = graded.map((a) => Math.round(Number(a.percentage ?? 0)));
  return {
    totalStudents,
    publishedCourses: (courses ?? []).filter((c) => c.is_published).length,
    totalCourses: (courses ?? []).length,
    totalQuizzes: (quizzes ?? []).length,
    attemptsThisWeek: (attempts ?? []).filter(
      (a) => a.submitted_at && new Date(a.submitted_at as string).getTime() >= weekAgo,
    ).length,
    averageScore: scores.length
      ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length)
      : null,
    pendingGrading: (attempts ?? []).filter(
      (a) => a.status === "submitted" || a.status === "awaiting_manual_grade",
    ).length,
    recentAttempts,
    recentActivity,
    meetingCompletion,
  };
}

/** Pick the recorded attempt per the quiz's grading_method. Returns the
 * attempt whose score is shown (for average: the latest one, with the mean as
 * the score). */
export function applyGradingMethod(
  attempts: Array<{ id: string; pct: number; submittedAt: string | null }>,
  method: string,
): { attemptId: string; score: number } | null {
  if (!attempts.length) return null;
  const byTime = attempts
    .slice()
    .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
  switch (method) {
    case "latest": {
      const a = byTime[byTime.length - 1];
      return { attemptId: a.id, score: Math.round(a.pct) };
    }
    case "first": {
      const a = byTime[0];
      return { attemptId: a.id, score: Math.round(a.pct) };
    }
    case "average": {
      const mean =
        attempts.reduce((s, a) => s + a.pct, 0) / attempts.length;
      return {
        attemptId: byTime[byTime.length - 1].id,
        score: Math.round(mean),
      };
    }
    case "highest":
    default: {
      const best = attempts.reduce((m, a) => (a.pct > m.pct ? a : m));
      return { attemptId: best.id, score: Math.round(best.pct) };
    }
  }
}

export async function getMyResults(): Promise<ResultRow[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();

  // Every published quiz in the student's enrolled courses (RLS scopes this),
  // plus all of the student's attempts on them. One row per quiz.
  const [{ data: quizzes }, { data: attempts }] = await Promise.all([
    supabase
      .from("quizzes")
      .select(
        "id, title, passing_score, grading_method, max_attempts, meetings(sort_order, title, courses(title))",
      )
      .eq("is_published", true),
    supabase
      .from("quiz_attempts")
      .select("id, quiz_id, percentage, status, submitted_at")
      .eq("student_id", user.id),
  ]);

  const mine = attempts ?? [];
  const entries: Array<{ order: number; row: ResultRow }> = (quizzes ?? [])
    .map((q) => {
      const meeting = q.meetings as {
        sort_order?: number;
        title?: string;
        courses?: { title?: string };
      } | null;
      const order = meeting?.sort_order ?? 0;
      const passing = Number(q.passing_score ?? 60);
      const forQuiz = mine.filter((a) => a.quiz_id === q.id);
      const graded = forQuiz
        .filter((a) => a.status === "graded" && a.percentage != null)
        .map((a) => ({
          id: a.id as string,
          pct: Number(a.percentage),
          submittedAt: (a.submitted_at as string | null) ?? null,
        }));
      const finalized = forQuiz.filter((a) => a.status !== "in_progress");
      const awaiting = forQuiz.some(
        (a) => a.status === "awaiting_manual_grade",
      );

      const recorded = applyGradingMethod(
        graded,
        (q.grading_method as string) ?? "highest",
      );
      const recordedAttempt = recorded
        ? forQuiz.find((a) => a.id === recorded.attemptId)
        : null;
      // A pending (essay) submission still links to its result page.
      const awaitingAttempt = awaiting
        ? forQuiz
            .filter((a) => a.status === "awaiting_manual_grade")
            .sort((x, y) =>
              ((y.submitted_at as string) ?? "").localeCompare(
                (x.submitted_at as string) ?? "",
              ),
            )[0]
        : null;

      let status: ResultRow["status"];
      if (recorded) {
        status = recorded.score >= passing ? "lulus" : "belum-lulus";
      } else if (awaiting) {
        status = "menunggu-penilaian";
      } else {
        status = "belum-dikerjakan";
      }

      return {
        order,
        row: {
          courseTitle: meeting?.courses?.title ?? "",
          meetingLabel: `Pertemuan ${order}`,
          meetingTitle: meeting?.title ?? (q.title as string) ?? "",
          quizId: q.id as string,
          attemptId:
            recorded?.attemptId ??
            (awaitingAttempt?.id as string | null) ??
            null,
          score: recorded?.score ?? null,
          status,
          date:
            ((recordedAttempt?.submitted_at ??
              awaitingAttempt?.submitted_at) as string | null) ?? null,
          attemptsUsed: finalized.length,
          maxAttempts: (q.max_attempts as number | null) ?? null,
          passingScore: passing,
        },
      };
    });

  return entries
    .sort(
      (a, b) =>
        a.row.courseTitle.localeCompare(b.row.courseTitle) ||
        a.order - b.order,
    )
    .map((e) => e.row);
}

// ---- manual grading (admin) --------------------------------------------------

/** Attempts waiting for manual grading, newest submissions first. */
export async function getGradingQueue(): Promise<GradingQueueItem[]> {
  const supabase = await createClient();
  // profiles!student_id disambiguates: quiz_attempts has two FKs to profiles
  // (student_id + graded_by), so a bare profiles(...) embed is ambiguous.
  const { data } = await supabase
    .from("quiz_attempts")
    .select(
      "id, submitted_at, profiles!student_id(full_name), quizzes(title, meetings(sort_order))",
    )
    .eq("status", "awaiting_manual_grade")
    .order("submitted_at", { ascending: false });
  return (data ?? []).map((a) => {
    const quiz = a.quizzes as {
      title?: string;
      meetings?: { sort_order?: number };
    } | null;
    return {
      attemptId: a.id as string,
      studentName:
        ((a.profiles as { full_name?: string } | null)?.full_name as string) ??
        "Siswa",
      quizTitle: quiz?.title ?? "Kuis",
      meetingLabel: `Pertemuan ${quiz?.meetings?.sort_order ?? ""}`,
      submittedAt: (a.submitted_at as string | null) ?? null,
    };
  });
}

/** Full attempt detail for the grading screen (admin-only; RLS gives admins
 * question_options access, so option answers render human-readable). */
export async function getGradingDetail(
  attemptId: string,
): Promise<GradingDetail | null> {
  const supabase = await createClient();
  const { data: a } = await supabase
    .from("quiz_attempts")
    .select(
      "id, quiz_id, submitted_at, profiles!student_id(full_name), quizzes(title, passing_score)",
    )
    .eq("id", attemptId)
    .maybeSingle();
  if (!a) return null;

  const [{ data: questions }, { data: answers }] = await Promise.all([
    supabase
      .from("questions")
      .select("id, type, prompt, points, sort_order, question_options(id, content, is_correct)")
      .eq("quiz_id", a.quiz_id as string)
      .order("sort_order"),
    supabase
      .from("attempt_answers")
      .select("question_id, selected_option_ids, answer_text, points_awarded, feedback")
      .eq("attempt_id", attemptId),
  ]);

  const answerByQ = new Map(
    (answers ?? []).map((x) => [x.question_id as string, x]),
  );

  const rows: GradingAnswer[] = (questions ?? []).map((q) => {
    const ans = answerByQ.get(q.id as string);
    const opts = (q.question_options as Array<{
      id: string;
      content: string;
      is_correct: boolean;
    }>) ?? [];
    const optText = new Map(opts.map((o) => [o.id, o.content]));
    const selected = ((ans?.selected_option_ids as string[] | null) ?? [])
      .map((id) => optText.get(id) ?? "—")
      .join(", ");
    const given = (ans?.answer_text as string) || selected || "—";
    const type = q.type as GradingAnswer["type"];
    const hasKey = opts.some((o) => o.is_correct);
    const needsManual =
      type === "essay" ||
      ((type === "short_answer" || type === "fill_blank") && !hasKey);
    return {
      questionId: q.id as string,
      prompt: q.prompt as string,
      type,
      points: Number(q.points ?? 1),
      given,
      pointsAwarded:
        ans?.points_awarded != null ? Number(ans.points_awarded) : null,
      feedback: (ans?.feedback as string | null) ?? null,
      needsManual,
    };
  });

  const quiz = a.quizzes as { title?: string; passing_score?: number } | null;
  return {
    attemptId: a.id as string,
    studentName:
      ((a.profiles as { full_name?: string } | null)?.full_name as string) ??
      "Siswa",
    quizTitle: quiz?.title ?? "Kuis",
    submittedAt: (a.submitted_at as string | null) ?? null,
    passingScore: Number(quiz?.passing_score ?? 60),
    answers: rows,
  };
}

// ---- platform settings -----------------------------------------------------

export async function getSettings(): Promise<PlatformSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  // Table may not exist yet (migration 0004 not applied) — fall back to defaults.
  if (error || !data) return DEFAULT_SETTINGS;
  return {
    siteName: (data.site_name as string) ?? DEFAULT_SETTINGS.siteName,
    domain: (data.domain as string) ?? DEFAULT_SETTINGS.domain,
    locale: (data.locale as string) ?? DEFAULT_SETTINGS.locale,
    allowRegistration: (data.allow_registration as boolean) ?? true,
    requireAdminApproval: (data.require_admin_approval as boolean) ?? false,
    defaultPassingScore: Number(data.default_passing_score ?? 60),
    defaultGradingMethod:
      (data.default_grading_method as PlatformSettings["defaultGradingMethod"]) ??
      "highest",
    defaultShowAnswers:
      (data.default_show_answers as PlatformSettings["defaultShowAnswers"]) ??
      "after_submit",
    showScoreImmediately: (data.show_score_immediately as boolean) ?? true,
  };
}

export { attemptStatusLabel };
