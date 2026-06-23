-- =====================================================
-- FIX PROFILES SUBSCRIPTION COLUMNS
-- Run this in your Supabase SQL Editor to resolve the
-- "record 'new' has no field 'subscription_status'" error.
-- =====================================================

-- Add the missing subscription columns to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add a unique constraint to stripe_customer_id if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_stripe_customer_id_key'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_stripe_customer_id_key UNIQUE (stripe_customer_id);
    END IF;
END $$;
