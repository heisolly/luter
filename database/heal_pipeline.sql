/* 
  HEAL & SYNC - Luter Material Analysis & Flashcard Bundles
  Run this script in your Supabase SQL Editor to resolve:
  - 400 Bad Request (Missing Column) errors
  - user_id Not-Null constraint violations
  - Flashcard sharing table setup
*/

-- 1. Ensure material_analysis has all modern columns
DO $$ 
BEGIN 
    -- Add user_id if missing
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'material_analysis' AND COLUMN_NAME = 'user_id') THEN
        ALTER TABLE material_analysis ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add summary if missing
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'material_analysis' AND COLUMN_NAME = 'summary') THEN
        ALTER TABLE material_analysis ADD COLUMN summary TEXT;
    END IF;

    -- Add smart_notes if missing
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'material_analysis' AND COLUMN_NAME = 'smart_notes') THEN
        ALTER TABLE material_analysis ADD COLUMN smart_notes TEXT;
    END IF;

    -- Add flashcards if missing
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'material_analysis' AND COLUMN_NAME = 'flashcards') THEN
        ALTER TABLE material_analysis ADD COLUMN flashcards JSONB;
    END IF;

    -- Add quiz if missing
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'material_analysis' AND COLUMN_NAME = 'quiz') THEN
        ALTER TABLE material_analysis ADD COLUMN quiz JSONB;
    END IF;

    -- Ensure material_id is UNIQUE for the upsert/on_conflict to work
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'material_analysis_material_id_key' 
        OR (contype = 'u' AND conrelid = 'material_analysis'::regclass)
    ) THEN
        ALTER TABLE material_analysis DROP CONSTRAINT IF EXISTS material_analysis_material_id_key;
        ALTER TABLE material_analysis ADD CONSTRAINT material_analysis_material_id_key UNIQUE (material_id);
    END IF;

    -- Add deleted_at to materials for soft delete
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'materials' AND COLUMN_NAME = 'deleted_at') THEN
        ALTER TABLE materials ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add deleted_at to user_notes for soft delete
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_notes' AND COLUMN_NAME = 'deleted_at') THEN
        ALTER TABLE user_notes ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Flashcard Bundles Table (For Public Sharing)
CREATE TABLE IF NOT EXISTS flashcard_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    cards JSONB NOT NULL,
    shared_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Function to increment share count
CREATE OR REPLACE FUNCTION increment_bundle_share(bundle_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE flashcard_bundles
  SET shared_count = shared_count + 1
  WHERE id = bundle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Set up Security Policies
-- Allow anyone to VIEW bundles (for public sharing)
DROP POLICY IF EXISTS "Public can view flashcard bundles" ON flashcard_bundles;
CREATE POLICY "Public can view flashcard bundles" ON flashcard_bundles FOR SELECT USING (true);

-- Allow users to manage their own bundles
DROP POLICY IF EXISTS "Users can manage their own bundles" ON flashcard_bundles;
CREATE POLICY "Users can manage their own bundles" ON flashcard_bundles FOR ALL USING (auth.uid() = user_id);

-- Analysis Policies
DROP POLICY IF EXISTS "Users can manage analysis for their own materials" ON material_analysis;
CREATE POLICY "Users can manage analysis for their own materials"
ON material_analysis FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM materials 
    WHERE materials.id = material_analysis.material_id 
    AND materials.user_id = auth.uid()
  )
);
