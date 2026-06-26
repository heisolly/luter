-- Migration for Luter Classroom features: Scheduling, Rubrics, and Originality Reports

-- 1. Add scheduling columns
ALTER TABLE public.class_announcements ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone DEFAULT NULL;
ALTER TABLE public.class_assignments ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone DEFAULT NULL;

-- 2. Add rubric columns
ALTER TABLE public.class_assignments ADD COLUMN IF NOT EXISTS rubric jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.class_submissions ADD COLUMN IF NOT EXISTS rubric_grades jsonb DEFAULT '{}'::jsonb;

-- 3. Add originality report column
ALTER TABLE public.class_submissions ADD COLUMN IF NOT EXISTS originality_report jsonb DEFAULT NULL;
