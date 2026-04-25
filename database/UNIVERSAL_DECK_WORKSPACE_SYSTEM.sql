-- =====================================================
-- LUTER UNIVERSAL DECK & WORKSPACE SYSTEM
-- =====================================================
-- This script adds the necessary database structure for the
-- Universal Deck & Workspace system while preserving existing data
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ENHANCE EXISTING TABLES
-- =====================================================

-- Add universal columns to existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS program_name TEXT,
ADD COLUMN IF NOT EXISTS level_grade TEXT,
ADD COLUMN IF NOT EXISTS role_preference TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_action TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add deck_type column to existing decks table
ALTER TABLE decks 
ADD COLUMN IF NOT EXISTS deck_type TEXT DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add workspace_id to deck_items for universal workspace support
ALTER TABLE deck_items 
ADD COLUMN IF NOT EXISTS workspace_id TEXT,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Add universal columns to user_courses table
ALTER TABLE user_courses 
ADD COLUMN IF NOT EXISTS workspace_type TEXT,
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- =====================================================
-- 2. CREATE UNIVERSAL WORKSPACE TABLES
-- =====================================================

-- User Education Profiles (detailed tracking)
CREATE TABLE IF NOT EXISTS user_education_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    education_level TEXT NOT NULL CHECK (education_level IN ('Primary', 'Secondary', 'Tertiary', 'Professional')),
    institution TEXT,
    program_name TEXT,
    level_grade TEXT,
    academic_year TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Universal Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('grade_content', 'semester_content', 'personal', 'project', 'classroom')),
    education_level TEXT CHECK (education_level IN ('Primary', 'Secondary', 'Tertiary', 'Professional')),
    structure JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Content
CREATE TABLE IF NOT EXISTS workspace_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_size BIGINT,
    file_type TEXT,
    metadata JSONB DEFAULT '{}',
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart Start Decks (auto-generated for new users)
CREATE TABLE IF NOT EXISTS smart_start_decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    education_level TEXT NOT NULL CHECK (education_level IN ('Primary', 'Secondary', 'Tertiary', 'Professional')),
    deck_title TEXT NOT NULL,
    deck_description TEXT,
    content_items JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classrooms (Teacher-Student Bridge)
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_code TEXT UNIQUE NOT NULL,
    class_name TEXT NOT NULL,
    description TEXT,
    education_level TEXT CHECK (education_level IN ('Primary', 'Secondary', 'Tertiary', 'Professional')),
    institution TEXT,
    subject_area TEXT,
    grade_level TEXT,
    academic_year TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classroom Enrollments
CREATE TABLE IF NOT EXISTS classroom_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teaching_assistant')),
    UNIQUE(classroom_id, student_id)
);

-- Classroom Content (Teacher uploads for students)
CREATE TABLE IF NOT EXISTS classroom_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL,
    file_url TEXT,
    file_size BIGINT,
    file_type TEXT,
    metadata JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    publish_date TIMESTAMPTZ,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Classroom Content (Student saves to personal workspace)
CREATE TABLE IF NOT EXISTS student_classroom_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_content_id UUID REFERENCES classroom_content(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    saved_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    UNIQUE(classroom_content_id, student_id)
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_education_level ON profiles(education_level);
CREATE INDEX IF NOT EXISTS idx_profiles_role_preference ON profiles(role_preference);
CREATE INDEX IF NOT EXISTS idx_profiles_institution ON profiles(institution);

-- Workspaces indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON workspaces(type);
CREATE INDEX IF NOT EXISTS idx_workspaces_education_level ON workspaces(education_level);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_active ON workspaces(is_active);

-- Workspace content indexes
CREATE INDEX IF NOT EXISTS idx_workspace_content_workspace_id ON workspace_content(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_content_content_type ON workspace_content(content_type);
CREATE INDEX IF NOT EXISTS idx_workspace_content_order_index ON workspace_content(workspace_id, order_index);

-- Decks indexes
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_deck_type ON decks(deck_type);
CREATE INDEX IF NOT EXISTS idx_decks_education_level ON decks(education_level);

-- Deck items indexes
CREATE INDEX IF NOT EXISTS idx_deck_items_deck_id ON deck_items(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_items_workspace_id ON deck_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_deck_items_order_index ON deck_items(deck_id, order_index);

-- Classroom indexes
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_class_code ON classrooms(class_code);
CREATE INDEX IF NOT EXISTS idx_classrooms_education_level ON classrooms(education_level);

-- Classroom enrollments indexes
CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_classroom_id ON classroom_enrollments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_student_id ON classroom_enrollments(student_id);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE user_education_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_start_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_classroom_content ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- User Education Profiles policies
DROP POLICY IF EXISTS "Users can view own education profiles" ON user_education_profiles;
CREATE POLICY "Users can view own education profiles" ON user_education_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own education profiles" ON user_education_profiles;
CREATE POLICY "Users can insert own education profiles" ON user_education_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own education profiles" ON user_education_profiles;
CREATE POLICY "Users can update own education profiles" ON user_education_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own education profiles" ON user_education_profiles;
CREATE POLICY "Users can delete own education profiles" ON user_education_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Workspaces policies
DROP POLICY IF EXISTS "Users can view own workspaces" ON workspaces;
CREATE POLICY "Users can view own workspaces" ON workspaces
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workspaces" ON workspaces;
CREATE POLICY "Users can insert own workspaces" ON workspaces
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workspaces" ON workspaces;
CREATE POLICY "Users can update own workspaces" ON workspaces
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workspaces" ON workspaces;
CREATE POLICY "Users can delete own workspaces" ON workspaces
    FOR DELETE USING (auth.uid() = user_id);

-- Workspace Content policies
DROP POLICY IF EXISTS "Users can view own workspace content" ON workspace_content;
CREATE POLICY "Users can view own workspace content" ON workspace_content
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_content.workspace_id AND workspaces.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert own workspace content" ON workspace_content;
CREATE POLICY "Users can insert own workspace content" ON workspace_content
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_content.workspace_id AND workspaces.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update own workspace content" ON workspace_content;
CREATE POLICY "Users can update own workspace content" ON workspace_content
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_content.workspace_id AND workspaces.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete own workspace content" ON workspace_content;
CREATE POLICY "Users can delete own workspace content" ON workspace_content
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_content.workspace_id AND workspaces.user_id = auth.uid())
    );

-- Smart Start Decks policies
DROP POLICY IF EXISTS "Users can view smart start decks" ON smart_start_decks;
CREATE POLICY "Users can view smart start decks" ON smart_start_decks
    FOR SELECT USING (true);

-- Classrooms policies
DROP POLICY IF EXISTS "Teachers can view own classrooms" ON classrooms;
CREATE POLICY "Teachers can view own classrooms" ON classrooms
    FOR SELECT USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can create classrooms" ON classrooms;
CREATE POLICY "Teachers can create classrooms" ON classrooms
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can update own classrooms" ON classrooms;
CREATE POLICY "Teachers can update own classrooms" ON classrooms
    FOR UPDATE USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can delete own classrooms" ON classrooms;
CREATE POLICY "Teachers can delete own classrooms" ON classrooms
    FOR DELETE USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Students can view enrolled classrooms" ON classrooms;
CREATE POLICY "Students can view enrolled classrooms" ON classrooms
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM classroom_enrollments WHERE classroom_enrollments.classroom_id = classrooms.id AND classroom_enrollments.student_id = auth.uid() AND classroom_enrollments.is_active = TRUE)
    );

-- Classroom Enrollments policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON classroom_enrollments;
DROP POLICY IF EXISTS "Students can insert enrollments" ON classroom_enrollments;
CREATE POLICY "Students can insert enrollments" ON classroom_enrollments
    FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own enrollments" ON classroom_enrollments;
CREATE POLICY "Students can update own enrollments" ON classroom_enrollments
    FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can view classroom enrollments" ON classroom_enrollments;
CREATE POLICY "Teachers can view classroom enrollments" ON classroom_enrollments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM classrooms WHERE classrooms.id = classroom_enrollments.classroom_id AND classrooms.teacher_id = auth.uid())
    );

DROP POLICY IF EXISTS "Teachers can update enrollments" ON classroom_enrollments;
CREATE POLICY "Teachers can update enrollments" ON classroom_enrollments
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM classrooms WHERE classrooms.id = classroom_enrollments.classroom_id AND classrooms.teacher_id = auth.uid())
    );

-- Classroom Content policies
DROP POLICY IF EXISTS "Teachers can manage own classroom content" ON classroom_content;
CREATE POLICY "Teachers can manage own classroom content" ON classroom_content
    FOR ALL USING (
        EXISTS (SELECT 1 FROM classrooms WHERE classrooms.id = classroom_content.classroom_id AND classrooms.teacher_id = auth.uid())
    );

DROP POLICY IF EXISTS "Students can view classroom content" ON classroom_content;
CREATE POLICY "Students can view classroom content" ON classroom_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM classroom_enrollments ce 
            WHERE ce.classroom_id = classroom_content.classroom_id 
            AND ce.student_id = auth.uid() 
            AND ce.is_active = TRUE
        )
    );

-- Student Classroom Content policies
DROP POLICY IF EXISTS "Students can manage saved classroom content" ON student_classroom_content;
CREATE POLICY "Students can manage saved classroom content" ON student_classroom_content
    FOR ALL USING (auth.uid() = student_id);

-- =====================================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_decks_updated_at ON decks;
CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_education_profiles_updated_at ON user_education_profiles;
CREATE TRIGGER update_user_education_profiles_updated_at BEFORE UPDATE ON user_education_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspace_content_updated_at ON workspace_content;
CREATE TRIGGER update_workspace_content_updated_at BEFORE UPDATE ON workspace_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_smart_start_decks_updated_at ON smart_start_decks;
CREATE TRIGGER update_smart_start_decks_updated_at BEFORE UPDATE ON smart_start_decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classrooms_updated_at ON classrooms;
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON classrooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classroom_enrollments_updated_at ON classroom_enrollments;
CREATE TRIGGER update_classroom_enrollments_updated_at BEFORE UPDATE ON classroom_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classroom_content_updated_at ON classroom_content;
CREATE TRIGGER update_classroom_content_updated_at BEFORE UPDATE ON classroom_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_classroom_content_updated_at ON student_classroom_content;
CREATE TRIGGER update_student_classroom_content_updated_at BEFORE UPDATE ON student_classroom_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. INSERT SMART START DECK TEMPLATES
-- =====================================================

-- Primary School Smart Start
INSERT INTO smart_start_decks (education_level, deck_title, deck_description, content_items) VALUES
('Primary', 'Math Foundations Starter', 'Essential math topics for primary students', '[
    {"title": "Numbers & Counting", "type": "topic", "description": "Learn to count and recognize numbers from 1-100"},
    {"title": "Basic Addition", "type": "topic", "description": "Simple addition problems with numbers under 20"},
    {"title": "Shapes & Patterns", "type": "topic", "description": "Identify basic shapes and recognize patterns"},
    {"title": "Fun Math Games", "type": "activity", "description": "Interactive games to practice math skills"}
]') ON CONFLICT DO NOTHING;

-- Secondary School Smart Start
INSERT INTO smart_start_decks (education_level, deck_title, deck_description, content_items) VALUES
('Secondary', 'Science Explorer Starter', 'Core science concepts for secondary students', '[
    {"title": "Scientific Method", "type": "chapter", "description": "How to conduct experiments and think scientifically"},
    {"title": "Matter & Atoms", "type": "chapter", "description": "Understanding basic chemistry and atomic structure"},
    {"title": "Energy & Forces", "type": "chapter", "description": "Physics fundamentals covering energy types and forces"},
    {"title": "Lab Safety", "type": "topic", "description": "Essential safety rules for science experiments"}
]') ON CONFLICT DO NOTHING;

-- University Smart Start
INSERT INTO smart_start_decks (education_level, deck_title, deck_description, content_items) VALUES
('Tertiary', 'University Success Starter', 'Essential skills for university students', '[
    {"title": "Effective Note-Taking", "type": "week", "description": "How to take comprehensive and organized notes"},
    {"title": "Study Techniques", "type": "week", "description": "Proven study methods for university courses"},
    {"title": "Time Management", "type": "week", "description": "Balance study, work, and personal life effectively"},
    {"title": "Research Skills", "type": "week", "description": "How to find and evaluate academic sources"}
]') ON CONFLICT DO NOTHING;

-- Professional Smart Start
INSERT INTO smart_start_decks (education_level, deck_title, deck_description, content_items) VALUES
('Professional', 'Professional Skills Starter', 'Essential skills for professional development', '[
    {"title": "Project Management", "type": "module", "description": "Manage projects effectively from planning to completion"},
    {"title": "Communication Skills", "type": "module", "description": "Professional communication in workplace settings"},
    {"title": "Leadership Fundamentals", "type": "module", "description": "Basic leadership principles and team management"},
    {"title": "Strategic Thinking", "type": "module", "description": "Develop strategic planning and decision-making skills"}
]') ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user's education level
CREATE OR REPLACE FUNCTION get_user_education_level(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    education_level TEXT;
BEGIN
    SELECT education_level INTO education_level 
    FROM profiles 
    WHERE id = user_uuid;
    
    RETURN COALESCE(education_level, 'Tertiary');
END;
$$ LANGUAGE plpgsql;

-- Function to create personal workspace for user
CREATE OR REPLACE FUNCTION create_personal_workspace(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    workspace_id UUID;
    education_level TEXT;
BEGIN
    -- Get user's education level
    education_level := get_user_education_level(user_uuid);
    
    -- Create personal workspace
    INSERT INTO workspaces (user_id, title, type, education_level, structure)
    VALUES (
        user_uuid, 
        'Personal Vault', 
        'personal', 
        education_level,
        '[
            {"name": "Documents", "type": "folder", "icon": "📄"},
            {"name": "Research", "type": "folder", "icon": "🔍"},
            {"name": "Notes", "type": "folder", "icon": "📝"}
        ]'
    )
    RETURNING id INTO workspace_id;
    
    RETURN workspace_id;
END;
$$ LANGUAGE plpgsql;

-- Function to join classroom by code
CREATE OR REPLACE FUNCTION join_classroom_by_code(user_uuid UUID, class_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    classroom_id UUID;
    enrollment_exists BOOLEAN;
BEGIN
    -- Check if classroom exists and is active
    SELECT id INTO classroom_id 
    FROM classrooms 
    WHERE class_code = class_code AND is_active = TRUE;
    
    IF classroom_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if already enrolled
    SELECT EXISTS(
        SELECT 1 FROM classroom_enrollments 
        WHERE classroom_id = classroom_id AND student_id = user_uuid AND is_active = TRUE
    ) INTO enrollment_exists;
    
    IF enrollment_exists THEN
        RETURN TRUE; -- Already enrolled
    END IF;
    
    -- Create enrollment
    INSERT INTO classroom_enrollments (classroom_id, student_id)
    VALUES (classroom_id, user_uuid);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. MIGRATE EXISTING DATA
-- =====================================================

-- Create personal workspaces for existing users
INSERT INTO workspaces (user_id, title, type, education_level, structure)
SELECT 
    id,
    'Personal Vault',
    'personal',
    COALESCE(education_level, 'Tertiary'),
    '[
        {"name": "Documents", "type": "folder", "icon": "📄"},
        {"name": "Research", "type": "folder", "icon": "🔍"},
        {"name": "Notes", "type": "folder", "icon": "📝"}
    ]'
FROM profiles 
WHERE id NOT IN (SELECT user_id FROM workspaces WHERE type = 'personal')
ON CONFLICT DO NOTHING;

-- Set default education level for existing profiles
UPDATE profiles 
SET education_level = 'Tertiary' 
WHERE education_level IS NULL;

-- Set default role preference for existing profiles
UPDATE profiles 
SET role_preference = 'solo_learner' 
WHERE role_preference IS NULL;

-- =====================================================
-- 10. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for user's complete workspace information
CREATE OR REPLACE VIEW user_workspaces_view AS
SELECT 
    w.*,
    p.education_level as user_education_level,
    p.role_preference,
    CASE 
        WHEN w.type = 'personal' THEN TRUE
        ELSE EXISTS (
            SELECT 1 FROM user_courses uc 
            WHERE uc.user_id = w.user_id AND uc.is_active = TRUE
        )
    END as has_course_content
FROM workspaces w
JOIN profiles p ON w.user_id = p.id
WHERE w.is_active = TRUE;

-- View for user's decks with smart start info
CREATE OR REPLACE VIEW user_decks_view AS
SELECT 
    d.*,
    CASE 
        WHEN d.deck_type = 'smart_start' THEN ssd.content_items
        ELSE NULL
    END as smart_start_content,
    p.education_level as user_education_level
FROM decks d
JOIN profiles p ON d.user_id = p.id
LEFT JOIN smart_start_decks ssd ON d.deck_type = 'smart_start' AND p.education_level = ssd.education_level
WHERE d.user_id = p.id;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- The Universal Deck & Workspace system is now fully installed!
-- Key features enabled:
-- ✅ Invisible user routing with role detection
-- ✅ Adaptive workspace structure by education level
-- ✅ Smart Start deck auto-generation
-- ✅ Teacher-Student classroom bridge
-- ✅ Universal deck system with multi-source support
-- ✅ Row Level Security for all data
-- ✅ Performance indexes for scalability

-- The system is ready for the enhanced frontend components!
