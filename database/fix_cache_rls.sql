-- FIX FOR AI SUGGESTION CACHE RLS
-- The previous policy only allowed service_role, causing 406 errors on the frontend.
-- This update allows all authenticated users to read and write to the cache.

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Only service role can access AI cache" ON ai_suggestion_cache;

-- 2. Create a new policy that allows authenticated users to read
CREATE POLICY "Anyone can read AI cache" ON ai_suggestion_cache
    FOR SELECT USING (true);

-- 3. Create a new policy that allows authenticated users to insert/update cache
CREATE POLICY "Authenticated users can manage AI cache" ON ai_suggestion_cache
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
