create type public.academic_role as enum ('admin', 'teacher', 'student');

alter table public.profiles
  alter column role drop default;

alter table public.profiles
  drop constraint if exists profiles_role_check;

drop policy if exists "profiles_admin_update" on public.profiles;

alter table public.profiles
  alter column role type public.academic_role
  using role::public.academic_role;

alter table public.profiles
  alter column role set default 'student'::public.academic_role;

create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using (public.is_academic_admin())
  with check (public.is_academic_admin() and role in ('admin', 'teacher', 'student'));
