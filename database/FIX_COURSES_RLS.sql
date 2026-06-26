-- ==============================================================================
-- FIX COURSES TABLE RLS FOR CUSTOM FOLDERS
-- ==============================================================================
-- Run this script in your Supabase SQL Editor to allow authenticated users
-- to create custom folders (which inserts a row into the courses table).
-- ==============================================================================

-- 1. Ensure RLS is enabled on the courses table
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow authenticated users to insert custom folders
-- Custom folders are marked with source_type = 'user_folder'
DROP POLICY IF EXISTS "Users can insert custom folders" ON public.courses;
CREATE POLICY "Users can insert custom folders" ON public.courses
    FOR INSERT TO authenticated
    WITH CHECK (source_type = 'user_folder');

-- 3. Ensure users can update their custom folders (if needed, e.g. for naming/archiving)
DROP POLICY IF EXISTS "Users can update own custom folders" ON public.courses;
CREATE POLICY "Users can update own custom folders" ON public.courses
    FOR UPDATE TO authenticated
    USING (source_type = 'user_folder')
    WITH CHECK (source_type = 'user_folder');
