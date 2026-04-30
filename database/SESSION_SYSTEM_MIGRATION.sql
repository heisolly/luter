-- =====================================================
-- LUTER SESSION SYSTEM MIGRATION
-- This creates/enhances the deck_sessions table for study session management
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE/ENHANCE DECK_SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS deck_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL DEFAULT 'Study Session',
    items JSONB DEFAULT '[]', -- Array of {id, title, type, url, thumbnail, courseId, materialId}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    -- Optional metadata for session organization
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_deck_sessions_user_active ON deck_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_deck_sessions_last_accessed ON deck_sessions(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_deck_sessions_user_id ON deck_sessions(user_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE deck_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Users can view their own active sessions
DROP POLICY IF EXISTS "Users can view own deck sessions" ON deck_sessions;
CREATE POLICY "Users can view own deck sessions" ON deck_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sessions
DROP POLICY IF EXISTS "Users can insert own deck sessions" ON deck_sessions;
CREATE POLICY "Users can insert own deck sessions" ON deck_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
DROP POLICY IF EXISTS "Users can update own deck sessions" ON deck_sessions;
CREATE POLICY "Users can update own deck sessions" ON deck_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete (soft delete) their own sessions
DROP POLICY IF EXISTS "Users can delete own deck sessions" ON deck_sessions;
CREATE POLICY "Users can delete own deck sessions" ON deck_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

DROP TRIGGER IF EXISTS update_deck_sessions_updated_at ON deck_sessions;

CREATE OR REPLACE FUNCTION update_deck_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_accessed = COALESCE(NEW.last_accessed, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deck_sessions_updated_at
    BEFORE UPDATE ON deck_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_sessions_updated_at();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- The session system is now ready!
-- Key features enabled:
-- ✅ deck_sessions table for persistent study sessions
-- ✅ Row Level Security for user data protection
-- ✅ Performance indexes for fast queries
-- ✅ Automatic timestamp management
