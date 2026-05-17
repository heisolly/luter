-- =====================================================
-- LUTER SESSION SHARING + COLLABORATION MIGRATION
-- Adds shareable/group study sessions on top of deck_sessions.
-- Safe to run more than once.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Study group tables are used by the app already. Create the baseline if a
-- fresh database does not have them yet.
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#7C3AED',
    emoji TEXT DEFAULT '📚',
    invite_code TEXT UNIQUE DEFAULT lower(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'teacher', 'student')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

ALTER TABLE deck_sessions
    ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES study_groups(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS collaboration_room_id TEXT,
    ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'solo'
      CHECK (session_type IN ('solo', 'group', 'teacher'));

CREATE TABLE IF NOT EXISTS deck_session_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES deck_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'student' CHECK (role IN ('owner', 'teacher', 'student', 'peer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_deck_sessions_group ON deck_sessions(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deck_sessions_share_code ON deck_sessions(share_code) WHERE share_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deck_session_members_user ON deck_session_members(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_session_members_session ON deck_session_members(session_id);

ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_session_members ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION luter_make_share_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    LOOP
        code := lower(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM deck_sessions WHERE share_code = code
        );
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION luter_user_in_study_group(target_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM study_group_members
        WHERE group_id = target_group_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION luter_user_in_deck_session(target_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM deck_session_members
        WHERE session_id = target_session_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION luter_join_shared_session(code TEXT)
RETURNS deck_sessions AS $$
DECLARE
    session_row deck_sessions;
BEGIN
    SELECT *
    INTO session_row
    FROM deck_sessions
    WHERE share_code = lower(trim(code))
      AND is_active = TRUE
      AND is_shared = TRUE;

    IF session_row.id IS NULL THEN
        RAISE EXCEPTION 'Shared session not found';
    END IF;

    INSERT INTO deck_session_members (session_id, user_id, role)
    VALUES (session_row.id, auth.uid(), 'peer')
    ON CONFLICT (session_id, user_id)
    DO UPDATE SET last_seen_at = NOW();

    RETURN session_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Study group RLS
DROP POLICY IF EXISTS "Study group members can view their groups" ON study_groups;
CREATE POLICY "Study group members can view their groups" ON study_groups
    FOR SELECT USING (created_by = auth.uid() OR luter_user_in_study_group(id));

DROP POLICY IF EXISTS "Users can create study groups" ON study_groups;
CREATE POLICY "Users can create study groups" ON study_groups
    FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Study group admins can update groups" ON study_groups;
CREATE POLICY "Study group admins can update groups" ON study_groups
    FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM study_group_members
            WHERE group_id = id AND user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

DROP POLICY IF EXISTS "Study group creators can delete groups" ON study_groups;
CREATE POLICY "Study group creators can delete groups" ON study_groups
    FOR DELETE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Members can view group membership" ON study_group_members;
CREATE POLICY "Members can view group membership" ON study_group_members
    FOR SELECT USING (user_id = auth.uid() OR luter_user_in_study_group(group_id));

DROP POLICY IF EXISTS "Users can join study groups" ON study_group_members;
CREATE POLICY "Users can join study groups" ON study_group_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own group membership" ON study_group_members;
CREATE POLICY "Users can update own group membership" ON study_group_members
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave study groups" ON study_group_members;
CREATE POLICY "Users can leave study groups" ON study_group_members
    FOR DELETE USING (user_id = auth.uid());

-- Extend deck_sessions RLS for shared/group sessions.
DROP POLICY IF EXISTS "Users can view own deck sessions" ON deck_sessions;
CREATE POLICY "Users can view own deck sessions" ON deck_sessions
    FOR SELECT USING (
        auth.uid() = user_id
        OR luter_user_in_deck_session(id)
        OR (group_id IS NOT NULL AND luter_user_in_study_group(group_id))
    );

DROP POLICY IF EXISTS "Users can insert own deck sessions" ON deck_sessions;
CREATE POLICY "Users can insert own deck sessions" ON deck_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND (group_id IS NULL OR luter_user_in_study_group(group_id))
    );

DROP POLICY IF EXISTS "Users can update own deck sessions" ON deck_sessions;
CREATE POLICY "Users can update own deck sessions" ON deck_sessions
    FOR UPDATE USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM deck_session_members
            WHERE session_id = id
              AND user_id = auth.uid()
              AND role IN ('owner', 'teacher')
        )
    );

DROP POLICY IF EXISTS "Users can delete own deck sessions" ON deck_sessions;
CREATE POLICY "Users can delete own deck sessions" ON deck_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Session members can view each other" ON deck_session_members;
CREATE POLICY "Session members can view each other" ON deck_session_members
    FOR SELECT USING (user_id = auth.uid() OR luter_user_in_deck_session(session_id));

DROP POLICY IF EXISTS "Users can join shared sessions" ON deck_session_members;
CREATE POLICY "Users can join shared sessions" ON deck_session_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own session membership" ON deck_session_members;
CREATE POLICY "Users can update own session membership" ON deck_session_members
    FOR UPDATE USING (user_id = auth.uid());

-- Backfill collaboration ids for existing sessions.
UPDATE deck_sessions
SET collaboration_room_id = 'luter-session-' || id::text
WHERE collaboration_room_id IS NULL;

-- Ensure owners are also listed as session members for shared sessions.
INSERT INTO deck_session_members (session_id, user_id, role)
SELECT id, user_id, 'owner'
FROM deck_sessions
WHERE user_id IS NOT NULL
ON CONFLICT (session_id, user_id) DO NOTHING;

