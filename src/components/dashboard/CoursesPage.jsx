import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Plus, Upload, FileText, MoreVertical, Zap, ChevronRight, Loader2, Lock, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import PremiumModal from '../shared/PremiumModal'
import CourseEnrollmentModal from '../shared/CourseEnrollmentModal'

const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

export default function CoursesPage() {
  const navigate = useNavigate()
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [isPremium, setIsPremium] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)

  useEffect(() => {
    if (!user) return
    if (!ready) return

    // Check if user is premium
    const checkPremiumStatus = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()
      
      setIsPremium(profile?.is_premium || false)
    }
    
    checkPremiumStatus()

    const mapRows = (uc) =>
      uc.map((row, i) => ({
        id:       row.course.id,
        code:     row.course.code,
        name:     row.course.name,
        dept:     row.course.faculty || 'General',
        lecturer: 'Assigned Lecturer',
        files:    0,
        progress: row.progress || 0,
        color:    PALETTE[i % PALETTE.length],
        isLocked: row.is_locked || false,
        lockedReason: row.locked_reason
      }))

    const loadRemote = async () => {
      const { data: uc } = await supabase
        .from('user_courses')
        .select('id, progress, course:courses(id, code, name, faculty)')
        .eq('user_id', user.id)
        .order('created_at')

      if (uc) setCourses(mapRows(uc))
      setLoading(false)
    }

    if (bundle?.uc && !bundle.uc.error && Array.isArray(bundle.uc.data)) {
      setCourses(mapRows(bundle.uc.data))
      setLoading(false)
      return
    }
    loadRemote()
  }, [user, ready, bundle])

  const handleCourseClick = (course) => {
    if (course.isLocked && !isPremium) {
      setSelectedCourse(course)
      setShowPremiumModal(true)
    } else {
      navigate(`/dashboard/courses/${course.id}`)
    }
  }

  const handleUpgrade = () => {
    navigate('/dashboard/pricing')
  }

  const handleStartTrial = async () => {
    try {
      const { data, error } = await supabase.rpc('start_free_trial', {
        p_user_id: user.id
      })

      if (error) throw error

      if (data) {
        setIsPremium(true)
        // Refresh courses to show they're unlocked
        window.location.reload()
      } else {
        alert('You have already used your free trial. Please upgrade to Premium.')
      }
    } catch (error) {
      console.error('Error starting trial:', error)
      alert('Failed to start trial. Please try again.')
    }
  }

  const lockedCourses = courses.filter(c => c.isLocked)

  const handleAddCourse = () => {
    setShowEnrollmentModal(true)
  }

  const handleCoursesAdded = (newCourses) => {
    // Refresh the courses list to show newly added courses
    window.location.reload()
  }

  return (
    <div className="dh-root" style={{ padding: isMobile ? '20px 16px' : '40px' }}>
      <div className="dh-topbar" style={{ 
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 12 : 12,
        marginBottom: '40px'
      }}>
        <div className="dh-topbar-left" style={{ width: isMobile ? '100%' : 'auto' }}>
          <h1 className="dh-page-title" style={{ fontSize: isMobile ? 28 : 32, fontFamily: 'Varela Round' }}>My Courses</h1>
          <p className="dh-page-sub">
            {user?.user_metadata?.university || 'University Student'} · First Semester
          </p>
        </div>
        <div className="dh-topbar-right" style={{ width: isMobile ? '100%' : 'auto', marginLeft: 'auto' }}>
          <button 
            className="dh-upload-btn" 
            style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
            onClick={handleAddCourse}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {courses.map((c, idx) => (
          <motion.div
            key={c.code}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: c.isLocked && !isPremium ? 1 : 1.01 }}
            onClick={() => handleCourseClick(c)}
            style={{
              cursor: 'pointer',
              position: 'relative',
              background: 'white',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              border: c.isLocked && !isPremium ? '1px solid #fbbf24' : '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              opacity: c.isLocked && !isPremium ? 0.75 : 1,
              overflow: 'hidden'
            }}
          >
            {/* Lock overlay effect on the left icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: c.isLocked && !isPremium ? '#fef3c7' : `${c.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              flexShrink: 0
            }}>
              {c.isLocked && !isPremium ? (
                <Lock size={28} className="text-amber-500" />
              ) : (
                <span style={{ color: c.color, fontSize: '20px', fontWeight: 800, fontFamily: 'Varela Round' }}>
                  {c.code.replace(/[^A-Za-z]/g, '').substring(0, 3)}
                </span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ 
                  color: c.isLocked && !isPremium ? '#d97706' : c.color, 
                  fontWeight: 800, 
                  fontSize: '14px',
                  letterSpacing: '0.5px'
                }}>
                  {c.code}
                </span>
                {c.isLocked && !isPremium && (
                  <span className="text-amber-600 bg-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    LOCKED
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>{c.name}</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>{c.dept}</p>
            </div>

            <div style={{ width: '180px', display: isMobile ? 'none' : 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Progress</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: c.isLocked && !isPremium ? '#d97706' : c.color }}>{c.progress}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: c.isLocked && !isPremium ? '#fbbf24' : c.color, borderRadius: '4px' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${c.progress}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                />
              </div>
            </div>

            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: '#f8fafc',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid #e2e8f0',
              marginLeft: isMobile ? 'auto' : '16px'
            }}>
              <ChevronRight size={20} color={c.isLocked && !isPremium ? '#d97706' : c.color} style={{ marginLeft: '2px' }} />
            </div>
          </motion.div>
        ))}

        {/* Add course CTA */}
        <motion.div
           whileHover={{ scale: 1.01, borderColor: '#7a12cc', backgroundColor: '#faf5ff' }}
           whileTap={{ scale: 0.99 }}
           onClick={handleAddCourse}
           style={{
             cursor: 'pointer',
             background: 'transparent',
             borderRadius: '20px',
             padding: '24px',
             display: 'flex',
             alignItems: 'center',
             gap: '24px',
             border: '2px dashed #cbd5e1',
             marginTop: '8px'
           }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={28} color="#94a3b8" />
          </div>
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#475569', margin: '0 0 4px' }}>Enroll a New Course</h4>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, fontWeight: 500 }}>Search for another class to add to your semester loadout.</p>
          </div>
        </motion.div>
      </div>

      {/* Course Enrollment Modal */}
      <CourseEnrollmentModal
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        user={user}
        onCoursesAdded={handleCoursesAdded}
        existingCourses={courses}
      />

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        course={selectedCourse}
        lockedCourses={lockedCourses}
        onUpgrade={handleUpgrade}
        onStartTrial={handleStartTrial}
      />
    </div>
  )
}
