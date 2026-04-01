import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { uploadMaterial, addYoutubeMaterial } from '../../services/materialsService'
import { supabase } from '../../supabaseClient'
import { 
  FileText, Presentation, FileArchive, SearchCode,
  Music, Video, Image as ImageIcon, Link2, Youtube,
  FileBox, Loader2, CheckCircle2, AlertCircle, Trash2
} from 'lucide-react'

export default function UserUpload() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [file, setFile] = useState(null)
  const [linkInput, setLinkInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!user) return
    fetchUserCourses()
  }, [user])

  async function fetchUserCourses() {
    // Join user_courses with courses to get only courses the user is enrolled in
    const { data, error } = await supabase
      .from('user_courses')
      .select('course_id, course:courses(id, name, code)')
      .eq('user_id', user.id)
    
    if (data) {
      const validCourses = data.filter(d => d.course).map(d => d.course)
      setCourses(validCourses)
    }
  }

  // Handle Drag & Drop
  const handleDragOver = (e) => { e.preventDefault() }
  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setStatus(null)
    }
  }

  // Handle file select
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatus(null)
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
      if (file) {
        // Upload File
        const ext = file.name.split('.').pop().toLowerCase()
        let type = 'pdf'
        if (['docx', 'doc'].includes(ext)) type = 'docx'
        else if (['pptx', 'ppt'].includes(ext)) type = 'pptx'
        else if (ext === 'apkg') type = 'anki'
        else if (['mp4', 'webm', 'mov'].includes(ext)) type = 'video'
        else if (['mp3', 'wav'].includes(ext)) type = 'audio'
        else if (['jpg', 'png', 'jpeg'].includes(ext)) type = 'image'

        await uploadMaterial({
          file,
          courseId: selectedCourse,
          userId: user.id,
          title: file.name,
          type: type,
          week: null
        })
        setStatus({ type: 'success', message: 'File uploaded smoothly! Head over to your course to view it.' })
        setFile(null)
      } else if (linkInput) {
        // Upload Link
        let isYoutube = linkInput.includes('youtube.com') || linkInput.includes('youtu.be')
        if (isYoutube) {
          await addYoutubeMaterial({ url: linkInput, courseId: selectedCourse, userId: user.id })
        } else {
          await supabase.from('materials').insert({
             course_id: selectedCourse,
             user_id: user.id,
             title: linkInput,
             type: linkInput.includes('docs.google.com') ? 'google_doc' : 'website',
             source_url: linkInput,
             owner_role: 'user',
             processing_status: 'ready'
          })
        }
        setStatus({ type: 'success', message: 'Link added to your course successfully!' })
        setLinkInput('')
      }
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Failed to upload. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  const hasContent = file !== null || linkInput.length > 0;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px', fontFamily: 'Outfit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A3A32', marginBottom: '8px' }}>
            Add Resources
          </h1>
          <p style={{ color: '#64748B', marginBottom: '0' }}>
            Upload your personal notes, slides, or helpful links into your workspace.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/dashboard/workstation')}
          style={{
            padding: '10px 20px',
            background: '#f8f9fa',
            color: '#7a12cc',
            border: '2px solid #7a12cc',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'Varela Round',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => {
            e.target.style.background = '#7a12cc'
            e.target.style.color = 'white'
          }}
          onMouseLeave={e => {
            e.target.style.background = '#f8f9fa'
            e.target.style.color = '#7a12cc'
          }}
        >
          ← Back to Workstation
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '14px', fontWeight: 700, color: '#4A5568', display: 'block', marginBottom: '8px' }}>
          Destination Course
        </label>
        <select 
          value={selectedCourse} 
          onChange={e => setSelectedCourse(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Outfit', fontSize: '15px' }}
        >
          <option value="">Select a course...</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
          ))}
        </select>
      </div>

      {status && (
        <div style={{ 
          padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px',
          background: status.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          color: status.type === 'success' ? '#16A34A' : '#DC2626',
          border: `1px solid ${status.type === 'success' ? '#BBF7D0' : '#FECACA'}`, fontSize: '14px', fontWeight: 600
        }}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {status.message}
        </div>
      )}

      {/* Drag and Drop Container matching reference image */}
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          background: '#F8FFF9', // Very light green tint
          border: '1.5px solid #A7F3D0', // Light green border
          borderRadius: '24px',
          padding: '60px 40px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '24px',
          position: 'relative'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
        />
        
        {file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '64px', height: '64px', background: '#D1FAE5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
               <FileText size={32} />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#064E3B' }}>{file.name}</div>
            <div style={{ fontSize: '13px', color: '#059669', opacity: 0.8 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            <button 
              onClick={() => setFile(null)}
              style={{ background: 'transparent', border: 'none', color: '#EF4444', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px', marginTop: '8px' }}
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <button 
              onClick={() => { setLinkInput(''); fileInputRef.current.click() }}
              style={{
                background: '#D1FAE5', // Light green
                color: '#065F46', // Dark green text
                padding: '14px 40px',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.1)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              click to upload
            </button>
            <div style={{ fontSize: '15px', color: '#059669', fontWeight: 500 }}>
              or drag & drop files here
            </div>

            {/* Icons Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '24px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}><FileText size={16} /> PDF</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}><Presentation size={16} color="#EA4335" /> Power Point</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}><FileText size={16} color="#2563EB" /> Word docx</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}><FileBox size={16} color="#0EA5E9" /> Anki import</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '24px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}><Music size={16} /> Audio file</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}><Video size={16} /> Video file</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}><ImageIcon size={16} /> Image</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Link Input Section - Disabled if file is present to prevent mixed uploads */}
      <div style={{ 
        border: '1.5px solid #E2E8F0', 
        borderRadius: '99px',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 24px',
        opacity: file ? 0.5 : 1,
        pointerEvents: file ? 'none' : 'auto',
        transition: 'all 0.2s'
      }}>
        <input 
          type="text"
          placeholder="or paste any link here"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 0', fontSize: '15px', color: '#4A5568', fontFamily: 'Outfit' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1.5px solid #F1F5F9', paddingLeft: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
            <Link2 size={16} /> Websites,
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
            <Youtube size={16} color="#FF0000" /> YouTube,
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
            <FileText size={16} color="#4285F4" /> Google Docs
          </span>
        </div>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleUploadSubmit}
          disabled={uploading || !hasContent || !selectedCourse}
          style={{
            background: '#7a12cc',
            color: 'white',
            padding: '14px 40px',
            borderRadius: '99px',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            cursor: (uploading || !hasContent || !selectedCourse) ? 'not-allowed' : 'pointer',
            opacity: (uploading || !hasContent || !selectedCourse) ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(122, 18, 204, 0.2)',
            transition: 'all 0.2s',
          }}
        >
          {uploading ? <Loader2 className="animate-spin" size={20} /> : null}
          {uploading ? 'Processing & Saving...' : 'Add to My Workspace'}
        </button>
      </div>

    </div>
  )
}
