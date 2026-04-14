import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useOutletContext, useLocation } from 'react-router-dom'
import { 
  Plus, MoreHorizontal, Share2, 
  MessageSquare, Sparkles, Layout,
  ChevronDown, UserPlus, Sprout,
  HelpCircle, Search, Moon, ArrowLeftRight,
  Pencil, EyeOff, Send, Download,
  FileText, Trash2, BookOpen, FileCheck, FolderOpen,
  Loader2, UploadCloud, Bell, Link as LinkIcon, Youtube, Music, Video, Image as ImageIcon, Database,
  X, Check, GraduationCap, ArrowLeft, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { fetchCourseMaterialsWithContext, fetchUserNotes, deleteMaterial, deleteUserNote, getStudySession, uploadMaterial, addYoutubeMaterial } from '../../services/materialsService'

export default function CourseOverviewPage({ course, onStartStudying }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isMobile } = useOutletContext()
  const { refresh } = useDashboardPrefetch()
  
  // URL Param Parsing for automatic week navigation
  const queryParams = new URLSearchParams(location.search)
  const initialWeekParam = queryParams.get('week') ? parseInt(queryParams.get('week')) : null

  const [activeTab, setActiveTab] = useState(initialWeekParam ? 'semester-notes' : 'files')
  const [selectedWeek, setSelectedWeek] = useState(initialWeekParam)

  // Sync state with URL if it changes (e.g. returning from upload)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const weekParam = params.get('week')
    if (weekParam) {
      const w = parseInt(weekParam)
      setActiveTab('semester-notes')
      setSelectedWeek(w)
    }
  }, [location.search])

  const [showMenu, setShowMenu] = useState(false)
  const [materials, setMaterials] = useState([])
  const [userNotes, setUserNotes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasNewAssignment, setHasNewAssignment] = useState(false)
  const [studySession, setStudySession] = useState(null)
  
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = React.useRef(null)
  const uploadWeekRef = React.useRef(null)
  
  // Edit State
  const [editingTitle, setEditingTitle] = useState(false)
  const [editValue, setEditValue] = useState(course?.name || '')

  useEffect(() => {
    if (course?.id && user?.id) {
      loadData()
    }
  }, [course?.id, user?.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [materialsData, notesData, sessionData, assignmentsData] = await Promise.all([
        fetchCourseMaterialsWithContext(course.id, user.id, true),
        fetchUserNotes(user.id, course.id),
        getStudySession(user.id, course.id),
        supabase.from('assignments').select('*').eq('course_id', course.id).eq('user_id', user.id)
      ])
      setMaterials(materialsData)
      setUserNotes(notesData)
      setStudySession(sessionData)
      setAssignments(assignmentsData.data || [])
    } catch (err) {
      console.error('Failed to load course data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      let type = 'text'
      if (['pdf'].includes(ext)) type = 'pdf'
      else if (['doc', 'docx'].includes(ext)) type = 'docx'
      else if (['ppt', 'pptx'].includes(ext)) type = 'ppt'
      else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) type = 'image'
      else if (['mp4', 'mov', 'webm', 'mp3', 'wav', 'ogg'].includes(ext)) type = 'youtube'
      
      await uploadMaterial({
        file,
        courseId: course.id,
        userId: user.id,
        type: type,
        title: file.name,
        week: uploadWeekRef.current || 1
      })
      
      uploadWeekRef.current = null
      
      loadData()
      setShowUploadModal(false)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload file.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = null
    }
  }

  async function handleDeleteItem(item) {
    const confirmDelete = window.confirm(`ARE YOU SURE YOU WANT TO DELETE THIS ${item.type.toUpperCase()}?`)
    if (!confirmDelete) return

    try {
      if (item.source_type || (item.type === 'note' && !item.source_url)) {
        await deleteUserNote(item.id)
      } else {
        await deleteMaterial(item.id)
      }
      loadData()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('FAILED TO DELETE ITEM. PLEASE TRY AGAIN.')
    }
  }

  /* ── Course Actions ── */

  const handleShare = () => {
    const url = `${window.location.origin}/courses/${course.id}`
    navigator.clipboard.writeText(url)
    alert('Course link copied to clipboard!')
    setShowMenu(false)
  }

  const handleArchive = async () => {
    setIsProcessing(true)
    try {
      await supabase.from('user_courses').update({ is_archived: true }).eq('id', course.ucId)
      refresh()
      navigate('/dashboard/courses')
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
      setShowMenu(false)
    }
  }

  const handleMoveFolder = async () => {
    const nextSem = course.semester === '1st' ? '2nd' : '1st'
    setIsProcessing(true)
    try {
      await supabase.from('user_courses').update({ semester: nextSem }).eq('id', course.ucId)
      refresh()
      alert(`Moved to ${nextSem} Semester!`)
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
      setShowMenu(false)
    }
  }

  const handleEditTitle = () => {
    setEditingTitle(true)
    setEditValue(course.name)
    setShowMenu(false)
  }

  const saveTitle = async () => {
    if (!editValue.trim() || editValue === course.name) {
      setEditingTitle(false)
      return
    }
    setIsProcessing(true)
    try {
      await supabase.from('user_courses').update({ custom_name: editValue }).eq('id', course.ucId)
      refresh()
      setEditingTitle(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewSummary = () => {
    alert(`Generating AI Summary for ${course.code}... This feature uses Groq to analyze class materials.`)
    setShowMenu(false)
  }

  const handleDeleteClass = async () => {
    if (!window.confirm(`ARE YOU SURE YOU WANT TO COMPLETELY REMOVE ${course.code} FROM YOUR BACKPACK?`)) return
    setIsProcessing(true)
    try {
      await supabase.from('user_courses').delete().eq('id', course.ucId)
      refresh()
      navigate('/dashboard/courses')
    } catch (err) {
      console.error(err)
      alert('Delete failed: ' + err.message)
    } finally {
      setIsProcessing(false)
      setShowMenu(false)
    }
  }

  /* ── Render ── */

  const tabs = [
    { id: 'files', label: 'files' },
    { id: 'tracker', label: 'tracker' },
    { id: 'semester-notes', label: 'semester notes' },
    { id: 'ai_notes', label: 'ai notes' },
    { id: 'assignments', label: 'assignments' },
  ]

  const menuItems = [
    { icon: UploadCloud, label: 'UPLOAD STUDY MATERIAL', onClick: () => navigate(`/dashboard/upload?course_id=${course.id}`) },
    { icon: Pencil, label: 'WRITE PERSONAL NOTE', onClick: () => setActiveTab('semester-notes') }, // Directs to notes tab
    { icon: Share2, label: 'SHARE WITH A FRIEND', onClick: handleShare },
    { icon: Moon, label: 'DEACTIVATE FOLDER', onClick: handleArchive },
    { icon: ArrowLeftRight, label: 'MOVE THIS DECK TO ANOTHER FOLDER', onClick: handleMoveFolder },
    { icon: Pencil, label: 'EDIT TITLE', onClick: handleEditTitle },
    { icon: EyeOff, label: 'MAKE IT PRIVATE', onClick: () => setShowMenu(false) },
    { icon: Send, label: 'EMAIL ME THE QUESTIONS', onClick: handleViewSummary },
    { icon: Download, label: 'EXPORT CARDS TO ANKI', onClick: () => setShowMenu(false) },
    { icon: FileText, label: 'VIEW SUMMARY OUTLINES', onClick: handleViewSummary },
    { icon: Trash2, label: 'DELETE CLASS', color: '#ef4444', onClick: handleDeleteClass },
  ]

  const purpleColor = '#7a12cc'
  const progressRed = '#ff5c5c'
  const lightGrey = '#94a3b8'
  const darkGrey = '#2d333a'

  const filteredMaterials = () => {
    switch(activeTab) {
      case 'ai_notes': return userNotes.filter(n => n.source_type === 'ai')
      case 'assignments': return materials.filter(m => m.title.toLowerCase().includes('assignment') || m.type === 'docx')
      case 'files': return materials.filter(m => {
          if (m.user_id === user.id) return true
          if (m.owner_role === 'admin' && m.course_id === course.id) return true
          return ['program', 'year', 'global'].includes(m.visibility_scope)
        })
      default: return []
    }
  }

  const purpleBg = '#F5F3FF'

  if (isMobile) {
    return (
      <div className="course-overview-mobile" style={{
        background: '#ffffff',
        minHeight: '100vh',
        fontFamily: "'Outfit', sans-serif",
        padding: '24px 20px',
        color: darkGrey
      }}>
        {/* Mobile Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#000' }}>
              {course?.code || 'CSC111'}
            </h1>
            <p style={{ color: lightGrey, fontSize: '13px', marginTop: '2px', fontWeight: 700 }}>
              {materials.length * 2 + 11} questions
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: darkGrey }}>{course?.progress || 18}%</span>
              <div style={{ width: '22px', height: '22px' }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                  <circle 
                    cx="18" cy="18" r="16" fill="none" stroke={progressRed} strokeWidth="4" 
                    strokeDasharray={`${course?.progress || 18} 100`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <button onClick={() => setShowMenu(true)} style={{ padding: '8px', color: lightGrey }}>
              <MoreHorizontal size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
          <div style={{ display: 'flex', height: '64px', filter: `drop-shadow(0 8px 20px rgba(122, 18, 204, 0.15))` }}>
            <button 
              onClick={onStartStudying}
              style={{
                flex: 1,
                background: purpleColor,
                color: 'white',
                borderRadius: '32px 0 0 32px',
                fontSize: '16px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                textTransform: 'uppercase'
              }}
            >
              <GraduationCap size={20} />
              START STUDYING
            </button>
            <button style={{
              width: '64px',
              background: purpleColor,
              borderRadius: '0 32px 32px 0',
              border: 'none',
              borderLeft: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer'
            }}>
              <ChevronDown size={24} strokeWidth={3} />
            </button>
          </div>

          <button 
            onClick={handleShare}
            style={{
              height: '64px',
              background: 'white',
              border: `2px solid ${purpleColor}`,
              borderRadius: '32px',
              color: purpleColor,
              fontSize: '16px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              textTransform: 'uppercase'
            }}
          >
            <UserPlus size={20} strokeWidth={3} />
            SHARE
          </button>
        </div>

        {/* Tabs Bar */}
        <div style={{ 
          display: 'flex', 
          marginTop: '32px',
          borderBottom: '2px solid #F1F5F9',
          paddingBottom: '2px',
          gap: '24px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: activeTab === tab.id ? '#000' : '#475569',
                paddingBottom: '16px',
                whiteSpace: 'nowrap',
                opacity: activeTab === tab.id ? 1 : 0.6,
                background: 'none',
                border: 'none',
                padding: '0 8px 16px',
                transition: 'all 0.2s',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                position: 'relative'
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="mobileActiveTab"
                  style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: '3px', background: '#000', borderRadius: '4px' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Small Utility Bar */}
        <div style={{ display: 'flex', gap: '20px', margin: '24px 0' }}>
          <MessageSquare size={20} color={lightGrey} />
          <Sparkles size={20} color={lightGrey} />
          <Database size={20} color={lightGrey} />
        </div>

        {/* Content Area */}
        <div style={{ paddingBottom: '40px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 size={32} className="animate-spin" color={purpleColor} />
            </div>
          ) : activeTab === 'tracker' ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ background: '#F8FAFC', borderRadius: '32px', padding: '32px 24px', border: '1.5px solid #F1F5F9' }}>
                <h3 style={{ marginTop: 0, textTransform: 'uppercase', fontSize: '15px', fontWeight: 900, marginBottom: '20px', color: '#000' }}>Recent Activity</h3>
                {studySession ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                      <BookOpen size={20} color={purpleColor} />
                      <span style={{ fontWeight: 600 }}>Last studied {materials.find(m=>m.id === studySession.material_id)?.title || 'Material'}</span>
                    </li>
                  </ul>
                ) : (
                  <p style={{ color: lightGrey, fontSize: '14px', fontWeight: 600 }}>No study activity recorded yet.</p>
                )}
              </div>
              <div style={{ marginTop: '32px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0, textTransform: 'uppercase', color: '#000' }}>Quick Access</h3>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {materials.slice(0, 2).map((m, idx) => (
                      <MaterialCard key={m.id} item={m} idx={idx} user={user} purpleColor={purpleColor} lightGrey={lightGrey} onDelete={() => handleDeleteItem(m)} />
                    ))}
                 </div>
              </div>
            </motion.div>
          ) : activeTab === 'semester-notes' ? (
            <SemesterNotesView 
              materials={materials} 
              userNotes={userNotes} 
              assignments={assignments}
              course={course} 
              user={user} 
              purpleColor={purpleColor}
              lightGrey={lightGrey}
              onRefresh={loadData}
              isMobile={true}
              selectedWeek={selectedWeek}
              setSelectedWeek={setSelectedWeek}
              onUploadTrigger={(week) => {
                navigate(`/dashboard/upload?course_id=${course.id}&week=${week}`)
              }}
            />
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredMaterials().length > 0 ? (
                  filteredMaterials().map((item, idx) => (
                    <MaterialCard key={item.id} item={item} idx={idx} user={user} purpleColor={purpleColor} lightGrey={lightGrey} onDelete={() => handleDeleteItem(item)} />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: lightGrey }}>
                    <FolderOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                    <p style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.05em' }}>
                      Vault is empty
                    </p>
                    <button 
                      onClick={() => navigate(`/dashboard/upload?course_id=${course.id}`)}
                      style={{ marginTop: '12px', background: 'none', border: `1.5px solid ${purpleColor}`, color: purpleColor, padding: '10px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                    >
                      ADD FIRST MATERIAL
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Floating Menu Modal */}
        <AnimatePresence>
          {showMenu && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowMenu(false)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                  position: 'relative', width: '100%', background: 'white',
                  borderRadius: '32px 32px 0 0', padding: '24px 0 40px', zIndex: 1001,
                  boxShadow: '0 -20px 40px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '0 auto 20px' }} />
                <div style={{ padding: '0 24px 16px' }}>
                  <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: lightGrey, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Actions</h4>
                </div>
                {menuItems.map((item, idx) => (
                   <button
                    key={idx}
                    onClick={() => { item.onClick(); setShowMenu(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '16px 24px', color: item.color || '#2d333a', fontSize: '14px', fontWeight: 700,
                      textAlign: 'left'
                    }}
                  >
                    <item.icon size={20} strokeWidth={2.5} style={{ color: item.color || lightGrey }} />
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.3px', fontSize: '12px', fontWeight: 800 }}>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="course-overview-root" style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: isMobile ? '24px 16px' : '60px 24px',
      fontFamily: "'Outfit', sans-serif",
      background: '#ffffff',
      minHeight: '100vh',
      color: darkGrey
    }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '16px' : '0',
        marginBottom: '32px' 
      }}>
        <div style={{ flex: 1, width: '100%' }}>
          {editingTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveTitle()}
                style={{
                  fontSize: '28px', fontWeight: 800, color: '#000',
                  border: '2px solid var(--primary)', borderRadius: '12px',
                  padding: '8px 16px', width: '100%', maxWidth: '400px', outline: 'none'
                }}
              />
              <button onClick={saveTitle} style={{ background: '#f0fdf4', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}><Check size={24} color="#16a34a" /></button>
              <button onClick={() => setEditingTitle(false)} style={{ background: '#fef2f2', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}><X size={24} color="#dc2626" /></button>
            </div>
          ) : (
            <>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#000', margin: 0, letterSpacing: '-0.02em' }}>
            {course?.code || 'CSC111'}
          </h1>
          <p style={{ fontSize: '15px', color: lightGrey, marginTop: '2px', fontWeight: 700 }}>
            {materials.length * 2 + 11} questions
          </p>
            </>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: darkGrey }}>{course?.progress || '18'}%</span>
            <div style={{ position: 'relative', width: '28px', height: '28px' }}>
              <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                <circle 
                  cx="18" cy="18" r="16" fill="none" stroke={progressRed} strokeWidth="4" 
                  strokeDasharray={`${course?.progress || 18} 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              style={{ color: lightGrey, background: 'none', border: 'none', cursor: 'pointer', padding: '12px' }}
              className="hover:bg-slate-50 rounded-full"
            >
              <MoreHorizontal size={28} strokeWidth={2.5} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    style={{
                      position: 'absolute', top: '100%', right: 0,
                      width: '320px', background: 'white', borderRadius: '20px',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
                      padding: '12px 0', zIndex: 100, marginTop: '12px'
                    }}
                  >
                    {menuItems.map((item, idx) => (
                      <React.Fragment key={idx}>
                        {idx === 3 || idx === 5 || idx === 8 ? <div style={{ height: '1.5px', background: '#f1f5f9', margin: '8px 0' }} /> : null}
                        <button
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                            padding: '14px 24px', border: 'none', background: 'transparent',
                            cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s',
                            color: item.color || '#4b5563', fontSize: '13px', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.5px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={item.onClick}
                        >
                          <item.icon size={20} strokeWidth={2.5} />
                          {item.label}
                        </button>
                      </React.Fragment>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '16px' : '24px', 
        marginBottom: '40px' 
      }}>
        <div style={{ display: 'flex', flex: 1, height: '68px', filter: `drop-shadow(0 10px 25px rgba(122, 18, 204, 0.2))` }}>
          <button 
            onClick={onStartStudying}
            style={{ 
              flex: 1, 
              background: purpleColor, 
              color: 'white', 
              border: 'none', 
              borderRadius: '34px 0 0 34px', 
              fontSize: '18px', 
              fontWeight: 800, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            <Sprout size={22} />
            START STUDYING
          </button>
          <button style={{ 
            width: '68px', 
            background: purpleColor, 
            color: 'white', 
            border: 'none', 
            borderLeft: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '0 34px 34px 0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <ChevronDown size={28} strokeWidth={3} />
          </button>
        </div>

        <button style={{ 
          flex: isMobile ? 1 : 0.8, 
          height: '68px', 
          background: 'white', 
          color: purpleColor, 
          border: `2px solid ${purpleColor}`,
          borderRadius: '34px', 
          fontSize: '18px', 
          fontWeight: 800, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '12px',
          cursor: 'pointer',
          textTransform: 'uppercase'
        }}
        onClick={handleShare}>
          <UserPlus size={22} strokeWidth={3} />
          SHARE
        </button>
      </div>

      {/* Tabs */}
      <div style={{ 
        borderBottom: '2px solid #f1f5f9', 
        display: 'flex', 
        gap: isMobile ? '24px' : '40px', 
        marginBottom: '32px', 
        overflowX: 'auto', 
        whiteSpace: 'nowrap',
        scrollbarWidth: 'none', // Hide scrollbar for standard browsers
        WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', padding: '16px 12px',
              fontSize: '16px', fontWeight: 700,
              color: activeTab === tab.id ? '#000' : '#475569',
              cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-2px', position: 'relative',
              opacity: activeTab === tab.id ? 1 : 0.6,
              letterSpacing: '0.01em',
              textTransform: 'uppercase'
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="desktopActiveTab"
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#000', borderRadius: '4px' }}
              />
            )}
            {tab.id === 'assignments' && hasNewAssignment && (
              <span style={{ position: 'absolute', top: '12px', right: '-8px', width: '8px', height: '8px', borderRadius: '50%', background: purpleColor, border: '2px solid white' }} />
            )}
          </button>
        ))}
      </div>

      {/* Content Rendering (No changes needed to internal tab logic) */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <Loader2 size={40} className="animate-spin" color={purpleColor} />
        </div>
      ) : activeTab === 'tracker' ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ background: '#F8FAFC', borderRadius: '32px', padding: '48px', border: '1.5px solid #F1F5F9' }}>
            <h3 style={{ marginTop: 0, textTransform: 'uppercase', fontSize: '20px', fontWeight: 900, marginBottom: '24px' }}>Recent Activity</h3>
            {studySession ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '16px' }}>
                  <BookOpen size={24} color={purpleColor} />
                  <span>Last studied <strong>{studySession.material_id ? materials.find(m=>m.id === studySession.material_id)?.title : 'N/A'}</strong></span>
                  <span style={{ marginLeft: 'auto', color: lightGrey, fontWeight: 600 }}>{new Date(studySession.updated_at).toLocaleDateString()}</span>
                </li>
              </ul>
            ) : (
              <p style={{ color: lightGrey, fontSize: '16px', fontWeight: 500 }}>No study activity recorded yet. Start a session!</p>
            )}
          </div>
        </motion.div>
      ) : activeTab === 'semester-notes' ? (
        <SemesterNotesView 
          materials={materials} 
          userNotes={userNotes} 
          assignments={assignments}
          course={course} 
          user={user} 
          purpleColor={purpleColor}
          lightGrey={lightGrey}
          onRefresh={loadData}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          isMobile={isMobile}
          onUploadTrigger={(week) => {
            navigate(`/dashboard/upload?course_id=${course.id}&week=${week}`)
          }}
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
           <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {filteredMaterials().length > 0 ? (
                filteredMaterials().map((item, idx) => (
                  <MaterialCard key={item.id} item={item} idx={idx} user={user} purpleColor={purpleColor} lightGrey={lightGrey} onDelete={() => handleDeleteItem(item)} />
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 20px', background: '#f8fafc', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
                  <FolderOpen size={64} color={lightGrey} style={{ marginBottom: '20px', opacity: 0.3 }} />
                  <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#000' }}>Your Vault is Empty</h4>
                  <p style={{ color: lightGrey, marginTop: '8px', fontWeight: 600 }}>Start by adding your first study material.</p>
                  <button 
                    onClick={() => navigate(`/dashboard/upload?course_id=${course.id}`)}
                    style={{ marginTop: '12px', background: purpleColor, color: 'white', padding: '12px 24px', borderRadius: '16px', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                  >
                    ADD MATERIAL
                  </button>
                </div>
              )}
           </div>
        </motion.div>
      )}

      {/* Modals logic remains same */}
    </div>
  )
}

function MaterialCard({ item, idx, user, purpleColor, lightGrey, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.04 }}
      style={{
        padding: '28px', borderRadius: '24px', border: '1.8px solid #f1f5f9',
        background: '#ffffff', cursor: 'pointer', transition: 'all 0.3s',
        display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative'
      }}
      className="material-card-hover"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ 
          width: '50px', height: '50px', borderRadius: '14px', background: `${purpleColor}10`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: purpleColor
        }}>
           {item.type === 'pdf' ? <FileText size={22} /> : item.type === 'note' ? <BookOpen size={22} /> : <FileCheck size={22} />}
        </div>
        <button onClick={e => {e.stopPropagation(); onDelete()}} style={{ color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:text-red-500">
          <Trash2 size={18} />
        </button>
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#111', textTransform: 'uppercase' }}>{item.title}</h4>
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: lightGrey, fontWeight: 800, textTransform: 'uppercase' }}>
          {item.type} · {new Date(item.created_at).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  )
}

function SemesterNotesView({ materials, userNotes, assignments, course, user, purpleColor, lightGrey, onRefresh, isMobile, onUploadTrigger, selectedWeek, setSelectedWeek }) {
  const weeks = Array.from({ length: 16 }, (_, i) => i + 1)

  if (selectedWeek) {
    return (
      <WeekDetailView 
        week={selectedWeek} 
        onBack={() => setSelectedWeek(null)}
        materials={materials.filter(m => m.week_number === selectedWeek)}
        userNotes={userNotes.filter(n => n.week_number === selectedWeek)}
        assignments={assignments.filter(a => a.week_number === selectedWeek)}
        course={course}
        user={user}
        purpleColor={purpleColor}
        lightGrey={lightGrey}
        onRefresh={onRefresh}
        isMobile={isMobile}
        onUploadTrigger={onUploadTrigger}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px', background: '#fff', borderRadius: '24px', border: '1.5px solid #f1f5f9', overflow: 'hidden' }}>
      {weeks.map((week, idx) => {
        const totalItems = materials.filter(m => m.week_number === week).length + 
                           userNotes.filter(n => n.week_number === week).length +
                           assignments.filter(a => a.week_number === week).length
        
        return (
          <motion.div 
            key={week} 
            whileHover={{ backgroundColor: '#f8fafc' }}
            onClick={() => setSelectedWeek(week)}
            style={{ borderBottom: idx === weeks.length - 1 ? 'none' : '1px solid #f8fafc', transition: 'all 0.2s', cursor: 'pointer' }}
          >
            <div style={{ width: '100%', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#000', letterSpacing: '-0.015em' }}>Week {week}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, textTransform: 'lowercase' }}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `1.5px solid ${totalItems > 0 ? purpleColor : '#f1f5f9'}`, position: 'relative' }}>
                  {totalItems > 0 && <div style={{ position: 'absolute', inset: '2px', background: purpleColor, borderRadius: '50%' }} />}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function WeekDetailView({ week, onBack, materials, userNotes, assignments, course, user, purpleColor, lightGrey, onRefresh, isMobile, onUploadTrigger }) {
  const [activeTab, setActiveTab] = useState('resources')

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: '#f8fafc', border: 'none', width: '40px', height: '40px', borderRadius: '14px', cursor: 'pointer', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Week {week}</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: lightGrey, fontWeight: 600 }}>everything for this academic week</p>
        </div>
      </div>

      {/* Internal Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1.5px solid #f1f5f9', marginBottom: '24px' }}>
        {['resources', 'notes', 'assignments'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 4px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 800, textTransform: 'uppercase',
              color: activeTab === tab ? '#000' : lightGrey,
              borderBottom: activeTab === tab ? `3px solid ${purpleColor}` : '3px solid transparent',
              transition: 'all 0.2s',
              opacity: activeTab === tab ? 1 : 0.6
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ minHeight: '300px' }}>
        {activeTab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Upload Button for this week */}
            <button 
              onClick={() => onUploadTrigger(week)}
              style={{
                padding: '24px', borderRadius: '28px', border: `2px dashed ${purpleColor}40`,
                background: `${purpleColor}05`, color: purpleColor, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                cursor: 'pointer', transition: 'all 0.2s', fontSize: '15px'
              }}
            >
              <UploadCloud size={24} />
              UPLOAD MATERIAL FOR WEEK {week}
            </button>

            {materials.length > 0 ? (
              materials.map(m => (
                <div key={m.id} style={{ padding: '24px', borderRadius: '28px', border: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: m.owner_role === 'admin' ? '#f0fdf4' : `${purpleColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.owner_role === 'admin' ? '#16a34a' : purpleColor }}>
                      {m.owner_role === 'admin' ? <FileCheck size={22} /> : <FileText size={22} />}
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '16px', color: '#000', display: 'block' }}>{m.title}</span>
                      {m.owner_role === 'admin' && <span style={{ fontSize: '11px', fontWeight: 900, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', marginTop: '4px', display: 'inline-block' }}>Official Notes</span>}
                    </div>
                  </div>
                  <ChevronRight size={20} color={lightGrey} />
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 24px', background: '#f8fafc', borderRadius: '28px', border: '1.5px dashed #e2e8f0' }}>
                <p style={{ fontSize: '14px', color: lightGrey, fontWeight: 600 }}>No materials uploaded for this week yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                onClick={async () => {
                  const title = window.prompt("Enter note title:")
                  if (!title) return
                  try {
                    await supabase.from('user_notes').insert({
                      user_id: user.id, course_id: course.id, title, content: '', week_number: week, source_type: 'personal'
                    })
                    onRefresh()
                  } catch (e) { console.error(e) }
                }}
                style={{ padding: '24px', borderRadius: '28px', border: `2px dashed ${purpleColor}40`, background: `${purpleColor}05`, color: purpleColor, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '15px' }}
              >
                <Pencil size={20} strokeWidth={3} /> 
                WRITE A PERSONAL NOTE FOR WEEK {week}
              </button>

              {userNotes.map(n => (
                <div key={n.id} style={{ padding: '24px', borderRadius: '28px', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '20px', background: '#fff' }}>
                   <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={20} color={purpleColor} /></div>
                   <span style={{ fontWeight: 800, color: '#000', fontSize: '16px' }}>{n.title}</span>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'assignments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {assignments.length > 0 ? (
               assignments.map(a => (
                <div key={a.id} style={{ padding: '20px', borderRadius: '24px', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px', background: '#fff' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileCheck size={18} color="#22c55e" /></div>
                   <div style={{ flex: 1 }}>
                     <p style={{ margin: 0, fontWeight: 700, color: '#000' }}>{a.title}</p>
                     {a.due_date && <p style={{ margin: 0, fontSize: '12px', color: lightGrey }}>Due {new Date(a.due_date).toLocaleDateString()}</p>}
                   </div>
                </div>
               ))
             ) : (
                <div style={{ textAlign: 'center', padding: '64px 24px', color: lightGrey }}>
                  <div style={{ padding: '24px', display: 'inline-flex', borderRadius: '32px', background: '#f8fafc', marginBottom: '20px' }}>
                    <FileCheck size={40} style={{ opacity: 0.3 }} />
                  </div>
                  <p style={{ fontWeight: 800, color: '#000', margin: 0, textTransform: 'lowercase' }}>no assignments for week {week}</p>
                  <button 
                    onClick={async () => {
                      const title = window.prompt("Assignment Name:")
                      if (!title) return
                      try {
                        await supabase.from('assignments').insert({ course_id: course.id, user_id: user.id, title, week_number: week })
                        onRefresh()
                      } catch (e) { console.error(e) }
                    }}
                    style={{ marginTop: '16px', background: 'none', border: 'none', color: purpleColor, fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add Assignment Task
                  </button>
                </div>
             )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
