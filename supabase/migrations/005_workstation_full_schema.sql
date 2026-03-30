-- ============================================================
-- 005: Full Workstation Schema
-- materials: add course_id, source_url, extracted_text, owner_role, processing_status
-- study_sessions: track last_opened_material, highlights, context
-- user_notes (scrapbook/vault saves)
-- RLS for all new columns/tables
-- ============================================================

-- 1. Extend materials table
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS extracted_text text,
  ADD COLUMN IF NOT EXISTS owner_role text NOT NULL DEFAULT 'user'
    CHECK (owner_role IN ('admin','user')),
  ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending','processing','ready','error')),
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.materials
  DROP CONSTRAINT IF EXISTS materials_type_chk;
ALTER TABLE public.materials
  ADD CONSTRAINT materials_type_chk
  CHECK (type IN ('pdf','youtube','docx','ppt','note','image','text'));

CREATE INDEX IF NOT EXISTS idx_materials_course_id ON public.materials(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON public.materials(user_id);

-- 2. study_sessions table
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  last_opened_material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  last_opened_at timestamptz DEFAULT now(),
  highlights jsonb DEFAULT '[]'::jsonb,
  scroll_position jsonb DEFAULT '{}'::jsonb,
  context_snapshot text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT study_sessions_unique_user_course UNIQUE (user_id, course_id)
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_course ON public.study_sessions(user_id, course_id);

CREATE POLICY "users_own_study_sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_study_sessions_all" ON public.study_sessions
  FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

-- 3. user_notes (AI Scrapbook / Vault saves)
CREATE TABLE IF NOT EXISTS public.user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  title text,
  content text NOT NULL,
  source_type text DEFAULT 'ai' CHECK (source_type IN ('ai','manual','highlight')),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON public.user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_course_id ON public.user_notes(course_id);

CREATE POLICY "users_own_user_notes" ON public.user_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_user_notes_all" ON public.user_notes
  FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

-- 4. RLS for materials
DROP POLICY IF EXISTS "users_own_materials" ON public.materials;
DROP POLICY IF EXISTS "admin_materials_all" ON public.materials;
DROP POLICY IF EXISTS "public_admin_materials_read" ON public.materials;

CREATE POLICY "users_own_materials" ON public.materials
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_materials_all" ON public.materials
  FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

CREATE POLICY "enrolled_users_read_admin_materials" ON public.materials
  FOR SELECT USING (
    owner_role = 'admin'
    AND course_id IN (
      SELECT course_id FROM public.user_courses WHERE user_id = auth.uid()
    )
  );

-- 5. Upsert helper for study_sessions
CREATE OR REPLACE FUNCTION public.upsert_study_session(
  p_user_id uuid, p_course_id uuid,
  p_material_id uuid DEFAULT NULL,
  p_highlights jsonb DEFAULT NULL,
  p_scroll_position jsonb DEFAULT NULL,
  p_context_snapshot text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.study_sessions (
    user_id, course_id, last_opened_material_id,
    last_opened_at, highlights, scroll_position, context_snapshot, updated_at
  ) VALUES (
    p_user_id, p_course_id, p_material_id, now(),
    COALESCE(p_highlights, '[]'::jsonb),
    COALESCE(p_scroll_position, '{}'::jsonb),
    p_context_snapshot, now()
  )
  ON CONFLICT (user_id, course_id) DO UPDATE SET
    last_opened_material_id = COALESCE(EXCLUDED.last_opened_material_id, study_sessions.last_opened_material_id),
    last_opened_at = now(),
    highlights = CASE WHEN p_highlights IS NOT NULL THEN EXCLUDED.highlights ELSE study_sessions.highlights END,
    scroll_position = CASE WHEN p_scroll_position IS NOT NULL THEN EXCLUDED.scroll_position ELSE study_sessions.scroll_position END,
    context_snapshot = CASE WHEN p_context_snapshot IS NOT NULL THEN EXCLUDED.context_snapshot ELSE study_sessions.context_snapshot END,
    updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_study_session FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_study_session TO authenticated;

-- 6. Touch last_studied trigger
CREATE OR REPLACE FUNCTION public.touch_last_studied()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.user_courses SET last_studied_at = now()
  WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_last_studied ON public.study_sessions;
CREATE TRIGGER trg_touch_last_studied
  AFTER INSERT OR UPDATE ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_last_studied();
