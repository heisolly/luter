import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { 
  Plus, ChevronRight, Lock, MoreVertical, Trash2, Loader2,
  Share2, Moon, ArrowLeftRight, Pencil, EyeOff, Send, Download, FileText,
  X, Check, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import PremiumModal from '../shared/PremiumModal'
import CourseEnrollmentModal from '../shared/CourseEnrollmentModal'

const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

export default function CoursesPage() {
  const navigate = useNavigate()
  const { user, isMobile } = useOutletContext()
  const { ready, bundle, refresh } = useDashboardPrefetch()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [isPremium, setIsPremium] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Edit State
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const mapRows = useCallback((uc) =>
    uc.map((row, i) => ({
      id:       row.course.id,
      ucId:     row.id,
      code:     row.course.code,
      name:     row.custom_name || row.course.name,
      originalName: row.course.name,
      dept:     row.course.faculty || 'General',
      progress: row.progress || 0,
      color:    PALETTE[i % PALETTE.length],
      isLocked: row.is_locked || false,
      isArchived: row.is_archived || false,
      semester: row.semester || '1st',
      lockedReason: row.locked_reason
    })), [])

  const loadRemote = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: uc, error } = await supabase
        .from('user_courses')
        .select(`
          id, progress, is_locked, locked_reason, custom_name, is_archived, semester,
          course:courses(id, code, name, faculty)
        `)
        .eq('user_id', user.id)
        .eq('is_archived', false) // Only show unarchived ones by default
        .order('created_at')

      if (error) throw error
      if (uc) setCourses(mapRows(uc))
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }, [user, mapRows])

  useEffect(() => {
    if (!user) return
    if (!ready) return

    const checkPremiumStatus = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()
      setIsPremium(profile?.is_premium || false)
    }
    
    checkPremiumStatus()

    if (bundle?.uc && !bundle.uc.error && Array.isArray(bundle.uc.data)) {
      // Note: Bundle might not have custom_name yet if prefetched, so we might need fallback
      setCourses(mapRows(bundle.uc.data))
      setLoading(false)
      return
    }
    loadRemote()
  }, [user, ready, bundle, mapRows, loadRemote])

  const handleCourseClick = (course) => {
    if (activeMenuId || editingCourseId) {
      setActiveMenuId(null)
      setEditingCourseId(null)
      return
    }
    if (course.isLocked && !isPremium) {
      setSelectedCourse(course)
      setShowPremiumModal(true)
    } else {
      navigate(`/dashboard/courses/${course.id}`)
    }
  }

  /* ── Actions ── */

  const handleShare = (course, e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/courses/${course.id}`
    navigator.clipboard.writeText(url)
    alert('Course link copied to clipboard!')
    setActiveMenuId(null)
  }

  const handleArchive = async (course, e) => {
    e.stopPropagation()
    setIsProcessing(true)
    try {
      await supabase.from('user_courses').update({ is_archived: true }).eq('id', course.ucId)
      refresh()
      setActiveMenuId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMoveSemester = async (course, e) => {
    e.stopPropagation()
    const nextSem = course.semester === '1st' ? '2nd' : '1st'
    setIsProcessing(true)
    try {
      await supabase.from('user_courses').update({ semester: nextSem }).eq('id', course.ucId)
      refresh()
      setActiveMenuId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const startEditTitle = (course, e) => {
    e.stopPropagation()
    setEditingCourseId(course.id)
    setEditValue(course.name)
    setActiveMenuId(null)
  }

  const saveTitle = async (course) => {
    if (!editValue.trim()) return setEditingCourseId(null)
    setIsProcessing(true)
    try {
      await supabase.from('user_courses').update({ custom_name: editValue }).eq('id', course.ucId)
      refresh()
      setEditingCourseId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewSummary = (course, e) => {
    e.stopPropagation()
    alert(`Generating AI Summary for ${course.code}... This feature uses Groq to analyze course contents.`)
    setActiveMenuId(null)
  }

  const handleDeleteCourse = async (course, e) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to remove ${course.code}?`)) return
    setIsProcessing(true)
    try {
      const { error } = await supabase.from('user_courses').delete().eq('id', course.ucId)
      if (error) throw error
      refresh()
      setActiveMenuId(null)
    } catch (error) {
      console.error(error)
      alert('Failed: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  /* ── UI Helpers ── */

  const handleAddCourse = () => setShowEnrollmentModal(true)
  const handleCoursesAdded = () => refresh()
  const toggleMenu = (id, e) => {
    e.stopPropagation()
    setActiveMenuId(activeMenuId === id ? null : id)
  }

  useEffect(() => {
    const handleClick = () => {
      setActiveMenuId(null)
      // We don't clear editingCourseId automatically on outside click to prevent accidental loss
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  return (
    <div className="dh-root" style={{ padding: isMobile ? '20px 16px' : '40px' }}>
      <div className="dh-topbar" style={{ 
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 12,
        marginBottom: '40px'
      }}>
        <div className="dh-topbar-left">
          <h1 className="dh-page-title" style={{ fontSize: isMobile ? 28 : 32, fontFamily: 'Varela Round' }}>My Courses</h1>
          <p className="dh-page-sub">
            {user?.user_metadata?.university || 'University Student'} · {courses.length} Active Classes
          </p>
        </div>
        <div className="dh-topbar-right" style={{ marginLeft: 'auto' }}>
          <button className="dh-upload-btn" onClick={handleAddCourse}>
            <Plus size={14} strokeWidth={2.5} />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {courses.map((c, idx) => (
          <motion.div
            key={c.ucId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: c.isLocked && !isPremium ? 1 : 1.005 }}
            onClick={() => handleCourseClick(c)}
            style={{
              cursor: 'pointer',
              position: 'relative',
              background: 'white',
              borderRadius: '24px',
              padding: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              border: '1.2px solid #eef2f6',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)',
              overflow: 'visible'
            }}
          >
            {/* Left Icon */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: c.isLocked && !isPremium ? '#fef3c7' : `${c.color}10`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {c.isLocked && !isPremium ? <Lock size={28} className="text-amber-500" /> : (
                <span style={{ color: c.color, fontSize: '20px', fontWeight: 900, fontFamily: 'Varela Round' }}>
                  {c.code.replace(/[^A-Za-z]/g, '').substring(0, 3)}
                </span>
              )}
            </div>

            {/* Course Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: c.color, fontWeight: 900, fontSize: '13px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  {c.code}
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>• {c.semester} SEMESTER</span>
              </div>
              
              {editingCourseId === c.id ? (
                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    autoFocus
                    className="edit-title-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveTitle(c)}
                    style={{
                      fontSize: '18px', fontWeight: 800, color: '#111',
                      border: '2px solid var(--primary)', borderRadius: '8px',
                      padding: '4px 8px', width: '100%', outline: 'none'
                    }}
                  />
                  <button onClick={() => saveTitle(c)} className="save-btn"><Check size={18} color="green" /></button>
                  <button onClick={() => setEditingCourseId(null)} className="cancel-btn"><X size={18} color="red" /></button>
                </div>
              ) : (
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{c.name}</h3>
              )}
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 600 }}>{c.dept}</p>
            </div>

            {/* Options Ellipsis */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={(e) => toggleMenu(c.id, e)}
                style={{
                  background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
                  borderRadius: '12px', display: 'flex', alignItems: 'center', transition: 'all 0.2s',
                  color: activeMenuId === c.id ? '#1e293b' : '#94a3b8'
                }}
                className="hover:bg-slate-50"
              >
                <MoreVertical size={22} strokeWidth={2.5} />
              </button>
              
              <AnimatePresence>
                {activeMenuId === c.id && (
                  <>
                    {/* Backdrop to close */}
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setActiveMenuId(null)} />
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                      style={{
                        position: 'absolute', top: '100%', right: 0,
                        width: '280px', background: 'white', borderRadius: '20px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.12)', border: '1px solid #eef2f6',
                        padding: '12px 0', zIndex: 100, marginTop: '12px'
                      }}
                    >
                      <MenuButton icon={Share2} label="Share with a friend" onClick={(e) => handleShare(c, e)} />
                      <MenuButton icon={Moon} label="Deactivate Course" onClick={(e) => handleArchive(c,e)} />
                      <MenuButton icon={ArrowLeftRight} label={`Move to ${c.semester === '1st' ? '2nd' : '1st'} Semester`} onClick={(e) => handleMoveSemester(c, e)} />
                      
                      <div className="menu-divider" />
                      
                      <MenuButton icon={Pencil} label="Edit Course Title" onClick={(e) => startEditTitle(c, e)} />
                      <MenuButton icon={EyeOff} label="Make Enrollment Private" onClick={(e) => setActiveMenuId(null)} />
                      
                      <div className="menu-divider" />
                      
                      <MenuButton icon={Send} label="Email me Study Guides" onClick={(e) => handleViewSummary(c, e)} />
                      <MenuButton icon={Download} label="Export Cards to Anki" onClick={(e) => setActiveMenuId(null)} />
                      <MenuButton icon={FileText} label="View Summary Outlines" secondaryIcon={Sparkles} onClick={(e) => handleViewSummary(c,e)} />
                      
                      <div className="menu-divider" />
                      
                      <MenuButton 
                        icon={Trash2} 
                        label={isProcessing ? "Processing..." : "Delete Class"} 
                        danger 
                        onClick={(e) => handleDeleteCourse(c, e)} 
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Progress */}
            {!isMobile && (
              <div style={{ width: '180px', marginLeft: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>PROGRESS</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: c.color }}>{c.progress}%</span>
                </div>
                <div style={{ height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', border: '1px solid #eef2f6' }}>
                  <motion.div
                    style={{ height: '100%', background: c.color, borderRadius: '5px' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
            
            <div className="chevron-wrap">
              <ChevronRight size={20} color="#cbd5e1" />
            </div>
          </motion.div>
        ))}
      </div>

      <CourseEnrollmentModal
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        user={user}
        onCoursesAdded={handleCoursesAdded}
        existingCourses={courses}
      />

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        course={selectedCourse}
        onUpgrade={() => navigate('/dashboard/pricing')}
        onStartTrial={async () => {
          await supabase.rpc('start_free_trial', { p_user_id: user.id })
          refresh()
        }}
      />
      
      <style>{`
        .menu-divider { height: 1px; background: #f1f5f9; margin: 8px 0; }
        .edit-title-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px var(--primary-bg); }
        .chevron-wrap { margin-left: 12px; opacity: 0.5; transition: opacity 0.2s; }
        .dh-root div:hover > .chevron-wrap { opacity: 1; }
      `}</style>
    </div>
  )
}

function MenuButton({ icon: Icon, label, onClick, danger, secondaryIcon: SecIcon }) {
  return (
    <button 
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
        padding: '12px 20px', border: 'none', background: 'transparent',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
        color: danger ? '#ef4444' : '#4b5563',
        fontSize: '13px', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.3px'
      }}
      className="hover:bg-slate-50"
    >
      <Icon size={18} strokeWidth={danger ? 2.5 : 2} />
      <span style={{ flex: 1 }}>{label}</span>
      {SecIcon && <SecIcon size={14} className="text-purple-500 animate-pulse" />}
    </button>
  )
}
