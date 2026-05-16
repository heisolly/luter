import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { 
  RiBookFill as Book, RiArrowRightSLine as ChevronRight,
  RiBriefcaseFill as Backpack, RiAddLine as Plus,
  RiSearchLine as Search, RiFileTextFill as FileText, RiUploadLine as Upload,
  RiVideoFill as Video, RiImageFill as Image, RiMusicFill as Music,
  RiCalculatorFill as Calculator, RiFlaskFill as Flask,
  RiHistoryFill as History, RiGlobeFill as Globe,
  RiCodeBoxFill as Code, RiPaletteFill as Palette
} from 'react-icons/ri'
import UserUpload from './UserUpload'
import CourseEnrollmentModal from '../shared/CourseEnrollmentModal'
import { 
  BookOpen as PhBookOpen, Calculator as PhCalculator, Flask as PhFlask, Globe as PhGlobe, MusicNotes, 
  Code as PhCode, Palette as PhPalette, Dna
} from '@phosphor-icons/react'
import { 
  Eye, FolderSimple, Download, ShareNetwork, Trash, Pencil, Share, 
  ChartLine, FileText as PhFileText, Info, Gear
} from '@phosphor-icons/react'
import { LuterPageLoader } from '../shared/LuterPageLoader'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { courseService } from '../../services/courseService'
import { fetchUserStandaloneMaterials } from '../../services/materialsService'
import { 
  createMaterialShare, 
  getUserMaterialShares, 
  updateMaterialShare, 
  deleteMaterialShare, 
  getShareAnalytics 
} from '../../../services/sharingService'
import { useUniversalWorkspaceStore } from '../../store/useUniversalWorkspaceStore'
import { useSessionStore } from '../../store/useSessionStore'
import { cachePageData, getCachedPageData } from '../../lib/offlineCache'
import useTourStore from '../../store/useTourStore'

// Course icon mapping (metadata-based with heuristic fallback)
const getCourseIcon = (courseName = '', courseCode = '', courseMetadata = {}) => {
  // First check if we have metadata with course_type or department
  if (courseMetadata.course_type) {
    const typeIcons = {
      core: <PhBookOpen size={24} weight="fill" />,
      elective: <PhCode size={24} weight="fill" />,
      general_studies: <PhGlobe size={24} weight="fill" />,
      practical: <PhFlask size={24} weight="fill" />
    }
    return typeIcons[courseMetadata.course_type] || typeIcons.core
  }

  // Check department_slug if available
  if (courseMetadata.department_slug) {
    const dept = courseMetadata.department_slug.toLowerCase()
    if (dept.includes('math') || dept.includes('stat') || dept.includes('calc')) 
      return <PhCalculator size={24} weight="fill" />
    if (dept.includes('bio') || dept.includes('chem') || dept.includes('phys') || dept.includes('sci')) 
      return <PhFlask size={24} weight="fill" />
    if (dept.includes('hist') || dept.includes('geo') || dept.includes('poli')) 
      return <History size={24} weight="fill" />
    if (dept.includes('comp') || dept.includes('soft') || dept.includes('eng')) 
      return <PhCode size={24} weight="fill" />
    if (dept.includes('art') || dept.includes('design') || dept.includes('arch')) 
      return <PhPalette size={24} weight="fill" />
  }

  // Fallback to heuristic string matching
  const text = `${courseName} ${courseCode}`.toLowerCase()
  
  if (text.includes('math') || text.includes('calc') || text.includes('stat') || text.includes('algebra') || text.includes('geometry')) {
    return <PhCalculator size={24} weight="fill" />
  }
  if (text.includes('bio') || text.includes('chem') || text.includes('phys') || text.includes('sci') || text.includes('lab')) {
    return <PhFlask size={24} weight="fill" />
  }
  if (text.includes('hist') || text.includes('past') || text.includes('ancient') || text.includes('war')) {
    return <History size={24} weight="fill" />
  }
  if (text.includes('geo') || text.includes('econ') || text.includes('poli') || text.includes('world')) {
    return <PhGlobe size={24} weight="fill" />
  }
  if (text.includes('code') || text.includes('program') || text.includes('software') || text.includes('computer') || text.includes('data')) {
    return <PhCode size={24} weight="fill" />
  }
  if (text.includes('art') || text.includes('design') || text.includes('paint') || text.includes('draw')) {
    return <PhPalette size={24} weight="fill" />
  }
  if (text.includes('music') || text.includes('song') || text.includes('audio')) {
    return <MusicNotes size={24} weight="fill" />
  }
  if (text.includes('genetics') || text.includes('dna') || text.includes('cell') || text.includes('molecular')) {
    return <Dna size={24} weight="fill" />
  }
  
  return <PhBookOpen size={24} weight="fill" />
}

// Get course accent color (metadata-based with heuristic fallback)
const getCourseColor = (courseName = '', courseCode = '', courseMetadata = {}) => {
  // First check if we have metadata with course_type or department
  if (courseMetadata.course_type) {
    const typeColors = {
      core: { bg: '#F0F9FF', icon: '#0284C7', border: '#BAE6FD' },
      elective: { bg: '#F5F3FF', icon: '#7C3AED', border: '#DDD6FE' },
      general_studies: { bg: '#FEF3C7', icon: '#D97706', border: '#FDE68A' },
      practical: { bg: '#F0FDF4', icon: '#16A34A', border: '#BBF7D0' }
    }
    return typeColors[courseMetadata.course_type] || typeColors.core
  }

  // Check department_slug if available
  if (courseMetadata.department_slug) {
    const dept = courseMetadata.department_slug.toLowerCase()
    if (dept.includes('math') || dept.includes('stat') || dept.includes('calc')) 
      return { bg: '#F0F9FF', icon: '#0284C7', border: '#BAE6FD' }
    if (dept.includes('bio') || dept.includes('chem') || dept.includes('phys') || dept.includes('sci')) 
      return { bg: '#F0FDF4', icon: '#16A34A', border: '#BBF7D0' }
    if (dept.includes('hist') || dept.includes('geo') || dept.includes('poli')) 
      return { bg: '#FEF3C7', icon: '#D97706', border: '#FDE68A' }
    if (dept.includes('comp') || dept.includes('soft') || dept.includes('eng')) 
      return { bg: '#F5F3FF', icon: '#7C3AED', border: '#DDD6FE' }
    if (dept.includes('art') || dept.includes('design') || dept.includes('arch')) 
      return { bg: '#FDF2F8', icon: '#DB2777', border: '#FBCFE8' }
  }

  // Fallback to heuristic string matching
  const text = `${courseName} ${courseCode}`.toLowerCase()
  
  if (text.includes('math') || text.includes('calc')) return { bg: '#F0F9FF', icon: '#0284C7', border: '#BAE6FD' }
  if (text.includes('bio') || text.includes('chem') || text.includes('phys')) return { bg: '#F0FDF4', icon: '#16A34A', border: '#BBF7D0' }
  if (text.includes('hist') || text.includes('geo')) return { bg: '#FEF3C7', icon: '#D97706', border: '#FDE68A' }
  if (text.includes('code') || text.includes('program')) return { bg: '#F5F3FF', icon: '#7C3AED', border: '#DDD6FE' }
  if (text.includes('art') || text.includes('design')) return { bg: '#FDF2F8', icon: '#DB2777', border: '#FBCFE8' }
  if (text.includes('music')) return { bg: '#FEF2F2', icon: '#DC2626', border: '#FECACA' }
  
  return { bg: '#F5F3FF', icon: '#7a12cc', border: '#E9D5FF' }
}

export default function CoursesPage() {
  const { user, isMobile } = useOutletContext()
  const navigate = useNavigate()
  const { bundle } = useDashboardPrefetch()
  const profile = bundle?.profile?.data || bundle?.profile
  const isSoloLearner = profile?.is_university_user === false || profile?.role === 'solo_learner'
  const { workspace } = useUniversalWorkspaceStore()
  const { sessions } = useSessionStore()
  
  const [activeTab, setActiveTab] = useState(() => {
    // Load active tab from localStorage or default to 'courses'
    const saved = localStorage.getItem('coursesPageActiveTab')
    if (isSoloLearner && (!saved || saved === 'courses')) return 'materials'
    return saved || 'courses'
  })

  // Force materials tab for solo learners
  useEffect(() => {
    if (isSoloLearner && activeTab === 'courses') {
      setActiveTab('materials')
    }
  }, [isSoloLearner, activeTab])
  const [courses, setCourses] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [streak, setStreak] = useState(0)
  const [level, setLevel] = useState(1)
  const [coins, setCoins] = useState(0)
  
  // Materials tab controls
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('updated') // 'updated' or 'type'
  const [filterType, setFilterType] = useState('all') // 'all' or specific type

  // Courses tab materials controls
  const [coursesViewMode, setCoursesViewMode] = useState('grid') // 'grid' or 'list'
  const [coursesSortBy, setCoursesSortBy] = useState('updated') // 'updated', 'type', 'course'
  const [coursesFilterType, setCoursesFilterType] = useState('all') // 'all' or specific type
  const [coursesFilterCourse, setCoursesFilterCourse] = useState('all') // 'all' or specific course
  const [selectedMaterials, setSelectedMaterials] = useState([]) // for bulk actions

  // Courses tab controls
  const [coursesDisplayMode, setCoursesDisplayMode] = useState('grid') // 'grid' or 'list'
  const [coursesSortOption, setCoursesSortOption] = useState('name') // 'name', 'code', 'updated'
  const [showCourseAddModal, setShowCourseAddModal] = useState(false) // for adding courses

  // Dropdown menu states
  const [activeDropdown, setActiveDropdown] = useState(null) // which dropdown is open
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showMoveToSessionModal, setShowMoveToSessionModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showManageSharingModal, setShowManageSharingModal] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [newMaterialName, setNewMaterialName] = useState('')
  const [shareData, setShareData] = useState(null)
  const [shareAnalytics, setShareAnalytics] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchCourses()
      fetchMaterials()
      loadGamificationData()
    }
  }, [user?.id])

  const { startTour, hasCompletedTour, completedTours, currentUserId, isLoadingTours } = useTourStore()

  useEffect(() => {
    if (user?.id && currentUserId === user.id && !loading && !isLoadingTours && !hasCompletedTour('backpack')) {
      const timer = setTimeout(() => startTour('backpack'), 2000)
      return () => clearTimeout(timer)
    }
  }, [user?.id, currentUserId, completedTours, loading, hasCompletedTour, startTour, isLoadingTours])

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('coursesPageActiveTab', activeTab)
  }, [activeTab])

  const loadGamificationData = async () => {
    try {
      // Load from new gamification table
      const { data: gamifData, error: gamifError } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (!gamifError && gamifData) {
        setStreak(gamifData.streak_days || 0)
        setLevel(gamifData.level || 1)
        setCoins(gamifData.coins || 0)
        return
      }
      
      // Fallback to old user_stats table
      const { data, error } = await supabase.from('user_stats').select('streak_days').eq('user_id', user.id).maybeSingle()
      if (data) setStreak(data.streak_days || 0)
      
      // Create initial gamification record if needed
      if (!gamifData) {
        await supabase
          .from('user_gamification')
          .insert({
            user_id: user.id,
            level: 1,
            xp: 0,
            coins: 0,
            total_study_time_minutes: 0,
            sessions_completed: 0,
            questions_answered: 0,
            materials_studied: 0
          })
      }
    } catch (error) {
      console.error('Error loading gamification data:', error)
    }
  }

  const fetchCourses = async () => {
    setLoading(true)
    const cached = getCachedPageData(user.id, 'courses')
    const offline = typeof navigator !== 'undefined' && !navigator.onLine

    if (offline && cached?.data) {
      setCourses(cached.data)
      setLoading(false)
      return
    }

    const { data, error } = await courseService.fetchUserCourses(user.id)
    if (!error && data) {
      setCourses(data)
      cachePageData(user.id, 'courses', data)
    } else if (cached?.data) {
      setCourses(cached.data)
    }
    setLoading(false)
  }

  const fetchMaterials = async () => {
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
      console.error('Error fetching materials:', error)
      if (cached?.data) setMaterials(cached.data)
    }
  }

  // Get filtered and sorted materials function
  const getFilteredAndSortedMaterials = () => {
    let filtered = materials
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(material => material.type === filterType)
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(material => 
        material.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply sorting
    if (sortBy === 'updated') {
      filtered = filtered.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    } else if (sortBy === 'type') {
      filtered = filtered.sort((a, b) => (a.type || '').localeCompare(b.type || ''))
    }
    
    return filtered
  }

  const filteredCourses = courses.filter(course => 
    course.courses?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.courses?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMaterials = getFilteredAndSortedMaterials()


  // Material type pill styling
  const getMaterialTypeStyle = (type) => {
    const styles = {
      pdf: { bg: '#FEF3C7', color: '#D97706', label: 'PDF' },
      docx: { bg: '#DBEAFE', color: '#2563EB', label: 'DOCX' },
      image: { bg: '#FEE2E2', color: '#DC2626', label: 'IMAGE' },
      video: { bg: '#FFEDD5', color: '#EA580C', label: 'VIDEO' },
      flashcard: { bg: '#F3E8FF', color: '#7C3AED', label: 'FLASHCARD' },
      podcast: { bg: '#DCFCE7', color: '#16A34A', label: 'PODCAST' },
      default: { bg: '#F1F5F9', color: '#64748B', label: (type || 'FILE').toUpperCase() }
    }
    return styles[type] || styles.default
  }

  // Materials tab control handlers
  const handleTypeFilter = () => {
    // Toggle through filter types
    const types = ['all', 'pdf', 'docx', 'image', 'video', 'flashcard', 'podcast']
    const currentIndex = types.indexOf(filterType)
    const nextIndex = (currentIndex + 1) % types.length
    setFilterType(types[nextIndex])
  }

  const handleSortToggle = () => {
    // Toggle between sort options
    setSortBy(sortBy === 'updated' ? 'type' : 'updated')
  }

  const handleViewToggle = (mode) => {
    setViewMode(mode)
  }

  // Courses tab materials control handlers
  const handleCoursesTypeFilter = () => {
    const types = ['all', 'pdf', 'docx', 'image', 'video', 'flashcard', 'podcast']
    const currentIndex = types.indexOf(coursesFilterType)
    const nextIndex = (currentIndex + 1) % types.length
    setCoursesFilterType(types[nextIndex])
  }

  // Courses tab control handlers
  const handleCoursesDisplayToggle = (mode) => {
    setCoursesDisplayMode(mode)
  }

  const handleCoursesSortToggle = () => {
    const sortOptions = ['name', 'code', 'updated']
    const currentIndex = sortOptions.indexOf(coursesSortOption)
    const nextIndex = (currentIndex + 1) % sortOptions.length
    setCoursesSortOption(sortOptions[nextIndex])
  }

  const getSortedCourses = () => {
    let sorted = [...filteredCourses]
    
    if (coursesSortOption === 'name') {
      sorted.sort((a, b) => (a.courses?.name || '').localeCompare(b.courses?.name || ''))
    } else if (coursesSortOption === 'code') {
      sorted.sort((a, b) => (a.courses?.code || '').localeCompare(b.courses?.code || ''))
    } else if (coursesSortOption === 'updated') {
      sorted.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    }
    
    return sorted
  }

  // Dropdown Menu Component
  const DropdownMenu = ({ type, item, isOpen, onToggle }) => {
    const isMaterial = type === 'material'
    
    const menuItems = isMaterial ? [
      { icon: <Eye size={16} />, label: 'Preview', onClick: () => handlePreview(item) },
      { icon: <FolderSimple size={16} />, label: 'Move to Session', onClick: () => handleMoveToSession(item) },
      { icon: <Pencil size={16} />, label: 'Rename', onClick: () => handleRename(item) },
      { icon: <Download size={16} />, label: 'Download', onClick: () => handleDownload(item) },
      { icon: <ShareNetwork size={16} />, label: 'Share', onClick: () => handleShare(item) },
      { icon: <Gear size={16} />, label: 'Manage Sharing', onClick: () => handleManageSharing(item) },
      { icon: <Trash size={16} />, label: 'Delete', onClick: () => handleDelete(item), danger: true }
    ] : [
      { icon: <ChartLine size={16} />, label: 'View Progress', onClick: () => navigate(`/dashboard/courses/${item.course_id}`) },
      { icon: <PhFileText size={16} />, label: 'View Materials', onClick: () => navigate(`/dashboard/courses/${item.course_id}/materials`) },
      { icon: <ShareNetwork size={16} />, label: 'Share Course', onClick: () => handleShare(item) },
      { icon: <Info size={16} />, label: 'Course Details', onClick: () => navigate(`/dashboard/courses/${item.course_id}`) }
    ]

    return (
      <div 
        style={{ position: 'relative' }}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggle(`${type}-${item.id}`)
          }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '4px',
            borderRadius: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              minWidth: 180,
              overflow: 'hidden'
            }}
          >
            {menuItems.map((menuItem, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  menuItem.onClick()
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: menuItem.danger ? '#ef4444' : '#374151',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = menuItem.danger ? '#fef2f2' : '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', color: menuItem.danger ? '#ef4444' : '#6b7280' }}>
                  {menuItem.icon}
                </span>
                {menuItem.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    )
  }

  // Dropdown menu handlers
  const handleDropdownToggle = (dropdownId) => {
    setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId)
  }

  const handlePreview = (material) => {
    setSelectedMaterial(material)
    setShowPreviewModal(true)
    setActiveDropdown(null)
  }

  const handleMoveToSession = (material) => {
    setSelectedMaterial(material)
    setShowMoveToSessionModal(true)
    setActiveDropdown(null)
  }

  const handleDownload = async (material) => {
    try {
      const { data, error } = await supabase.storage
        .from('materials')
        .download(material.file_path)
      
      if (error) throw error
      
      // Create download link
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = material.title || material.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setActiveDropdown(null)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleDelete = async (material) => {
    if (window.confirm(`Are you sure you want to delete "${material.title || material.file_name}"?`)) {
      try {
        // Delete from storage
        if (material.file_path) {
          await supabase.storage
            .from('materials')
            .remove([material.file_path])
        }
        
        // Delete from database
        const { error } = await supabase
          .from('materials')
          .delete()
          .eq('id', material.id)
        
        if (error) throw error
        
        // Update local state
        setMaterials(materials.filter(m => m.id !== material.id))
        setActiveDropdown(null)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  const handleShare = (material) => {
    // Copy share link to clipboard
    const shareUrl = `${window.location.origin}/dashboard/materials/${material.id}`
    navigator.clipboard.writeText(shareUrl)
    setActiveDropdown(null)
    // Show success message
    alert('Share link copied to clipboard!')
  }

  const handleRename = (material) => {
    setSelectedMaterial(material)
    setNewMaterialName(material.title || material.file_name)
    setShowRenameModal(true)
    setActiveDropdown(null)
  }

  const handleRenameSubmit = () => {
    if (!selectedMaterial || !newMaterialName.trim()) return
    
    if (newMaterialName.trim() !== (selectedMaterial.title || selectedMaterial.file_name)) {
      // Update material in database
      supabase
        .from('materials')
        .update({ title: newMaterialName.trim() })
        .eq('id', selectedMaterial.id)
        .then(({ error }) => {
          if (error) {
            console.error('Rename failed:', error)
            alert('Failed to rename material')
          } else {
            // Update local state
            setMaterials(materials.map(m => 
              m.id === selectedMaterial.id ? { ...m, title: newMaterialName.trim() } : m
            ))
            setShowRenameModal(false)
            setSelectedMaterial(null)
            setNewMaterialName('')
          }
        })
    } else {
      setShowRenameModal(false)
      setSelectedMaterial(null)
      setNewMaterialName('')
    }
  }

  const handleManageSharing = async (material) => {
    setSelectedMaterial(material)
    setActiveDropdown(null)
    
    try {
      // Get or create share for this material
      const shareResult = await createMaterialShare(material.id, user.id)
      setShareData(shareResult)
      
      // Get analytics for this share
      const analytics = await getShareAnalytics(shareResult.shareId)
      setShareAnalytics(analytics)
      
      setShowManageSharingModal(true)
    } catch (error) {
      console.error('Error managing sharing:', error)
      alert('Failed to load sharing settings')
    }
  }

  const handleUpdateShareSettings = async (updates) => {
    if (!shareData) return
    
    try {
      const updatedShare = await updateMaterialShare(shareData.shareId, updates)
      setShareData(updatedShare)
      
      // Refresh analytics
      const analytics = await getShareAnalytics(updatedShare.id)
      setShareAnalytics(analytics)
    } catch (error) {
      console.error('Error updating share settings:', error)
      alert('Failed to update sharing settings')
    }
  }

  const handleDeleteShare = async () => {
    if (!shareData) return
    
    if (confirm('Are you sure you want to delete this share? This will disable the sharing link.')) {
      try {
        await deleteMaterialShare(shareData.shareId)
        setShowManageSharingModal(false)
        setShareData(null)
        setShareAnalytics(null)
        alert('Share deleted successfully')
      } catch (error) {
        console.error('Error deleting share:', error)
        alert('Failed to delete share')
      }
    }
  }

  const handleCoursesAdded = () => {
    // Refresh courses after adding new ones
    fetchCourses()
    setShowCourseAddModal(false)
  }

  
  const handleCoursesCourseFilter = () => {
    const courseOptions = ['all', ...courses.map(c => c.id)]
    const currentIndex = courseOptions.indexOf(coursesFilterCourse)
    const nextIndex = (currentIndex + 1) % courseOptions.length
    setCoursesFilterCourse(courseOptions[nextIndex])
  }

  const handleCoursesViewToggle = (mode) => {
    setCoursesViewMode(mode)
  }

  const handleMaterialSelect = (materialId) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    )
  }

  const handleSelectAll = () => {
    const filtered = getFilteredAndSortedCourseMaterials()
    setSelectedMaterials(
      selectedMaterials.length === filtered.length 
        ? [] 
        : filtered.map(m => m.id)
    )
  }

  const handleBulkDelete = async () => {
    // Implementation for bulk delete
    console.log('Deleting materials:', selectedMaterials)
    setSelectedMaterials([])
  }

  const handleBulkMove = async (targetCourseId) => {
    // Implementation for bulk move
    console.log('Moving materials to course:', targetCourseId, selectedMaterials)
    setSelectedMaterials([])
  }

  // Get filtered and sorted course materials
  const getFilteredAndSortedCourseMaterials = () => {
    let filtered = materials
    
    // Apply type filter
    if (coursesFilterType !== 'all') {
      filtered = filtered.filter(material => material.type === coursesFilterType)
    }
    
    // Apply course filter
    if (coursesFilterCourse !== 'all') {
      filtered = filtered.filter(material => material.course_id === coursesFilterCourse)
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(material => 
        material.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply sorting
    if (coursesSortBy === 'updated') {
      filtered = filtered.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    } else if (coursesSortBy === 'type') {
      filtered = filtered.sort((a, b) => (a.type || '').localeCompare(b.type || ''))
    } else if (coursesSortBy === 'course') {
      filtered = filtered.sort((a, b) => {
        const courseA = courses.find(c => c.id === a.course_id)
        const courseB = courses.find(c => c.id === b.course_id)
        return (courseA?.code || '').localeCompare(courseB?.code || '')
      })
    }
    
    return filtered
  }

  return (
    <div className="dhd-root" style={{ minHeight: '100vh' }}>
      {/* Header - Navbar Style */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingInline: '0',
        paddingBlock: '0px',
        position: 'relative',
        marginTop: '-1px',
        justifyContent: 'space-between',
        gap: '2rem',
        transition: 'box-shadow 0.5s',
        height: 'var(--navbar-height)',
        backgroundColor: 'var(--color-bgPrimary)',
        marginBottom: '16px'
      }}>
        {/* Left Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 0%',
          gap: '1rem'
        }}>
          {/* Mobile Menu Button */}
          <button 
            className="MuiBox-root knowt-1krzpqj"
            aria-label="open menu"
            style={{
              display: isMobile ? 'flex' : 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu" aria-hidden="true">
              <path d="M4 5h16"></path>
              <path d="M4 12h16"></path>
              <path d="M4 19h16"></path>
            </svg>
          </button>

          {/* Mobile Search Button */}
          <button 
            className="MuiBox-root knowt-1krzpqj breakpoints-module__zbexiG__mdUpDisplayNone"
            aria-label="Knowt button" 
            id="main-search-bar"
            style={{
              display: isMobile ? 'flex' : 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search" aria-hidden="true">
              <path d="m21 21-4.34-4.34"></path>
              <circle cx="11" cy="11" r="8"></circle>
            </svg>
          </button>

          {/* Search Bar */}
          <div 
            className="ellipsisText breakpoints-module__zbexiG__mdDownDisplayNone MuiBox-root knowt-1xgonjw"
            style={{
              display: isMobile ? 'none' : 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '8px 16px',
              fontFamily: "'Varela Round', sans-serif",
              fontSize: 15,
              color: '#94a3b8',
              minWidth: '250px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search" aria-hidden="true" style={{ opacity: 0.5 }}>
              <path d="m21 21-4.34-4.34"></path>
              <circle cx="11" cy="11" r="8"></circle>
            </svg>
            <input
              type="text"
              placeholder="Search for anything"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'none',
                outline: 'none',
                flex: 1,
                fontSize: 15,
                fontFamily: "'Varela Round', sans-serif",
                color: '#333',
                opacity: searchQuery ? 1 : 0.5
              }}
            />
          </div>
        </div>

        {/* Right Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'safe flex-end',
          columnGap: '1rem'
        }}>
          {/* Create Button */}
          <button
            className="MuiBox-root knowt-h58brt"
            aria-label="Knowt button" 
            id="tour-enroll-btn"
            onClick={() => navigate('/dashboard/upload')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
          </button>

        {/* Streak Counter */}
        <button 
          className="MuiBox-root knowt-3peil5"
          onClick={() => navigate('/dashboard/streak')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: 8,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 155, 56, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <title>Streak</title>
                <path d="M9.03694 24C12.9377 24 16.4405 21.4325 17.605 17.5973C17.8514 16.7861 18.001 15.9249 18 15.0308C17.9956 11.0114 15.1454 6.96942 14.0257 5.53641C13.9171 5.39735 13.7109 5.51089 13.7502 5.6851C13.9485 6.5634 14.2372 8.07558 14.1229 9.01735C14.0429 9.67632 13.8602 10.2147 13.69 10.5989C13.6169 10.7638 13.419 10.6878 13.4381 10.5074C13.519 9.73943 13.5566 8.53444 13.1728 7.61391C12.4699 5.92867 11.1617 5.1469 10.6578 3.62953C10.2307 2.34352 10.5866 0.9032 10.8039 0.233155C10.8503 0.0901149 10.7139 -0.0482382 10.5823 0.0163087C9.75272 0.423456 7.65167 1.61661 6.03855 3.91412C4.48819 6.12226 4.66683 8.75384 4.96046 10.269C4.99816 10.4636 4.68947 10.6258 4.54898 10.491C4.41133 10.3588 4.24801 10.2141 4.05425 10.0571C3.31404 9.4571 3.25537 8.49877 3.3147 7.86695C3.33102 7.69314 3.11026 7.57011 2.99856 7.70068C2.07822 8.77657 -0.00378012 11.591 5.15456e-06 15.0309C0.00132425 16.2296 0.335763 17.4386 0.822252 18.5638C2.26078 21.8908 5.504 24 9.03694 24Z" fill="#ff9b38"></path>
                <path d="M12.5928 18.6134C12.6732 16.5721 11.4313 15.2014 10.6589 14.323C9.72076 13.2559 9.57245 12.1251 9.57295 11.5141C9.57308 11.3565 9.38211 11.2476 9.26694 11.3504C8.48418 12.049 6.58532 13.8759 6.17231 15.4988C5.89967 16.5704 6.07799 17.3989 6.29684 17.9311C6.36614 18.0997 6.17782 18.3031 6.04821 18.1786C5.99934 18.1317 5.95247 18.0814 5.90969 18.0279C5.76303 17.8446 5.6555 17.6483 5.57895 17.4773C5.51312 17.3302 5.34697 17.3376 5.33746 17.4995C5.32088 17.782 5.32578 18.2066 5.3955 18.824C5.50894 19.8283 5.98052 20.5962 6.54672 21.1704C7.92288 22.566 10.1561 22.5299 11.5091 21.1092C12.0888 20.5006 12.5507 19.6838 12.5928 18.6134Z" fill="#FEDC29"></path>
              </svg>
            </div>
            <span className="new_bodyMBold" style={{ color: 'rgb(255, 155, 56)' }}>{streak || 1}</span>
          </div>
        </button>

        {/* Level Badge - Hidden on mobile */}
        <div className="breakpoints-module__zbexiG__mdDownDisplayNone">
          <button 
            className="MuiBox-root knowt-3peil5"
            onClick={() => navigate('/dashboard/profile')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(151, 110, 238, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <svg width="20" height="20" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <title>Levels</title>
                  <path fillRule="evenodd" clipRule="evenodd" d="M14.9936 0.677492C12.8268 2.26076 10.5479 3.66886 8.91217 4.43512C6.50413 5.56309 3.60975 6.40891 0.959029 6.7591C0.611852 6.80501 0.250714 6.85849 0.156549 6.87803C-0.0147001 6.91354 -0.0147001 6.91354 0.0147078 13.244C0.0352042 17.6458 0.0712958 19.7555 0.133305 20.1688C0.552591 22.9655 1.39413 25.5485 2.58983 27.7088C5.16674 32.3646 9.24196 35.8051 14.2339 37.5394C15.7725 38.0739 15.8923 38.0894 16.6963 37.8587C20.044 36.8981 23.2063 35.0219 25.7263 32.501C29.0455 29.1808 31.0489 25.1043 31.787 20.1688C31.8487 19.7565 31.885 17.6353 31.9054 13.244C31.9348 6.91354 31.9348 6.91354 31.7635 6.87803C31.6694 6.85849 31.3082 6.80501 30.9611 6.7591C29.0555 6.50734 26.6524 5.90354 24.9136 5.23957C22.3382 4.25616 19.8307 2.81575 16.784 0.569628C16.359 0.256362 15.9909 0 15.9661 0C15.9412 0 15.5036 0.304871 14.9936 0.677492Z" fill="#6745AE"></path>
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.1711 4.04622C13.3964 5.33183 11.5298 6.47521 10.1901 7.09741C8.21782 8.01332 5.84718 8.70013 3.67612 8.98448C3.39176 9.02176 3.09597 9.06519 3.01885 9.08105C2.87858 9.10989 2.87858 9.10989 2.90267 14.2502C2.91946 17.8245 2.94902 19.5376 2.99981 19.8731C3.34322 22.1441 4.03249 24.2415 5.01182 25.9957C7.12243 29.7761 10.4602 32.5698 14.5489 33.9781C15.809 34.4121 15.9072 34.4247 16.5657 34.2374C19.3076 33.4574 21.8977 31.9339 23.9617 29.8869C26.6803 27.1909 28.3212 23.8808 28.9257 19.8731C28.9762 19.5384 29.0059 17.816 29.0226 14.2502C29.0467 9.10989 29.0467 9.10989 28.9065 9.08105C28.8293 9.06519 28.5336 9.02176 28.2492 8.98448C26.6884 8.78005 24.7202 8.28977 23.2961 7.75062C21.1867 6.9521 19.1329 5.78248 16.6375 3.95863C16.2894 3.70426 15.988 3.49609 15.9676 3.49609C15.9472 3.49609 15.5888 3.74365 15.1711 4.04622Z" fill="#976EEE"></path>
                  <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontWeight="700" fill="#fff" fontSize="1.1em">LV</text>
                </svg>
              </div>
              <span className="new_bodyMBold" style={{ color: 'rgb(151, 110, 238)' }}>{level}</span>
            </div>
          </button>
        </div>   {/* Coins */}
          <button 
            className="MuiBox-root knowt-3peil5"
            onClick={() => navigate('/dashboard/store')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(254, 153, 35, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img alt="your coins" width="20" height="20" decoding="async" data-nimg="1" src="https://s3.amazonaws.com/knowt-generic-storage/gamification/coin-icon.svg" style={{ color: 'transparent' }} />
              <span className="new_bodyMBold" style={{ color: 'rgb(254, 153, 35)' }}>{coins}</span>
            </div>
          </button>

          {/* Profile Avatar */}
          <button
            onClick={() => navigate('/dashboard/profile')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 12,
              fontWeight: 700,
              border: '2px solid #e2e8f0',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff9b38' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0' }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile?.full_name?.slice(0, 1).toUpperCase() || 'U'
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Pill Toggle Tabs - Centered */}
      {!isSoloLearner && (
        <div id="tour-backpack-tabs" style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginBottom: 48,
          marginTop: 32
        }}>
          <div style={{
            display: 'flex',
            background: '#f1f5f9', 
            borderRadius: 12, 
            padding: 4,
            gap: 4
          }}>
            <button
              onClick={() => setActiveTab('courses')}
              style={{
                padding: '10px 24px',
                background: activeTab === 'courses' ? '#8b5cf6' : 'transparent',
                color: activeTab === 'courses' ? '#fff' : '#64748b',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              My Courses
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              style={{
                padding: '10px 24px',
                background: activeTab === 'materials' ? '#fb923c' : 'transparent',
                color: activeTab === 'materials' ? '#fff' : '#64748b',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              Materials
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'courses' && (
          <motion.div 
            key="courses" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Courses Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '2rem',
              padding: '0 0.5rem'
            }}>
              <div>
                <h1 style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: '#111',
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: '-0.02em',
                  margin: '0 0 0.5rem 0'
                }}>
                  Your Backpack
                </h1>
                <p style={{
                  fontSize: 14,
                  color: '#64748b',
                  margin: 0,
                  fontWeight: 400
                }}>
                  {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} enrolled
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={handleCoursesSortToggle}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#64748b',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8b5cf6'
                    e.currentTarget.style.color = '#8b5cf6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.color = '#64748b'
                  }}
                >
                  <span>
                    {coursesSortOption === 'name' ? 'Name' : 
                     coursesSortOption === 'code' ? 'Code' : 'Last Updated'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>

                {/* View Toggle */}
                <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 6, padding: 1 }}>
                  <button
                    onClick={() => handleCoursesDisplayToggle('grid')}
                    style={{
                      background: coursesDisplayMode === 'grid' ? '#8b5cf6' : 'none',
                      color: coursesDisplayMode === 'grid' ? 'white' : '#64748b',
                      border: 'none',
                      padding: '0.375rem',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                      <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                      <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                      <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleCoursesDisplayToggle('list')}
                    style={{
                      background: coursesDisplayMode === 'list' ? '#8b5cf6' : 'none',
                      color: coursesDisplayMode === 'list' ? 'white' : '#64748b',
                      border: 'none',
                      padding: '0.375rem',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (coursesDisplayMode !== 'list') {
                        e.currentTarget.style.color = '#8b5cf6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (coursesDisplayMode !== 'list') {
                        e.currentTarget.style.color = '#64748b'
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5h.01"></path>
                      <path d="M3 12h.01"></path>
                      <path d="M3 19h.01"></path>
                      <path d="M8 5h13"></path>
                      <path d="M8 12h13"></path>
                      <path d="M8 19h13"></path>
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => setShowCourseAddModal(true)}
                  style={{
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#a78bfa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8b5cf6'
                  }}
                >
                  <Plus size={20} />
                  Add Courses
                </button>
              </div>
            </div>

            {loading ? (
              <LuterPageLoader message="Loading your courses..." />
            ) : filteredCourses.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 80, 
                color: '#94a3b8',
                background: '#f8fafc',
                borderRadius: 20,
                border: '2px dashed #e2e8f0'
              }}>
                <Book size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#64748b' }}>
                  {searchQuery ? 'No courses found' : 'No courses yet'}
                </h3>
                <p style={{ fontSize: 14, marginBottom: 24 }}>
                  {searchQuery ? 'Try a different search term' : 'Add courses to get started with your learning journey'}
                </p>
              </div>
            ) : (
              <>
                {coursesDisplayMode === 'grid' ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', 
                    gap: 24 
                  }}>
                    {getSortedCourses().map((course) => {
                  const colors = getCourseColor(course.courses?.name, course.courses?.code)
                  return (
                    <motion.div
                      key={course.id}
                      whileHover={{ y: -4, borderColor: colors.border }}
                      style={{
                        background: '#F9FAFB',
                        borderRadius: 20,
                        padding: 24,
                        border: '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        position: 'relative'
                      }}
                      onClick={() => navigate(`/dashboard/courses/${course.course_id}`)}
                    >
                      {/* Dropdown Menu */}
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 2
                      }}>
                        <DropdownMenu 
                          type="course" 
                          item={course} 
                          isOpen={activeDropdown === `course-${course.id}`}
                          onToggle={handleDropdownToggle}
                        />
                      </div>

                      {/* Course Icon */}
                      <div style={{
                        width: 56, 
                        height: 56,
                        borderRadius: 16,
                        background: colors.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.icon
                      }}>
                        {getCourseIcon(course.courses?.name, course.courses?.code, course.courses || {})}
                      </div>

                      {/* Course Info */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: 16, 
                          fontWeight: 700, 
                          color: '#111', 
                          margin: '0 0 4px',
                          lineHeight: 1.3
                        }}>
                          {course.courses?.name || 'Unknown Course'}
                        </h3>
                        <p style={{ 
                          fontSize: 13, 
                          color: '#64748b', 
                          fontWeight: 500,
                          margin: 0
                        }}>
                          {course.courses?.code || '???'}
                        </p>
                      </div>
                      
                      {/* Open Button - Secondary Pill Style */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/dashboard/courses/${course.course_id}`)
                        }}
                        style={{
                          padding: '8px 16px',
                          background: 'white',
                          color: '#fb923c',
                          border: '1px solid #fed7aa',
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 0.2s',
                          width: 'fit-content'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = '#fb923c'
                          e.target.style.background = '#fb923c'
                          e.target.style.color = '#fff'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = '#fed7aa'
                          e.target.style.background = 'white'
                          e.target.style.color = '#fb923c'
                        }}
                      >
                        Open
                        <ChevronRight size={14} />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              /* List View */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                {getSortedCourses().map((course) => {
                  const colors = getCourseColor(course.courses?.name, course.courses?.code)
                  return (
                    <motion.div
                      key={course.id}
                      whileHover={{ x: 4, backgroundColor: '#F9FAFB' }}
                      style={{
                        background: 'white',
                        borderRadius: 12,
                        padding: '16px 20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        border: '1px solid #e5e7eb'
                      }}
                      onClick={() => navigate(`/dashboard/courses/${course.course_id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      {/* Course Icon */}
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: colors.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.icon,
                        fontSize: 20,
                        flexShrink: 0
                      }}>
                        {course.courses?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>

                      {/* Dropdown Menu */}
                      <DropdownMenu 
                        type="course" 
                        item={course} 
                        isOpen={activeDropdown === `course-${course.id}`}
                        onToggle={handleDropdownToggle}
                      />

                      {/* Course Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ 
                          fontSize: 16, 
                          fontWeight: 700, 
                          color: '#111', 
                          margin: '0 0 4px',
                          lineHeight: 1.3
                        }}>
                          {course.courses?.name || 'Untitled Course'}
                        </h3>
                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                          {course.courses?.code || 'N/A'}
                        </div>
                      </div>

                      {/* Progress */}
                      <div style={{ 
                        fontSize: 12, 
                        color: '#94a3b8', 
                        fontWeight: 400,
                        textAlign: 'right',
                        flexShrink: 0
                      }}>
                        {course.progress || 0}% complete
                      </div>

                      {/* Open Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/dashboard/courses/${course.course_id}`)
                        }}
                        style={{
                          background: 'white',
                          color: '#fb923c',
                          border: '1px solid #fed7aa',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          transition: 'all 0.2s',
                          padding: '6px 12px',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = '#fb923c'
                          e.target.style.background = '#fb923c'
                          e.target.style.color = '#fff'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = '#fed7aa'
                          e.target.style.background = 'white'
                          e.target.style.color = '#fb923c'
                        }}
                      >
                        Open
                        <ChevronRight size={12} />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
              </>
            )}

            {/* Enhanced Course Materials Section */}
            {materials.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1.5rem',
                  padding: '0 0.5rem'
                }}>
                  <h2 style={{ 
                    fontSize: 20, 
                    fontWeight: 700, 
                    color: '#111',
                    margin: 0
                  }}>
                    Course Materials
                  </h2>
                  
                  {/* Bulk Actions */}
                  {selectedMaterials.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#0369a1'
                    }}>
                      <span>{selectedMaterials.length} selected</span>
                      <button
                        onClick={handleSelectAll}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'white',
                          border: '1px solid #bae6fd',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {selectedMaterials.length === getFilteredAndSortedCourseMaterials().length ? 'Deselect All' : 'Select All'}
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#dc2626',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Enhanced Controls */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1.5rem',
                  padding: '0 0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={handleCoursesTypeFilter}
                      style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#64748b',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#8b5cf6'
                        e.currentTarget.style.color = '#8b5cf6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.color = '#64748b'
                      }}
                    >
                      <span>{coursesFilterType === 'all' ? 'Type' : coursesFilterType.toUpperCase()}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </button>

                    <button
                      onClick={handleCoursesCourseFilter}
                      style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#64748b',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#8b5cf6'
                        e.currentTarget.style.color = '#8b5cf6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.color = '#64748b'
                      }}
                    >
                      <span>
                        {coursesFilterCourse === 'all' 
                          ? 'Course' 
                          : courses.find(c => c.id === coursesFilterCourse)?.code || 'Course'
                        }
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={handleCoursesSortToggle}
                      style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#64748b',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#8b5cf6'
                        e.currentTarget.style.color = '#8b5cf6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.color = '#64748b'
                      }}
                    >
                      <span>
                        {coursesSortBy === 'updated' ? 'Last Updated' : 
                         coursesSortBy === 'type' ? 'Type' : 'Course'}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </button>

                    {/* View Toggle */}
                    <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 6, padding: 1 }}>
                      <button
                        onClick={() => handleCoursesViewToggle('grid')}
                        style={{
                          background: coursesViewMode === 'grid' ? '#8b5cf6' : 'none',
                          color: coursesViewMode === 'grid' ? 'white' : '#64748b',
                          border: 'none',
                          padding: '0.375rem',
                          borderRadius: 4,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                          <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                          <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                          <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleCoursesViewToggle('list')}
                        style={{
                          background: coursesViewMode === 'list' ? '#8b5cf6' : 'none',
                          color: coursesViewMode === 'list' ? 'white' : '#64748b',
                          border: 'none',
                          padding: '0.375rem',
                          borderRadius: 4,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (coursesViewMode !== 'list') {
                            e.currentTarget.style.color = '#8b5cf6'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (coursesViewMode !== 'list') {
                            e.currentTarget.style.color = '#64748b'
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 5h.01"></path>
                          <path d="M3 12h.01"></path>
                          <path d="M3 19h.01"></path>
                          <path d="M8 5h13"></path>
                          <path d="M8 12h13"></path>
                          <path d="M8 19h13"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Course Materials Grid/List View */}
                {coursesViewMode === 'grid' ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', 
                    gap: 16 
                  }}>
                    {getFilteredAndSortedCourseMaterials().map((material) => {
                      const pill = getMaterialTypeStyle(material.type)
                      const course = courses.find(c => c.id === material.course_id)
                      const isSelected = selectedMaterials.includes(material.id)
                      
                      return (
                        <motion.div
                          key={material.id}
                          whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
                          style={{
                            background: isSelected ? '#f0f9ff' : '#F9FAFB',
                            borderRadius: 16,
                            padding: 16,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                            position: 'relative'
                          }}
                          onClick={() => navigate(`/dashboard/workstation?materialId=${material.id}`)}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = '#8b5cf6'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'transparent'
                            }
                          }}
                        >
                          {/* Selection Checkbox */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              border: isSelected ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                              background: isSelected ? '#3b82f6' : 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 1
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMaterialSelect(material.id)
                            }}
                          >
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            )}
                          </div>

                          {/* Dropdown Menu */}
                          <div style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            zIndex: 1001
                          }}>
                            <DropdownMenu 
                              type="material" 
                              item={material} 
                              isOpen={activeDropdown === `material-${material.id}`}
                              onToggle={handleDropdownToggle}
                            />
                          </div>

                          {/* Course Badge */}
                          {course && (
                            <div style={{
                              alignSelf: 'flex-start',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: 10,
                              fontWeight: 600,
                              background: '#f3f4f6',
                              color: '#6b7280'
                            }}>
                              {course.courses?.code || 'Unknown'}
                            </div>
                          )}

                          {/* Type Pill */}
                          <div style={{
                            alignSelf: 'flex-start',
                            padding: '4px 10px',
                            borderRadius: 16,
                            fontSize: 10,
                            fontWeight: 600,
                            background: pill.bg,
                            color: pill.color
                          }}>
                            {pill.label}
                          </div>

                          {/* Icon */}
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20
                          }}>
                            {material.processing_status === 'pending' 
                              ? '⏳' 
                              : material.type === 'youtube' 
                                ? '▶️'
                                : '📄'}
                          </div>

                          {/* Material Info */}
                          <div style={{ flex: 1 }}>
                            <h3 style={{ 
                              fontSize: 13, 
                              fontWeight: 600, 
                              color: '#111', 
                              margin: '0 0 4px',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {material.title}
                            </h3>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>
                              {material.processing_status === 'pending' 
                                ? 'Processing...' 
                                : new Date(material.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  /* List View */
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    {getFilteredAndSortedCourseMaterials().map((material) => {
                      const pill = getMaterialTypeStyle(material.type)
                      const course = courses.find(c => c.id === material.course_id)
                      const isSelected = selectedMaterials.includes(material.id)
                      
                      return (
                        <motion.div
                          key={material.id}
                          whileHover={{ x: 2, backgroundColor: '#F9FAFB' }}
                          style={{
                            background: isSelected ? '#f0f9ff' : 'white',
                            borderRadius: 8,
                            padding: '12px 16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            border: isSelected ? '1px solid #3b82f6' : '1px solid #e5e7eb'
                          }}
                          onClick={() => navigate(`/dashboard/workstation?materialId=${material.id}`)}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = '#8b5cf6'
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.1)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = '#e5e7eb'
                              e.currentTarget.style.boxShadow = 'none'
                            }
                          }}
                        >
                          {/* Selection Checkbox */}
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 3,
                              border: isSelected ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                              background: isSelected ? '#3b82f6' : 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMaterialSelect(material.id)
                            }}
                          >
                            {isSelected && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            )}
                          </div>

                          {/* Dropdown Menu */}
                          <DropdownMenu 
                            type="material" 
                            item={material} 
                            isOpen={activeDropdown === `material-${material.id}`}
                            onToggle={handleDropdownToggle}
                          />

                          {/* Icon */}
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            flexShrink: 0
                          }}>
                            {material.processing_status === 'pending' 
                              ? '⏳' 
                              : material.type === 'youtube' 
                                ? '▶️'
                                : '📄'}
                          </div>

                          {/* Material Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ 
                              fontSize: 13, 
                              fontWeight: 600, 
                              color: '#111', 
                              margin: '0 0 2px',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {material.title}
                            </h3>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>
                              {material.processing_status === 'pending' 
                                ? 'Processing...' 
                                : new Date(material.created_at).toLocaleDateString()}
                              {course && ` • ${course.courses?.code}`}
                            </div>
                          </div>

                          {/* Course Badge */}
                          {course && (
                            <div style={{
                              padding: '2px 8px',
                              borderRadius: 10,
                              fontSize: 9,
                              fontWeight: 600,
                              background: '#f3f4f6',
                              color: '#6b7280',
                              flexShrink: 0
                            }}>
                              {course.courses?.code}
                            </div>
                          )}

                          {/* Type Pill */}
                          <div style={{
                            padding: '3px 8px',
                            borderRadius: 10,
                            fontSize: 9,
                            fontWeight: 600,
                            background: pill.bg,
                            color: pill.color,
                            flexShrink: 0
                          }}>
                            {pill.label}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'materials' && (
          <motion.div 
            key="materials" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Compact Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem',
              padding: '0 0.5rem'
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#111' }}>
                Files
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowUploadModal(true)}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: '0.625rem 1.25rem',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#a78bfa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8b5cf6'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                  Upload
                </button>
              </div>
            </div>

            {/* Compact Controls */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '2rem',
              padding: '0 0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={handleTypeFilter}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#64748b',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8b5cf6'
                    e.currentTarget.style.color = '#8b5cf6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.color = '#64748b'
                  }}
                >
                  <span>{filterType === 'all' ? 'Type' : filterType.toUpperCase()}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={handleSortToggle}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#64748b',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8b5cf6'
                    e.currentTarget.style.color = '#8b5cf6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.color = '#64748b'
                  }}
                >
                  <span>{sortBy === 'updated' ? 'Last Updated' : 'Type'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>

                {/* View Toggle */}
                <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 6, padding: 1 }}>
                  <button
                    onClick={() => handleViewToggle('grid')}
                    style={{
                      background: viewMode === 'grid' ? '#8b5cf6' : 'none',
                      color: viewMode === 'grid' ? 'white' : '#64748b',
                      border: 'none',
                      padding: '0.375rem',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                      <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                      <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                      <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleViewToggle('list')}
                    style={{
                      background: viewMode === 'list' ? '#8b5cf6' : 'none',
                      color: viewMode === 'list' ? 'white' : '#64748b',
                      border: 'none',
                      padding: '0.375rem',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== 'list') {
                        e.currentTarget.style.color = '#8b5cf6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== 'list') {
                        e.currentTarget.style.color = '#64748b'
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5h.01"></path>
                      <path d="M3 12h.01"></path>
                      <path d="M3 19h.01"></path>
                      <path d="M8 5h13"></path>
                      <path d="M8 12h13"></path>
                      <path d="M8 19h13"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1 }}>
              {filteredMaterials.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '400px',
                  textAlign: 'center',
                  gap: '1rem'
                }}>
                  <img 
                    alt="empty materials page" 
                    width="240" 
                    height="140" 
                    src="https://assets.knowt.com/images/empty-materials.svg" 
                    style={{ color: 'transparent', opacity: 0.8 }}
                  />
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 0.5rem', color: '#111' }}>
                      Create materials!
                    </p>
                    <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 1.5rem', maxWidth: '400px' }}>
                      Boost learning with practice tests, interactive study modes, and AI chat conversations.
                    </p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      style={{
                        background: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '0.75rem 1.5rem',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#a78bfa'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#8b5cf6'
                      }}
                    >
                      Create
                    </button>
                  </div>
                </div>
              ) : (
              <>
                {/* Materials Grid/List View */}
                {viewMode === 'grid' ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', 
                    gap: 24 
                  }}>
                    {getFilteredAndSortedMaterials().map((material) => {
                      const pill = getMaterialTypeStyle(material.type)
                      return (
                        <motion.div
                          key={material.id}
                          whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
                          style={{
                            background: '#F9FAFB',
                            borderRadius: 30,
                            padding: 24,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            border: '2px solid transparent',
                            position: 'relative'
                          }}
                          onClick={() => navigate(`/dashboard/workstation?materialId=${material.id}`)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#8b5cf6'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'transparent'
                          }}
                        >
                          {/* Dropdown Menu */}
                          <div style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 1001
                          }}>
                            <DropdownMenu 
                              type="material" 
                              item={material} 
                              isOpen={activeDropdown === `material-${material.id}`}
                              onToggle={handleDropdownToggle}
                            />
                          </div>

                          {/* Type Pill */}
                          <div style={{
                            alignSelf: 'flex-start',
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            background: pill.bg,
                            color: pill.color
                          }}>
                            {pill.label}
                          </div>

                          {/* Icon */}
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 24
                          }}>
                            {material.processing_status === 'pending' 
                              ? '⏳' 
                              : material.type === 'youtube' 
                                ? '▶️'
                                : '📄'}
                          </div>

                          {/* Material Info */}
                          <div>
                            <h3 style={{ 
                              fontSize: 15, 
                              fontWeight: 700, 
                              color: '#111', 
                              margin: '0 0 6px',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {material.title}
                            </h3>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                              {material.processing_status === 'pending' 
                                ? 'Processing...' 
                                : new Date(material.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  /* List View */
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    {getFilteredAndSortedMaterials().map((material) => {
                      const pill = getMaterialTypeStyle(material.type)
                      return (
                        <motion.div
                          key={material.id}
                          whileHover={{ x: 4, backgroundColor: '#F9FAFB' }}
                          style={{
                            background: 'white',
                            borderRadius: 12,
                            padding: '16px 20px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            border: '1px solid #e5e7eb'
                          }}
                          onClick={() => navigate(`/dashboard/workstation?materialId=${material.id}`)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#8b5cf6'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          {/* Icon */}
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            flexShrink: 0
                          }}>
                            {material.processing_status === 'pending' 
                              ? '⏳' 
                              : material.type === 'youtube' 
                                ? '▶️'
                                : '📄'}
                          </div>

                          {/* Dropdown Menu */}
                          <DropdownMenu 
                            type="material" 
                            item={material} 
                            isOpen={activeDropdown === `material-${material.id}`}
                            onToggle={handleDropdownToggle}
                          />

                          {/* Material Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ 
                              fontSize: 14, 
                              fontWeight: 600, 
                              color: '#111', 
                              margin: '0 0 4px',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {material.title}
                            </h3>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
                              {material.processing_status === 'pending' 
                                ? 'Processing...' 
                                : new Date(material.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Type Pill */}
                          <div style={{
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 600,
                            background: pill.bg,
                            color: pill.color,
                            flexShrink: 0
                          }}>
                            {pill.label}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
                
                {/* Add More Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/dashboard/upload')}
                  style={{
                    width: '100%',
                    padding: 20,
                    background: 'white',
                    border: '2px dashed #e2e8f0',
                    borderRadius: 16,
                    color: '#64748b',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    marginTop: 16,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#7a12cc'
                    e.target.style.color = '#7a12cc'
                    e.target.style.background = 'rgba(122, 18, 204, 0.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.color = '#64748b'
                    e.target.style.background = 'white'
                  }}
                >
                  <Plus size={20} />
                  Add More Materials
                </motion.button>
              </>
            )}
            
            <div style={{ paddingBottom: '4rem' }}></div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowUploadModal(false)
          }
        }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: 'white',
              borderRadius: 16,
              maxWidth: '900px',
              width: '95%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowUploadModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                padding: '0.5rem',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>

            {/* UserUpload Component */}
            <div style={{ padding: '2rem', paddingTop: '3rem' }}>
              <UserUpload />
            </div>
          </motion.div>
        </div>
      )}

      {/* Course Add Modal */}
      <CourseEnrollmentModal
        isOpen={showCourseAddModal}
        onClose={() => setShowCourseAddModal(false)}
        user={user}
        onCoursesAdded={handleCoursesAdded}
        existingCourses={courses.map(c => ({ code: c.courses?.code, name: c.courses?.name }))}
      />

      {/* Preview Modal */}
      {showPreviewModal && selectedMaterial && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowPreviewModal(false)
            setSelectedMaterial(null)
          }
        }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: 'white',
              borderRadius: 16,
              maxWidth: '700px',
              width: '95%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowPreviewModal(false)
                setSelectedMaterial(null)
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                padding: '0.5rem',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>

            {/* Preview Content */}
            <div style={{ padding: '2rem', paddingTop: '3rem' }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#111',
                marginBottom: '1rem',
                fontFamily: "'Outfit', sans-serif"
              }}>
                {selectedMaterial.title || 'Material Preview'}
              </h2>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                fontSize: 14,
                color: '#64748b'
              }}>
                <span>Type: {selectedMaterial.type}</span>
                <span>•</span>
                <span>Size: {selectedMaterial.file_size ? `${(selectedMaterial.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</span>
                <span>•</span>
                <span>Uploaded: {new Date(selectedMaterial.created_at).toLocaleDateString()}</span>
              </div>

              {/* Preview Area */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 12,
                padding: '2rem',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: '1rem' }}>
                    {selectedMaterial.type === 'pdf' ? '📄' : 
                     selectedMaterial.type === 'docx' ? '📝' :
                     selectedMaterial.type === 'image' ? '🖼️' :
                     selectedMaterial.type === 'video' ? '🎥' :
                     selectedMaterial.type === 'youtube' ? '▶️' : '📄'}
                  </div>
                  <p style={{ fontSize: 16, color: '#64748b', marginBottom: '1rem' }}>
                    {selectedMaterial.processing_status === 'pending' 
                      ? 'Material is being processed...' 
                      : 'Preview functionality coming soon'}
                  </p>
                  <button
                    onClick={() => {
                      setShowPreviewModal(false)
                      navigate(`/dashboard/workstation?materialId=${selectedMaterial.id}`)
                    }}
                    style={{
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#a78bfa'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#8b5cf6'
                    }}
                  >
                    Open in Workstation
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Move to Session Modal */}
      {showMoveToSessionModal && selectedMaterial && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowMoveToSessionModal(false)
            setSelectedMaterial(null)
          }
        }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: 'white',
              borderRadius: 16,
              maxWidth: '500px',
              width: '95%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowMoveToSessionModal(false)
                setSelectedMaterial(null)
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                padding: '0.5rem',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>

            {/* Move to Session Content */}
            <div style={{ padding: '2rem', paddingTop: '3rem' }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#111',
                marginBottom: '1rem',
                fontFamily: "'Outfit', sans-serif"
              }}>
                Move to Session
              </h2>
              
              <p style={{
                fontSize: 14,
                color: '#64748b',
                marginBottom: '2rem',
                lineHeight: 1.5
              }}>
                Select a session to move "{selectedMaterial.title || selectedMaterial.file_name}" to:
              </p>

              {/* Sessions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sessions.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    background: '#f8fafc',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0'
                  }}>
                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: '1rem' }}>
                      No sessions found
                    </p>
                    <button
                      onClick={() => {
                        setShowMoveToSessionModal(false)
                        navigate('/dashboard/sessions')
                      }}
                      style={{
                        background: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Create Session
                    </button>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={async () => {
                        try {
                          // Add material to session
                          const { error } = await supabase
                            .from('session_materials')
                            .insert({
                              session_id: session.id,
                              material_id: selectedMaterial.id
                            })
                          
                          if (error) throw error
                          
                          setShowMoveToSessionModal(false)
                          setSelectedMaterial(null)
                          // Show success message
                          alert('Material moved to session successfully!')
                        } catch (error) {
                          console.error('Failed to move material to session:', error)
                          alert('Failed to move material to session')
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#8b5cf6'
                        e.currentTarget.style.background = '#f0f9ff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 14,
                        fontWeight: 600
                      }}>
                        {session.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: '2px' }}>
                          {session.name || 'Untitled Session'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {session.material_count || 0} materials • {new Date(session.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && selectedMaterial && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowRenameModal(false)
            setSelectedMaterial(null)
            setNewMaterialName('')
          }
        }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: 'white',
              borderRadius: 16,
              maxWidth: '400px',
              width: '95%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowRenameModal(false)
                setSelectedMaterial(null)
                setNewMaterialName('')
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                padding: '0.5rem',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>

            {/* Rename Content */}
            <div style={{ padding: '2rem', paddingTop: '3rem' }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#111',
                marginBottom: '1rem',
                fontFamily: "'Outfit', sans-serif"
              }}>
                Rename Material
              </h2>
              
              <p style={{
                fontSize: 14,
                color: '#64748b',
                marginBottom: '1.5rem',
                lineHeight: 1.5
              }}>
                Enter a new name for "{selectedMaterial.title || selectedMaterial.file_name}":
              </p>

              {/* Input Field */}
              <input
                type="text"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                placeholder="Enter new name"
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  marginBottom: '1.5rem',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSubmit()
                  } else if (e.key === 'Escape') {
                    setShowRenameModal(false)
                    setSelectedMaterial(null)
                    setNewMaterialName('')
                  }
                }}
              />

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRenameModal(false)
                    setSelectedMaterial(null)
                    setNewMaterialName('')
                  }}
                  style={{
                    background: 'white',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameSubmit}
                  disabled={!newMaterialName.trim()}
                  style={{
                    background: newMaterialName.trim() ? '#8b5cf6' : '#e2e8f0',
                    color: newMaterialName.trim() ? 'white' : '#94a3b8',
                    border: 'none',
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: newMaterialName.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (newMaterialName.trim()) {
                      e.currentTarget.style.background = '#a78bfa'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = newMaterialName.trim() ? '#8b5cf6' : '#e2e8f0'
                  }}
                >
                  Rename
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manage Sharing Modal */}
      {showManageSharingModal && selectedMaterial && shareData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowManageSharingModal(false)
            setShareData(null)
            setShareAnalytics(null)
          }
        }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: 'white',
              borderRadius: 16,
              maxWidth: '600px',
              width: '95%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowManageSharingModal(false)
                setShareData(null)
                setShareAnalytics(null)
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                padding: '0.5rem',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>

            {/* Sharing Content */}
            <div style={{ padding: '2rem', paddingTop: '3rem' }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#111',
                marginBottom: '1rem',
                fontFamily: "'Outfit', sans-serif"
              }}>
                Manage Sharing
              </h2>
              
              <p style={{
                fontSize: 14,
                color: '#64748b',
                marginBottom: '1.5rem',
                lineHeight: 1.5
              }}>
                Manage sharing settings for "{selectedMaterial.title || selectedMaterial.file_name}"
              </p>

              {/* Share Link */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <label style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}>
                  Share Link
                </label>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={shareData.shareUrl}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 13,
                      background: 'white'
                    }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareData.shareUrl)
                      alert('Share link copied to clipboard!')
                    }}
                    style={{
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#a78bfa'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#8b5cf6'
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Sharing Settings */}
              <div style={{
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#111',
                  marginBottom: '1rem'
                }}>
                  Sharing Settings
                </h3>

                {/* Public Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#111',
                      marginBottom: '0.25rem'
                    }}>
                      Public Sharing
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: '#64748b'
                    }}>
                      Anyone with the link can view this material
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateShareSettings({ is_public: !shareData.isPublic })}
                    style={{
                      background: shareData.isPublic ? '#8b5cf6' : '#e2e8f0',
                      color: shareData.isPublic ? 'white' : '#64748b',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {shareData.isPublic ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Expiration */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#111',
                      marginBottom: '0.25rem'
                    }}>
                      Link Expiration
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: '#64748b'
                    }}>
                      {shareData.expiresAt ? `Expires ${new Date(shareData.expiresAt).toLocaleDateString()}` : 'Never expires'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newDate = shareData.expiresAt ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                      handleUpdateShareSettings({ expires_at: newDate })
                    }}
                    style={{
                      background: '#e2e8f0',
                      color: '#64748b',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {shareData.expiresAt ? 'Remove Expiration' : 'Set 30 Days'}
                  </button>
                </div>
              </div>

              {/* Analytics */}
              {shareAnalytics && (
                <div style={{
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#111',
                    marginBottom: '1rem'
                  }}>
                    Analytics
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem'
                  }}>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#8b5cf6',
                        marginBottom: '0.25rem'
                      }}>
                        {shareAnalytics.analytics.totalViews}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#64748b'
                      }}>
                        Total Views
                      </div>
                    </div>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#10b981',
                        marginBottom: '0.25rem'
                      }}>
                        {shareAnalytics.analytics.totalDownloads}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#64748b'
                      }}>
                        Downloads
                      </div>
                    </div>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#f59e0b',
                        marginBottom: '0.25rem'
                      }}>
                        {shareAnalytics.analytics.totalSignups}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#64748b'
                      }}>
                        New Users
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleDeleteShare}
                  style={{
                    background: '#fef2f2',
                    color: '#ef4444',
                    border: '1px solid #fecaca',
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fef2f2'
                  }}
                >
                  Delete Share
                </button>
                <button
                  onClick={() => {
                    setShowManageSharingModal(false)
                    setShareData(null)
                    setShareAnalytics(null)
                  }}
                  style={{
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    padding: '0.625rem 1.25rem',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#a78bfa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#8b5cf6'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  )
}
