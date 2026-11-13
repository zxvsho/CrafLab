create or replace function public.teaches_academic_student(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.groups g on g.id = e.group_id
    join public.teachers t on t.id = g.teacher_id
    where e.student_id = target_student
      and t.profile_id = (select auth.uid())
  )
$$;

revoke all on function public.teaches_academic_student(uuid) from public, anon;
grant execute on function public.teaches_academic_student(uuid) to authenticated;

drop policy if exists "students_read_scope" on public.students;
create policy "students_read_scope" on public.students
  for select to authenticated
  using (
    public.is_academic_admin()
    or profile_id = (select auth.uid())
    or public.teaches_academic_student(id)
  );
