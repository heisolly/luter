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

      <div className="courses-grid">
        {courses.map((c, idx) => (
          <motion.div
            key={c.code}
            className={`course-full-card ${c.isLocked && !isPremium ? 'course-full-card--locked' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            whileHover={{ y: c.isLocked && !isPremium ? 0 : -4 }}
            onClick={() => handleCourseClick(c)}
            style={{
              cursor: 'pointer',
              position: 'relative',
              opacity: c.isLocked && !isPremium ? 0.7 : 1
            }}
          >
            {/* Lock overlay */}
            {c.isLocked && !isPremium && (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-2xl z-10 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg border border-amber-400">
                  <Lock size={20} className="text-amber-600" />
                </div>
              </div>
            )}

            <div className="cfc-stripe" style={{ background: c.isLocked && !isPremium ? '#fbbf24' : c.color }} />
            <div className="cfc-body">
              <div className="cfc-header">
                <div style={{ flex: 1 }}>
                  <div className="cfc-code" style={{ color: c.color }}>{c.code}</div>
                  <h3 className="cfc-name">{c.name}</h3>
                  <p className="cfc-dept">{c.dept}</p>
                </div>
              </div>

              <div className="cfc-progress-section">
                <div className="cfc-prog-header">
                  <span>Progress</span>
                  <span style={{ color: c.color, fontWeight: 700 }}>{c.progress}%</span>
                </div>
                <div className="cfc-prog-track">
                  <motion.div
                    className="cfc-prog-fill"
                    style={{ background: c.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add course CTA */}
        <motion.div
          className="course-add-card"
          whileHover={{ scale: 1.02, borderColor: '#7a12cc' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddCourse}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Plus size={24} strokeWidth={2} color="#7a12cc" />
          </div>
          <h4 style={{ fontFamily: 'Varela Round', fontSize: '16px', color: '#4C1D95', margin: 0 }}>Enroll New Course</h4>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>Add another class to your semester loadout.</p>
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
