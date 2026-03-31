-- ============================================================
-- 007: Course-Program-Year-Semester Tagging System
-- Add course, program, academic_year, and semester tagging for cross-course sharing
-- ============================================================

-- 1. Add course, program, academic_year, and semester to materials table
ALTER TABLE public.materials
ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS academic_year text NOT NULL DEFAULT '2023/2024',
ADD COLUMN IF NOT EXISTS semester_number integer CHECK (semester_number >= 1 AND semester_number <= 8),
ADD COLUMN IF NOT EXISTS is_shared_across_program boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sharing_scope text DEFAULT 'course' CHECK (sharing_scope IN ('course', 'program', 'year', 'global'));

-- 2. Create programs table
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  faculty text,
  duration_years integer DEFAULT 4,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_programs_active ON public.programs(is_active);

-- RLS policies for programs
CREATE POLICY "public_read_programs" ON public.programs
  FOR SELECT USING (is_active = true);

CREATE POLICY "admin_full_programs" ON public.programs
  FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

-- 3. Update courses table to link to programs
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL;

-- 4. Update semester_weeks to include program and year context
ALTER TABLE public.semester_weeks
ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS academic_year text NOT NULL DEFAULT '2023/2024';

-- 5. Update notes_requests to include course, program, year, semester context
ALTER TABLE public.notes_requests
ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS academic_year text NOT NULL DEFAULT '2023/2024',
ADD COLUMN IF NOT EXISTS semester_number integer CHECK (semester_number >= 1 AND semester_number <= 8);

-- 6. Update ai_generated_notes to include course, program, year, semester context
ALTER TABLE public.ai_generated_notes
ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS academic_year text NOT NULL DEFAULT '2023/2024',
ADD COLUMN IF NOT EXISTS semester_number integer CHECK (semester_number >= 1 AND semester_number <= 8);

-- 7. Create material_shares table for tracking shared materials
CREATE TABLE IF NOT EXISTS public.material_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  shared_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  target_program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  target_academic_year text,
  share_type text NOT NULL DEFAULT 'cross_course' CHECK (share_type IN ('cross_course', 'cross_program', 'cross_year', 'global')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.material_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for material_shares
CREATE POLICY "users_read_shared_materials" ON public.material_shares
  FOR SELECT USING (
    is_active = true AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "admin_full_material_shares" ON public.material_shares
  FOR ALL USING (public.luter_is_admin()) WITH CHECK (public.luter_is_admin());

-- 8. Create enhanced view for materials with course-program-year-semester context
CREATE OR REPLACE VIEW public.materials_with_context AS
SELECT 
  m.*,
  c.name as course_name,
  c.code as course_code,
  p.name as program_name,
  p.code as program_code,
  m.academic_year,
  m.semester_number,
  COALESCE(m.week_number, COALESCE((m.metadata->>'week_number')::integer, 1)) as effective_week,
  sw.title as week_title,
  sw.is_published as week_published,
  CASE 
    WHEN m.is_shared_across_program = true THEN 'program'
    WHEN m.sharing_scope = 'year' THEN 'year'
    WHEN m.sharing_scope = 'global' THEN 'global'
    ELSE 'course'
  END as visibility_scope
FROM public.materials m
LEFT JOIN public.courses c ON m.course_id = c.id
LEFT JOIN public.programs p ON m.program_id = p.id
LEFT JOIN public.semester_weeks sw ON m.course_id = sw.course_id AND COALESCE(m.week_number, COALESCE((m.metadata->>'week_number')::integer, 1)) = sw.week_number;

-- 9. Create function to auto-tag materials with course-program-year-semester context
CREATE OR REPLACE FUNCTION public.auto_tag_material_context()
RETURNS trigger AS $$
BEGIN
  -- Auto-populate program from course if not provided
  IF NEW.program_id IS NULL THEN
    SELECT program_id INTO NEW.program_id
    FROM public.courses 
    WHERE id = NEW.course_id;
  END IF;
  
  -- Set default academic year if not provided
  IF NEW.academic_year IS NULL THEN
    NEW.academic_year := '2023/2024';
  END IF;
  
  -- Update sharing scope based on material type and owner
  IF NEW.owner_role = 'admin' AND NEW.is_shared_across_program = true THEN
    NEW.sharing_scope := 'program';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-tagging
DROP TRIGGER IF EXISTS on_material_insert_auto_tag ON public.materials;
CREATE TRIGGER on_material_insert_auto_tag
  BEFORE INSERT ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_tag_material_context();

-- 10. Create function to get materials for student based on their course-program-year-semester context
CREATE OR REPLACE FUNCTION public.get_student_materials(
  student_user_id uuid,
  include_shared boolean DEFAULT true
)
RETURNS TABLE (
  material_id uuid,
  title text,
  type text,
  course_code text,
  course_name text,
  program_code text,
  program_name text,
  academic_year text,
  semester_number integer,
  week_number integer,
  owner_role text,
  visibility_scope text,
  source_url text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    m.id as material_id,
    m.title,
    m.type,
    c.code as course_code,
    c.name as course_name,
    p.code as program_code,
    p.name as program_name,
    m.academic_year,
    m.semester_number,
    COALESCE(m.week_number, COALESCE((m.metadata->>'week_number')::integer, 1)) as week_number,
    m.owner_role,
    CASE 
      WHEN m.owner_role = 'admin' AND m.is_shared_across_program = true THEN 'program'
      WHEN m.sharing_scope = 'global' THEN 'global'
      WHEN m.sharing_scope = 'year' THEN 'year'
      ELSE 'course'
    END as visibility_scope,
    m.source_url,
    m.created_at
  FROM public.materials m
  LEFT JOIN public.courses c ON m.course_id = c.id
  LEFT JOIN public.programs p ON m.program_id = p.id
  WHERE (
    -- User's own course materials
    m.course_id IN (
      SELECT course_id FROM public.user_courses WHERE user_id = student_user_id
    )
    OR
    -- Admin materials shared across user's program
    (
      m.owner_role = 'admin' 
      AND m.is_shared_across_program = true 
      AND m.program_id IN (
        SELECT c.program_id 
        FROM public.user_courses uc 
        JOIN public.courses c ON uc.course_id = c.id 
        WHERE uc.user_id = student_user_id
      )
    )
    OR
    -- Year-shared materials
    (
      m.sharing_scope = 'year' 
      AND m.academic_year IN (
        SELECT DISTINCT m2.academic_year
        FROM public.materials m2
        WHERE m2.course_id IN (
          SELECT course_id FROM public.user_courses WHERE user_id = student_user_id
        )
      )
    )
    OR
    -- Global materials
    m.sharing_scope = 'global'
  )
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 11. Insert sample programs
INSERT INTO public.programs (name, code, description, faculty, duration_years) VALUES
('Computer Science', 'CS', 'Bachelor of Science in Computer Science', 'Engineering', 4),
('Electrical Engineering', 'EE', 'Bachelor of Engineering in Electrical Engineering', 'Engineering', 4),
('Mechanical Engineering', 'ME', 'Bachelor of Engineering in Mechanical Engineering', 'Engineering', 4),
('Business Administration', 'BBA', 'Bachelor of Business Administration', 'Business', 4),
('Medicine & Surgery', 'MBBS', 'Bachelor of Medicine, Bachelor of Surgery', 'Medicine', 6)
ON CONFLICT (code) DO NOTHING;

-- 12. Update existing courses to link to programs
UPDATE public.courses 
SET program_id = p.id 
FROM public.programs p 
WHERE p.code = 'CS' AND (
  code LIKE 'CSC%' OR 
  code LIKE 'CS%' OR 
  name ILIKE '%computer%' OR 
  name ILIKE '%programming%'
);

UPDATE public.courses 
SET program_id = p.id 
FROM public.programs p 
WHERE p.code = 'EE' AND (
  code LIKE 'EE%' OR 
  name ILIKE '%electrical%' OR 
  name ILIKE '%circuit%'
);

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_materials_program_year_semester ON public.materials(program_id, academic_year, semester_number);
CREATE INDEX IF NOT EXISTS idx_materials_sharing_scope ON public.materials(sharing_scope, is_shared_across_program);
CREATE INDEX IF NOT EXISTS idx_material_shares_target ON public.material_shares(target_course_id, target_program_id, target_academic_year);
