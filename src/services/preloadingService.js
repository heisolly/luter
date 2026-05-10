import { supabase } from '../supabaseClient'
import { fetchCourseMaterials } from './materialsService'
import { useUniversalWorkspaceStore } from '../store/useUniversalWorkspaceStore'

// Cache for preloaded data
const preloadCache = new Map()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

class PreloadingService {
  constructor() {
    this.isPreloading = false
    this.preloadPromises = new Map()
  }

  /**
   * Preload essential data for a user when they arrive at the dashboard
   */
  async preloadUserData(userId) {
    if (!userId) return
    
    const cacheKey = `user-${userId}`
    const cached = preloadCache.get(cacheKey)
    
    // Return cached data if still valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data
    }

    // Prevent multiple concurrent preloads
    if (this.preloadPromises.has(cacheKey)) {
      return this.preloadPromises.get(cacheKey)
    }

    const preloadPromise = this.performPreload(userId)
    this.preloadPromises.set(cacheKey, preloadPromise)

    try {
      const result = await preloadPromise
      
      // Cache the results
      preloadCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })
      
      return result
    } finally {
      this.preloadPromises.delete(cacheKey)
    }
  }

  async performPreload(userId) {
    console.log('[Preload] Starting user data preload...')
    
    try {
      // Parallel loading of all essential data
      const [
        coursesData,
        materialsData,
        profileData,
        statsData,
        notesData
      ] = await Promise.allSettled([
        this.preloadCourses(userId),
        this.preloadMaterials(userId),
        this.preloadProfile(userId),
        this.preloadStats(userId),
        this.preloadNotes(userId)
      ])

      const result = {
        courses: coursesData.status === 'fulfilled' ? coursesData.value : [],
        materials: materialsData.status === 'fulfilled' ? materialsData.value : [],
        profile: profileData.status === 'fulfilled' ? profileData.value : null,
        stats: statsData.status === 'fulfilled' ? statsData.value : null,
        notes: notesData.status === 'fulfilled' ? notesData.value : [],
        preloadTime: Date.now()
      }

      console.log('[Preload] Completed:', {
        courses: result.courses.length,
        materials: result.materials.length,
        hasProfile: !!result.profile,
        hasStats: !!result.stats
      })

      return result
    } catch (error) {
      console.error('[Preload] Error during preload:', error)
      return {
        courses: [],
        materials: [],
        profile: null,
        stats: null,
        notes: [],
        preloadTime: Date.now(),
        error: error.message
      }
    }
  }

  async preloadCourses(userId) {
    const { data, error } = await supabase
      .from('user_courses')
      .select(`
        id, progress, last_studied_at, target_score, custom_name, is_archived, semester, created_at,
        courses(id, code, name, faculty)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async preloadMaterials(userId) {
    // Get all user materials (both course and standalone)
    const { data, error } = await supabase
      .from('materials')
      .select('id, title, type, source_url, processing_status, created_at, updated_at, course_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50) // Limit to most recent 50 materials for performance

    if (error) throw error
    return data || []
  }

  async preloadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async preloadStats(userId) {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async preloadNotes(userId) {
    const { data, error } = await supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20) // Limit to most recent 20 notes

    if (error) throw error
    return data || []
  }

  /**
   * Preload materials for a specific course
   */
  async preloadCourseMaterials(courseId, userId) {
    const cacheKey = `course-${courseId}-${userId}`
    const cached = preloadCache.get(cacheKey)
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data
    }

    try {
      const materials = await fetchCourseMaterials(courseId, userId)
      
      preloadCache.set(cacheKey, {
        data: materials,
        timestamp: Date.now()
      })
      
      return materials
    } catch (error) {
      console.error(`[Preload] Error preloading course ${courseId}:`, error)
      return []
    }
  }

  /**
   * Get cached data if available
   */
  getCachedData(cacheKey) {
    const cached = preloadCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  /**
   * Clear cache for a specific key or all cache
   */
  clearCache(cacheKey = null) {
    if (cacheKey) {
      preloadCache.delete(cacheKey)
    } else {
      preloadCache.clear()
    }
  }

  /**
   * Preload workspace data for faster workstation loading
   */
  async preloadWorkspaceData(courseId, userId) {
    if (!courseId || !userId) return

    const cacheKey = `workspace-${courseId}-${userId}`
    if (this.preloadPromises.has(cacheKey)) {
      return this.preloadPromises.get(cacheKey)
    }

    const preloadPromise = this.performWorkspacePreload(courseId, userId)
    this.preloadPromises.set(cacheKey, preloadPromise)

    try {
      return await preloadPromise
    } finally {
      this.preloadPromises.delete(cacheKey)
    }
  }

  async performWorkspacePreload(courseId, userId) {
    console.log(`[Preload] Preloading workspace data for course ${courseId}`)
    
    const [
      materials,
      analysis,
      notes
    ] = await Promise.allSettled([
        this.preloadCourseMaterials(courseId, userId),
        this.preloadMaterialAnalysis(courseId, userId),
        this.preloadCourseNotes(courseId, userId)
      ])

    return {
      materials: materials.status === 'fulfilled' ? materials.value : [],
      analysis: analysis.status === 'fulfilled' ? analysis.value : {},
      notes: notes.status === 'fulfilled' ? notes.value : []
    }
  }

  async preloadMaterialAnalysis(courseId, userId) {
    // Get material IDs for this course
    const { data: materials } = await supabase
      .from('materials')
      .select('id')
      .eq('course_id', courseId)
      .is('deleted_at', null)
      .limit(10) // Limit to 10 most recent materials

    if (!materials || materials.length === 0) return {}

    const materialIds = materials.map(m => m.id)
    
    const { data, error } = await supabase
      .from('material_analysis')
      .select('*')
      .in('material_id', materialIds)

    if (error) return {}
    
    // Convert to object for easy lookup
    return data.reduce((acc, item) => {
      acc[item.material_id] = item
      return acc
    }, {})
  }

  async preloadCourseNotes(courseId, userId) {
    const { data, error } = await supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return []
    return data || []
  }
}

// Export singleton instance
export const preloadingService = new PreloadingService()
export default preloadingService
