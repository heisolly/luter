import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { 
  Plus, Book, Layers, Archive, Search, Filter, 
  MoreVertical, BookOpen, Clock, Target, ChevronRight, 
  Hash, Star, Briefcase, Sparkles, Trash2, 
  Settings, Info, GraduationCap, Zap, CheckCircle2,
  X, Loader2, ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { courseService } from '../../services/courseService'
import { getOnboardingCourseSuggestions, getEnhancedCourseSearch } from '../../services/courseSuggestionService'
import PremiumModal from '../shared/PremiumModal'

export default function CoursesPage() {
  const { user, isMobile } = useOutletContext()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('backpack') // 'backpack', 'discover', 'vault'
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [enrollingId, setEnrollingId] = useState(null)
  
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
              <div style={{ padding: '6px 12px', background: 'rgba(122, 18, 204, 0.08)', borderRadius: 10, color: '#7a12cc', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                ACADEMIC INVENTORY
              </div>
            </motion.div>
            <h1 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 900, color: '#111', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
              Your <span style={{ color: '#7a12cc' }}>Backpack</span>
            </h1>
            <p style={{ color: '#64748b', marginTop: 12, fontSize: 16, fontWeight: 500 }}>
              Manage your courses, track mastery, and discover new learning paths.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => setActiveTab(activeTab === 'discover' ? 'backpack' : 'discover')}
              style={{ 
                padding: '12px 24px', borderRadius: 16, 
                background: activeTab === 'discover' ? '#111' : 'white', 
                color: activeTab === 'discover' ? 'white' : '#111',
                fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
                border: '1.5px solid #eee', transition: 'all 0.2s',
                boxShadow: activeTab === 'discover' ? '0 10px 20px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {activeTab === 'discover' ? <BackpackIcon size={18} /> : <Search size={18} />}
              {activeTab === 'discover' ? 'View Backpack' : 'Discover'}
            </button>
            <button 
              onClick={() => setShowPremiumModal(true)}
              style={{ 
                padding: '12px 24px', borderRadius: 16, background: '#7a12cc', color: 'white',
                fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 20px -6px rgba(122, 18, 204, 0.4)', transition: 'all 0.2s',
                border: 'none'
              }}
            >
              <Plus size={18} strokeWidth={3} /> Add New
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
                fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
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
        {activeTab === 'backpack' && (
          <motion.div 
            key="backpack" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* Search Bar for Backpack */}
            {courses.length > 0 && (
              <div style={{ position: 'relative', maxWidth: 400 }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" placeholder="Search your backpack..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    padding: '14px 16px 14px 44px', borderRadius: 16, border: '1.5px solid #eee',
                    fontSize: 14, fontWeight: 500, width: '100%', background: 'white',
                    outline: 'none', transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7a12cc'}
                  onBlur={(e) => e.target.style.borderColor = '#eee'}
                />
              </div>
            )}

            {loading ? (
              <div style={{ padding: 100, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <Loader2 size={40} className="animate-spin" color="#7a12cc" />
                <p style={{ color: '#64748b', fontWeight: 600 }}>Scanning inventory...</p>
              </div>
            ) : filteredBackpack.length === 0 ? (
              <div style={{ padding: '80px 40px', textAlign: 'center', background: '#f8fafc', borderRadius: 32, border: '2px dashed #e2e8f0' }}>
                <div style={{ width: 80, height: 80, background: 'white', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                  <Archive size={40} color="#cbd5e1" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 8 }}>Your backpack is empty</h3>
                <p style={{ fontSize: 15, color: '#64748b', maxWidth: 360, margin: '0 auto 24px' }}>
                  You haven't added any courses yet. Start your academic journey by discovering new courses.
                </p>
                <button 
                  onClick={() => setActiveTab('discover')}
                  style={{ padding: '14px 32px', borderRadius: 16, background: '#111', color: 'white', fontWeight: 800, fontSize: 14 }}
                >
                  Go to Discovery
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {filteredBackpack.map((uc) => (
                  <CourseCard 
                    key={uc.id} 
                    uc={uc} 
                    onNavigate={() => navigate(`/dashboard/courses/${uc.course_id}`)}
                    onRemove={() => handleUnenroll(uc.course_id)}
                  />
                ))}
              </div>
            )}
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
