create or replace function public.ensure_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
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
exception
  when others then
    -- Never block auth.users inserts due to profile errors
    return new;
end;
$$;

drop trigger if exists on_auth_users_create_profiles on auth.users;
create trigger on_auth_users_create_profiles
after insert or update on auth.users
for each row execute function public.ensure_profile_from_auth();
