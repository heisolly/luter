-- 20260703163000_notifications_unified.sql

-- 1. Create the notification_type enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('panel', 'popup_modal', 'admin_broadcast');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Alter the existing notifications table
-- We rename 'body' to 'message' (if it exists) to match the new schema gracefully
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'body') THEN
        ALTER TABLE public.notifications RENAME COLUMN body TO message;
    END IF;
END $$;

-- 3. Add missing columns safely
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS type text DEFAULT 'panel',
    ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Note: We are keeping `type` as text instead of casting to the enum strictly, 
-- to prevent potential data loss or casting errors with existing data ('admin_broadcast' etc).
-- The frontend will handle 'panel' vs 'popup_modal' gracefully.

-- 4. Turn on RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to prevent conflicts, then create new ones
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- 6. Enable Realtime for the notifications table
-- We must add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
