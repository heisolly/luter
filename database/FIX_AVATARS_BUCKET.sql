-- Run this in Supabase SQL Editor
-- This clears MIME restrictions on the avatars bucket

UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'avatars';

SELECT id, name, public, allowed_mime_types
FROM storage.buckets
WHERE id = 'avatars';
