import React, { useState, useEffect } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { uploadAdminMaterial } from '../../services/semesterNotesService'
import { supabase } from '../../supabaseClient'
import { CloudArrowUp, FileText, CheckCircle, Warning, CircleNotch, CaretLeft } from '@phosphor-icons/react'

export default function LuterAdminUploadPage() {
  const { user } = useOutletContext()
  const [searchParams] = useSearchParams()
  const [file, setFile] = useState(null)
  const [courseId, setCourseId] = useState(searchParams.get('courseId') || '')
  const [title, setTitle] = useState('')
  const [week, setWeek] = useState('1')
  const [type, setType] = useState('pdf')
  const [uploading, setUploading] = useState(false)
  const [courses, setCourses] = useState([])
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    const { data } = await supabase.from('courses').select('id, name, code')
    if (data) setCourses(data)
  }

  const handleUpload = async () => {
    if (!file || !courseId || !title) {
      setStatus({ type: 'error', message: 'Please fill out all fields.' })
      return
    }
    setUploading(true)
    setStatus(null)
    
    try {
      await uploadAdminMaterial({ 
        file, 
        courseId, 
        weekNumber: parseInt(week),
        title, 
        type: type, // 'pdf' or 'assignment'
        learningObjectives: [],
        academicYear: '2023/2024',
        semesterNumber: 1,
        sharingScope: 'course'
      })
      setStatus({ type: 'success', message: 'Material uploaded and processed successfully!' })
      setFile(null)
      setTitle('')
    } catch (err) {
      console.error('Upload failed:', err)
      setStatus({ type: 'error', message: 'Upload failed. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Outfit' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A102D', marginBottom: '8px' }}>Content Management</h1>
        <p style={{ color: '#718096' }}>Upload study materials, assignments, and curriculum content.</p>
      </div>

      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1.5px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: '#4A5568' }}>Select Course</label>
            <select 
              value={courseId} 
              onChange={e => setCourseId(e.target.value)}
              style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Outfit' }}
            >
              <option value="">Choose a course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: '#4A5568' }}>Content Title</label>
            <input 
              type="text" 
              placeholder="e.g. Introduction to Thermodynamics" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Outfit' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: '#4A5568' }}>Curriculum Week</label>
            <input 
              type="number" 
              min="1" 
              max="52" 
              value={week} 
              onChange={e => setWeek(e.target.value)} 
              style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Outfit' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: '#4A5568' }}>Content Type</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)}
              style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'Outfit' }}
            >
              <option value="pdf">Study Material (PDF)</option>
              <option value="assignment">Official Assignment</option>
              <option value="note">Reference Note</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ fontSize: '14px', fontWeight: 700, color: '#4A5568', display: 'block', marginBottom: '8px' }}>Upload File</label>
          <div 
            style={{ 
              border: '2px dashed #CBD5E0', 
              borderRadius: '16px', 
              padding: '40px', 
              textAlign: 'center', 
              background: '#F8FAFC',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <input 
              id="file-upload"
              type="file" 
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files[0])} 
            />
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#7a12cc' }}>
                <FileText size={32} />
                <span style={{ fontWeight: 600 }}>{file.name}</span>
              </div>
            ) : (
              <div>
                <CloudArrowUp size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
                <p style={{ color: '#718096', fontWeight: 500 }}>Click to select or drag and drop your file</p>
                <p style={{ color: '#94A3B8', fontSize: '12px', marginTop: '4px' }}>PDF, DOCX, or PPTX (Max 20MB)</p>
              </div>
            )}
          </div>
        </div>

        {status && (
          <div style={{ 
            padding: '16px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: status.type === 'success' ? '#F5F3FF' : '#FEF2F2',
            color: status.type === 'success' ? '#7a12cc' : '#DC2626',
            border: `1px solid ${status.type === 'success' ? '#DDD6FE' : '#FECACA'}`,
            fontSize: '14px',
            fontWeight: 500
          }}>
            {status.type === 'success' ? <CheckCircle size={18} /> : <Warning size={18} />}
            {status.message}
          </div>
        )}

        <button 
          onClick={handleUpload} 
          disabled={uploading || !file || !courseId}
          style={{ 
            width: '100%', 
            padding: '16px', 
            borderRadius: '14px', 
            background: '#7a12cc', 
            color: 'white', 
            fontSize: '16px', 
            fontWeight: 700, 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 10px 20px rgba(122, 18, 204, 0.2)',
            opacity: (uploading || !file || !courseId) ? 0.6 : 1,
            transition: 'all 0.2s'
          }}
        >
          {uploading ? (
            <>
              <CircleNotch className="animate-spin" size={20} />
              Processing Content...
            </>
          ) : (
            <>
              <CloudArrowUp size={20} />
              Publish Content
            </>
          )}
        </button>
      </div>
    </div>
  )
}
