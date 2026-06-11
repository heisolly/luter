-- =============================================================
-- LUTER AI CREDIT SYSTEM
-- =============================================================

-- 1. Ensure user_stats has credit columns (run if missing)
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS ai_credits_monthly INTEGER DEFAULT 200,
  ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0;

-- 2. RPC: Get remaining credits for a user
CREATE OR REPLACE FUNCTION get_ai_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT (COALESCE(ai_credits_monthly, 0) - COALESCE(ai_credits_used, 0))
  INTO remaining
  FROM user_stats
  WHERE user_id = p_user_id;

  RETURN COALESCE(remaining, 0);
END;
$$;

-- 3. RPC: Deduct credits and return remaining (or -1 if insufficient)
CREATE OR REPLACE FUNCTION deduct_ai_credits(p_user_id UUID, p_cost INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  remaining INTEGER;
  monthly INTEGER;
  used INTEGER;
BEGIN
  SELECT COALESCE(ai_credits_monthly, 0), COALESCE(ai_credits_used, 0)
  INTO monthly, used
  FROM user_stats
  WHERE user_id = p_user_id;

  -- If no row exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id, ai_credits_monthly, ai_credits_used)
    VALUES (p_user_id, 200, 0)
    RETURNING 200, 0 INTO monthly, used;
  END IF;

  remaining := monthly - used;

  IF remaining < p_cost THEN
    RETURN -1;
  END IF;

  UPDATE user_stats
  SET ai_credits_used = used + p_cost
  WHERE user_id = p_user_id;

  RETURN remaining - p_cost;
END;
$$;

-- 4. RPC: Reset daily credits for all users (call via cron or scheduled function)
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  updated INTEGER;
BEGIN
  UPDATE user_stats
  SET ai_credits_used = 0
  WHERE ai_credits_used > 0;

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated;
END;
$$;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_ai_credits TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_ai_credits TO authenticated;
GRANT EXECUTE ON FUNCTION reset_daily_credits TO service_role;
