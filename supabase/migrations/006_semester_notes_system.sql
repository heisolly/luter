-- ============================================================
-- 006: Semester Notes System
-- Enhanced notes management with week structure, requests, and AI features
-- ============================================================

-- 1. Create semester_weeks table for structured week management
CREATE TABLE IF NOT EXISTS public.semester_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number >= 1 AND week_number <= 16),
  title text NOT NULL,
  description text,
  learning_objectives text[],
  is_published boolean DEFAULT false,
  materials_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT semester_weeks_unique_course_week UNIQUE (course_id, week_number)
);

ALTER TABLE public.semester_weeks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_semester_weeks_course_id ON public.semester_weeks(course_id);

-- RLS policies for semester_weeks
CREATE POLICY "users_read_enrolled_semester_weeks" ON public.semester_weeks
  FOR SELECT USING (
    course_id IN (
      SELECT course_id FROM public.user_courses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_full_semester_weeks" ON public.semester_weeks
  FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

-- 2. Create notes_requests table for user requests
CREATE TABLE IF NOT EXISTS public.notes_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  week_number integer CHECK (week_number >= 1 AND week_number <= 16),
  subject text NOT NULL,
  topic text,
  urgency text DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notes_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notes_requests_user_id ON public.notes_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_requests_course_id ON public.notes_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_notes_requests_status ON public.notes_requests(status);

-- RLS policies for notes_requests
CREATE POLICY "users_own_notes_requests" ON public.notes_requests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_full_notes_requests" ON public.notes_requests
  FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

-- 3. Add week_number to materials table if not exists
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS week_number integer CHECK (week_number >= 1 AND week_number <= 16);

-- Update materials to include week_number in metadata for existing records
UPDATE public.materials 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{week_number}',
  COALESCE((metadata->>'week_number')::text, '1')::jsonb
)
WHERE metadata->>'week_number' IS NOT NULL;

-- 4. Create ai_generated_notes table for AI-powered content
CREATE TABLE IF NOT EXISTS public.ai_generated_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number >= 1 AND week_number <= 16),
  note_type text NOT NULL CHECK (note_type IN ('summary', 'key_points', 'study_guide', 'quiz', 'flashcards')),
  content jsonb NOT NULL,
  ai_model text DEFAULT 'gpt-4',
  generation_prompt text,
  quality_score numeric CHECK (quality_score >= 0 AND quality_score <= 100),
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_generated_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_generated_notes_course_week ON public.ai_generated_notes(course_id, week_number);
CREATE INDEX IF NOT EXISTS idx_ai_generated_notes_material_id ON public.ai_generated_notes(material_id);

-- RLS policies for ai_generated_notes
CREATE POLICY "users_read_enrolled_ai_notes" ON public.ai_generated_notes
  FOR SELECT USING (
    is_published = true AND
    course_id IN (
      SELECT course_id FROM public.user_courses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_full_ai_notes" ON public.ai_generated_notes
  FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

-- 5. Create function to auto-create semester weeks for new courses
CREATE OR REPLACE FUNCTION public.create_semester_weeks(course_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.semester_weeks (course_id, week_number, title, description, is_published)
  SELECT 
    course_uuid,
    generate_series,
    'Week ' || generate_series,
    'Learning materials and activities for week ' || generate_series,
    false
  FROM generate_series(1, 16) AS generate_series
  ON CONFLICT (course_id, week_number) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to auto-create weeks when course is added
CREATE OR REPLACE FUNCTION public.auto_create_semester_weeks()
RETURNS trigger AS $$
BEGIN
  PERFORM public.create_semester_weeks(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_course_create_semester_weeks ON public.courses;
CREATE TRIGGER on_course_create_semester_weeks
  AFTER INSERT ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_semester_weeks();

-- 7. Create view for course materials with week info
CREATE OR REPLACE VIEW public.course_materials_with_weeks AS
SELECT 
  m.*,
  COALESCE(m.week_number, COALESCE((m.metadata->>'week_number')::integer, 1)) as effective_week,
  sw.title as week_title,
  sw.is_published as week_published
FROM public.materials m
LEFT JOIN public.semester_weeks sw ON m.course_id = sw.course_id AND COALESCE(m.week_number, COALESCE((m.metadata->>'week_number')::integer, 1)) = sw.week_number;

-- 8. Add helper functions for admin dashboard
CREATE OR REPLACE FUNCTION public.get_course_statistics(course_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_materials', (SELECT COUNT(*) FROM public.materials WHERE course_id = course_uuid),
    'admin_materials', (SELECT COUNT(*) FROM public.materials WHERE course_id = course_uuid AND owner_role = 'admin'),
    'user_materials', (SELECT COUNT(*) FROM public.materials WHERE course_id = course_uuid AND owner_role = 'user'),
    'published_weeks', (SELECT COUNT(*) FROM public.semester_weeks WHERE course_id = course_uuid AND is_published = true),
    'pending_requests', (SELECT COUNT(*) FROM public.notes_requests WHERE course_id = course_uuid AND status = 'pending'),
    'enrolled_students', (SELECT COUNT(*) FROM public.user_courses WHERE course_id = course_uuid),
    'ai_notes_generated', (SELECT COUNT(*) FROM public.ai_generated_notes WHERE course_id = course_uuid AND is_published = true)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
