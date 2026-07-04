// Data-access seam. When Supabase is configured the accessors hit the real
// database (RLS-scoped, server-side); otherwise they resolve from the in-memory
// mock dataset so the UI works pre-backend. The return types never change, so
// no screen depends on which path is active.

import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  courses as mockCourses,
  enrollments as mockEnrollments,
  gradebook as mockGradebook,
  meetings as mockMeetings,
  quizzes as mockQuizzes,
  sampleAttempt,
  studentResults as mockResults,
  students as mockStudents,
  termokimiaQuiz,
  currentStudent,
} from "./mock";
import * as sb from "./supabase";
import { DEFAULT_SETTINGS } from "./types";
import type {
  AdminDashboardData,
  AttemptState,
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

export * from "./types";
// Cosmetic / fallback constants used by bespoke admin-dashboard tiles.
export {
  currentStudent,
  currentAdmin,
  recentActivity,
  meetingCompletion,
  totalStudents,
} from "./mock";

const live = isSupabaseConfigured;

function stripKeys(q: Quiz): Question[] {
  return q.questions.map((question) => ({
    ...question,
    options: question.options.map((o) => ({ ...o, isCorrect: false })),
  }));
}

export async function getCurrentUser(): Promise<Profile> {
  if (!live) return currentStudent;
  const { getSessionUser } = await import("@/lib/auth/dal");
  return (await getSessionUser()) ?? currentStudent;
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  if (live) return sb.getAdminDashboard();
  const { recentActivity, meetingCompletion, totalStudents } = await import("./mock");
  return {
    totalStudents,
    publishedCourses: 1,
    totalCourses: mockCourses.length,
    totalQuizzes: 4,
    attemptsThisWeek: 128,
    averageScore: 81,
    pendingGrading: 0,
    recentAttempts: [
      { studentName: "Emmil Saputra", quizLabel: "P3 — Ikatan Kimia", score: 90, timeAgo: "12 mnt" },
      { studentName: "Dian Pratama", quizLabel: "P2 — Struktur Atom", score: 78, timeAgo: "5 jam" },
      { studentName: "Rara Fitri", quizLabel: "P1 — Stoikiometri", score: 68, timeAgo: "6 jam" },
      { studentName: "Budi Santoso", quizLabel: "P3 — Ikatan Kimia", score: 85, timeAgo: "1 hari" },
      { studentName: "Nadia Putri", quizLabel: "P4 — Termokimia", score: 92, timeAgo: "1 hari" },
    ],
    recentActivity,
    meetingCompletion,
  };
}

export async function getCourses(): Promise<Course[]> {
  if (live) return sb.getCourses();
  return [...mockCourses].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPublishedCourses(): Promise<Course[]> {
  if (live) return sb.getPublishedCourses();
  return (await getCourses()).filter((c) => c.isPublished);
}

export async function getCourse(slug: string): Promise<Course | undefined> {
  if (live) return sb.getCourse(slug);
  return mockCourses.find((c) => c.slug === slug);
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  if (live) return sb.getCourseById(id);
  return mockCourses.find((c) => c.id === id);
}

export async function getMeetingsByCourseId(
  courseId: string,
): Promise<Meeting[]> {
  if (live) return sb.getMeetingsByCourseId(courseId);
  return mockMeetings
    .filter((m) => m.courseId === courseId)
    .sort((a, b) => a.order - b.order);
}

export async function getMeetings(courseSlug: string): Promise<Meeting[]> {
  if (live) return sb.getMeetings(courseSlug);
  return mockMeetings
    .filter((m) => m.courseSlug === courseSlug)
    .sort((a, b) => a.order - b.order);
}

export async function getMeeting(
  courseSlug: string,
  meetingSlug: string,
): Promise<Meeting | undefined> {
  if (live) return sb.getMeeting(courseSlug, meetingSlug);
  return mockMeetings.find(
    (m) => m.courseSlug === courseSlug && m.slug === meetingSlug,
  );
}

export async function getMeetingById(id: string): Promise<Meeting | undefined> {
  if (live) return sb.getMeetingById(id);
  return mockMeetings.find((m) => m.id === id);
}

export async function getQuiz(quizId: string): Promise<Quiz | undefined> {
  if (live) return sb.getQuiz(quizId);
  return (
    mockQuizzes.find((q) => q.id === quizId) ??
    (quizId === termokimiaQuiz.id ? termokimiaQuiz : undefined)
  );
}

/** Sanitized questions for the student quiz player (no answer keys). */
export async function getSanitizedQuestions(
  quizId: string,
  seed?: string,
): Promise<Question[]> {
  if (live) return sb.getSanitizedQuestions(quizId, seed);
  const q = await getQuiz(quizId);
  return q ? stripKeys(q) : [];
}

export async function getAttempt(
  attemptId: string,
): Promise<QuizAttempt | null> {
  if (live) return sb.getAttempt(attemptId);
  return { ...sampleAttempt, id: attemptId };
}

/** Open-attempt state (status, deadline, saved answers) for the player. */
export async function getAttemptState(
  attemptId: string,
): Promise<AttemptState | null> {
  if (live) return sb.getAttemptState(attemptId);
  return {
    id: attemptId,
    quizId: termokimiaQuiz.id,
    status: "in_progress",
    deadlineAt: null,
    answers: {},
  };
}

export async function getStudents(): Promise<Profile[]> {
  if (live) return sb.getStudents();
  return mockStudents;
}

export async function getEnrollments() {
  if (live) return sb.getEnrollments();
  return mockEnrollments;
}

export async function getGradebook(): Promise<GradebookRow[]> {
  if (live) return sb.getGradebook();
  return mockGradebook;
}

export async function getMyResults(): Promise<ResultRow[]> {
  if (live) return sb.getMyResults();
  return mockResults;
}

/** Course ids the current student is actively enrolled in. */
export async function getMyEnrolledCourseIds(): Promise<Set<string>> {
  if (live) return sb.getMyEnrolledCourseIds();
  return new Set(mockCourses.filter((c) => c.isPublished).map((c) => c.id));
}

/** Upcoming quiz deadlines for the dashboard (real available_until only). */
export async function getUpcomingDeadlines() {
  if (live) return sb.getUpcomingDeadlines();
  return [];
}

/** Recently-published meetings, rendered as dashboard announcements. */
export async function getRecentAnnouncements() {
  if (live) return sb.getRecentAnnouncements();
  return [];
}

/** Admin: attempts waiting for manual (essay) grading. */
export async function getGradingQueue() {
  if (live) return sb.getGradingQueue();
  return [];
}

/** Admin: one attempt's answers for the manual-grading screen. */
export async function getGradingDetail(attemptId: string) {
  if (live) return sb.getGradingDetail(attemptId);
  return null;
}

export async function getSettings(): Promise<PlatformSettings> {
  if (live) return sb.getSettings();
  return DEFAULT_SETTINGS;
}

export async function getContentProgress(meetingId: string): Promise<string[]> {
  if (live) return sb.getContentProgress(meetingId);
  return [];
}

export async function getAttemptStats(
  quizId: string,
): Promise<{ used: number; max: number | null }> {
  if (live) return sb.getAttemptStats(quizId);
  return { used: 0, max: 1 };
}
