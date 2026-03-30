import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useOutletContext } from 'react-router-dom'
import { 
  Plus, MoreHorizontal, Share2, 
  MessageSquare, Sparkles, Layout,
  ChevronDown, UserPlus, Sprout,
  HelpCircle, Search, Moon, ArrowLeftRight,
  Pencil, EyeOff, Send, Download,
  FileText, Trash2, BookOpen, FileCheck, FolderOpen,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { fetchCourseMaterials, fetchUserNotes, deleteMaterial, deleteUserNote } from '../../services/materialsService'

export default function CourseOverviewPage({ course, onStartStudying }) {
  const navigate = useNavigate()
  const { user } = useOutletContext()
  const [activeTab, setActiveTab] = useState('questions')
  const [showMenu, setShowMenu] = useState(false)
  const [materials, setMaterials] = useState([])
  const [userNotes, setUserNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasNewAssignment, setHasNewAssignment] = useState(false)
  const [studySession, setStudySession] = useState(null)
  
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

  const questions = [
    { id: 1, text: "WHAT IS AN ENRICHED ENVIRONMENT LIKELY TO FOSTER?" },
    { id: 2, text: "WHAT EXTERNAL ENVIRONMENTAL FACTOR INFLUENCES LEARNING?" },
    { id: 3, text: "WHAT IS A MAIN CATEGORY OF SKILLS IN THE P21 FRAMEWORK?" },
    { id: 4, text: "UNDER WHICH P21 SKILL SET IS 'CRITICAL THINKING AND PROBLEM SOLVING' CATEGORIZED?" }
  ]

  const filteredMaterials = () => {
    switch(activeTab) {
      case 'ai_notes':
        return userNotes.filter(n => n.source_type === 'ai')
      case 'assignments':
        return materials.filter(m => m.title.toLowerCase().includes('assignment') || m.type === 'docx')
      case 'files':
        return materials
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

      {/* Next Exam */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', fontSize: '16px' }}>
        <span style={{ color: '#000', fontWeight: 800, textTransform: 'uppercase' }}>NEXT EXAM</span>
        <span style={{ color: lightGrey, fontWeight: 500, textTransform: 'uppercase' }}>TOMORROW</span>
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
      ) : activeTab === 'questions' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
              <span style={{ color: lightGrey }}>GROUP BY:</span>
              <button style={{ background: 'none', border: 'none', color: '#000', fontWeight: 800, cursor: 'pointer' }}>QUESTION TYPE</button>
              <button style={{ background: 'none', border: 'none', color: lightGrey, fontWeight: 800, cursor: 'pointer' }}>TOPIC</button>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', color: lightGrey }}>
              <HelpCircle size={22} cursor="pointer" strokeWidth={2} />
              <Sparkles size={22} cursor="pointer" strokeWidth={2} />
              <Layout size={22} cursor="pointer" strokeWidth={2} />
            </div>
          </div>

          <div style={{ marginBottom: '48px' }}>
            <input 
              type="text" 
              placeholder="NEW QUESTION..."
              style={{
                width: '100%',
                padding: '24px 32px',
                borderRadius: '24px',
                border: '1.5px solid #e2e8f0',
                fontSize: '18px',
                fontWeight: 500,
                outline: 'none',
                color: '#000',
                background: '#ffffff',
                textTransform: 'uppercase'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0, textTransform: 'uppercase' }}>free response</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 800, color: lightGrey, cursor: 'pointer' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid #cbd5e1', borderRadius: '6px' }}></div>
              SELECT THESE 4
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions.map((q, idx) => (
              <motion.div 
                key={q.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  padding: '28px 32px',
                  borderRadius: '20px',
                  border: '1.5px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#111',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.01)',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.01)'
                }}
              >
                {q.text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <Loader2 className="animate-spin" color={greenColor} />
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
                    e.currentTarget.style.borderColor = greenColor
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
                    <div style={{ color: greenColor }}>
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
    </div>
  )
}
