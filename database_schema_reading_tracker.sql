-- Reading Tracker Database Schema for Luter

-- Reading tracking table
CREATE TABLE IF NOT EXISTS reading_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    current_page INTEGER DEFAULT 1,
    total_pages INTEGER DEFAULT 1,
    tracking_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, material_id)
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL, -- 'reading_time', 'speed', 'streak', 'pages', etc.
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}', -- Additional achievement data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, achievement_type, title)
);

-- Reading sessions table (detailed session tracking)
CREATE TABLE IF NOT EXISTS reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    pages_read INTEGER DEFAULT 0,
    highlights_created INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    average_focus_score INTEGER DEFAULT 0,
    reading_speed INTEGER DEFAULT 0, -- words per minute
    session_data JSONB DEFAULT '{}', -- Additional session metrics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading goals table
CREATE TABLE IF NOT EXISTS reading_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'daily_time', 'weekly_pages', 'monthly_books', etc.
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    unit VARCHAR(20), -- 'minutes', 'pages', 'books', etc.
    deadline DATE,
    is_active BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Focus metrics table (detailed focus tracking)
CREATE TABLE IF NOT EXISTS focus_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    session_id UUID REFERENCES reading_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    focus_score INTEGER NOT NULL, -- 0-100
    activity_type VARCHAR(50), -- 'reading', 'highlighting', 'noting', 'idle', etc.
    page_number INTEGER,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reading_tracking_user_id ON reading_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_tracking_material_id ON reading_tracking(material_id);
CREATE INDEX IF NOT EXISTS idx_reading_tracking_updated_at ON reading_tracking(updated_at);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_material_id ON reading_sessions(material_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_session_start ON reading_sessions(session_start);

CREATE INDEX IF NOT EXISTS idx_reading_goals_user_id ON reading_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_goals_active ON reading_goals(is_active);

CREATE INDEX IF NOT EXISTS idx_focus_metrics_user_id ON focus_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_metrics_session_id ON focus_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_focus_metrics_timestamp ON focus_metrics(timestamp);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_reading_tracking_updated_at 
    BEFORE UPDATE ON reading_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_goals_updated_at 
    BEFORE UPDATE ON reading_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample achievements
INSERT INTO user_achievements (achievement_type, title, description, icon) VALUES
('first_session', 'First Steps', 'Complete your first reading session', 'book-open'),
('speed_demon', 'Speed Reader', 'Read at over 300 wpm', 'zap'),
('focus_master', 'Focus Master', 'Maintain 90%+ focus score', 'eye'),
('page_turner', 'Page Turner', 'Read 100 pages in one session', 'file-text'),
('streak_warrior', 'Streak Warrior', 'Maintain a 7-day reading streak', 'calendar'),
('night_owl', 'Night Owl', 'Read for 2 hours straight', 'moon'),
('early_bird', 'Early Bird', 'Complete a morning reading session', 'sun'),
('highlight_hero', 'Highlight Hero', 'Create 50 highlights', 'highlighter'),
('note_taker', 'Note Taker', 'Create 25 notes', 'edit-3'),
('marathon_reader', 'Marathon Reader', 'Read for 5 hours total', 'clock')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) Policies
ALTER TABLE reading_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reading_tracking
CREATE POLICY "Users can view their own reading tracking" ON reading_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading tracking" ON reading_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading tracking" ON reading_tracking
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading tracking" ON reading_tracking
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for reading_sessions
CREATE POLICY "Users can view their own reading sessions" ON reading_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading sessions" ON reading_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading sessions" ON reading_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for reading_goals
CREATE POLICY "Users can view their own reading goals" ON reading_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading goals" ON reading_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading goals" ON reading_goals
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for focus_metrics
CREATE POLICY "Users can view their own focus metrics" ON focus_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus metrics" ON focus_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);
