import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { 
  RiAddLine as Plus, RiBookFill as Book, RiStackFill as Layers, RiArchiveFill as Archive, RiSearchLine as Search, RiFilterFill as Filter, 
  RiMore2Fill as MoreVertical, RiBookOpenFill as BookOpen, RiTimeFill as Clock, RiFocusFill as Target, RiArrowRightSLine as ChevronRight, 
  RiHashtag as Hash, RiStarFill as Star, RiBriefcaseFill as Briefcase, RiMagicFill as Sparkles, RiDeleteBin6Fill as Trash2, 
  RiSettings4Fill as Settings, RiInformationFill as Info, RiGraduationCapFill as GraduationCap, RiFlashlightFill as Zap, RiCheckboxCircleFill as CheckCircle2,
  RiCloseLine as X, RiLoader4Line as Loader2, RiArrowRightLine as ArrowRight, RiBriefcaseFill as Backpack, RiFolderAddFill as FolderPlus,
  RiTeamFill as Users, RiCalendarFill as Calendar, RiFileTextFill as FileText, RiTeamFill as Users2, RiUserAddFill as UserPlus,
  RiUploadFill as Upload
} from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlass, Plus as PlusLight, Sparkle as SparkleLight, UploadSimple, FileText as FileTextLight } from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import { courseService } from '../../services/courseService'
import { getOnboardingCourseSuggestions, getEnhancedCourseSearch } from '../../services/courseSuggestionService'
import { useUniversalWorkspaceStore } from '../../store/useUniversalWorkspaceStore'
import { useDeckStore } from '../../store/useDeckStore'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import PremiumModal from '../shared/PremiumModal'

export default function CoursesPage() {
  const { user, isMobile } = useOutletContext()
  const navigate = useNavigate()
  const { bundle } = useDashboardPrefetch()
  
  // Universal workspace store
  const {
    educationLevel,
    userRole,
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    decks,
    loadDecks,
    addContentToWorkspace,
    activeBackpackTab,
    setActiveBackpackTab,
    joinClassroom,
    createClassroom
  } = useUniversalWorkspaceStore()
  
  // Deck store
  const { addToDeck } = useDeckStore()
  const profile = bundle?.profile?.data || bundle?.profile
  const isSoloLearner = profile?.is_university_user === false || profile?.role === 'solo_learner'
  const standaloneMaterials = useMemo(() => {
    const rows = bundle?.materials?.data || []
    return rows.filter((item) => !item.course_id)
  }, [bundle])
  
  const [activeTab, setActiveTab] = useState(activeBackpackTab || 'workspaces') // 'workspaces' | 'decks' | 'discover'
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [enrollingId, setEnrollingId] = useState(null)
  const [classCodeInput, setClassCodeInput] = useState('')
  
  // Sync tab state with universal store
  useEffect(() => {
    setActiveBackpackTab(activeTab)
  }, [activeTab, setActiveBackpackTab])
  
  // Discovery State
  const [suggestions, setSuggestions] = useState(null)
  const [discoverySearch, setDiscoverySearch] = useState('')
  const [discoveryResults, setDiscoveryResults] = useState([])
  const [discoveryLoading, setDiscoveryLoading] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchCourses()
      loadDiscoveryData()
    }
  }, [user?.id])

  // Search logic for discovery
  useEffect(() => {
    if (!discoverySearch.trim()) {
      setDiscoveryResults([])
      return
    }
    const timer = setTimeout(() => {
      performDiscoverySearch(discoverySearch)
    }, 400)
    return () => clearTimeout(timer)
  }, [discoverySearch])

  const fetchCourses = async () => {
    setLoading(true)
    const { data, error } = await courseService.fetchUserCourses(user.id)
    if (!error) setCourses(data || [])
    setLoading(false)
  }

  const loadDiscoveryData = async () => {
    // We could fetch profile data to get uni/dept, but for now we'll use defaults or general
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const data = await getOnboardingCourseSuggestions(
        profile?.university || 'General',
        profile?.faculty || 'General',
        profile?.level || '100',
        profile?.semester || '1st'
      )
      setSuggestions(data)
    } catch (err) {
      console.error('Discovery load failed:', err)
    }
  }

  const performDiscoverySearch = async (query) => {
    setDiscoveryLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const results = await getEnhancedCourseSearch(
        query,
        profile?.university || 'General',
        profile?.faculty || 'General',
        profile?.level || '100',
        profile?.semester || '1st'
      )
      setDiscoveryResults(results)
    } catch (err) {
      console.error('Discovery search failed:', err)
    } finally {
      setDiscoveryLoading(false)
    }
  }

  const handleEnroll = async (course) => {
    setEnrollingId(course.code)
    const { data, error } = await courseService.enrollCourse(user.id, {
      code: course.code,
      name: course.name,
      faculty: course.faculty || 'General'
    })
    
    if (!error) {
      setCourses(prev => [data, ...prev])
      // Show success toast or something?
    }
    setEnrollingId(null)
  }

  const handleUnenroll = async (courseId) => {
    if (!confirm('Are you sure you want to remove this course from your backpack?')) return
    const { error } = await courseService.unenrollCourse(user.id, courseId)
    if (!error) {
      setCourses(prev => prev.filter(c => c.course_id !== courseId))
    }
  }

  const filteredBackpack = courses.filter(c => 
    c.courses?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.courses?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isSoloLearner) {
    const filteredMaterials = standaloneMaterials.filter((material) =>
      (material.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.type || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
      <SoloLearnerBackpack
        isMobile={isMobile}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        materials={filteredMaterials}
        totalMaterials={standaloneMaterials.length}
        onUpload={() => navigate('/dashboard/upload')}
        onOpenMaterial={(material) => navigate(`/dashboard/workstation?materialId=${material.id}`)}
        onAddToDeck={(material) => {
          addToDeck({
            content_id: material.id,
            content_type: material.type || 'material',
            name: material.title,
            metadata: {
              source_url: material.source_url,
              processing_status: material.processing_status
            }
          })
        }}
      />
    )
  }

  return (
    <div className="backpack-system" style={{ 
      padding: isMobile ? '20px 16px' : '40px', 
      maxWidth: 1400, 
      margin: '0 auto', 
      minHeight: '100vh',
      fontFamily: "'Outfit', sans-serif",
      color: '#111'
    }}>
      
      {/* ── HEADER ── */}
      <header style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}
            >
              <div style={{ padding: '6px 12px', background: 'rgba(122, 18, 204, 0.07)', borderRadius: 10, color: '#7a12cc', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                UNIVERSAL BACKPACK
              </div>
              {educationLevel && (
                <div style={{ padding: '4px 8px', background: '#f0f9ff', borderRadius: 8, color: '#0369a1', fontSize: 10, fontWeight: 700 }}>
                  {educationLevel}
                </div>
              )}
              {userRole && (
                <div style={{ padding: '4px 8px', background: '#f0fdf4', borderRadius: 8, color: '#16a34a', fontSize: 10, fontWeight: 700 }}>
                  {userRole}
                </div>
              )}
            </motion.div>
            <h1 style={{ fontSize: isMobile ? 32 : 44, fontWeight: 800, color: '#111', letterSpacing: '-0.035em', margin: 0, lineHeight: 1 }}>
              My <span style={{ color: '#7a12cc' }}>Backpack</span>
            </h1>
            <p style={{ color: '#64748b', marginTop: 12, fontSize: 16, fontWeight: 500 }}>
              Organize your workspaces and study sets across all education levels.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {/* ── UNIVERSAL SEGMENTED CONTROL ── */}
            <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 16, padding: 4, gap: 4, border: '1px solid #eef2f7' }}>
              {['workspaces', 'decks', 'discover'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: 'none',
                    background: activeTab === tab ? 'white' : 'transparent',
                    color: activeTab === tab ? '#111' : '#64748b',
                    fontSize: 13,
                    fontWeight: activeTab === tab ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  {tab === 'workspaces' && <Layers size={14} />}
                  {tab === 'decks' && <FolderPlus size={14} />}
                  {tab === 'discover' && <Search size={14} />}
                  {tab === 'workspaces' && 'Workspaces'}
                  {tab === 'decks' && 'Decks'}
                  {tab === 'discover' && 'Discover'}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowPremiumModal(true)}
              style={{ 
                padding: '12px 22px', borderRadius: 16, background: '#7a12cc', color: 'white',
                fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 20px -10px rgba(122, 18, 204, 0.35)', transition: 'all 0.2s',
                border: 'none'
              }}
            >
              <PlusLight size={18} weight="light" /> Add New
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 32, borderBottom: '1.5px solid #f1f5f9' }}>
          {[
            { id: 'backpack', label: 'Backpack', count: courses.length },
            { id: 'discover', label: 'Discover', icon: Sparkles },
            { id: 'vault', label: 'The Vault', icon: Briefcase }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                color: activeTab === tab.id ? '#7a12cc' : '#94a3b8',
                background: 'none', border: 'none', padding: '16px 4px', cursor: 'pointer',
                position: 'relative', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {tab.icon && <tab.icon size={14} />}
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ 
                  fontSize: 10, padding: '2px 6px', borderRadius: 6, 
                  background: activeTab === tab.id ? 'rgba(122, 18, 204, 0.1)' : '#f1f5f9',
                  color: activeTab === tab.id ? '#7a12cc' : '#64748b'
                }}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  style={{ position: 'absolute', bottom: -1.5, left: 0, right: 0, height: 3, background: '#7a12cc', borderRadius: 99 }}
                />
              )}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* WORKSPACES TAB */}
        {activeTab === 'workspaces' && (
          <motion.div 
            key="workspaces" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {userRole !== 'teacher' && (
                <button 
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.multiple = true
                    input.onchange = (e) => {
                      // Handle file upload to personal workspace
                      console.log('Upload to personal workspace')
                    }
                    input.click()
                  }}
                  style={{ 
                    padding: '10px 20px', borderRadius: 12, background: 'white', 
                    border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer'
                  }}
                >
                  <Upload size={16} /> Upload to Personal Vault
                </button>
              )}
              
              {userRole === 'teacher' && (
                <button 
                  onClick={() => setShowPremiumModal(true)}
                  style={{ 
                    padding: '10px 20px', borderRadius: 12, background: '#dcfce7', 
                    border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 14, fontWeight: 600, color: '#166534', cursor: 'pointer'
                  }}
                >
                  <Users size={16} /> Upload for Students
                </button>
              )}
              
              <button 
                onClick={() => {
                  const code = prompt('Enter class code:')
                  if (code) {
                    joinClassroom(code)
                  }
                }}
                style={{ 
                  padding: '10px 20px', borderRadius: 12, background: '#fef3c7', 
                  border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 14, fontWeight: 600, color: '#92400e', cursor: 'pointer'
                }}
              >
                <UserPlus size={16} /> Join Class
              </button>
            </div>

            {/* Adaptive Workspace Structure */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {workspaces.map((workspace) => (
                <motion.div
                  key={workspace.id}
                  whileHover={{ y: -4 }}
                  onClick={() => setActiveWorkspace(workspace)}
                  style={{
                    background: 'white',
                    borderRadius: 20,
                    padding: 24,
                    border: '2px solid',
                    borderColor: activeWorkspace?.id === workspace.id ? '#7a12cc' : '#f1f5f9',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: workspace.id === 'personal' ? '#f0f9ff' : '#fef3c7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24
                    }}>
                      {workspace.id === 'personal' ? '🎒' : '📚'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>
                        {workspace.title}
                      </h3>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                        {workspace.type} • {workspace.educationLevel}
                      </p>
                    </div>
                  </div>
                  
                  {/* Adaptive Structure Display */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {workspace.structure?.slice(0, 4).map((item, index) => (
                      <div key={index} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', background: '#f8fafc', borderRadius: 8
                      }}>
                        <span style={{ fontSize: 16 }}>{item.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                    {workspace.structure?.length > 4 && (
                      <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', paddingTop: 4 }}>
                        +{workspace.structure.length - 4} more
                      </p>
                    )}
                  </div>
                  
                  {/* Add to Deck Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Add workspace content to deck
                      addToDeck({
                        content_id: `workspace-${workspace.id}`,
                        content_type: 'workspace',
                        metadata: {
                          title: workspace.title,
                          type: workspace.type,
                          education_level: workspace.educationLevel
                        }
                      })
                    }}
                    style={{
                      marginTop: 16, width: '100%', padding: '8px 16px',
                      borderRadius: 8, background: '#7a12cc', color: 'white',
                      border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    + Add to Deck
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* DECKS TAB */}
        {activeTab === 'decks' && (
          <motion.div 
            key="decks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>
                My Study Sets
              </h2>
              <button
                onClick={() => setShowPremiumModal(true)}
                style={{
                  padding: '10px 20px', borderRadius: 12, background: '#7a12cc', color: 'white',
                  border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Create New Deck
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {decks.map((deck) => (
                <motion.div
                  key={deck.id}
                  whileHover={{ y: -4 }}
                  style={{
                    background: 'white',
                    borderRadius: 20,
                    padding: 24,
                    border: '2px solid #f1f5f9',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: deck.deck_type === 'smart_start' ? '#dcfce7' : '#f0f9ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24
                    }}>
                      {deck.deck_type === 'smart_start' ? '✨' : '📚'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>
                        {deck.title}
                      </h3>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                        {deck.deck_type === 'smart_start' ? 'Smart Start' : 'Custom Deck'}
                      </p>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.5, marginBottom: 16 }}>
                    {deck.description}
                  </p>
                  
                  <button
                    style={{
                      width: '100%', padding: '10px 16px',
                      borderRadius: 8, background: '#f0f9ff', color: '#0369a1',
                      border: '1px solid #bae6fd', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Open Deck
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'discover' && (
          <motion.div 
            key="discover" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
          >
            {/* Discovery Search */}
            <div style={{ 
              background: 'linear-gradient(135deg, #7a12cc, #9718fb)', 
              borderRadius: 32, padding: isMobile ? 32 : 60,
              color: 'white', position: 'relative', overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(122, 18, 204, 0.2)'
            }}>
              <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(60px)' }} />
              <div style={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
                <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em' }}>Find your next challenge.</h2>
                <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 32, fontWeight: 500 }}>Search the global Luter registry or explore AI-powered recommendations tailored to your major.</p>
                
                <div style={{ position: 'relative' }}>
                  <Search size={22} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#7a12cc' }} />
                  <input 
                    type="text" 
                    value={discoverySearch}
                    onChange={(e) => setDiscoverySearch(e.target.value.toUpperCase())}
                    placeholder="Search courses (e.g. CSC 301)..." 
                    style={{ 
                      width: '100%', padding: '20px 24px 20px 60px', borderRadius: 20, 
                      border: 'none', background: 'white', fontSize: 16, fontWeight: 700,
                      outline: 'none', color: '#111', boxShadow: '0 15px 30px rgba(0,0,0,0.1)'
                    }}
                  />
                  {discoveryLoading && (
                    <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)' }}>
                      <Loader2 size={20} className="animate-spin" color="#7a12cc" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results / Suggestions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {discoverySearch ? (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>Search Results</h3>
                  {discoveryResults.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                      {discoveryResults.map(course => (
                        <DiscoveryCard 
                          key={course.code} 
                          course={course} 
                          isEnrolled={courses.some(c => c.courses?.code === course.code)}
                          onEnroll={() => handleEnroll(course)}
                          isLoading={enrollingId === course.code}
                        />
                      ))}
                    </div>
                  ) : !discoveryLoading && (
                    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                      <Search size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
                      <p>No courses found for "{discoverySearch}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {suggestions?.categories?.highlyRecommended?.length > 0 && (
                    <DiscoverySection title="Recommended for you" icon={<Sparkles size={18} color="#7a12cc" />}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {suggestions.categories.highlyRecommended.map(course => (
                          <DiscoveryCard 
                            key={course.code} 
                            course={course} 
                            isEnrolled={courses.some(c => c.courses?.code === course.code)}
                            onEnroll={() => handleEnroll(course)}
                            isLoading={enrollingId === course.code}
                          />
                        ))}
                      </div>
                    </DiscoverySection>
                  )}
                  
                  {suggestions?.categories?.trending?.length > 0 && (
                    <DiscoverySection title="Trending in your Uni" icon={<Zap size={18} color="#f59e0b" />}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {suggestions.categories.trending.map(course => (
                          <DiscoveryCard 
                            key={course.code} 
                            course={course} 
                            isEnrolled={courses.some(c => c.courses?.code === course.code)}
                            onEnroll={() => handleEnroll(course)}
                            isLoading={enrollingId === course.code}
                          />
                        ))}
                      </div>
                    </DiscoverySection>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'vault' && (
           <motion.div 
             key="vault" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
             style={{ padding: isMobile ? '40px 20px' : '80px', textAlign: 'center', background: '#fcfaff', borderRadius: 32, border: '2px dashed #e9e2ff' }}
           >
             <div style={{ width: 80, height: 80, background: 'white', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(122, 18, 204, 0.05)' }}>
               <Briefcase size={40} color="#7a12cc" style={{ opacity: 0.6 }} />
             </div>
             <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111', marginBottom: 12 }}>The Vault</h2>
             <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, margin: '0 auto 32px', fontWeight: 500 }}>
               Store independent research, external PDFs, and YouTube insights that don't belong to a specific course.
             </p>
             <button 
                onClick={() => navigate('/dashboard/upload')} 
                style={{ padding: '16px 32px', borderRadius: 16, background: '#111', color: 'white', fontWeight: 800, fontSize: 14, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
             >
               Initialize Upload
             </button>
           </motion.div>
        )}
      </AnimatePresence>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  )
}

function SoloLearnerBackpack({
  isMobile,
  searchQuery,
  setSearchQuery,
  materials,
  totalMaterials,
  onUpload,
  onOpenMaterial,
  onAddToDeck
}) {
  return (
    <div
      className="backpack-system"
      style={{
        padding: isMobile ? '20px 16px' : '40px',
        maxWidth: 1400,
        margin: '0 auto',
        minHeight: '100vh',
        fontFamily: "'Outfit', sans-serif",
        color: '#111'
      }}
    >
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F5F3FF', color: '#6D28D9', borderRadius: 12, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              Solo Backpack
            </div>
            <h1 style={{ fontSize: isMobile ? 30 : 42, fontWeight: 800, color: '#111', letterSpacing: '-0.035em', margin: 0 }}>
              Your Study Materials
            </h1>
            <p style={{ color: '#64748b', marginTop: 12, fontSize: 16, fontWeight: 500, maxWidth: 620 }}>
              Every document, audio file, and study link you upload lives here and feeds your personal dashboard flow.
            </p>
          </div>

          <button
            onClick={onUpload}
            style={{
              padding: '12px 22px',
              borderRadius: 16,
              background: '#111',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <UploadSimple size={18} weight="light" />
            Upload Document
          </button>
        </div>

        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '6px 10px', background: '#F8FAFC', borderRadius: 10, color: '#475569', fontSize: 12, fontWeight: 700 }}>
              {totalMaterials} {totalMaterials === 1 ? 'material' : 'materials'}
            </div>
          </div>

          <div style={{ position: 'relative', minWidth: isMobile ? '100%' : 320 }}>
            <MagnifyingGlass size={18} weight="light" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your uploads..."
              style={{
                width: '100%',
                padding: '14px 16px 14px 46px',
                borderRadius: 14,
                border: '1.5px solid #E2E8F0',
                background: 'white',
                fontSize: 14,
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>
        </div>
      </header>

      {materials.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 28, border: '1.5px solid #EEF2F7', padding: isMobile ? 32 : 56, textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: 24, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#6D28D9' }}>
            <FileTextLight size={34} weight="light" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 10 }}>Upload your first study material</h2>
          <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500, maxWidth: 460, margin: '0 auto 28px', lineHeight: 1.7 }}>
            Your dashboard is ready. Bring in a document, audio, or link and Luter will turn it into a personal study workspace.
          </p>
          <button
            onClick={onUpload}
            style={{
              padding: '14px 22px',
              borderRadius: 16,
              background: '#A855F7',
              color: 'white',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Upload a document
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
          {materials.map((material, index) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -4 }}
              style={{
                background: 'white',
                borderRadius: 22,
                border: '1.5px solid #EEF2F7',
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>
                  {renderMaterialIcon(material.type)}
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 999, background: material.processing_status === 'pending' ? '#FEF3C7' : '#ECFDF5', color: material.processing_status === 'pending' ? '#B45309' : '#047857', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {material.processing_status === 'pending' ? 'Processing' : 'Ready'}
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: '#111', lineHeight: 1.35 }}>
                  {material.title || 'Untitled material'}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>
                  {formatMaterialType(material.type)} {material.created_at ? `• ${new Date(material.created_at).toLocaleDateString()}` : ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                <button
                  onClick={() => onOpenMaterial(material)}
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 14,
                    border: 'none',
                    background: '#111',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Open
                </button>
                <button
                  onClick={() => onAddToDeck(material)}
                  style={{
                    height: 46,
                    padding: '0 16px',
                    borderRadius: 14,
                    border: '1.5px solid #E2E8F0',
                    background: 'white',
                    color: '#111',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Add to deck
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function CourseCard({ uc, onNavigate, onRemove }) {
  const c = uc.courses
  const progress = uc.progress || 0
  
  const colors = [
    { bg: '#f0f9ff', text: '#0369a1', accent: '#0ea5e9' },
    { bg: '#fdf2f8', text: '#be185d', accent: '#ec4899' },
    { bg: '#f0fdf4', text: '#15803d', accent: '#22c55e' },
    { bg: '#fffbeb', text: '#b45309', accent: '#f59e0b' },
    { bg: '#f5f3ff', text: '#6d28d9', accent: '#8b5cf6' }
  ]
  const color = colors[c?.code?.charCodeAt(0) % colors.length] || colors[0]

  return (
    <motion.div 
      whileHover={{ y: -6, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)' }}
      style={{ 
        background: 'white', 
        borderRadius: 24, 
        padding: 24,
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        boxShadow: '0 4px 15px -5px rgba(0,0,0,0.03)',
        border: '1.5px solid #f1f1f1',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onNavigate}
    >
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: color.bg, borderRadius: '50%', opacity: 0.5 }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative' }}>
        <div style={{ 
          padding: '8px 12px', background: color.bg, borderRadius: 12, 
          color: color.text, fontSize: 13, fontWeight: 900, letterSpacing: '0.05em' 
        }}>
          {c?.code}
        </div>
        <div onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ color: '#cbd5e1', padding: 4 }}>
          <Trash2 size={16} />
        </div>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0', lineHeight: 1.3 }}>{c?.name}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <GraduationCap size={14} color="#94a3b8" />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{uc.semester} Semester</span>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mastery</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: color.text }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            style={{ height: '100%', background: color.accent, borderRadius: 99 }} 
          />
        </div>
      </div>

      <div style={{ 
        marginTop: 20, paddingTop: 16, borderTop: '1px solid #f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} color="#94a3b8" />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            {uc.last_studied_at ? 'Active' : 'Not started'}
          </span>
        </div>
        <ArrowRight size={16} color="#cbd5e1" />
      </div>
    </motion.div>
  )
}

function DiscoveryCard({ course, isEnrolled, onEnroll, isLoading }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      style={{ 
        background: 'white', border: '1.5px solid #f1f5f9', borderRadius: 20, 
        padding: 20, display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
      }}
    >
      <div style={{ 
        width: 50, height: 50, borderRadius: 14, background: '#f8fafc', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#7a12cc', fontWeight: 900, fontSize: 12, border: '1px solid #f1f5f9'
      }}>
        {course.code.substring(0, 3)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#111' }}>{course.code}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.name}</div>
      </div>
      {isEnrolled ? (
        <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 900 }}>
          <CheckCircle2 size={16} /> ADDED
        </div>
      ) : (
        <button 
          onClick={onEnroll}
          disabled={isLoading}
          style={{ 
            padding: '8px 12px', borderRadius: 10, background: 'rgba(122, 18, 204, 0.08)', 
            color: '#7a12cc', border: 'none', fontSize: 11, fontWeight: 900, 
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          ADD
        </button>
      )}
    </motion.div>
  )
}

function DiscoverySection({ title, icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function renderMaterialIcon(type) {
  switch (type) {
    case 'audio':
      return <BookOpen size={22} />
    case 'youtube':
    case 'video':
      return <SparkleLight size={22} weight="light" />
    default:
      return <FileTextLight size={22} weight="light" />
  }
}

function formatMaterialType(type) {
  if (!type) return 'Document'
  if (type === 'youtube') return 'YouTube lesson'
  if (type === 'pptx') return 'Presentation'
  if (type === 'docx') return 'Document'
  return type
}

function BackpackIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M4 13h16" />
      <path d="M12 13v5" />
    </svg>
  )
}
