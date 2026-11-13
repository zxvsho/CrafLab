create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  deadline date,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_proceso', 'finalizado')),
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  role_in_project text not null default 'miembro',
  created_at timestamptz not null default now(),
  unique (project_id, student_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'media'
    check (priority in ('alta', 'media', 'baja')),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_proceso', 'finalizado')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists project_members_student_id_idx on public.project_members(student_id);
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to);

create or replace function public.is_project_member(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project
      and pm.student_id = (select auth.uid())
  )
$$;

revoke all on function public.is_project_member(uuid) from public, anon;
grant execute on function public.is_project_member(uuid) to authenticated;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "projects_read_scope" on public.projects;
create policy "projects_read_scope" on public.projects
  for select to authenticated
  using (
    public.is_academic_admin()
    or public.is_project_member(id)
    or exists (
      select 1
      from public.tasks t
      where t.project_id = projects.id
        and t.assigned_to = (select auth.uid())
    )
  );
drop policy if exists "projects_admin_insert" on public.projects;
create policy "projects_admin_insert" on public.projects
  for insert to authenticated with check (public.is_academic_admin());
drop policy if exists "projects_admin_update" on public.projects;
create policy "projects_admin_update" on public.projects
  for update to authenticated using (public.is_academic_admin()) with check (public.is_academic_admin());
drop policy if exists "projects_admin_delete" on public.projects;
create policy "projects_admin_delete" on public.projects
  for delete to authenticated using (public.is_academic_admin());

drop policy if exists "project_members_read_scope" on public.project_members;
create policy "project_members_read_scope" on public.project_members
  for select to authenticated
  using (public.is_academic_admin() or student_id = (select auth.uid()));
drop policy if exists "project_members_admin_insert" on public.project_members;
create policy "project_members_admin_insert" on public.project_members
  for insert to authenticated with check (public.is_academic_admin());
drop policy if exists "project_members_admin_update" on public.project_members;
create policy "project_members_admin_update" on public.project_members
  for update to authenticated using (public.is_academic_admin()) with check (public.is_academic_admin());
drop policy if exists "project_members_admin_delete" on public.project_members;
create policy "project_members_admin_delete" on public.project_members
  for delete to authenticated using (public.is_academic_admin());

drop policy if exists "tasks_read_scope" on public.tasks;
create policy "tasks_read_scope" on public.tasks
  for select to authenticated
  using (
    public.is_academic_admin()
    or assigned_to = (select auth.uid())
  );
drop policy if exists "tasks_admin_insert" on public.tasks;
create policy "tasks_admin_insert" on public.tasks
  for insert to authenticated with check (public.is_academic_admin());
drop policy if exists "tasks_update_scope" on public.tasks;
create policy "tasks_update_scope" on public.tasks
  for update to authenticated
  using (public.is_academic_admin() or assigned_to = (select auth.uid()))
  with check (
    public.is_academic_admin()
    or (assigned_to = (select auth.uid()) and public.is_project_member(project_id))
  );
drop policy if exists "tasks_delete_scope" on public.tasks;
create policy "tasks_delete_scope" on public.tasks
  for delete to authenticated
  using (public.is_academic_admin() or assigned_to = (select auth.uid()));

grant select, insert, update, delete on public.projects, public.project_members, public.tasks to authenticated;
