-- ============================================================================
-- SECURITY FIX (apply after 0005). Closes a privilege-escalation hole:
-- handle_new_user previously derived `role`/`invited` from raw_user_meta_data,
-- which the public self-signup endpoint (anon key) sets verbatim — so anyone
-- could POST {data:{role:"admin"}} and self-register as an ACTIVE ADMIN.
-- Fix: trust role/invited ONLY from raw_app_meta_data (service-role Admin API
-- only). This migration is idempotent.
-- ============================================================================

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

-- ---- Remediation (order matters) --------------------------------------------
-- STEP 1: stamp the trusted app_metadata marker on your REAL admin account(s),
-- BY EMAIL. Edit this list to include every legitimate admin BEFORE running —
-- any admin not stamped here is demoted in step 2.
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
where email in (
  'maya@kimiapintar.com'   -- ← add other legit admin emails here
);

-- STEP 2: demote any "admin" profile that was NOT granted admin through the
-- trusted (service-role-only) app_metadata channel — i.e. self-signup
-- escalations created before the trigger was fixed. Runs AFTER step 1, so the
-- stamped real admins are safe.
update public.profiles p
set role = 'student', is_active = false
where p.role = 'admin'
  and not exists (
    select 1 from auth.users u
    where u.id = p.id
      and coalesce(u.raw_app_meta_data->>'role', '') = 'admin'
  );
