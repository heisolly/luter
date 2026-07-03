-- ==========================================
-- UPDATE RPC TO SUPPORT SPECIFIC USERS
-- ==========================================

DROP FUNCTION IF EXISTS public.get_target_emails(text);

CREATE OR REPLACE FUNCTION public.get_target_emails(p_audience_filter TEXT, p_specific_user_ids UUID[] DEFAULT NULL)
RETURNS SETOF TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow admins to use this function
    IF NOT public.luter_is_admin() THEN
        RAISE EXCEPTION 'Not authorized to fetch target emails';
    END IF;

    IF p_audience_filter = 'active' THEN
        RETURN QUERY
        SELECT au.email::TEXT
        FROM auth.users au
        JOIN public.profiles p ON p.id = au.id
        WHERE p.last_active_at >= (now() - interval '30 days')
        AND au.email IS NOT NULL;
        
    ELSIF p_audience_filter = 'admins_only' THEN
        RETURN QUERY
        SELECT au.email::TEXT
        FROM auth.users au
        JOIN public.profiles p ON p.id = au.id
        WHERE (p.role = 'admin' OR p.is_admin = true)
        AND au.email IS NOT NULL;
        
    ELSIF p_audience_filter = 'specific' THEN
        IF p_specific_user_ids IS NULL OR array_length(p_specific_user_ids, 1) IS NULL THEN
            RETURN;
        END IF;
        
        RETURN QUERY
        SELECT email::TEXT
        FROM auth.users
        WHERE id = ANY(p_specific_user_ids)
        AND email IS NOT NULL;

    ELSE
        -- Default: all users
        RETURN QUERY
        SELECT email::TEXT
        FROM auth.users
        WHERE email IS NOT NULL;
    END IF;
END;
$$;
