import { supabase } from '../supabaseClient'
import { normalizeCourseRow } from '../lib/curriculumSlugs'

/**
 * Service for managing user courses (the "Backpack")
 */
export const courseService = {
  /**
   * Fetch all courses for the current user
   */
  async fetchUserCourses(userId) {
    if (!userId) return { data: [], error: 'User ID required' }
    
    const { data, error } = await supabase
      .from('user_courses')
      .select('*, courses(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  /**
   * Enroll a user in a course. 
   * Handles both global course creation and user-course link.
   */
  async enrollCourse(userId, courseData) {
    if (!userId) return { error: 'User ID required' }
    
    const normalized = normalizeCourseRow(courseData)
    if (!normalized.code || !normalized.name) return { error: 'Invalid course data' }

    try {
      // 1. Ensure the course exists in the global 'courses' table
      const { data: globalCourse, error: courseError } = await supabase
        .from('courses')
        .upsert({
          code: normalized.code,
          name: normalized.name,
          faculty: courseData.faculty || 'General'
        }, { onConflict: 'code' })
        .select()
        .single()

      if (courseError) throw courseError

      // 2. Link the user to the course
      const { data: userCourse, error: linkError } = await supabase
        .from('user_courses')
        .upsert({
          user_id: userId,
          course_id: globalCourse.id,
          progress: 0,
          target_score: courseData.targetScore || 75,
          semester: courseData.semester || '1st'
        }, { onConflict: 'user_id,course_id' })
        .select('*, courses(*)')
        .single()

      if (linkError) throw linkError

      return { data: userCourse, error: null }
    } catch (err) {
      console.error('Enrollment failed:', err)
      return { error: err.message }
    }
  },

  /**
   * Remove a course from user's backpack
   */
  async unenrollCourse(userId, courseId) {
    if (!userId || !courseId) return { error: 'Missing IDs' }
    
    const { error } = await supabase
      .from('user_courses')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)
    
    return { error }
  },

  /**
   * Update course preferences (target score, custom name, etc.)
   */
  async updateCoursePreferences(userId, courseId, updates) {
    if (!userId || !courseId) return { error: 'Missing IDs' }
    
    const { data, error } = await supabase
      .from('user_courses')
      .update(updates)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .select()
      .single()
    
    return { data, error }
  }
}
