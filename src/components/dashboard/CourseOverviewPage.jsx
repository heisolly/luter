import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useOutletContext } from 'react-router-dom'
import { 
  Plus, MoreHorizontal, Share2, 
  MessageSquare, Sparkles, Layout,
  ChevronDown, UserPlus, Sprout,
  HelpCircle, Search, Moon, ArrowLeftRight,
  Pencil, EyeOff, Send, Download,
  FileText, Trash2, BookOpen, FileCheck, FolderOpen,
  Loader2, UploadCloud, Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { fetchCourseMaterials, fetchUserNotes, deleteMaterial, deleteUserNote, getStudySession, uploadMaterial } from '../../services/materialsService'

export default function CourseOverviewPage({ course, onStartStudying }) {
  const navigate = useNavigate()
  const { user, isMobile } = useOutletContext()
  const [activeTab, setActiveTab] = useState('tracker')
  const [fileSubTab, setFileSubTab] = useState('admin')
  const [showMenu, setShowMenu] = useState(false)
  const [materials, setMaterials] = useState([])
  const [userNotes, setUserNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasNewAssignment, setHasNewAssignment] = useState(false)
  const [studySession, setStudySession] = useState(null)
  
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const fileInputRef = React.useRef(null)
  
  const tabs = [
    { id: 'tracker', label: 'TRACKER' },
    { id: 'files', label: 'FILES' },
    { id: 'ai_notes', label: 'AI NOTES' },
    { id: 'assignments', label: 'ASSIGNMENTS' },
  ]

  useEffect(() => {
    if (course?.id && user?.id) {
      loadData()
    }
  }, [course?.id, user?.id])

  async function loadData() {
    setLoading(true)
    try {
      const [mats, notes, session] = await Promise.all([
        fetchCourseMaterials(course.id, user.id),
        fetchUserNotes(user.id, course.id),
        getStudySession(user.id, course.id)
      ])
      setMaterials(mats)
      setUserNotes(notes)
      setStudySession(session)

      // Check for new assignments
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const newAdminMats = mats.filter(m => 
        m.owner_role === 'admin' && 
        new Date(m.created_at) > sevenDaysAgo &&
        (m.title.toLowerCase().includes('assignment') || m.type === 'docx')
      )
      setHasNewAssignment(newAdminMats.length > 0)

    } catch (err) {
      console.error('Failed to load overview data:', err)
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
      else if (['mp4', 'mov', 'webm', 'mp3', 'wav', 'ogg'].includes(ext)) type = 'youtube' // Uses youtube renderer / extraction for video/audio
      
      await uploadMaterial({
        file,
        courseId: course.id,
        userId: user.id,
        type: type,
        title: uploadTitle || file.name
      })
      
      // Reload the data instantly
      loadData()
      setShowUploadModal(false)
      setUploadTitle('')
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload file.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = null
    }
  }

  async function handleDelete(item) {
    const isNote = item.type === 'note' && !item.course_id // Check if it's a user note (no course_id usually in user_notes schema) or check metadata
    // More reliable check: does it have material_id? user_notes have course_id but materials have it too.
    // Let's use the ID and try to determine. In our app, user_notes usually come from fetchUserNotes.
    
    const confirmDelete = window.confirm(`ARE YOU SURE YOU WANT TO DELETE THIS ${item.type.toUpperCase()}?`)
    if (!confirmDelete) return

    try {
      if (item.source_type || (item.type === 'note' && !item.source_url)) {
        // It's a user note
        await deleteUserNote(item.id)
      } else {
        // It's a course material
        await deleteMaterial(item.id)
      }
      // Refresh data
      loadData()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('FAILED TO DELETE ITEM. PLEASE TRY AGAIN.')
    }
  }

  const menuItems = [
    { icon: Share2, label: 'SHARE WITH A FRIEND' },
    { icon: Moon, label: 'DEACTIVATE FOLDER' },
    { icon: ArrowLeftRight, label: 'MOVE THIS DECK TO ANOTHER FOLDER' },
    { icon: Pencil, label: 'EDIT TITLE' },
    { icon: EyeOff, label: 'MAKE IT PRIVATE' },
    { icon: Send, label: 'EMAIL ME THE QUESTIONS' },
    { icon: Download, label: 'EXPORT CARDS TO ANKI' },
    { icon: FileText, label: 'VIEW SUMMARY OUTLINES' },
    { icon: Trash2, label: 'DELETE CLASS', color: '#ef4444' },
  ]

  const purpleColor = '#7a12cc'
  const progressRed = '#ff5c5c'
  const lightGrey = '#94a3b8'
  const darkGrey = '#2d333a'

  const filteredMaterials = () => {
    switch(activeTab) {
      case 'ai_notes':
        return userNotes.filter(n => n.source_type === 'ai')
      case 'assignments':
        return materials.filter(m => m.title.toLowerCase().includes('assignment') || m.type === 'docx')
      case 'files':
        if (fileSubTab === 'admin') {
          return materials.filter(m => !m.user_id || m.owner_role === 'admin')
        } else {
          return materials.filter(m => m.user_id === user.id && m.owner_role !== 'admin')
        }
      default:
        return []
    }
  }

  return (
    <div className="course-overview-root" style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '60px 24px',
      fontFamily: "'Outfit', sans-serif",
      background: '#ffffff',
      minHeight: '100vh',
      color: darkGrey
    }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#000', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            {course?.code || 'MTH101'}
          </h1>
          <p style={{ fontSize: '16px', color: lightGrey, marginTop: '4px', fontWeight: 500 }}>
            29 QUESTIONS
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: darkGrey }}>{course?.progress || '18'}%</span>
            <div style={{ position: 'relative', width: '24px', height: '24px' }}>
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
              style={{ color: lightGrey, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <MoreHorizontal size={24} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div 
                    onClick={() => setShowMenu(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      width: '280px',
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
                      padding: '8px 0',
                      zIndex: 100,
                      marginTop: '8px'
                    }}
                  >
                    {menuItems.map((item, idx) => (
                      <React.Fragment key={idx}>
                        {idx === 3 || idx === 5 || idx === 8 ? <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} /> : null}
                        <button
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 20px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.2s',
                            color: item.color || '#4b5563',
                            fontSize: '14px',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => setShowMenu(false)}
                        >
                          <item.icon size={18} strokeWidth={2} />
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
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', flex: 1, height: '64px', filter: `drop-shadow(0 4px 12px rgba(122, 18, 204, 0.15))` }}>
          <button 
            onClick={onStartStudying}
            style={{ 
              flex: 1, 
              background: purpleColor, 
              color: 'white', 
              border: 'none', 
              borderRadius: '32px 0 0 32px', 
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
            <Sprout size={20} />
            START STUDYING
          </button>
          <button style={{ 
            width: '64px', 
            background: purpleColor, 
            color: 'white', 
            border: 'none', 
            borderLeft: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '0 32px 32px 0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <ChevronDown size={24} strokeWidth={3} />
          </button>
        </div>

        <button style={{ 
          flex: 1, 
          height: '64px', 
          background: 'white', 
          color: purpleColor, 
          border: `2px solid ${purpleColor}`,
          borderRadius: '32px', 
          fontSize: '18px', 
          fontWeight: 800, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '12px',
          cursor: 'pointer',
          textTransform: 'uppercase'
        }}
        onClick={() => navigate(`/dashboard/courses/${course.id}/materials`)}>
          <UserPlus size={20} strokeWidth={2.5} />
          SHARE
        </button>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '60px', marginBottom: '32px', paddingLeft: '8px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '16px 0',
              fontSize: '16px',
              fontWeight: 800,
              color: activeTab === tab.id ? '#000' : lightGrey,
              borderBottom: activeTab === tab.id ? '3px solid #000' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px',
              position: 'relative'
            }}
          >
            {tab.label}
            {tab.id === 'assignments' && hasNewAssignment && (
              <span style={{
                position: 'absolute',
                top: '10px',
                right: '-12px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: purpleColor,
                border: '1.5px solid white'
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'tracker' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ background: '#F8FAFC', borderRadius: '24px', padding: '40px', border: '1px solid #F1F5F9' }}>
            <h3 style={{ marginTop: 0, textTransform: 'uppercase', fontSize: '18px', fontWeight: 800 }}>Recent Activity</h3>
            {studySession ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '15px' }}>
                  <BookOpen size={20} color={purpleColor} />
                  <span>Last studied <strong>{studySession.material_id ? materials.find(m=>m.id === studySession.material_id)?.title : 'N/A'}</strong></span>
                  <span style={{ marginLeft: 'auto', color: lightGrey, fontWeight: 500 }}>{new Date(studySession.updated_at).toLocaleDateString()}</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '15px' }}>
                  <Sparkles size={20} color={purpleColor} />
                  <span>Generated <strong>{userNotes.length} AI notes</strong> across all materials</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '15px' }}>
                  <FileCheck size={20} color={purpleColor} />
                  <span>Viewed <strong>{materials.length} files</strong> in this course</span>
                </li>
              </ul>
            ) : (
              <p style={{ color: lightGrey }}>No study activity recorded yet. Start a session!</p>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {activeTab === 'files' && (
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '32px' }}>
              
              {/* Sub-Tabs: Admin vs User */}
              <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '6px', borderRadius: '16px', border: '1px solid #e2e8f0', width: isMobile ? '100%' : 'auto' }}>
                <button
                  onClick={() => setFileSubTab('admin')}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 800,
                    background: fileSubTab === 'admin' ? '#fff' : 'transparent',
                    color: fileSubTab === 'admin' ? purpleColor : lightGrey,
                    boxShadow: fileSubTab === 'admin' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase'
                  }}
                >
                  Admin Uploads
                </button>
                <button
                  onClick={() => setFileSubTab('user')}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 800,
                    background: fileSubTab === 'user' ? '#fff' : 'transparent',
                    color: fileSubTab === 'user' ? purpleColor : lightGrey,
                    boxShadow: fileSubTab === 'user' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase'
                  }}
                >
                  My Uploads
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                <button 
                  onClick={() => alert('Request feature coming soon!')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', background: 'transparent', color: purpleColor, border: `2px solid #e2e8f0`, fontWeight: 800, fontSize: '14px', cursor: 'pointer', flex: 1, justifyContent: 'center', textTransform: 'uppercase', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = purpleColor; e.currentTarget.style.background = '#faf5ff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent' }}
                >
                  <Bell size={18} strokeWidth={2.5} /> Request
                </button>
                <button 
                  onClick={() => setShowUploadModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', background: purpleColor, color: '#fff', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer', flex: 1, justifyContent: 'center', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(122, 18, 204, 0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <UploadCloud size={18} strokeWidth={2.5} /> Upload
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <Loader2 className="animate-spin" color={purpleColor} />
            </div>
          ) : filteredMaterials().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: lightGrey }}>
              <FolderOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', fontWeight: 600 }}>NO {activeTab.toUpperCase()} FOUND</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {filteredMaterials().map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/dashboard/courses/${course.id}/learn`)}
                  style={{
                    padding: '24px',
                    borderRadius: '20px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = purpleColor
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.05)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ color: purpleColor }}>
                      {item.type === 'pdf' ? <FileText size={24} /> : 
                       item.type === 'note' ? <BookOpen size={24} /> :
                       item.type === 'docx' ? <FileCheck size={24} /> :
                       <Layout size={24} />}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item)
                      }}
                      style={{ 
                        padding: '4px', 
                        background: 'transparent', 
                        border: 'none', 
                        color: lightGrey, 
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444'
                        e.currentTarget.style.background = '#fef2f2'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = lightGrey
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111', textTransform: 'uppercase', lineBreak: 'anywhere' }}>
                      {item.title}
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: lightGrey, fontWeight: 700, textTransform: 'uppercase' }}>
                      {item.type} · {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
              backdropFilter: 'blur(8px)', zIndex: 1000, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
            onClick={() => !isUploading && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '480px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <div style={{ width: 64, height: 64, background: '#faf5ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={32} color={purpleColor} strokeWidth={2.5} />
                </div>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, textAlign: 'center', color: '#1a202c', marginBottom: '8px', textTransform: 'uppercase' }}>Upload Material</h2>
              <p style={{ textAlign: 'center', color: lightGrey, fontSize: '14px', fontWeight: 600, marginBottom: '32px' }}>
                PDF, Word, PPT, Image, or Video. The AI will instantly read and map your file.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#4a5568', marginBottom: '8px', textTransform: 'uppercase' }}>Custom Title (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Enter file name..."
                    value={uploadTitle}
                    onChange={e => setUploadTitle(e.target.value)}
                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', fontWeight: 600, fontFamily: 'Outfit', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = purpleColor}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div 
                  style={{
                    border: `2px dashed ${purpleColor}`, borderRadius: '16px', padding: '40px 20px', textAlign: 'center', 
                    background: '#faf5ff', cursor: isUploading ? 'not-allowed' : 'pointer', position: 'relative', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => !isUploading && (e.currentTarget.style.background = '#f3e8ff')}
                  onMouseLeave={e => !isUploading && (e.currentTarget.style.background = '#faf5ff')}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }}
                  />
                  {isUploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <Loader2 size={32} color={purpleColor} className="animate-spin" />
                      <span style={{ fontSize: '14px', fontWeight: 800, color: purpleColor, textTransform: 'uppercase' }}>Extracting Text & Uploading...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <FileText size={32} color={purpleColor} opacity={0.5} />
                      <span style={{ fontSize: '15px', fontWeight: 800, color: purpleColor }}>Browse files to upload</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
