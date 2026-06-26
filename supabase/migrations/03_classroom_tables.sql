-- 1. Create Class Announcements Table
CREATE TABLE IF NOT EXISTS public.class_announcements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id uuid NOT NULL,
    author_id uuid,
    author_name text,
    author_initials text,
    content text NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb,
    comments jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Class Messages (Direct Messaging) Table
CREATE TABLE IF NOT EXISTS public.class_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    message_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Class Timetable Table
CREATE TABLE IF NOT EXISTS public.class_timetable (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id uuid NOT NULL,
    day_of_week integer NOT NULL, -- 1 = Monday, 5 = Friday, etc.
    start_time text NOT NULL,     -- e.g. "09:00"
    end_time text NOT NULL,       -- e.g. "10:30"
    subject text NOT NULL,
    room text
);

-- 4. Create Class Assignments Table
CREATE TABLE IF NOT EXISTS public.class_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    due_date timestamp with time zone,
    points integer DEFAULT 100,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Create Class Submissions Table
CREATE TABLE IF NOT EXISTS public.class_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    student_name text NOT NULL,
    submission_text text,
    attachments jsonb DEFAULT '[]'::jsonb,
    grade text,
    private_feedback text,
    turned_in_at timestamp with time zone DEFAULT now()
);

-- 6. Create Class Muted Students Table
CREATE TABLE IF NOT EXISTS public.class_muted_students (
    class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    muted_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (class_id, student_id)
);

-- 7. Create Class Group Messages Table
CREATE TABLE IF NOT EXISTS public.class_group_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    sender_name text NOT NULL,
    sender_initials text,
    message_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.class_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_muted_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_group_messages ENABLE ROW LEVEL SECURITY;

-- Disable restrict rules for public access to simplify testing/setup
DROP POLICY IF EXISTS "Allow public read access to class announcements" ON public.class_announcements;
CREATE POLICY "Allow public read access to class announcements" ON public.class_announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to class announcements" ON public.class_announcements;
CREATE POLICY "Allow public insert access to class announcements" ON public.class_announcements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to class announcements" ON public.class_announcements;
CREATE POLICY "Allow public update access to class announcements" ON public.class_announcements FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to class announcements" ON public.class_announcements;
CREATE POLICY "Allow public delete access to class announcements" ON public.class_announcements FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to class messages" ON public.class_messages;
CREATE POLICY "Allow public read access to class messages" ON public.class_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to class messages" ON public.class_messages;
CREATE POLICY "Allow public insert access to class messages" ON public.class_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to class timetable" ON public.class_timetable;
CREATE POLICY "Allow public read access to class timetable" ON public.class_timetable FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to class timetable" ON public.class_timetable;
CREATE POLICY "Allow public insert access to class timetable" ON public.class_timetable FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access to class timetable" ON public.class_timetable;
CREATE POLICY "Allow public delete access to class timetable" ON public.class_timetable FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to class assignments" ON public.class_assignments;
CREATE POLICY "Allow public read access to class assignments" ON public.class_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to class assignments" ON public.class_assignments;
CREATE POLICY "Allow public insert access to class assignments" ON public.class_assignments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to class assignments" ON public.class_assignments;
CREATE POLICY "Allow public update access to class assignments" ON public.class_assignments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to class assignments" ON public.class_assignments;
CREATE POLICY "Allow public delete access to class assignments" ON public.class_assignments FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to class submissions" ON public.class_submissions;
CREATE POLICY "Allow public read access to class submissions" ON public.class_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to class submissions" ON public.class_submissions;
CREATE POLICY "Allow public insert access to class submissions" ON public.class_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to class submissions" ON public.class_submissions;
CREATE POLICY "Allow public update access to class submissions" ON public.class_submissions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to class submissions" ON public.class_submissions;
CREATE POLICY "Allow public delete access to class submissions" ON public.class_submissions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to class muted students" ON public.class_muted_students;
CREATE POLICY "Allow public read access to class muted students" ON public.class_muted_students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to class muted students" ON public.class_muted_students;
CREATE POLICY "Allow public insert access to class muted students" ON public.class_muted_students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to class group messages" ON public.class_group_messages;
CREATE POLICY "Allow public read access to class group messages" ON public.class_group_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to class group messages" ON public.class_group_messages;
CREATE POLICY "Allow public insert access to class group messages" ON public.class_group_messages FOR INSERT WITH CHECK (true);

-- Member Management Role Settings for Owners/Teachers
CREATE OR REPLACE FUNCTION public.luter_is_teacher_or_owner_of_session(target_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.deck_sessions ds
        WHERE ds.id = target_session_id
          AND ds.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.deck_session_members dsm
        WHERE dsm.session_id = target_session_id
          AND dsm.user_id = auth.uid()
          AND dsm.role IN ('owner', 'teacher')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Allow teachers and owners to manage members" ON public.deck_session_members;
CREATE POLICY "Allow teachers and owners to manage members" ON public.deck_session_members
    FOR ALL
    USING (
        luter_is_teacher_or_owner_of_session(session_id)
    )
    WITH CHECK (
        luter_is_teacher_or_owner_of_session(session_id)
    );

-- Enable Realtime Safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'class_announcements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE class_announcements;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'class_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE class_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'class_timetable'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE class_timetable;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'class_assignments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE class_assignments;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'class_submissions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE class_submissions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'class_muted_students'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE class_muted_students;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'class_group_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE class_group_messages;
    END IF;
END $$;

