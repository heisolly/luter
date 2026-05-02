-- Gamification System Database Schema
-- This implements XP, Levels, Coins, and Achievements

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS user_purchases CASCADE;
DROP TABLE IF EXISTS xp_transactions CASCADE;
DROP TABLE IF EXISTS coin_transactions CASCADE;
DROP TABLE IF EXISTS store_items CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS levels CASCADE;
DROP TABLE IF EXISTS user_gamification CASCADE;

-- User Gamification Stats (extends existing user_stats)
CREATE TABLE user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    materials_studied INTEGER DEFAULT 0,
    achievements_unlocked TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Level Definitions
CREATE TABLE levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level INTEGER UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    min_xp INTEGER NOT NULL,
    max_xp INTEGER NOT NULL,
    coins_reward INTEGER DEFAULT 0,
    badge_color VARCHAR(20) DEFAULT '#6745AE',
    badge_icon VARCHAR(50) DEFAULT 'star',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements - Complete definition with all required columns
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    badge_color VARCHAR(20) DEFAULT '#FFD700',
    xp_reward INTEGER DEFAULT 0,
    coins_reward INTEGER DEFAULT 0,
    requirement_type VARCHAR(50) NOT NULL, -- 'streak_days', 'sessions_completed', 'total_study_time', etc.
    requirement_value INTEGER NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements (unlock tracking)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Store Items
CREATE TABLE store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL, -- in coins
    category VARCHAR(50) NOT NULL, -- 'avatar', 'badge', 'theme', 'boost'
    item_type VARCHAR(50) NOT NULL, -- 'purchase', 'consumable'
    item_data JSONB, -- store item properties
    is_active BOOLEAN DEFAULT TRUE,
    is_limited BOOLEAN DEFAULT FALSE,
    stock_quantity INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Purchases
CREATE TABLE user_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    coins_spent INTEGER NOT NULL,
    is_used BOOLEAN DEFAULT FALSE, -- for consumable items
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    purchase_data JSONB -- store purchase metadata
);

-- XP Transactions (for tracking XP gains)
CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'session_complete', 'question_answered', 'achievement', etc.
    source_id UUID, -- reference to related record
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coin Transactions (for tracking coin gains/losses)
CREATE TABLE coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive for gains, negative for losses
    balance_after INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'session_complete', 'purchase', 'achievement', etc.
    source_id UUID, -- reference to related record
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default levels (1-50)
INSERT INTO levels (level, name, min_xp, max_xp, coins_reward, badge_color, description) VALUES
(1, 'Novice Learner', 0, 100, 10, '#6745AE', 'Just getting started on your learning journey'),
(2, 'Beginner', 100, 250, 15, '#7C3AED', 'Learning the basics'),
(3, 'Apprentice', 250, 500, 20, '#8B5CF6', 'Building foundational knowledge'),
(4, 'Scholar', 500, 1000, 30, '#A78BFA', 'Developing study habits'),
(5, 'Knowledge Seeker', 1000, 2000, 50, '#C4B5FD', 'Expanding your horizons'),
(10, 'Dedicated Student', 5000, 7500, 100, '#9333EA', 'Committed to learning'),
(15, 'Advanced Learner', 15000, 20000, 200, '#7E22CE', 'Master complex topics'),
(20, 'Expert Scholar', 30000, 40000, 300, '#6B21A8', 'Deep knowledge in multiple areas'),
(25, 'Master Student', 60000, 80000, 500, '#581C87', 'Excellence in learning'),
(30, 'Wisdom Keeper', 100000, 130000, 750, '#4C1D95', 'Vast knowledge and experience'),
(40, 'Legendary Learner', 250000, 350000, 1500, '#3730A3', 'Legendary status achieved'),
(50, 'Enlightened Master', 500000, 999999, 3000, '#312E81', 'Ultimate learning mastery');

-- Insert default achievements - with all required columns
INSERT INTO achievements (name, description, icon, badge_color, xp_reward, coins_reward, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first study session', '🎯', '#10B981', 50, 25, 'sessions_completed', 1),
('Week Warrior', 'Maintain a 7-day streak', '🔥', '#F59E0B', 100, 50, 'streak_days', 7),
('Month Master', 'Maintain a 30-day streak', '💎', '#8B5CF6', 300, 150, 'streak_days', 30),
('Study Marathon', 'Study for 100 total hours', '⏰', '#3B82F6', 200, 100, 'total_study_time', 6000),
('Question Master', 'Answer 500 questions', '🧠', '#EC4899', 150, 75, 'questions_answered', 500),
('Material Collector', 'Study 50 different materials', '📚', '#14B8A6', 100, 50, 'materials_studied', 50),
('Early Bird', 'Complete 5 sessions before 9 AM', '🌅', '#FBBF24', 75, 40, 'early_sessions', 5),
('Night Owl', 'Complete 5 sessions after 9 PM', '🦉', '#6366F1', 75, 40, 'late_sessions', 5),
('Level 10 Achiever', 'Reach level 10', '⭐', '#FFD700', 200, 100, 'level_reached', 10),
('Level 25 Master', 'Reach level 25', '👑', '#FF6B6B', 500, 250, 'level_reached', 25);

-- Insert default store items
INSERT INTO store_items (name, description, price, category, item_type, item_data) VALUES
('Avatar Frame - Gold', 'Decorate your profile with a golden frame', 100, 'avatar', 'purchase', '{"color": "#FFD700", "style": "gold"}'),
('Avatar Frame - Silver', 'Decorate your profile with a silver frame', 75, 'avatar', 'purchase', '{"color": "#C0C0C0", "style": "silver"}'),
('Avatar Frame - Bronze', 'Decorate your profile with a bronze frame', 50, 'avatar', 'purchase', '{"color": "#CD7F32", "style": "bronze"}'),
('Study Boost - 2x XP', 'Double XP for your next 3 study sessions', 200, 'boost', 'consumable', '{"multiplier": 2, "duration": 3}'),
('Coin Boost - 2x Coins', 'Double coins for your next 5 study sessions', 150, 'boost', 'consumable', '{"multiplier": 2, "duration": 5}'),
('Streak Shield', 'Protect your streak for one day of inactivity', 100, 'boost', 'consumable', '{"type": "streak_protection", "duration": 1}'),
('Badge - Speed Learner', 'Show off your fast learning skills', 300, 'badge', 'purchase', '{"icon": "⚡", "name": "Speed Learner"}'),
('Badge - Knowledge Master', 'Display your mastery badge', 400, 'badge', 'purchase', '{"icon": "🎓", "name": "Knowledge Master"}'),
('Theme - Dark Mode Pro', 'Unlock premium dark theme', 500, 'theme', 'purchase', '{"theme": "dark_pro"}'),
('Theme - Nature Focus', 'Calming nature theme for better concentration', 450, 'theme', 'purchase', '{"theme": "nature_focus"}');

-- Create indexes for performance
CREATE INDEX idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_coin_transactions_user_id ON coin_transactions(user_id);

-- Create function to update user gamification stats
CREATE OR REPLACE FUNCTION update_user_gamification(
    p_user_id UUID,
    p_xp_gain INTEGER DEFAULT 0,
    p_coins_gain INTEGER DEFAULT 0,
    p_study_time_minutes INTEGER DEFAULT 0,
    p_sessions_completed INTEGER DEFAULT 0,
    p_questions_answered INTEGER DEFAULT 0,
    p_materials_studied INTEGER DEFAULT 0,
    p_source VARCHAR DEFAULT 'manual'
)
RETURNS VOID AS $$
DECLARE
    current_stats RECORD;
    new_level INTEGER;
    old_level INTEGER;
    level_up_bonus INTEGER := 50;
BEGIN
    -- Get current stats or create new record
    INSERT INTO user_gamification (user_id, level, xp, coins, total_study_time_minutes, sessions_completed, questions_answered, materials_studied)
    VALUES (p_user_id, 1, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO current_stats FROM user_gamification WHERE user_id = p_user_id;
    
    old_level := current_stats.level;
    
    -- Update stats
    UPDATE user_gamification SET
        xp = xp + p_xp_gain,
        coins = coins + p_coins_gain,
        total_study_time_minutes = total_study_time_minutes + p_study_time_minutes,
        sessions_completed = sessions_completed + p_sessions_completed,
        questions_answered = questions_answered + p_questions_answered,
        materials_studied = materials_studied + p_materials_studied,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Check for level up
    SELECT level INTO new_level FROM levels WHERE p_xp_gain + current_stats.xp >= min_xp ORDER BY level DESC LIMIT 1;
    
    IF new_level > old_level THEN
        -- Level up bonus
        UPDATE user_gamification SET
            level = new_level,
            coins = coins + level_up_bonus,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Record XP transaction
        INSERT INTO xp_transactions (user_id, xp_amount, source, description)
        VALUES (p_user_id, p_xp_gain, p_source, 'Level up bonus included');
        
        -- Record coin transaction
        INSERT INTO coin_transactions (user_id, amount, balance_after, source, description)
        VALUES (p_user_id, p_coins_gain + level_up_bonus, 
                (SELECT coins FROM user_gamification WHERE user_id = p_user_id),
                p_source, 'Level up bonus included');
    ELSE
        -- Record regular transactions
        INSERT INTO xp_transactions (user_id, xp_amount, source, description)
        VALUES (p_user_id, p_xp_gain, p_source, 'XP earned');
        
        INSERT INTO coin_transactions (user_id, amount, balance_after, source, description)
        VALUES (p_user_id, p_coins_gain, 
                (SELECT coins FROM user_gamification WHERE user_id = p_user_id),
                p_source, 'Coins earned');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own gamification data
CREATE POLICY "Users can view own gamification" ON user_gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification" ON user_gamification FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see their own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own purchases
CREATE POLICY "Users can view own purchases" ON user_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON user_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own transactions
CREATE POLICY "Users can view own xp_transactions" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own coin_transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);

-- Everyone can view levels, achievements, and store items
CREATE POLICY "Everyone can view levels" ON levels FOR SELECT USING (true);
CREATE POLICY "Everyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Everyone can view store_items" ON store_items FOR SELECT USING (true);
