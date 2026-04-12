-- 1. Wipe all existing policies on user_courses to destroy any recursive loop
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_courses' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_courses', pol.policyname); 
    END LOOP; 
END $$;

-- 2. Wipe all existing policies on courses just to be safe
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'courses' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON courses', pol.policyname); 
    END LOOP; 
END $$;

-- 3. Ensure Row Level Security is ON
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 4. Apply clean, non-recursive policies for 'courses'
CREATE POLICY "Allow read access to all courses" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated to insert courses" ON courses
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated to update courses" ON courses
    FOR UPDATE TO authenticated USING (true);


-- 5. Apply clean, non-recursive policies for 'user_courses'
CREATE POLICY "user_courses_select" ON user_courses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_courses_insert" ON user_courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_courses_update" ON user_courses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_courses_delete" ON user_courses
    FOR DELETE USING (auth.uid() = user_id);
