import React, { useState, useEffect } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { 
  BookOpen, Calendar, Download, MessageSquare, 
  Clock, TrendingUp, Award, Zap,
  FileText, Video, Headphones, Image, File,
  ChevronLeft, ChevronRight, Plus, Search,
  Filter, Bell, Send, Star, Users, Target,
  Layers, Grid3x3, List, ArrowUpRight,
  AlertCircle, CheckCircle, Loader2, Youtube, Lock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeckStore } from '../../store/useDeckStore'

export default function SemesterNotesPage() {
  const { courseId } = useParams()
  const { user, isMobile } = useOutletContext()
  const navigate = useNavigate()
  
  const [activeView, setActiveView] = useState('weeks')
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [course, setCourse] = useState(null)
  const [semesterWeeks, setSemesterWeeks] = useState([])
  const [materials, setMaterials] = useState([])
  const [userRequests, setUserRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const [requestForm, setRequestForm] = useState({
    week_number: 1,
    subject: '',
    topic: '',
    urgency: 'normal',
    description: ''
  })

  useEffect(() => {
    if (courseId && user?.id) loadData()
  }, [courseId, user?.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [courseRes, weeksRes, materialsRes, requestsRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('semester_weeks').select('*').eq('course_id', courseId).order('week_number'),
        supabase.from('materials_with_context').select('*').eq('course_id', courseId).order('created_at', { ascending: false }),
        supabase.from('notes_requests').select('*').eq('user_id', user.id).eq('course_id', courseId).order('created_at', { ascending: false })
      ])

      setCourse(courseRes.data)
      setSemesterWeeks(weeksRes.data || [])
      setMaterials(materialsRes.data || [])
      setUserRequests(requestsRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    )
  }

  return (
    <div className="semester-notes-root" style={{ 
      maxWidth: 1400, margin: '0 auto', padding: isMobile ? '20px 16px' : '40px',
      fontFamily: "'Outfit', sans-serif", color: '#1e293b'
    }}>
      
      {/* ── HEADER ── */}
      <header style={{ marginBottom: 48, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button 
            onClick={() => navigate('/dashboard/courses')}
            style={{ width: 50, height: 50, borderRadius: 16, border: '1.5px solid #eee', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
               <span style={{ fontSize: 13, fontWeight: 900, color: '#7a12cc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{course?.code}</span>
               <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
               <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Protocol Archive</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: 0 }}>{course?.name}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', background: '#f8fafc', padding: 6, borderRadius: 20, border: '1.5px solid #eee', gap: 4 }}>
           {['weeks', 'materials', 'requests'].map(v => (
             <button
               key={v} onClick={() => setActiveView(v)}
               style={{ 
                 padding: '10px 24px', borderRadius: 14, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
                 background: activeView === v ? 'white' : 'transparent',
                 color: activeView === v ? '#111' : '#94a3b8',
                 boxShadow: activeView === v ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                 border: activeView === v ? '1px solid #eee' : '1px solid transparent',
                 transition: 'all 0.2s'
               }}
             >
               {v}
             </button>
           ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeView === 'weeks' ? (
          <motion.div key="weeks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {semesterWeeks.map((week, i) => <WeekCard key={week.id} week={week} materials={materials} index={i} />)}
          </motion.div>
        ) : activeView === 'materials' ? (
          <motion.div key="materials" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {materials.map(m => <MaterialCard key={m.id} material={m} courseCode={course?.code} />)}
          </motion.div>
        ) : (
          <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 800 }}>
             {userRequests.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', background: '#f8fafc', borderRadius: 32, border: '2px dashed #eee' }}>
                   <Send size={40} color="#7a12cc" style={{ opacity: 0.2, marginBottom: 16 }} />
                   <h3 style={{ fontSize: 18, fontWeight: 800 }}>No requests pending</h3>
                   <button onClick={() => setShowRequestModal(true)} style={{ color: '#7a12cc', fontWeight: 900, marginTop: 8 }}>Request New Research</button>
                </div>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   {userRequests.map(r => <RequestItem key={r.id} request={r} />)}
                </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WeekCard({ week, materials, index }) {
  const weekMaterials = materials.filter(m => (m.week_number || (m.metadata?.week_number)) === week.week_number)
  const isAccessible = week.is_published || weekMaterials.length > 0

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }}
      style={{ 
        background: 'white', borderRadius: 32, padding: 32, border: '1.5px solid #f1f1f1', 
        opacity: isAccessible ? 1 : 0.6, cursor: isAccessible ? 'pointer' : 'not-allowed',
        display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: isAccessible ? '#f5f3ff' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAccessible ? '#7a12cc' : '#cbd5e1' }}>
          {isAccessible ? <BookOpen size={22} /> : <Lock size={22} />}
        </div>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#cbd5e1', letterSpacing: '0.1em' }}>W0{index + 1}</span>
      </div>
      
      <h3 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: '0 0 12px', lineHeight: 1.2 }}>{week.title}</h3>
      <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, lineHeight: 1.6, marginBottom: 32, flex: 1 }}>{week.description}</p>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: '1.5px solid #f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color="#94a3b8" />
          <span style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8' }}>{weekMaterials.length} RESOURCES</span>
        </div>
        {isAccessible && <div style={{ width: 32, height: 32, borderRadius: 10, background: '#7a12cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><ChevronRight size={18} strokeWidth={3} /></div>}
      </div>
    </motion.div>
  )
}

function MaterialCard({ material, courseCode }) {
  const { addToDeck, activeDeckItems } = useDeckStore()
  const isAdded = activeDeckItems.some(i => i.content_id === material.id)
  const isVideo = material.type === 'youtube'

  return (
    <div style={{ 
      background: 'white', borderRadius: 24, padding: 24, border: '1.5px solid #f1f1f1',
      display: 'flex', flexDirection: 'column', gap: 16
    }}>
      <div style={{ display: 'flex', gap: 16 }}>
         <div style={{ 
           width: 48, height: 48, borderRadius: 14, background: isVideo ? '#fff1f2' : '#f0f9ff', 
           display: 'flex', alignItems: 'center', justifyContent: 'center', color: isVideo ? '#e11d48' : '#0284c7' 
         }}>
            {isVideo ? <Youtube size={24} /> : <FileText size={24} />}
         </div>
         <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: 0, truncate: 'true' }}>{material.title}</h4>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{material.type} • Week {material.week_number}</span>
         </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
         <button 
           onClick={() => window.open(material.source_url, '_blank')}
           style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#f8fafc', border: '1px solid #eee', fontSize: 12, fontWeight: 800, color: '#475569' }}
         >
           Access
         </button>
         <button 
           onClick={() => addToDeck({
             content_id: material.id,
             content_type: 'archive_note',
             metadata: { title: material.title, course_code: courseCode, icon: material.type }
           })}
           disabled={isAdded}
           style={{ 
             padding: '10px 14px', borderRadius: 12, 
             background: isAdded ? '#fbbf24' : '#7a12cc', 
             color: 'white', border: 'none', cursor: isAdded ? 'default' : 'pointer' 
           }}
         >
           {isAdded ? <CheckCircle size={18} /> : <Plus size={18} strokeWidth={3} />}
         </button>
      </div>
    </div>
  )
}

function RequestItem({ request }) {
  return (
    <div style={{ background: 'white', borderRadius: 24, padding: 24, border: '1.5px solid #f1f1f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
       <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
             <span style={{ fontSize: 12, fontWeight: 900, color: '#7a12cc', textTransform: 'uppercase' }}>W0{request.week_number}</span>
             <span style={{ padding: '2px 8px', borderRadius: 6, background: request.status === 'completed' ? '#f0fdf4' : '#fff7ed', color: request.status === 'completed' ? '#166534' : '#9a3412', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>{request.status}</span>
          </div>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0 }}>{request.subject}</h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{request.topic}</p>
       </div>
       <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>{new Date(request.created_at).toLocaleDateString()}</div>
       </div>
    </div>
  )
}
