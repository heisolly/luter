-- =====================================================
-- LUTER PRODUCTION-GRADE RENDERING PIPELINE
-- Adds columns for high-fidelity conversion tracking
-- =====================================================

-- 1. ADD CONVERSION METADATA TO MATERIALS TABLE
ALTER TABLE materials
ADD COLUMN IF NOT EXISTS converted_url TEXT,
ADD COLUMN IF NOT EXISTS converted_type TEXT CHECK (converted_type IN ('pdf', 'images', 'html')),
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS slide_images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS render_quality TEXT DEFAULT 'native' CHECK (render_quality IN ('native', 'high_fidelity', 'fallback_text')),
ADD COLUMN IF NOT EXISTS extraction_source TEXT DEFAULT 'client' CHECK (extraction_source IN ('client', 'server', 'hybrid'));

-- 2. CREATE CONVERSION JOBS TABLE (for async processing queue)
CREATE TABLE IF NOT EXISTS conversion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    output_urls JSONB DEFAULT '{}',
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_materials_converted_url ON materials(converted_url) WHERE converted_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materials_render_quality ON materials(render_quality);
CREATE INDEX IF NOT EXISTS idx_conversion_jobs_status ON conversion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_conversion_jobs_material ON conversion_jobs(material_id);
CREATE INDEX IF NOT EXISTS idx_conversion_jobs_user ON conversion_jobs(user_id, status) WHERE status = 'pending';

-- 4. FUNCTION TO AUTO-UPDATE CONVERSION JOB STATUS
CREATE OR REPLACE FUNCTION update_conversion_job()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.converted_url IS NOT NULL AND OLD.converted_url IS NULL THEN
        UPDATE conversion_jobs
        SET status = 'completed',
            output_urls = jsonb_build_object(
                'converted_url', NEW.converted_url,
                'slide_images', COALESCE(NEW.slide_images, '[]'::jsonb)
            ),
            completed_at = NOW(),
            updated_at = NOW()
        WHERE material_id = NEW.id AND status = 'processing';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_material_conversion_update ON materials;
CREATE TRIGGER trg_material_conversion_update
    AFTER UPDATE ON materials
    FOR EACH ROW
    WHEN (NEW.converted_url IS DISTINCT FROM OLD.converted_url)
    EXECUTE FUNCTION update_conversion_job();

-- 5. BACKFILL EXISTING MATERIALS
UPDATE materials
SET render_quality = 'native'
WHERE render_quality IS NULL;

-- 6. ENABLE RLS ON CONVERSION JOBS (users see only their own)
ALTER TABLE conversion_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversion jobs" ON conversion_jobs;
CREATE POLICY "Users can view their own conversion jobs"
    ON conversion_jobs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own conversion jobs" ON conversion_jobs;
CREATE POLICY "Users can insert their own conversion jobs"
    ON conversion_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 7. ROW LEVEL SECURITY FOR MATERIALS CONVERTED URL ACCESS
-- (converted_url is public by design so shared materials render for everyone)
-- But only owners can update conversion metadata
DROP POLICY IF EXISTS "Only owners can update conversion metadata" ON materials;
CREATE POLICY "Only owners can update conversion metadata"
    ON materials FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
