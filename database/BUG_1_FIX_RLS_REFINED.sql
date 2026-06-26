-- Fix for "new row violates row-level security policy for table 'courses'"
-- Drop the previous policy
DROP POLICY IF EXISTS "Users can create custom folders" ON public.courses;

-- Create the policy targeting the 'authenticated' role specifically
CREATE POLICY "Users can create custom folders" ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
  source_type = 'user_folder'
);

-- Ensure authenticated users can also select their own folders (if not already allowed)
DROP POLICY IF EXISTS "Users can view custom folders" ON public.courses;
CREATE POLICY "Users can view custom folders" ON public.courses
FOR SELECT
TO authenticated
USING (
  source_type = 'user_folder' OR is_active = true
);
