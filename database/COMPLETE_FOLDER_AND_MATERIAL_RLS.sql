-- ==============================================================================
-- COMPLETE RLS POLICIES FOR COURSES, MATERIALS, AND STORAGE BUCKETS
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor to fix:
-- 1. Custom folder creation failures on the 'courses' table.
-- 2. Material upload failures on the 'materials' table.
-- 3. Material viewing failures (workspace rendering) due to Storage bucket and DB table permissions.
-- ==============================================================================

-- ==============================================================================
-- Part 1: public.courses Table Policies
-- ==============================================================================

-- 1. Enable RLS on public.courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to view standard courses, or custom folders they own
DROP POLICY IF EXISTS "Allow read access to all courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view courses" ON public.courses;
CREATE POLICY "Users can view courses" ON public.courses
    FOR SELECT TO authenticated
    USING (
        source_type != 'user_folder'
        OR id IN (
            SELECT course_id FROM public.user_courses WHERE user_id = auth.uid()
        )
    );

-- 3. Allow authenticated users to insert custom folders
DROP POLICY IF EXISTS "Users can insert custom folders" ON public.courses;
CREATE POLICY "Users can insert custom folders" ON public.courses
    FOR INSERT TO authenticated
    WITH CHECK (source_type = 'user_folder');

-- 4. Allow authenticated users to update their custom folders (e.g. rename or archive)
DROP POLICY IF EXISTS "Allow authenticated to update courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update own custom folders" ON public.courses;
CREATE POLICY "Users can update own custom folders" ON public.courses
    FOR UPDATE TO authenticated
    USING (source_type = 'user_folder')
    WITH CHECK (source_type = 'user_folder');


-- ==============================================================================
-- Part 2: public.materials Table Policies
-- ==============================================================================

-- 1. Enable RLS on public.materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to view materials they own, materials in courses
--    they are enrolled in, or materials shared publicly/course-wide
DROP POLICY IF EXISTS "Users can view own or shared materials" ON public.materials;
CREATE POLICY "Users can view own or shared materials" ON public.materials
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id 
        OR course_id IN (
            SELECT course_id FROM public.user_courses WHERE user_id = auth.uid()
        )
        OR sharing_scope IN ('public', 'course', 'program', 'year')
    );

-- 3. Allow authenticated users to insert their own materials
DROP POLICY IF EXISTS "Users can insert own materials" ON public.materials;
CREATE POLICY "Users can insert own materials" ON public.materials
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 4. Allow owners to update their own materials
DROP POLICY IF EXISTS "Only owners can update conversion metadata" ON public.materials;
DROP POLICY IF EXISTS "Users can update own materials" ON public.materials;
CREATE POLICY "Users can update own materials" ON public.materials
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Allow owners to delete their own materials
DROP POLICY IF EXISTS "Users can delete own materials" ON public.materials;
CREATE POLICY "Users can delete own materials" ON public.materials
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);


-- ==============================================================================
-- Part 3: storage.objects Table Policies (Supabase Storage)
-- ==============================================================================

-- Enable RLS on storage.objects (standard Supabase default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- A. Bucket: 'materials'
-- ----------------------------------------------------

-- Allow any authenticated user to view/download course materials
DROP POLICY IF EXISTS "Authenticated users can read own materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read all materials" ON storage.objects;
CREATE POLICY "Authenticated users can read all materials" ON storage.objects 
    FOR SELECT TO authenticated
    USING (bucket_id = 'materials');

-- Allow authenticated users to upload files to their own user folder inside materials bucket
DROP POLICY IF EXISTS "Authenticated users can upload own materials" ON storage.objects;
CREATE POLICY "Authenticated users can upload own materials" ON storage.objects 
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'materials' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update files in their own folder
DROP POLICY IF EXISTS "Authenticated users can update own materials" ON storage.objects;
CREATE POLICY "Authenticated users can update own materials" ON storage.objects 
    FOR UPDATE TO authenticated
    USING (bucket_id = 'materials' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete files in their own folder
DROP POLICY IF EXISTS "Authenticated users can delete own materials" ON storage.objects;
CREATE POLICY "Authenticated users can delete own materials" ON storage.objects 
    FOR DELETE TO authenticated
    USING (bucket_id = 'materials' AND (auth.uid())::text = (storage.foldername(name))[1]);


-- ----------------------------------------------------
-- B. Bucket: 'study-materials'
-- ----------------------------------------------------

-- Allow any authenticated user to view/download shared study materials
DROP POLICY IF EXISTS "Authenticated users can read own study-materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read all study-materials" ON storage.objects;
CREATE POLICY "Authenticated users can read all study-materials" ON storage.objects 
    FOR SELECT TO authenticated
    USING (bucket_id = 'study-materials');

-- Allow authenticated users to upload files to their own folder inside study-materials bucket
DROP POLICY IF EXISTS "Authenticated users can upload own study-materials" ON storage.objects;
CREATE POLICY "Authenticated users can upload own study-materials" ON storage.objects 
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'study-materials' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow owners to update/delete their own files in study-materials
DROP POLICY IF EXISTS "Authenticated users can update own study-materials" ON storage.objects;
CREATE POLICY "Authenticated users can update own study-materials" ON storage.objects 
    FOR UPDATE TO authenticated
    USING (bucket_id = 'study-materials' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can delete own study-materials" ON storage.objects;
CREATE POLICY "Authenticated users can delete own study-materials" ON storage.objects 
    FOR DELETE TO authenticated
    USING (bucket_id = 'study-materials' AND (auth.uid())::text = (storage.foldername(name))[1]);


-- ----------------------------------------------------
-- C. Bucket: 'avatars'
-- ----------------------------------------------------

-- Allow ANY user (even anonymous) to read profile avatars so they render on profiles, chat, leaderboards
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
CREATE POLICY "Avatar public read" ON storage.objects 
    FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to manage their own avatar
DROP POLICY IF EXISTS "Allow authenticated insert own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated insert own avatar" ON storage.objects 
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Allow authenticated update own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated update own avatar" ON storage.objects 
    FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Allow authenticated delete own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated delete own avatar" ON storage.objects 
    FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
