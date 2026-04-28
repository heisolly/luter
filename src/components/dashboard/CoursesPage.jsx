import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { 
  RiBookFill as Book, RiStackFill as Layers, RiArrowRightSLine as ChevronRight,
  RiLoader4Line as Loader2, RiBriefcaseFill as Backpack, RiAddLine as Plus,
  RiSearchLine as Search, RiFileTextFill as FileText
} from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { courseService } from '../../services/courseService'
import { fetchUserStandaloneMaterials } from '../../services/materialsService'
import { useUniversalWorkspaceStore } from '../../store/useUniversalWorkspaceStore'
import { useDeckStore } from '../../store/useDeckStore'

export default function CoursesPage() {
  const { user, isMobile } = useOutletContext()
  const navigate = useNavigate()
  
  // Universal workspace store
  const {
    educationLevel,
    userRole,
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    decks,
    loadDecks
  } = useUniversalWorkspaceStore()
  
  // Deck store
  const { addToDeck } = useDeckStore()
  
  const [activeTab, setActiveTab] = useState('courses') // 'courses' | 'materials' | 'decks'
  const [courses, setCourses] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchCourses()
      fetchMaterials()
      loadDecks(user.id)
    }
  }, [user?.id])

  const fetchCourses = async () => {
    setLoading(true)
    const { data, error } = await courseService.fetchUserCourses(user.id)
    if (!error) setCourses(data || [])
    setLoading(false)
  }

  const fetchMaterials = async () => {
    try {
      const data = await fetchUserStandaloneMaterials(user.id)
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const filteredCourses = courses.filter(course => 
    course.courses?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.courses?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMaterials = materials.filter(material =>
    material.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDecks = decks.filter(deck =>
    deck.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: isMobile ? '20px' : '40px',
      fontFamily: "'Outfit', 'Varela Round', sans-serif"
    }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 24
          }}>
            <Backpack />
          </div>
          <div>
            <h1 style={{ 
              fontSize: isMobile ? 28 : 36, 
              fontWeight: 900, 
              margin: 0, 
              color: '#111',
              letterSpacing: '-0.02em'
            }}>
              My Backpack
            </h1>
            <p style={{ 
              fontSize: 16, 
              color: '#64748b', 
              margin: '4px 0 0',
              fontWeight: 500
            }}>
              Your courses and study materials
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: 500 }}>
          <Search 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: 20, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#94a3b8' 
            }} 
          />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses or decks..." 
            style={{ 
              width: '100%', 
              padding: '16px 20px 16px 56px', 
              borderRadius: 16, 
              border: '2px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: 16,
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#7a12cc'
              e.target.style.background = 'white'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0'
              e.target.style.background = '#f8fafc'
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 32,
        borderBottom: '2px solid #f1f5f9',
        paddingBottom: 0
      }}>
        <button
          onClick={() => setActiveTab('courses')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'courses' ? '3px solid #7a12cc' : '3px solid transparent',
            color: activeTab === 'courses' ? '#7a12cc' : '#64748b',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Book size={18} />
            Courses ({courses.length})
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('materials')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'materials' ? '3px solid #7a12cc' : '3px solid transparent',
            color: activeTab === 'materials' ? '#7a12cc' : '#64748b',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} />
            Materials ({materials.length})
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('decks')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'decks' ? '3px solid #7a12cc' : '3px solid transparent',
            color: activeTab === 'decks' ? '#7a12cc' : '#64748b',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} />
            Decks ({decks.length})
          </div>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'courses' && (
          <motion.div 
            key="courses" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Loader2 size={32} className="animate-spin" color="#7a12cc" />
                <p style={{ color: '#64748b', marginTop: 16 }}>Loading your courses...</p>
              </div>
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
                {!searchQuery && (
                  <button
                    onClick={() => navigate('/dashboard/courses/discover')}
                    style={{
                      padding: '12px 24px',
                      background: '#7a12cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Plus size={20} />
                    Find Courses
                  </button>
                )}
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: 20 
              }}>
                {filteredCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
                    style={{
                      background: 'white',
                      borderRadius: 20,
                      padding: 24,
                      border: '2px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onClick={() => navigate(`/dashboard/course/${course.course_id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                      <div style={{
                        width: 48, height: 48,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 18,
                        fontWeight: 900
                      }}>
                        {(course.courses?.code || '???').slice(0, 3)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: 18, 
                          fontWeight: 800, 
                          color: '#111', 
                          margin: '0 0 4px',
                          lineHeight: 1.2
                        }}>
                          {course.courses?.name || 'Unknown Course'}
                        </h3>
                        <p style={{ 
                          fontSize: 14, 
                          color: '#7a12cc', 
                          fontWeight: 600,
                          margin: 0
                        }}>
                          {course.courses?.code || '???'}
                        </p>
                      </div>
                    </div>
                    
                    {course.courses?.faculty && (
                      <p style={{ 
                        fontSize: 13, 
                        color: '#64748b', 
                        margin: '0 0 16px',
                        fontWeight: 500
                      }}>
                        {course.courses.faculty}
                      </p>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#94a3b8',
                      fontSize: 13,
                      fontWeight: 600
                    }}>
                      <span>Open Course</span>
                      <ChevronRight size={16} />
                    </div>
                  </motion.div>
                ))}
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
            {filteredMaterials.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 80, 
                color: '#94a3b8',
                background: '#f8fafc',
                borderRadius: 20,
                border: '2px dashed #e2e8f0'
              }}>
                <FileText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#64748b' }}>
                  {searchQuery ? 'No materials found' : 'No materials yet'}
                </h3>
                <p style={{ fontSize: 14 }}>
                  {searchQuery ? 'Try a different search term' : 'Upload documents to study them in the workstation'}
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: 20 
              }}>
                {filteredMaterials.map((material) => (
                  <motion.div
                    key={material.id}
                    whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
                    style={{
                      background: 'white',
                      borderRadius: 20,
                      padding: 24,
                      border: '2px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onClick={() => navigate(`/dashboard/workstation?materialId=${material.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                      <div style={{
                        width: 48, height: 48,
                        borderRadius: 12,
                        background: material.processing_status === 'pending' ? '#fef3c7' : '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24
                      }}>
                        {material.processing_status === 'pending' ? '⏳' : '📄'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: 18, 
                          fontWeight: 800, 
                          color: '#111', 
                          margin: '0 0 4px',
                          lineHeight: 1.2
                        }}>
                          {material.title}
                        </h3>
                        <p style={{ 
                          fontSize: 13, 
                          color: '#64748b', 
                          fontWeight: 600,
                          margin: 0,
                          textTransform: 'uppercase'
                        }}>
                          {material.type}
                        </p>
                      </div>
                    </div>
                    
                    <p style={{ 
                      fontSize: 14, 
                      color: '#374151', 
                      margin: '0 0 16px',
                      lineHeight: 1.5
                    }}>
                      {material.processing_status === 'pending' ? 'Processing...' : 'Ready to study'}
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#94a3b8',
                      fontSize: 13,
                      fontWeight: 600
                    }}>
                      <span>Open in Workstation</span>
                      <ChevronRight size={16} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'decks' && (
          <motion.div 
            key="decks" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
          >
            {filteredDecks.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 80, 
                color: '#94a3b8',
                background: '#f8fafc',
                borderRadius: 20,
                border: '2px dashed #e2e8f0'
              }}>
                <Layers size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#64748b' }}>
                  {searchQuery ? 'No decks found' : 'No decks yet'}
                </h3>
                <p style={{ fontSize: 14 }}>
                  {searchQuery ? 'Try a different search term' : 'Create flashcard decks to study smarter'}
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: 20 
              }}>
                {filteredDecks.map((deck) => (
                  <motion.div
                    key={deck.id}
                    whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
                    style={{
                      background: 'white',
                      borderRadius: 20,
                      padding: 24,
                      border: '2px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onClick={() => navigate(`/dashboard/deck/${deck.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                      <div style={{
                        width: 48, height: 48,
                        borderRadius: 12,
                        background: deck.deck_type === 'smart_start' ? '#dcfce7' : '#f0f9ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24
                      }}>
                        {deck.deck_type === 'smart_start' ? '✨' : '📚'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: 18, 
                          fontWeight: 800, 
                          color: '#111', 
                          margin: '0 0 4px',
                          lineHeight: 1.2
                        }}>
                          {deck.title}
                        </h3>
                        <p style={{ 
                          fontSize: 13, 
                          color: '#64748b', 
                          fontWeight: 600,
                          margin: 0
                        }}>
                          {deck.deck_type === 'smart_start' ? 'Smart Start Deck' : 'Custom Deck'}
                        </p>
                      </div>
                    </div>
                    
                    {deck.description && (
                      <p style={{ 
                        fontSize: 14, 
                        color: '#374151', 
                        margin: '0 0 16px',
                        lineHeight: 1.5
                      }}>
                        {deck.description}
                      </p>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#94a3b8',
                      fontSize: 13,
                      fontWeight: 600
                    }}>
                      <span>Study Deck</span>
                      <ChevronRight size={16} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
