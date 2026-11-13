alter table public.profiles
  add column if not exists username text;

with candidates as (
  select
    id,
    left(
      coalesce(
        nullif(
          trim(both '-' from regexp_replace(
            translate(lower(full_name), 'áéíóúüñ', 'aeiouun'),
            '[^a-z0-9._-]+',
            '-',
            'g'
          )),
          ''
        ),
        'usuario'
      ),
      32
    ) as base_username
  from public.profiles
  where username is null
),
ranked as (
  select
    id,
    base_username,
    count(*) over (partition by base_username) as name_count
  from candidates
)
update public.profiles as profile
set username = case
  when ranked.name_count > 1 or length(ranked.base_username) < 3
    then ranked.base_username || '-' || left(replace(ranked.id::text, '-', ''), 8)
  else ranked.base_username
end
from ranked
where profile.id = ranked.id;

alter table public.profiles
  alter column username set not null;

alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[a-z0-9._-]{3,80}$');

create unique index if not exists profiles_username_ci_unique
  on public.profiles (lower(username));

create or replace function public.create_student_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_username text;
begin
  profile_username := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  if profile_username = '' then
    profile_username := 'user-' || left(replace(new.id::text, '-', ''), 8);
  end if;

  insert into public.profiles (id, email, full_name, role, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Usuario'),
    'student',
    profile_username
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        username = excluded.username;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_academic on auth.users;
create trigger on_auth_user_created_academic
  after insert on auth.users
  for each row execute procedure public.create_student_profile();
