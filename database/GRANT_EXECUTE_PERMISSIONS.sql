-- ==============================================================================
-- GRANT EXECUTE PERMISSIONS ON PUBLIC SCHEMA FUNCTIONS TO AUTHENTICATED AND ANON
-- ==============================================================================

-- 1. Grant execute on all functions in schema public to authenticated and anon
-- This restores standard Supabase behavior where normal users can invoke RPCs and RLS policies
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- 2. Explicitly revoke execute on sensitive/admin functions from PUBLIC, authenticated, and anon
-- This ensures only postgres and service_role can perform admin creations and operations
REVOKE EXECUTE ON FUNCTION public.create_standalone_admin(text, text, text, text, text, text) FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.verify_standalone_admin_credential(text, text) FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.log_standalone_admin_activity(uuid, text, text, uuid, jsonb, jsonb, jsonb, inet, text, text) FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.reset_daily_credits() FROM PUBLIC, authenticated, anon;

-- Ensure service_role and postgres keep their execute permissions on sensitive functions
GRANT EXECUTE ON FUNCTION public.create_standalone_admin(text, text, text, text, text, text) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.verify_standalone_admin_credential(text, text) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.log_standalone_admin_activity(uuid, text, text, uuid, jsonb, jsonb, jsonb, inet, text, text) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.reset_daily_credits() TO postgres, service_role;
