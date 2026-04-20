import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Plus, Book, Layers, Archive, Search, Filter, MoreVertical, BookOpen, Clock, Target, ChevronRight, Hash, Star, Briefcase } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { useDeckStore } from '../../store/useDeckStore'
import PremiumModal from '../shared/PremiumModal'

export default function CoursesPage() {
  const { user, isMobile } = useOutletContext()
  const { addToDeck, activeDeckItems } = useDeckStore()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('courses') // 'courses', 'vault', 'decks'
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  useEffect(() => {
    if (user?.id) fetchCourses()
  }, [user?.id])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select('*, courses(*)')
        .eq('user_id', user.id)
      
      if (error) throw error
      setCourses(data || [])
    } catch (err) {
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(c => 
    c.courses?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.courses?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitialsColor = (code) => {
    const hash = code?.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0) || 0
    return `hsl(${Math.abs(hash) % 360}, 75%, 65%)`
  }

  return (
    <div className="courses-page-container" style={{ 
      padding: isMobile ? '20px 16px' : '40px', 
      maxWidth: 1400, 
      margin: '0 auto', 
      minHeight: '100vh',
      fontFamily: "'Outfit', sans-serif"
    }}>
      
      {/* ── HEADER ── */}
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#111', letterSpacing: '-0.04em', margin: 0 }}>Backpack</h1>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              {['courses', 'vault', 'decks'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: activeTab === tab ? '#7a12cc' : '#94a3b8',
                    background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer',
                    borderBottom: activeTab === tab ? '3px solid #7a12cc' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {!isMobile && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" placeholder="Search archive..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    padding: '12px 16px 12px 42px', borderRadius: 16, border: '1.5px solid #eee',
                    fontSize: 14, fontWeight: 500, width: 260, background: '#f8fafc',
                    outline: 'none', transition: 'all 0.2s', focusBorderColor: '#7a12cc'
                  }}
                />
              </div>
              <button 
                onClick={() => setShowPremiumModal(true)}
                style={{ 
                  padding: '12px 24px', borderRadius: 16, background: '#7a12cc', color: 'white',
                  fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 8px 20px -6px rgba(122, 18, 204, 0.4)', transition: 'all 0.2s'
                }}
              >
                <Plus size={18} strokeWidth={3} /> Add Course
              </button>
            </div>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'courses' && (
          <motion.div 
            key="courses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {loading ? (
              <div style={{ padding: 100, textAlign: 'center', color: '#94a3b8' }}>Scanning registry...</div>
            ) : filteredCourses.length === 0 ? (
              <div style={{ padding: 100, textAlign: 'center', background: '#f8fafc', borderRadius: 32, border: '2px dashed #eee' }}>
                <Archive size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>No courses deployed yet.</p>
                <button onClick={() => setShowPremiumModal(true)} style={{ color: '#7a12cc', fontWeight: 900, marginTop: 8 }}>Initialize New Record</button>
              </div>
            ) : (
              filteredCourses.map((uc) => (
                <CourseRow key={uc.id} uc={uc} navigate={navigate} color={getInitialsColor(uc.courses?.code)} isMobile={isMobile} />
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'vault' && (
           <motion.div 
             key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
             style={{ padding: 80, textAlign: 'center', background: '#fcfaff', borderRadius: 32, border: '2px dashed #e9e2ff' }}
           >
             <Briefcase size={40} color="#7a12cc" style={{ opacity: 0.4, marginBottom: 16 }} />
             <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111' }}>The Vault</h2>
             <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, margin: '8px auto 24px' }}>Store independent research, external PDFs, and YouTube insights that don't belong to a specific course.</p>
             <button onClick={() => navigate('/dashboard/upload')} style={{ padding: '12px 24px', borderRadius: 14, background: '#111', color: 'white', fontWeight: 700 }}>Open Upload Matrix</button>
           </motion.div>
        )}

        {activeTab === 'decks' && (
          <motion.div key="decks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             {/* Decks Grid logic here */}
             <div style={{ padding: 40, background: '#fffbeb', borderRadius: 32, border: '2px dashed #fbbf24', textAlign: 'center' }}>
                <Layers size={40} color="#fbbf24" style={{ marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#92400e' }}>Active Study Decks</h3>
                <p style={{ fontSize: 14, color: '#b45309' }}>View your curated collections for active sessions.</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  )
}

function CourseRow({ uc, navigate, color, isMobile }) {
  const c = uc.courses
  
  return (
    <motion.div 
      whileHover={{ scale: 1.005, y: -2 }}
      onClick={() => navigate(`/dashboard/courses/${c.id}`)}
      style={{ 
        background: 'white', 
        borderRadius: 24, 
        padding: '20px 24px',
        display: 'flex', 
        alignItems: 'center', 
        gap: 20,
        cursor: 'pointer',
        boxShadow: '0 4px 15px -5px rgba(0,0,0,0.05)',
        border: '1.5px solid #f1f1f1',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ 
        width: 60, height: 60, borderRadius: 16, background: color, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: 16, fontWeight: 900,
        boxShadow: `0 8px 16px -4px ${color}33`
      }}>
        {c.code?.slice(0, 3)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#7a12cc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.code}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>• 1st SEM</span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0, truncate: 'true' }}>{c.name}</h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
         <div style={{ textAlign: 'right', display: isMobile ? 'none' : 'block' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Mastery</div>
            <div style={{ width: 120, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
               <div style={{ width: `${uc.progress || 0}%`, height: '100%', background: color, borderRadius: 99 }} />
            </div>
         </div>
         <div style={{ color: '#eee' }}><MoreVertical size={20} /></div>
         <ChevronRight size={20} color="#cbd5e1" />
      </div>
    </motion.div>
  )
}
