-- =============================================================
-- SYNC USER_STATS AND USER_GAMIFICATION TABLES
-- Run this in your Supabase SQL editor
-- =============================================================

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
    -- Get current stats or create new record in user_gamification
    INSERT INTO user_gamification (user_id, level, xp, coins, total_study_time_minutes, sessions_completed, questions_answered, materials_studied)
    VALUES (p_user_id, 1, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO current_stats FROM user_gamification WHERE user_id = p_user_id;
    
    old_level := current_stats.level;
    
    -- Update user_gamification stats
    UPDATE user_gamification SET
        xp = xp + p_xp_gain,
        coins = coins + p_coins_gain,
        total_study_time_minutes = total_study_time_minutes + p_study_time_minutes,
        sessions_completed = sessions_completed + p_sessions_completed,
        questions_answered = questions_answered + p_questions_answered,
        materials_studied = materials_studied + p_materials_studied,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Keep user_stats.total_xp synchronized
    INSERT INTO user_stats (user_id, total_xp, streak_days, lives)
    VALUES (p_user_id, p_xp_gain, 0, 3)
    ON CONFLICT (user_id) DO UPDATE SET
        total_xp = COALESCE(user_stats.total_xp, 0) + p_xp_gain;
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_gamification TO authenticated;
