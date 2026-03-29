-- Shared syllabus map (NERD/JAMB/portal/templates + crowd pioneers).
-- Run after your base schema that defines auth.users and public.profiles.

CREATE TABLE IF NOT EXISTS public.curriculum_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_slug text NOT NULL,
  university_name text NOT NULL,
  department_slug text NOT NULL,
  department_label text NOT NULL,
  level text NOT NULL,
  semester text NOT NULL,
  source text NOT NULL DEFAULT 'template',
  courses jsonb NOT NULL DEFAULT '[]'::jsonb,
  contributor_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT curriculum_offers_source_chk CHECK (
    source = ANY (ARRAY['nerd','jamb','portal','template','crowd','ai_baseline','merged'])
  ),
  CONSTRAINT curriculum_offers_unique_slot UNIQUE (university_slug, department_slug, level, semester)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_offers_lookup
  ON public.curriculum_offers (university_slug, department_slug, level, semester);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS curriculum_context jsonb;

ALTER TABLE public.curriculum_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_offers_select_all" ON public.curriculum_offers;
CREATE POLICY "curriculum_offers_select_all"
  ON public.curriculum_offers FOR SELECT USING (true);

DROP POLICY IF EXISTS "curriculum_offers_insert_authenticated" ON public.curriculum_offers;
CREATE POLICY "curriculum_offers_insert_authenticated"
  ON public.curriculum_offers FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "curriculum_offers_update_authenticated" ON public.curriculum_offers;
CREATE POLICY "curriculum_offers_update_authenticated"
  ON public.curriculum_offers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed: University of Lagos · Computer Science · 100L · 1st (instant cards in onboarding)
INSERT INTO public.curriculum_offers (
  university_slug, university_name, department_slug, department_label,
  level, semester, source, courses
) VALUES (
  'unilag',
  'University of Lagos',
  'computer-science',
  'Computer Science',
  '100',
  '1st',
  'template',
  '[
    {"code":"CSC101","name":"Introduction to Computer Science"},
    {"code":"MTH101","name":"Elementary Mathematics I"},
    {"code":"PHY101","name":"General Physics I"},
    {"code":"CHM101","name":"General Chemistry I"},
    {"code":"BIO101","name":"General Biology I"},
    {"code":"GST111","name":"Communication in English"},
    {"code":"GST113","name":"Nigerian Peoples and Culture"},
    {"code":"STA111","name":"Introduction to Statistics"}
  ]'::jsonb
) ON CONFLICT (university_slug, department_slug, level, semester) DO NOTHING;
