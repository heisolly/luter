import { supabase } from '../supabaseClient'

// ==================== SEMESTER WEEKS ====================

export async function fetchSemesterWeeks(courseId) {
  const { data, error } = await supabase
    .from('semester_weeks')
    .select('*')
    .eq('course_id', courseId)
    .order('week_number')
  
  if (error) throw error
  return data || []
}

export async function updateSemesterWeek(weekId, updates) {
  const { data, error } = await supabase
    .from('semester_weeks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', weekId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function publishWeek(weekId, isPublished) {
  return updateSemesterWeek(weekId, { is_published: isPublished })
}

// ==================== MATERIALS ====================

export async function fetchMaterialsByWeek(courseId, weekNumber) {
  const { data, error } = await supabase
    .from('materials_with_context')
    .select('*')
    .eq('course_id', courseId)
    .eq('week_number', weekNumber)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function uploadAdminMaterial({ file, courseId, weekNumber, title, type, learningObjectives, academicYear = '2023/2024', semesterNumber = 1, sharingScope = 'course' }) {
  const ext = file.name.split('.').pop()
  const path = `admin/${courseId}/week-${weekNumber}/${Date.now()}.${ext}`

  // Upload to storage
  const { error: storageErr } = await supabase.storage
    .from('materials')
    .upload(path, file, { upsert: false })
  
  if (storageErr) throw storageErr

  const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path)

  // Auto-detect program if not provided
  let finalProgramId = null
  const { data: courseData } = await supabase
    .from('courses')
    .select('program_id')
    .eq('id', courseId)
    .single()
  
  if (courseData) {
    finalProgramId = courseData.program_id
  }

  // Create material record
  const { data, error } = await supabase
    .from('materials')
    .insert({
      course_id: courseId,
      week_number: weekNumber,
      title,
      type,
      source_url: urlData.publicUrl,
      owner_role: 'admin',
      processing_status: 'ready',
      program_id: finalProgramId,
      academic_year: academicYear,
      semester_number: semesterNumber,
      sharing_scope: sharingScope,
      metadata: {
        learning_objectives: learningObjectives || [],
        uploaded_by_admin: true
      }
    })
    .select()
    .single()
  
  if (error) throw error

  // Update week materials count
  await updateWeekMaterialsCount(courseId, weekNumber)

  // Create shares if needed
  if (sharingScope === 'program' && finalProgramId) {
    await createProgramShares(data.id, finalProgramId, 'admin', academicYear)
  } else if (sharingScope === 'year') {
    await createYearShares(data.id, 'admin', academicYear)
  }

  return data
}

async function updateWeekMaterialsCount(courseId, weekNumber) {
  const { count } = await supabase
    .from('materials')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('week_number', weekNumber)

  await supabase
    .from('semester_weeks')
    .update({ materials_count: count || 0 })
    .eq('course_id', courseId)
    .eq('week_number', weekNumber)
}

// ==================== NOTES REQUESTS ====================

export async function createNotesRequest(requestData) {
  const { data, error } = await supabase
    .from('notes_requests')
    .insert({
      ...requestData,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function fetchUserRequests(userId, courseId) {
  const { data, error } = await supabase
    .from('notes_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function fetchAllRequests(courseId = null) {
  let query = supabase
    .from('notes_requests')
    .select(`
      *,
      user:profiles(email, full_name),
      course:courses(code, name)
    `)
    .order('created_at', { ascending: false })
  
  if (courseId) {
    query = query.eq('course_id', courseId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function updateRequestStatus(requestId, status, adminNotes = null) {
  const { data, error } = await supabase
    .from('notes_requests')
    .update({
      status,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ==================== AI GENERATED NOTES ====================

export async function generateAINotes(materialId, noteType, prompt = null) {
  // This would integrate with your AI service
  // For now, return a placeholder
  const { data, error } = await supabase
    .from('ai_generated_notes')
    .insert({
      material_id: materialId,
      note_type: noteType,
      content: {
        summary: "AI-generated summary will appear here...",
        key_points: ["Key point 1", "Key point 2", "Key point 3"],
        study_guide: "Study guide content..."
      },
      generation_prompt: prompt,
      ai_model: 'gpt-4',
      quality_score: 85,
      is_published: false
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function fetchAINotes(courseId, weekNumber = null) {
  let query = supabase
    .from('ai_generated_notes')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_published', true)
  
  if (weekNumber) {
    query = query.eq('week_number', weekNumber)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ==================== ANALYTICS ====================

export async function getCourseAnalytics(courseId) {
  const { data, error } = await supabase
    .rpc('get_course_statistics', { course_uuid: courseId })
  
  if (error) throw error
  return data || {}
}

export async function getWeeklyProgress(courseId) {
  const { data, error } = await supabase
    .from('semester_weeks')
    .select(`
      *,
      materials:materials(count),
      requests:notes_requests(count)
    `)
    .eq('course_id', courseId)
    .order('week_number')
  
  if (error) throw error
  return data || []
}

// ==================== NOTIFICATIONS ====================

export async function notifyStudentsAboutNewMaterial(courseId, weekNumber, materialTitle) {
  // This would integrate with your notification system
  console.log(`Notifying students about new material: ${materialTitle} for week ${weekNumber}`)
  return true
}

export async function notifyUserAboutRequestUpdate(requestId, status) {
  // This would integrate with your notification system
  console.log(`Notifying user about request ${requestId} status update: ${status}`)
  return true
}

// ==================== BULK OPERATIONS ====================

export async function bulkPublishWeeks(courseId, weekNumbers) {
  const { data, error } = await supabase
    .from('semester_weeks')
    .update({ is_published: true })
    .eq('course_id', courseId)
    .in('week_number', weekNumbers)
    .select()
  
  if (error) throw error
  return data || []
}

export async function bulkUpdateRequests(requestIds, updates) {
  const { data, error } = await supabase
    .from('notes_requests')
    .update(updates)
    .in('id', requestIds)
    .select()
  
  if (error) throw error
  return data || []
}

// ==================== HELPER FUNCTIONS ====================

async function createProgramShares(materialId, programId, sharedByUserId, academicYear) {
  try {
    // Get all courses in this program
    const { data: programCourses } = await supabase
      .from('courses')
      .select('id')
      .eq('program_id', programId)

    if (programCourses) {
      const shares = programCourses.map(course => ({
        material_id: materialId,
        shared_by_user_id: sharedByUserId,
        target_course_id: course.id,
        target_program_id: programId,
        target_academic_year: academicYear,
        share_type: 'cross_program'
      }))

      await supabase
        .from('material_shares')
        .insert(shares)
    }
  } catch (error) {
    console.error('Failed to create program shares:', error)
  }
}

async function createYearShares(materialId, sharedByUserId, academicYear) {
  try {
    // Get all courses for the academic year
    const { data: yearCourses } = await supabase
      .from('materials')
      .select('course_id')
      .eq('academic_year', academicYear)
      .distinct()

    if (yearCourses) {
      const shares = yearCourses.map(course => ({
        material_id: materialId,
        shared_by_user_id: sharedByUserId,
        target_course_id: course.course_id,
        target_academic_year: academicYear,
        share_type: 'cross_year'
      }))

      await supabase
        .from('material_shares')
        .insert(shares)
    }
  } catch (error) {
    console.error('Failed to create year shares:', error)
  }
}
