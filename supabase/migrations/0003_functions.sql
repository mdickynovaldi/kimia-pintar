-- ============================================================================
-- Kimia Pintar LMS — auth trigger + quiz RPCs (PRD §8.3, §10, §12.3)
-- The quiz engine is server-authoritative: questions are delivered WITHOUT
-- answer keys, and grading runs server-side using the keys students never see.
-- ============================================================================

-- ---- Provision a profile row whenever an auth user is created --------------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, student_no, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'student_no',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---- Start an attempt: validate window + attempt count, set deadline -------
-- Returns the new attempt id. Question delivery (sanitized, no is_correct) is
-- done by get_quiz_questions below.
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

-- ---- Deliver questions for an attempt WITHOUT answer keys -------------------
create or replace function get_quiz_questions(p_quiz uuid)
returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(q order by q.sort_order), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', qu.id,
      'type', qu.type,
      'prompt', qu.prompt,
      'points', qu.points,
      'sort_order', qu.sort_order,
      'options', (
        select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'content', o.content)
                                  order by o.sort_order), '[]'::jsonb)
        from question_options o where o.question_id = qu.id
      )
    ) as q, qu.sort_order
    from questions qu
    where qu.quiz_id = p_quiz
      and exists (
        select 1 from quizzes z
        where z.id = p_quiz and z.is_published and (is_admin() or is_enrolled(z.course_id))
      )
  ) q;
$$;

-- ---- Server-side grading of objective questions ----------------------------
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
  select * into v_quiz from quizzes where id = v_attempt.quiz_id;

  for r in
    select qu.id, qu.type, qu.points,
           coalesce(array_agg(o.id) filter (where o.is_correct), '{}') as correct_ids
    from questions qu
    left join question_options o on o.question_id = qu.id
    where qu.quiz_id = v_attempt.quiz_id
    group by qu.id
  loop
    v_max := v_max + r.points;

    if r.type = 'essay' then
      v_needs_manual := true;
      continue;
    end if;

    declare
      v_sel uuid[];
      v_ok  boolean;
    begin
      select selected_option_ids into v_sel from attempt_answers
        where attempt_id = p_attempt and question_id = r.id;
      v_sel := coalesce(v_sel, '{}');
      -- all-or-nothing: selected set must equal the correct set
      v_ok := (v_sel <@ r.correct_ids) and (r.correct_ids <@ v_sel)
              and array_length(v_sel,1) is not distinct from array_length(r.correct_ids,1);

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
    percentage   = case when v_max > 0 then round(v_score / v_max * 100, 2) else 0 end,
    passed       = case when v_max > 0 then (v_score / v_max * 100) >= v_quiz.passing_score else false end,
    submitted_at = coalesce(submitted_at, now()),
    status       = (case when v_needs_manual then 'awaiting_manual_grade' else 'graded' end)::attempt_status
  where id = p_attempt;
end;
$$;
