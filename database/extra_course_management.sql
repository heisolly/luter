-- Add management columns to user_courses for enhanced features
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS custom_name TEXT;
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT '1st';

-- Ensure RLS allows updating these columns
-- (Usually update policy covers all columns if not restricted)
