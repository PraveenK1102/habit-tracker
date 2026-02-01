create table public.connection_requests (
  id uuid not null default gen_random_uuid (),
  sender_id uuid not null,
  receiver_id uuid null,
  created_at timestamp with time zone not null default now(),
  receiver_email text not null,
  status text not null,
  responded_at timestamp with time zone null,
  constraint connection_requests_pkey primary key (id),
  constraint connection_requests_receiver_id_fkey foreign KEY (receiver_id) references profiles (user_id) on delete CASCADE,
  constraint connection_requests_sender_id_fkey foreign KEY (sender_id) references profiles (user_id) on delete CASCADE,
  constraint connection_requests_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'accepted'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.conversation_participants (
  conversation_id uuid not null,
  user_id uuid not null,
  role text null,
  last_read_message_id uuid null,
  muted boolean null default false,
  archived boolean null default false,
  muted_period timestamp with time zone null,
  joined_at timestamp with time zone null default now(),
  constraint conversation_participants_pkey primary key (conversation_id, user_id),
  constraint conversation_participants_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint conversation_participants_user_id_fkey foreign KEY (user_id) references profiles (user_id) on delete CASCADE,
  constraint conversation_participants_role_check check (
    (role = any (array['member'::text, 'admin'::text]))
  )
) TABLESPACE pg_default;

create table public.conversations (
  id uuid not null default gen_random_uuid (),
  type text not null,
  name text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  last_modified_at timestamp with time zone null default now(),
  direct_key text null,
  constraint conversations_pkey primary key (id),
  constraint conversations_created_by_fkey1 foreign KEY (created_by) references profiles (user_id) on delete CASCADE,
  constraint conversations_type_check check (
    (
      type = any (
        array['direct'::text, 'group'::text, 'personal'::text]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists unique_direct_conversation on public.conversations using btree (direct_key) TABLESPACE pg_default
where
  (type = 'direct'::text);


create table public.messages (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  sender_id uuid not null,
  content text null,
  type text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null,
  deleted_at timestamp with time zone null,
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint messages_sender_id_fkey1 foreign KEY (sender_id) references profiles (user_id) on delete CASCADE,
  constraint messages_type_check check (
    (
      type = any (
        array[
          'text'::text,
          'images'::text,
          'voice_message'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.profiles (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  name text null,
  email text null,
  age text null,
  gender text null,
  theme text null default 'system'::text,
  image text null,
  constraint profiles_pkey primary key (id),
  constraint unique_user_id unique (user_id),
  constraint profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.users (
  id uuid not null,
  email text not null,
  email_confirmed_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_id_fkey foreign key (id) references auth.users (id) on delete cascade
) TABLESPACE pg_default;

alter table public.users enable row level security;

create policy "Users can read own user index"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

create or replace function public.sync_public_users_from_auth()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public.users where id = old.id;
    return old;
  end if;

  if new.email is null then
    return new;
  end if;

  insert into public.users (id, email, email_confirmed_at, created_at, updated_at)
  values (new.id, lower(new.email), new.email_confirmed_at, now(), now())
  on conflict (id) do update set
    email = excluded.email,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_users_sync_public_users on auth.users;
create trigger on_auth_users_sync_public_users
after insert or update on auth.users
for each row execute function public.sync_public_users_from_auth();

drop trigger if exists on_auth_users_delete_public_users on auth.users;
create trigger on_auth_users_delete_public_users
after delete on auth.users
for each row execute function public.sync_public_users_from_auth();


create table public.task_tracking (
  id text not null,
  task_id text not null,
  value numeric null,
  date text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  unit text null,
  constraint task_tracking_pkey primary key (id),
  constraint task_tracking_task_id_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_task_tracking_id BEFORE INSERT on task_tracking for EACH row
execute FUNCTION generate_task_tracking_id ();

create trigger set_timestamp BEFORE
update on task_tracking for EACH row
execute FUNCTION update_modified_column ();


create table public.taskmeta (
  id character varying(5) not null,
  task text not null,
  units text[] null,
  default_target jsonb null,
  type text null,
  color text null,
  icon text null,
  measurable boolean null default true,
  constraint tasksmeta_pkey primary key (id)
) TABLESPACE pg_default;

create table public.tasks (
  id text not null,
  task_id text null,
  from_date text not null,
  to_date text null,
  task_frequency text not null,
  reminder_day text not null,
  tags text[] null,
  friends text[] null,
  description text null,
  value double precision not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  unit text null,
  user_id uuid not null,
  prefered_start_time text null,
  prefered_end_time text null,
  reminder_time text null,
  constraint tasks_pkey primary key (id),
  constraint tasks_user_id_fkey foreign KEY (user_id) references profiles (user_id) on delete CASCADE,
  constraint tasks_reminder_day_check check (
    (
      reminder_day = any (
        array[
          'MONDAY'::text,
          'TUESDAY'::text,
          'WEDNESDAY'::text,
          'THURSDAY'::text,
          'FRIDAY'::text,
          'SATURDAY'::text,
          'SUNDAY'::text,
          ''::text
        ]
      )
    )
  ),
  constraint tasks_task_frequency_check check (
    (
      task_frequency = any (array['DAILY'::text, 'WEEKLY'::text])
    )
  )
) TABLESPACE pg_default;

create trigger set_tasks_id_trigger BEFORE INSERT on tasks for EACH row
execute FUNCTION set_tasks_id ();

create trigger update_tasks_updated_at BEFORE
update on tasks for EACH row
execute FUNCTION update_updated_at_column ();
-- Ensure account deletions cascade through profile-owned data
-- This prevents auth.users deletion from being blocked by FK constraints.

-- Ensure profiles.user_id is unique so it can be a FK target.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON profiles(user_id);

-- Drop any existing FK from profiles -> auth.users (name may differ).
DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND t.relname = 'profiles'
      AND c.confrelid = 'auth.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', fk.conname);
  END LOOP;
END $$;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Drop any existing FK from tasks -> profiles (name may differ).
DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND t.relname = 'tasks'
      AND c.confrelid = 'public.profiles'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS %I', fk.conname);
  END LOOP;
END $$;

-- Remove orphaned tasks that reference missing profiles
DELETE FROM tasks
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT user_id FROM profiles);

ALTER TABLE tasks
  ADD CONSTRAINT tasks_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(user_id)
  ON DELETE CASCADE;

-- Ensure connection_requests constraints cascade (if table/columns exist).
DO $$
DECLARE
  fk record;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'connection_requests'
  ) THEN
    FOR fk IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND t.relname = 'connection_requests'
        AND c.confrelid = 'public.profiles'::regclass
    LOOP
      EXECUTE format('ALTER TABLE public.connection_requests DROP CONSTRAINT IF EXISTS %I', fk.conname);
    END LOOP;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'connection_requests' AND column_name = 'sender_id'
    ) THEN
      EXECUTE 'ALTER TABLE public.connection_requests
        ADD CONSTRAINT connection_requests_sender_id_fkey
        FOREIGN KEY (sender_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'connection_requests' AND column_name = 'receiver_id'
    ) THEN
      EXECUTE 'ALTER TABLE public.connection_requests
        ADD CONSTRAINT connection_requests_receiver_id_fkey
        FOREIGN KEY (receiver_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE';
    END IF;
  END IF;
END $$;

-- Ensure conversations.created_by cascades (if table/columns exist).
DO $$
DECLARE
  fk record;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'conversations'
  ) THEN
    FOR fk IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND t.relname = 'conversations'
        AND c.confrelid = 'public.profiles'::regclass
    LOOP
      EXECUTE format('ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS %I', fk.conname);
    END LOOP;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'created_by'
    ) THEN
      EXECUTE 'ALTER TABLE public.conversations
        ADD CONSTRAINT conversations_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE';
    END IF;
  END IF;
END $$;

-- Ensure conversation_participants.user_id cascades (if table/columns exist).
DO $$
DECLARE
  fk record;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'conversation_participants'
  ) THEN
    FOR fk IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND t.relname = 'conversation_participants'
        AND c.confrelid = 'public.profiles'::regclass
    LOOP
      EXECUTE format('ALTER TABLE public.conversation_participants DROP CONSTRAINT IF EXISTS %I', fk.conname);
    END LOOP;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'conversation_participants' AND column_name = 'user_id'
    ) THEN
      EXECUTE 'ALTER TABLE public.conversation_participants
        ADD CONSTRAINT conversation_participants_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE';
    END IF;
  END IF;
END $$;

-- Ensure messages.sender_id cascades (if table/columns exist).
DO $$
DECLARE
  fk record;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    FOR fk IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND t.relname = 'messages'
        AND c.confrelid = 'public.profiles'::regclass
    LOOP
      EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS %I', fk.conname);
    END LOOP;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'sender_id'
    ) THEN
      EXECUTE 'ALTER TABLE public.messages
        ADD CONSTRAINT messages_sender_id_fkey
        FOREIGN KEY (sender_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE';
    END IF;
  END IF;
END $$;
