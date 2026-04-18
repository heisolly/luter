import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  X, 
  Loader2,
  Sparkles,
  CheckCircle2,
  Plus
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
  const [errorStatus, setErrorStatus] = useState(null)

  // Load suggestions on component mount
  useEffect(() => {
    loadSuggestions()
  }, [university, department, level, semester, country])

  // Enhanced search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setErrorStatus(null)
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, university, department, level, semester])

  const loadSuggestions = async () => {
    setLoading(true)
    setErrorStatus(null)
    try {
      const data = await getOnboardingCourseSuggestions(university, department, level, semester, country)
      setSuggestions(data)
    } catch (error) {
      console.error('Failed to load course suggestions:', error)
      setErrorStatus('connection')
      setSuggestions({
        all: [],
        categories: { highlyRecommended: [], popular: [], trending: [], core: [], electives: [] },
        context: { totalSuggestions: 0, hasPeerData: false, hasAiData: false }
      })
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async (query) => {
    setSearchLoading(true)
    setErrorStatus(null)
    try {
      const results = await getEnhancedCourseSearch(query, university, department, level, semester, country)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setErrorStatus('search')
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* Search Console */}
      <div style={{ position: 'relative' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'white', 
          borderRadius: 18, 
          padding: '4px 6px',
          border: '1.5px solid #F1F5F9',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          transition: 'all 0.3s ease'
        }}
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 10px 30px var(--primary-glow-subtle)'; }}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#F1F5F9'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)'; }}
        >
          <div style={{ padding: '0 16px', color: '#94A3B8' }}>
            {searchLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
            placeholder="Search by course code or name..."
            style={{
              flex: 1,
              padding: '16px 0',
              border: 'none',
              fontSize: 15,
              fontWeight: 700,
              outline: 'none',
              background: 'transparent',
              color: '#111'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ padding: '0 16px', color: '#94A3B8' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Floating Search Results */}
        <AnimatePresence>
          {searchQuery && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                borderRadius: 20,
                marginTop: 8,
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                border: '1px solid #F1F5F9',
                zIndex: 100,
                maxHeight: 320,
                overflowY: 'auto'
              }}
            >
              {searchResults.map((course) => (
                <div
                  key={course.code}
                  onClick={() => handleCourseClick(course)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    cursor: isCourseSelected(course.code) ? 'default' : 'pointer',
                    background: isCourseSelected(course.code) ? '#F8FAFC' : 'white',
                    borderBottom: '1px solid #F1F5F9'
                  }}
                  className="search-item-hover"
                >
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 12, background: isCourseSelected(course.code) ? '#10B981' : 'var(--primary-bg)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCourseSelected(course.code) ? 'white' : 'var(--primary)',
                    fontWeight: 900, fontSize: 11
                  }}>
                    {isCourseSelected(course.code) ? <CheckCircle2 size={20} /> : course.code.substring(0, 3)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#111' }}>{course.code}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>{course.name}</div>
                  </div>
                  {!isCourseSelected(course.code) && (
                    <div style={{ color: 'var(--primary)', opacity: 0.3 }}><Plus size={20} /></div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recommended Grid — Minimal & Clean */}
      {!searchQuery && Object.keys(groupedSuggestions).length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontSize: 13, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended for you</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {suggestions.all.slice(0, 8).map((course) => (
              <motion.button
                key={course.code}
                whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(151,24,251,0.08)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCourseClick(course)}
                disabled={isCourseSelected(course.code)}
                style={{
                  padding: '16px',
                  borderRadius: 18,
                  border: isCourseSelected(course.code) ? '2px solid #10B981' : '1px solid #F1F5F9',
                  background: isCourseSelected(course.code) ? '#F0FDF4' : 'white',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  cursor: isCourseSelected(course.code) ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 900, color: isCourseSelected(course.code) ? '#10B981' : 'var(--primary)', letterSpacing: '0.05em' }}>
                  {isCourseSelected(course.code) ? 'ADDED' : course.code}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>
                  {course.name.length > 25 ? course.name.substring(0, 25) + '...' : course.name}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error States */}
      {errorStatus && (
        <div style={{ 
          padding: 16, borderRadius: 18, background: '#FEF2F2', border: '1px solid #FEE2E2',
          display: 'flex', alignItems: 'center', gap: 12, color: '#991B1B' 
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Search connection lost</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>We're having trouble reaching the catalog.</div>
          </div>
          {errorStatus === 'connection' && (
            <button 
              onClick={loadSuggestions}
              style={{ padding: '8px 16px', borderRadius: 10, background: '#991B1B', color: 'white', border: 'none', fontSize:12, fontWeight:700, cursor: 'pointer' }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Empty Search State */}
      {searchQuery && searchResults.length === 0 && !searchLoading && !errorStatus && (
        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
          <Search size={32} style={{ marginBottom: 16, margin: '0 auto', display: 'block' }} />
          <p style={{ fontWeight: 700 }}>No results found for "{searchQuery}"</p>
          <p style={{ fontSize: 13 }}>Try searching for the course code (e.g. CSC 101)</p>
        </div>
      )}
    </div>
  )
}
