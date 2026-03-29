import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { BookOpen, Plus, Upload, FileText, MoreVertical, Zap, ChevronRight, Loader2, Lock, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import PremiumModal from '../shared/PremiumModal'

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

  return (
    <div className="dh-root" style={{ padding: isMobile ? '20px 16px' : '28px 32px' }}>
      <div className="dh-topbar" style={{ 
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 12 : 12
      }}>
        <div className="dh-topbar-left" style={{ width: isMobile ? '100%' : 'auto' }}>
          <h1 className="dh-page-title" style={{ fontSize: isMobile ? 24 : 22 }}>My Courses</h1>
          <p className="dh-page-sub">
            {user?.user_metadata?.university || 'University Student'} · First Semester
          </p>
        </div>
        <div className="dh-topbar-right" style={{ width: isMobile ? '100%' : 'auto' }}>
          <button className="dh-upload-btn" style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
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
              cursor: c.isLocked && !isPremium ? 'pointer' : 'default',
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
                <button className="cfc-menu"><MoreVertical size={16} /></button>
              </div>

              <div className="cfc-lecturer">
                <span className="cfc-lecturer-label">Lecturer:</span>
                <span className="cfc-lecturer-name">{c.lecturer}</span>
              </div>

              <div className="cfc-progress-section">
                <div className="cfc-prog-header">
                  <span>Coverage</span>
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

              <div className="cfc-meta">
                <div className="cfc-meta-item">
                  <FileText size={13} strokeWidth={1.8} />
                  <span>{c.files} files uploaded</span>
                </div>
              </div>

              <div className="cfc-actions">
                <button
                  className={`cfc-btn-primary ${c.isLocked && !isPremium ? 'cfc-btn-primary--locked' : ''}`}
                  style={{ '--c': c.isLocked && !isPremium ? '#fbbf24' : c.color }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCourseClick(c)
                  }}
                >
                  {c.isLocked && !isPremium ? (
                    <><Lock size={13} strokeWidth={2} /> Unlock Course</>
                  ) : (
                    <><BookOpen size={13} strokeWidth={2} /> Open Workstation</>
                  )}
                </button>
                <button 
                  className="cfc-btn-ghost"
                  onClick={(e) => e.stopPropagation()}
                  disabled={c.isLocked && !isPremium}
                >
                  <Upload size={13} strokeWidth={2} />
                  Upload
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add course CTA */}
        <motion.div
          className="course-add-card"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={28} strokeWidth={1.5} />
          <h4>Enroll New Course</h4>
          <p>Add another class to your semester loadout.</p>
        </motion.div>
      </div>

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
