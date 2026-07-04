// Domain types for Kimia Pintar LMS.
// Aligned with the PRD data model (§9). These are the shapes the UI consumes;
// the mock layer in ./mock.ts returns them today, and a Supabase-backed
// implementation can satisfy the same shapes later (see ./index.ts).

export type UserRole = "admin" | "student";
export type EnrollmentStatus = "active" | "completed" | "dropped";

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "fill_blank"
  | "matching"
  | "ordering"
  | "essay";

export type AttemptStatus =
  | "in_progress"
  | "submitted"
  | "awaiting_manual_grade"
  | "graded"
  | "expired";

export type AnswersPolicy = "never" | "after_submit" | "after_close";
export type GradingMethod = "highest" | "latest" | "average" | "first";

/** Status of a meeting from a given student's perspective. */
export type MeetingState = "completed" | "available" | "locked";

export interface Profile {
  id: string;
  role: UserRole;
  fullName: string;
  /** NIM — nullable for admins. */
  studentNo: string | null;
  email: string;
  avatarUrl: string | null;
  /** Two-letter initials used by the avatar component. */
  initials: string;
  isActive: boolean;
}

export interface Course {
  id: string;
  code: string; // e.g. 'KIMIA-DASAR'
  slug: string; // e.g. 'kimia-dasar'
  title: string;
  description: string;
  /** Tailwind-free CSS gradient used for the cover/cap. */
  coverGradient: string;
  /** Optional uploaded cover image URL (overrides the gradient when present). */
  coverImageUrl?: string | null;
  color: string;
  sortOrder: number;
  isPublished: boolean;
  meetingCount: number;
  quizCount: number;
  instructor: string;
  /** Learning objectives, one per line (rendered as the Ikhtisar bullets). */
  objectives: string[];
}

export interface Material {
  id: string;
  title: string;
  /** Rich HTML body (already sanitized in a real backend). */
  bodyHtml: string;
  attachment?: { name: string; meta: string; url: string };
  isPublished: boolean;
}

export interface Video {
  id: string;
  title: string;
  provider: "google_drive" | "youtube";
  driveFileId: string | null;
  sourceUrl: string;
  caption?: string;
  isPublished: boolean;
}

export interface Meeting {
  id: string;
  courseId: string;
  courseSlug: string;
  slug: string;
  order: number;
  title: string; // e.g. 'Termokimia'
  /** e.g. 'Pertemuan 4'. */
  label: string;
  description: string;
  isPublished: boolean;
  state: MeetingState;
  readingMinutes: number;
  materials: Material[];
  videos: Video[];
  quizId: string | null;
}

export interface QuestionOption {
  id: string;
  content: string;
  /** Answer key — NEVER sent to a student client in a real backend. */
  isCorrect: boolean;
  feedback?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  /** Optional rich HTML prompt (formulas/subscripts). Falls back to `prompt`. */
  promptHtml?: string;
  points: number;
  explanation?: string;
  options: QuestionOption[];
  sortOrder: number;
}

export interface Quiz {
  id: string;
  meetingId: string;
  courseId: string;
  courseSlug: string;
  meetingSlug: string;
  title: string;
  description: string;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  passingScore: number;
  gradingMethod: GradingMethod;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: AnswersPolicy;
  showScoreImmediately: boolean;
  questionsPerPage: number;
  allowBacktrack: boolean;
  /** Availability window (ISO); null = always open on that side. */
  availableFrom: string | null;
  availableUntil: string | null;
  isPublished: boolean;
  questions: Question[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface AttemptAnswerReview {
  questionId: string;
  /** Human-readable rendering of the student's answer. */
  given: string;
  /** Human-readable rendering of the correct answer. */
  correct: string;
  isCorrect: boolean;
  /** Waiting for manual grading (essay / unconfigured short answer). */
  pending?: boolean;
  promptHtml?: string;
  prompt: string;
  explanation?: string;
}

/** Saved answers of an open attempt, for restoring the player after reload. */
export interface AttemptState {
  id: string;
  quizId: string;
  status: AttemptStatus;
  deadlineAt: string | null;
  answers: Record<string, { optionIds: string[]; text: string | null }>;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  attemptNumber: number;
  status: AttemptStatus;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  correctCount: number;
  questionCount: number;
  timeSpentLabel: string;
  startedAt: string;
  submittedAt: string | null;
  review: AttemptAnswerReview[];
}

/** A row in the student's own results view — one row PER QUIZ, with the
 * recorded score picked by the quiz's grading_method. */
export interface ResultRow {
  courseTitle: string;
  meetingLabel: string;
  meetingTitle: string;
  quizId: string;
  /** Attempt backing the recorded score (for the review link). */
  attemptId: string | null;
  score: number | null;
  status: "lulus" | "belum-lulus" | "belum-dikerjakan" | "menunggu-penilaian";
  /** ISO timestamp of the recorded attempt's submission. */
  date: string | null;
  attemptsUsed: number;
  maxAttempts: number | null;
  passingScore: number;
}

/** A row in the admin gradebook (per student × quiz). */
export interface GradebookRow {
  studentId: string;
  studentName: string;
  studentNo: string;
  quizScores: Record<string, number | null>; // meetingLabel -> score
  average: number | null;
}

export interface ActivityItem {
  initials: string;
  text: string;
  meta: string;
  time: string;
}

/** A recently-submitted quiz attempt shown on the admin dashboard. */
export interface RecentAttemptRow {
  studentName: string;
  quizLabel: string; // e.g. "P3 — Ikatan Kimia"
  score: number;
  timeAgo: string; // e.g. "12 mnt"
}

/** Attempt waiting for manual (essay) grading — admin grading queue row. */
export interface GradingQueueItem {
  attemptId: string;
  studentName: string;
  quizTitle: string;
  meetingLabel: string;
  submittedAt: string | null;
}

/** One answer inside the admin grading detail view. */
export interface GradingAnswer {
  questionId: string;
  prompt: string;
  type: QuestionType;
  points: number;
  /** Student answer, human-readable (text or joined option contents). */
  given: string;
  pointsAwarded: number | null;
  feedback: string | null;
  /** True when this row needs a human score (essay / unconfigured manual). */
  needsManual: boolean;
}

export interface GradingDetail {
  attemptId: string;
  studentName: string;
  quizTitle: string;
  submittedAt: string | null;
  passingScore: number;
  answers: GradingAnswer[];
}

/** An upcoming quiz deadline for the student dashboard. */
export interface UpcomingDeadline {
  quizId: string;
  quizTitle: string;
  meetingLabel: string;
  availableUntil: string; // ISO
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
}

/** A recently-published meeting, shown as an announcement. */
export interface AnnouncementItem {
  title: string;
  meta: string;
  publishedAt: string; // ISO
}

/** Aggregates behind the admin dashboard tiles/panels. */
export interface AdminDashboardData {
  totalStudents: number;
  publishedCourses: number;
  totalCourses: number;
  totalQuizzes: number;
  attemptsThisWeek: number;
  averageScore: number | null;
  pendingGrading: number;
  recentAttempts: RecentAttemptRow[];
  recentActivity: ActivityItem[];
  meetingCompletion: { label: string; pct: number }[];
}

export interface PlatformSettings {
  siteName: string;
  domain: string;
  locale: string;
  allowRegistration: boolean;
  requireAdminApproval: boolean;
  defaultPassingScore: number;
  defaultGradingMethod: GradingMethod;
  defaultShowAnswers: AnswersPolicy;
  showScoreImmediately: boolean;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  siteName: "Kimia Pintar",
  domain: "kimiapintar.com",
  locale: "id",
  allowRegistration: true,
  requireAdminApproval: false,
  defaultPassingScore: 60,
  defaultGradingMethod: "highest",
  defaultShowAnswers: "after_submit",
  showScoreImmediately: true,
};
