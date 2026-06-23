-- ==============================================================================
-- DATABASE SECURITY HARDENING & LINTER WARNINGS FIX
-- ==============================================================================

-- 1. SET EXPLICIT SEARCH PATH ON PUBLIC FUNCTIONS
-- Resolves "function_search_path_mutable" warnings by preventing search path hijacking.
ALTER FUNCTION public.add_material_from_share(p_share_id uuid, p_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_create_semester_weeks() SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_tag_material_context() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_ai_suggestion_cache() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_material_share(p_material_id uuid, p_user_id uuid, p_is_public boolean, p_expires_at timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_personal_workspace(user_uuid uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_semester_weeks(course_uuid uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_heist_code() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_share_token() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_course_statistics(course_uuid uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_course_suggestions(p_university_slug text, p_department_slug text, p_level text, p_semester text, p_limit integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_material_by_share_token(p_share_token text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_student_materials(student_user_id uuid, include_shared boolean) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_education_level(user_uuid uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.heist_room_code_trigger() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.join_classroom_by_code(user_uuid uuid, class_code text) SET search_path = public, pg_temp;
ALTER FUNCTION public.luter_make_share_code() SET search_path = public, pg_temp;
ALTER FUNCTION public.protect_profile_sensitive_columns() SET search_path = public, pg_temp;
ALTER FUNCTION public.record_share_access(p_share_id uuid, p_access_type character varying, p_user_id uuid, p_ip_address inet, p_user_agent text) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_battle_spectator_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_conversion_job() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_deck_sessions_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_peer_suggestion_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_pricing_config_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_profile_subscription() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_team_member_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

-- Set search path on remaining public schema functions
ALTER FUNCTION public.luter_is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.luter_join_shared_session(code text) SET search_path = public, pg_temp;
ALTER FUNCTION public.luter_user_in_deck_session(target_session_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.luter_user_in_study_group(target_group_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.apply_freemium_locking(p_user_id uuid, p_course_ids uuid[]) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_enhanced_course_suggestions(p_user_id uuid, p_context_matrix_id uuid, p_limit integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_or_create_context_matrix(p_country text, p_university_slug text, p_university_name text, p_department_slug text, p_department_name text, p_education_level text, p_level text, p_semester text, p_academic_year text) SET search_path = public, pg_temp;
ALTER FUNCTION public.process_scraped_course(p_scraped_course_id uuid, p_context_matrix_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_ai_curriculum(p_education_level text, p_subject_name text, p_grade_level text, p_university text, p_department text, p_course_code text, p_country text, p_template_type text) SET search_path = public, pg_temp;


-- 2. RESTRICT PUBLIC STORAGE SELECT POLICIES (PREVENT DIRECTORY LISTING)
-- Resolves "public_bucket_allows_listing" warnings by scoping SELECT access to own files.
-- Public HTTP access remains fully operational, but bulk folder listing via client SDK is secured.

-- For avatars:
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- For materials:
DROP POLICY IF EXISTS "Allow authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read materials" ON storage.objects;
CREATE POLICY "Authenticated users can read own materials" ON storage.objects FOR SELECT 
USING (bucket_id = 'materials' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- For admin_audio:
DROP POLICY IF EXISTS "Allow authenticated read admin_audio" ON storage.objects;
CREATE POLICY "Allow authenticated read own admin_audio" ON storage.objects FOR SELECT 
USING (bucket_id = 'admin_audio' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- For study-materials:
DROP POLICY IF EXISTS "Authenticated users can read study-materials" ON storage.objects;
CREATE POLICY "Authenticated users can read own study-materials" ON storage.objects FOR SELECT 
USING (bucket_id = 'study-materials' AND (auth.uid())::text = (storage.foldername(name))[1]);


-- 3. SECURE SECURITY DEFINER FUNCTIONS (RESTRICT ANON EXECUTION)
-- Resolves "anon_security_definer_function_executable" warnings.

-- Revoke execute on all functions from PUBLIC and anon roles
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- Grant execute on all functions to authenticated role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Explicitly grant execute on necessary RLS/public-facing helper functions back to anon
GRANT EXECUTE ON FUNCTION public.luter_is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.can_access_course(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_material_by_share_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.record_share_access(uuid, character varying, uuid, inet, text) TO anon;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon;

-- Explicitly keep sensitive admin functions revoked
REVOKE EXECUTE ON FUNCTION public.create_standalone_admin(text, text, text, text, text, text) FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.verify_standalone_admin_credential(text, text) FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.log_standalone_admin_activity(uuid, text, text, uuid, jsonb, jsonb, jsonb, inet, text, text) FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.reset_daily_credits() FROM PUBLIC, authenticated, anon;
