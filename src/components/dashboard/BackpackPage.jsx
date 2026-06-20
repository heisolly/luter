import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  FileText,
  FolderSimple,
  GridFour,
  ListBullets,
  MagnifyingGlass,
  Plus,
  UploadSimple,
  PlayCircle,
  Folder,
  Notebook,
  Microscope,
  Calculator,
  Pencil,
  GraduationCap,
  CaretDown,
  DotsThreeVertical
} from '@phosphor-icons/react'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { courseService } from '../../services/courseService'
import { fetchUserStandaloneMaterials } from '../../services/materialsService'
import { cachePageData, getCachedPageData } from '../../lib/offlineCache'
import { supabase } from '../../supabaseClient'
import CourseEnrollmentModal from '../shared/CourseEnrollmentModal'
import UserUpload from './UserUpload'
import './luterPages.css'

import SharedMaterialPreview from '../shared/SharedMaterialPreview'

function dateLabel(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function materialLabel(material) {
  return material.title || material.file_name || material.name || 'Untitled material'
}

const THUMB_COLORS = ['lp-thumb-purple', 'lp-thumb-mint', 'lp-thumb-peach'];
const getThumbColor = (id) => {
  const index = Math.abs(id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % THUMB_COLORS.length;
  return THUMB_COLORS[index];
};

// Map standard course colors to something folder-like or keep them
const COURSE_COLORS = ['#C4B5FD','#98FF98','#FFD2A6','#93C5FD','#FCA5A5','#86EFAC','#FCD34D']
const courseColor = (i) => COURSE_COLORS[i % COURSE_COLORS.length]

export default function BackpackPage() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const { bundle } = useDashboardPrefetch()
  const profile = bundle?.profile?.data || bundle?.profile
  const prefetchedStats = bundle?.stats?.data || bundle?.stats || {}

  const [tab, setTab] = useState(() => localStorage.getItem('backpackActiveTab') || 'folders')
  const [folders, setFolders] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')
  const [showUpload, setShowUpload] = useState(false)
  const [showEnroll, setShowEnroll] = useState(false)
  const [previewMaterial, setPreviewMaterial] = useState(null)
  const [editingFolder, setEditingFolder] = useState(null)
  const [editFolderName, setEditFolderName] = useState('')
  const [stats, setStats] = useState({ streak: 0, level: 1, coins: 0 })


  const loadFolders = async () => {
    if (!bundle?.uc?.data) setLoading(true)
    const cached = getCachedPageData(user.id, 'courses')
    const offline = typeof navigator !== 'undefined' && !navigator.onLine
    if (offline && cached?.data) {
      setFolders(cached.data)
      if (!bundle?.uc?.data) setLoading(false)
      return
    }

    const { data, error } = await courseService.fetchUserCourses(user.id)
    if (!error && data) {
      setFolders(data)
      cachePageData(user.id, 'courses', data)
    } else if (cached?.data) {
      setFolders(cached.data)
    }
    if (!bundle?.uc?.data) setLoading(false)
  }

  const loadMaterials = async () => {
    const cached = getCachedPageData(user.id, 'materials')
    const offline = typeof navigator !== 'undefined' && !navigator.onLine
    if (offline && cached?.data) {
      setMaterials(cached.data)
      return
    }

    try {
      const data = await fetchUserStandaloneMaterials(user.id)
      if (data) {
        setMaterials(data)
        cachePageData(user.id, 'materials', data)
      }
    } catch (error) {
      console.warn('Could not load materials:', error)
      if (cached?.data) setMaterials(cached.data)
    }
  }

  const loadGamification = async () => {
    const baseStats = {
      streak: prefetchedStats.streak_days || 0,
      level: Math.floor((prefetchedStats.total_xp || 0) / 500) + 1,
      coins: 0,
    }

    setStats(baseStats)

    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('level, coins')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.warn('Could not load gamification summary:', error)
        return
      }

      if (data) {
        setStats({
          streak: baseStats.streak,
          level: data.level || baseStats.level,
          coins: data.coins || 0,
        })
      }
    } catch (error) {
      console.warn('Could not load gamification summary:', error)
    }
  }

  const filteredFolders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return folders
      .filter((item) => !item.is_archived)
      .filter((item) => {
        const course = item.courses || item.course || item
        return !q || `${course.name || ''} ${course.code || ''}`.toLowerCase().includes(q)
      })
      .sort((a, b) => ((a.courses?.name || a.name || '').localeCompare(b.courses?.name || b.name || '')))
  }, [folders, search])

  const filteredMaterials = useMemo(() => {
    const q = search.trim().toLowerCase()
    return materials
      .filter((material) => !q || materialLabel(material).toLowerCase().includes(q))
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
  }, [materials, search])

  const activeItems = tab === 'folders' ? filteredFolders : filteredMaterials

  const openFolder = (item) => {
    const course = item.courses || item.course || item
    navigate(`/backpack/${course.id || item.course_id}`)
  }

  const openMaterial = (material) => {
    navigate(`/workstation/${material.id}`, { state: { material } })
  }

  const handleStudyMaterial = (material) => {
    navigate(`/workstation/${material.id}`, { state: { material } })
  }

  return (
    <div className="lp-root">
      <div className="lp-shell">
        <div className="lp-header-row">
          <h1 className="lp-header-title">{tab === 'folders' ? 'Courses' : 'Files'}</h1>
          <div className="lp-actions">
            <button className="lp-btn" onClick={() => setTab(tab === 'folders' ? 'materials' : 'folders')}>
              Switch to {tab === 'folders' ? 'Files' : 'Courses'}
            </button>
            {tab === 'folders' ? (
              <button className="lp-btn lp-btn-primary" onClick={() => setShowEnroll(true)}>
                <Plus size={16} weight="bold" /> create new course
              </button>
            ) : (
              <button className="lp-btn lp-btn-primary" onClick={() => setShowUpload(true)}>
                <Plus size={16} weight="bold" /> Upload
              </button>
            )}
          </div>
        </div>

        <div className="lp-toolbar-clean">
          <button className="lp-toolbar-dropdown">Type <CaretDown size={14} /></button>
          <button className="lp-toolbar-dropdown">Last Updated <CaretDown size={14} /></button>
          <div className="lp-toolbar-spacer" />
          <button 
            className="lp-toolbar-icon-btn" 
            style={{ background: view === 'grid' ? 'var(--lp-purple)' : 'transparent', color: view === 'grid' ? 'white' : 'var(--lp-muted)' }}
            onClick={() => setView('grid')}
          ><GridFour size={16} weight="fill" /></button>
          <button 
            className="lp-toolbar-dropdown" 
            style={{ border: 'none', padding: '0 8px', height: 36, background: view === 'list' ? 'var(--lp-surface-soft)' : 'transparent', color: view === 'list' ? 'var(--lp-text)' : 'var(--lp-muted)' }}
            onClick={() => setView('list')}
          ><ListBullets size={18} /></button>
        </div>

        {tab === 'folders' ? (
          <>
            <p className="lp-header-subtitle">Active</p>
            {loading ? (
              <div className="lp-empty"><h3>Loading courses...</h3></div>
            ) : filteredFolders.length === 0 ? (
              <div className="lp-empty" style={{ minHeight: 200, border: 'none' }}>
                <h3>No courses yet</h3>
                <button className="lp-btn" onClick={() => setShowEnroll(true)}>Create one</button>
              </div>
            ) : view === 'list' ? (
              <div className="lp-class-list-container">
                {filteredFolders.map((item, index) => {
                  const course = item.courses || item.course || item
                  return (
                    <div key={item.id || course.id} className="lp-class-row" onClick={() => openFolder(item)}>
                      <div className="lp-class-name">
                        <span style={{ color: 'var(--lp-muted)', fontSize: 16 }}>+</span> {course.code ? `${course.code} · ` : ''}{item.custom_name || course.name || 'Untitled course'}
                        <button className="lp-file-menu" style={{ marginLeft: 8 }} onClick={(e) => {
                          e.stopPropagation()
                          setEditFolderName(item.custom_name || course.name || '')
                          setEditingFolder(item)
                        }}><Pencil size={16} /></button>
                      </div>
                      <div className="lp-class-stats">
                        0 notes
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--lp-border)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="lp-file-grid">
                {filteredFolders.map((item, index) => {
                  const course = item.courses || item.course || item
                  return (
                    <div key={item.id || course.id} className="lp-file-card" onClick={() => openFolder(item)}>
                      <div className="lp-file-card-top">
                        <span className="lp-file-badge">COURSE</span>
                        <button className="lp-file-menu" onClick={(e) => {
                          e.stopPropagation()
                          setEditFolderName(item.custom_name || course.name || '')
                          setEditingFolder(item)
                        }}><Pencil size={16} /></button>
                      </div>
                      <div className="lp-file-icon-center">
                        <div className={`lp-file-icon-bg purple`}>
                          <Folder size={24} weight="fill" />
                        </div>
                      </div>
                      <div className="lp-file-info">
                        <h3 className="lp-file-title">{course.code ? `${course.code} · ` : ''}{item.custom_name || course.name || 'Untitled course'}</h3>
                        <span className="lp-file-date">0 notes</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {loading ? (
              <div className="lp-empty"><h3>Loading files...</h3></div>
            ) : filteredMaterials.length === 0 ? (
              <div className="lp-empty" style={{ minHeight: 200, border: 'none' }}>
                <h3>No files yet</h3>
                <button className="lp-btn" onClick={() => setShowUpload(true)}>Upload one</button>
              </div>
            ) : view === 'grid' ? (
              <div className="lp-file-grid">
                {filteredMaterials.map((material, index) => {
                  const typeLabel = (material.type || 'file').toUpperCase()
                  const isPdf = material.type === 'pdf'
                  const isDoc = material.type === 'docx'
                  const isYt = material.type === 'youtube'
                  
                  let iconBg = 'gray'
                  if (isPdf) iconBg = 'red'
                  else if (isDoc) iconBg = 'blue'
                  else if (isYt) iconBg = 'orange'
                  
                  return (
                    <div key={material.id} className="lp-file-card" onClick={() => openMaterial(material)}>
                      <div className="lp-file-card-top">
                        <span className="lp-file-badge">{typeLabel}</span>
                        <button className="lp-file-menu" onClick={(e) => { e.stopPropagation(); }}><DotsThreeVertical size={20} weight="bold" /></button>
                      </div>
                      <div className="lp-file-icon-center">
                        <div className={`lp-file-icon-bg ${iconBg}`}>
                          {isPdf && <BookOpen size={24} weight="fill" />}
                          {isDoc && <FileText size={24} weight="fill" />}
                          {isYt && <PlayCircle size={24} weight="fill" />}
                          {!isPdf && !isDoc && !isYt && <FileText size={24} weight="fill" />}
                        </div>
                      </div>
                      <div className="lp-file-info">
                        <h3 className="lp-file-title">{materialLabel(material)}</h3>
                        <span className="lp-file-date">{dateLabel(material.updated_at || material.created_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="lp-class-list-container">
                {filteredMaterials.map((material, index) => {
                  const typeLabel = (material.type || 'file').toUpperCase()
                  return (
                    <div key={material.id} className="lp-class-row" onClick={() => openMaterial(material)}>
                      <div className="lp-class-name">
                        <FileText size={18} color="var(--lp-muted)" /> {materialLabel(material)}
                      </div>
                      <div className="lp-class-stats">
                        <span className="lp-file-badge">{typeLabel}</span>
                        {dateLabel(material.updated_at || material.created_at)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            <button className="lp-btn-dashed" onClick={() => setShowUpload(true)}>
              <Plus size={16} /> Add More Materials
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div className="lp-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="lp-modal lp-panel" style={{ width: 'min(760px, 100%)' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
              <div className="lp-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                <div><h2>Upload material</h2><p>Add a file to Backpack, then open it to study or play mock exams.</p></div>
                <button className="lp-btn" onClick={() => {
                  setShowUpload(false)
                  loadMaterials()
                }}>Close</button>
              </div>
              <UserUpload />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Material Preview Modal */}
      <AnimatePresence>
        {previewMaterial && (
          <motion.div 
            className="lp-modal-backdrop" 
            style={{ zIndex: 1000, padding: '24px' }}
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setPreviewMaterial(null)}
          >
            <motion.div 
              className="lp-modal lp-panel" 
              style={{ width: 'min(1000px, 100%)', height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lp-row" style={{ justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h2 style={{ fontSize: '18px', margin: 0 }}>{materialLabel(previewMaterial)}</h2>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="lp-btn lp-btn-primary" onClick={() => handleStudyMaterial(previewMaterial)}>
                    <PlayCircle size={18} /> Open in Workstation
                  </button>
                  <button className="lp-btn" onClick={() => setPreviewMaterial(null)}>Close</button>
                </div>
              </div>
              
              <div style={{ flex: 1, background: '#f8f9fa', position: 'relative', overflow: 'hidden' }}>
                <SharedMaterialPreview material={previewMaterial} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CourseEnrollmentModal
        isOpen={showEnroll}
        onClose={() => setShowEnroll(false)}
        user={user}
        existingCourses={folders}
        onCoursesAdded={() => {
          setShowEnroll(false)
          loadFolders()
        }}
        modalTitle="create new course"
        modalDescription="Search for a course code to add it."
      />

      {/* Edit Course Modal */}
      <AnimatePresence>
        {editingFolder && (
          <motion.div 
            className="lp-modal-backdrop" 
            onClick={() => setEditingFolder(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="lp-modal" 
              style={{ width: 400 }} 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="lp-modal-header">
                <h2><Pencil size={20} /> Edit course</h2>
                <button className="lp-modal-close" onClick={() => setEditingFolder(null)}>&times;</button>
              </div>
              <div className="lp-input-group">
                <label>Course Name</label>
                <input 
                  className="lp-input" 
                  value={editFolderName} 
                  onChange={e => setEditFolderName(e.target.value)} 
                  autoFocus 
                  placeholder="e.g. Maths 101"
                />
              </div>
              <div className="lp-modal-actions">
                <button className="lp-btn" onClick={() => setEditingFolder(null)}>Cancel</button>
                <button className="lp-btn lp-btn-primary" onClick={async () => {
                  const courseId = editingFolder.course_id || editingFolder.courses?.id || editingFolder.id
                  await courseService.updateCoursePreferences(user.id, courseId, { custom_name: editFolderName })
                  setEditingFolder(null)
                  loadFolders()
                }}>Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
