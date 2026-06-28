-- ============================================================================
-- Kimia Pintar LMS — schema (PRD §9)
-- Postgres / Supabase. Run in order: 0001_schema → 0002_rls → 0003_functions.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---- Enumerated types (PRD §9.2) -------------------------------------------
create type user_role         as enum ('admin', 'student');
create type enrollment_status as enum ('active', 'completed', 'dropped');
create type question_type     as enum (
  'single_choice','multiple_choice','true_false',
  'short_answer','fill_blank','matching','ordering','essay'
);
create type attempt_status    as enum (
  'in_progress','submitted','awaiting_manual_grade','graded','expired'
);
create type answers_policy    as enum ('never','after_submit','after_close');
create type grading_method    as enum ('highest','latest','average','first');
create type content_item_type as enum ('material','video');

-- ---- updated_at trigger helper ---------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---- profiles (1:1 with auth.users) ----------------------------------------
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role not null default 'student',
  full_name    text not null,
  student_no   text,
  avatar_url   text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ---- courses ---------------------------------------------------------------
create table courses (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  slug            text unique not null,
  title           text not null,
  description     text,
  cover_image_url text,
  color           text,
  sort_order      int not null default 0,
  is_published    boolean not null default false,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_courses_updated before update on courses
  for each row execute function set_updated_at();

-- ---- enrollments -----------------------------------------------------------
create table enrollments (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  status      enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  unique (course_id, student_id)
);

-- ---- meetings (pertemuan) --------------------------------------------------
create table meetings (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references courses(id) on delete cascade,
  title        text not null,
  slug         text not null,
  description  text,
  sort_order   int not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (course_id, slug)
);
create trigger trg_meetings_updated before update on meetings
  for each row execute function set_updated_at();

-- ---- materials -------------------------------------------------------------
create table materials (
  id             uuid primary key default gen_random_uuid(),
  meeting_id     uuid not null references meetings(id) on delete cascade,
  title          text not null,
  body           text,
  attachment_url text,
  sort_order     int not null default 0,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_materials_updated before update on materials
  for each row execute function set_updated_at();

-- ---- videos ----------------------------------------------------------------
create table videos (
  id               uuid primary key default gen_random_uuid(),
  meeting_id       uuid not null references meetings(id) on delete cascade,
  title            text not null,
  provider         text not null default 'google_drive',
  drive_file_id    text,
  source_url       text,
  duration_seconds int,
  sort_order       int not null default 0,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ---- quizzes ---------------------------------------------------------------
create table quizzes (
  id                     uuid primary key default gen_random_uuid(),
  meeting_id             uuid references meetings(id) on delete cascade,
  course_id              uuid references courses(id) on delete cascade,
  title                  text not null,
  description            text,
  time_limit_minutes     int,
  max_attempts           int default 1,
  passing_score          numeric(5,2) not null default 60,
  grading_method         grading_method not null default 'highest',
  shuffle_questions      boolean not null default false,
  shuffle_options        boolean not null default false,
  show_correct_answers   answers_policy not null default 'after_submit',
  show_score_immediately boolean not null default true,
  questions_per_page     int not null default 1,
  allow_backtrack        boolean not null default true,
  available_from         timestamptz,
  available_until        timestamptz,
  is_published           boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger trg_quizzes_updated before update on quizzes
  for each row execute function set_updated_at();

-- ---- questions -------------------------------------------------------------
create table questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references quizzes(id) on delete cascade,
  type        question_type not null,
  prompt      text not null,
  points      numeric(6,2) not null default 1,
  explanation text,
  sort_order  int not null default 0,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_questions_updated before update on questions
  for each row execute function set_updated_at();

-- ---- question_options (answer keys — NEVER exposed to students raw) --------
create table question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  content     text not null,
  is_correct  boolean not null default false,
  match_key   text,
  feedback    text,
  sort_order  int not null default 0
);

-- ---- quiz_attempts ---------------------------------------------------------
create table quiz_attempts (
  id                 uuid primary key default gen_random_uuid(),
  quiz_id            uuid not null references quizzes(id) on delete cascade,
  student_id         uuid not null references profiles(id) on delete cascade,
  attempt_number     int not null default 1,
  status             attempt_status not null default 'in_progress',
  started_at         timestamptz not null default now(),
  deadline_at        timestamptz,
  submitted_at       timestamptz,
  score              numeric(7,2),
  max_score          numeric(7,2),
  percentage         numeric(5,2),
  passed             boolean,
  time_spent_seconds int,
  graded_by          uuid references profiles(id),
  graded_at          timestamptz,
  unique (quiz_id, student_id, attempt_number)
);

-- ---- attempt_answers -------------------------------------------------------
create table attempt_answers (
  id                  uuid primary key default gen_random_uuid(),
  attempt_id          uuid not null references quiz_attempts(id) on delete cascade,
  question_id         uuid not null references questions(id) on delete cascade,
  selected_option_ids uuid[] default '{}',
  answer_text         text,
  answer_json         jsonb,
  is_correct          boolean,
  points_awarded      numeric(6,2) default 0,
  feedback            text,
  answered_at         timestamptz not null default now(),
  unique (attempt_id, question_id)
);

-- ---- content_progress ------------------------------------------------------
create table content_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references profiles(id) on delete cascade,
  meeting_id   uuid not null references meetings(id) on delete cascade,
  item_type    content_item_type not null,
  item_id      uuid not null,
  completed    boolean not null default false,
  completed_at timestamptz,
  unique (student_id, item_type, item_id)
);

-- ---- indexes (PRD §9.4) ----------------------------------------------------
create index on meetings (course_id, sort_order);
create index on materials (meeting_id, sort_order);
create index on videos (meeting_id, sort_order);
create index on questions (quiz_id, sort_order);
create index on question_options (question_id, sort_order);
create index on quiz_attempts (student_id, quiz_id);
create index on attempt_answers (attempt_id);
create index on enrollments (student_id);
create index on content_progress (student_id, meeting_id);
