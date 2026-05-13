-- =============================================
--   NOTIFICATION SYSTEM
-- =============================================

-- Notification types enumeration
CREATE TYPE notification_type AS ENUM (
    'level_up',
    'friend_request',
    'friend_accepted',
    'game_invite',
    'streak_lost',
    'streak_milestone',
    'achievement_unlocked',
    'session_shared',
    'material_completed',
    'admin_announcement',
    'welcome',
    'system_update'
);

-- Priority levels
CREATE TYPE notification_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

-- Main notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    priority notification_priority DEFAULT 'medium',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data like level, friend info, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Auto-delete after certain time
    action_url TEXT, -- URL to navigate to when clicked
    action_text TEXT -- Text for action button
);

-- Notification settings per user
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    notification_types JSONB DEFAULT '{}', -- User preferences per type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin notification management
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    priority notification_priority DEFAULT 'medium',
    target_audience JSONB, -- Who should receive this (all, premium, specific_users, etc.)
    data JSONB,
    action_url TEXT,
    action_text TEXT,
    is_scheduled BOOLEAN DEFAULT FALSE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own notifications
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Users can insert their own notifications (system will handle this)
CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification settings RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification settings" ON notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Admin notifications RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can manage admin notifications
CREATE POLICY "Admins can manage admin notifications" ON admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = admin_id 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Functions for notification management

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_priority notification_priority DEFAULT 'medium',
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}',
    p_action_url TEXT DEFAULT NULL,
    p_action_text TEXT DEFAULT NULL,
    p_expires_hours INTEGER DEFAULT 168 -- 1 week default
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;
    
    INSERT INTO notifications (
        user_id, type, priority, title, message, data, 
        action_url, action_text, expires_at
    ) VALUES (
        p_user_id, p_type, p_priority, p_title, p_message, 
        p_data, p_action_url, p_action_text, v_expires_at
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications 
    WHERE user_id = p_user_id 
    AND is_read = FALSE 
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN v_count;
END;
$$;

-- Function to create level up notification
CREATE OR REPLACE FUNCTION create_level_up_notification(
    p_user_id UUID,
    p_new_level INTEGER,
    p_old_level INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    v_notification_id := create_notification(
        p_user_id := p_user_id,
        p_type := 'level_up',
        p_priority := 'high',
        p_title := 'Level Up! 🎉',
        p_message := 'Congratulations! You reached level ' || p_new_level || '!',
        p_data := jsonb_build_object(
            'new_level', p_new_level,
            'old_level', p_old_level
        ),
        p_action_url := '/dashboard/level',
        p_action_text := 'View Progress'
    );
    
    RETURN v_notification_id;
END;
$$;

-- Function to create streak notifications
CREATE OR REPLACE FUNCTION create_streak_notification(
    p_user_id UUID,
    p_streak_type TEXT, -- 'lost' or 'milestone'
    p_streak_count INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_title TEXT;
    v_message TEXT;
    v_priority notification_priority;
BEGIN
    IF p_streak_type = 'lost' THEN
        v_title := 'Streak Lost 😔';
        v_message := 'Your study streak has ended. Start studying again to build a new one!';
        v_priority := 'medium';
    ELSIF p_streak_type = 'milestone' THEN
        v_title := 'Streak Milestone! 🔥';
        v_message := 'Amazing! You''ve maintained a ' || p_streak_count || '-day streak!';
        v_priority := 'high';
    END IF;
    
    v_notification_id := create_notification(
        p_user_id := p_user_id,
        p_type := 'streak_' || p_streak_type,
        p_priority := v_priority,
        p_title := v_title,
        p_message := v_message,
        p_data := jsonb_build_object('streak_count', p_streak_count),
        p_action_url := '/dashboard',
        p_action_text := 'Keep Studying'
    );
    
    RETURN v_notification_id;
END;
$$;

-- Function to create friend request notification
CREATE OR REPLACE FUNCTION create_friend_request_notification(
    p_user_id UUID,
    p_friend_id UUID,
    p_friend_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    v_notification_id := create_notification(
        p_user_id := p_user_id,
        p_type := 'friend_request',
        p_priority := 'medium',
        p_title := 'New Friend Request 👋',
        p_message := p_friend_name || ' wants to be your friend!',
        p_data := jsonb_build_object(
            'friend_id', p_friend_id,
            'friend_name', p_friend_name
        ),
        p_action_url := '/dashboard/friends',
        p_action_text := 'View Request'
    );
    
    RETURN v_notification_id;
END;
$$;

-- Function to create welcome notification
CREATE OR REPLACE FUNCTION create_welcome_notification(
    p_user_id UUID,
    p_user_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    v_notification_id := create_notification(
        p_user_id := p_user_id,
        p_type := 'welcome',
        p_priority := 'high',
        p_title := 'Welcome to Luter! 🎓',
        p_message := 'Hi ' || p_user_name || '! Welcome to your learning journey. Let''s get started!',
        p_data := jsonb_build_object('is_welcome', true),
        p_action_url := '/dashboard',
        p_action_text := 'Get Started'
    );
    
    RETURN v_notification_id;
END;
$$;

-- Clean up expired notifications (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$;
