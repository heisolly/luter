-- =====================================================
-- STANDALONE ADMIN SYSTEM (FIXED VERSION)
-- =====================================================
-- Complete standalone admin system - no user accounts required
-- Run this entire script in Supabase SQL editor

-- =====================================================
-- 1. DROP EXISTING TABLES (Clean Slate)
-- =====================================================

DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admin_activity_log CASCADE;
DROP TABLE IF EXISTS admin_tasks CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;

-- =====================================================
-- 2. ADMIN ROLES TABLE (Create First)
-- =====================================================

CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1, -- 1=highest, 5=lowest
    permissions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ADMIN USERS TABLE
-- =====================================================

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    credential VARCHAR(50) NOT NULL, -- Admin access code
    role_id UUID NOT NULL REFERENCES admin_roles(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- =====================================================
-- 4. ADMIN SESSIONS TABLE
-- =====================================================

CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- 5. ADMIN ACTIVITY LOG TABLE
-- =====================================================

CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- 6. ADMIN TASKS TABLE
-- =====================================================

CREATE TABLE admin_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    assigned_to UUID REFERENCES admin_users(id),
    assigned_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    tags TEXT[],
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    completion_notes TEXT
);

-- =====================================================
-- 7. ADMIN NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_users(id), -- Nullable for system-wide notifications
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 8. INSERT ADMIN ROLES (All Admins Have Full Access)
-- =====================================================

INSERT INTO admin_roles (name, display_name, description, level, permissions) VALUES
('admin', 'Administrator', 'Full system access - all administrators have complete control', 1, 
 '["users:read", "users:write", "users:delete", "courses:read", "courses:write", "courses:delete", "enrollments:read", "enrollments:write", "notifications:read", "notifications:write", "system:read", "system:write", "admin:read", "admin:write", "admin:delete", "audit:read", "tasks:read", "tasks:write", "tasks:assign", "materials:read", "materials:write", "syllabus:read", "syllabus:write", "analytics:read", "reports:read", "support:read", "support:write", "content:moderate"]');

-- =====================================================
-- 9. INSERT ADMIN USERS (Specific Admins Requested)
-- =====================================================

INSERT INTO admin_users (username, full_name, email, credential, role_id, notes) VALUES
('dm6121652', 'Admin User 1', 'dm6121652@gmail.com', '1U3@CoO', (SELECT id FROM admin_roles WHERE name = 'admin'), 'System administrator with full access'),
('popooladavid800', 'Admin User 2', 'popooladavid800@gmail.com', '1U3@cTo', (SELECT id FROM admin_roles WHERE name = 'admin'), 'System administrator with full access');

-- =====================================================
-- 10. CREATE FUNCTIONS
-- =====================================================

-- Function to verify standalone admin credentials
CREATE OR REPLACE FUNCTION verify_standalone_admin_credential(
    username_param TEXT,
    credential_param TEXT
) RETURNS TABLE (
    admin_id UUID,
    full_name TEXT,
    role_name TEXT,
    permissions JSONB,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id as admin_id,
        au.full_name,
        ar.name as role_name,
        ar.permissions,
        (au.credential = credential_param AND au.is_active = true) as is_valid
    FROM admin_users au
    JOIN admin_roles ar ON au.role_id = ar.id
    WHERE au.username = username_param 
    AND au.is_active = true 
    AND ar.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_standalone_admin_activity(
    admin_user_id UUID,
    action_param TEXT,
    resource_type_param TEXT,
    resource_id_param UUID,
    old_values_param JSONB,
    new_values_param JSONB,
    metadata_param JSONB,
    ip_address_param INET,
    user_agent_param TEXT,
    session_id_param TEXT
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO admin_activity_log (
        admin_user_id, action, resource_type, resource_id, 
        old_values, new_values, metadata, ip_address, user_agent, session_id
    ) VALUES (
        admin_user_id, action_param, resource_type_param, resource_id_param,
        old_values_param, new_values_param, metadata_param, ip_address_param, user_agent_param, session_id_param
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function to avoid parameter name conflicts
DROP FUNCTION IF EXISTS create_standalone_admin(text,text,text,text,text,text);

-- Function to create standalone admin user
CREATE OR REPLACE FUNCTION create_standalone_admin(
    username_param TEXT,
    full_name_param TEXT,
    email_param TEXT,
    credential_param TEXT,
    role_name_param TEXT,
    notes_param TEXT
) RETURNS UUID AS $$
DECLARE
    role_id UUID;
    admin_id UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_id FROM admin_roles WHERE name = role_name_param AND is_active = true;
    
    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist or is not active', role_name_param;
    END IF;
    
    -- Create admin user
    INSERT INTO admin_users (username, full_name, email, credential, role_id, notes)
    VALUES (username_param, full_name_param, email_param, credential_param, role_id, notes_param)
    RETURNING id INTO admin_id;
    
    RETURN admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. CREATE INDEXES
-- =====================================================

CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);
CREATE INDEX idx_admin_users_role ON admin_users(role_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_admin ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_activity_admin ON admin_activity_log(admin_user_id);
CREATE INDEX idx_admin_activity_timestamp ON admin_activity_log(timestamp);
CREATE INDEX idx_admin_tasks_assigned ON admin_tasks(assigned_to);
CREATE INDEX idx_admin_tasks_status ON admin_tasks(status);
CREATE INDEX idx_admin_notifications_user ON admin_notifications(admin_user_id);

-- =====================================================
-- 12. CREATE VIEWS
-- =====================================================

-- View for admin users with roles
CREATE VIEW standalone_admin_users_view AS
SELECT 
    au.id,
    au.username,
    au.full_name,
    au.email,
    au.is_active,
    au.last_login,
    au.created_at,
    ar.name as role_name,
    ar.display_name as role_display,
    ar.level as role_level,
    ar.permissions
FROM admin_users au
JOIN admin_roles ar ON au.role_id = ar.id
WHERE ar.is_active = true;

-- View for admin tasks with assignee info
CREATE VIEW standalone_admin_tasks_view AS
SELECT 
    t.*,
    assignee.full_name as assigned_to_name,
    assigner.full_name as assigned_by_name
FROM admin_tasks t
LEFT JOIN admin_users assignee ON t.assigned_to = assignee.id
LEFT JOIN admin_users assigner ON t.assigned_by = assigner.id;

-- =====================================================
-- 13. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample admin tasks
INSERT INTO admin_tasks (title, description, task_type, priority, assigned_by, due_date, estimated_hours) VALUES
('Review new course submissions', 'Review and approve 5 pending course submissions', 'content_review', 'high', 
 (SELECT id FROM admin_users WHERE username = 'dm6121652'), NOW() + INTERVAL '3 days', 4),
('Update user documentation', 'Update admin user documentation with new features', 'system_maintenance', 'medium',
 (SELECT id FROM admin_users WHERE username = 'popooladavid800'), NOW() + INTERVAL '1 week', 8),
('Analyze user engagement metrics', 'Generate monthly user engagement report', 'data_analysis', 'medium',
 (SELECT id FROM admin_users WHERE username = 'dm6121652'), NOW() + INTERVAL '5 days', 6),
('Moderate reported content', 'Review 3 reported user content items', 'content_moderation', 'urgent',
 (SELECT id FROM admin_users WHERE username = 'popooladavid800'), NOW() + INTERVAL '1 day', 2);

-- Insert sample admin notifications
INSERT INTO admin_notifications (admin_user_id, title, message, notification_type, metadata) VALUES
((SELECT id FROM admin_users WHERE username = 'dm6121652'), 'New course submission', 'A new course "Advanced Mathematics" has been submitted for review', 'info', '{"course_id": "sample-id"}'),
((SELECT id FROM admin_users WHERE username = 'popooladavid800'), 'System maintenance scheduled', 'System maintenance is scheduled for tonight at 2 AM UTC', 'warning', '{"maintenance_time": "2024-01-15T02:00:00Z"}'),
(NULL, 'User registration spike', 'User registrations have increased by 50% this week', 'success', '{"metric": "registrations", "increase": 50}');

-- =====================================================
-- 14. ENABLE RLS AND POLICIES
-- =====================================================

-- Enable RLS on admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin users policies - only super admins can manage admin users
CREATE POLICY "Super admin can manage admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            JOIN admin_roles ar ON au.role_id = ar.id 
            WHERE au.id = auth.uid() 
            AND ar.name = 'super_admin' 
            AND au.is_active = true
        )
    );

-- Admin sessions policies
CREATE POLICY "Admins can manage their sessions" ON admin_sessions
    FOR ALL USING (admin_user_id = auth.uid());

-- Admin activity log policies
CREATE POLICY "Admins can view activity log" ON admin_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            JOIN admin_roles ar ON au.role_id = ar.id 
            WHERE au.id = auth.uid() 
            AND ar.level <= 2 
            AND au.is_active = true
        )
    );

-- Admin tasks policies
CREATE POLICY "Admins can view tasks" ON admin_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.id = auth.uid() 
            AND au.is_active = true
        )
    );

-- Admin notifications policies
CREATE POLICY "Admins can manage their notifications" ON admin_notifications
    FOR ALL USING (admin_user_id = auth.uid() OR admin_user_id IS NULL);

-- =====================================================
-- 15. COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'STANDALONE ADMIN SYSTEM SETUP COMPLETE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin Login Credentials:';
    RAISE NOTICE 'Admin 1: username=dm6121652, credential=1U3@CoO';
    RAISE NOTICE 'Admin 2: username=popooladavid800, credential=1U3@cTo';
    RAISE NOTICE '';
    RAISE NOTICE 'System Features:';
    RAISE NOTICE '- Standalone authentication (no user accounts required)';
    RAISE NOTICE '- Username + credential login system';
    RAISE NOTICE '- Full admin access for all administrators';
    RAISE NOTICE '- Task assignment and tracking';
    RAISE NOTICE '- Activity logging and audit trails';
    RAISE NOTICE '- Admin notifications';
    RAISE NOTICE '- Session management';
    RAISE NOTICE '';
    RAISE NOTICE 'Your admin system is ready to use!';
    RAISE NOTICE 'Navigate to /admin and login with the credentials above.';
    RAISE NOTICE 'All admins have full system access.';
    RAISE NOTICE '=====================================================';
END $$;
