-- RELAX materials_type_chk to allow modern web resources and documents
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_type_chk;

ALTER TABLE materials ADD CONSTRAINT materials_type_chk 
CHECK (type IN (
  'pdf', 
  'pptx', 
  'docx', 
  'doc', 
  'ppt', 
  'anki', 
  'video', 
  'audio', 
  'image', 
  'website', 
  'google_doc', 
  'youtube', 
  'note',
  'link'
));

-- Ensure user_notes table exists and is tagged for week-based organization
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    week_number INTEGER DEFAULT 1,
    source_type TEXT DEFAULT 'personal', -- 'personal', 'lecture_transcript', etc.
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for user_notes
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own notes" ON user_notes;
CREATE POLICY "Users can manage their own notes"
ON public.user_notes FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- Ensure materials table has week_number
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'materials' AND COLUMN_NAME = 'week_number') THEN
        ALTER TABLE materials ADD COLUMN week_number INTEGER DEFAULT 1;
    END IF;
END $$;
