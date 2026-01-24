-- Update tasks table to match the current application code expectations

-- First, drop columns if they exist with wrong types, then recreate them
DO $$ 
BEGIN
    -- Drop and recreate prefered_start_time if it exists with wrong type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tasks' AND column_name = 'prefered_start_time') THEN
        ALTER TABLE tasks DROP COLUMN prefered_start_time;
    END IF;
    
    -- Drop and recreate prefered_end_time if it exists with wrong type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tasks' AND column_name = 'prefered_end_time') THEN
        ALTER TABLE tasks DROP COLUMN prefered_end_time;
    END IF;
    
    -- Drop and recreate reminder_time if it exists with wrong type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tasks' AND column_name = 'reminder_time') THEN
        ALTER TABLE tasks DROP COLUMN reminder_time;
    END IF;
END $$;

-- Now add all the missing columns with correct types
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_id TEXT,
ADD COLUMN IF NOT EXISTS task_frequency TEXT DEFAULT 'DAILY',
ADD COLUMN IF NOT EXISTS reminder_day TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prefered_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prefered_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS friends TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;

-- Make to_date nullable as expected by the code
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tasks' AND column_name = 'to_date' AND is_nullable = 'NO') THEN
        ALTER TABLE tasks ALTER COLUMN to_date DROP NOT NULL;
    END IF;
END $$;

-- Remove title column if it exists (since the code doesn't use it)
-- ALTER TABLE tasks DROP COLUMN IF EXISTS title;

-- Remove image_url column if it exists (since the code doesn't use it)  
-- ALTER TABLE tasks DROP COLUMN IF EXISTS image_url;

-- Update the reminders column to be nullable (the code uses reminder_time instead)
-- ALTER TABLE tasks ALTER COLUMN reminders DROP NOT NULL;
