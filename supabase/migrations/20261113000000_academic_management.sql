create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null,
  role text not null default 'student' check (role in ('admin', 'teacher', 'student')),
  created_at timestamptz not null default now()
);

insert into public.profiles (id, email, full_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', nullif(split_part(coalesce(email, ''), '@', 1), ''), 'Usuario'),
  'student'
from auth.users
on conflict (id) do nothing;

create or replace function public.current_academic_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_academic_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_academic_role() = 'admin', false)
$$;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  student_code text not null unique,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  staff_code text not null unique,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  credits integer not null default 1 check (credits between 1 and 30),
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  academic_year text not null,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'withdrawn')),
  enrolled_at date not null default current_date,
  unique (group_id, student_id)
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  student_id uuid not null,
  score numeric(5, 2) not null check (score between 0 and 100),
  comments text,
  updated_at timestamptz not null default now(),
  unique (group_id, student_id),
  foreign key (group_id, student_id)
    references public.enrollments(group_id, student_id)
    on delete cascade
);

create index if not exists groups_teacher_id_idx on public.groups(teacher_id);
create index if not exists groups_subject_id_idx on public.groups(subject_id);
create index if not exists enrollments_student_id_idx on public.enrollments(student_id);
create index if not exists grades_student_id_idx on public.grades(student_id);

create or replace function public.teaches_academic_group(target_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    join public.teachers t on t.id = g.teacher_id
    where g.id = target_group and t.profile_id = (select auth.uid())
  )
$$;

create or replace function public.is_enrolled_in_academic_group(target_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.students s on s.id = e.student_id
    where e.group_id = target_group
      and s.profile_id = (select auth.uid())
      and e.status = 'active'
  )
$$;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.subjects enable row level security;
alter table public.groups enable row level security;
alter table public.enrollments enable row level security;
alter table public.grades enable row level security;

drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_academic_admin());

drop policy if exists "profiles_scope_guard_select" on public.profiles;
create policy "profiles_scope_guard_select" on public.profiles
  as restrictive for select to authenticated
  using (id = (select auth.uid()) or public.is_academic_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using (public.is_academic_admin())
  with check (public.is_academic_admin() and role in ('admin', 'teacher', 'student'));

drop policy if exists "profiles_scope_guard_update" on public.profiles;
create policy "profiles_scope_guard_update" on public.profiles
  as restrictive for update to authenticated
  using (public.is_academic_admin())
  with check (public.is_academic_admin());

drop policy if exists "profiles_scope_guard_insert" on public.profiles;
create policy "profiles_scope_guard_insert" on public.profiles
  as restrictive for insert to authenticated
  with check (false);

drop policy if exists "profiles_scope_guard_delete" on public.profiles;
create policy "profiles_scope_guard_delete" on public.profiles
  as restrictive for delete to authenticated
  using (false);

drop policy if exists "students_read_scope" on public.students;
create policy "students_read_scope" on public.students
  for select to authenticated
  using (
    public.is_academic_admin()
    or profile_id = (select auth.uid())
    or exists (
      select 1 from public.enrollments e
      where e.student_id = students.id and public.teaches_academic_group(e.group_id)
    )
  );
drop policy if exists "students_admin_insert" on public.students;
create policy "students_admin_insert" on public.students
  for insert to authenticated with check (public.is_academic_admin());
drop policy if exists "students_admin_update" on public.students;
create policy "students_admin_update" on public.students
  for update to authenticated using (public.is_academic_admin()) with check (public.is_academic_admin());
drop policy if exists "students_admin_delete" on public.students;
create policy "students_admin_delete" on public.students
  for delete to authenticated using (public.is_academic_admin());

drop policy if exists "teachers_read_scope" on public.teachers;
create policy "teachers_read_scope" on public.teachers
  for select to authenticated
  using (public.is_academic_admin() or profile_id = (select auth.uid()));
drop policy if exists "teachers_admin_insert" on public.teachers;
create policy "teachers_admin_insert" on public.teachers
  for insert to authenticated with check (public.is_academic_admin());
drop policy if exists "teachers_admin_update" on public.teachers;
create policy "teachers_admin_update" on public.teachers
  for update to authenticated using (public.is_academic_admin()) with check (public.is_academic_admin());
drop policy if exists "teachers_admin_delete" on public.teachers;
create policy "teachers_admin_delete" on public.teachers
  for delete to authenticated using (public.is_academic_admin());

drop policy if exists "subjects_read_scope" on public.subjects;
create policy "subjects_read_scope" on public.subjects
  for select to authenticated
  using (
    public.is_academic_admin()
    or exists (
      select 1 from public.groups g
      where g.subject_id = subjects.id
        and (public.teaches_academic_group(g.id) or public.is_enrolled_in_academic_group(g.id))
    )
  );
drop policy if exists "subjects_admin_insert" on public.subjects;
create policy "subjects_admin_insert" on public.subjects for insert to authenticated with check (public.is_academic_admin());
drop policy if exists "subjects_admin_update" on public.subjects;
create policy "subjects_admin_update" on public.subjects for update to authenticated using (public.is_academic_admin()) with check (public.is_academic_admin());
drop policy if exists "subjects_admin_delete" on public.subjects;
create policy "subjects_admin_delete" on public.subjects for delete to authenticated using (public.is_academic_admin());

drop policy if exists "groups_read_scope" on public.groups;
create policy "groups_read_scope" on public.groups
  for select to authenticated
  using (
    public.is_academic_admin()
    or public.teaches_academic_group(id)
    or public.is_enrolled_in_academic_group(id)
  );
drop policy if exists "groups_admin_insert" on public.groups;
create policy "groups_admin_insert" on public.groups for insert to authenticated with check (public.is_academic_admin());
drop policy if exists "groups_admin_update" on public.groups;
create policy "groups_admin_update" on public.groups for update to authenticated using (public.is_academic_admin()) with check (public.is_academic_admin());
drop policy if exists "groups_admin_delete" on public.groups;
create policy "groups_admin_delete" on public.groups for delete to authenticated using (public.is_academic_admin());

drop policy if exists "enrollments_read_scope" on public.enrollments;
create policy "enrollments_read_scope" on public.enrollments
  for select to authenticated
  using (
    public.is_academic_admin()
    or public.teaches_academic_group(group_id)
    or exists (
      select 1 from public.students s
      where s.id = enrollments.student_id and s.profile_id = (select auth.uid())
    )
  );
drop policy if exists "enrollments_admin_insert" on public.enrollments;
create policy "enrollments_admin_insert" on public.enrollments for insert to authenticated with check (public.is_academic_admin());
drop policy if exists "enrollments_admin_update" on public.enrollments;
create policy "enrollments_admin_update" on public.enrollments for update to authenticated using (public.is_academic_admin()) with check (public.is_academic_admin());
drop policy if exists "enrollments_admin_delete" on public.enrollments;
create policy "enrollments_admin_delete" on public.enrollments for delete to authenticated using (public.is_academic_admin());

drop policy if exists "grades_read_scope" on public.grades;
create policy "grades_read_scope" on public.grades
  for select to authenticated
  using (
    public.is_academic_admin()
    or public.teaches_academic_group(group_id)
    or exists (
      select 1 from public.students s
      where s.id = grades.student_id and s.profile_id = (select auth.uid())
    )
  );
drop policy if exists "grades_teacher_insert" on public.grades;
create policy "grades_teacher_insert" on public.grades
  for insert to authenticated
  with check (public.is_academic_admin() or public.teaches_academic_group(group_id));
drop policy if exists "grades_teacher_update" on public.grades;
create policy "grades_teacher_update" on public.grades
  for update to authenticated
  using (public.is_academic_admin() or public.teaches_academic_group(group_id))
  with check (public.is_academic_admin() or public.teaches_academic_group(group_id));
drop policy if exists "grades_teacher_delete" on public.grades;
create policy "grades_teacher_delete" on public.grades
  for delete to authenticated
  using (public.is_academic_admin() or public.teaches_academic_group(group_id));

create or replace function public.create_student_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Usuario'),
    'student'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = 'student';
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_academic on auth.users;
create trigger on_auth_user_created_academic
  after insert on auth.users
  for each row execute procedure public.create_student_profile();

revoke all on function public.current_academic_role() from public, anon;
revoke all on function public.is_academic_admin() from public, anon;
revoke all on function public.teaches_academic_group(uuid) from public, anon;
revoke all on function public.is_enrolled_in_academic_group(uuid) from public, anon;
grant execute on function public.current_academic_role() to authenticated;
grant execute on function public.is_academic_admin() to authenticated;
grant execute on function public.teaches_academic_group(uuid) to authenticated;
grant execute on function public.is_enrolled_in_academic_group(uuid) to authenticated;

grant select, insert, update, delete on public.students, public.teachers, public.subjects,
  public.groups, public.enrollments, public.grades to authenticated;
grant select, update on public.profiles to authenticated;
