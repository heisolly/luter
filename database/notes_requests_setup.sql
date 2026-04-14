-- Create notes_requests table
CREATE TABLE IF NOT EXISTS public.notes_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    subject TEXT,
    topic TEXT,
    urgency TEXT DEFAULT 'normal',
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Set up RLS
ALTER TABLE public.notes_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own requests"
ON public.notes_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
ON public.notes_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users within the same course can view requests"
ON public.notes_requests
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_courses
        WHERE user_courses.user_id = auth.uid()
        AND user_courses.course_id = public.notes_requests.course_id
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notes_requests_course_id ON public.notes_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_notes_requests_user_id ON public.notes_requests(user_id);
