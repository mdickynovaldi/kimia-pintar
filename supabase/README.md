# Supabase backend — Kimia Pintar LMS

This folder is the database half of the build. The UI currently reads from an
in-memory mock layer (`lib/data/`); these migrations and the wiring notes below
are everything needed to make it live against Supabase, **without changing any
screen**.

## Files

| File | Purpose |
|---|---|
| `migrations/0001_schema.sql` | Enums, tables, indexes, `updated_at` triggers (PRD §9) |
| `migrations/0002_rls.sql` | `is_admin()` / `is_enrolled()` helpers + RLS policies on every table (PRD §10) |
| `migrations/0003_functions.sql` | `handle_new_user` trigger + quiz RPCs: `start_quiz_attempt`, `get_quiz_questions` (no answer keys), `grade_attempt` (server-side scoring) |
| `seed.sql` | 7 course shells + Kimia Dasar meetings + the Termokimia quiz |

## Apply

With the Supabase CLI (recommended):

```bash
supabase db reset            # applies migrations/ in order, then seed.sql
# or, against a remote project:
supabase db push
```

Or paste each file into the SQL editor in order: `0001` → `0002` → `0003` → `seed`.

## Wire the Next.js app

1. Install the SSR client (the only supported auth helper — `@supabase/auth-helpers-*` is deprecated):

   ```bash
   npm install @supabase/ssr @supabase/supabase-js
   ```

2. Add env vars (`.env.local`):

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...      # server-only, never imported into client code
   ```

3. Create server/client Supabase factories (`lib/supabase/server.ts`,
   `lib/supabase/client.ts`) per the `@supabase/ssr` cookie pattern, plus
   `proxy.ts` for session refresh.

4. Replace the bodies of the accessor functions in `lib/data/index.ts` with
   Supabase queries. The return types in `lib/data/types.ts` stay the same, so
   **no screen needs to change**. For quizzes, call the RPCs:
   - student quiz delivery → `get_quiz_questions(quiz_id)` (answer keys stripped)
   - start → `start_quiz_attempt(quiz_id)` (server sets `deadline_at`)
   - submit/grade → `grade_attempt(attempt_id)` (server-side scoring)

5. Swap the demo auth handlers (`app/login/login-form.tsx`, register, reset)
   for `supabase.auth.signInWithPassword` / `signUp` / `resetPasswordForEmail`,
   and guard `/admin/*` and the student routes by reading `role` from `profiles`.

## Security notes (PRD §10)

- `question_options.is_correct` is **admin-only** via RLS and never selected by
  the student delivery RPC — answer keys never reach the browser.
- The quiz timer/deadline and grading are server-authoritative.
- The service-role key is server-only; client code uses the anon key under RLS.
