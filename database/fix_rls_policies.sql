-- Fix RLS policies for ai_suggestion_cache to allow client access
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Only service role can access AI cache" ON ai_suggestion_cache;

-- Create new policies that allow appropriate access
CREATE POLICY "Allow read access to AI cache" ON ai_suggestion_cache
    FOR SELECT USING (true);

CREATE POLICY "Allow insert to AI cache" ON ai_suggestion_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update to AI cache" ON ai_suggestion_cache
    FOR UPDATE USING (true);

-- Also ensure peer_course_selections has proper policies
CREATE POLICY "Allow read access to peer selections" ON peer_course_selections
    FOR SELECT USING (true);

CREATE POLICY "Allow insert to peer selections" ON peer_course_selections
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update to peer selections" ON peer_course_selections
    FOR UPDATE USING (true);
