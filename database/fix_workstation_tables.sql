-- 1. Create study_vault for LangChain chunks
CREATE TABLE IF NOT EXISTS study_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for study_vault
ALTER TABLE study_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own study_vault" ON study_vault;
CREATE POLICY "Allow users to read their own study_vault" ON study_vault
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own study_vault" ON study_vault;
CREATE POLICY "Allow users to insert their own study_vault" ON study_vault
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Ensure user_notes table exists and has proper RLS
CREATE TABLE IF NOT EXISTS user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_type TEXT DEFAULT 'ai',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_notes
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to manage their own notes" ON user_notes;
CREATE POLICY "Allow users to manage their own notes" ON user_notes
    FOR ALL USING (auth.uid() = user_id);

-- 3. Add search index to study_vault content for full-text search
CREATE INDEX IF NOT EXISTS study_vault_content_idx ON study_vault USING GIN (to_tsvector('english', content));
