import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom'
import { uploadMaterial, addYoutubeMaterial } from '../../services/materialsService'
import { supabase } from '../../supabaseClient'
import { 
  RiFileTextFill as FileText, RiPresentationFill as Presentation, RiArchiveFill as FileArchive, RiCommandLine as SearchCode,
  RiMusicFill as Music, RiVideoFill as Video, RiImageFill as ImageIcon, RiLink as Link2, RiYoutubeFill as Youtube,
  RiArchiveDrawerFill as FileBox, RiLoader4Line as Loader2, RiCheckboxCircleFill as CheckCircle2, RiAlertFill as AlertCircle, RiDeleteBin6Fill as Trash2, RiAddLine as Plus, RiPenNibFill as PenTool, RiUploadCloudFill as UploadCloud,
  RiArrowLeftSLine as ChevronLeft
} from 'react-icons/ri'

export default function UserUpload() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const location = useLocation()
  
  const queryParams = new URLSearchParams(location.search)
  const preSelectedCourse = queryParams.get('course_id') || ''
  const preSelectedWeek = queryParams.get('week') ? parseInt(queryParams.get('week')) : null

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(preSelectedCourse)
  const [file, setFile] = useState(null)
  const [linkInput, setLinkInput] = useState('')
  const [textNote, setTextNote] = useState('')
  const [activeInputTab, setActiveInputTab] = useState('files')
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
      navigate(`/dashboard/courses/${selectedCourse}?week=${preSelectedWeek}`)
    } else if (selectedCourse) {
      navigate(`/dashboard/courses/${selectedCourse}`)
    } else {
      navigate('/dashboard/courses') // Navigate to Library/Vault
    }
  }

  const handleUploadSubmit = async () => {
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

        await uploadMaterial({
          file, courseId: selectedCourse || null, userId: user.id,
          title: file.name, type: type, week: preSelectedWeek
        })
        setStatus({ type: 'success', message: 'Resource saved to your vault.' })
        setTimeout(() => navigateToCourse(), 1200)
      } else if (activeInputTab === 'links' && linkInput) {
        let isYoutube = linkInput.includes('youtube.com') || linkInput.includes('youtu.be')
        if (isYoutube) {
          await addYoutubeMaterial({ 
            url: linkInput, courseId: selectedCourse || null, userId: user.id, week: preSelectedWeek
          })
        } else {
          await supabase.from('materials').insert({
             course_id: selectedCourse || null, user_id: user.id,
             title: linkInput, type: linkInput.includes('docs.google.com') ? 'google_doc' : 'link',
             source_url: linkInput, owner_role: 'user', processing_status: 'ready', week_number: preSelectedWeek
          })
        }
        setStatus({ type: 'success', message: 'Link indexed successfully.' })
        setTimeout(() => navigateToCourse(), 1200)
      } else if (activeInputTab === 'notes' && textNote) {
        const title = textNote.split('\n')[0].substring(0, 50) || 'New Note'
        await supabase.from('user_notes').insert({
          user_id: user.id, course_id: selectedCourse || null, title, content: textNote,
          week_number: preSelectedWeek, source_type: 'personal'
        })
        setStatus({ type: 'success', message: 'Research note saved.' })
        setTimeout(() => navigateToCourse(), 1200)
      }
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Transmission failure. Try again.' })
    } finally {
      setUploading(false)
    }
  }

  const hasContent = (activeInputTab === 'files' && file) || 
                    (activeInputTab === 'links' && linkInput.length > 0) ||
                    (activeInputTab === 'notes' && textNote.length > 0)

  return (
    <div className="max-w-4xl mx-auto px-8 py-12 bg-white min-h-full">
      
      {/* ── HEADER ── */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border border-[#f1f1f1] flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">Ingest Material</h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Protocol V2.0 // Resource Management</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ── SELECTION & INPUT ── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-[#f8f9fa] border border-[#f1f1f1] rounded-2xl">
            {[
              { id: 'files', label: 'Files', icon: FileText },
              { id: 'links', label: 'Links', icon: Link2 },
              { id: 'notes', label: 'Notes', icon: PenTool },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveInputTab(tab.id)}
                className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2.5 text-[13px] font-bold transition-all
                  ${activeInputTab === tab.id 
                    ? 'bg-white text-purple-600 shadow-sm border border-[#f1f1f1]' 
                    : 'text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon size={16} strokeWidth={2.5} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="min-h-[360px]">
            {activeInputTab === 'files' && (
              <div 
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]) }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[360px] border-2 border-dashed border-[#e5e7eb] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all group p-8"
              >
                <input type="file" ref={fileInputRef} hidden onChange={e => e.target.files[0] && setFile(e.target.files[0])} />
                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                      <FileText size={32} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 truncate max-w-xs">{file.name}</h3>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button onClick={e => { e.stopPropagation(); setFile(null) }} className="text-red-500 font-bold text-[13px] hover:underline">Discard and change</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <UploadCloud size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Drop study materials</h3>
                    <p className="text-slate-400 font-medium text-[14px]">PDF, Word, or Slide decks supported</p>
                  </div>
                )}
              </div>
            )}

            {activeInputTab === 'links' && (
              <div className="bg-[#f8f9fa] border border-[#f1f1f1] rounded-2xl p-8 h-[360px] flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <Youtube size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900">Resource URL</h3>
                </div>
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={linkInput} 
                  onChange={e => setLinkInput(e.target.value)}
                  className="w-full bg-white border border-[#e5e7eb] rounded-xl px-6 py-5 text-[15px] font-bold text-slate-800 focus:outline-none focus:border-purple-500 transition-all shadow-sm"
                />
                <p className="mt-6 text-[13px] text-slate-400 font-medium leading-relaxed">
                  Luter will automatically index the content of your links for AI analysis and mock exam generation.
                </p>
              </div>
            )}

            {activeInputTab === 'notes' && (
              <div className="h-[360px] flex flex-col">
                <textarea 
                  placeholder="Paste research data or quick lecture notes..."
                  value={textNote} 
                  onChange={e => setTextNote(e.target.value)}
                  className="flex-1 w-full bg-white border border-[#e5e7eb] rounded-2xl px-8 py-8 text-[15px] font-medium leading-relaxed text-slate-800 focus:outline-none focus:border-purple-500 transition-all shadow-sm resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR CONTROLS ── */}
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-6">Target Archive</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Contextual Course</label>
                <select 
                  value={selectedCourse} 
                  onChange={e => setSelectedCourse(e.target.value)}
                  className="w-full bg-white border border-[#e5e7eb] rounded-xl px-4 py-3.5 text-[13px] font-bold text-slate-700 focus:outline-none shadow-sm appearance-none"
                >
                  <option value="">Personal Archive (Standalone)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code}</option>
                  ))}
                </select>
              </div>

              {selectedCourse && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Week Track</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1,2,3,4,5,6,7,8].map(w => (
                      <button 
                        key={w}
                        className={`h-9 rounded-lg border text-[11px] font-black transition-all
                          ${preSelectedWeek === w ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-[#f1f1f1] text-slate-400 hover:border-slate-300'}`}
                      >
                        W{w}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleUploadSubmit}
            disabled={uploading || !hasContent}
            className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl shadow-purple-100 hover:bg-purple-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            {uploading ? 'Processing...' : 'Commit to Vault'}
          </button>

          {status && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl flex items-center gap-3 border
                ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}
            >
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-[13px] font-bold">{status.message}</span>
            </motion.div>
          )}
        </div>

      </div>

    </div>
  )
}
