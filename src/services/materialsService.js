import { supabase } from '../supabaseClient'
import { extractTextFromFile } from './documentProcessor'

/** Fetch all materials for a course (admin + user's own) */
export async function fetchCourseMaterials(courseId, userId) {
  const { data, error } = await supabase
    .from('materials')
    .select('id, title, type, source_url, extracted_text, owner_role, processing_status, metadata, created_at, user_id, topic_id')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** Upload a file to Supabase Storage and create a materials row with course-program-year-semester tagging */
export async function uploadMaterial({ 
  file, 
  courseId, 
  userId, 
  type = 'pdf', 
  title, 
  week, 
  programId = null, 
  academicYear = '2023/2024',
  semesterNumber = 1,
  sharingScope = 'course' 
}) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${courseId}/${Date.now()}.${ext}`

  const { error: storageErr } = await supabase.storage
    .from('materials')
    .upload(path, file, { upsert: false })
  if (storageErr) throw storageErr

  const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path)

  // Auto-detect program if not provided
  let finalProgramId = programId
  
  if (!finalProgramId) {
    const { data: courseData } = await supabase
      .from('courses')
      .select('program_id')
      .eq('id', courseId)
      .single()
    
    if (courseData) {
      finalProgramId = courseData.program_id
    }
  }

  const { data, error } = await supabase
    .from('materials')
    .insert({
      course_id: courseId,
      user_id: userId,
      title: title || file.name,
      type,
      source_url: urlData.publicUrl,
      owner_role: 'user',
      processing_status: 'pending',
      week_number: parseInt(week) || 1,
      program_id: finalProgramId,
      academic_year: academicYear,
      semester_number: parseInt(semesterNumber) || 1,
      sharing_scope: sharingScope,
      metadata: {
        uploaded_by_user: true,
        file_size: file.size,
        original_filename: file.name
      }
    })
    .select()
    .single()
  if (error) throw error

  // Run client-side text extraction (non-blocking — updates DB when done)
  extractAndSaveMaterialText(data.id, file, type)

  // Create share records based on sharing scope
  if (sharingScope === 'program' && finalProgramId) {
    await createProgramShares(data.id, finalProgramId, userId, academicYear)
  } else if (sharingScope === 'year') {
    await createYearShares(data.id, userId, academicYear)
  }

  return data
}

/** Create program-wide shares for a material */
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

/** Create year-wide shares for a material */
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

/** Enhanced fetch for materials with course-program-year-semester context */
export async function fetchCourseMaterialsWithContext(courseId, userId, includeShared = true) {
  let query = supabase
    .from('materials_with_context')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (includeShared) {
    // Also get materials shared with this course's program and year
    const { data: courseData } = await supabase
      .from('courses')
      .select('program_id')
      .eq('id', courseId)
      .single()

    if (courseData?.program_id) {
      query = query.or(`course_id.eq.${courseId},and(program_id.eq.${courseData.program_id},sharing_scope.in.(program,year,global))`)
    }
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/** Add a YouTube material row */
export async function addYoutubeMaterial({ url, title, courseId, userId }) {
  const { data, error } = await supabase
    .from('materials')
    .insert({
      course_id: courseId,
      user_id: userId,
      title: title || url,
      type: 'youtube',
      source_url: url,
      owner_role: 'user',
      processing_status: 'pending',
    })
    .select()
    .single()
  if (error) throw error

  // YouTube: attempt transcript extraction
  extractAndSaveYoutubeTranscript(data.id, url)

  return data
}

/** Client-side text extraction — runs after upload, saves result to DB */
export async function extractAndSaveMaterialText(materialId, file, type) {
  try {
    const text = await extractTextFromFile(file, type)
    if (text) {
      await saveMaterialText(materialId, text)
    } else {
      // Mark as failed so the UI doesn't spin forever
      await supabase
        .from('materials')
        .update({ processing_status: 'failed' })
        .eq('id', materialId)
    }
  } catch (e) {
    console.warn('extractAndSaveMaterialText failed', e)
    await supabase
      .from('materials')
      .update({ processing_status: 'failed' })
      .eq('id', materialId)
  }
}

/** YouTube transcript extraction */
export async function extractAndSaveYoutubeTranscript(materialId, url) {
  try {
    const { extractYoutubeTranscript } = await import('./documentProcessor')
    const text = await extractYoutubeTranscript(url)
    if (text) {
      await saveMaterialText(materialId, text)
    } else {
      await supabase
        .from('materials')
        .update({ processing_status: 'no_transcript' })
        .eq('id', materialId)
    }
  } catch (e) {
    console.warn('extractAndSaveYoutubeTranscript failed', e)
  }
}

/** Poll a material row until extracted_text is populated or status is failed */
export async function pollMaterialUntilReady(materialId, { onReady, onFailed, intervalMs = 2000, maxAttempts = 30 } = {}) {
  let attempts = 0
  const timer = setInterval(async () => {
    attempts++
    const { data } = await supabase
      .from('materials')
      .select('extracted_text, processing_status')
      .eq('id', materialId)
      .single()

    if (data?.extracted_text) {
      clearInterval(timer)
      onReady?.(data.extracted_text)
    } else if (data?.processing_status === 'failed' || attempts >= maxAttempts) {
      clearInterval(timer)
      onFailed?.()
    }
  }, intervalMs)

  return () => clearInterval(timer)
}

/** Save extracted text back to a material */
export async function saveMaterialText(materialId, extractedText) {
  const { error } = await supabase
    .from('materials')
    .update({ extracted_text: extractedText, processing_status: 'ready', updated_at: new Date().toISOString() })
    .eq('id', materialId)
  if (error) throw error
}

/** Fetch or create study session for user+course */
export async function getStudySession(userId, courseId) {
  const { data } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  return data
}

/** Upsert study session */
export async function upsertStudySession({ userId, courseId, materialId, highlights, scrollPosition, contextSnapshot }) {
  const { data, error } = await supabase.rpc('upsert_study_session', {
    p_user_id: userId,
    p_course_id: courseId,
    p_material_id: materialId || null,
    p_highlights: highlights ? JSON.stringify(highlights) : null,
    p_scroll_position: scrollPosition ? JSON.stringify(scrollPosition) : null,
    p_context_snapshot: contextSnapshot || null,
  })
  if (error) console.warn('upsertStudySession', error)
  return data
}

/** Save an AI response to user_notes (Scrapbook) */
export async function saveToVault({ userId, courseId, materialId, title, content, sourceType = 'ai', tags = [] }) {
  const { data, error } = await supabase
    .from('user_notes')
    .insert({ user_id: userId, course_id: courseId, material_id: materialId || null, title, content, source_type: sourceType, tags })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Fetch user's saved notes for a course */
export async function fetchUserNotes(userId, courseId) {
  const { data, error } = await supabase
    .from('user_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** Fetch chat history for a course */
export async function fetchChatHistory(userId, courseId, limit = 50) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data || []
}

/** Save a chat message */
export async function saveChatMessage({ userId, courseId, role, content }) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, course_id: courseId, role, content })
  if (error) console.warn('saveChatMessage', error)
}

/** Delete a material and its associated file in storage */
export async function deleteMaterial(materialId) {
  // 1. Get the material to find the source_url
  const { data: material, error: fetchErr } = await supabase
    .from('materials')
    .select('source_url')
    .eq('id', materialId)
    .single()
  
  if (fetchErr) throw fetchErr

  // 2. Delete from storage if it's a file (not youtube)
  if (material.source_url && !material.source_url.includes('youtube.com')) {
    try {
      const url = new URL(material.source_url)
      const pathParts = url.pathname.split('/storage/v1/object/public/materials/')
      if (pathParts.length > 1) {
        const filePath = pathParts[1]
        await supabase.storage.from('materials').remove([filePath])
      }
    } catch (e) {
      console.warn('Failed to delete file from storage:', e)
    }
  }

  // 3. Delete from DB
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)
  
  if (error) throw error
}

/** Delete a user note */
export async function deleteUserNote(noteId) {
  const { error } = await supabase
    .from('user_notes')
    .delete()
    .eq('id', noteId)
  if (error) throw error
}

/** Re-process a stuck material by downloading it from storage and re-extracting */
export async function reprocessMaterial(material) {
  if (!material?.source_url || material.type === 'youtube') return

  try {
    const response = await fetch(material.source_url)
    if (!response.ok) throw new Error('Could not fetch file from storage')

    const blob = await response.blob()
    const file = new File([blob], material.title || 'file', { type: blob.type })

    await extractAndSaveMaterialText(material.id, file, material.type)
  } catch (e) {
    console.warn('reprocessMaterial failed', e)
  }
}
