-- ==============================================================================
-- SHARED ADMIN SSO & DATABASE POLICY FIX
-- ==============================================================================
-- Run this script in your Supabase SQL Editor once to set up the shared admin.
-- This allows passcode-based login (242424) across 7-10 devices simultaneously.
-- ==============================================================================

-- 1. Ensure public.profiles table has role and is_admin columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Create recursion-free luter_is_admin() helper function
CREATE OR REPLACE FUNCTION public.luter_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin' OR is_admin = true) INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execute permissions to standard roles
GRANT EXECUTE ON FUNCTION public.luter_is_admin() TO authenticated, anon;

-- 3. Create the shared admin user in auth.users if not exists
-- Username / Email: admin@luter.app
-- Password: luteradmin242424
INSERT INTO auth.users (
  id, 
  instance_id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  created_at, 
  updated_at, 
  role, 
  confirmation_token, 
  recovery_token, 
  email_change_token_new, 
  email_change,
  is_super_admin
)
VALUES (
  'd0000000-0000-0000-0000-000000000001', -- Fixed admin UUID
  '00000000-0000-0000-0000-000000000000',
  'admin@luter.app',
  '$2a$10$yAafrfyjnowxYODiGSPy0uPzLbgitpNz/SHvl5qOJlcGz6291BhcS', -- Pre-hashed bcrypt password
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  'authenticated',
  '',
  '',
  '',
  '',
  false
) ON CONFLICT (id) DO UPDATE
SET encrypted_password = EXCLUDED.encrypted_password;

-- 4. Associate the user with authentication identities
DELETE FROM auth.identities WHERE user_id = 'd0000000-0000-0000-0000-000000000001';

INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'd0000000-0000-0000-0000-000000000001', 'email', 'admin@luter.app'),
  'email',
  now(),
  now(),
  now()
);

-- 5. Promote the shared admin profile to database-level administrator
INSERT INTO public.profiles (
  id, 
  role, 
  is_admin, 
  full_name, 
  onboarding_complete,
  updated_at
)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'admin',
  true,
  'Shared Admin Account',
  true,
  now()
) ON CONFLICT (id) DO UPDATE
SET role = 'admin', is_admin = true;

-- 6. Apply RLS policies to allow admins full read/write on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.luter_is_admin());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.luter_is_admin());

-- 7. Add select policy for payment transactions to allow admins to view all sales
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payment_transactions') THEN
        EXECUTE 'ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all transactions" ON public.payment_transactions;';
        EXECUTE 'CREATE POLICY "Admins can view all transactions" ON public.payment_transactions FOR SELECT USING (public.luter_is_admin());';
    END IF;
END $$;

-- 8. Add select policy for notifications to allow admins to view/manage all notifications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications') THEN
        EXECUTE 'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;';
        EXECUTE 'CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (public.luter_is_admin());';
    END IF;
END $$;
