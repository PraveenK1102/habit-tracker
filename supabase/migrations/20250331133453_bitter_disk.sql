/*
  # Initial Schema for Health Maintain Application

  1. Tables
    - profiles
      - id (uuid, references auth.users)
      - name (text)
      - email (text)
      - age (integer)
      - gender (text)
      - image_url (text)
      - theme (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - tasks
      - id (uuid)
      - user_id (uuid, references profiles)
      - title (text)
      - image_url (text)
      - from_date (date)
      - to_date (date)
      - reminders (text[])
      - tags (text[])
      - description (text)
      - created_at (timestamp)
      - updated_at (timestamp)

    - task_notes
      - id (uuid)
      - task_id (uuid, references tasks)
      - date (date)
      - note (text)
      - created_at (timestamp)

    - task_participants
      - task_id (uuid, references tasks)
      - user_id (uuid, references profiles)
      - status (text)
      - created_at (timestamp)

    - friend_requests
      - id (uuid)
      - sender_id (uuid, references profiles)
      - receiver_id (uuid, references profiles)
      - status (text)
      - created_at (timestamp)

    - messages
      - id (uuid)
      - sender_id (uuid, references profiles)
      - receiver_id (uuid, references profiles)
      - content (text)
      - read (boolean)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  image_url TEXT,
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reminders TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create task_notes table
CREATE TABLE task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create task_participants table
CREATE TABLE task_participants (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

-- Create friend_requests table
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own tasks and participated tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM task_participants
      WHERE task_id = tasks.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read task notes for their tasks"
  ON task_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE id = task_notes.task_id
      AND (user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM task_participants
          WHERE task_id = tasks.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage task notes for their tasks"
  ON task_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE id = task_notes.task_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their task participations"
  ON task_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage friend requests"
  ON friend_requests FOR ALL
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can read their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());