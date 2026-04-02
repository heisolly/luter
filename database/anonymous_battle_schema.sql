-- Anonymous Battle Support Schema
-- Run this after the main compete_schema.sql

-- Add support for anonymous participants in battles
ALTER TABLE battle_participants 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS anonymous_id VARCHAR(50); -- For tracking anonymous users

-- Create a table for anonymous user sessions (optional, for tracking)
CREATE TABLE IF NOT EXISTS anonymous_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_id VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update RLS policies to allow anonymous participants
DROP POLICY IF EXISTS "Users can insert battle participants" ON battle_participants;
CREATE POLICY "Users can insert battle participants" ON battle_participants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view battle participants" ON battle_participants;
CREATE POLICY "Users can view battle participants" ON battle_participants FOR SELECT USING (
    battle_id IN (SELECT battle_id FROM battle_participants WHERE user_id = auth.uid()) OR
    battle_id IN (SELECT id FROM battles WHERE status = 'waiting' OR status = 'active')
);

-- Enable RLS for anonymous sessions
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous sessions
CREATE POLICY "Anyone can insert anonymous sessions" ON anonymous_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view anonymous sessions" ON anonymous_sessions FOR SELECT USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_battle_participants_anonymous ON battle_participants(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_battle ON anonymous_sessions(battle_id);
