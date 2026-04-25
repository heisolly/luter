import { supabase } from '../supabaseClient'
import { normalizeCourseRow, universitySlugFromName, departmentSlugFromLabel } from '../lib/curriculumSlugs'

/**
 * Universal Course Service - Integrates all course sources
 * Web Scraping, Groq AI, Admin Uploads, Educational Databases, NDLE Systems
 */
export const universalCourseService = {
  
  // =====================================================
  // CORE COURSE OPERATIONS
  // =====================================================
  
  /**
   * Get or create course context matrix
   */
  async getOrCreateContextMatrix(context) {
    const {
      country = 'Nigeria',
      university,
      universitySlug,
      department,
      departmentSlug,
      educationLevel = 'Tertiary',
      level,
      semester,
      academicYear = null
    } = context
    
    try {
      const { data, error } = await supabase.rpc('get_or_create_context_matrix', {
        p_country: country,
        p_university_slug: universitySlug || universitySlugFromName(university),
        p_university_name: university,
        p_department_slug: departmentSlug || departmentSlugFromLabel(department),
        p_department_name: department,
        p_education_level: educationLevel,
        p_level: level,
        p_semester: semester,
        p_academic_year: academicYear
      })
      
      return { contextMatrixId: data, error }
    } catch (err) {
      console.error('Context matrix creation failed:', err)
      return { error: err.message }
    }
  },
  
  /**
   * Enhanced course enrollment with source tracking
   */
  async enrollCourseWithSource(userId, courseData, source = 'manual', context = {}) {
    if (!userId) return { error: 'User ID required' }
    
    const normalized = normalizeCourseRow(courseData)
    if (!normalized.code || !normalized.name) return { error: 'Invalid course data' }
    
    try {
      // 1. Get or create context matrix
      const { contextMatrixId, error: contextError } = await this.getOrCreateContextMatrix(context)
      if (contextError) throw contextError
      
      // 2. Ensure course exists in global courses table
      const { data: globalCourse, error: courseError } = await supabase
        .from('courses')
        .upsert({
          code: normalized.code,
          name: normalized.name,
          faculty: courseData.faculty || 'General',
          source_type: source === 'manual' ? 'admin' : source,
          confidence_score: source === 'admin' ? 1.0 : 0.8,
          verification_status: source === 'admin' ? 'verified' : 'pending',
          country: context.country || 'Nigeria',
          university_slug: context.universitySlug,
          department_slug: context.departmentSlug,
          education_level: context.educationLevel,
          semester: context.semester,
          credits: courseData.credits,
          course_type: courseData.courseType || 'core',
          metadata: {
            ...context,
            enrollment_source: source
          }
        }, { onConflict: 'code' })
        .select()
        .single()
      
      if (courseError) throw courseError
      
      // 3. Link user to course with enhanced tracking
      const { data: userCourse, error: linkError } = await supabase
        .from('user_courses')
        .upsert({
          user_id: userId,
          course_id: globalCourse.id,
          progress: 0,
          target_score: courseData.targetScore || 75,
          semester: courseData.semester || context.semester || '1st',
          enrollment_source: source,
          recommendation_score: courseData.recommendationScore,
          ai_suggested: source === 'ai_generated',
          peer_recommended: source === 'peer_recommendation',
          scraped_matched: source === 'web_scraping',
          custom_name: courseData.customName,
          custom_notes: courseData.customNotes,
          enrollment_context: context,
          priority_level: courseData.priorityLevel || 1,
          is_favorite: courseData.isFavorite || false
        }, { onConflict: 'user_id,course_id' })
        .select('*, courses(*)')
        .single()
      
      if (linkError) throw linkError
      
      // 4. Add to context courses if context matrix exists
      if (contextMatrixId) {
        await supabase
          .from('course_context_courses')
          .upsert({
            context_matrix_id: contextMatrixId,
            course_id: globalCourse.id,
            is_core: courseData.courseType === 'core',
            is_elective: courseData.courseType === 'elective',
            is_gst: courseData.courseType === 'general_studies',
            credits: courseData.credits,
            prerequisites: courseData.prerequisites,
            added_by: userId
          }, { onConflict: 'context_matrix_id,course_id' })
      }
      
      return { data: userCourse, error: null }
    } catch (err) {
      console.error('Enhanced enrollment failed:', err)
      return { error: err.message }
    }
  },
  
  /**
   * Get user's courses with enhanced information
   */
  async fetchUserCoursesEnhanced(userId, context = {}) {
    if (!userId) return { data: [], error: 'User ID required' }
    
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          *,
          courses(*),
          course_context_courses!inner(
            context_matrix_id,
            is_core,
            is_elective,
            is_gst,
            credits,
            prerequisites
          ),
          course_context_matrix!inner(
            country,
            university_name,
            department_name,
            level,
            semester
          )
        `)
        .eq('user_id', userId)
        .order('priority_level', { ascending: false })
        .order('enrollment_date', { ascending: false })
      
      if (error) throw error
      
      return { data: data || [], error: null }
    } catch (err) {
      console.error('Enhanced course fetch failed:', err)
      return { data: [], error: err.message }
    }
  },
  
  // =====================================================
  // COURSE RECOMMENDATIONS
  // =====================================================
  
  /**
   * Get enhanced course suggestions
   */
  async getEnhancedSuggestions(userId, context, limit = 20) {
    try {
      // Get context matrix
      const { contextMatrixId, error: contextError } = await this.getOrCreateContextMatrix(context)
      if (contextError) throw contextError
      
      // Get suggestions using stored procedure
      const { data, error } = await supabase.rpc('get_enhanced_course_suggestions', {
        p_user_id: userId,
        p_context_matrix_id: contextMatrixId,
        p_limit: limit
      })
      
      return { data: data || [], error }
    } catch (err) {
      console.error('Enhanced suggestions failed:', err)
      return { data: [], error: err.message }
    }
  },
  
  /**
   * Save user course selection for peer recommendations
   */
  async saveCourseSelection(userId, courseData, context) {
    try {
      const { contextMatrixId } = await this.getOrCreateContextMatrix(context)
      
      // Save to enhanced suggestions for tracking
      await supabase
        .from('enhanced_course_suggestions')
        .insert({
          user_id: userId,
          context_matrix_id: contextMatrixId,
          course_id: courseData.id,
          suggestion_type: 'peer_recommendation',
          confidence_score: 1.0,
          recommendation_score: 1.0,
          is_accepted: true,
          source_data: {
            selection_source: 'manual_enrollment',
            enrollment_context: context
          }
        })
      
      return { success: true }
    } catch (err) {
      console.error('Course selection save failed:', err)
      return { success: false, error: err.message }
    }
  },
  
  // =====================================================
  // AI COURSE GENERATION
  // =====================================================
  
  /**
   * Generate courses using AI
   */
  async generateCoursesWithAI(context, count = 20) {
    try {
      // Get AI generation config
      const { data: config, error: configError } = await supabase
        .from('ai_generation_configs')
        .select('*')
        .eq('is_active', true)
        .eq('config_name', 'Nigerian University Course Generator')
        .single()
      
      if (configError || !config) throw new Error('AI generation config not found')
      
      // Build prompt based on context
      const prompt = this.buildAIGenerationPrompt(context)
      
      // Call AI service (you'll need to integrate with your Groq client)
      const aiResponse = await this.callAIGenerationService(prompt, config)
      
      if (!aiResponse.success) throw aiResponse.error
      
      // Process AI response and save courses
      const processedCourses = await this.processAIGeneratedCourses(
        aiResponse.courses, 
        context, 
        config
      )
      
      return { data: processedCourses, error: null }
    } catch (err) {
      console.error('AI course generation failed:', err)
      return { data: [], error: err.message }
    }
  },
  
  /**
   * Build AI generation prompt
   */
  buildAIGenerationPrompt(context) {
    const {
      country = 'Nigeria',
      university,
      department,
      level,
      semester,
      count = 20
    } = context
    
    return `Generate ${count} realistic university courses for:
    
    Country: ${country}
    University: ${university}
    Department: ${department}
    Level: ${level} (${level === '100' ? 'First Year' : level === '200' ? 'Second Year' : level === '300' ? 'Third Year' : level === '400' ? 'Fourth Year' : 'Final Year'})
    Semester: ${semester}
    
    Requirements:
    - Use realistic Nigerian university course codes (e.g., CSC301, MTH203, GST111)
    - Course codes MUST match the level (100L = 1xx, 200L = 2xx, etc.)
    - Include mix of core courses, electives, and GST courses
    - Provide descriptive course titles
    - Mark course type (core, elective, general_studies)
    - Include credit hours (typical: 2-4 credits)
    - Add brief descriptions
    
    Return JSON array:
    [
      {
        "code": "CSC301",
        "name": "Design & Analysis of Algorithms",
        "type": "core",
        "credits": 3,
        "description": "Study of algorithm design techniques and analysis"
      }
    ]`
  },
  
  /**
   * Call AI generation service (integrate with your Groq client)
   */
  async callAIGenerationService(prompt, config) {
    try {
      // This should integrate with your existing Groq client
      // For now, returning a mock response
      const mockCourses = [
        {
          code: "CSC301",
          name: "Design & Analysis of Algorithms",
          type: "core",
          credits: 3,
          description: "Study of algorithm design techniques and analysis"
        },
        {
          code: "MTH203",
          name: "Mathematical Methods II",
          type: "core", 
          credits: 3,
          description: "Advanced mathematical techniques for engineering"
        }
      ]
      
      return { 
        success: true, 
        courses: mockCourses,
        model: config.ai_model,
        confidence: 0.85
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },
  
  /**
   * Process AI generated courses
   */
  async processAIGeneratedCourses(courses, context, config) {
    const processedCourses = []
    
    for (const course of courses) {
      try {
        // Save to AI generated courses table
        const { data: aiCourse, error } = await supabase
          .from('ai_generated_courses')
          .insert({
            source_id: config.id, // You'll need to get the source_id
            generation_prompt: config.base_prompt,
            ai_model: config.ai_model,
            ai_temperature: config.temperature,
            generated_course_code: course.code,
            generated_course_name: course.name,
            generated_faculty: context.department,
            generated_description: course.description,
            generated_credits: course.credits,
            context_country: context.country,
            context_university: context.university,
            context_department: context.department,
            context_level: context.level,
            context_semester: context.semester,
            confidence_score: 0.85,
            processing_status: 'pending'
          })
          .select()
          .single()
        
        if (error) throw error
        
        // Add to main courses table
        const { data: mainCourse, error: mainError } = await supabase
          .from('courses')
          .upsert({
            code: course.code,
            name: course.name,
            faculty: context.department,
            description: course.description,
            source_type: 'ai_generated',
            country: context.country,
            university_slug: context.universitySlug,
            department_slug: context.departmentSlug,
            education_level: context.educationLevel,
            semester: context.semester,
            credits: course.credits,
            course_type: course.type,
            confidence_score: 0.85,
            verification_status: 'pending',
            ai_generated_at: new Date().toISOString(),
            metadata: {
              ai_generated: true,
              ai_model: config.ai_model,
              generation_context: context
            }
          }, { onConflict: 'code' })
          .select()
          .single()
        
        if (mainError) throw mainError
        
        // Create mapping log
        await supabase
          .from('course_mapping_log')
          .insert({
            source_course_id: aiCourse.id,
            source_table: 'ai_generated_courses',
            target_course_id: mainCourse.id,
            mapping_confidence: 0.85,
            mapping_algorithm: 'ai_direct',
            verification_status: 'auto'
          })
        
        // Add to verification queue
        await supabase
          .from('course_verification_queue')
          .insert({
            course_id: mainCourse.id,
            verification_type: 'new_course',
            priority: 2,
            auto_confidence_score: 0.85,
            source_evidence: {
              source: 'ai_generated',
              ai_course_id: aiCourse.id,
              config_used: config.config_name
            }
          })
        
        processedCourses.push({
          ...mainCourse,
          aiGenerated: true,
          confidence: 0.85
        })
        
      } catch (err) {
        console.error(`Failed to process AI course ${course.code}:`, err)
      }
    }
    
    return processedCourses
  },
  
  // =====================================================
  // WEB SCRAPING INTEGRATION
  // =====================================================
  
  /**
   * Process scraped courses
   */
  async processScrapedCourses(scrapedCourseIds, context = {}) {
    const processedCourses = []
    
    for (const scrapedId of scrapedCourseIds) {
      try {
        // Get context matrix
        const { contextMatrixId } = await this.getOrCreateContextMatrix(context)
        
        // Process each scraped course
        const { data: courseId, error } = await supabase.rpc('process_scraped_course', {
          p_scraped_course_id: scrapedId,
          p_context_matrix_id: contextMatrixId
        })
        
        if (error) throw error
        
        // Get the processed course details
        const { data: course, error: fetchError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()
        
        if (fetchError) throw fetchError
        
        processedCourses.push({
          ...course,
          scraped: true,
          processedFrom: scrapedId
        })
        
      } catch (err) {
        console.error(`Failed to process scraped course ${scrapedId}:`, err)
      }
    }
    
    return processedCourses
  },
  
  // =====================================================
  // ADMIN OPERATIONS
  // =====================================================
  
  /**
   * Create admin upload batch
   */
  async createUploadBatch(adminId, batchName, uploadSource, courses = []) {
    try {
      const { data: batch, error } = await supabase
        .from('admin_course_upload_batches')
        .insert({
          admin_id: adminId,
          batch_name: batchName,
          upload_source: uploadSource,
          total_courses: courses.length,
          processing_status: 'pending'
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Process each course in the batch
      for (const course of courses) {
        await supabase
          .from('admin_course_upload_items')
          .insert({
            batch_id: batch.id,
            raw_course_data: course,
            processing_status: 'pending'
          })
      }
      
      return { data: batch, error: null }
    } catch (err) {
      console.error('Upload batch creation failed:', err)
      return { error: err.message }
    }
  },
  
  /**
   * Get verification queue for admin
   */
  async getVerificationQueue(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('course_verification_queue')
        .select(`
          *,
          courses(*),
          course_sources(source_name, source_type)
        `)
        .eq('admin_review_status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit)
      
      return { data: data || [], error }
    } catch (err) {
      console.error('Verification queue fetch failed:', err)
      return { data: [], error: err.message }
    }
  },
  
  /**
   * Approve or reject course in verification queue
   */
  async reviewCourse(queueItemId, adminId, status, notes = '') {
    try {
      const { data, error } = await supabase
        .from('course_verification_queue')
        .update({
          admin_review_status: status,
          admin_reviewer_id: adminId,
          admin_review_notes: notes,
          admin_reviewed_at: new Date().toISOString()
        })
        .eq('id', queueItemId)
        .select()
        .single()
      
      if (error) throw error
      
      // If approved, update course verification status
      if (status === 'approved') {
        await supabase
          .from('courses')
          .update({
            verification_status: 'verified',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.course_id)
      }
      
      return { data, error: null }
    } catch (err) {
      console.error('Course review failed:', err)
      return { error: err.message }
    }
  },
  
  // =====================================================
  // ANALYTICS AND REPORTING
  // =====================================================
  
  /**
   * Get course analytics
   */
  async getCourseAnalytics(courseId, contextMatrixId = null) {
    try {
      let query = supabase
        .from('course_analytics')
        .select('*')
        .eq('course_id', courseId)
      
      if (contextMatrixId) {
        query = query.eq('context_matrix_id', contextMatrixId)
      }
      
      const { data, error } = await query
        .order('last_calculated', { ascending: false })
        .limit(1)
        .single()
      
      return { data, error }
    } catch (err) {
      console.error('Analytics fetch failed:', err)
      return { data: null, error: err.message }
    }
  },
  
  /**
   * Get popular courses in context
   */
  async getPopularCourses(contextMatrixId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('course_analytics')
        .select(`
          *,
          courses(*)
        `)
        .eq('context_matrix_id', contextMatrixId)
        .order('popularity_score', { ascending: false })
        .limit(limit)
      
      return { data: data || [], error }
    } catch (err) {
      console.error('Popular courses fetch failed:', err)
      return { data: [], error: err.message }
    }
  }
}

export default universalCourseService
