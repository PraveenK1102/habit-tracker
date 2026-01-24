-- Fix the UPDATE policy for tasks table to include WITH CHECK clause
-- This ensures users can only update their own tasks

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;

-- Create the corrected update policy with both USING and WITH CHECK clauses
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

