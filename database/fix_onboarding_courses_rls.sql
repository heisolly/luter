-- Fix RLS policies to allow authenticated users to add missing courses during onboarding
-- Drop restrictive policies if they exist
DROP POLICY IF EXISTS "Allow read access to all courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated to insert courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated to update courses" ON courses;

-- Allow SELECT for everyone (authenticated and anon)
CREATE POLICY "Allow read access to all courses" ON courses
    FOR SELECT USING (true);

-- Allow authenticated users to insert new courses if they are missing
CREATE POLICY "Allow authenticated to insert courses" ON courses
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update courses (for upsert operations)
CREATE POLICY "Allow authenticated to update courses" ON courses
    FOR UPDATE TO authenticated USING (true);


-- Fix RLS for user_courses table
DROP POLICY IF EXISTS "Allow read access to user_courses for owner" ON user_courses;
DROP POLICY IF EXISTS "Allow insert to user_courses for owner" ON user_courses;
DROP POLICY IF EXISTS "Allow update to user_courses for owner" ON user_courses;
DROP POLICY IF EXISTS "Allow delete to user_courses for owner" ON user_courses;

CREATE POLICY "Allow read access to user_courses for owner" ON user_courses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow insert to user_courses for owner" ON user_courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update to user_courses for owner" ON user_courses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow delete to user_courses for owner" ON user_courses
    FOR DELETE USING (auth.uid() = user_id);
