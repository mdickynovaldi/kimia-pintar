# Porting contract — HTML prototype → Next.js 16 (App Router)

You are converting ONE static screen from `Buat-Halaman-UI_UX-dari-PRD/*.html`
into a Next.js page. Goal: **pixel-faithful** to the source, using the shared
foundation already built. Match the exported markup/CSS; do not redesign.

## Golden rules

1. **Fidelity first.** Reproduce the source's content region exactly: same text
   (Bahasa Indonesia), same classes, same inline styles, same SVGs, same order.
   Do not invent copy or drop sections.
2. **Reuse the shell — never re-create it.** The sidebar + topbar (student/admin)
   come from `<AppShell>`. The auth split + theme FAB come from `<AuthShell>`.
   Only port what lives inside the source's `.content` (for app pages) or the
   `.auth-card` (for auth pages).
3. **Per-page `<style>` goes inline.** If the source `<head>` has a `<style>`
   block, copy it verbatim into the page as `<style>{`...`}</style>` (first child
   of the returned content). Do NOT touch `app/globals.css` (shared, and other
   agents edit nothing there either). The design system classes (`.card`, `.btn`,
   `.badge`, `.stat`, `.grid`, `.row`, `.tabs`, `.table-wrap`, `.field`, `.input`,
   `.switch`, `.progress`, `.avatar`, `.eyebrow`, `.muted`, `.mono`, etc.) already
   exist globally — use them as-is.

## HTML → JSX conversion

- `class=` → `className=`; `for=` → `htmlFor=`.
- Inline `style="a:b;c:d"` → `style={{ a: "b", c: "d" }}` with camelCased props
  (`background`, `marginBottom`, `borderBottom`, `gridTemplateColumns`, …). Keep
  the exact values (including `var(--…)`, `clamp(...)`, `oklch(...)`).
- SVG attrs: `stroke-width`→`strokeWidth`, `stroke-linecap`→`strokeLinecap`,
  `stroke-linejoin`→`strokeLinejoin`, `fill-rule`→`fillRule`, `clip-rule`→`clipRule`.
  Keep `viewBox` as-is. Self-close `<path/>`, `<rect/>`, `<circle/>`, `<input/>`,
  `<img/>`, `<hr/>`, `<br/>`.
- HTML comments `<!-- x -->` → `{/* x */}`.
- Entities: prefer Unicode in text (`Δ → − × · °` and `&` as `&amp;` is fine in
  JSX). For chemistry use `<sub>`/`<sup>`. For a big rich-HTML block that the data
  layer already provides (e.g. material `bodyHtml`), render with
  `dangerouslySetInnerHTML={{ __html: ... }}`.
- `checked`/`selected` → `defaultChecked`/`defaultValue` on uncontrolled inputs.
  `hidden` attribute → `hidden`.
- Replace `<a href="*.html">` with `<Link href="/route">` from `next/link` using
  the route map below. Replace `href="#anchor"` with `href="#anchor"` (kept) and
  external `http(s)` links stay plain `<a target="_blank" rel="noopener">`.

## Shared imports you may use

```ts
import Link from "next/link";
import { AppShell } from "@/components/app-shell";          // sidebar+topbar (student|admin)
import { AuthShell } from "@/components/auth-shell";         // auth split + theme FAB
import { Tabs } from "@/components/ui/tabs";                 // [{id,label,content}]
import { PasswordField } from "@/components/ui/password-field";
import { Countdown } from "@/components/quiz/countdown";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import * as Icons from "@/components/icons";                 // Flask, Grid, Book, Chart, User, Clock, Logout, Menu, Moon, Sun, Users, ClipboardCheck, Settings, Eye, Plus, Check, ChevronLeft, ChevronRight
import { ThemeToggle } from "@/components/theme-toggle";     // for the standalone landing nav
// data (async accessors + types):
import { getCourses, getPublishedCourses, getCourse, getMeetings, getMeeting,
         getQuiz, getStudents, getEnrollments, currentStudent, gradebook,
         studentResults, recentActivity, totalStudents } from "@/lib/data";
```

For one-off icons not in `@/components/icons`, inline the SVG from the source
(converted to JSX) — that's the most faithful.

## AppShell usage (student & admin pages)

```tsx
return (
  <AppShell variant="admin" crumb={<>Admin · <b>Buku Nilai</b></>} contentClassName="narrow">
    <style>{pageStyles}</style>
    {/* …content that was inside the source `.content`… */}
  </AppShell>
);
```

- `variant`: `"student"` (default) or `"admin"`.
- `crumb`: copy the source `.topbar .crumb` content. Turn inner `<a href="x.html">`
  into `<Link>`, keep `<b>`. (The greeting/emoji, breadcrumb slashes, etc.)
- `contentClassName="narrow"` ONLY if the source `.content` has the `narrow` class.
- Do NOT include the menu button, theme toggle, avatar, or sidebar — AppShell has them.

## Auth pages

Server `page.tsx` exports `metadata` and renders `<AuthShell><XForm/></AuthShell>`.
Put the interactive form in a co-located client component (`x-form.tsx`,
`"use client"`) that mirrors `app/login/login-form.tsx`: `useRouter()` + on submit
`router.push("/dashboard")` (login/register) or show the success state
(forgot/reset). Use `<PasswordField>` for password inputs. Keep the source's
extra `<style>` (e.g. `.mail-ico`, `.auth-card{max-width:440px}`) — render it
inside the form component or page.

## Route map (use these hrefs)

| Source link | Route |
|---|---|
| `landing.html` | `/` |
| `login.html` | `/login` |
| `register.html` | `/register` |
| `forgot-password.html` | `/forgot-password` |
| `reset-password.html` | `/reset-password` |
| `dashboard.html` | `/dashboard` |
| `courses.html` | `/courses` |
| `course.html` | `/courses/kimia-dasar` |
| `meeting.html` | `/courses/kimia-dasar/termokimia` |
| `quiz-intro.html` | `/quiz/quiz-kd-04` |
| `quiz-attempt.html` | `/quiz/quiz-kd-04/attempt/att-1` |
| `quiz-result.html` | `/quiz/quiz-kd-04/result/att-kd04-emmil-1` |
| `results.html` | `/me/results` |
| `profile.html` | `/me/profile` |
| `admin-dashboard.html` | `/admin` |
| `admin-courses.html` | `/admin/courses` |
| `admin-course-edit.html` | `/admin/courses/crs-dasar` |
| `admin-meeting-edit.html` | `/admin/courses/crs-dasar/meetings/mtg-kd-04` |
| `admin-quiz-builder.html` | `/admin/quizzes/quiz-kd-04` |
| `admin-students.html` | `/admin/students` |
| `admin-enrollments.html` | `/admin/enrollments` |
| `admin-gradebook.html` | `/admin/gradebook` |
| `admin-settings.html` | `/admin/settings` |

## Dynamic route pages

Accept and await params (Next 16 — params is a Promise):

```tsx
export default async function Page({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const course = await getCourse(courseSlug);
  if (!course) notFound(); // import { notFound } from "next/navigation"
  ...
}
```

Param names by route: `/courses/[courseSlug]`, `/courses/[courseSlug]/[meetingSlug]`,
`/quiz/[quizId]`, `/quiz/[quizId]/result/[attemptId]`,
`/admin/courses/[id]`, `/admin/courses/[id]/meetings/[meetingId]`,
`/admin/quizzes/[quizId]`.

## Data wiring

Wire mock data from `@/lib/data` where it maps cleanly (course catalog, meeting
lists with locked/available/completed states, the gradebook table, the student
list, results rows, the quiz review on quiz-result). Where the source has bespoke
hand-authored content (hero copy, announcements, admin stat tiles), reproduce the
literal text. Fidelity beats cleverness — when unsure, reproduce the source.

## Interactions

- Source uses `data-tabs`/`.tab` → use `<Tabs items={[...]} />`.
- Source has a password reveal (`data-reveal`) → use `<PasswordField>`.
- Source has a countdown (`data-countdown`) / quiz player (`data-quiz-player`) →
  use `<Countdown>` / `<QuizPlayer>` (already done for quiz-attempt).
- Other prototype affordances (drag handles, RTE toolbar buttons, filter chips,
  swatch pickers, an invite/reveal panel): reproduce them visually. If a visible
  toggle is essential (e.g. admin-students "Undang siswa" reveals a panel), make
  a tiny co-located `"use client"` component for just that toggle. Otherwise render
  static markup. The `.switch` toggles are pure CSS — render as `<input type="checkbox" defaultChecked />` inside `<label className="switch">…<span className="track"/></label>`.

## Must pass

- `npx tsc --noEmit` clean (no `any` leaks that break build, no missing imports).
- No unescaped `>`/`{`/`}` in JSX text. No duplicate `key`s in lists.
- Default-export the page component. Client components start with `"use client"`.
- Don't import server-only data accessors into a `"use client"` file; fetch in the
  server page and pass as props, or keep the data read in the server component.
