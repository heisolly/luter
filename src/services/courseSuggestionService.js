import { supabase } from '../supabaseClient'
import { 
  fetchCurriculumBaselineList, 
  fetchGroqLiveCourseSearch,
  GROQ_MODELS,
  GROQ_PROMPTS,
  callGroqAPI,
  stripJsonFence
} from '../groqClient'
import { 
  buildCurriculumKeyContext
} from './curriculumService'
import { normalizeCourseRow, departmentSlugFromLabel, universitySlugFromName } from '../lib/curriculumSlugs'

/**
 * Comprehensive Course Suggestion Service
 * Combines AI recommendations, peer data, and multiple data sources
 */

// Cache for AI suggestions to reduce API calls
const aiCache = new Map()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

/**
 * Generate cache key for academic context
 */
function generateCacheKey(university, department, level, semester, country = 'Nigeria') {
  const ctx = buildCurriculumKeyContext(university, department, level, semester)
  return `${ctx.uni_slug}:${ctx.dept_slug}:${level}:${semester}:${country}`
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(cacheEntry) {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL
}

/**
 * Get AI-powered course suggestions with caching
 */
async function getAiSuggestions(university, department, level, semester, country = 'Nigeria') {
  const cacheKey = generateCacheKey(university, department, level, semester, country)
  
  // Check memory cache first
  if (aiCache.has(cacheKey) && isCacheValid(aiCache.get(cacheKey))) {
    const cached = aiCache.get(cacheKey)
    return cached.suggestions
  }

  try {
    const { data: dbCache, error: cacheError } = await supabase
      .from('ai_suggestion_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .single();

    if (cacheError) {
      if (cacheError.code === 'PGRST116') {
        // Just a cache miss, which is normal
      } else {
        console.warn('AI suggestion cache lookup failed:', cacheError.message, cacheError.code);
      }
    } else if (dbCache && new Date(dbCache.expires_at) > new Date()) {
      // Update hit count (non-blocking)
      supabase
        .from('ai_suggestion_cache')
        .update({ hit_count: (dbCache.hit_count || 0) + 1 })
        .eq('cache_key', cacheKey)
        .then(({ error }) => {
          if (error) console.warn('Failed to update cache hit count:', error.message);
        });

      // Store in memory cache
      aiCache.set(cacheKey, {
        suggestions: dbCache.suggestions,
        timestamp: Date.now()
      });

      return dbCache.suggestions;
    }
  } catch (err) {
    console.error('Critical failure in AI cache logic:', err);
  }

  // Generate new AI suggestions
  const suggestions = await generateAiSuggestions(university, department, level, semester, country)

  // Cache the results
  try {
    const cachePayload = {
      cache_key: cacheKey,
      university_slug: universitySlugFromName(university),
      department_slug: departmentSlugFromLabel(department),
      level,
      semester,
      country,
      suggestions: JSON.parse(JSON.stringify(suggestions)), // Deep clone to avoid circular references
      ai_model: GROQ_MODELS.PROFESSOR,
      prompt_hash: btoa(`${university}:${department}:${level}:${semester}`).slice(0, 32),
      expires_at: new Date(Date.now() + CACHE_TTL).toISOString()
    }

    await supabase
      .from('ai_suggestion_cache')
      .upsert(cachePayload, { onConflict: 'cache_key' })

    // Store in memory cache
    aiCache.set(cacheKey, {
      suggestions,
      timestamp: Date.now()
    })

  } catch {
    // Cache update failed silently
  }

  return suggestions
}

/**
 * Generate AI suggestions using multiple Groq prompts
 */
async function generateAiSuggestions(university, department, level, semester, country = 'Nigeria') {
  const allSuggestions = new Map()

  try {
    // 1. Baseline curriculum suggestions
    const baseline = await fetchCurriculumBaselineList({
      country,
      university,
      department,
      level,
      semester
    })

    baseline.forEach(course => {
      const normalized = normalizeCourseRow(course)
      if (normalized.code) {
        allSuggestions.set(normalized.code, {
          ...normalized,
          source: 'ai_baseline',
          confidence: 0.8
        })
      }
    })

    // 2. Specialized AI suggestions for this context
    const specializedPrompt = `You are Luter's advanced course recommendation AI for Nigerian universities.

CONTEXT:
- University: ${university}
- Department/Programme: ${department}
- Level: ${level} (${level === '100' ? 'First Year' : level === '200' ? 'Second Year' : level === '300' ? 'Third Year' : level === '400' ? 'Fourth Year' : 'Final Year'})
- Semester: ${semester}
- Country: ${country}

TASK:
Generate 15-25 highly relevant courses that students in this specific academic context typically take. Consider:
1. Core departmental courses for this level
2. General studies/GST courses appropriate for this level
3. Electives that are popular for this programme
4. Prerequisite courses that build foundation for advanced levels
5. University-specific specializations (if known)

RULES:
- Use realistic Nigerian university course codes (e.g., CSC301, MTH203, GST111)
- Course codes MUST match the level (100L = 1xx, 200L = 2xx, etc.)
- Include course titles that are descriptive and accurate
- Mark courses as core, elective, or GST in your reasoning
- Return ONLY JSON array: [{"code":"CSC301","name":"Design & Analysis of Algorithms","type":"core"}]`

    const { data: specializedData } = await callGroqAPI(
      [{ role: 'user', content: specializedPrompt }],
      GROQ_MODELS.PROFESSOR,
      {
        temperature: 0.4,
        systemPromptOverride: 'You are an expert Nigerian university curriculum advisor. Generate accurate, contextually appropriate course lists.'
      }
    )

    if (specializedData?.choices?.[0]?.message?.content) {
      const raw = stripJsonFence(specializedData.choices[0].message.content)
      try {
        const specialized = JSON.parse(raw)
        if (Array.isArray(specialized)) {
          specialized.forEach(course => {
            const normalized = normalizeCourseRow(course)
            if (normalized.code) {
              const existing = allSuggestions.get(normalized.code)
              if (existing) {
                // Boost confidence if multiple sources agree
                existing.confidence = Math.min(0.95, existing.confidence + 0.1)
                existing.source = 'ai_hybrid'
              } else {
                allSuggestions.set(normalized.code, {
                  ...normalized,
                  source: 'ai_specialized',
                  confidence: 0.85
                })
              }
            }
          })
        }
      } catch {
        // AI parsing failed silently
      }
    }

    // 3. Trending/Popular courses AI analysis
    const trendingPrompt = `Based on current trends in Nigerian universities, what are the most popular and essential courses for ${department} students at ${level} level, ${semester} semester?

Consider:
- Industry-relevant courses
- Courses that prepare students for modern tech/industry demands
- Foundational courses that students should prioritize
- Courses that align with current job market needs

Return 8-12 courses as JSON: [{"code":"CSC301","name":"Course Name","reason":"Brief reason for popularity"}]`

    const { data: trendingData } = await callGroqAPI(
      [{ role: 'user', content: trendingPrompt }],
      GROQ_MODELS.PROFESSOR,
      { temperature: 0.5 }
    )

    if (trendingData?.choices?.[0]?.message?.content) {
      const raw = stripJsonFence(trendingData.choices[0].message.content)
      try {
        const trending = JSON.parse(raw)
        if (Array.isArray(trending)) {
          trending.forEach(course => {
            const normalized = normalizeCourseRow(course)
            if (normalized.code) {
              const existing = allSuggestions.get(normalized.code)
              if (existing) {
                existing.isTrending = true
                existing.trendingReason = course.reason
                existing.confidence = Math.min(0.95, existing.confidence + 0.05)
              } else {
                allSuggestions.set(normalized.code, {
                  ...normalized,
                  source: 'ai_trending',
                  confidence: 0.75,
                  isTrending: true,
                  trendingReason: course.reason
                })
              }
            }
          })
        }
      } catch {
        // Trending AI parsing failed silently
      }
    }

  } catch (error) {
    console.error('AI suggestion generation failed:', error)
  }

  return Array.from(allSuggestions.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 30) // Limit to top 30 suggestions
}

/**
 * Get peer-recommended courses for the same academic context
 */
async function getPeerRecommendations(university, department, level, semester) {
  const ctx = buildCurriculumKeyContext(university, department, level, semester)
  
  try {
    const { data: peerData, error } = await supabase
      .rpc('get_course_suggestions', {
        p_university_slug: ctx.uni_slug,
        p_department_slug: ctx.dept_slug,
        p_level: level,
        p_semester: semester,
        p_limit: 15
      })

    if (error) {
      return []
    }

    return peerData
      ?.filter(row => row.suggestion_type === 'peer_recommendation')
      ?.map(row => ({
      code: row.course_code,
      name: row.course_name,
      source: 'peer_recommendation',
      confidence: row.confidence_score,
      peerCount: row.peer_count,
      sourceData: row.source_data
    })) || []

  } catch (error) {
    console.error('Peer recommendations failed:', error)
    return []
  }
}

/**
 * Get hybrid course suggestions combining AI and peer data
 */
async function getHybridCourseSuggestions(university, department, level, semester, country = 'Nigeria') {
  const [aiSuggestions, peerRecommendations] = await Promise.all([
    getAiSuggestions(university, department, level, semester, country),
    getPeerRecommendations(university, department, level, semester)
  ])

  // Combine and deduplicate suggestions
  const combinedMap = new Map()

  // Add AI suggestions
  aiSuggestions.forEach(course => {
    combinedMap.set(course.code, {
      ...course,
      combinedScore: course.confidence * 0.6, // Weight AI confidence at 60%
      peerCount: 0
    })
  })

  // Add peer recommendations and boost scores for matches
  peerRecommendations.forEach(course => {
    const existing = combinedMap.get(course.code)
    if (existing) {
      // Boost existing AI suggestion with peer data
      existing.peerCount = course.peerCount || 0
      existing.combinedScore += (course.confidence * 0.4) // Add peer confidence at 40%
      existing.source = existing.source === 'ai_hybrid' ? 'ai_peer_hybrid' : 'hybrid'
      existing.sourceData = {
        ...existing.sourceData,
        peerData: course.sourceData
      }
    } else {
      // Add peer-only suggestion
      combinedMap.set(course.code, {
        ...course,
        combinedScore: course.confidence * 0.4, // Peer-only gets 40% weight
        peerCount: course.peerCount || 0
      })
    }
  })

  // Sort by combined score and return top results
  return Array.from(combinedMap.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, 25)
}

/**
 * Save user's course selections to improve peer recommendations
 */
async function saveUserCourseSelections(userId, university, department, level, semester, selectedCourses) {
  // Ensure we have strings even if objects are passed
  const uniName = typeof university === 'object' ? (university?.name || university?.university_name) : university;
  const deptName = typeof department === 'object' ? (department?.label || department?.name) : department;
  
  const ctx = buildCurriculumKeyContext(uniName || 'General', deptName || 'General', level, semester)
  
  // Ensure level is a string for the TEXT column in DB
  const levelStr = String(level || ctx.level || '100');
  
  try {
    const selections = selectedCourses.map(course => ({
      user_id: userId,
      university_slug: ctx.uni_slug || 'general',
      department_slug: ctx.dept_slug || 'general',
      level: levelStr,
      semester: semester || '1st',
      course_code: course.code,
      course_name: course.name
    }))

    const { error } = await supabase
      .from('peer_course_selections')
      .upsert(selections, { onConflict: 'user_id,university_slug,department_slug,level,semester,course_code' })

    if (error) {
      console.error('Peer_course_selections error:', error);
      // Detailed error for debugging
      if (error.code === 'PGRST204') {
        console.warn('Table "peer_course_selections" might be missing. Please run the course_suggestions_schema.sql migration.');
      }
      return false
    }

    return true

  } catch (error) {
    console.error('Error saving course selections:', error)
    return false
  }
}

/**
 * Get real-time course search with AI enhancement
 */
async function getEnhancedCourseSearch(query, university, department, level, semester, country = 'Nigeria') {
  const [liveSearch, suggestions] = await Promise.all([
    fetchGroqLiveCourseSearch({
      query,
      country,
      university,
      department,
      level,
      semester
    }),
    getHybridCourseSuggestions(university, department, level, semester, country)
  ])

  // Filter suggestions by query
  const filteredSuggestions = suggestions
    .filter(course => 
      course.code.toLowerCase().includes(query.toLowerCase()) ||
      course.name.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 8)

  // Combine and deduplicate
  const combined = new Map()
  
  // Add live search results
  liveSearch.forEach(course => {
    const normalized = normalizeCourseRow(course)
    if (normalized.code) {
      combined.set(normalized.code, {
        ...normalized,
        source: 'live_search',
        confidence: 0.9
      })
    }
  })

  // Add filtered suggestions
  filteredSuggestions.forEach(course => {
    if (!combined.has(course.code)) {
      combined.set(course.code, course)
    }
  })

  return Array.from(combined.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 12)
}

/**
 * Get course suggestions for onboarding with categories
 */
export async function getOnboardingCourseSuggestions(university, department, level, semester, country = 'Nigeria') {
  const suggestions = await getHybridCourseSuggestions(university, department, level, semester, country)
  
  // Categorize suggestions
  const categorized = {
    highlyRecommended: suggestions.filter(s => s.combinedScore >= 0.8).slice(0, 8),
    popular: suggestions.filter(s => s.peerCount >= 3).slice(0, 6),
    trending: suggestions.filter(s => s.isTrending).slice(0, 4),
    core: suggestions.filter(s => s.sourceData?.type === 'core' || s.code.match(/^(CSC|MTH|GST|ENG|PHY|CHM)/)).slice(0, 10),
    electives: suggestions.filter(s => s.sourceData?.type === 'elective' || s.code.match(/^(ELE|OPT)/)).slice(0, 6)
  }

  return {
    all: suggestions.slice(0, 20),
    categories: categorized,
    context: {
      university,
      department,
      level,
      semester,
      totalSuggestions: suggestions.length,
      hasPeerData: suggestions.some(s => s.peerCount > 0),
      hasAiData: suggestions.some(s => s.source?.includes('ai'))
    }
  }
}

export {
  getHybridCourseSuggestions,
  saveUserCourseSelections,
  getEnhancedCourseSearch,
  getAiSuggestions,
  getPeerRecommendations
}
