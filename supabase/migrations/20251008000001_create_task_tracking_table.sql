-- Create task_tracking table for storing daily task completion values
CREATE TABLE task_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, user_id, date)
);

-- Enable Row Level Security
ALTER TABLE task_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for task_tracking
CREATE POLICY "Users can read their own task tracking"
  ON task_tracking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own task tracking"
  ON task_tracking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own task tracking"
  ON task_tracking FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own task tracking"
  ON task_tracking FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
