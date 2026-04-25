import { useState, useEffect } from 'react'
import { RiSearchLine as Search, RiArrowDownSLine as ChevronDown, RiBookOpenFill as BookOpen, RiStackFill as Layers, RiFolderFill as Folder, RiClipboardFill as ClipboardCheck, RiCheckboxCircleFill as CheckCircle, RiMore2Fill as MoreVertical, RiStarFill as Star, RiTimeFill as Clock, RiTrophyFill as Trophy, RiArrowRightLine as ArrowRight, RiLoader4Line as Loader2 } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const TABS = [
  { id: 'all', label: 'All Activity', icon: Layers },
  { id: 'flashcards', label: 'Flashcard sets', icon: Layers },
  { id: 'practice', label: 'Practice tests', icon: ClipboardCheck },
  { id: 'folders', label: 'Folders', icon: Folder },
  { id: 'classes', label: 'Classes', icon: BookOpen },
]

export default function LibraryPage() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [recentSessions, setRecentSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchLibraryContent()
    }
  }, [user])

  async function fetchLibraryContent() {
    setLoading(true)
    try {
      // Fetch recent exam sessions
      const { data: sessions, error: sErr } = await supabase
        .from('exam_sessions')
        .select('id, course_code, course_name, score, total_questions, accuracy, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (sessions) setRecentSessions(sessions)
      if (sErr) console.error('Error fetching sessions:', sErr)
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = recentSessions.filter(s => 
    s.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.course_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const showSessions = activeTab === 'all' || activeTab === 'practice'

  return (
    <div className="dh-root" style={{ background: '#fbfbff', minHeight: '100vh', padding: '40px 60px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111', marginBottom: '32px' }}>Your library</h1>
        
        <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #e1e1e1', paddingBottom: '2px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 4px',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '700' : '500',
                color: activeTab === tab.id ? 'var(--primary, #7a12cc)' : '#666',
                background: 'none',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div style={{ position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '2px', background: 'var(--primary, #7a12cc)', borderRadius: '2px' }} />
              )}
            </button>
          ))}
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', fontSize: '14px', fontWeight: '700', color: '#444', cursor: 'pointer' }}>
          Recent <ChevronDown size={14} />
        </button>

        <div style={{ position: 'relative', width: '440px' }}>
          <input 
            type="text"
            placeholder={`Search ${TABS.find(t => t.id === activeTab)?.label.toLowerCase()}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 20px',
              paddingRight: '48px',
              background: 'white',
              border: '1.5px solid #f0f0f0',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          />
          <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <Loader2 className="animate-spin" size={32} color="#7a12cc" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {/* Recent Sessions Section */}
          {showSessions && filteredSessions.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Clock size={16} color="#999" />
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Sessions</span>
                <div style={{ flex: 1, height: '1px', background: '#f0f0f0' }} />
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {filteredSessions.map(session => (
                  <SessionCard key={session.id} session={session} onClick={() => navigate(`/dashboard/exam-session/${session.id}`)} />
                ))}
              </div>
            </section>
          )}

          {/* Fallback mockup content for other tabs */}
          {activeTab === 'flashcards' && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
               <Layers size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
               <p style={{ fontWeight: 600 }}>No flashcard sets found yet.</p>
            </div>
          )}

          {activeTab === 'folders' && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
               <Folder size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
               <p style={{ fontWeight: 600 }}>Your folders will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SessionCard({ session, onClick }) {
  const isPass = session.accuracy >= 50
  return (
    <motion.div 
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}
      onClick={onClick}
      style={{
        background: 'white',
        padding: '24px 32px',
        borderRadius: '16px',
        border: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '12px', 
          background: isPass ? '#eefaec' : '#fff1f2', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: isPass ? '#16a34a' : '#ef4444'
        }}>
          {isPass ? <Trophy size={24} /> : <ClipboardCheck size={24} />}
        </div>

        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#7a12cc', background: '#7a12cc10', padding: '2px 8px', borderRadius: '4px' }}>MOCK EXAM</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#666' }}>{new Date(session.created_at).toLocaleDateString()}</span>
           </div>
           <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111', margin: 0 }}>{session.course_code}: {session.course_name}</h3>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
         <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#111' }}>{session.score}/{session.total_questions}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: isPass ? '#16a34a' : '#ef4444' }}>{session.accuracy}% Accuracy</div>
         </div>
         <div style={{ color: '#ccc' }}>
            <ArrowRight size={20} />
         </div>
      </div>
    </motion.div>
  )
}
