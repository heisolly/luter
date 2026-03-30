import React, { lazy, Suspense, useState, useEffect } from 'react'
import { Loader2, FileText, Download, ExternalLink, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../../supabaseClient'

// Lazy load specific rendering engines
const PdfRenderer = lazy(() => import('./renderers/PdfRenderer'))
const VideoRenderer = lazy(() => import('./renderers/VideoRenderer'))
const OfficeRenderer = lazy(() => import('./renderers/OfficeRenderer'))
const ExcelRenderer = lazy(() => import('./renderers/ExcelRenderer'))
const AnkiRenderer = lazy(() => import('./renderers/AnkiRenderer'))
const NoteRenderer = lazy(() => import('./renderers/NoteRenderer'))

export default function MaterialRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const [courseMaterials, setCourseMaterials] = useState([])
  const [assignments, setAssignments] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'files') fetchFiles()
    if (activeTab === 'assignments') fetchAssignments()
    if (activeTab === 'tracker') fetchActivity()
  }, [activeTab, material?.course_id])

  async function fetchFiles() {
    if (!material?.course_id) return
    setLoading(true)
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', material.course_id)
      .order('created_at', { ascending: false })
    if (data) setCourseMaterials(data)
    setLoading(false)
  }

  async function fetchAssignments() {
    if (!material?.course_id) return
    setLoading(true)
    // Assuming assignments are stored in a table called 'assignments' or filtered by type in materials
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', material.course_id)
      .eq('type', 'assignment')
      .order('created_at', { ascending: false })
    if (data) setAssignments(data)
    setLoading(false)
  }

  async function fetchActivity() {
    if (!material?.course_id) return
    setLoading(true)
    // Fetch user notes, highlights, etc.
    const { data: notes } = await supabase
      .from('user_notes')
      .select('*')
      .eq('course_id', material.course_id)
      .order('created_at', { ascending: false })
    
    if (notes) {
      const logs = notes.map(n => ({
        id: n.id,
        type: n.source_type === 'ai' ? 'AI Generation' : 'Note Saved',
        title: n.title,
        timestamp: n.created_at
      }))
      setActivityLogs(logs)
    }
    setLoading(false)
  }

  if (!material) return null

  if (activeTab === 'files') {
    return (
      <div style={{ padding: '40px', background: '#F8FAFC', minHeight: '100%', fontFamily: 'Outfit' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A102D', marginBottom: '24px' }}>Course Files</h2>
        {loading ? <Loader2 className="animate-spin" size={24} /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {courseMaterials.map(m => (
              <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', background: '#F5F3FF', borderRadius: '10px' }}>
                    <FileText size={20} color="#7a12cc" />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A202C' }}>{m.title}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <a href={m.source_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#F5F3FF', color: '#7a12cc', fontSize: '12px', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>View</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'assignments') {
    return (
      <div style={{ padding: '40px', background: '#F8FAFC', minHeight: '100%', fontFamily: 'Outfit' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A3A32', marginBottom: '24px' }}>Assignments</h2>
        {loading ? <Loader2 className="animate-spin" size={24} /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {assignments.length > 0 ? assignments.map(a => (
              <div key={a.id} style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#FFF7ED', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={24} color="#F97316" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1A202C' }}>{a.title}</div>
                    <div style={{ fontSize: '13px', color: '#718096' }}>Due: Next Sunday</div>
                  </div>
                </div>
                <button style={{ padding: '10px 24px', borderRadius: '10px', background: '#7a12cc', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Submit Now</button>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '80px', opacity: 0.5 }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto 16px' }} />
                <p>No pending assignments for this course.</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'tracker') {
    return (
      <div style={{ padding: '40px', background: '#F8FAFC', minHeight: '100%', fontFamily: 'Outfit' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A3A32', marginBottom: '24px' }}>Activity Tracker</h2>
        {loading ? <Loader2 className="animate-spin" size={24} /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activityLogs.map(log => (
              <div key={log.id} style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '8px', background: '#F5F3FF', borderRadius: '8px' }}>
                  <Clock size={18} color="#7a12cc" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A202C' }}>{log.type}: {log.title}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {activityLogs.length === 0 && <p style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No recent activity.</p>}
          </div>
        )}
      </div>
    )
  }

  // Strategy detection based on file type/extension
  const getRenderer = () => {
    const type = material.type?.toLowerCase()
    const url = material.source_url || ''
    
    // 1. YouTube & Video
    if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      return <VideoRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }

    // 2. Anki Imports (.apkg)
    if (type === 'anki' || url.endsWith('.apkg')) {
      return <AnkiRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }

    // 3. Excel Files (.xlsx, .xls)
    if (['xlsx', 'xls'].includes(type)) {
      return <ExcelRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }

    // 4. Office Docs (Word & PowerPoint)
    if (['docx', 'pptx', 'doc', 'ppt'].includes(type)) {
      return <OfficeRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }

    // 5. PDFs (High Precision)
    if (type === 'pdf' || url.endsWith('.pdf')) {
      return <PdfRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }

    // 6. Google Docs (Embed Strategy)
    if (url.includes('docs.google.com')) {
      return <OfficeRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }
    
    // Default to a markdown/note renderer
    return <NoteRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
  }

  return (
    <div className="ws-canvas-container" style={{ width: '100%', height: '100%' }}>
      <Suspense fallback={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
          <Loader2 className="animate-spin" color="#7a12cc" size={32} />
          <p style={{ fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 600 }}>Loading Viewing Engine...</p>
        </div>
      }>
        {getRenderer()}
      </Suspense>
    </div>
  )
}
