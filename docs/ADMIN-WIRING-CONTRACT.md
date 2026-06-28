# Admin CRUD wiring contract

Make an admin editor page actually persist to Supabase by wiring its controls to
the server actions below. Keep the existing design markup/classes/`<style>` — only
turn static inputs into working forms. Pages are server components.

## Rules

1. **Guard:** first line of the page component body: `await requireAdmin();`
   (`import { requireAdmin } from "@/lib/auth/dal";`). It redirects non-admins.
2. **Load real data** via `@/lib/data` accessors (listed per page). If a fetched
   entity is missing, `notFound()` (`import { notFound } from "next/navigation"`).
3. **Forms:** `<form action={serverAction}>`. Put the entity id in a hidden input.
   Every input that the action reads MUST have the exact `name` from the signatures
   below. Submits are `<button type="submit">`.
4. **Per-row actions** (publish toggle, delete, etc.) = their own small `<form>`
   with hidden id(s) + a submit button. Don't use onClick — these are server actions.
5. **Switches/checkboxes** that map to a boolean MUST use `value="true"`
   (unchecked sends nothing → false). Pattern:
   `<label className="switch"><input type="checkbox" name="is_published" value="true" defaultChecked={…} /><span className="track" /></label>`
6. Actions already call `revalidatePath`, so the page refreshes after submit. Don't
   add client state unless a page item says "use client".
7. Must `npx tsc --noEmit` clean and build. Default-export the page.

## Server actions (import paths + exact field names)

From `@/app/actions/admin`:
- `createCourse(fd)` — names: `title`, `code`(opt), `description`, `color`, `is_published`. Redirects to the new course.
- `updateCourse(fd)` — `id`(hidden), `title`, `description`, `color`, `is_published`.
- `deleteCourse(fd)` — `id`(hidden). Redirects to /admin/courses.
- `createMeeting(fd)` — `course_id`(hidden), `title`, `is_published`.
- `updateMeeting(fd)` — `id`(hidden), `course_id`(hidden), `title`, `description`, `is_published`.
- `deleteMeeting(fd)` — `id`(hidden), `course_id`(hidden).
- `saveMaterial(fd)` — `meeting_id`(hidden), `material_id`(hidden, opt), `title`, `body`.
- `saveVideo(fd)` — `meeting_id`(hidden), `video_id`(hidden, opt), `title`, `source_url` (Drive share URL or id).
- `saveEnrollments(fd)` — `course_id`(hidden) + repeated `student_id` checkboxes (`name="student_id"` `value={studentId}`, `defaultChecked` if enrolled).

From `@/app/actions/admin-students`:
- `createStudent(prevState, fd)` — **useActionState** (client form). names: `full_name`, `email`, `student_no`, `course_id`(opt hidden). Returns `{error?|message?}`.
- `setStudentActive(fd)` — `student_id`(hidden), `is_active` (hidden input value `"true"` or `"false"`).

## Data accessors (`@/lib/data`)

`getCourses()`, `getCourseById(id)`, `getMeetingsByCourseId(courseId)`,
`getMeetingById(meetingId)`, `getCourse(slug)`, `getStudents()`, `getEnrollments()`.
Types: `Course`, `Meeting`, `Material`, `Video`, `Profile`, `Enrollment`.

`Course`: { id, code, slug, title, description, color, isPublished, meetingCount, quizCount }.
`Meeting`: { id, courseId, slug, order, title, label, description, isPublished, quizId, materials: Material[], videos: Video[] }.
`Material`: { id, title, bodyHtml, attachment? }. `Video`: { id, title, sourceUrl, driveFileId }.
`Profile`: { id, fullName, email, studentNo, initials, isActive }.
`Enrollment`: { courseId, studentId, status }.

## Notes
- Course-edit and meeting-edit links: meeting → `/admin/courses/{course.id}/meetings/{meeting.id}`; quiz builder → `/admin/quizzes/{meeting.quizId}` (only if quizId).
- Keep prototype-only affordances that have no action (drag handles, RTE toolbar
  buttons, cover dropzone) as static decoration — don't break them, don't fake them.
- For the meeting editor, render the material `body` into the textarea via
  `defaultValue={meeting.materials[0]?.bodyHtml ?? ""}` and pass
  `material_id={meeting.materials[0]?.id}` hidden (omit if none → insert).
