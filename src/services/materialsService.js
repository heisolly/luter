import { supabase } from '../supabaseClient'
import { ingestMaterial } from './langchainPipeline'
import { getCorrectMimeType, validateFile } from '../utils/fileUtils'

/** Fetch all materials for a course (admin + user's own) */
export async function fetchCourseMaterials(courseId) {
  const { data, error } = await supabase
    .from('materials')
    .select('id, title, type, source_url, extracted_text, owner_role, processing_status, metadata, created_at, user_id, topic_id')
    .eq('course_id', courseId)
    .is('deleted_at', null) // Filter out deleted items
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
  // Validate file before upload
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
  }
  
  const ext = file.name.split('.').pop().toLowerCase()
  const path = courseId 
    ? `${userId}/${courseId}/${Date.now()}.${ext}`
    : `${userId}/standalone/${Date.now()}.${ext}`

  // Get the correct MIME type using utility function
  let correctMimeType = getCorrectMimeType(file)
  
  // Hardcode PPTX MIME type as a fallback to ensure it works
  if (ext === 'pptx') {
    correctMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    console.log('Hardcoded PPTX MIME type:', correctMimeType)
  }
  
  console.log(`File: ${file.name}, Extension: ${ext}, Detected MIME: ${file.type}, Final MIME: ${correctMimeType}`)
  
  // Force override the file.type property for debugging
  console.log('Original file.type:', file.type)
  console.log('Overriding file.type to:', correctMimeType)
  
  // Use blob approach to completely bypass MIME type issues
  const fileBuffer = await file.arrayBuffer()
  const blob = new Blob([fileBuffer], { type: correctMimeType })
  const correctedFile = new File([blob], file.name, { type: correctMimeType })
  // Create a fresh file for ingestion so the pipeline can read it reliably
  const ingestFile = new File([fileBuffer], file.name, { type: correctMimeType })
  console.log('New file.type:', correctedFile.type)
  console.log('Blob size:', blob.size, 'Original size:', file.size)

  // Retry logic for upload with exponential backoff
  let storageErr = null
  let retryCount = 0
  const maxRetries = 3
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Upload attempt ${retryCount + 1}/${maxRetries} for ${file.name}`)
      
      // Use direct REST API call to bypass Supabase client MIME type issues
      console.log('Using direct REST API for all files')
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        throw new Error('No authentication token available')
      }
      
      // Use direct REST API call
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const uploadUrl = `${supabaseUrl}/storage/v1/object/materials/${path}`
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': correctMimeType,
        },
        body: correctedFile
      })
      
      let uploadResult
      if (response.ok) {
        uploadResult = { data: { path }, error: null }
      } else {
        const errorText = await response.text()
        console.error('Direct API upload failed:', errorText)
        uploadResult = { data: null, error: { message: errorText } }
      }
      
      const { error: uploadError } = uploadResult
      
      if (!uploadError) {
        storageErr = null
        break
      }
      
      storageErr = uploadError
      console.warn(`Upload attempt ${retryCount + 1} failed:`, uploadError)
      
      // Wait before retry with exponential backoff
      if (retryCount < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
      
      retryCount++
    } catch (error) {
      console.error(`Upload attempt ${retryCount + 1} threw error:`, error)
      storageErr = error
      retryCount++
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }
  }
  
  if (storageErr) {
    console.error('Upload failed after all retries:', storageErr)
    throw new Error(`Failed to upload file: ${storageErr.message || 'Unknown error'}`)
  }

  const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path)

  // Auto-detect program if not provided and course exists
  let finalProgramId = programId
  
  if (!finalProgramId && courseId) {
    const { data: courseData } = await supabase
      .from('courses')
      .select('program_id')
      .eq('id', courseId)
      .maybeSingle()
    
    if (courseData) {
      finalProgramId = courseData.program_id
    }
  }

  // Retry logic for database insertion
  let dbError = null
  let dbRetryCount = 0
  const maxDbRetries = 3
  let materialData = null
  
  while (dbRetryCount < maxDbRetries) {
    try {
      console.log(`DB insert attempt ${dbRetryCount + 1}/${maxDbRetries}`)
      
      const { data, error } = await supabase
        .from('materials')
        .insert({
          course_id: courseId || null,
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
      
      if (!error && data) {
        materialData = data
        dbError = null
        break
      }
      
      dbError = error
      console.warn(`DB insert attempt ${dbRetryCount + 1} failed:`, error)
      
      if (dbRetryCount < maxDbRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, dbRetryCount) * 1000))
      }
      
      dbRetryCount++
    } catch (error) {
      console.error(`DB insert attempt ${dbRetryCount + 1} threw error:`, error)
      dbError = error
      dbRetryCount++
      
      if (dbRetryCount < maxDbRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, dbRetryCount) * 1000))
      }
    }
  }
  
  if (dbError || !materialData) {
    console.error('Database insert failed after all retries:', dbError)
    // Clean up uploaded file if database insert fails
    try {
      await supabase.storage.from('materials').remove([path])
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError)
    }
    throw new Error(`Failed to save material to database: ${dbError?.message || 'Unknown error'}`)
  }

  // Decide how to extract text for this file type
  const documentTypes = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv', 'txt', 'html', 'htm', 'xml', 'json', 'epub', 'md']
  const isDocument = documentTypes.includes(type)

  let ingestionPromise
  if (isDocument) {
    // Documents → Supabase Edge Function (server-side Markdown extraction)
    ingestionPromise = triggerDocumentTextExtractor(materialData.id, type, title || file.name, userId)
  } else {
    // Images, audio, video, YouTube → client-side pipeline
    ingestionPromise = ingestMaterial({
      file: ingestFile,
      type,
      url: null,
      metadata: { materialId: materialData.id, courseId: courseId || null, userId, title: title || file.name }
    })
  }

  // Trigger high-fidelity PDF conversion for Office documents (for preview, not text)
  const conversionPromise = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(type) 
    ? triggerDocumentConversion(materialData.id, type, title || file.name, userId)
    : Promise.resolve()

  // Process both in parallel and update status
  Promise.allSettled([ingestionPromise, conversionPromise]).then(results => {
    const [ingestionResult, conversionResult] = results
    
    if (ingestionResult.status === 'rejected') {
      console.error('[Ingestion] Error after upload:', ingestionResult.reason)
    }
    
    if (conversionResult.status === 'rejected') {
      console.error('[Conversion] Document conversion trigger failed:', conversionResult.reason)
    }
    
    // Update material status to ready if ingestion succeeded
    if (ingestionResult.status === 'fulfilled') {
      supabase
        .from('materials')
        .update({ 
          processing_status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', materialData.id)
        .then(({ error }) => {
          if (error) console.error('Failed to update material status:', error)
        })
    }
  })

  // Create share records based on sharing scope
  if (sharingScope === 'program' && finalProgramId) {
    await createProgramShares(materialData.id, finalProgramId, userId, academicYear)
  } else if (sharingScope === 'year') {
    await createYearShares(materialData.id, userId, academicYear)
  }

  return materialData
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
    .is('deleted_at', null)
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
      course_id: courseId || null,
      user_id: userId,
      title: title || url,
      type: 'youtube',
      source_url: url,
      owner_role: 'user',
      processing_status: 'ready',
    })
    .select()
    .single()
  if (error) throw error

  return data
}

/** Re-ingest a material through LangChain (replaces old extractAndSaveMaterialText) */
export async function extractAndSaveMaterialText(materialId, file, type) {
  return ingestMaterial({
    file,
    type,
    url: null,
    metadata: { materialId, courseId: null, userId: null, title: file?.name || 'material' }
  })
}

/** YouTube transcript via LangChain */
export async function extractAndSaveYoutubeTranscript(materialId, url) {
  return ingestMaterial({
    file: null,
    type: 'youtube',
    url,
    metadata: { materialId, courseId: null, userId: null, title: url }
  })
}

/** Poll a material row until extracted_text is populated or status is failed */
export function pollMaterialUntilReady(materialId, { onReady, onFailed, intervalMs = 2000, maxAttempts = 40 } = {}) {
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

/** Save an AI response or user note to user_notes (Scrapbook) with weekly context */
export async function saveToVault({ userId, courseId, materialId, title, content, sourceType = 'ai', tags = [], weekNumber = 1 }) {
  console.log('saveToVault called with:', { userId, courseId, materialId, title, sourceType, weekNumber })
  
  const { data, error } = await supabase
    .from('user_notes')
    .insert({ 
      user_id: userId, 
      course_id: courseId, 
      material_id: materialId || null, 
      title, 
      content, 
      source_type: sourceType, 
      tags,
      week_number: parseInt(weekNumber) || 1
    })
    .select()
    .single()
    
    if (error) {
    if (error.code === '42501') {
      console.warn('RLS Policy Error: You do not have permission to insert into user_notes. Please check your database policies.', error)
    } else {
      console.error('Supabase error in saveToVault:', error)
    }
    throw error
  }
  
  console.log('saveToVault success:', data)
  return data
}

/** Fetch user's standalone materials (not attached to any course) */
export async function fetchUserStandaloneMaterials(userId) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('user_id', userId)
    .is('course_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** Fetch user's saved notes for a course */
export async function fetchUserNotes(userId, courseId) {
  const { data, error } = await supabase
    .from('user_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .is('deleted_at', null)
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

/** Soft delete a material (moves to Trash) */
export async function deleteMaterial(materialId) {
  if (!materialId) {
    console.error('deleteMaterial: materialId is required');
    return { error: 'Material ID is missing' };
  }
  
  const { error } = await supabase
    .from('materials')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', materialId)
  
  if (error) throw error
}

/** Permanently delete a material and its associated file in storage */
export async function permanentlyDeleteMaterial(materialId) {
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

  // 3. Hard delete from DB
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)
  
  if (error) throw error
}

/** Soft delete a user note (moves to Trash) */
export async function deleteUserNote(noteId) {
  if (!noteId) {
    console.error('deleteUserNote: noteId is required');
    return { error: 'Note ID is missing' };
  }

  const { error } = await supabase
    .from('user_notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId)
  if (error) throw error
}

/** Permanently delete a user note */
export async function permanentlyDeleteUserNote(noteId) {
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

// =====================================================
// SESSION MANAGEMENT FUNCTIONS
// =====================================================

/** Fetch all user sessions */
export async function fetchUserSessions(userId) {
  if (!userId) {
    console.error('fetchUserSessions: userId is required')
    return { error: 'User ID is missing' }
  }

  const { data, error } = await supabase
    .from('deck_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('last_accessed', { ascending: false })

  if (error) throw error
  return { data: data || [] }
}

/** Create a new study session */
export async function createStudySession(userId, sessionName, items = []) {
  if (!userId || !sessionName) {
    console.error('createStudySession: userId and sessionName are required')
    return { error: 'User ID and session name are required' }
  }

  const { data, error } = await supabase
    .from('deck_sessions')
    .insert([{
      user_id: userId,
      session_name: sessionName,
      items: items,
      is_active: true,
      last_accessed: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw error
  return { data }
}

/** Update a study session */
export async function updateStudySession(sessionId, updates) {
  if (!sessionId) {
    console.error('updateStudySession: sessionId is required')
    return { error: 'Session ID is required' }
  }

  const { data, error } = await supabase
    .from('deck_sessions')
    .update({
      ...updates,
      last_accessed: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return { data }
}

/** Delete (soft delete) a study session */
export async function deleteStudySession(sessionId) {
  if (!sessionId) {
    console.error('deleteStudySession: sessionId is required')
    return { error: 'Session ID is required' }
  }

  const { error } = await supabase
    .from('deck_sessions')
    .update({ is_active: false })
    .eq('id', sessionId)

  if (error) throw error
  return { success: true }
}

/** Add item to session */
export async function addItemToSession(sessionId, item) {
  if (!sessionId || !item) {
    console.error('addItemToSession: sessionId and item are required')
    return { error: 'Session ID and item are required' }
  }

  const { data: session } = await supabase
    .from('deck_sessions')
    .select('items')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return { error: 'Session not found' }
  }

  const currentItems = session.items || []
  if (currentItems.some(i => i.id === item.id)) {
    return { error: 'Item already in session' }
  }

  const updatedItems = [...currentItems, item]
  return await updateStudySession(sessionId, { items: updatedItems })
}

/** Remove item from session */
export async function removeItemFromSession(sessionId, itemId) {
  if (!sessionId || !itemId) {
    console.error('removeItemFromSession: sessionId and itemId are required')
    return { error: 'Session ID and item ID are required' }
  }

  const { data: session } = await supabase
    .from('deck_sessions')
    .select('items')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return { error: 'Session not found' }
  }

  const updatedItems = (session.items || []).filter(i => i.id !== itemId)
  return await updateStudySession(sessionId, { items: updatedItems })
}

/** Update session last accessed time */
export async function updateSessionLastAccessed(sessionId) {
  if (!sessionId) {
    console.error('updateSessionLastAccessed: sessionId is required')
    return { error: 'Session ID is required' }
  }

  const { error } = await supabase
    .from('deck_sessions')
    .update({ last_accessed: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) throw error
  return { success: true }
}

/**
 * Generate a signed URL for a material's source file (overcomes non-public bucket restrictions).
 * Falls back to the public URL if signed URL generation fails.
 */
export async function getSignedFileUrl(sourceUrl) {
  if (!sourceUrl) return null
  try {
    const url = new URL(sourceUrl)
    const parts = url.pathname.split('/')
    const publicIdx = parts.indexOf('public')
    if (publicIdx !== -1 && parts.length > publicIdx + 2) {
      const storagePath = parts.slice(publicIdx + 2).join('/')
      const { data, error } = await supabase.storage.from('materials').createSignedUrl(storagePath, 3600)
      if (error) throw error
      return data?.signedUrl || sourceUrl
    }
  } catch (e) {
    console.warn('[getSignedFileUrl] Failed, using public URL:', e.message)
  }
  return sourceUrl
}

/**
 * Trigger the document-text-extractor Edge Function to extract text from files.
 * Converts documents to clean Markdown, saves to materials.extracted_text + study_vault chunks.
 */
export async function triggerDocumentTextExtractor(materialId, fileType, fileName, userId) {
  if (!materialId) throw new Error('Missing materialId')

  console.log(`[TextExtractor] Triggering for ${materialId} (${fileType})`)

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const response = await fetch(`${supabaseUrl}/functions/v1/document-text-extractor`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ materialId, fileType, fileName, userId }),
  })

  const result = await response.json()
  console.log('[TextExtractor] Response:', {
    status: response.status,
    body: result
  })

  if (!response.ok) throw new Error(result.error || 'Text extraction failed')
  return result
}

/**
 * Trigger the document-processor Edge Function to convert Office files → PDF.
 * Non-blocking; fires after upload and returns immediately.
 */
export async function triggerDocumentConversion(materialId, fileType, fileName, userId) {
  if (!materialId) throw new Error('Missing materialId')

  console.log(`[Conversion] Triggering document-processor for ${materialId} (${fileType})`)

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const response = await fetch(`${supabaseUrl}/functions/v1/document-processor`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ materialId, fileType, fileName, userId }),
  })

  const result = await response.json()
  console.log('[Conversion] Edge Function raw response:', {
    status: response.status,
    statusText: response.statusText,
    body: result
  })

  if (!response.ok) throw new Error(result.error || 'Conversion request failed')
  return result
}

/**
 * Poll a material's conversion status until a converted_url is available or it fails.
 */
export function pollConversionStatus(materialId, { onConverted, onFailed, intervalMs = 4000, maxAttempts = 60 } = {}) {
  let attempts = 0
  console.log(`[PollConversion] Started polling for material ${materialId} (max ${maxAttempts} attempts, ${intervalMs}ms interval)`)

  const timer = setInterval(async () => {
    attempts++
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('converted_url, converted_type, render_quality, processing_status, metadata')
        .eq('id', materialId)
        .single()

      if (error) {
        console.warn(`[PollConversion] DB error for ${materialId}:`, error.message)
      }

      // Check converted_url (new pipeline) or metadata.pdf_url (legacy pipeline)
      const legacyPdfUrl = data?.metadata?.pdf_url
      const effectiveUrl = data?.converted_url || legacyPdfUrl

      console.log(`[Poll] Attempt ${attempts} for ${materialId}:`, {
        converted_url: data?.converted_url,
        processing_status: data?.processing_status,
        raw_data: data
      })

      if (effectiveUrl) {
        console.log(`[PollConversion] Conversion complete for ${materialId}! URL: ${effectiveUrl}`)
        clearInterval(timer)
        onConverted?.({ ...data, converted_url: effectiveUrl })
      } else if (data?.processing_status === 'failed' || attempts >= maxAttempts) {
        console.warn(`[PollConversion] Giving up on ${materialId}. Status: ${data?.processing_status}, attempts: ${attempts}`)
        clearInterval(timer)
        onFailed?.()
      }
    } catch (err) {
      console.warn(`[PollConversion] Error for ${materialId}:`, err)
      if (attempts >= maxAttempts) {
        clearInterval(timer)
        onFailed?.()
      }
    }
  }, intervalMs)

  return () => clearInterval(timer)
}
