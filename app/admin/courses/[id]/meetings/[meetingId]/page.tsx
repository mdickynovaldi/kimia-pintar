import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MeetingEditor } from "@/components/admin/meeting-editor";
import { requireAdmin } from "@/lib/auth/dal";
import { getCourseById, getMeetingById, getQuiz } from "@/lib/data";

export const metadata: Metadata = { title: "Editor Pertemuan · Admin" };

export default async function AdminMeetingEditPage({
  params,
}: {
  params: Promise<{ id: string; meetingId: string }>;
}) {
  await requireAdmin();
  const { id, meetingId } = await params;
  const [course, meeting] = await Promise.all([
    getCourseById(id),
    getMeetingById(meetingId),
  ]);
  if (!meeting) notFound();

  let quizMeta:
    | { questions: number; minutes: number | null; attempts: number | null }
    | undefined;
  if (meeting.quizId) {
    const quiz = await getQuiz(meeting.quizId);
    if (quiz)
      quizMeta = {
        questions: quiz.questions.length,
        minutes: quiz.timeLimitMinutes,
        attempts: quiz.maxAttempts,
      };
  }

  return (
    <AppShell
      variant="admin"
      crumb={
        <>
          <Link href="/admin/courses">Mata Kuliah</Link> /{" "}
          <Link href={`/admin/courses/${id}`}>{course?.title ?? "Kursus"}</Link> /{" "}
          <b>{meeting.label}</b>
        </>
      }
    >
      <div className="page-head">
        <h1>Edit Pertemuan</h1>
        <p>
          {meeting.label} — {meeting.title}
        </p>
      </div>

      <MeetingEditor meeting={meeting} courseId={id} quizMeta={quizMeta} />
    </AppShell>
  );
}
