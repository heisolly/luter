-- 1. Add the new columns
ALTER TABLE public.user_stats
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- 2. Migrate existing legacy 'streak_days' data to the new columns
-- This pulls in the past streaks and merges them into the new logic
UPDATE public.user_stats
SET 
  current_streak = COALESCE(streak_days, 0),
  max_streak = COALESCE(streak_days, 0)
WHERE current_streak = 0 AND streak_days > 0;

-- 3. Create the secure, atomic streak update function
DROP FUNCTION IF EXISTS public.update_user_streak(UUID);
CREATE OR REPLACE FUNCTION public.update_user_streak(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_last_activity DATE;
    v_current_streak INTEGER;
    v_max_streak INTEGER;
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
    -- Security Check: Only the user themselves or the backend service role can update their streak
    IF auth.uid() IS NOT NULL AND auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Unauthorized: You can only update your own streak.';
    END IF;

    -- Row-Level Lock: 'FOR UPDATE' prevents race conditions if a user clicks/triggers actions rapidly
    SELECT last_activity_date, current_streak, max_streak
    INTO v_last_activity, v_current_streak, v_max_streak
    FROM public.user_stats
    WHERE user_id = target_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- If no stats exist for the user yet, create them with a 1-day streak
        INSERT INTO public.user_stats (user_id, current_streak, max_streak, last_activity_date, streak_days)
        VALUES (target_user_id, 1, 1, v_today, 1);
        RETURN;
    END IF;

    -- CORE STREAK LOGIC
    IF v_last_activity IS NULL OR v_last_activity < v_yesterday THEN
        -- Streak is broken (older than yesterday) or this is their very first activity
        v_current_streak := 1;
    ELSIF v_last_activity = v_yesterday THEN
        -- Perfect: Streak is maintained!
        v_current_streak := v_current_streak + 1;
    ELSIF v_last_activity = v_today THEN
        -- They already triggered a streak update today. Do nothing.
        RETURN;
    END IF;

    -- Update max streak if the current one sets a new personal record
    IF v_current_streak > COALESCE(v_max_streak, 0) THEN
        v_max_streak := v_current_streak;
    END IF;

    -- Update the database.
    -- Note: We ALSO update the legacy 'streak_days' column so the rest of your frontend doesn't break!
    UPDATE public.user_stats
    SET 
        current_streak = v_current_streak,
        max_streak = v_max_streak,
        last_activity_date = v_today,
        streak_days = v_current_streak
    WHERE user_id = target_user_id;

END;
$$;

-- 4. Grant execution permissions
REVOKE EXECUTE ON FUNCTION public.update_user_streak(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO authenticated, service_role;
