-- Luter Admin — run in Supabase SQL Editor after review.
-- 1) Promote your user once (replace UUID): UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_UUID';
-- 2) VITE_ADMIN_EMAILS only unlocks the /admin UI — data queries still need role='admin' + policies below.
-- 3) Keep your existing "users can read/update own profile" policies; these ADD admin access (OR logic).

-- Role column (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- SECURITY DEFINER: reads profiles without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.luter_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT p.role = 'admin' FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.luter_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.luter_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.luter_is_admin() TO service_role;

-- Policies (drop if re-running migration)
DROP POLICY IF EXISTS "luter_admin_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "luter_admin_profiles_update" ON public.profiles;
CREATE POLICY "luter_admin_profiles_select" ON public.profiles FOR SELECT USING (public.luter_is_admin());
CREATE POLICY "luter_admin_profiles_update" ON public.profiles FOR UPDATE USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

DROP POLICY IF EXISTS "luter_admin_courses_all" ON public.courses;
CREATE POLICY "luter_admin_courses_all" ON public.courses FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

DROP POLICY IF EXISTS "luter_admin_user_courses_all" ON public.user_courses;
CREATE POLICY "luter_admin_user_courses_all" ON public.user_courses FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

DROP POLICY IF EXISTS "luter_admin_user_stats_all" ON public.user_stats;
CREATE POLICY "luter_admin_user_stats_all" ON public.user_stats FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

DROP POLICY IF EXISTS "luter_admin_matches_select" ON public.matches;
CREATE POLICY "luter_admin_matches_select" ON public.matches FOR SELECT USING (public.luter_is_admin());

DROP POLICY IF EXISTS "luter_admin_notifications_all" ON public.notifications;
CREATE POLICY "luter_admin_notifications_all" ON public.notifications FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());
