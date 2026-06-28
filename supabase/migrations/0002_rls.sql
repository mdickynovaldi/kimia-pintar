-- ============================================================================
-- Kimia Pintar LMS — Row-Level Security (PRD §10)
-- RLS is enabled on ALL application tables. Answer keys in question_options are
-- never readable by students; quizzes are delivered through SECURITY DEFINER
-- functions (0003_functions.sql) that strip is_correct.
-- ============================================================================

-- helper: is the current user an active admin?
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

-- helper: is the current user enrolled (active) in a course?
create or replace function is_enrolled(p_course uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enrollments e
    where e.student_id = auth.uid() and e.course_id = p_course and e.status = 'active'
  );
$$;

-- ---- profiles --------------------------------------------------------------
alter table profiles enable row level security;
create policy "profiles_self_read"   on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_self_update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all"   on profiles for all using (is_admin()) with check (is_admin());

-- ---- courses ---------------------------------------------------------------
alter table courses enable row level security;
create policy "courses_read_published" on courses for select using (is_published or is_admin());
create policy "courses_admin_write"    on courses for all using (is_admin()) with check (is_admin());

-- ---- enrollments -----------------------------------------------------------
alter table enrollments enable row level security;
create policy "enrollments_owner_read" on enrollments for select using (student_id = auth.uid() or is_admin());
create policy "enrollments_admin_write" on enrollments for all using (is_admin()) with check (is_admin());

-- ---- meetings --------------------------------------------------------------
alter table meetings enable row level security;
create policy "meetings_read" on meetings for select using (
  is_admin() or (is_published and is_enrolled(meetings.course_id))
);
create policy "meetings_admin_write" on meetings for all using (is_admin()) with check (is_admin());

-- ---- materials (inherit access via the meeting's course) -------------------
alter table materials enable row level security;
create policy "materials_read" on materials for select using (
  is_admin() or exists (
    select 1 from meetings m
    where m.id = materials.meeting_id and m.is_published and is_enrolled(m.course_id)
  )
);
create policy "materials_admin_write" on materials for all using (is_admin()) with check (is_admin());

-- ---- videos ----------------------------------------------------------------
alter table videos enable row level security;
create policy "videos_read" on videos for select using (
  is_admin() or exists (
    select 1 from meetings m
    where m.id = videos.meeting_id and m.is_published and is_enrolled(m.course_id)
  )
);
create policy "videos_admin_write" on videos for all using (is_admin()) with check (is_admin());

-- ---- quizzes ---------------------------------------------------------------
alter table quizzes enable row level security;
create policy "quizzes_read" on quizzes for select using (
  is_admin() or (is_published and is_enrolled(quizzes.course_id))
);
create policy "quizzes_admin_write" on quizzes for all using (is_admin()) with check (is_admin());

-- ---- questions: metadata readable to eligible users; answer keys are NOT ---
-- (clients still go through the sanitized delivery RPC; direct reads are guarded)
alter table questions enable row level security;
create policy "questions_read" on questions for select using (
  is_admin() or exists (
    select 1 from quizzes q
    where q.id = questions.quiz_id and q.is_published and is_enrolled(q.course_id)
  )
);
create policy "questions_admin_write" on questions for all using (is_admin()) with check (is_admin());

-- ---- question_options: ADMIN ONLY direct access (answer keys) --------------
alter table question_options enable row level security;
create policy "options_admin_only" on question_options for all using (is_admin()) with check (is_admin());

-- ---- quiz_attempts ---------------------------------------------------------
alter table quiz_attempts enable row level security;
create policy "attempts_owner" on quiz_attempts for select using (student_id = auth.uid() or is_admin());
create policy "attempts_insert_self" on quiz_attempts for insert with check (student_id = auth.uid());
create policy "attempts_admin_update" on quiz_attempts for update using (is_admin());

-- ---- attempt_answers -------------------------------------------------------
alter table attempt_answers enable row level security;
create policy "answers_owner" on attempt_answers for all using (
  exists (
    select 1 from quiz_attempts a
    where a.id = attempt_answers.attempt_id and (a.student_id = auth.uid() or is_admin())
  )
);

-- ---- content_progress ------------------------------------------------------
alter table content_progress enable row level security;
create policy "progress_owner" on content_progress for all
  using (student_id = auth.uid() or is_admin())
  with check (student_id = auth.uid() or is_admin());
