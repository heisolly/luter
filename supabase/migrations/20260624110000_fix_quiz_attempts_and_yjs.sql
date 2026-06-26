-- Drop foreign key constraint on quiz_attempts.material_id to allow classId (from classes/rooms table)
ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_material_id_fkey;

-- Update RLS policy for yjs_documents to allow public access (both anon and authenticated)
-- This avoids initial session loading/restoration race condition 403 Forbidden errors
DROP POLICY IF EXISTS "Allow authenticated access to yjs_documents" ON public.yjs_documents;

CREATE POLICY "Allow public access to yjs_documents"
  ON public.yjs_documents
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
