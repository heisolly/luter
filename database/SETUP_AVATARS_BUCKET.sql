-- =============================================================
-- FIX AVATARS BUCKET — clear MIME restrictions + RLS
-- Run in Supabase SQL Editor
-- =============================================================

-- 1. Clear MIME restrictions (this is the fix)
UPDATE storage.buckets SET allowed_mime_types = NULL WHERE id = 'avatars';

-- 2. Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated delete" ON storage.objects;

-- 3. RLS policies
CREATE POLICY "Avatar public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Avatar authenticated update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Avatar authenticated delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Verify
SELECT id, name, public, allowed_mime_types FROM storage.buckets WHERE id = 'avatars';
