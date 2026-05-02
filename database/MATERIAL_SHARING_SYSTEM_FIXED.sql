-- Material Sharing System Database Schema (FIXED VERSION)
-- Run this in your Supabase SQL editor

-- First, drop existing tables if they exist with different schemas
DROP TABLE IF EXISTS material_from_share CASCADE;
DROP TABLE IF EXISTS material_share_access CASCADE;
DROP TABLE IF EXISTS material_shares CASCADE;

-- Table for public sharing links
CREATE TABLE material_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NULL, -- NULL means no expiration
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    signup_count INTEGER DEFAULT 0, -- Number of users who signed up and added this material
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT material_shares_unique_material_user UNIQUE (material_id, shared_by_user_id)
);

-- Table to track who accessed shared materials
CREATE TABLE material_share_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    share_id UUID NOT NULL REFERENCES material_shares(id) ON DELETE CASCADE,
    accessed_by_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous users
    ip_address INET NULL,
    user_agent TEXT NULL,
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN ('view', 'download', 'signup')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track materials added from shares
CREATE TABLE material_from_share (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    share_id UUID NOT NULL REFERENCES material_shares(id) ON DELETE CASCADE,
    original_material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    new_material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    added_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT material_from_share_unique UNIQUE (share_id, added_by_user_id)
);

-- Function to generate unique share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    token_exists BOOLEAN;
BEGIN
    LOOP
        token := encode(gen_random_bytes(16), 'hex');
        SELECT EXISTS(SELECT 1 FROM material_shares WHERE share_token = token) INTO token_exists;
        IF NOT token_exists THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function to create a share for a material
CREATE OR REPLACE FUNCTION create_material_share(
    p_material_id UUID,
    p_user_id UUID,
    p_is_public BOOLEAN DEFAULT true,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_share_id UUID;
    v_share_token TEXT;
BEGIN
    -- Check if share already exists
    SELECT id INTO v_share_id 
    FROM material_shares 
    WHERE material_id = p_material_id AND shared_by_user_id = p_user_id;
    
    IF v_share_id IS NOT NULL THEN
        -- Update existing share
        UPDATE material_shares 
        SET is_public = p_is_public,
            expires_at = p_expires_at,
            updated_at = NOW()
        WHERE id = v_share_id;
        RETURN v_share_id;
    ELSE
        -- Create new share
        v_share_token := generate_share_token();
        INSERT INTO material_shares (
            material_id, 
            shared_by_user_id, 
            share_token, 
            is_public, 
            expires_at
        ) VALUES (
            p_material_id, 
            p_user_id, 
            v_share_token, 
            p_is_public, 
            p_expires_at
        ) RETURNING id INTO v_share_id;
        RETURN v_share_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get material by share token
CREATE OR REPLACE FUNCTION get_material_by_share_token(p_share_token TEXT)
RETURNS TABLE (
    share_id UUID,
    material_id UUID,
    title TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size BIGINT,
    description TEXT,
    processing_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    shared_by_name TEXT,
    is_public BOOLEAN,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.id,
        m.id,
        m.title,
        m.file_name,
        m.type,
        m.file_size,
        m.description,
        m.processing_status,
        m.created_at,
        COALESCE(u.raw_user_meta_data->>'name', u.email, 'Anonymous') as shared_by_name,
        ms.is_public,
        ms.expires_at
    FROM material_shares ms
    JOIN materials m ON ms.material_id = m.id
    JOIN auth.users u ON ms.shared_by_user_id = u.id
    WHERE ms.share_token = p_share_token
    AND (ms.expires_at IS NULL OR ms.expires_at > NOW())
    AND ms.is_public = true;
END;
$$ LANGUAGE plpgsql;

-- Function to record share access
CREATE OR REPLACE FUNCTION record_share_access(
    p_share_id UUID,
    p_access_type VARCHAR(50),
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO material_share_access (
        share_id, 
        accessed_by_user_id, 
        ip_address, 
        user_agent, 
        access_type
    ) VALUES (
        p_share_id, 
        p_user_id, 
        p_ip_address, 
        p_user_agent, 
        p_access_type
    );
    
    -- Update counters
    IF p_access_type = 'view' THEN
        UPDATE material_shares SET view_count = view_count + 1 WHERE id = p_share_id;
    ELSIF p_access_type = 'download' THEN
        UPDATE material_shares SET download_count = download_count + 1 WHERE id = p_share_id;
    ELSIF p_access_type = 'signup' THEN
        UPDATE material_shares SET signup_count = signup_count + 1 WHERE id = p_share_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add material from share to user's collection
CREATE OR REPLACE FUNCTION add_material_from_share(
    p_share_id UUID,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_original_material_id UUID;
    v_new_material_id UUID;
    v_already_exists BOOLEAN;
BEGIN
    -- Get original material
    SELECT material_id INTO v_original_material_id
    FROM material_shares
    WHERE id = p_share_id;
    
    IF v_original_material_id IS NULL THEN
        RAISE EXCEPTION 'Share not found';
    END IF;
    
    -- Check if user already added this material from this share
    SELECT EXISTS(SELECT 1 FROM material_from_share 
                  WHERE share_id = p_share_id AND added_by_user_id = p_user_id) 
    INTO v_already_exists;
    
    IF v_already_exists THEN
        RAISE EXCEPTION 'Material already added from this share';
    END IF;
    
    -- Copy material to user's collection
    INSERT INTO materials (
        user_id,
        title,
        file_name,
        type,
        file_size,
        description,
        processing_status,
        file_path,
        created_at,
        updated_at
    )
    SELECT 
        p_user_id,
        title,
        file_name,
        type,
        file_size,
        description,
        processing_status,
        file_path,
        NOW(),
        NOW()
    FROM materials
    WHERE id = v_original_material_id
    RETURNING id INTO v_new_material_id;
    
    -- Record that material was added from share
    INSERT INTO material_from_share (
        share_id,
        original_material_id,
        new_material_id,
        added_by_user_id
    ) VALUES (
        p_share_id,
        v_original_material_id,
        v_new_material_id,
        p_user_id
    );
    
    -- Record signup access
    PERFORM record_share_access(p_share_id, 'signup', p_user_id);
    
    RETURN v_new_material_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_shares_material_id ON material_shares(material_id);
CREATE INDEX IF NOT EXISTS idx_material_shares_shared_by_user_id ON material_shares(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_material_shares_share_token ON material_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_material_shares_is_public ON material_shares(is_public);
CREATE INDEX IF NOT EXISTS idx_material_shares_expires_at ON material_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_material_share_access_share_id ON material_share_access(share_id);
CREATE INDEX IF NOT EXISTS idx_material_share_access_accessed_by_user_id ON material_share_access(accessed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_material_share_access_created_at ON material_share_access(created_at);

CREATE INDEX IF NOT EXISTS idx_material_from_share_share_id ON material_from_share(share_id);
CREATE INDEX IF NOT EXISTS idx_material_from_share_added_by_user_id ON material_from_share(added_by_user_id);

-- Row Level Security (RLS)
ALTER TABLE material_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_share_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_from_share ENABLE ROW LEVEL SECURITY;

-- RLS Policies for material_shares
CREATE POLICY "Users can view their own material shares" ON material_shares
    FOR SELECT USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can insert their own material shares" ON material_shares
    FOR INSERT WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can update their own material shares" ON material_shares
    FOR UPDATE USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete their own material shares" ON material_shares
    FOR DELETE USING (auth.uid() = shared_by_user_id);

-- RLS Policies for material_share_access
CREATE POLICY "Users can view access for their shares" ON material_share_access
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM material_shares 
            WHERE id = share_id AND shared_by_user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert access records" ON material_share_access
    FOR INSERT WITH CHECK (true); -- Allow anonymous access tracking

-- RLS Policies for material_from_share
CREATE POLICY "Users can view materials they added from shares" ON material_from_share
    FOR SELECT USING (auth.uid() = added_by_user_id);

CREATE POLICY "Users can view materials from their shares" ON material_from_share
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM material_shares 
            WHERE id = share_id AND shared_by_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own material from share records" ON material_from_share
    FOR INSERT WITH CHECK (auth.uid() = added_by_user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON material_shares TO authenticated;
GRANT SELECT ON material_shares TO anon;
GRANT ALL ON material_share_access TO authenticated;
GRANT INSERT ON material_share_access TO anon;
GRANT SELECT ON material_share_access TO anon;
GRANT ALL ON material_from_share TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION generate_share_token() TO authenticated;
GRANT EXECUTE ON FUNCTION create_material_share(UUID, UUID, BOOLEAN, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_material_by_share_token(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION record_share_access(UUID, VARCHAR(50), UUID, INET, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_material_from_share(UUID, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Material sharing system created successfully!';
    RAISE NOTICE 'Tables: material_shares, material_share_access, material_from_share';
    RAISE NOTICE 'Functions: create_material_share, get_material_by_share_token, record_share_access, add_material_from_share';
    RAISE NOTICE 'Ready to use!';
END $$;
