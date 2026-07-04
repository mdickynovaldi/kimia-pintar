-- ============================================================================
-- Kimia Pintar LMS — QC hardening & feature completion (pre-production pass)
-- Apply after 0001–0004. Covers:
--   1. Course metadata: instructor + objectives (drives the Ikhtisar tab)
--   2. Auto-enrollment: new students ↔ published courses (+ backfill)
--   3. Deactivation & approval enforcement (is_enrolled honors is_active;
--      handle_new_user honors app_settings.require_admin_approval)
--   4. RLS hardening: no direct attempt INSERTs; answer writes only while the
--      attempt is open; grading columns not writable by students
--   5. grade_attempt v2: short_answer text-matching, essays → manual with
--      partial score (percentage/passed NULL until fully graded), no more
--      "empty set == empty set → correct" free points, complete answer rows
--   6. finalize_expired_attempts + start_quiz_attempt integration (no more
--      zombie in_progress attempts locking a quiz while counters read 0)
--   7. get_quiz_questions v2: optional per-attempt shuffle seed
--   8. save_manual_grades: admin essay grading + final recompute
-- ============================================================================

-- ---- 1. Course metadata ------------------------------------------------------
alter table courses add column if not exists instructor text not null default 'Bu Maya';
alter table courses add column if not exists objectives text; -- newline-separated capaian pembelajaran

-- ---- 2. Auto-enrollment ------------------------------------------------------
-- New student → enrolled in every published course.
create or replace function auto_enroll_new_student() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'student' then
    insert into enrollments (course_id, student_id, status)
    select c.id, new.id, 'active' from courses c where c.is_published
    on conflict (course_id, student_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profiles_auto_enroll on profiles;
create trigger trg_profiles_auto_enroll
  after insert on profiles
  for each row execute function auto_enroll_new_student();

-- Course published → every student enrolled.
create or replace function auto_enroll_on_publish() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_published and (tg_op = 'INSERT' or old.is_published is distinct from new.is_published) then
    insert into enrollments (course_id, student_id, status)
    select new.id, p.id, 'active' from profiles p where p.role = 'student'
    on conflict (course_id, student_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_courses_auto_enroll on courses;
create trigger trg_courses_auto_enroll
  after insert or update of is_published on courses
  for each row execute function auto_enroll_on_publish();

-- Backfill: enroll existing students into existing published courses.
insert into enrollments (course_id, student_id, status)
select c.id, p.id, 'active'
from courses c cross join profiles p
where c.is_published and p.role = 'student'
on conflict (course_id, student_id) do nothing;

-- ---- 3. Deactivation & approval enforcement ----------------------------------
-- A deactivated student loses content access at the RLS layer, not just the UI.
create or replace function is_enrolled(p_course uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enrollments e
    join profiles p on p.id = e.student_id
    where e.student_id = auth.uid() and e.course_id = p_course
      and e.status = 'active' and p.is_active
  );
$$;

-- New self-registered accounts start inactive when the admin has turned on
-- "Wajib persetujuan admin". Admin-invited accounts and admins themselves are
-- always active.
--
-- SECURITY: role + invited are read ONLY from app_metadata, which the public
-- self-signup endpoint (anon key) CANNOT set — only the service-role Admin API
-- can. raw_user_meta_data is fully attacker-controlled on signUp, so trusting
-- it for role would let anyone POST {data:{role:"admin"}} and become admin.
-- full_name/student_no stay in user_metadata (they carry no privilege).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role     user_role;
  v_invited  boolean;
  v_approval boolean;
begin
  v_role := coalesce((new.raw_app_meta_data->>'role')::user_role, 'student');
  v_invited := coalesce(new.raw_app_meta_data->>'invited', 'false') = 'true';
  select require_admin_approval into v_approval from app_settings where id = 1;

  insert into public.profiles (id, full_name, student_no, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'student_no',
    v_role,
    case
      when v_role = 'admin' then true
      when v_invited then true
      else not coalesce(v_approval, false)
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---- 4. RLS hardening ---------------------------------------------------------
-- Attempts are created ONLY through start_quiz_attempt (security definer), which
-- validates the window, the attempt limit, and sets the server deadline.
drop policy if exists "attempts_insert_self" on quiz_attempts;

-- Answers: readable by owner/admin; writable by the owner only while the
-- attempt is open and before its deadline. Grading columns are protected via
-- column-level grants below (students can never set their own points).
drop policy if exists "answers_owner" on attempt_answers;
drop policy if exists "answers_owner_read" on attempt_answers;
drop policy if exists "answers_owner_insert" on attempt_answers;
drop policy if exists "answers_owner_update" on attempt_answers;
drop policy if exists "answers_admin_all" on attempt_answers;

create policy "answers_owner_read" on attempt_answers for select using (
  exists (
    select 1 from quiz_attempts a
    where a.id = attempt_answers.attempt_id
      and (a.student_id = auth.uid() or is_admin())
  )
);
create policy "answers_owner_insert" on attempt_answers for insert with check (
  exists (
    select 1 from quiz_attempts a
    where a.id = attempt_answers.attempt_id
      and a.student_id = auth.uid()
      and a.status = 'in_progress'
      and (a.deadline_at is null or now() <= a.deadline_at)
  )
);
create policy "answers_owner_update" on attempt_answers for update using (
  exists (
    select 1 from quiz_attempts a
    where a.id = attempt_answers.attempt_id
      and a.student_id = auth.uid()
      and a.status = 'in_progress'
      and (a.deadline_at is null or now() <= a.deadline_at)
  )
) with check (
  exists (
    select 1 from quiz_attempts a
    where a.id = attempt_answers.attempt_id
      and a.student_id = auth.uid()
      and a.status = 'in_progress'
      and (a.deadline_at is null or now() <= a.deadline_at)
  )
);
create policy "answers_admin_all" on attempt_answers for all
  using (is_admin()) with check (is_admin());

-- Students may write WHAT they answered, never how it is scored.
revoke insert, update on attempt_answers from anon, authenticated;
grant insert (attempt_id, question_id, selected_option_ids, answer_text, answer_json, answered_at)
  on attempt_answers to authenticated;
grant update (selected_option_ids, answer_text, answer_json, answered_at)
  on attempt_answers to authenticated;

-- Privilege-escalation guard: profiles_self_update lets users update their own
-- row, which without this trigger would include role / is_active / student_no —
-- i.e. any student could grant themselves admin via PostgREST. Sensitive columns
-- may only change via an admin session or the service-role key.
create or replace function protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.is_active is distinct from old.is_active
      or new.student_no is distinct from old.student_no)
     and not is_admin()
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Tidak diizinkan mengubah peran/status akun';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profiles_protect on profiles;
create trigger trg_profiles_protect
  before update on profiles
  for each row execute function protect_profile_columns();

-- ---- 5. grade_attempt v2 -------------------------------------------------------
-- Server-authoritative grading:
--   * objective (choice) questions: all-or-nothing set equality, and an empty
--     correct set can never award points;
--   * short_answer / fill_blank: case-insensitive trimmed match of answer_text
--     against the question's is_correct option contents (no accepted answers
--     defined → manual grading);
--   * essay: always manual (points_awarded stays NULL);
--   * missing answer rows are created so reviews/grading show every question;
--   * needs-manual attempts get percentage/passed = NULL (pending), else final.
create or replace function grade_attempt(p_attempt uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_attempt quiz_attempts%rowtype;
  v_quiz    quizzes%rowtype;
  v_max     numeric := 0;
  v_score   numeric := 0;
  r         record;
  v_needs_manual boolean := false;
begin
  select * into v_attempt from quiz_attempts where id = p_attempt;
  if not found then raise exception 'Percobaan tidak ditemukan'; end if;
  if not (v_attempt.student_id = auth.uid() or is_admin()) then
    raise exception 'Tidak diizinkan';
  end if;
  if v_attempt.status in ('graded', 'awaiting_manual_grade') then
    return; -- idempotent: already finalized
  end if;
  select * into v_quiz from quizzes where id = v_attempt.quiz_id;

  -- Ensure every question has an answer row (unanswered → empty row) so the
  -- result review and the manual-grading screen are complete.
  insert into attempt_answers (attempt_id, question_id, selected_option_ids, answer_text)
  select p_attempt, qu.id, '{}', null
  from questions qu
  where qu.quiz_id = v_attempt.quiz_id
  on conflict (attempt_id, question_id) do nothing;

  for r in
    select qu.id, qu.type, qu.points,
           coalesce(array_agg(o.id) filter (where o.is_correct), '{}') as correct_ids,
           coalesce(array_agg(lower(btrim(o.content))) filter (where o.is_correct), '{}') as accepted_texts
    from questions qu
    left join question_options o on o.question_id = qu.id
    where qu.quiz_id = v_attempt.quiz_id
    group by qu.id
  loop
    v_max := v_max + r.points;

    if r.type = 'essay' then
      v_needs_manual := true;
      update attempt_answers
        set is_correct = null, points_awarded = null
        where attempt_id = p_attempt and question_id = r.id;
      continue;
    end if;

    if r.type in ('short_answer', 'fill_blank') then
      declare
        v_text text;
        v_ok   boolean;
      begin
        select answer_text into v_text from attempt_answers
          where attempt_id = p_attempt and question_id = r.id;
        if cardinality(r.accepted_texts) = 0 then
          -- no accepted answers configured → needs a human
          v_needs_manual := true;
          update attempt_answers
            set is_correct = null, points_awarded = null
            where attempt_id = p_attempt and question_id = r.id;
          continue;
        end if;
        v_ok := v_text is not null and lower(btrim(v_text)) = any (r.accepted_texts);
        update attempt_answers
          set is_correct = v_ok,
              points_awarded = case when v_ok then r.points else 0 end
          where attempt_id = p_attempt and question_id = r.id;
        if v_ok then v_score := v_score + r.points; end if;
      end;
      continue;
    end if;

    -- objective choice questions (single/multiple/true_false/…)
    declare
      v_sel uuid[];
      v_ok  boolean;
    begin
      select selected_option_ids into v_sel from attempt_answers
        where attempt_id = p_attempt and question_id = r.id;
      v_sel := coalesce(v_sel, '{}');
      -- all-or-nothing set equality; an empty answer key never awards points
      v_ok := cardinality(r.correct_ids) > 0
              and (v_sel <@ r.correct_ids) and (r.correct_ids <@ v_sel)
              and cardinality(v_sel) = cardinality(r.correct_ids);

      update attempt_answers
        set is_correct = v_ok,
            points_awarded = case when v_ok then r.points else 0 end
        where attempt_id = p_attempt and question_id = r.id;

      if v_ok then v_score := v_score + r.points; end if;
    end;
  end loop;

  update quiz_attempts set
    score        = v_score,
    max_score    = v_max,
    percentage   = case when v_needs_manual then null
                        when v_max > 0 then round(v_score / v_max * 100, 2)
                        else 0 end,
    passed       = case when v_needs_manual then null
                        when v_max > 0 then (v_score / v_max * 100) >= v_quiz.passing_score
                        else false end,
    submitted_at = coalesce(submitted_at, now()),
    time_spent_seconds = coalesce(
      time_spent_seconds,
      greatest(0, extract(epoch from (least(now(), coalesce(deadline_at, now())) - started_at))::int)
    ),
    graded_at    = case when v_needs_manual then null else now() end,
    status       = (case when v_needs_manual then 'awaiting_manual_grade' else 'graded' end)::attempt_status
  where id = p_attempt;
end;
$$;

-- ---- 6. Expired-attempt finalization -------------------------------------------
-- Grades whatever was answered before the deadline. Called by the intro page /
-- startQuiz so counters agree and abandoned attempts stop locking the quiz.
create or replace function finalize_expired_attempts(p_quiz uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select id from quiz_attempts
    where quiz_id = p_quiz and student_id = auth.uid()
      and status = 'in_progress'
      and deadline_at is not null and now() > deadline_at
  loop
    perform grade_attempt(r.id);
  end loop;
end;
$$;

-- start_quiz_attempt: finalize the caller's expired attempts FIRST, then apply
-- the attempt limit to finalized+open attempts (consistent with the UI stats).
create or replace function start_quiz_attempt(p_quiz uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_quiz   quizzes%rowtype;
  v_used   int;
  v_attempt uuid;
begin
  select * into v_quiz from quizzes where id = p_quiz and is_published;
  if not found then raise exception 'Kuis tidak tersedia'; end if;
  if not (is_admin() or is_enrolled(v_quiz.course_id)) then
    raise exception 'Tidak terdaftar pada mata kuliah ini';
  end if;

  if v_quiz.available_from is not null and now() < v_quiz.available_from then
    raise exception 'Kuis belum dibuka';
  end if;
  if v_quiz.available_until is not null and now() > v_quiz.available_until then
    raise exception 'Kuis sudah ditutup';
  end if;

  perform finalize_expired_attempts(p_quiz);

  select count(*) into v_used from quiz_attempts
    where quiz_id = p_quiz and student_id = auth.uid();
  if v_quiz.max_attempts is not null and v_used >= v_quiz.max_attempts then
    raise exception 'Percobaan habis';
  end if;

  insert into quiz_attempts (quiz_id, student_id, attempt_number, status, started_at, deadline_at)
  values (
    p_quiz, auth.uid(), v_used + 1, 'in_progress', now(),
    case when v_quiz.time_limit_minutes is null then null
         else now() + make_interval(mins => v_quiz.time_limit_minutes) end
  )
  returning id into v_attempt;

  return v_attempt;
end;
$$;

-- ---- 7. get_quiz_questions v2: per-attempt shuffle ------------------------------
-- p_seed (the attempt id) makes the shuffle stable across reloads of one attempt
-- while differing between students/attempts.
drop function if exists get_quiz_questions(uuid);
create or replace function get_quiz_questions(p_quiz uuid, p_seed text default null)
returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(q order by q.ord, q.sort_order), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', qu.id,
      'type', qu.type,
      'prompt', qu.prompt,
      'points', qu.points,
      'sort_order', qu.sort_order,
      -- Text-answer types keep their options server-side ONLY: for
      -- short_answer/fill_blank the option contents ARE the accepted answers.
      'options', case
        when qu.type in ('short_answer', 'fill_blank', 'essay') then '[]'::jsonb
        else (
          select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'content', o.content)
                   order by case when z.shuffle_options and p_seed is not null
                                 then md5(p_seed || o.id::text) end nulls last,
                            o.sort_order), '[]'::jsonb)
          from question_options o where o.question_id = qu.id
        )
      end
    ) as q,
    case when z.shuffle_questions and p_seed is not null
         then md5(p_seed || qu.id::text) end as ord,
    qu.sort_order
    from questions qu
    join quizzes z on z.id = qu.quiz_id
    where qu.quiz_id = p_quiz
      and z.is_published and (is_admin() or is_enrolled(z.course_id))
  ) q;
$$;

-- ---- 8. Manual grading (essays / unconfigured short answers) --------------------
-- p_grades: [{ "question_id": uuid, "points": numeric, "feedback": text|null }]
-- Clamps points to the question's maximum, then finalizes the attempt.
create or replace function save_manual_grades(p_attempt uuid, p_grades jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_attempt quiz_attempts%rowtype;
  v_quiz    quizzes%rowtype;
  v_score   numeric := 0;
  v_max     numeric := 0;
  g         record;
begin
  if not is_admin() then raise exception 'Hanya admin yang dapat menilai'; end if;

  select * into v_attempt from quiz_attempts where id = p_attempt;
  if not found then raise exception 'Percobaan tidak ditemukan'; end if;

  for g in
    select (e->>'question_id')::uuid as qid,
           greatest(coalesce((e->>'points')::numeric, 0), 0) as pts,
           e->>'feedback' as fb
    from jsonb_array_elements(p_grades) e
  loop
    update attempt_answers aa
      set points_awarded = least(g.pts, q.points),
          is_correct     = (g.pts >= q.points),
          feedback       = g.fb
      from questions q
      where q.id = g.qid
        and aa.attempt_id = p_attempt
        and aa.question_id = g.qid;
  end loop;

  select coalesce(sum(points), 0) into v_max
    from questions where quiz_id = v_attempt.quiz_id;
  select coalesce(sum(aa.points_awarded), 0) into v_score
    from attempt_answers aa
    join questions q on q.id = aa.question_id
    where aa.attempt_id = p_attempt;

  select * into v_quiz from quizzes where id = v_attempt.quiz_id;

  update quiz_attempts set
    score      = v_score,
    max_score  = v_max,
    percentage = case when v_max > 0 then round(v_score / v_max * 100, 2) else 0 end,
    passed     = case when v_max > 0 then (v_score / v_max * 100) >= v_quiz.passing_score else false end,
    status     = 'graded',
    graded_by  = auth.uid(),
    graded_at  = now()
  where id = p_attempt;
end;
$$;
