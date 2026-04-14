import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom'
import { uploadMaterial, addYoutubeMaterial } from '../../services/materialsService'
import { supabase } from '../../supabaseClient'
import { 
  FileText, Presentation, FileArchive, SearchCode,
  Music, Video, Image as ImageIcon, Link2, Youtube,
  FileBox, Loader2, CheckCircle2, AlertCircle, Trash2, Plus, PenTool, UploadCloud
} from 'lucide-react'

export default function UserUpload() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Parse URL params: ?course_id=...&week=...
  const queryParams = new URLSearchParams(location.search)
  const preSelectedCourse = queryParams.get('course_id') || ''
  const preSelectedWeek = queryParams.get('week') ? parseInt(queryParams.get('week')) : null

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(preSelectedCourse)
  const [file, setFile] = useState(null)
  const [linkInput, setLinkInput] = useState('')
  const [textNote, setTextNote] = useState('')
  const [activeInputTab, setActiveInputTab] = useState('files') // 'files', 'links', 'notes'
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!user) return
    fetchUserCourses()
  }, [user])

  useEffect(() => {
    if (preSelectedCourse) {
      setSelectedCourse(preSelectedCourse)
    }
  }, [preSelectedCourse])

  async function fetchUserCourses() {
    const { data } = await supabase
      .from('user_courses')
      .select('course_id, course:courses(id, name, code)')
      .eq('user_id', user.id)
    
    if (data) {
      const validCourses = data.filter(d => d.course).map(d => d.course)
      setCourses(validCourses)
    }
  }

  const navigateToCourse = () => {
    if (selectedCourse && preSelectedWeek) {
      navigate(`/dashboard/course/${selectedCourse}?week=${preSelectedWeek}`)
    } else if (selectedCourse) {
      navigate(`/dashboard/course/${selectedCourse}`)
    } else {
      navigate('/dashboard/workstation')
    }
  }

  const handleUploadSubmit = async () => {
    if (!selectedCourse) {
      setStatus({ type: 'error', message: 'Please select a course first.' })
      return
    }

    setUploading(true)
    setStatus(null)

    try {
      if (activeInputTab === 'files' && file) {
        const ext = file.name.split('.').pop().toLowerCase()
        let type = 'pdf'
        if (['docx', 'doc'].includes(ext)) type = 'docx'
        else if (['pptx', 'ppt'].includes(ext)) type = 'pptx'
        else if (ext === 'apkg') type = 'anki'
        else if (['mp4', 'webm', 'mov'].includes(ext)) type = 'video'
        else if (['mp3', 'wav', 'm4a'].includes(ext)) type = 'audio'
        else if (['jpg', 'png', 'jpeg', 'webp'].includes(ext)) type = 'image'
        else if (ext === 'txt') type = 'pdf' // Text files handled as pdf-like documents in pipeline

        await uploadMaterial({
          file, courseId: selectedCourse, userId: user.id,
          title: file.name, type: type, week: preSelectedWeek
        })
        setStatus({ type: 'success', message: 'File saved smoothly! Redirecting...' })
        setTimeout(() => navigateToCourse(), 1500)
      } else if (activeInputTab === 'links' && linkInput) {
        let isYoutube = linkInput.includes('youtube.com') || linkInput.includes('youtu.be')
        if (isYoutube) {
          await addYoutubeMaterial({ 
            url: linkInput, courseId: selectedCourse, userId: user.id, week: preSelectedWeek
          })
        } else {
          await supabase.from('materials').insert({
             course_id: selectedCourse, user_id: user.id,
             title: linkInput, type: linkInput.includes('docs.google.com') ? 'google_doc' : 'link',
             source_url: linkInput, owner_role: 'user', processing_status: 'ready', week_number: preSelectedWeek
          })
        }
        setStatus({ type: 'success', message: 'Link added successfully! Redirecting...' })
        setTimeout(() => navigateToCourse(), 1500)
      } else if (activeInputTab === 'notes' && textNote) {
        const title = textNote.split('\n')[0].substring(0, 50) || 'New Note'
        await supabase.from('user_notes').insert({
          user_id: user.id, course_id: selectedCourse, title, content: textNote,
          week_number: preSelectedWeek, source_type: 'personal'
        })
        setStatus({ type: 'success', message: 'Note saved to your workspace! Redirecting...' })
        setTimeout(() => navigateToCourse(), 1500)
      }
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Failed to save. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  const hasContent = (activeInputTab === 'files' && file) || 
                   (activeInputTab === 'links' && linkInput.length > 0) ||
                   (activeInputTab === 'notes' && textNote.length > 0)

  const purpleColor = '#7a12cc'

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px', fontFamily: 'Outfit, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#000', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Add Resources
          </h1>
          <p style={{ color: '#64748B', fontWeight: 500 }}>
            Upload slides, paste links, or write notes for <strong>{courses.find(c=>c.id === selectedCourse)?.code || 'your course'}</strong>.
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '12px 20px', background: '#f8fafc', color: '#000', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </header>

      {/* Course Selection */}
      <div style={{ marginBottom: '32px', background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1.5px solid #f1f5f9' }}>
        <label style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Select Destination Course
        </label>
        <select 
          value={selectedCourse} 
          onChange={e => setSelectedCourse(e.target.value)}
          style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 700, appearance: 'none', background: 'white' }}
        >
          <option value="">Choose a course...</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
          ))}
        </select>
      </div>

      {status && (
        <div style={{ 
          padding: '16px 24px', borderRadius: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px',
          background: status.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          color: status.type === 'success' ? '#16A34A' : '#DC2626',
          border: `1px solid ${status.type === 'success' ? '#BBF7D0' : '#FECACA'}`, fontSize: '15px', fontWeight: 700
        }}>
          {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {status.message}
        </div>
      )}

      {/* Input Type Switcher */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[
          { id: 'files', label: 'Files', icon: FileText },
          { id: 'links', label: 'Links', icon: Link2 },
          { id: 'notes', label: 'Notes', icon: PenTool },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveInputTab(tab.id)}
            style={{
              flex: 1, padding: '16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              background: activeInputTab === tab.id ? purpleColor : '#f8fafc',
              color: activeInputTab === tab.id ? 'white' : '#64748B',
              fontWeight: 800, transition: 'all 0.2s',
              boxShadow: activeInputTab === tab.id ? '0 10px 20px -5px rgba(122, 18, 204, 0.3)' : 'none'
            }}
          >
            <tab.icon size={20} strokeWidth={2.5} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: '300px' }}>
        {activeInputTab === 'files' && (
          <div 
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]) }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '32px',
              padding: '80px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <input type="file" ref={fileInputRef} hidden onChange={e => e.target.files[0] && setFile(e.target.files[0])} />
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', background: `${purpleColor}10`, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: purpleColor }}><FileText size={32} /></div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{file.name}</div>
                <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{ color: '#ef4444', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
              </div>
            ) : (
              <div>
                <UploadCloud size={64} color="#94a3b8" style={{ marginBottom: '24px', opacity: 0.5 }} />
                <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 900 }}>Drop your files here</h3>
                <p style={{ color: '#64748B', fontWeight: 600 }}>PDF, PPTX, DOCX or Images supported</p>
              </div>
            )}
          </div>
        )}

        {activeInputTab === 'links' && (
          <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '32px', border: '1.5px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
               <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#FF000010', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF0000' }}><Youtube size={24} /></div>
               <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Paste URL</h3>
            </div>
            <input 
              type="text" placeholder="https://youtube.com/watch?v=..."
              value={linkInput} onChange={e => setLinkInput(e.target.value)}
              style={{ width: '100%', padding: '20px', borderRadius: '20px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 700, background: 'white' }}
            />
            <p style={{ marginTop: '16px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>YouTube videos will be transcribed and summarized by AI.</p>
          </div>
        )}

        {activeInputTab === 'notes' && (
          <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '32px', border: '1.5px solid #f1f5f9' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 900 }}>Quick Note</h3>
            <textarea 
              placeholder="Paste your research, lecture snippets or draft notes here..."
              value={textNote} onChange={e => setTextNote(e.target.value)}
              style={{ width: '100%', minHeight: '260px', padding: '24px', borderRadius: '24px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 500, fontFamily: 'Outfit, sans-serif', background: 'white', resize: 'vertical' }}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleUploadSubmit}
          disabled={uploading || !hasContent || !selectedCourse}
          style={{
            background: purpleColor, color: 'white', padding: '20px 60px', borderRadius: '24px',
            fontSize: '18px', fontWeight: 900, border: 'none', cursor: 'pointer',
            opacity: (uploading || !hasContent || !selectedCourse) ? 0.6 : 1,
            boxShadow: '0 15px 30px -5px rgba(122, 18, 204, 0.4)',
            display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
          }}
        >
          {uploading ? <Loader2 className="animate-spin" size={24} /> : null}
          {uploading ? 'SAVING...' : 'ADD TO MY VAULT'}
        </button>
      </div>
    </div>
  )
}
