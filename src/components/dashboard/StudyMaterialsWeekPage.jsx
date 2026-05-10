import React, { useState, useEffect } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { RiArrowLeftLine as ArrowLeft, RiFileTextFill as FileText, RiVideoFill as Video, RiBookOpenFill as BookOpen, RiDownloadLine as Download, RiExternalLinkFill as ExternalLink, RiTimeFill as Clock, RiFolderAddLine as FolderAdd, RiCloseLine as X } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { fetchCourseMaterials } from '../../services/materialsService'
import { clearMaterialsCache } from './StudyMaterialsPage'
import { preloadingService } from '../../services/preloadingService'
import { useSessionStore } from '../../store/useSessionStore'

export default function StudyMaterialsWeekPage() {
  const { courseId, weekId } = useParams()
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const { sessions, addItemToSession } = useSessionStore()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [courseName, setCourseName] = useState('Course')
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)

  useEffect(() => {
    if (courseId && user?.id) {
      // Clear all caches to ensure fresh data after uploads
      clearMaterialsCache(courseId)
      preloadingService.clearCache()
      loadMaterials()
      fetchCourseName()
    }
  }, [courseId, user?.id, weekId])

  async function fetchCourseName() {
    const { data } = await supabase.from('courses').select('name, code').eq('id', courseId).single()
    if (data) setCourseName(`${data.code} - ${data.name}`)
  }

  async function loadMaterials() {
    setLoading(true)
    try {
      const mats = await fetchCourseMaterials(courseId, user.id)
      const filtered = mats.filter(m => {
        const week = m.week || getWeekNumber(new Date(m.created_at))
        return String(week) === String(weekId)
      })
      setMaterials(filtered)
    } catch (err) {
      console.error('Failed to load materials:', err)
    } finally {
      setLoading(false)
    }
  }

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7))
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1))
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7)
    return weekNo
  }

  const ICONS = {
    pdf: <FileText size={24} />,
    note: <BookOpen size={24} />,
    youtube: <Video size={24} />
  }

  const handleAddToSession = (material) => {
    setSelectedMaterial(material)
    setShowSessionModal(true)
  }

  const handleSelectSession = async (sessionId) => {
    const item = {
      id: selectedMaterial.id,
      title: selectedMaterial.title,
      type: selectedMaterial.type,
      url: selectedMaterial.source_url,
      courseId: courseId
    }
    const result = await addItemToSession(sessionId, item)
    if (result.success) {
      setShowSessionModal(false)
      setSelectedMaterial(null)
    } else {
      alert(result.error || 'Failed to add to session')
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Outfit' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a12cc', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '32px', padding: 0 }}
      >
        <ArrowLeft size={20} /> Back to All Weeks
      </button>

      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
           <span style={{ background: '#F5F3FF', color: '#7a12cc', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>WEEK {weekId}</span>
           <span style={{ color: '#94A3B8', fontSize: '14px' }}>•</span>
           <span style={{ color: '#94A3B8', fontSize: '14px' }}>{courseName}</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A102D' }}>Week {weekId} Study Materials</h1>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {materials.map(m => (
            <div 
              key={m.id} 
              onClick={() => {
                console.log('Material card clicked, navigating to:', m.id)
                navigate(`/dashboard/workstation?materialId=${m.id}`)
              }}
              style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1.5px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#7a12cc'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '56px', height: '56px', background: '#F5F3FF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a12cc' }}>
                  {ICONS[m.type] || <FileText size={24} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A202C', marginBottom: '4px' }}>{m.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94A3B8', fontSize: '13px' }}>
                    <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{m.type}</span>
                    <span>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {new Date(m.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('Navigating to workstation with materialId:', m.id)
                    navigate(`/dashboard/workstation?materialId=${m.id}`)
                  }}
                  style={{ padding: '10px 20px', borderRadius: '10px', background: '#7a12cc', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <ExternalLink size={16} /> Open in Workstation
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddToSession(m)
                  }}
                  style={{ padding: '10px 16px', borderRadius: '10px', background: '#F5F3FF', color: '#7a12cc', fontWeight: 600, border: '1px solid #E9D5FF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FolderAdd size={16} /> Add to Session
                </button>
                <a 
                  href={m.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ padding: '10px', borderRadius: '10px', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                >
                  <Download size={20} />
                </a>
              </div>
            </div>
          ))}
          {materials.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', background: '#F8FAFC', borderRadius: '20px', border: '1px dashed #CBD5E0', color: '#94A3B8' }}>
              No materials found for this week.
            </div>
          )}
        </div>
      )}

      {/* Session Selection Modal */}
      {showSessionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: 28,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>Add to Session</h3>
              <button 
                onClick={() => {
                  setShowSessionModal(false)
                  setSelectedMaterial(null)
                }}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={16} />
              </button>
            </div>
            
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                <p style={{ fontSize: 14, marginBottom: 16 }}>No sessions yet. Create one to get started.</p>
                <button 
                  onClick={() => {
                    navigate('/dashboard')
                    setShowSessionModal(false)
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#7a12cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    style={{
                      padding: 16,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f1f5f9'
                      e.target.style.borderColor = '#7a12cc'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f8fafc'
                      e.target.style.borderColor = '#e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>
                      {session.session_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {session.items?.length || 0} items
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
