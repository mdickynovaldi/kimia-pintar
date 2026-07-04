import { NextResponse, type NextRequest } from "next/server";
import { getCourses, getMeetings, getMyEnrolledCourseIds } from "@/lib/data";

/**
 * "Lanjut belajar" resolver. The sidebar shortcut points here; we look up the
 * student's first enrolled course and its next unfinished meeting, then
 * redirect — no more hardcoded /courses/kimia-dasar/termokimia link that 404s
 * when content changes.
 */
export async function GET(req: NextRequest) {
  const [courses, enrolledIds] = await Promise.all([
    getCourses(),
    getMyEnrolledCourseIds(),
  ]);
  const enrolled = courses.filter(
    (c) => c.isPublished && enrolledIds.has(c.id),
  );

  for (const course of enrolled) {
    const meetings = await getMeetings(course.slug);
    const next =
      meetings.find((m) => m.state === "available") ??
      meetings.find((m) => m.state !== "completed");
    if (next) {
      return NextResponse.redirect(
        new URL(`/courses/${course.slug}/${next.slug}`, req.nextUrl.origin),
      );
    }
    if (meetings.length) {
      return NextResponse.redirect(
        new URL(`/courses/${course.slug}`, req.nextUrl.origin),
      );
    }
  }
  return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
}
