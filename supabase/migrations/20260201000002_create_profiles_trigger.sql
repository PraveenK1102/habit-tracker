create or replace function public.ensure_profile_from_auth()
returns trigger
language plpgsql
security definer
as $$
declare
  display_name text;
begin
  if new.email is null then
    return new;
  end if;

  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(lower(new.email), '@', 1),
    'User'
  );

  insert into public.profiles (user_id, email, name)
  values (new.id, lower(new.email), display_name)
  on conflict (user_id) do update set
    email = excluded.email,
    name = excluded.name;

  return new;
end;
$$;

drop trigger if exists on_auth_users_create_profiles on auth.users;
create trigger on_auth_users_create_profiles
after insert on auth.users
for each row execute function public.ensure_profile_from_auth();

-- Backfill any missing profiles for existing auth users
insert into public.profiles (user_id, email, name)
select
  u.id,
  lower(u.email),
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    split_part(lower(u.email), '@', 1),
    'User'
  )
from auth.users u
where u.email is not null
  and not exists (
    select 1 from public.profiles p where p.user_id = u.id
  );
