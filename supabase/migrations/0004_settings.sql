-- ============================================================================
-- Kimia Pintar LMS — platform settings (PRD FR-25, §18)
-- Single-row config table. Apply after 0001–0003.
-- ============================================================================

create table if not exists app_settings (
  id                     smallint primary key default 1,
  site_name              text not null default 'Kimia Pintar',
  domain                 text not null default 'kimiapintar.com',
  locale                 text not null default 'id',
  allow_registration     boolean not null default true,
  require_admin_approval boolean not null default false,
  default_passing_score  numeric(5,2) not null default 60,
  default_grading_method grading_method not null default 'highest',
  default_show_answers   answers_policy not null default 'after_submit',
  show_score_immediately boolean not null default true,
  updated_at             timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

alter table app_settings enable row level security;

-- Any signed-in user may read (e.g. site name); only admins may write.
create policy "settings_read_auth" on app_settings
  for select using (auth.uid() is not null);
create policy "settings_admin_write" on app_settings
  for all using (is_admin()) with check (is_admin());
