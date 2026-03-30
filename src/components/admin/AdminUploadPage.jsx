import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { uploadMaterial } from '../../services/materialsService'

export default function AdminUploadPage() {
  const { user } = useOutletContext()
  const [file, setFile] = useState(null)
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!file || !courseId || !title) {
      alert('Please fill out all fields.')
      return
    }
    setUploading(true)
    try {
      await uploadMaterial({ file, courseId, userId: user.id, title, type: 'docx' })
      alert('Assignment uploaded successfully!')
      setFile(null)
      setCourseId('')
      setTitle('')
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '40px' }}>
      <h1>Admin Assignment Upload</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
        <input type="text" placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} />
        <input type="text" placeholder="Assignment Title" value={title} onChange={e => setTitle(e.target.value)} />
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Assignment'}
        </button>
      </div>
    </div>
  )
}
