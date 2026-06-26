-- ==============================================================================
-- DATABASE ADMIN RLS POLICIES & USER PROMOTION SETUP
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor to:
-- 1. Ensure public.profiles table has role and is_admin columns.
-- 2. Define a secure, recursion-free luter_is_admin() helper function.
-- 3. Promote specified admin emails to 'admin' role in public.profiles.
-- 4. Enable admins to view and manage all user profiles.
-- ==============================================================================

-- 1. Ensure columns exist on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Create recursion-free luter_is_admin() security definer function
CREATE OR REPLACE FUNCTION public.luter_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- We query profiles using a security definer function to bypass RLS,
  -- which prevents infinite recursion when called from a profiles policy.
  SELECT (role = 'admin' OR is_admin = true) INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execute permissions on the function to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.luter_is_admin() TO authenticated, anon;

-- 3. Promote specified admin users in public.profiles
-- This joins public.profiles with auth.users to find accounts by email.
UPDATE public.profiles
SET role = 'admin', is_admin = true
FROM auth.users
WHERE public.profiles.id = auth.users.id
  AND auth.users.email IN (
    'michaeloluwayanmi@gmail.com',
    'dm6121652@gmail.com',
    'popooladavid800@gmail.com'
  );

-- 4. Drop and recreate RLS policies on public.profiles for admins
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.luter_is_admin());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.luter_is_admin());

-- 5. Add select policy for payment transactions to allow admins to view all sales
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payment_transactions') THEN
        EXECUTE 'ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;';
        
        -- Drop existing if exists
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all transactions" ON public.payment_transactions;';
        
        -- Create new policy
        EXECUTE 'CREATE POLICY "Admins can view all transactions" ON public.payment_transactions FOR SELECT USING (public.luter_is_admin());';
    END IF;
END $$;

-- 6. Add select policy for notifications to allow admins to view/manage all notifications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications') THEN
        EXECUTE 'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;';
        
        -- Drop existing if exists
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;';
        
        -- Create new policy
        EXECUTE 'CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (public.luter_is_admin());';
    END IF;
END $$;
