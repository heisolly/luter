-- ============================================
-- Knowledge Heist — Social Deduction Learning Game Schema
-- ============================================

-- 1. ROOMS
CREATE TABLE IF NOT EXISTS heist_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT 'General',
    difficulty TEXT NOT NULL DEFAULT 'medium', -- easy, medium, hard
    max_players INTEGER NOT NULL DEFAULT 8,
    status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, finished, cancelled
    integrity INTEGER NOT NULL DEFAULT 100, -- team health meter 0-100
    current_round INTEGER NOT NULL DEFAULT 0,
    current_phase TEXT DEFAULT NULL, -- task, discussion, voting, ended
    winner TEXT DEFAULT NULL, -- agents, thieves, null (unfinished)
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PARTICIPANTS (players in a room)
CREATE TABLE IF NOT EXISTS heist_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES heist_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_name TEXT DEFAULT NULL,
    role TEXT NOT NULL DEFAULT 'agent', -- agent, thief
    is_alive BOOLEAN NOT NULL DEFAULT TRUE,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    score INTEGER NOT NULL DEFAULT 0,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    has_voted_this_round BOOLEAN NOT NULL DEFAULT FALSE,
    sabotage_uses INTEGER NOT NULL DEFAULT 2, -- how many times thief can sabotage
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (room_id, user_id)
);

-- 3. ROUNDS (each match loop)
CREATE TABLE IF NOT EXISTS heist_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES heist_rooms(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    phase TEXT NOT NULL DEFAULT 'task', -- task, discussion, voting, ended
    phase_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phase_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    integrity_at_start INTEGER NOT NULL DEFAULT 100,
    questions_generated JSONB DEFAULT '[]', -- per-player question sets
    evidence_cards JSONB DEFAULT '[]', -- generated evidence for discussion
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. VOTES
CREATE TABLE IF NOT EXISTS heist_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID REFERENCES heist_rounds(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES heist_participants(id) ON DELETE CASCADE,
    target_id UUID REFERENCES heist_participants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(round_id, voter_id)
);

-- 5. CHAT MESSAGES (in-game text chat)
CREATE TABLE IF NOT EXISTS heist_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES heist_rooms(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES heist_participants(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SESSIONS (post-game learning reports)
CREATE TABLE IF NOT EXISTS heist_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES heist_rooms(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT,
    difficulty TEXT,
    role TEXT,
    result TEXT, -- won, lost, eliminated
    questions_attempted INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    accuracy NUMERIC(5,2) DEFAULT 0,
    topics_practiced TEXT[] DEFAULT '{}',
    strength_areas TEXT[] DEFAULT '{}',
    weak_areas TEXT[] DEFAULT '{}',
    learning_recommendations TEXT[] DEFAULT '{}',
    awards JSONB DEFAULT '[]', -- [{type, label}]
    session_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PLAYER ANSWERS (for evidence + reports)
CREATE TABLE IF NOT EXISTS heist_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID REFERENCES heist_rounds(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES heist_participants(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    player_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    is_sabotaged BOOLEAN NOT NULL DEFAULT FALSE,
    time_spent_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_heist_rooms_code ON heist_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_heist_rooms_status ON heist_rooms(status);
CREATE INDEX IF NOT EXISTS idx_heist_participants_room ON heist_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_heist_participants_user ON heist_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_heist_rounds_room ON heist_rounds(room_id);
CREATE INDEX IF NOT EXISTS idx_heist_votes_round ON heist_votes(round_id);
CREATE INDEX IF NOT EXISTS idx_heist_chat_room ON heist_chat(room_id);
CREATE INDEX IF NOT EXISTS idx_heist_sessions_user ON heist_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_heist_answers_round ON heist_answers(round_id);
CREATE INDEX IF NOT EXISTS idx_heist_answers_participant ON heist_answers(participant_id);

-- RLS Policies (rooms readable by participants, writable by creator)
ALTER TABLE heist_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE heist_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE heist_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE heist_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE heist_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE heist_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE heist_answers ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to create rooms
CREATE POLICY heist_rooms_insert ON heist_rooms
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow participants to read their rooms
CREATE POLICY heist_rooms_select ON heist_rooms
    FOR SELECT TO authenticated USING (true);

-- Allow creators and participants to update their rooms (needed for integrity updates by players)
CREATE POLICY heist_rooms_update ON heist_rooms
    FOR UPDATE TO authenticated USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM heist_participants p
            WHERE p.room_id = heist_rooms.id AND p.user_id = auth.uid()
        )
    );

-- Participants: insert for self
CREATE POLICY heist_participants_insert ON heist_participants
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Participants: select all in room
CREATE POLICY heist_participants_select ON heist_participants
    FOR SELECT TO authenticated USING (true);

-- Allow participants to update own record, and hosts to update all participants in their room (for role assignment / elimination)
CREATE POLICY heist_participants_update ON heist_participants
    FOR UPDATE TO authenticated USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM heist_rooms r
            WHERE r.id = heist_participants.room_id AND r.created_by = auth.uid()
        )
    );

-- Rounds: select for participants
CREATE POLICY heist_rounds_select ON heist_rounds
    FOR SELECT TO authenticated USING (true);

-- Rounds: insert/update for room creators
CREATE POLICY heist_rounds_insert ON heist_rounds
    FOR INSERT TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM heist_rooms WHERE id = heist_rounds.room_id AND created_by = auth.uid()
    ));

-- Rounds: update for room creators
CREATE POLICY heist_rounds_update ON heist_rounds
    FOR UPDATE TO authenticated USING (EXISTS (
        SELECT 1 FROM heist_rooms WHERE id = heist_rounds.room_id AND created_by = auth.uid()
    ));

-- Votes: insert own vote
CREATE POLICY heist_votes_insert ON heist_votes
    FOR INSERT TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM heist_participants p WHERE p.id = heist_votes.voter_id AND p.user_id = auth.uid()
    ));

-- Votes: select in room
CREATE POLICY heist_votes_select ON heist_votes
    FOR SELECT TO authenticated USING (true);

-- Chat: insert own messages or system messages sent by the host
CREATE POLICY heist_chat_insert ON heist_chat
    FOR INSERT TO authenticated WITH CHECK (
        (participant_id IS NULL AND EXISTS (
            SELECT 1 FROM heist_rooms r WHERE r.id = heist_chat.room_id AND r.created_by = auth.uid()
        )) OR
        EXISTS (
            SELECT 1 FROM heist_participants p WHERE p.id = heist_chat.participant_id AND p.user_id = auth.uid()
        )
    );

-- Chat: select in room
CREATE POLICY heist_chat_select ON heist_chat
    FOR SELECT TO authenticated USING (true);

-- Sessions: own only
CREATE POLICY heist_sessions_select ON heist_sessions
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Sessions: insert own
CREATE POLICY heist_sessions_insert ON heist_sessions
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Answers: insert own
CREATE POLICY heist_answers_insert ON heist_answers
    FOR INSERT TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM heist_participants p WHERE p.id = heist_answers.participant_id AND p.user_id = auth.uid()
    ));

-- Answers: select in room
CREATE POLICY heist_answers_select ON heist_answers
    FOR SELECT TO authenticated USING (true);

-- Function to generate unique room code
CREATE OR REPLACE FUNCTION generate_heist_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
        SELECT EXISTS(SELECT 1 FROM heist_rooms WHERE room_code = code) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate room code on insert if not provided
CREATE OR REPLACE FUNCTION heist_room_code_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.room_code IS NULL OR NEW.room_code = '' THEN
        NEW.room_code := generate_heist_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_heist_room_code ON heist_rooms;
CREATE TRIGGER trg_heist_room_code
    BEFORE INSERT ON heist_rooms
    FOR EACH ROW
    EXECUTE FUNCTION heist_room_code_trigger();

-- ============================================
-- Enable Supabase Realtime on all heist tables
-- (Required for postgres_changes subscriptions to work)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE heist_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE heist_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE heist_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE heist_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE heist_chat;