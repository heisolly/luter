-- Syllabus Manager: faculty, syllabus_id, draft/live workflow, tighter RLS.
-- Requires public.luter_is_admin() from 001_admin_rls.sql

ALTER TABLE public.curriculum_offers
  ADD COLUMN IF NOT EXISTS faculty text NOT NULL DEFAULT '';

ALTER TABLE public.curriculum_offers
  ADD COLUMN IF NOT EXISTS syllabus_id text;

ALTER TABLE public.curriculum_offers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

ALTER TABLE public.curriculum_offers
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.curriculum_offers
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.curriculum_offers DROP CONSTRAINT IF EXISTS curriculum_offers_status_chk;
ALTER TABLE public.curriculum_offers
  ADD CONSTRAINT curriculum_offers_status_chk CHECK (status IN ('draft', 'live'));

-- Backfill existing published rows (from migration 002) so onboarding keeps working
UPDATE public.curriculum_offers
SET
  status = 'live',
  faculty = CASE WHEN faculty = '' THEN 'Science' ELSE faculty END,
  syllabus_id =
    upper(regexp_replace(university_slug, '[^a-zA-Z0-9]', '', 'g'))
    || '_'
    || upper(substr(regexp_replace(replace(department_slug, '-', ''), '[^a-zA-Z0-9]', '', 'g'), 1, 6))
    || '_'
    || level::text
    || '_'
    || CASE semester WHEN '2nd' THEN 'S2' ELSE 'S1' END
WHERE syllabus_id IS NULL OR syllabus_id = '';

ALTER TABLE public.curriculum_offers ALTER COLUMN syllabus_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS curriculum_offers_syllabus_id_key
  ON public.curriculum_offers (syllabus_id);

-- RLS: students see only Live; admins see/manage all; peers may insert Draft crowd maps
DROP POLICY IF EXISTS "curriculum_offers_select_all" ON public.curriculum_offers;
DROP POLICY IF EXISTS "curriculum_offers_insert_authenticated" ON public.curriculum_offers;
DROP POLICY IF EXISTS "curriculum_offers_update_authenticated" ON public.curriculum_offers;

CREATE POLICY "curriculum_select_live" ON public.curriculum_offers
  FOR SELECT USING (status = 'live');

CREATE POLICY "curriculum_select_admin" ON public.curriculum_offers
  FOR SELECT USING (public.luter_is_admin());

DROP POLICY IF EXISTS "luter_admin_curriculum_all" ON public.curriculum_offers;
CREATE POLICY "luter_admin_curriculum_all" ON public.curriculum_offers
  FOR ALL
  USING (public.luter_is_admin())
  WITH CHECK (public.luter_is_admin());

CREATE POLICY "curriculum_crowd_insert" ON public.curriculum_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT public.luter_is_admin()
    AND status = 'draft'
    AND contributor_id IS NOT NULL
    AND contributor_id = auth.uid()
  );

CREATE POLICY "curriculum_crowd_update" ON public.curriculum_offers
  FOR UPDATE TO authenticated
  USING (
    NOT public.luter_is_admin()
    AND contributor_id = auth.uid()
    AND status = 'draft'
  )
  WITH CHECK (
    contributor_id = auth.uid()
    AND status = 'draft'
  );
