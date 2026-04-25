import { supabase } from '../supabaseClient'
import { normalizeCourseRow } from '../lib/curriculumSlugs'
import universalCourseService from './universalCourseService'

/**
 * Service for managing user courses (the "Backpack")
 * Enhanced with Universal Course System integration
 */
export const courseService = {
  /**
   * Fetch all courses for the current user (Enhanced)
   */
  async fetchUserCourses(userId, context = {}) {
    if (!userId) return { data: [], error: 'User ID required' }
    
    try {
      // Try enhanced fetch first
      const { data: enhancedData, error: enhancedError } = await universalCourseService.fetchUserCoursesEnhanced(userId, context)
      
      if (!enhancedError && enhancedData.length > 0) {
        return { data: enhancedData, error: null }
      }
      
      // Fallback to original fetch
      const { data, error } = await supabase
        .from('user_courses')
        .select('*, courses(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      return { data, error }
    } catch (err) {
      console.error('Enhanced course fetch failed, using fallback:', err)
      
      // Final fallback to original method
      const { data, error } = await supabase
        .from('user_courses')
        .select('*, courses(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      return { data, error }
    }
  },

  /**
   * Enroll a user in a course (Enhanced with Universal System)
   * Handles both global course creation and user-course link with source tracking.
   */
  async enrollCourse(userId, courseData, source = 'manual', context = {}) {
    if (!userId) return { error: 'User ID required' }
    
    const normalized = normalizeCourseRow(courseData)
    if (!normalized.code || !normalized.name) return { error: 'Invalid course data' }

    try {
      // Try universal enrollment first
      const { data: universalData, error: universalError } = await universalCourseService.enrollCourseWithSource(
        userId, 
        courseData, 
        source, 
        context
      )
      
      if (!universalError && universalData) {
        // Save selection for peer recommendations
        await universalCourseService.saveCourseSelection(userId, universalData.courses, context)
        return { data: universalData, error: null }
      }
      
      // Fallback to original enrollment
      console.warn('Universal enrollment failed, using fallback:', universalError)
      
      // 1. Ensure the course exists in the global 'courses' table
      const { data: globalCourse, error: courseError } = await supabase
        .from('courses')
        .upsert({
          code: normalized.code,
          name: normalized.name,
          faculty: courseData.faculty || 'General',
          source_type: source === 'manual' ? 'admin' : source,
          confidence_score: source === 'admin' ? 1.0 : 0.8,
          verification_status: source === 'admin' ? 'verified' : 'pending'
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
          semester: courseData.semester || '1st',
          enrollment_source: source,
          ai_suggested: source === 'ai_generated',
          peer_recommended: source === 'peer_recommendation'
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
  },
  
  // =====================================================
  // ENHANCED UNIVERSAL SYSTEM METHODS
  // =====================================================
  
  /**
   * Get enhanced course suggestions
   */
  async getEnhancedSuggestions(userId, context, limit = 20) {
    return await universalCourseService.getEnhancedSuggestions(userId, context, limit)
  },
  
  /**
   * Generate courses with AI
   */
  async generateCoursesWithAI(context, count = 20) {
    return await universalCourseService.generateCoursesWithAI(context, count)
  },
  
  /**
   * Process scraped courses
   */
  async processScrapedCourses(scrapedCourseIds, context = {}) {
    return await universalCourseService.processScrapedCourses(scrapedCourseIds, context)
  },
  
  /**
   * Get course analytics
   */
  async getCourseAnalytics(courseId, contextMatrixId = null) {
    return await universalCourseService.getCourseAnalytics(courseId, contextMatrixId)
  },
  
  /**
   * Get popular courses in context
   */
  async getPopularCourses(contextMatrixId, limit = 20) {
    return await universalCourseService.getPopularCourses(contextMatrixId, limit)
  },
  
  /**
   * Get context matrix for user
   */
  async getOrCreateContextMatrix(context) {
    return await universalCourseService.getOrCreateContextMatrix(context)
  }
}
