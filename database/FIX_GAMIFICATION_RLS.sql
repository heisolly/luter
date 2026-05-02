-- Fix missing INSERT policy for user_gamification table
-- This resolves the 403 Forbidden error when creating gamification records

-- Allow users to insert their own gamification data (needed for first-time setup)
CREATE POLICY "Users can insert own gamification" ON user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also add missing policies for transactions
CREATE POLICY "Users can insert own xp_transactions" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own coin_transactions" ON coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
