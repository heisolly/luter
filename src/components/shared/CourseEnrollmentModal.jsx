import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Search, Plus, BookOpen, Loader2, ChevronDown, 
  University, GraduationCap, Sparkles, CheckCircle
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { 
  aggregateSyllabusSources
} from '../../services/syllabusAggregator'
import {
  buildCurriculumKeyContext
} from '../../services/curriculumService'
import {
  fetchGroqLiveCourseSearch 
} from '../../groqClient'

export default function CourseEnrollmentModal({ 
  isOpen, 
  onClose, 
  user, 
  onCoursesAdded,
  existingCourses = []
}) {
  const [step, setStep] = useState(1) // 1: Academic Info, 2: Course Selection
  const [loading, setLoading] = useState(false)
  
  // Academic info
  const [university, setUniversity] = useState('')
  const [courseOfStudy, setCourseOfStudy] = useState('')
  const [level, setLevel] = useState('100')
  const [semester, setSemester] = useState('1st')
  const [country, setCountry] = useState('Nigeria')
  
  // Course selection
  const [catalog, setCatalog] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])
  const [courseTypeahead, setCourseTypeahead] = useState('')
  const [aiSearchResults, setAiSearchResults] = useState([])
  const [liveSearchLoading, setLiveSearchLoading] = useState(false)
  const [fetchingSyllabus, setFetchingSyllabus] = useState(false)
  const [aiBaselineError, setAiBaselineError] = useState(null)
  
  const liveSearchSeqRef = useRef(0)

  // Load user's existing academic info on mount
  useEffect(() => {
    if (user && isOpen) {
      const loadUserInfo = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('university, faculty, level, curriculum_context')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUniversity(profile.university || '')
          setCourseOfStudy(profile.faculty || '')
          setLevel(profile.level || '100')
          
          // Parse curriculum context if available
          if (profile.curriculum_context) {
            setSemester(profile.curriculum_context.semester || '1st')
          }
        }
      }
      loadUserInfo()
    }
  }, [user, isOpen])

  // Load curriculum catalog when academic info changes
  useEffect(() => {
    if (!university || !courseOfStudy || !level || !semester) return
    
    const loadCurriculum = async () => {
      setFetchingSyllabus(true)
      setAiBaselineError(null)
      try {
        const { catalog: next } = await aggregateSyllabusSources({
          university,
          department: courseOfStudy,
          level,
          semester,
          country,
        })
        setCatalog(next)
        setSelectedCourses([])
      } catch (e) {
        console.warn(e)
        setCatalog([])
        setAiBaselineError('Could not load courses. Try again.')
      }
      setFetchingSyllabus(false)
    }
    
    if (step === 2) {
      loadCurriculum()
    }
  }, [university, courseOfStudy, level, semester, country, step])

  // Live course search
  useEffect(() => {
    if (step !== 2) return
    const q = courseTypeahead.trim()
    if (q.length < 2) {
      setAiSearchResults([])
      setLiveSearchLoading(false)
      return
    }
    
    const seq = ++liveSearchSeqRef.current
    setLiveSearchLoading(true)
    const t = setTimeout(async () => {
      try {
        const rows = await fetchGroqLiveCourseSearch({
          query: q,
          country,
          university,
          department: courseOfStudy,
          level,
          semester,
        })
        if (liveSearchSeqRef.current !== seq) return
        setAiSearchResults(Array.isArray(rows) ? rows : [])
      } catch {
        if (liveSearchSeqRef.current === seq) setAiSearchResults([])
      } finally {
        if (liveSearchSeqRef.current === seq) setLiveSearchLoading(false)
      }
    }, 420)
    return () => clearTimeout(t)
  }, [courseTypeahead, step, country, university, courseOfStudy, level, semester])

  const libraryHits = useMemo(() => {
    const q = courseTypeahead.trim().toUpperCase()
    if (!q) return []
    return catalog
      .filter(c => c.code.includes(q) || (c.name && c.name.toUpperCase().includes(q)))
      .slice(0, 30)
  }, [catalog, courseTypeahead])

  const combinedHits = useMemo(() => {
    const seen = new Set()
    const out = []
    
    // Filter out already enrolled courses
    const existingCodes = new Set(existingCourses.map(c => c.code))
    
    for (const c of libraryHits) {
      if (seen.has(c.code) || existingCodes.has(c.code)) continue
      seen.add(c.code)
      out.push({ code: c.code, name: c.name, hitKind: 'library' })
    }
    for (const c of aiSearchResults) {
      if (!c?.code || seen.has(c.code) || existingCodes.has(c.code)) continue
      seen.add(c.code)
      out.push({ code: c.code, name: c.name, hitKind: 'match' })
    }
    return out.slice(0, 45)
  }, [libraryHits, aiSearchResults, existingCourses])

  const pickCourse = (code, name, hitKind) => {
    setSelectedCourses(prev => {
      if (prev.some(p => p.code === code)) return prev
      return [...prev, { code, name, hitKind }]
    })
    setCourseTypeahead('')
  }

  const removeCourse = (code) => {
    setSelectedCourses(prev => prev.filter(c => c.code !== code))
  }

  const handleNext = () => {
    if (step === 1) {
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  const handleAddCourses = async () => {
    if (selectedCourses.length === 0) return
    
    setLoading(true)
    try {
      const selectedCodes = selectedCourses.map(c => c.code)
      const coursesToUpsert = selectedCourses.map(c => ({
        code: c.code,
        name: c.name,
        faculty: courseOfStudy,
      }))

      // Insert missing courses into global catalog
      if (coursesToUpsert.length > 0) {
        await supabase.from('courses').upsert(coursesToUpsert, { onConflict: 'code' })

        // Get the official DB IDs
        const { data: globalCourses } = await supabase
          .from('courses')
          .select('id, code')
          .in('code', selectedCodes)

        // Link courses to user
        if (globalCourses && globalCourses.length > 0) {
          const rows = globalCourses.map(c => ({
            user_id: user.id,
            course_id: c.id,
            progress: 0,
            target_score: 75, // Default target score
          }))
          
          const { error: insertError } = await supabase
            .from('user_courses')
            .upsert(rows, { onConflict: 'user_id,course_id' })
          
          if (!insertError) {
            // Apply freemium locking
            const { error: lockingError } = await supabase.rpc('apply_freemium_locking', {
              p_user_id: user.id,
              p_course_ids: globalCourses.map(c => c.id)
            })
            
            if (lockingError) {
              console.error('Error applying freemium locking:', lockingError)
            }
          }
        }
      }

      onCoursesAdded(selectedCourses)
      onClose()
    } catch (error) {
      console.error('Error adding courses:', error)
      alert('Failed to add courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl border-2 border-gray-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-black text-gray-900">
              {step === 1 ? 'Add New Courses' : 'Select Courses'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {step === 1 ? (
              // Step 1: Academic Information
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    University
                  </label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g., University of Lagos"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course of Study
                  </label>
                  <input
                    type="text"
                    value={courseOfStudy}
                    onChange={(e) => setCourseOfStudy(e.target.value)}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Level
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="100">100 Level</option>
                      <option value="200">200 Level</option>
                      <option value="300">300 Level</option>
                      <option value="400">400 Level</option>
                      <option value="500">500 Level</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="1st">1st Semester</option>
                      <option value="2nd">2nd Semester</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="South Africa">South Africa</option>
                  </select>
                </div>
              </div>
            ) : (
              // Step 2: Course Selection
              <div className="p-6">
                {/* Search */}
                <div className="relative mb-6">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={courseTypeahead}
                    onChange={(e) => setCourseTypeahead(e.target.value)}
                    placeholder="Search for courses (e.g., CSC101, MTH101)..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {liveSearchLoading && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Selected Courses */}
                {selectedCourses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Selected Courses ({selectedCourses.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourses.map(course => (
                        <div
                          key={course.code}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                        >
                          <span>{course.code}: {course.name}</span>
                          <button
                            onClick={() => removeCourse(course.code)}
                            className="w-4 h-4 bg-purple-200 rounded-full flex items-center justify-center hover:bg-purple-300 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Course Results */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Available Courses
                  </h3>
                  {aiBaselineError ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-4">{aiBaselineError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : fetchingSyllabus ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="animate-spin text-purple-600" />
                      <span className="ml-2 text-gray-600">Loading courses...</span>
                    </div>
                  ) : combinedHits.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {combinedHits.map(course => (
                        <button
                          key={course.code}
                          onClick={() => pickCourse(course.code, course.name, course.hitKind)}
                          className="w-full text-left p-3 border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-gray-900">{course.code}</span>
                              <span className="ml-2 text-gray-600">{course.name}</span>
                            </div>
                            <Plus size={16} className="text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : courseTypeahead ? (
                    <p className="text-center py-8 text-gray-500">
                      No courses found. Try a different search term.
                    </p>
                  ) : (
                    <p className="text-center py-8 text-gray-500">
                      Start typing to search for courses...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={step === 1 ? onClose : handleBack}
              className="px-6 py-3 text-gray-700 font-semibold hover:text-gray-900 transition-colors"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            
            <div className="flex gap-3">
              {step === 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!university || !courseOfStudy}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleAddCourses}
                  disabled={selectedCourses.length === 0 || loading}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add {selectedCourses.length} Course{selectedCourses.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
