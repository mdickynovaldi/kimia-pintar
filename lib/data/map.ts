// Row → domain-type mappers shared by the Supabase data layer and the DAL.
// The DB is snake_case; the UI types (./types) are camelCase.

import type {
  AttemptStatus,
  Course,
  GradingMethod,
  Material,
  Meeting,
  MeetingState,
  Profile,
  Question,
  QuestionType,
  Quiz,
  UserRole,
  Video,
} from "./types";

/** Course card gradient by slug — keeps the cover caps identical to the design. */
export const COURSE_GRADIENTS: Record<string, string> = {
  "kimia-dasar": "linear-gradient(140deg,oklch(55% 0.12 178),oklch(45% 0.13 200))",
  "kimia-organik": "linear-gradient(140deg,oklch(60% 0.1 300),oklch(50% 0.12 320))",
  "kimia-anorganik": "linear-gradient(140deg,oklch(58% 0.12 145),oklch(48% 0.13 165))",
  biokimia: "linear-gradient(140deg,oklch(62% 0.1 60),oklch(52% 0.12 40))",
  "kimia-analitik": "linear-gradient(140deg,oklch(60% 0.12 250),oklch(50% 0.13 275))",
  "kimia-fisika": "linear-gradient(140deg,oklch(60% 0.12 20),oklch(50% 0.13 5))",
  "kimia-instrumen": "linear-gradient(140deg,oklch(58% 0.1 220),oklch(48% 0.12 240))",
};

export function gradientFor(slug: string): string {
  return (
    COURSE_GRADIENTS[slug] ??
    "linear-gradient(140deg,oklch(55% 0.12 178),oklch(45% 0.13 200))"
  );
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

export function rowToProfile(
  row: Record<string, unknown>,
  email?: string | null,
): Profile {
  const fullName = (row.full_name as string) ?? "";
  return {
    id: row.id as string,
    role: (row.role as UserRole) ?? "student",
    fullName,
    studentNo: (row.student_no as string | null) ?? null,
    email: (email ?? (row.email as string)) ?? "",
    avatarUrl: (row.avatar_url as string | null) ?? null,
    initials: initialsOf(fullName),
    isActive: (row.is_active as boolean) ?? true,
  };
}

export function rowToCourse(
  row: Record<string, unknown>,
  meetingCount = 0,
  quizCount = 0,
): Course {
  const slug = row.slug as string;
  return {
    id: row.id as string,
    code: row.code as string,
    slug,
    title: row.title as string,
    description: (row.description as string) ?? "",
    coverGradient: gradientFor(slug),
    color: (row.color as string) ?? "oklch(55% 0.12 178)",
    sortOrder: (row.sort_order as number) ?? 0,
    isPublished: (row.is_published as boolean) ?? false,
    meetingCount,
    quizCount,
    instructor: "Bu Maya",
  };
}

export function rowToMaterial(row: Record<string, unknown>): Material {
  const attachmentUrl = row.attachment_url as string | null;
  return {
    id: row.id as string,
    title: row.title as string,
    bodyHtml: (row.body as string) ?? "",
    attachment: attachmentUrl
      ? { name: "Lampiran", meta: "Berkas", url: attachmentUrl }
      : undefined,
    isPublished: (row.is_published as boolean) ?? true,
  };
}

export function rowToVideo(row: Record<string, unknown>): Video {
  return {
    id: row.id as string,
    title: row.title as string,
    provider: ((row.provider as string) ?? "google_drive") as Video["provider"],
    driveFileId: (row.drive_file_id as string | null) ?? null,
    sourceUrl: (row.source_url as string) ?? "",
    caption: "Video pembelajaran · Google Drive",
    isPublished: (row.is_published as boolean) ?? true,
  };
}

/** Derive a per-student meeting state from order + a set of completed orders. */
export function meetingState(
  order: number,
  completedOrders: Set<number>,
  sequentialUnlock = false,
): MeetingState {
  if (completedOrders.has(order)) return "completed";
  if (!sequentialUnlock) return "available";
  // sequential: available only if the previous meeting is completed (or first).
  return order === 1 || completedOrders.has(order - 1) ? "available" : "locked";
}

export function rowToMeeting(
  row: Record<string, unknown>,
  opts: {
    courseSlug: string;
    state: MeetingState;
    materials?: Material[];
    videos?: Video[];
    quizId?: string | null;
  },
): Meeting {
  const order = (row.sort_order as number) ?? 0;
  return {
    id: row.id as string,
    courseId: row.course_id as string,
    courseSlug: opts.courseSlug,
    slug: row.slug as string,
    order,
    title: row.title as string,
    label: `Pertemuan ${order}`,
    description: (row.description as string) ?? "",
    isPublished: (row.is_published as boolean) ?? false,
    state: opts.state,
    readingMinutes: 25,
    materials: opts.materials ?? [],
    videos: opts.videos ?? [],
    quizId: opts.quizId ?? null,
  };
}

export function rowToQuestion(row: Record<string, unknown>): Question {
  const options = ((row.options as Array<Record<string, unknown>>) ?? []).map(
    (o) => ({
      id: o.id as string,
      content: o.content as string,
      isCorrect: (o.is_correct as boolean) ?? false,
      feedback: (o.feedback as string | undefined) ?? undefined,
    }),
  );
  return {
    id: row.id as string,
    type: row.type as QuestionType,
    prompt: row.prompt as string,
    points: Number(row.points ?? 1),
    explanation: (row.explanation as string | undefined) ?? undefined,
    options,
    sortOrder: (row.sort_order as number) ?? 0,
  };
}

export function rowToQuiz(
  row: Record<string, unknown>,
  opts: { courseSlug: string; meetingSlug: string; questions?: Question[] },
): Quiz {
  return {
    id: row.id as string,
    meetingId: (row.meeting_id as string) ?? "",
    courseId: (row.course_id as string) ?? "",
    courseSlug: opts.courseSlug,
    meetingSlug: opts.meetingSlug,
    title: row.title as string,
    description: (row.description as string) ?? "",
    timeLimitMinutes: (row.time_limit_minutes as number | null) ?? null,
    maxAttempts: (row.max_attempts as number | null) ?? null,
    passingScore: Number(row.passing_score ?? 60),
    gradingMethod: ((row.grading_method as string) ?? "highest") as GradingMethod,
    shuffleQuestions: (row.shuffle_questions as boolean) ?? false,
    shuffleOptions: (row.shuffle_options as boolean) ?? false,
    showCorrectAnswers:
      (row.show_correct_answers as Quiz["showCorrectAnswers"]) ?? "after_submit",
    showScoreImmediately: (row.show_score_immediately as boolean) ?? true,
    questionsPerPage: (row.questions_per_page as number) ?? 1,
    allowBacktrack: (row.allow_backtrack as boolean) ?? true,
    isPublished: (row.is_published as boolean) ?? false,
    questions: opts.questions ?? [],
  };
}

export function attemptStatusLabel(status: AttemptStatus): string {
  const map: Record<AttemptStatus, string> = {
    in_progress: "Sedang dikerjakan",
    submitted: "Terkirim",
    awaiting_manual_grade: "Menunggu dinilai",
    graded: "Dinilai",
    expired: "Kedaluwarsa",
  };
  return map[status] ?? status;
}
