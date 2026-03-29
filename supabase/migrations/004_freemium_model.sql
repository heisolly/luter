-- Luter Freemium Model - 20% Rule Implementation
-- Run this migration after the base schema is set up

-- 1. Add subscription status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_type text NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;

-- Add constraint for subscription types
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_type_chk 
CHECK (subscription_type IN ('free', 'premium', 'trial'));

-- 2. Add locked status to user_courses table
ALTER TABLE public.user_courses 
ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_reason text, -- 'quota', 'subscription', etc.
ADD COLUMN IF NOT EXISTS unlocked_at timestamptz;

-- 3. Create function to apply 20% rule when courses are enrolled
CREATE OR REPLACE FUNCTION public.apply_freemium_locking(
  p_user_id uuid,
  p_course_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_courses integer;
  free_limit integer;
  course_record RECORD;
  counter integer := 0;
BEGIN
  -- Count total courses for this user
  SELECT COUNT(*) INTO total_courses
  FROM public.user_courses 
  WHERE user_id = p_user_id;
  
  -- Calculate free limit (20% of total, minimum 2)
  free_limit := GREATEST(2, ROUND(total_courses * 0.2));
  
  -- Lock courses beyond the free limit
  -- First courses are unlocked, rest are locked
  FOR course_record IN 
    SELECT uc.course_id, uc.id
    FROM public.user_courses uc
    JOIN public.courses c ON uc.course_id = c.id
    WHERE uc.user_id = p_user_id
    ORDER BY c.code ASC  -- Consistent ordering
  LOOP
    counter := counter + 1;
    
    IF counter <= free_limit THEN
      -- Unlock this course
      UPDATE public.user_courses 
      SET is_locked = false, 
          locked_reason = null,
          unlocked_at = now()
      WHERE id = course_record.id;
    ELSE
      -- Lock this course
      UPDATE public.user_courses 
      SET is_locked = true, 
          locked_reason = 'subscription_quota',
          unlocked_at = null
      WHERE id = course_record.id;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_freemium_locking FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_freemium_locking TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_freemium_locking TO service_role;

-- 4. Create function to check if user can access a course
CREATE OR REPLACE FUNCTION public.can_access_course(
  p_user_id uuid,
  p_course_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_premium boolean;
  course_locked boolean;
BEGIN
  -- Check if user has premium
  SELECT is_premium INTO user_premium
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- If premium, access everything
  IF user_premium THEN
    RETURN true;
  END IF;
  
  -- Check if course is locked for this user
  SELECT is_locked INTO course_locked
  FROM public.user_courses 
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  -- If course is not locked (or doesn't exist), allow access
  RETURN NOT COALESCE(course_locked, false);
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_course FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_course TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_course TO service_role;

-- 5. Create function to start free trial
CREATE OR REPLACE FUNCTION public.start_free_trial(
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_used boolean;
BEGIN
  -- Check if trial was already used
  SELECT trial_used INTO trial_used
  FROM public.profiles 
  WHERE id = p_user_id;
  
  IF trial_used THEN
    RETURN false; -- Trial already used
  END IF;
  
  -- Start 7-day trial
  UPDATE public.profiles 
  SET is_premium = true,
      subscription_type = 'trial',
      trial_used = true,
      trial_started_at = now(),
      subscription_expires_at = now() + interval '7 days'
  WHERE id = p_user_id;
  
  -- Unlock all courses for trial period
  UPDATE public.user_courses 
  SET is_locked = false,
      locked_reason = null,
      unlocked_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.start_free_trial FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_free_trial TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_free_trial TO service_role;

-- 6. Create function to upgrade to premium
CREATE OR REPLACE FUNCTION public.upgrade_to_premium(
  p_user_id uuid,
  p_duration_months integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upgrade to premium
  UPDATE public.profiles 
  SET is_premium = true,
      subscription_type = 'premium',
      subscription_expires_at = now() + (p_duration_months || ' months')::interval
  WHERE id = p_user_id;
  
  -- Unlock all courses
  UPDATE public.user_courses 
  SET is_locked = false,
      locked_reason = null,
      unlocked_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.upgrade_to_premium FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upgrade_to_premium TO authenticated;
GRANT EXECUTE ON FUNCTION public.upgrade_to_premium TO service_role;

-- 7. Update RLS policies to include freemium logic
-- Drop existing user_courses policies if they exist
DROP POLICY IF EXISTS "users_own_user_courses" ON public.user_courses;
DROP POLICY IF EXISTS "luter_admin_user_courses_all" ON public.user_courses;

-- Create new policies for user_courses
CREATE POLICY "users_select_own_user_courses" ON public.user_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_user_courses" ON public.user_courses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_user_courses" ON public.user_courses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Admin policy (from admin_rls migration)
CREATE POLICY "luter_admin_user_courses_all" ON public.user_courses
  FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

-- 8. Create trigger to apply freemium locking after course enrollment
CREATE OR REPLACE FUNCTION public.apply_freemium_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apply freemium locking after user courses are modified
  PERFORM public.apply_freemium_locking(NEW.user_id, ARRAY[NEW.course_id]);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_freemium_trigger FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_freemium_trigger TO service_role;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_apply_freemium_locking ON public.user_courses;
CREATE TRIGGER trigger_apply_freemium_locking
  AFTER INSERT OR UPDATE ON public.user_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_freemium_trigger();

-- 9. Create subscription_usage table for tracking feature limits
CREATE TABLE IF NOT EXISTS public.subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type text NOT NULL, -- 'ai_summary', 'quiz_battle', 'assignment_solution'
  usage_count integer NOT NULL DEFAULT 1,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_usage_unique_user_feature_date UNIQUE (user_id, feature_type, usage_date)
);

ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_usage
CREATE POLICY "users_own_subscription_usage" ON public.subscription_usage
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_subscription_usage_all" ON public.subscription_usage
  FOR ALL USING (public.luter_is_admin());

-- 10. Create function to check feature limits
CREATE OR REPLACE FUNCTION public.check_feature_limit(
  p_user_id uuid,
  p_feature_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_premium boolean;
  daily_usage integer;
  max_free_usage integer;
BEGIN
  -- Check if user has premium
  SELECT is_premium INTO user_premium
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Premium users have unlimited access
  IF user_premium THEN
    RETURN true;
  END IF;
  
  -- Get today's usage for this feature
  SELECT COALESCE(SUM(usage_count), 0) INTO daily_usage
  FROM public.subscription_usage 
  WHERE user_id = p_user_id 
    AND feature_type = p_feature_type 
    AND usage_date = CURRENT_DATE;
  
  -- Define free limits
  max_free_usage := CASE p_feature_type
    WHEN 'ai_summary' THEN 2
    WHEN 'quiz_battle' THEN 1
    WHEN 'assignment_solution' THEN 1
    ELSE 0
  END;
  
  -- Check if limit exceeded
  RETURN daily_usage < max_free_usage;
END;
$$;

REVOKE ALL ON FUNCTION public.check_feature_limit FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_feature_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_feature_limit TO service_role;

-- 11. Create function to record feature usage
CREATE OR REPLACE FUNCTION public.record_feature_usage(
  p_user_id uuid,
  p_feature_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscription_usage (user_id, feature_type, usage_count)
  VALUES (p_user_id, p_feature_type, 1)
  ON CONFLICT (user_id, feature_type, usage_date)
  DO UPDATE SET 
    usage_count = subscription_usage.usage_count + 1,
    created_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_feature_usage FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_feature_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_feature_usage TO service_role;
