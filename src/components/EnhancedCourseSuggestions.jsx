import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  X, 
  Loader2
} from 'lucide-react'
import { getOnboardingCourseSuggestions, getEnhancedCourseSearch } from '../services/courseSuggestionService'

/**
 * Clean Course Suggestion Component for Onboarding
 * Minimal, professional interface without exposing internal operations
 */
export default function EnhancedCourseSuggestions({
  university,
  department,
  level,
  semester,
  country = 'Nigeria',
  selectedCourses,
  onCourseSelect,
  onCourseRemove
}) {
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Load suggestions on component mount
  useEffect(() => {
    loadSuggestions()
  }, [university, department, level, semester, country])

  // Enhanced search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, university, department, level, semester])

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const data = await getOnboardingCourseSuggestions(university, department, level, semester, country)
      setSuggestions(data)
    } catch (error) {
      console.error('Failed to load course suggestions:', error)
      setSuggestions({
        all: [],
        categories: {
          highlyRecommended: [],
          popular: [],
          trending: [],
          core: [],
          electives: []
        },
        context: {
          totalSuggestions: 0,
          hasPeerData: false,
          hasAiData: false
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async (query) => {
    setSearchLoading(true)
    try {
      const results = await getEnhancedCourseSearch(query, university, department, level, semester, country)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const isCourseSelected = (courseCode) => {
    return selectedCourses.some(course => course.code === courseCode)
  }

  const handleCourseClick = (course) => {
    if (isCourseSelected(course.code)) return
    
    onCourseSelect({
      code: course.code,
      name: course.name,
      source: course.source || 'suggestion',
      confidence: course.confidence || course.combinedScore,
      peerCount: course.peerCount || 0,
      isTrending: course.isTrending || false,
      trendingReason: course.trendingReason
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
        <div style={{ marginTop: 16, fontSize: 15, fontWeight: 800, color: '#111' }}>
          Loading courses...
        </div>
      </div>
    )
  }

  // Group suggestions by course code prefix (CSC, MTH, GST, etc.)
  const groupedSuggestions = suggestions?.all?.reduce((groups, course) => {
    const prefix = course.code.match(/^[A-Z]+/)?.[0] || 'OTHER'
    if (!groups[prefix]) groups[prefix] = []
    groups[prefix].push(course)
    return groups
  }, {}) || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: window.innerWidth <= 768 ? 16 : 24 }}>
      
      {/* Search Bar */}
      <div style={{ 
        background: 'white', 
        borderRadius: 16, 
        padding: window.innerWidth <= 768 ? 16 : 20, 
        border: '1px solid #e2e8f0' 
      }}>
        <div style={{ position: 'relative' }}>
          <label htmlFor="course-search-input" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
            Search courses
          </label>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: 14, pointerEvents: 'none' }} />
          <input
            type="text"
            id="course-search-input"
            name="courseSearch"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
            placeholder="Search courses by code or name"
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: window.innerWidth <= 768 ? 16 : 14,
              fontWeight: 600,
              outline: 'none',
              background: 'white',
              textTransform: 'uppercase',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#7a12cc' }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
          />
                  </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginTop: 12,
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                maxHeight: window.innerWidth <= 768 ? 150 : 200,
                overflowY: 'auto'
              }}
            >
              {searchResults.map((course) => (
                <div
                  key={course.code}
                  onClick={() => handleCourseClick(course)}
                  style={{
                    padding: window.innerWidth <= 768 ? '14px 16px' : '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: isCourseSelected(course.code) ? 'default' : 'pointer',
                    background: isCourseSelected(course.code) ? '#f8fafc' : 'white',
                    opacity: isCourseSelected(course.code) ? 0.6 : 1,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => !isCourseSelected(course.code) && (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => !isCourseSelected(course.code) && (e.currentTarget.style.background = 'white')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: window.innerWidth <= 768 ? 14 : 13, fontWeight: 900, color: '#7a12cc', letterSpacing: '0.06em' }}>
                        {course.code}
                      </div>
                      <div style={{ fontSize: window.innerWidth <= 768 ? 13 : 12, fontWeight: 600, color: '#334155', marginTop: 2, lineHeight: 1.3 }}>
                        {course.name}
                      </div>
                    </div>
                    {isCourseSelected(course.code) && (
                      <div style={{ 
                        width: 20, 
                        height: 20, 
                        borderRadius: '50%', 
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <div style={{ width: 6, height: 3, background: 'white', transform: 'rotate(-45deg)' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filtered Suggestions */}
      {Object.keys(groupedSuggestions).length > 0 && (
        <div>
          <div style={{ fontSize: window.innerWidth <= 768 ? 16 : 14, fontWeight: 700, color: '#334155', marginBottom: 16 }}>
            Filtered Suggestions
          </div>
          
          {Object.entries(groupedSuggestions).map(([prefix, courses]) => (
            <div key={prefix} style={{ marginBottom: window.innerWidth <= 768 ? 16 : 20 }}>
              <div style={{ 
                fontSize: window.innerWidth <= 768 ? 13 : 12, 
                fontWeight: 800, 
                color: '#7a12cc', 
                marginBottom: 8,
                letterSpacing: '0.06em'
              }}>
                {prefix}
              </div>
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: window.innerWidth <= 768 ? 6 : 8 
              }}>
                {courses.slice(0, window.innerWidth <= 768 ? 8 : 6).map((course) => (
                  <motion.button
                    key={course.code}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleCourseClick(course)}
                    disabled={isCourseSelected(course.code)}
                    style={{
                      padding: window.innerWidth <= 768 ? '10px 14px' : '8px 12px',
                      borderRadius: 8,
                      border: isCourseSelected(course.code) 
                        ? '2px solid #10b981' 
                        : '1px solid #e2e8f0',
                      background: isCourseSelected(course.code) ? '#f0fdf4' : 'white',
                      cursor: isCourseSelected(course.code) ? 'default' : 'pointer',
                      fontSize: window.innerWidth <= 768 ? 12 : 11,
                      fontWeight: 700,
                      color: isCourseSelected(course.code) ? '#166534' : '#374151',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      minWidth: window.innerWidth <= 768 ? 'auto' : 'fit-content'
                    }}
                    whileHover={!isCourseSelected(course.code) ? { y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : {}}
                  >
                    <span style={{ fontSize: window.innerWidth <= 768 ? 11 : 10, fontWeight: 900, letterSpacing: '0.04em' }}>
                      {course.code}
                    </span>
                    {isCourseSelected(course.code) && (
                      <div style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ width: 4, height: 2, background: 'white', transform: 'rotate(-45deg)' }} />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Courses */}
      {selectedCourses.length > 0 && (
        <div style={{ 
          padding: window.innerWidth <= 768 ? 20 : 16, 
          background: '#f8fafc', 
          borderRadius: 12, 
          border: '1px solid #e2e8f0' 
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', marginBottom: 8 }}>
            SELECTED ({selectedCourses.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedCourses.map((course) => (
              <div
                key={course.code}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 20,
                  background: '#7a12cc',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                {course.code}
                <button
                  type="button"
                  onClick={() => onCourseRemove(course.code)}
                  style={{ 
                    border: 'none', 
                    background: 'transparent', 
                    padding: 0, 
                    cursor: 'pointer', 
                    display: 'flex',
                    color: 'white' 
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {Object.keys(groupedSuggestions).length === 0 && !searchQuery && (
        <div style={{
          textAlign: 'center',
          padding: window.innerWidth <= 768 ? '32px 20px' : '40px 20px',
          background: '#f8fafc',
          borderRadius: 16,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Search size={20} color="#64748b" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
            No courses found
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Try searching with different keywords
          </div>
        </div>
      )}
    </div>
  )
}
