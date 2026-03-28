import { useState, useEffect } from 'react'
import { BookOpen, Plus, Upload, FileText, MoreVertical, Zap, ChevronRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabaseClient'

const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

export default function CoursesPage({ user, onOpenCourse, isMobile }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data: uc, error } = await supabase
        .from('user_courses')
        .select('id, progress, course:courses(id, code, name, faculty)')
        .eq('user_id', user.id)
        .order('created_at')

      if (uc) {
        setCourses(uc.map((row, i) => ({
          id:       row.course.id,
          code:     row.course.code,
          name:     row.course.name,
          dept:     row.course.faculty || 'General',
          lecturer: 'Assigned Lecturer', // We can add this to courses table later
          files:    0,                   // Will come from materials table
          progress: row.progress || 0,
          color:    PALETTE[i % PALETTE.length],
        })))
      }
      setLoading(false)
    }

    load()
  }, [user])

  if (loading) {
    return (
      <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
        <Loader2 className="animate-spin" size={28} color="var(--primary)" />
      </div>
    )
  }

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
            className="course-full-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            whileHover={{ y: -4 }}
          >
            <div className="cfc-stripe" style={{ background: c.color }} />
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
                  className="cfc-btn-primary"
                  style={{ '--c': c.color }}
                  onClick={() => onOpenCourse?.(c)}
                >
                  <BookOpen size={13} strokeWidth={2} />
                  Open Workstation
                </button>
                <button className="cfc-btn-ghost">
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
    </div>
  )
}
