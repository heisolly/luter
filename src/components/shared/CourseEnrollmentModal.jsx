import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Search, Plus, BookOpen, Loader2, ChevronDown, 
  University, GraduationCap, Star, CheckCircle
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { 
  aggregateSyllabusSources
} from '../../services/syllabusAggregator'

import {
  fetchGroqLiveCourseSearch 
} from '../../groqClient'
import { saveUserCourseSelections } from '../../services/courseSuggestionService'

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
  const [country] = useState('Nigeria')
  
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
        console.log('Upserting courses to global catalog:', coursesToUpsert)
        const { error: upsertErr } = await supabase.from('courses').upsert(coursesToUpsert, { onConflict: 'code' })
        
        if (upsertErr) {
          console.error('Courses upsert err:', upsertErr)
          // Specifically handle 42501 (RLS violation) with a cleaner message
          if (upsertErr.code === '42501') {
             alert('Database Security Error: You do not have permission to add new courses to the global directory, or a background trigger for "semester_weeks" is blocked. Please run the provided SQL fix in Supabase.')
          } else {
             alert('System Notice (Courses): ' + upsertErr.message)
          }
          throw upsertErr
        }

        // Get the official DB IDs
        const { data: globalCourses, error: fetchErr } = await supabase
          .from('courses')
          .select('id, code')
          .in('code', selectedCodes)
          
        if (fetchErr) {
           console.error('Courses fetch err:', fetchErr)
           alert('System Notice (Fetch): ' + fetchErr.message)
           throw fetchErr
        }

        // Link courses to user
        if (globalCourses && globalCourses.length > 0) {
          const rows = globalCourses.map(c => ({
            user_id: user.id,
            course_id: c.id,
            progress: 0,
            target_score: 75,
          }))
          
          const { error: insertError } = await supabase
            .from('user_courses')
            .upsert(rows, { onConflict: 'user_id,course_id' })
          
          if (insertError) {
            console.error('UserCourses insert err:', insertError)
            alert('System Notice (UserCourses): ' + insertError.message)
            throw insertError
          }

          // Apply freemium locking
          const { error: lockingError } = await supabase.rpc('apply_freemium_locking', {
            p_user_id: user.id,
            p_course_ids: globalCourses.map(c => c.id)
          })
          
          if (lockingError) {
            console.error('Error applying freemium locking:', lockingError)
          }
        } else {
           alert('System Notice: No courses found in catalog after insertion.')
        }
      }

      // 4. Save to peer selections (Optional but good for recommendations)
      
      await saveUserCourseSelections(
        user.id,
        university || 'General',
        courseOfStudy || 'General',
        level || '100',
        semester || '1st',
        selectedCourses
      )

      onCoursesAdded(selectedCourses)
      onClose()
    } catch (error) {
      console.error('Error in handleAddCourses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)' }}
          onPointerDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-xl bg-white flex flex-col"
            style={{ 
              borderRadius: 28, 
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
              maxHeight: '85vh'
            }}
            onPointerDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(151,24,251,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <University size={18} color="var(--primary)" />
                  </div>
                  {step === 1 ? 'Academic Setup' : 'Add Courses'}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 46px', fontWeight: 500 }}>
                  {step === 1 ? "Let's personalize your library." : "Search and enroll in your current classes."}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ width: 36, height: 36, background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              {step === 1 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Institution</label>
                      <div style={{ position: 'relative' }}>
                         <University size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                         <input
                           type="text"
                           value={university}
                           onChange={(e) => setUniversity(e.target.value)}
                           placeholder="e.g. University of Lagos"
                           style={{ width: '100%', padding: '12px 16px 12px 40px', fontSize: 15, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, outline: 'none', transition: 'all 0.2s', fontWeight: 500 }}
                           onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(151,24,251,0.1)'; e.currentTarget.style.background = '#fff' }}
                           onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f8fafc' }}
                         />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Field of Study</label>
                      <div style={{ position: 'relative' }}>
                         <GraduationCap size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                         <input
                           type="text"
                           value={courseOfStudy}
                           onChange={(e) => setCourseOfStudy(e.target.value)}
                           placeholder="e.g. Computer Science"
                           style={{ width: '100%', padding: '12px 16px 12px 40px', fontSize: 15, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, outline: 'none', transition: 'all 0.2s', fontWeight: 500 }}
                           onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(151,24,251,0.1)'; e.currentTarget.style.background = '#fff' }}
                           onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f8fafc' }}
                         />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                       <div>
                         <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Academic Level</label>
                         <select
                           value={level}
                           onChange={(e) => setLevel(e.target.value)}
                           style={{ width: '100%', padding: '12px 16px', fontSize: 15, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, outline: 'none', appearance: 'none', fontWeight: 500, cursor: 'pointer' }}
                           onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = '#fff' }}
                           onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
                         >
                           <option value="100">100 Level</option>
                           <option value="200">200 Level</option>
                           <option value="300">300 Level</option>
                           <option value="400">400 Level</option>
                           <option value="500">500 Level</option>
                         </select>
                       </div>
                       <div>
                         <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Semester</label>
                         <select
                           value={semester}
                           onChange={(e) => setSemester(e.target.value)}
                           style={{ width: '100%', padding: '12px 16px', fontSize: 15, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, outline: 'none', appearance: 'none', fontWeight: 500, cursor: 'pointer' }}
                           onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = '#fff' }}
                           onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
                         >
                           <option value="1st">1st Semester</option>
                           <option value="2nd">2nd Semester</option>
                         </select>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Step 2: Search & Enroll
                <div>
                  <div style={{ position: 'relative', marginBottom: 24 }}>
                    <Search size={18} color="var(--primary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={courseTypeahead}
                      onChange={(e) => setCourseTypeahead(e.target.value)}
                      placeholder="Search by code (e.g. CSC101, PHY101)..."
                      style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: 15, background: '#fff', border: '2px solid rgba(151,24,251,0.2)', borderRadius: 16, outline: 'none', transition: 'all 0.2s', fontWeight: 600, color: '#0f172a', boxShadow: '0 8px 20px rgba(151,24,251,0.06)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(151,24,251,0.12)' }}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(151,24,251,0.2)' }
                    />
                    {liveSearchLoading && <Loader2 size={16} color="var(--primary)" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }} className="animate-spin" />}
                  </div>

                  {/* Selected Pill List */}
                  {selectedCourses.length > 0 && (
                    <div style={{ marginBottom: 28 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Ready to Enroll</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        <AnimatePresence>
                          {selectedCourses.map(c => (
                            <motion.div
                              key={c.code}
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(151,24,251,0.08)', border: '1px solid rgba(151,24,251,0.15)', borderRadius: 99, color: 'var(--primary)', fontSize: 13, fontWeight: 700 }}
                            >
                              {c.code}
                              <button
                                onClick={() => removeCourse(c.code)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: 'rgba(151,24,251,0.1)', cursor: 'pointer', border: 'none', color: 'var(--primary)' }}
                              >
                                <X size={12} strokeWidth={3} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Results List */}
                  <div>
                     <h4 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                       {courseTypeahead ? 'Search Results' : 'Recommended Courses'}
                     </h4>
                     
                     {aiBaselineError ? (
                       <div style={{ padding: 24, textAlign: 'center', background: '#fef2f2', borderRadius: 16 }}>
                         <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>{aiBaselineError}</p>
                         <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: 'white', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
                       </div>
                     ) : fetchingSyllabus ? (
                       <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                         <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
                         <span style={{ fontSize: 14, fontWeight: 500 }}>Scanning global directory...</span>
                       </div>
                     ) : combinedHits.length > 0 ? (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
                         {combinedHits.map(course => (
                           <div
                             key={course.code}
                             onClick={() => pickCourse(course.code, course.name, course.hitKind)}
                             style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s' }}
                             onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(151,24,251,0.3)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(151,24,251,0.06)' }}
                             onMouseOut={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none' }}
                           >
                             <div>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                 <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{course.code}</span>
                                 {course.hitKind === 'match' && (
                                   <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--primary)', background: 'rgba(151,24,251,0.1)', padding: '2px 6px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      <Star size={9} /> MATCH
                                   </span>
                                 )}
                               </div>
                               <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{course.name}</span>
                             </div>
                             <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                               <Plus size={16} strokeWidth={2.5} />
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : courseTypeahead ? (
                       <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 16 }}>
                         <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, margin: 0 }}>No matching courses found. Try tweaking your search.</p>
                       </div>
                     ) : (
                       <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 16 }}>
                         <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, margin: 0 }}>Type a course code above to find classes.</p>
                       </div>
                     )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={step === 1 ? onClose : handleBack}
                style={{ padding: '12px 20px', background: 'transparent', border: 'none', color: '#64748b', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.color = '#0f172a'}
                onMouseOut={e => e.currentTarget.style.color = '#64748b'}
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              
              <div style={{ display: 'flex', gap: 12 }}>
                {step === 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!university || !courseOfStudy}
                    style={{ 
                      padding: '12px 28px', 
                      background: (!university || !courseOfStudy) ? '#e2e8f0' : 'var(--primary)', 
                      color: (!university || !courseOfStudy) ? '#94a3b8' : 'white', 
                      fontSize: 15, fontWeight: 700, border: 'none', borderRadius: 14, cursor: (!university || !courseOfStudy) ? 'not-allowed' : 'pointer',
                      boxShadow: (!university || !courseOfStudy) ? 'none' : '0 8px 16px rgba(151,24,251,0.25)',
                      transition: 'all 0.2s'
                    }}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleAddCourses}
                    disabled={selectedCourses.length === 0 || loading}
                    style={{ 
                      padding: '12px 24px', 
                      background: (selectedCourses.length === 0 || loading) ? '#e2e8f0' : 'var(--primary)', 
                      color: (selectedCourses.length === 0 || loading) ? '#94a3b8' : 'white', 
                      fontSize: 15, fontWeight: 700, border: 'none', borderRadius: 14, cursor: (selectedCourses.length === 0 || loading) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      boxShadow: (selectedCourses.length === 0 || loading) ? 'none' : '0 8px 16px rgba(151,24,251,0.25)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} strokeWidth={2.5} />}
                    {loading ? 'Processing...' : `Enroll in ${selectedCourses.length} ${selectedCourses.length === 1 ? 'Course' : 'Courses'}`}
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
