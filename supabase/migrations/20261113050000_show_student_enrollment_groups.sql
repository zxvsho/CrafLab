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
  )
$$;
