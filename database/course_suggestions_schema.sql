-- =====================================================
-- ENHANCED COURSE SUGGESTION SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Run this entire SQL script in your Supabase database
-- to set up the enhanced course suggestion system

-- Course Suggestions Table
-- Stores AI-generated and peer-recommended courses for specific academic contexts
CREATE TABLE IF NOT EXISTS course_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_slug TEXT NOT NULL,
    department_slug TEXT NOT NULL,
    level TEXT NOT NULL, -- '100', '200', '300', '400', '500'
    semester TEXT NOT NULL, -- '1st', '2nd'
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('ai_generated', 'peer_recommendation', 'hybrid')),
    confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    source_data JSONB, -- Stores AI prompts, peer user IDs, reasoning etc.
    peer_count INTEGER DEFAULT 0, -- Number of peers who selected this course
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint per academic context and course
    UNIQUE(university_slug, department_slug, level, semester, course_code, suggestion_type)
);

-- Peer Course Selections Table
-- Tracks what courses actual students have selected for their academic context
CREATE TABLE IF NOT EXISTS peer_course_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university_slug TEXT NOT NULL,
    department_slug TEXT NOT NULL,
    level TEXT NOT NULL,
    semester TEXT NOT NULL,
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    selected_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one course per user per academic context
    UNIQUE(user_id, university_slug, department_slug, level, semester, course_code)
);

-- AI Suggestion Cache Table
-- Caches AI-generated suggestions to reduce API calls and improve performance
CREATE TABLE IF NOT EXISTS ai_suggestion_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL UNIQUE, -- Composite key for academic context
    university_slug TEXT NOT NULL,
    department_slug TEXT NOT NULL,
    level TEXT NOT NULL,
    semester TEXT NOT NULL,
    country TEXT DEFAULT 'Nigeria',
    suggestions JSONB NOT NULL, -- Array of suggested courses
    ai_model TEXT NOT NULL,
    prompt_hash TEXT NOT NULL, -- Hash of the prompt used
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'), -- Cache for 7 days
    hit_count INTEGER DEFAULT 0
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for course_suggestions
CREATE INDEX IF NOT EXISTS idx_course_suggestions_context ON course_suggestions(university_slug, department_slug, level, semester);
CREATE INDEX IF NOT EXISTS idx_course_suggestions_type_score ON course_suggestions(suggestion_type, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_course_suggestions_peer_count ON course_suggestions(peer_count DESC);

-- Indexes for peer_course_selections
CREATE INDEX IF NOT EXISTS idx_peer_selections_context ON peer_course_selections(university_slug, department_slug, level, semester);
CREATE INDEX IF NOT EXISTS idx_peer_selections_course ON peer_course_selections(course_code);
CREATE INDEX IF NOT EXISTS idx_peer_selections_user ON peer_course_selections(user_id);

-- Indexes for ai_suggestion_cache
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_suggestion_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_context ON ai_suggestion_cache(university_slug, department_slug, level, semester);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update peer counts when selections are made
CREATE OR REPLACE FUNCTION update_peer_suggestion_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert course suggestion with peer recommendation data
    INSERT INTO course_suggestions (
        university_slug, 
        department_slug, 
        level, 
        semester, 
        course_code, 
        course_name, 
        suggestion_type, 
        confidence_score, 
        peer_count,
        source_data,
        updated_at
    ) VALUES (
        NEW.university_slug,
        NEW.department_slug,
        NEW.level,
        NEW.semester,
        NEW.course_code,
        NEW.course_name,
        'peer_recommendation',
        -- Calculate confidence based on peer count (more peers = higher confidence)
        LEAST(0.9, 0.3 + (GREATEST(1, (
            SELECT COUNT(*) 
            FROM peer_course_selections 
            WHERE university_slug = NEW.university_slug 
            AND department_slug = NEW.department_slug 
            AND level = NEW.level 
            AND semester = NEW.semester 
            AND course_code = NEW.course_code
        )) * 0.1)),
        GREATEST(1, (
            SELECT COUNT(*) 
            FROM peer_course_selections 
            WHERE university_slug = NEW.university_slug 
            AND department_slug = NEW.department_slug 
            AND level = NEW.level 
            AND semester = NEW.semester 
            AND course_code = NEW.course_code
        )),
        jsonb_build_object('peer_user_ids', ARRAY_AGG(DISTINCT user_id)),
        NOW()
    )
    ON CONFLICT (university_slug, department_slug, level, semester, course_code, suggestion_type)
    DO UPDATE SET
        peer_count = EXCLUDED.peer_count,
        confidence_score = EXCLUDED.confidence_score,
        source_data = EXCLUDED.source_data,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update peer counts
CREATE TRIGGER trigger_update_peer_suggestion_count
    AFTER INSERT ON peer_course_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_peer_suggestion_count();

-- Function to get course suggestions for a given academic context
CREATE OR REPLACE FUNCTION get_course_suggestions(
    p_university_slug TEXT,
    p_department_slug TEXT,
    p_level TEXT,
    p_semester TEXT,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    course_code TEXT,
    course_name TEXT,
    suggestion_type TEXT,
    confidence_score DECIMAL,
    peer_count INTEGER,
    source_data JSONB,
    combined_score DECIMAL -- Weighted score combining AI confidence and peer popularity
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.course_code,
        cs.course_name,
        cs.suggestion_type,
        cs.confidence_score,
        cs.peer_count,
        cs.source_data,
        -- Combined score: 60% confidence + 40% peer popularity (normalized)
        (cs.confidence_score * 0.6 + LEAST(1.0, cs.peer_count / 10.0) * 0.4) as combined_score
    FROM course_suggestions cs
    WHERE cs.university_slug = p_university_slug
    AND cs.department_slug = p_department_slug
    AND cs.level = p_level
    AND cs.semester = p_semester
    ORDER BY combined_score DESC, cs.peer_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired AI cache
CREATE OR REPLACE FUNCTION cleanup_ai_suggestion_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_suggestion_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE course_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_course_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestion_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_suggestions
CREATE POLICY "Anyone can read course suggestions" ON course_suggestions
    FOR SELECT USING (true);

CREATE POLICY "Only service role can modify course suggestions" ON course_suggestions
    FOR ALL USING (
        auth.jwt()->>'role' = 'service_role' OR 
        auth.jwt()->>'role' = 'admin'
    );

-- RLS Policies for peer_course_selections
CREATE POLICY "Users can read aggregated peer selections" ON peer_course_selections
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own selections" ON peer_course_selections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own selections" ON peer_course_selections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own selections" ON peer_course_selections
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_suggestion_cache
CREATE POLICY "Only service role can access AI cache" ON ai_suggestion_cache
    FOR ALL USING (
        auth.jwt()->>'role' = 'service_role'
    );

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- You can uncomment this section to add sample data for testing
/*
-- Sample course suggestions for testing
INSERT INTO course_suggestions (
    university_slug, department_slug, level, semester, course_code, course_name,
    suggestion_type, confidence_score, peer_count, source_data
) VALUES
('landmark-university', 'computer-science', '100', '1st', 'CSC101', 'Introduction to Computer Science',
 'ai_generated', 0.85, 0, '{"source": "ai_baseline", "reason": "Core introductory course"}'),
('landmark-university', 'computer-science', '100', '1st', 'MTH101', 'Mathematics I',
 'ai_generated', 0.80, 0, '{"source": "ai_baseline", "reason": "Foundation mathematics"}'),
('landmark-university', 'computer-science', '100', '1st', 'GST111', 'Communication in English I',
 'ai_generated', 0.75, 0, '{"source": "ai_jamb", "reason": "General studies requirement"}');
*/

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- The enhanced course suggestion system is now ready!
-- Tables created: course_suggestions, peer_course_selections, ai_suggestion_cache
-- Functions created: update_peer_suggestion_count, get_course_suggestions, cleanup_ai_suggestion_cache
-- Indexes created for optimal performance
-- RLS policies configured for security

-- You can now use the course suggestion service in your application!
