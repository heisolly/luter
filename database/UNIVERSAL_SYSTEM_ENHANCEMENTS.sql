-- =====================================================
-- LUTER UNIVERSAL SYSTEM ENHANCEMENTS
-- Smart Onboarding, Floating Dock & Multi-Source Content Engine
-- =====================================================

-- =====================================================
-- 1. ENHANCE PROFILES TABLE FOR UNIVERSAL ROUTING
-- =====================================================

-- Add universal routing fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS education_level TEXT CHECK (education_level IN ('Primary', 'Secondary', 'Tertiary', 'Professional')),
ADD COLUMN IF NOT EXISTS user_role TEXT CHECK (user_role IN ('student', 'teacher', 'solo_learner')),
ADD COLUMN IF NOT EXISTS institution_id TEXT,
ADD COLUMN IF NOT EXISTS is_instructor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS grade_level TEXT, -- For K-12 (e.g., "Grade 10")
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Nigeria',
ADD COLUMN IF NOT EXISTS curriculum_type TEXT, -- e.g., "British", "American", "Nigerian"
ADD COLUMN IF NOT EXISTS interests TEXT[], -- For solo learners
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

-- =====================================================
-- 2. CREATE FLOATING DOCK SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS deck_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_name TEXT,
    items JSONB DEFAULT '[]', -- Array of {id, title, type, url, thumbnail}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE MASTER CURRICULUM TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS master_curriculum (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    education_level TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    grade_level TEXT, -- For K-12
    university TEXT, -- For Tertiary
    department TEXT, -- For Tertiary
    course_code TEXT, -- For Tertiary
    curriculum_structure JSONB NOT NULL, -- {weeks: [], chapters: [], topics: []}
    source_type TEXT CHECK (source_type IN ('admin', 'ai_generated', 'scraped')) DEFAULT 'admin',
    country TEXT DEFAULT 'Nigeria',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    
    UNIQUE(education_level, subject_name, grade_level, university, department, course_code)
);

-- =====================================================
-- 4. CREATE CLASSROOM DISTRIBUTION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS classroom_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    material_title TEXT NOT NULL,
    material_type TEXT CHECK (material_type IN ('pdf', 'video', 'note', 'assignment', 'link')) NOT NULL,
    material_url TEXT,
    material_content TEXT, -- For text content
    file_metadata JSONB, -- File info, size, type, etc.
    is_distributed BOOLEAN DEFAULT FALSE,
    distribution_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. CREATE WORKSPACE CONTENT ENHANCEMENTS
-- =====================================================

-- Add content aggregation to workspace_content
ALTER TABLE workspace_content 
ADD COLUMN IF NOT EXISTS content_source TEXT CHECK (content_source IN ('user_upload', 'teacher_distributed', 'scraped', 'ai_generated')),
ADD COLUMN IF NOT EXISTS deck_session_id UUID REFERENCES deck_sessions(id),
ADD COLUMN IF NOT EXISTS is_in_dock BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dock_position INTEGER; -- Order in floating dock

-- =====================================================
-- 6. CREATE AI ROADMAP GENERATION CONFIG
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_roadmap_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    education_level TEXT NOT NULL,
    template_type TEXT CHECK (template_type IN ('k12_chapters', 'tertiary_weeks', 'professional_modules')) NOT NULL,
    base_prompt TEXT NOT NULL,
    expected_structure JSONB NOT NULL, -- Expected JSON structure
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default AI roadmap configs
INSERT INTO ai_roadmap_configs (education_level, template_type, base_prompt, expected_structure) VALUES
('Primary', 'k12_chapters', 
 'Generate a 10-chapter curriculum structure for {subject} at Grade {grade}. Return JSON with chapters array containing chapter_number, title, topics, and estimated_hours.',
 '{"chapters": [{"chapter_number": 1, "title": "string", "topics": ["string"], "estimated_hours": 2}]}'),

('Secondary', 'k12_chapters', 
 'Generate a 12-chapter curriculum structure for {subject} at Grade {grade}. Return JSON with chapters array containing chapter_number, title, topics, and estimated_hours.',
 '{"chapters": [{"chapter_number": 1, "title": "string", "topics": ["string"], "estimated_hours": 3}]}'),

('Tertiary', 'tertiary_weeks', 
 'Generate a 16-week academic syllabus for {course_code} {course_name} at {university}. Return JSON with weeks array containing week_number, title, topics, readings, and assignments.',
 '{"weeks": [{"week_number": 1, "title": "string", "topics": ["string"], "readings": ["string"], "assignments": ["string"]}]}'),

('Professional', 'professional_modules', 
 'Generate a modular learning structure for {subject} professional development. Return JSON with modules array containing module_number, title, topics, duration_days, and practical_projects.',
 '{"modules": [{"module_number": 1, "title": "string", "topics": ["string"], "duration_days": 7, "practical_projects": ["string"]}]}');

-- =====================================================
-- 7. CREATE STORED PROCEDURES FOR SMART ONBOARDING
-- =====================================================

-- Function to get or create curriculum from master table
CREATE OR REPLACE FUNCTION get_or_create_curriculum(
    p_education_level TEXT,
    p_subject_name TEXT,
    p_grade_level TEXT DEFAULT NULL,
    p_university TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_course_code TEXT DEFAULT NULL,
    p_country TEXT DEFAULT 'Nigeria'
) RETURNS UUID AS $$
DECLARE
    curriculum_id UUID;
    ai_config RECORD;
BEGIN
    -- Try to find existing curriculum
    SELECT id INTO curriculum_id FROM master_curriculum 
    WHERE education_level = p_education_level 
      AND subject_name = p_subject_name 
      AND (grade_level = p_grade_level OR (grade_level IS NULL AND p_grade_level IS NULL))
      AND (university = p_university OR (university IS NULL AND p_university IS NULL))
      AND (department = p_department OR (department IS NULL AND p_department IS NULL))
      AND (course_code = p_course_code OR (course_code IS NULL AND p_course_code IS NULL))
      AND is_active = TRUE;
    
    IF curriculum_id IS NOT NULL THEN
        RETURN curriculum_id;
    END IF;
    
    -- Get AI config for this education level
    SELECT * INTO ai_config FROM ai_roadmap_configs 
    WHERE education_level = p_education_level AND is_active = TRUE;
    
    IF ai_config.id IS NULL THEN
        RAISE EXCEPTION 'No AI configuration found for education level: %', p_education_level;
    END IF;
    
    -- Create placeholder curriculum (AI generation will happen asynchronously)
    INSERT INTO master_curriculum (
        education_level, subject_name, grade_level, university, department, course_code,
        curriculum_structure, source_type, country
    ) VALUES (
        p_education_level, p_subject_name, p_grade_level, p_university, p_department, p_course_code,
        '{"status": "generating"}'::JSONB, 'ai_generated', p_country
    ) RETURNING id INTO curriculum_id;
    
    RETURN curriculum_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-populate user workspaces based on curriculum
CREATE OR REPLACE FUNCTION populate_user_workspaces(
    p_user_id UUID,
    p_curriculum_id UUID
) RETURNS VOID AS $$
DECLARE
    curriculum RECORD;
    workspace_id UUID;
    content_item JSONB;
    counter INTEGER;
BEGIN
    -- Get curriculum details
    SELECT * INTO curriculum FROM master_curriculum WHERE id = p_curriculum_id;
    
    IF curriculum.id IS NULL THEN
        RAISE EXCEPTION 'Curriculum not found: %', p_curriculum_id;
    END IF;
    
    -- Create main workspace for this subject
    INSERT INTO workspaces (
        user_id, name, type, education_level, subject, metadata
    ) VALUES (
        p_user_id, 
        curriculum.subject_name,
        'personal',
        curriculum.education_level,
        curriculum.subject_name,
        jsonb_build_object('curriculum_id', curriculum.id, 'auto_generated', TRUE)
    ) RETURNING id INTO workspace_id;
    
    -- Create workspace content based on curriculum structure
    counter := 1;
    
    IF curriculum.education_level IN ('Primary', 'Secondary') THEN
        -- K-12: Create chapters
        FOR content_item IN SELECT * FROM jsonb_array_elements(curriculum.curriculum_structure->'chapters')
        LOOP
            INSERT INTO workspace_content (
                workspace_id, title, content_type, content, order_index, content_source
            ) VALUES (
                workspace_id,
                content_item->>'title',
                'chapter',
                jsonb_build_object(
                    'chapter_number', content_item->>'chapter_number',
                    'topics', content_item->'topics',
                    'estimated_hours', content_item->>'estimated_hours'
                ),
                counter,
                'ai_generated'
            );
            counter := counter + 1;
        END LOOP;
        
    ELSIF curriculum.education_level = 'Tertiary' THEN
        -- University: Create weeks
        FOR content_item IN SELECT * FROM jsonb_array_elements(curriculum.curriculum_structure->'weeks')
        LOOP
            INSERT INTO workspace_content (
                workspace_id, title, content_type, content, order_index, content_source
            ) VALUES (
                workspace_id,
                content_item->>'title',
                'week',
                jsonb_build_object(
                    'week_number', content_item->>'week_number',
                    'topics', content_item->'topics',
                    'readings', content_item->'readings',
                    'assignments', content_item->'assignments'
                ),
                counter,
                'ai_generated'
            );
            counter := counter + 1;
        END LOOP;
        
    ELSIF curriculum.education_level = 'Professional' THEN
        -- Professional: Create modules
        FOR content_item IN SELECT * FROM jsonb_array_elements(curriculum.curriculum_structure->'modules')
        LOOP
            INSERT INTO workspace_content (
                workspace_id, title, content_type, content, order_index, content_source
            ) VALUES (
                workspace_id,
                content_item->>'title',
                'module',
                jsonb_build_object(
                    'module_number', content_item->>'module_number',
                    'topics', content_item->'topics',
                    'duration_days', content_item->>'duration_days',
                    'practical_projects', content_item->'practical_projects'
                ),
                counter,
                'ai_generated'
            );
            counter := counter + 1;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. ENABLE RLS AND CREATE POLICIES
-- =====================================================

ALTER TABLE deck_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_roadmap_configs ENABLE ROW LEVEL SECURITY;

-- Deck Sessions policies
DROP POLICY IF EXISTS "Users can manage own deck sessions" ON deck_sessions;
CREATE POLICY "Users can manage own deck sessions" ON deck_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Master Curriculum policies
DROP POLICY IF EXISTS "Users can view master curriculum" ON master_curriculum;
CREATE POLICY "Users can view master curriculum" ON master_curriculum
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage master curriculum" ON master_curriculum;
CREATE POLICY "Admins can manage master curriculum" ON master_curriculum
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Classroom Materials policies
DROP POLICY IF EXISTS "Teachers can manage own classroom materials" ON classroom_materials;
CREATE POLICY "Teachers can manage own classroom materials" ON classroom_materials
    FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Students can view classroom materials" ON classroom_materials;
CREATE POLICY "Students can view classroom materials" ON classroom_materials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM classroom_enrollments ce 
            WHERE ce.classroom_id = classroom_materials.classroom_id 
            AND ce.student_id = auth.uid() 
            AND ce.is_active = TRUE
        )
    );

-- AI Roadmap Configs policies
DROP POLICY IF EXISTS "Admins can manage AI configs" ON ai_roadmap_configs;
CREATE POLICY "Admins can manage AI configs" ON ai_roadmap_configs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- =====================================================
-- 9. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_education_level ON profiles(education_level);
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_institution ON profiles(institution_id);

CREATE INDEX IF NOT EXISTS idx_deck_sessions_user_active ON deck_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_deck_sessions_last_accessed ON deck_sessions(last_accessed DESC);

CREATE INDEX IF NOT EXISTS idx_master_curriculum_lookup ON master_curriculum(education_level, subject_name, grade_level, university, department, course_code);
CREATE INDEX IF NOT EXISTS idx_master_curriculum_active ON master_curriculum(is_active, education_level);

CREATE INDEX IF NOT EXISTS idx_classroom_materials_classroom ON classroom_materials(classroom_id, is_distributed);
CREATE INDEX IF NOT EXISTS idx_classroom_materials_teacher ON classroom_materials(teacher_id, distribution_date DESC);

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions for new functions
GRANT EXECUTE ON FUNCTION get_or_create_curriculum TO authenticated;
GRANT EXECUTE ON FUNCTION populate_user_workspaces TO authenticated;

-- Enable security definer for functions
ALTER FUNCTION get_or_create_curriculum SECURITY DEFINER;
ALTER FUNCTION populate_user_workspaces SECURITY DEFINER;

-- Reset search path for security
ALTER FUNCTION get_or_create_curriculum RESET SEARCH_PATH;
ALTER FUNCTION populate_user_workspaces RESET SEARCH_PATH;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Universal System Enhancements are now installed!
-- Key features enabled:
-- ✅ Smart onboarding with persona selection
-- ✅ Floating dock sessions for cross-device persistence
-- ✅ Master curriculum table for AI-generated content
-- ✅ Teacher distribution system
-- ✅ Multi-source content aggregation
-- ✅ Auto-population of workspaces based on curriculum
-- ✅ Enhanced RLS policies for all new tables

-- The system is ready for the enhanced frontend components!
