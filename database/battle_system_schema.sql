-- Battle System Schema for Luter
-- This schema supports real-time battle mechanics with session management

-- Battle Sessions (active battles)
CREATE TABLE IF NOT EXISTS battle_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "luter_abc123"
    battle_type VARCHAR(20) DEFAULT 'duel' CHECK (battle_type IN ('duel', 'tournament', 'practice')),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'countdown', 'active', 'finished', 'expired')),
    subject VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_count INTEGER DEFAULT 10,
    time_limit_seconds INTEGER DEFAULT 600, -- 10 minutes per battle
    current_question INTEGER DEFAULT 0,
    questions JSONB, -- Array of question objects (without correct answers)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    winner_id UUID REFERENCES auth.users(id),
    battle_data JSONB DEFAULT '{}' -- Additional battle metadata
);

-- Battle Participants
CREATE TABLE IF NOT EXISTS battle_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    battle_session_id UUID REFERENCES battle_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    socket_id VARCHAR(255), -- For real-time connections
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'spectator')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'forfeited')),
    score INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    current_question INTEGER DEFAULT 0,
    finished_at TIMESTAMP WITH TIME ZONE,
    answers JSONB DEFAULT '{}', -- Map of question_index -> selected_answer
    type_in_answers JSONB DEFAULT '{}', -- For type-in questions
    is_ready BOOLEAN DEFAULT false, -- For sync start
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- For connection monitoring
    participant_data JSONB DEFAULT '{}', -- Additional participant metadata
    UNIQUE(battle_session_id, user_id)
);

-- Battle Questions (for storing generated questions with answers)
CREATE TABLE IF NOT EXISTS battle_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    battle_session_id UUID REFERENCES battle_sessions(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'multiple' CHECK (question_type IN ('multiple', 'true_false', 'type_in')),
    options JSONB, -- For multiple choice questions
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium',
    subject VARCHAR(100),
    topic VARCHAR(100),
    points INTEGER DEFAULT 1,
    time_limit_seconds INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(battle_session_id, question_index)
);

-- Battle Results (final battle outcomes)
CREATE TABLE IF NOT EXISTS battle_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    battle_session_id UUID REFERENCES battle_sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES battle_participants(id) ON DELETE CASCADE,
    final_score INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    accuracy_percentage DECIMAL(5,2),
    time_taken_seconds INTEGER,
    rank_position INTEGER, -- 1st, 2nd, etc.
    luter_grade VARCHAR(10), -- "A+", "B", etc.
    exam_readiness_percentage INTEGER,
    weakness_analysis JSONB, -- AI-generated analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battle Matchmaking Pool
CREATE TABLE IF NOT EXISTS battle_matchmaking_pool (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    socket_id VARCHAR(255),
    subject VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'medium',
    battle_type VARCHAR(20) DEFAULT 'duel',
    preferences JSONB DEFAULT '{}', -- User preferences for matching
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 minutes'),
    UNIQUE(user_id, subject)
);

-- Battle Leaderboard (aggregated stats)
CREATE TABLE IF NOT EXISTS battle_leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    total_battles INTEGER DEFAULT 0,
    battles_won INTEGER DEFAULT 0,
    battles_lost INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2),
    average_score DECIMAL(5,2),
    best_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    rank_position INTEGER,
    last_battle_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subject)
);

-- Battle History (for user profiles)
CREATE TABLE IF NOT EXISTS battle_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    battle_session_id UUID REFERENCES battle_sessions(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES auth.users(id),
    result VARCHAR(20) CHECK (result IN ('win', 'loss', 'draw')),
    score INTEGER,
    opponent_score INTEGER,
    accuracy_percentage DECIMAL(5,2),
    subject VARCHAR(100),
    duration_seconds INTEGER,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Battle Events (for audit trail and analytics)
CREATE TABLE IF NOT EXISTS battle_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    battle_session_id UUID REFERENCES battle_sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES battle_participants(id),
    event_type VARCHAR(50) NOT NULL, -- 'answer_submitted', 'battle_started', 'battle_finished', etc.
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_battle_sessions_status ON battle_sessions(status);
CREATE INDEX IF NOT EXISTS idx_battle_sessions_subject ON battle_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_battle_sessions_created_at ON battle_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_battle_sessions_expires_at ON battle_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_battle_participants_user_id ON battle_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_status ON battle_participants(status);
CREATE INDEX IF NOT EXISTS idx_battle_participants_socket_id ON battle_participants(socket_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_last_ping ON battle_participants(last_ping);

CREATE INDEX IF NOT EXISTS idx_battle_questions_session ON battle_questions(battle_session_id);
CREATE INDEX IF NOT EXISTS idx_battle_questions_subject ON battle_questions(subject);

CREATE INDEX IF NOT EXISTS idx_battle_matchmaking_pool_user ON battle_matchmaking_pool(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_matchmaking_pool_subject ON battle_matchmaking_pool(subject);
CREATE INDEX IF NOT EXISTS idx_battle_matchmaking_pool_expires ON battle_matchmaking_pool(expires_at);

CREATE INDEX IF NOT EXISTS idx_battle_leaderboard_user_subject ON battle_leaderboard(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_battle_leaderboard_rank ON battle_leaderboard(rank_position);

CREATE INDEX IF NOT EXISTS idx_battle_history_user ON battle_history(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_history_created_at ON battle_history(created_at);

CREATE INDEX IF NOT EXISTS idx_battle_events_session ON battle_events(battle_session_id);
CREATE INDEX IF NOT EXISTS idx_battle_events_type ON battle_events(event_type);

-- RLS (Row Level Security) Policies
ALTER TABLE battle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_matchmaking_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_events ENABLE ROW LEVEL SECURITY;

-- Battle Sessions Policies
CREATE POLICY "Users can view their own battle sessions" ON battle_sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM battle_participants 
            WHERE battle_session_id = battle_sessions.id
        )
    );

CREATE POLICY "Users can insert battle sessions" ON battle_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their battle sessions" ON battle_sessions
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM battle_participants 
            WHERE battle_session_id = battle_sessions.id
        )
    );

-- Battle Participants Policies
CREATE POLICY "Users can view battle participants" ON battle_participants
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM battle_participants 
            WHERE battle_session_id = battle_participants.battle_session_id
        ) OR battle_participants.battle_session_id IN (
            SELECT id FROM battle_sessions WHERE status = 'waiting'
        )
    );

CREATE POLICY "Users can insert battle participants" ON battle_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participant data" ON battle_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Battle Questions Policies
CREATE POLICY "Users can view battle questions" ON battle_questions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM battle_participants 
            WHERE battle_session_id = battle_questions.battle_session_id
        )
    );

CREATE POLICY "System can insert battle questions" ON battle_questions
    FOR INSERT WITH CHECK (true);

-- Battle Results Policies
CREATE POLICY "Users can view battle results" ON battle_results
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM battle_participants 
            WHERE battle_session_id = battle_results.battle_session_id
        )
    );

CREATE POLICY "System can insert battle results" ON battle_results
    FOR INSERT WITH CHECK (true);

-- Battle Matchmaking Pool Policies
CREATE POLICY "Users can manage their matchmaking entries" ON battle_matchmaking_pool
    FOR ALL USING (auth.uid() = user_id);

-- Battle Leaderboard Policies
CREATE POLICY "Everyone can view leaderboard" ON battle_leaderboard
    FOR SELECT USING (true);

CREATE POLICY "System can update leaderboard" ON battle_leaderboard
    FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update leaderboard data" ON battle_leaderboard
    FOR UPDATE USING (true);

-- Battle History Policies
CREATE POLICY "Users can view their own battle history" ON battle_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert battle history" ON battle_history
    FOR INSERT WITH CHECK (true);

-- Battle Events Policies
CREATE POLICY "System can manage battle events" ON battle_events
    FOR ALL USING (true);

-- Functions for automatic cleanup and updates
CREATE OR REPLACE FUNCTION cleanup_expired_battles()
RETURNS void AS $$
BEGIN
    -- Mark expired battles as expired
    UPDATE battle_sessions 
    SET status = 'expired', finished_at = NOW()
    WHERE status IN ('waiting', 'countdown', 'active') 
    AND expires_at < NOW();
    
    -- Remove expired matchmaking entries
    DELETE FROM battle_matchmaking_pool 
    WHERE expires_at < NOW();
    
    -- Update last ping for disconnected participants
    UPDATE battle_participants 
    SET status = 'disconnected'
    WHERE status = 'active' 
    AND last_ping < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_battle_leaderboard()
RETURNS trigger AS $$
BEGIN
    INSERT INTO battle_leaderboard (user_id, subject, total_battles, battles_won, battles_lost, win_rate, average_score, current_streak, total_points, last_battle_at, updated_at)
    VALUES (
        NEW.user_id,
        (SELECT subject FROM battle_sessions WHERE id = NEW.battle_session_id),
        1,
        CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END,
        CASE WHEN NEW.result = 'loss' THEN 1 ELSE 0 END,
        CASE WHEN NEW.result = 'win' THEN 100.0 ELSE 0.0 END,
        NEW.score,
        CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END,
        NEW.xp_earned,
        NEW.created_at,
        NOW()
    )
    ON CONFLICT (user_id, subject)
    DO UPDATE SET
        total_battles = battle_leaderboard.total_battles + 1,
        battles_won = battle_leaderboard.battles_won + CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END,
        battles_lost = battle_leaderboard.battles_lost + CASE WHEN NEW.result = 'loss' THEN 1 ELSE 0 END,
        win_rate = ROUND(
            (battle_leaderboard.battles_won + CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END) * 100.0 / 
            (battle_leaderboard.total_battles + 1), 2
        ),
        average_score = ROUND(
            (battle_leaderboard.average_score * battle_leaderboard.total_battles + NEW.score) / 
            (battle_leaderboard.total_battles + 1), 2
        ),
        current_streak = CASE 
            WHEN NEW.result = 'win' THEN battle_leaderboard.current_streak + 1
            ELSE 0
        END,
        best_streak = GREATEST(
            battle_leaderboard.best_streak,
            CASE WHEN NEW.result = 'win' THEN battle_leaderboard.current_streak + 1 ELSE 0 END
        ),
        total_points = battle_leaderboard.total_points + NEW.xp_earned,
        last_battle_at = NEW.created_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_leaderboard
    AFTER INSERT ON battle_history
    FOR EACH ROW EXECUTE FUNCTION update_battle_leaderboard();

-- Schedule cleanup function (run every minute)
-- This would typically be handled by a cron job or Supabase scheduled function
-- SELECT cron.schedule('cleanup-battles', '* * * * *', 'SELECT cleanup_expired_battles();');

-- Initial data for popular subjects
INSERT INTO battle_leaderboard (user_id, subject, total_battles, battles_won, battles_lost, win_rate, average_score, current_streak, best_streak, total_points, rank_position, updated_at)
SELECT 
    id,
    unnest(ARRAY['Mathematics', 'Chemistry', 'Physics', 'Biology', 'English']) as subject,
    0, 0, 0, 0.0, 0.0, 0, 0, 0, null, NOW()
FROM auth.users
LIMIT 10;
