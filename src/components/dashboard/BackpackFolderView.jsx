import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom'
import {
  Folder, Plus, Trash2, Play, ArrowLeft, FileText, Video, Music, Image as ImageIcon,
  Upload, Clock, Pencil, Share2, Users, MoreHorizontal, ChevronRight
} from 'lucide-react'
import { MagnifyingGlass, House, SidebarSimple, Star, Lightning, Coins, Bell, Sun, Moon } from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import { fetchCourseMaterials, uploadMaterial, permanentlyDeleteMaterial } from '../../services/materialsService'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { getCreditBalance } from '../../services/creditService'
import SharedMaterialPreview from '../shared/SharedMaterialPreview'
import './StudySession.css'
import './dhd.css'

import { useTheme } from '../../contexts/ThemeContext'

function useDarkMode() {
  const { isDark, setTheme } = useTheme();
  return [isDark, (d) => setTheme(d ? 'dark' : 'light')];
}

function materialLabel(material) {
  return material.title || material.file_name || material.name || 'Untitled material'
}

export default function BackpackFolderView() {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const { user, setNotificationsOpen, setSidebarCollapsed, sidebarCollapsed } = useOutletContext() || {}
  const { bundle } = useDashboardPrefetch()
  const [isDark, setIsDark] = useDarkMode()
  const [creditsBalance, setCreditsBalance] = useState(Infinity)
  
  useEffect(() => {
    if (!user?.id) return
    getCreditBalance(user.id).then(b => {
      if (typeof b === 'number') setCreditsBalance(b)
    }).catch(() => {})
  }, [user?.id])
  
  const stats = bundle?.stats?.data || {}
  const profile = bundle?.profile?.data || bundle?.profile
  const credits = typeof creditsBalance === 'number' ? creditsBalance : profile?.credits ?? 20000
  const xp = stats?.total_xp ?? 0
  const level = Math.floor(xp / 500) + 1

  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [sortBy, setSortBy] = useState('date') // Default to recent
  const [activeTab, setActiveTab] = useState('materials')
  const [showDropdown, setShowDropdown] = useState(false)
  const [previewMaterial, setPreviewMaterial] = useState(null)

  useEffect(() => {
    if (folderId && user?.id) {
      loadFolderData()
      loadMaterials()
    }
  }, [folderId, user?.id])

  async function loadFolderData() {
    const { data } = await supabase
      .from('courses')
      .select('name, code')
      .eq('id', folderId)
      .single()
    if (data) {
      setCourseName(data.name)
      const isCustomFolder = data.code?.startsWith('FOLDER_')
      setCourseCode(isCustomFolder ? '' : data.code)
    }
  }

  async function loadMaterials() {
    setLoading(true)
    try {
      const mats = await fetchCourseMaterials(folderId, user.id)
      setMaterials(mats || [])
    } catch (err) {
      console.error('Failed to load materials:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFolder = async () => {
    if (window.confirm('Are you sure you want to delete this folder?')) {
      await supabase.from('courses').update({ is_archived: true }).eq('id', folderId)
      navigate('/backpack')
    }
  }

  const handleAddMaterial = async (files) => {
    if (!files || !files.length || !user) return
    setIsUploading(true); setUploadProgress(0)
    const totalFiles = files.length

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i]
      try {
        setUploadProgress(Math.round((i / totalFiles) * 100))
        const ext = file.name.split('.').pop().toLowerCase()
        let type = 'pdf'
        if (['docx', 'doc'].includes(ext)) type = 'docx'
        else if (['pptx', 'ppt'].includes(ext)) type = 'pptx'
        else if (['mp4', 'webm', 'mov'].includes(ext)) type = 'video'
        else if (['mp3', 'wav', 'm4a'].includes(ext)) type = 'audio'
        else if (['jpg', 'png', 'jpeg', 'webp'].includes(ext)) type = 'image'
        
        await uploadMaterial({ file, courseId: folderId, userId: user.id, title: file.name, type, week: 1 })
      } catch (err) { 
        console.error('[Folder] Upload failed:', err) 
      }
    }
    setUploadProgress(100)
    setTimeout(() => { setIsUploading(false); setUploadProgress(0); loadMaterials() }, 500)
  }

  const handleFileSelect = (e) => handleAddMaterial(Array.from(e.target.files))
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleAddMaterial(Array.from(e.dataTransfer.files)) }

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Are you sure you want to permanently delete this file? This cannot be undone.')) {
      try {
        await permanentlyDeleteMaterial(itemId)
        loadMaterials()
      } catch (err) {
        console.error('Failed to delete material:', err)
        alert('Could not delete the file. Please try again later.')
      }
    }
  }

  const handleStartStudying = () => {
    if (!materials.length) return
    navigate(`/workstation?courseId=${folderId}`)
  }

  const filteredItems = materials
    .filter(item => materialLabel(item).toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return materialLabel(a).localeCompare(materialLabel(b))
      if (sortBy === 'date') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'type') return a.type?.localeCompare(b.type)
      return 0
    })

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.ss-folder-menu-btn') && !e.target.closest('.ss-dropdown')) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="ss-loading">
        <div className="ss-loading-inner">
          <div className="ss-spinner" />
          <span className="ss-loading-text" style={{ marginTop: 16 }}>Loading folder...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="ss-root" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {isDragging && (
        <div className="ss-drag-overlay">
          <div className="ss-drag-inner">
            <Upload size={52} />
            <span>Drop files to add to folder</span>
          </div>
        </div>
      )}

      {/* Top Navigation & Breadcrumbs */}
      <header className="dhd-header ss-page-header">
        <div className="dhd-header-left">
          {sidebarCollapsed && (
            <button 
              className="dhd-sidebar-toggle"
              onClick={() => setSidebarCollapsed(false)}
              title="Toggle Sidebar"
            >
              <SidebarSimple size={14} weight="regular" />
            </button>
          )}
          <div 
            className="dhd-page-title" 
            onClick={() => navigate('/backpack')} 
            style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <House size={16} weight="regular" />
            <span>Backpack</span>
          </div>
          <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
          <div className="dhd-page-title" style={{ color: 'var(--foreground)' }}>
            <span>{courseName || courseCode || 'Folder'}</span>
          </div>
        </div>
        
        <div className="dhd-header-right">
          <Link to="/profile" className="dhd-badge dhd-badge-level" title="Your Level">
            <Star size={16} weight="fill" />
            <span>Lvl {level}</span>
          </Link>

          <Link to="/profile" className="dhd-badge dhd-badge-xp" title="Your XP">
            <Lightning size={16} weight="fill" />
            <span id="header-xp-display">{xp} XP</span>
          </Link>

          <Link to="/store" className="dhd-badge dhd-badge-coin" title="Your Coins">
            <Coins size={16} weight="fill" />
            <span>{credits >= 1000 ? `${Math.floor(credits / 1000)}k` : credits}</span>
          </Link>

          <button 
            className="dhd-icon-btn" 
            onClick={() => setNotificationsOpen?.(true)}
            title="Notifications"
          >
            <Bell size={20} weight="regular" />
            <span className="dhd-notif-dot" />
          </button>

          <button 
            className="dhd-icon-btn" 
            onClick={() => setIsDark(!isDark)}
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun size={20} weight="regular" /> : <Moon size={20} weight="regular" />}
          </button>
        </div>
      </header>

      <div className="ss-shell">
        {/* Hero Folder Header */}
        <div className="ss-folder-header">
          <div className="ss-folder-icon math" style={{ background: 'rgba(255,210,166,0.15)', color: '#FFD2A6' }}>
            <Folder size={28} weight="fill" />
          </div>
          
          <div className="ss-folder-title-group">
            <h1 className="ss-folder-title">{courseName || courseCode || 'Folder'}</h1>
          </div>

          {/* Visible Share Button */}
          <button 
            className="ss-share-btn" 
            onClick={() => navigate(`/workstation?courseId=${folderId}`)}
            title="Share Folder"
          >
            <Share2 size={15} />
            Share
          </button>

          <button className="ss-folder-menu-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <MoreHorizontal size={20} />
          </button>

          {showDropdown && (
            <div className="ss-dropdown">
              <button className="ss-dropdown-item danger" onClick={() => { handleDeleteFolder(); setShowDropdown(false); }}>
                <Trash2 size={15} /> Delete Folder
              </button>
            </div>
          )}
        </div>

        {/* Toolbar & Filters */}
        <div className="ss-toolbar">
          <div className="ss-filters">
            <button 
              className={`ss-filter-btn ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => setActiveTab('materials')}
            >
              All Materials
            </button>
            <button 
              className={`ss-filter-btn ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Users size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }}/>
              Members
            </button>
          </div>

          <div className="ss-search-group">
            <div className="ss-sort-dropdown">
              Recent <ChevronRight size={12} style={{ transform: 'rotate(90deg)' }} />
            </div>
            <div className="ss-search-input-wrap">
              <input 
                className="ss-search-input" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search this folder" 
              />
              <MagnifyingGlass size={16} />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'materials' && (
          <>
            <div className="ss-stats-bar">
              <span className="ss-stats-total">Total: {filteredItems.length}</span>
              <span className="ss-stats-todo">To-do: {filteredItems.length}</span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="ss-empty">
                <Folder size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                <h3>{searchQuery ? 'No materials found' : 'This folder is empty'}</h3>
                <p>{searchQuery ? 'Try adjusting your search.' : 'Add files to start studying. Drag & drop works too.'}</p>
              </div>
            ) : (
              <div className="ss-materials-grid">
                {filteredItems.map((item, i) => {
                  const title = materialLabel(item);
                  return (
                    <motion.div
                      key={item.id}
                      className="ss-preview-card"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => navigate(`/workstation/${item.id}`, { state: { material: item } })}
                    >
                      <div className="ss-card-preview">
                        <div className="ss-preview-title">{title?.split('.')[0]?.slice(0, 15)}</div>
                        <div className="ss-preview-subtitle">DOCUMENT PREVIEW</div>
                      </div>
                      <div className="ss-card-body">
                        <h4 className="ss-card-main-title">{title}</h4>
                        <div className="ss-card-meta">
                          <span>0 cards</span>
                          <span>0 to-do</span>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                            <button 
                              className="ss-card-remove" 
                              style={{ padding: 4, background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'members' && (
          <div className="ss-empty">
            <Users size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3>No Members Yet</h3>
            <p>Folders currently do not support live participants like Sessions do. Check back later!</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      {activeTab === 'materials' && (
        <div className="ss-fab-container">
          <div className="ss-fab">
            <button className="ss-premium-btn outline" onClick={handleStartStudying}>
              Study
            </button>
            <label className="ss-premium-btn">
              <Upload size={16} /> Upload Document
              <input type="file" multiple onChange={handleFileSelect} hidden />
            </label>
          </div>
        </div>
      )}

      {/* Upload Progress Modal */}
      {isUploading && (
        <div className="ss-upload-overlay">
          <div className="ss-upload-modal">
            <div className="ss-upload-icon"><Upload size={24} /></div>
            <h3>Uploading files</h3>
            <p>{uploadProgress}% complete</p>
            <div className="ss-progress-track">
              <div className="ss-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      <AnimatePresence>
        {previewMaterial && (
          <motion.div
            className="lp-modal-backdrop"
            style={{ zIndex: 1000, padding: '24px' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreviewMaterial(null)}
          >
            <motion.div
              className="lp-modal"
              style={{ width: 'min(1000px, 100%)', height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--lp-border)' }}>
                <h2 style={{ fontSize: 18, margin: 0 }}>{materialLabel(previewMaterial)}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="lp-btn lp-btn-primary"
                    onClick={() => navigate(`/workstation/${previewMaterial.id}`, { state: { material: previewMaterial } })}
                  >
                    <Play size={18} /> Open in Workstation
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
    </div>
  )
}
