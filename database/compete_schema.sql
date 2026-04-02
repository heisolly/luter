-- Luter Compete System - Complete Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Create Tournaments Table first (depends only on profiles)
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tournament_type VARCHAR(20) NOT NULL CHECK (tournament_type IN ('solo', 'team')),
    max_participants INTEGER NOT NULL DEFAULT 16,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'registration' CHECK (status IN ('registration', 'active', 'completed', 'cancelled')),
    entry_fee INTEGER DEFAULT 0,
    prize_pool INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER DEFAULT 4,
    rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- 2. Create Battles Table (depends on tournaments)
CREATE TABLE IF NOT EXISTS battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_type VARCHAR(20) NOT NULL CHECK (battle_type IN ('duel', 'team', 'tournament')),
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),
    session_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_limit_seconds INTEGER DEFAULT 120,
    question_count INTEGER DEFAULT 10,
    current_question INTEGER DEFAULT 0,
    current_phase VARCHAR(20) DEFAULT 'waiting' CHECK (current_phase IN ('waiting', 'question', 'answer', 'result')),
    phase_end_time TIMESTAMP WITH TIME ZONE,
    spectator_count INTEGER DEFAULT 0,
    prize_pool INTEGER DEFAULT 0,
    tournament_id UUID REFERENCES tournaments(id)
);

-- 3. Now enhance Profiles Table (can now reference battles)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS battle_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS battle_losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_battle_id UUID REFERENCES battles(id),
ADD COLUMN IF NOT EXISTS battle_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS tournament_wins INTEGER DEFAULT 0;

-- 4. Battle Participants Table
CREATE TABLE IF NOT EXISTS battle_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team_id INTEGER, -- NULL for duels, 1 or 2 for team battles
    role VARCHAR(20) NOT NULL DEFAULT 'participant' CHECK (role IN ('challenger', 'opponent', 'participant', 'spectator')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'disconnected')),
    score INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_answers INTEGER DEFAULT 0,
    answer_time_ms INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(battle_id, user_id)
);

-- 5. Battle Questions Table
CREATE TABLE IF NOT EXISTS battle_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('multiple', 'truefalse', 'typein')),
    options JSONB, -- For multiple choice questions
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    time_limit_seconds INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(battle_id, question_number)
);

-- 6. Battle Answers Table
CREATE TABLE IF NOT EXISTS battle_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answer_time_ms INTEGER NOT NULL,
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(battle_id, user_id, question_number)
);

-- 7. Tournament Participants Table
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team_id INTEGER, -- For team tournaments
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'eliminated', 'winner')),
    current_round INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- 8. Tournament Brackets Table
CREATE TABLE IF NOT EXISTS tournament_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    participant1_id UUID REFERENCES profiles(id),
    participant2_id UUID REFERENCES profiles(id),
    winner_id UUID REFERENCES profiles(id),
    battle_id UUID REFERENCES battles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, round_number, match_number)
);

-- 9. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    tag VARCHAR(10) NOT NULL, -- e.g., "LUTR"
    description TEXT,
    leader_id UUID NOT NULL REFERENCES profiles(id),
    max_members INTEGER DEFAULT 4,
    current_members INTEGER DEFAULT 1,
    team_xp INTEGER DEFAULT 0,
    team_level INTEGER DEFAULT 1,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disbanded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tag)
);

-- 10. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'kicked', 'left')),
    UNIQUE(team_id, user_id)
);

-- 11. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('battle', 'tournament', 'streak', 'social', 'special')),
    requirement_type VARCHAR(30) NOT NULL CHECK (requirement_type IN ('wins', 'losses', 'streak', 'score', 'participation', 'special')),
    requirement_value INTEGER NOT NULL,
    reward_xp INTEGER DEFAULT 0,
    reward_badge VARCHAR(50),
    is_secret BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reward_claimed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, achievement_id)
);

-- 13. Battle Spectators Table
CREATE TABLE IF NOT EXISTS battle_spectators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(battle_id, user_id)
);

-- 14. Battle Chat Table
CREATE TABLE IF NOT EXISTS battle_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat' CHECK (message_type IN ('chat', 'system', 'battle_start', 'battle_end', 'answer_correct', 'answer_wrong')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Achievements
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, reward_xp, reward_badge) VALUES
('First Victory', 'Win your first battle', 'trophy', 'battle', 'wins', 1, 50, 'first_win'),
('Duel Master', 'Win 10 duels', 'sword', 'battle', 'wins', 10, 200, 'duel_master'),
('Unstoppable', 'Win 5 battles in a row', 'flame', 'streak', 'streak', 5, 300, 'unstoppable'),
('Quick Draw', 'Answer a question in under 3 seconds', 'zap', 'battle', 'special', 1, 100, 'quick_draw'),
('Tournament Champion', 'Win your first tournament', 'crown', 'tournament', 'wins', 1, 500, 'champion'),
('Team Player', 'Participate in a team battle', 'users', 'battle', 'participation', 1, 50, 'team_player'),
('Perfect Game', 'Get 100% correct in a battle', 'star', 'battle', 'score', 100, 150, 'perfect'),
('Social Butterfly', 'Spectate 5 battles', 'eye', 'social', 'participation', 5, 100, 'spectator'),
('Knowledge Seeker', 'Answer 100 questions correctly', 'book-open', 'battle', 'special', 100, 400, 'scholar'),
('Legend', 'Reach battle level 10', 'award', 'battle', 'special', 1, 1000, 'legend')
ON CONFLICT DO NOTHING;

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_type ON battles(battle_type);
CREATE INDEX IF NOT EXISTS idx_battle_participants_battle ON battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_user ON battle_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);

-- Enable Row Level Security (RLS)
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_spectators ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - you may want to expand these)
DROP POLICY IF EXISTS "Users can view battles they participate in" ON battles;
CREATE POLICY "Users can view battles they participate in" ON battles FOR SELECT USING (
    id IN (SELECT battle_id FROM battle_participants WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can insert battles" ON battles;
CREATE POLICY "Users can insert battles" ON battles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update battles they participate in" ON battles;
CREATE POLICY "Users can update battles they participate in" ON battles FOR UPDATE USING (
    id IN (SELECT battle_id FROM battle_participants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view battle participants" ON battle_participants;
CREATE POLICY "Users can view battle participants" ON battle_participants FOR SELECT USING (
    battle_id IN (SELECT battle_id FROM battle_participants WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can insert battle participants" ON battle_participants;
CREATE POLICY "Users can insert battle participants" ON battle_participants FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own battle participant data" ON battle_participants;
CREATE POLICY "Users can update their own battle participant data" ON battle_participants FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view tournaments" ON tournaments;
CREATE POLICY "Users can view tournaments" ON tournaments FOR SELECT USING (status = 'registration' OR status = 'active');
DROP POLICY IF EXISTS "Users can view tournament participants" ON tournament_participants;
CREATE POLICY "Users can view tournament participants" ON tournament_participants FOR SELECT USING (
    tournament_id IN (SELECT id FROM tournaments WHERE status IN ('registration', 'active'))
);

DROP POLICY IF EXISTS "Users can view teams" ON teams;
CREATE POLICY "Users can view teams" ON teams FOR ALL USING (status = 'active');
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
CREATE POLICY "Users can view team members" ON team_members FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE status = 'active')
);

DROP POLICY IF EXISTS "Users can view achievements" ON achievements;
CREATE POLICY "Users can view achievements" ON achievements FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
CREATE POLICY "Users can insert their own achievements" ON user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own achievements" ON user_achievements;
CREATE POLICY "Users can update their own achievements" ON user_achievements FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view battle chat" ON battle_chat;
CREATE POLICY "Users can view battle chat" ON battle_chat FOR SELECT USING (
    battle_id IN (SELECT battle_id FROM battle_participants WHERE user_id = auth.uid()) OR
    battle_id IN (SELECT battle_id FROM battle_spectators WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can insert battle chat" ON battle_chat;
CREATE POLICY "Users can insert battle chat" ON battle_chat FOR INSERT WITH CHECK (
    battle_id IN (SELECT battle_id FROM battle_participants WHERE user_id = auth.uid()) OR
    battle_id IN (SELECT battle_id FROM battle_spectators WHERE user_id = auth.uid())
);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_battle_spectator_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE battles SET spectator_count = spectator_count + 1 WHERE id = NEW.battle_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE battles SET spectator_count = spectator_count - 1 WHERE id = OLD.battle_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_spectator_count ON battle_spectators;
CREATE TRIGGER trigger_update_spectator_count
    AFTER INSERT OR DELETE ON battle_spectators
    FOR EACH ROW EXECUTE FUNCTION update_battle_spectator_count();

CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE teams SET current_members = current_members + 1 WHERE id = NEW.team_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE teams SET current_members = current_members - 1 WHERE id = OLD.team_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_team_member_count ON team_members;
CREATE TRIGGER trigger_update_team_member_count
    AFTER INSERT OR DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_member_count();
