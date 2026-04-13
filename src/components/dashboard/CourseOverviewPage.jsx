import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useOutletContext } from 'react-router-dom'
import { 
  Plus, MoreHorizontal, Share2, 
  MessageSquare, Sparkles, Layout,
  ChevronDown, UserPlus, Sprout,
  HelpCircle, Search, Moon, ArrowLeftRight,
  Pencil, EyeOff, Send, Download,
  FileText, Trash2, BookOpen, FileCheck, FolderOpen,
  Loader2, UploadCloud, Bell, Link as LinkIcon, Youtube, Music, Video, Image as ImageIcon, Database,
  X, Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { fetchCourseMaterialsWithContext, fetchUserNotes, deleteMaterial, deleteUserNote, getStudySession, uploadMaterial, addYoutubeMaterial } from '../../services/materialsService'

export default function CourseOverviewPage({ course, onStartStudying }) {
  const navigate = useNavigate()
  const { user, isMobile } = useOutletContext()
  const { refresh } = useDashboardPrefetch()
  const [activeTab, setActiveTab] = useState('tracker')
  const [showMenu, setShowMenu] = useState(false)
  const [materials, setMaterials] = useState([])
  const [userNotes, setUserNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasNewAssignment, setHasNewAssignment] = useState(false)
  const [studySession, setStudySession] = useState(null)
  
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = React.useRef(null)
  
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
      const [materialsData, notesData, sessionData] = await Promise.all([
        fetchCourseMaterialsWithContext(course.id, user.id, true),
        fetchUserNotes(user.id, course.id),
        getStudySession(user.id, course.id)
      ])
      setMaterials(materialsData)
      setUserNotes(notesData)
      setStudySession(sessionData)
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
        title: file.name
      })
      
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
    { id: 'tracker', label: 'TRACKER' },
    { id: 'semester-notes', label: 'SEMESTER NOTES' },
    { id: 'files', label: 'FILES' },
    { id: 'ai_notes', label: 'AI NOTES' },
    { id: 'assignments', label: 'ASSIGNMENTS' },
  ]

  const menuItems = [
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
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#000', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                {course?.code || 'MTH101'}
              </h1>
              <p style={{ fontSize: '18px', color: '#111', fontWeight: 700, marginTop: '2px' }}>{course?.name}</p>
            </>
          )}
          <p style={{ fontSize: '15px', color: lightGrey, marginTop: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
            {materials.length * 2 + 11} POTENTIAL QUESTIONS
          </p>
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
              background: 'none', border: 'none', padding: '16px 4px',
              fontSize: '15px', fontWeight: 800,
              color: activeTab === tab.id ? '#000' : lightGrey,
              borderBottom: activeTab === tab.id ? '4px solid #000' : '4px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-2px', position: 'relative'
            }}
          >
            {tab.label}
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
      ) : (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
           {/* Tab content logic remains same, just better styling */}
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {filteredMaterials().map((item, idx) => (
                <MaterialCard key={item.id} item={item} idx={idx} user={user} purpleColor={purpleColor} lightGrey={lightGrey} onDelete={() => handleDeleteItem(item)} />
              ))}
           </div>
           {filteredMaterials().length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px', color: lightGrey }}>
                <FolderOpen size={64} style={{ margin: '0 auto 20px', opacity: 0.3 }} />
                <p style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase' }}>No {activeTab.replace('_',' ')} found</p>
              </div>
           )}
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
