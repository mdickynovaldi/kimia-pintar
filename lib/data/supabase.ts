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
  Course,
  GradebookRow,
  Meeting,
  PlatformSettings,
  Profile,
  Question,
  Quiz,
  QuizAttempt,
  ResultRow,
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
      .select("*, quizzes(id)")
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
    return rowToMeeting(row, { courseSlug, state, quizId });
  });
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

/** Sanitized questions for the student player — NO `is_correct`. Uses the RPC. */
export async function getSanitizedQuestions(
  quizId: string,
): Promise<Question[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_quiz_questions", { p_quiz: quizId });
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
  // after_close only reveals once the quiz's availability window has closed.
  const closed =
    !quizMeta?.available_until || new Date(quizMeta.available_until) < new Date();
  const reveal =
    policy === "after_submit" || (policy === "after_close" && closed);

  const { data: answers } = await supabase
    .from("attempt_answers")
    .select("*, questions(prompt, explanation, sort_order)")
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
      const q = row.questions as { prompt?: string; explanation?: string } | null;
      const selected = (row.selected_option_ids as string[] | null) ?? [];
      const given =
        (row.answer_text as string) ||
        selected.map((id) => optionText.get(id) ?? "—").join(", ") ||
        "—";
      return {
        questionId: row.question_id as string,
        prompt: q?.prompt ?? "",
        given,
        correct: reveal ? (correctById.get(row.question_id as string) ?? "—") : "—",
        isCorrect: (row.is_correct as boolean) ?? false,
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
  // Only FINALIZED attempts consume the limit — an abandoned in_progress attempt
  // is resumable (see startQuiz), not a used-up try.
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
      supabase.from("quiz_attempts").select("student_id, quiz_id, percentage, status"),
      supabase.from("quizzes").select("id, meetings(sort_order)"),
    ]);

  const quizLabel = new Map<string, string>();
  for (const q of quizzes ?? []) {
    const order = (q.meetings as { sort_order?: number } | null)?.sort_order;
    if (order) quizLabel.set(q.id as string, `P${order}`);
  }

  return (students ?? []).map((s) => {
    const scores: Record<string, number | null> = {};
    const mine = (attempts ?? []).filter(
      (a) => a.student_id === s.id && a.status === "graded",
    );
    for (const a of mine) {
      const label = quizLabel.get(a.quiz_id as string);
      if (label) scores[label] = Math.round(Number(a.percentage ?? 0));
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

export async function getMyResults(): Promise<ResultRow[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_attempts")
    .select(
      "id, percentage, passed, status, quiz_id, quizzes(passing_score, title, meetings(sort_order, title, courses(title)))",
    )
    .eq("student_id", user.id)
    .order("started_at");

  return (data ?? []).map((a) => {
    const quiz = a.quizzes as {
      title?: string;
      meetings?: { sort_order?: number; title?: string; courses?: { title?: string } };
    } | null;
    const order = quiz?.meetings?.sort_order ?? 0;
    const score = a.percentage != null ? Math.round(Number(a.percentage)) : null;
    const status =
      a.status !== "graded"
        ? ("belum-dikerjakan" as const)
        : a.passed
          ? ("lulus" as const)
          : ("belum-lulus" as const);
    return {
      courseTitle: quiz?.meetings?.courses?.title ?? "Kimia Dasar",
      meetingLabel: `Pertemuan ${order}`,
      meetingTitle: quiz?.meetings?.title ?? quiz?.title ?? "",
      quizId: a.quiz_id as string,
      attemptId: a.id as string,
      score,
      status,
    };
  });
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
