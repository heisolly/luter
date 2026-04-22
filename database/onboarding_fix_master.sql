-- =====================================================
-- MASTER ONBOARDING & DASHBOARD SETUP
-- =====================================================
-- Run this script in your Supabase SQL Editor to fix 
-- schema inconsistencies between code and database.

-- 1. FIX PROFILES TABLE
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS semester TEXT,
ADD COLUMN IF NOT EXISTS faculty TEXT,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS referral_code_used TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. FIX COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    faculty TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_code_key') THEN
        ALTER TABLE courses ADD CONSTRAINT courses_code_key UNIQUE (code);
    END IF;
END $$;

-- 3. FIX USER_COURSES TABLE
CREATE TABLE IF NOT EXISTS user_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    target_score INTEGER DEFAULT 75,
    custom_name TEXT,
    is_archived BOOLEAN DEFAULT false,
    semester TEXT DEFAULT '1st',
    last_studied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS target_score INTEGER DEFAULT 75;
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS last_studied_at TIMESTAMPTZ;
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS custom_name TEXT;
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT '1st';

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_courses_user_id_course_id_key') THEN
        ALTER TABLE user_courses ADD CONSTRAINT user_courses_user_id_course_id_key UNIQUE (user_id, course_id);
    END IF;
END $$;

-- 4. FIX CURRICULUM_OFFERS TABLE
CREATE TABLE IF NOT EXISTS curriculum_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syllabus_id TEXT UNIQUE NOT NULL,
    university_slug TEXT NOT NULL,
    university_name TEXT NOT NULL,
    faculty TEXT,
    department_slug TEXT NOT NULL,
    department_label TEXT NOT NULL,
    level TEXT NOT NULL,
    semester TEXT NOT NULL,
    courses JSONB DEFAULT '[]',
    source TEXT,
    status TEXT DEFAULT 'draft',
    contributor_id UUID,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(university_slug, department_slug, level, semester)
);

-- 5. FIX USER_STATS TABLE
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    lives INTEGER DEFAULT 3,
    badges JSONB DEFAULT '[]',
    ai_credits_monthly INTEGER DEFAULT 50,
    ai_credits_used INTEGER DEFAULT 0,
    arena_battles_monthly INTEGER DEFAULT 20,
    arena_battles_used INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 7. SETUP POLICIES
-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Courses
DROP POLICY IF EXISTS "Allow read access to all courses" ON courses;
CREATE POLICY "Allow read access to all courses" ON courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated to insert courses" ON courses;
CREATE POLICY "Allow authenticated to insert courses" ON courses FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated to update courses" ON courses;
CREATE POLICY "Allow authenticated to update courses" ON courses FOR UPDATE TO authenticated USING (true);

-- User Courses
DROP POLICY IF EXISTS "user_courses_select" ON user_courses;
CREATE POLICY "user_courses_select" ON user_courses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_courses_insert" ON user_courses;
CREATE POLICY "user_courses_insert" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_courses_update" ON user_courses;
CREATE POLICY "user_courses_update" ON user_courses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_courses_delete" ON user_courses;
CREATE POLICY "user_courses_delete" ON user_courses FOR DELETE USING (auth.uid() = user_id);

-- Curriculum Offers
DROP POLICY IF EXISTS "curriculum_offers_select" ON curriculum_offers;
CREATE POLICY "curriculum_offers_select" ON curriculum_offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "curriculum_offers_insert" ON curriculum_offers;
CREATE POLICY "curriculum_offers_insert" ON curriculum_offers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "curriculum_offers_update" ON curriculum_offers;
CREATE POLICY "curriculum_offers_update" ON curriculum_offers FOR UPDATE TO authenticated USING (true);

-- User Stats
DROP POLICY IF EXISTS "user_stats_select" ON user_stats;
CREATE POLICY "user_stats_select" ON user_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_stats_update" ON user_stats;
CREATE POLICY "user_stats_update" ON user_stats FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_stats_insert" ON user_stats;
CREATE POLICY "user_stats_insert" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
