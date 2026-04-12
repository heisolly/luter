-- 1. Fix RLS for semester_weeks
ALTER TABLE semester_weeks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to semester_weeks" ON semester_weeks;
CREATE POLICY "Allow read access to semester_weeks" ON semester_weeks
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert semester_weeks" ON semester_weeks;
CREATE POLICY "Allow authenticated to insert semester_weeks" ON semester_weeks
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to update semester_weeks" ON semester_weeks;
CREATE POLICY "Allow authenticated to update semester_weeks" ON semester_weeks
    FOR UPDATE TO authenticated USING (true);

-- 2. Ensure related tables also have proper RLS (topics, etc. if they exist)
-- Check if topics table exists and apply RLS
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'topics') THEN
        ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow read access to topics" ON topics;
        CREATE POLICY "Allow read access to topics" ON topics FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Allow authenticated to insert topics" ON topics;
        CREATE POLICY "Allow authenticated to insert topics" ON topics FOR INSERT TO authenticated WITH CHECK (true);
        DROP POLICY IF EXISTS "Allow authenticated to update topics" ON topics;
        CREATE POLICY "Allow authenticated to update topics" ON topics FOR UPDATE TO authenticated USING (true);
    END IF;
END $$;

-- 3. Double check study_sessions
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'study_sessions') THEN
        ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow owner to manage study_sessions" ON study_sessions;
        CREATE POLICY "Allow owner to manage study_sessions" ON study_sessions 
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Ensure curriculum_offers matches the new account requirements
ALTER TABLE curriculum_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "curriculum_offers_select" ON curriculum_offers;
CREATE POLICY "curriculum_offers_select" ON curriculum_offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "curriculum_offers_insert" ON curriculum_offers;
CREATE POLICY "curriculum_offers_insert" ON curriculum_offers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "curriculum_offers_update" ON curriculum_offers;
CREATE POLICY "curriculum_offers_update" ON curriculum_offers FOR UPDATE TO authenticated USING (true);
