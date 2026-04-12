-- 1. Eliminate any recursive triggers on user_courses
DO $$ 
DECLARE
    trg record;
BEGIN
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'user_courses'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON user_courses CASCADE', trg.trigger_name);
    END LOOP;
END $$;

-- 2. WIPE all policies cleanly to be 100% sure we don't have overlapping hidden ones
DO $$ DECLARE pol record; BEGIN FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_courses' LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON user_courses', pol.policyname); END LOOP; END $$;
DO $$ DECLARE pol record; BEGIN FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'courses' LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON courses', pol.policyname); END LOOP; END $$;
DO $$ DECLARE pol record; BEGIN FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'curriculum_offers' LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON curriculum_offers', pol.policyname); END LOOP; END $$;

-- 3. ENABLE RLS
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_offers ENABLE ROW LEVEL SECURITY;

-- 4. NEW COURSES POLICIES
CREATE POLICY "Allow read access to all courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Allow authenticated to insert courses" ON courses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated to update courses" ON courses FOR UPDATE TO authenticated USING (true);

-- 5. NEW USER_COURSES POLICIES
CREATE POLICY "user_courses_select" ON user_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_courses_insert" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_courses_update" ON user_courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_courses_delete" ON user_courses FOR DELETE USING (auth.uid() = user_id);

-- 6. NEW CURRICULUM_OFFERS POLICIES (Fixes the 403 Forbidden error!)
CREATE POLICY "curriculum_offers_select" ON curriculum_offers FOR SELECT USING (true);
CREATE POLICY "curriculum_offers_insert" ON curriculum_offers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "curriculum_offers_update" ON curriculum_offers FOR UPDATE TO authenticated USING (true);
