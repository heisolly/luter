-- =====================================================
-- FIX RPC PERMISSIONS FOR UNIVERSAL COURSE SYSTEM
-- =====================================================

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;

-- Grant execute permissions for authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_context_matrix TO authenticated;
GRANT EXECUTE ON FUNCTION process_scraped_course TO authenticated;
GRANT EXECUTE ON FUNCTION get_enhanced_course_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION apply_freemium_locking TO authenticated;

-- Also grant to service role for admin operations
GRANT EXECUTE ON FUNCTION get_or_create_context_matrix TO service_role;
GRANT EXECUTE ON FUNCTION process_scraped_course TO service_role;
GRANT EXECUTE ON FUNCTION get_enhanced_course_suggestions TO service_role;
GRANT EXECUTE ON FUNCTION apply_freemium_locking TO service_role;

-- Enable RPC for these functions
ALTER FUNCTION get_or_create_context_matrix SECURITY DEFINER;
ALTER FUNCTION process_scraped_course SECURITY DEFINER;
ALTER FUNCTION get_enhanced_course_suggestions SECURITY DEFINER;
ALTER FUNCTION apply_freemium_locking SECURITY DEFINER;

-- Reset search path for security
ALTER FUNCTION get_or_create_context_matrix RESET SEARCH_PATH;
ALTER FUNCTION process_scraped_course RESET SEARCH_PATH;
ALTER FUNCTION get_enhanced_course_suggestions RESET SEARCH_PATH;
ALTER FUNCTION apply_freemium_locking RESET SEARCH_PATH;

-- Recreate the trigger
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
