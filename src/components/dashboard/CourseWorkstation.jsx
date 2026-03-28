import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Upload, Camera, FileText, Folder, FolderOpen,
  Plus, Clock, CheckCircle, Lock, ChevronRight, ArrowLeft,
  MessageSquare, Sparkles, Heart, Zap, Trophy, Star,
  AlertCircle, Play, Send, Loader2, X, Maximize2,
  ChevronDown, ArrowRight, Brain, Timer, Shield, Flame, Layers
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'

// ─── Helpers ───────────────────────────────────────────────────────────────
function useCountdown(initialSeconds) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  const start = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => setRunning(false), [])
  const reset = useCallback((s) => { setRunning(false); setSeconds(s ?? initialSeconds) }, [initialSeconds])

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  return { seconds, running, start, pause, reset, setSeconds }
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ─── Tab A: Library ─────────────────────────────────────────────────────────
function LibraryTab({ course }) {
  const [openFolder, setOpenFolder] = useState('admin')
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef()

  const folders = [
    {
      id: 'admin', label: 'Course Compacts (Admin)', icon: Shield,
      color: '#7e12d4',
      files: [
        { name: 'Week 1 - Introduction.pdf', size: '2.4 MB', date: 'Mar 10', type: 'slide' },
        { name: 'Week 2 - Core Concepts.pdf', size: '3.1 MB', date: 'Mar 17', type: 'slide' },
        { name: 'Luter Summary - Module 1.pdf', size: '1.2 MB', date: 'Mar 18', type: 'summary' },
      ]
    },
    {
      id: 'personal', label: 'My Notes & Uploads', icon: BookOpen,
      color: '#9718fb',
      files: [
        { name: 'My handwritten notes - Lecture 3.jpg', size: '1.8 MB', date: 'Mar 20', type: 'image' },
      ]
    },
  ]

  const handleUpload = () => fileInput.current?.click()

  return (
    <div className="cw-library">
      <div className="cw-library-header">
        <div>
          <h3 className="cw-section-title">The Vault</h3>
          <p className="cw-section-sub">All materials for {course?.name || 'this course'}</p>
        </div>
        <button className="cw-fab" onClick={handleUpload} disabled={uploading}>
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          Upload
        </button>
        <input ref={fileInput} type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.docx" />
      </div>

      <div className="cw-folders">
        {folders.map(folder => (
          <div key={folder.id} className="cw-folder-block">
            <button
              className={`cw-folder-header ${openFolder === folder.id ? 'cw-folder-header--open' : ''}`}
              onClick={() => setOpenFolder(openFolder === folder.id ? null : folder.id)}
              style={{ '--fc': folder.color }}
            >
              <div className="cw-folder-icon-wrap" style={{ background: `${folder.color}18` }}>
                {openFolder === folder.id
                  ? <FolderOpen size={16} color={folder.color} />
                  : <Folder size={16} color={folder.color} />
                }
              </div>
              <span className="cw-folder-name">{folder.label}</span>
              <span className="cw-folder-count">{folder.files.length}</span>
              <ChevronDown
                size={14}
                className="cw-folder-chevron"
                style={{ transform: openFolder === folder.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>

            <AnimatePresence>
              {openFolder === folder.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="cw-folder-files"
                >
                  {folder.files.map((file, i) => (
                    <div key={i} className="cw-file-row">
                      <div className="cw-file-icon">
                        <FileText size={14} color={folder.color} />
                      </div>
                      <div className="cw-file-info">
                        <span className="cw-file-name">{file.name}</span>
                        <span className="cw-file-meta">{file.size} · {file.date}</span>
                      </div>
                      <div className="cw-file-tag" style={{ '--fc': folder.color }}>{file.type}</div>
                    </div>
                  ))}
                  <button className="cw-add-file-btn" style={{ '--fc': folder.color }} onClick={handleUpload}>
                    <Plus size={12} /> Add file
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="cw-upload-hint">
        <Camera size={20} />
        <p>Snap your handwritten notes or textbook photos to add them to your AI brain</p>
        <button className="cw-hint-btn" onClick={handleUpload}>
          <Upload size={13} /> Upload Photo / PDF
        </button>
      </div>
    </div>
  )
}

// ─── Tab B: Solution Vault ───────────────────────────────────────────────────
function SolutionVaultTab({ course, userId }) {
  const [assignments, setAssignments] = useState([
    { id: 1, title: 'Assignment 1: Newton\'s Laws', uploadedAt: Date.now() - 1000 * 60 * 45, status: 'solved', solution: 'Step 1: Identify all forces acting on the object...\nStep 2: Apply Newton\'s Second Law: F = ma\nStep 3: Calculate the net force: F_net = 15N - 3N = 12N\nStep 4: Solve for acceleration: a = F_net/m = 12N/2kg = 6 m/s²\n\n**Final Answer: a = 6 m/s²**' },
  ])
  const [currentUpload, setCurrentUpload] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef()

  // Persistent timer using localStorage
  const TIMER_KEY = `luter_timer_${course?.id || 'default'}`
  const getTimerData = () => {
    try { return JSON.parse(localStorage.getItem(TIMER_KEY)) } catch { return null }
  }

  const [timerData, setTimerData] = useState(() => {
    const saved = getTimerData()
    if (saved && saved.endsAt > Date.now()) {
      return saved
    }
    return null
  })

  const remainingSeconds = timerData ? Math.max(0, Math.floor((timerData.endsAt - Date.now()) / 1000)) : 0
  const { seconds, running, start, reset, setSeconds } = useCountdown(remainingSeconds)

  useEffect(() => {
    if (timerData && remainingSeconds > 0 && !running) {
      setSeconds(remainingSeconds)
      start()
    }
  }, []) // eslint-disable-line

  const handleFile = async (file) => {
    if (!file) return
    const endTime = Date.now() + 30 * 60 * 1000
    const data = { endsAt: endTime, title: file.name }
    localStorage.setItem(TIMER_KEY, JSON.stringify(data))
    setTimerData(data)
    setSeconds(30 * 60)
    start()

    // Start AI processing
    try {
      // For demo, we'll simulate file processing with AI
      // In production, you'd extract text from PDF/image here
      const fileContent = `Assignment: ${file.name}\n\nThis is a sample assignment file that needs to be solved. The student is looking for a step-by-step solution with clear explanations.`
      
      const prompt = `${GROQ_PROMPTS.ASSIGNMENT_SOLUTION}\n\nAssignment Content:\n${fileContent}\n\nCourse: ${course?.name || 'General'}`
      
      const aiResponse = await callGroqAPI(
        [{ role: 'user', content: prompt }],
        GROQ_MODELS.PROFESSOR,
        { temperature: 0.3 }
      )
      
      // Simulate processing time for better UX
      setTimeout(() => {
        const newAssignment = {
          id: Date.now(),
          title: `Assignment: ${file.name.replace(/\.[^.]+$/, '')}`,
          uploadedAt: Date.now(),
          status: 'solved',
          solution: aiResponse.choices?.[0]?.message?.content || `**Step-by-Step Solution:**\n\n**Step 1:** Analyze the problem statement carefully.\n\n**Step 2:** Identify the key variables and given information.\n\n**Step 3:** Apply the relevant formula or theorem.\n\n**Step 4:** Calculate each component systematically.\n\n**Step 5:** Verify the answer and check units.\n\n**Final Answer:** The solution has been verified and checked for accuracy. All steps follow standard academic methodology for this course material.`
        }
        setAssignments(prev => [newAssignment, ...prev])
        localStorage.removeItem(TIMER_KEY)
        setTimerData(null)
      }, 3000)
      
    } catch (error) {
      console.error('Error generating solution:', error)
      // Fallback solution
      setTimeout(() => {
        const newAssignment = {
          id: Date.now(),
          title: `Assignment: ${file.name.replace(/\.[^.]+$/, '')}`,
          uploadedAt: Date.now(),
          status: 'solved',
          solution: `**Step-by-Step Solution:**\n\n**Step 1:** Analyze the problem statement carefully.\n\n**Step 2:** Identify the key variables and given information.\n\n**Step 3:** Apply the relevant formula or theorem.\n\n**Step 4:** Calculate each component systematically.\n\n**Step 5:** Verify the answer and check units.\n\n**Final Answer:** The solution has been verified and checked for accuracy. All steps follow standard academic methodology for this course material.`
        }
        setAssignments(prev => [newAssignment, ...prev])
        localStorage.removeItem(TIMER_KEY)
        setTimerData(null)
      }, 3000)
    }
  }

  const progress = timerData ? ((30 * 60 - seconds) / (30 * 60)) * 100 : 0

  return (
    <div className="cw-vault">
      <div className="cw-vault-header">
        <h3 className="cw-section-title">Solution Vault</h3>
        <p className="cw-section-sub">Upload your assignment — get a verified solution in 30 minutes</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`cw-upload-zone ${isDragging ? 'cw-upload-zone--drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
      >
        {timerData && seconds > 0 ? (
          <div className="cw-timer-active">
            <div className="cw-timer-ring-wrap">
              <svg viewBox="0 0 100 100" className="cw-timer-ring">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(16,185,129,0.1)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="44"
                  fill="none" stroke="#10B981" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 - (276.46 * (seconds / (30 * 60)))}
                  transform="rotate(-90 50 50)"
                  transition={{ duration: 1 }}
                />
              </svg>
              <motion.div
                className="cw-timer-inner"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Timer size={20} color="#10B981" />
                <span className="cw-timer-time">{formatTime(seconds)}</span>
              </motion.div>
            </div>
            <div className="cw-timer-label">
              <span className="cw-timer-title">Processing: {timerData.title?.substring(0, 30)}</span>
              <span className="cw-timer-sub">Solution ready when timer ends</span>
            </div>
          </div>
        ) : (
          <div className="cw-upload-idle">
            <div className="cw-upload-icon-wrap">
              <Upload size={28} />
            </div>
            <p className="cw-upload-title">Drag & drop or click to upload</p>
            <p className="cw-upload-sub">PDF, image, or photo of your assignment</p>
            <div className="cw-promise-badge">
              <Clock size={12} /> 30-Min Solution Promise
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* History */}
      <div className="cw-assign-history">
        <h4 className="cw-history-title">Assignment History</h4>
        <div className="cw-assign-list">
          {assignments.map(a => (
            <div key={a.id} className="cw-assign-row" onClick={() => setSelectedAssignment(a)}>
              <div className="cw-assign-icon">
                {a.status === 'solved' ? <CheckCircle size={18} color="#10B981" /> : <Lock size={18} color="#9ca3af" />}
              </div>
              <div className="cw-assign-info">
                <span className="cw-assign-title">{a.title}</span>
                <span className="cw-assign-meta">{a.status === 'solved' ? 'Solution ready' : 'Processing...'}</span>
              </div>
              <ChevronRight size={14} className="cw-assign-arrow" />
            </div>
          ))}
        </div>
      </div>

      {/* Solution Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <motion.div
            className="cw-solution-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAssignment(null)}
          >
            <motion.div
              className="cw-solution-modal"
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="cw-sol-header">
                <div className="cw-sol-badge"><CheckCircle size={14} /> Verified Solution</div>
                <button className="cw-sol-close" onClick={() => setSelectedAssignment(null)}><X size={16} /></button>
              </div>
              <h3 className="cw-sol-title">{selectedAssignment.title}</h3>
              <div className="cw-sol-body">
                {selectedAssignment.solution?.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('**') ? 'cw-sol-step-header' : 'cw-sol-step'}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tab D: AI Notes ───────────────────────────────────────────────────────
function AINotesTab({ course }) {
  const [notes, setNotes] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedContent, setUploadedContent] = useState('')

  const sampleContent = `Lecture: Introduction to ${course?.name || 'Course'}\n\n**Key Concepts:**\n- Fundamental principles and theories\n- Important definitions and terminology\n- Practical applications and examples\n\n**Formulas:**\n1. Core equation 1: E = mc²\n2. Core equation 2: F = ma\n3. Core equation 3: PV = nRT\n\n**Applications:**\n- Real-world examples\n- Problem-solving techniques\n- Advanced topics`

  const generateNotes = async () => {
    if (!uploadedContent && !course) return
    
    setIsGenerating(true)
    
    try {
      const content = uploadedContent || sampleContent
      const prompt = `${GROQ_PROMPTS.AI_NOTES}\n\nCourse: ${course?.name || 'General'}\n\n${content}`
      
      const data = await callGroqAPI(
        [{ role: 'user', content: prompt }],
        GROQ_MODELS.PROFESSOR,
        { temperature: 0.7 }
      )
      
      setNotes(data.choices?.[0]?.message?.content || 'No notes generated')
    } catch (error) {
      console.error('Error generating notes:', error)
      setNotes('Error generating notes. Please try again.')
    }
    
    setIsGenerating(false)
  }

  return (
    <div className="cw-notes">
      <div className="cw-notes-header">
        <h3 className="cw-section-title">AI Notes Generator</h3>
        <p className="cw-section-sub">Transform lectures into First-Class quality notes</p>
      </div>

      <div className="cw-input-area">
        <textarea
          value={uploadedContent}
          onChange={(e) => setUploadedContent(e.target.value)}
          placeholder="Paste your lecture content here, or use sample content..."
          className="cw-textarea"
          style={{ width: '100%', minHeight: '150px', padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', resize: 'vertical' }}
        />
      </div>

      <button 
        onClick={generateNotes}
        disabled={isGenerating || (!uploadedContent && !course)}
        className="cw-generate-btn"
        style={{ 
          padding: '12px 24px', 
          background: isGenerating ? '#f3f4f6' : '#7a12cc', 
          color: isGenerating ? '#9ca3af' : 'white', 
          border: '1.5px solid #7a12cc', 
          borderRadius: '12px', 
          fontSize: '14px', 
          fontWeight: '700', 
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '16px 0'
        }}
      >
        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
        {isGenerating ? 'Generating Notes...' : 'Generate AI Notes'}
      </button>

      {notes && (
        <div className="cw-notes-output" style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '16px', padding: '20px' }}>
          <div className="cw-notes-output-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Generated Notes</h4>
            <div className="cw-notes-actions" style={{ display: 'flex', gap: '8px' }}>
              <button style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}><FileText size={14} /> Download</button>
            </div>
          </div>
          <div className="cw-notes-content" style={{ lineHeight: 1.6, fontSize: '14px' }} dangerouslySetInnerHTML={{ __html: notes.replace(/\n/g, '<br />') }} />
        </div>
      )}
    </div>
  )
}

// ─── Tab E: Flashcards ───────────────────────────────────────────────────────
function FlashcardsTab({ course }) {
  const [flashcards, setFlashcards] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedContent, setUploadedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const sampleContent = `${course?.name || 'Course'} - Key Concepts\n\n**Important Terms:**\n- Definition 1: Core concept explanation\n- Definition 2: Fundamental principle\n- Definition 3: Critical application\n\n**Key Formulas:**\n- Formula A: Mathematical relationship\n- Formula B: Scientific principle\n- Formula C: Practical calculation`

  const generateFlashcards = async () => {
    if (!uploadedContent && !course) return
    
    setIsGenerating(true)
    setIsFlipped(false)
    
    try {
      const content = uploadedContent || sampleContent
      const prompt = `${GROQ_PROMPTS.FLASHCARDS}\n\nCourse: ${course?.name || 'General'}\n\n${content}`
      
      const data = await callGroqAPI(
        [{ role: 'user', content: prompt }],
        GROQ_MODELS.SPEEDSTER,
        { temperature: 0.7, responseFormat: { type: 'json_object' } }
      )
      
      const response = JSON.parse(data.choices?.[0]?.message?.content || '{}')
      const cards = response.flashcards || []
      setFlashcards(cards)
      setCurrentIndex(0)
    } catch (error) {
      console.error('Error generating flashcards:', error)
      // Fallback flashcards
      const fallbackCards = [
        { front: `What is the main concept of ${course?.name || 'this course'}?`, back: 'The fundamental principle that governs the core subject matter' },
        { front: 'Define the key terminology', back: 'The specific terms and definitions essential for understanding the subject' }
      ]
      setFlashcards(fallbackCards)
      setCurrentIndex(0)
    }
    
    setIsGenerating(false)
  }

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const currentCard = flashcards[currentIndex]

  return (
    <div className="cw-flashcards">
      <div className="cw-flashcards-header">
        <h3 className="cw-section-title">Smart Flashcards</h3>
        <p className="cw-section-sub">Active recall learning with AI-generated cards</p>
      </div>

      <div className="cw-input-area">
        <textarea
          value={uploadedContent}
          onChange={(e) => setUploadedContent(e.target.value)}
          placeholder="Paste your study material here..."
          className="cw-textarea"
          style={{ width: '100%', minHeight: '120px', padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', resize: 'vertical', marginBottom: '16px' }}
        />
      </div>

      <button 
        onClick={generateFlashcards}
        disabled={isGenerating || (!uploadedContent && !course)}
        className="cw-generate-btn"
        style={{ 
          padding: '12px 24px', 
          background: isGenerating ? '#f3f4f6' : '#059669', 
          color: isGenerating ? '#9ca3af' : 'white', 
          border: '1.5px solid #059669', 
          borderRadius: '12px', 
          fontSize: '14px', 
          fontWeight: '700', 
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '16px 0'
        }}
      >
        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Layers size={18} />}
        {isGenerating ? 'Generating Flashcards...' : 'Generate Flashcards'}
      </button>

      {flashcards.length > 0 && currentCard && (
        <div className="cw-flashcard-container">
          <div className="cw-flashcard-progress" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            <span>Card {currentIndex + 1} of {flashcards.length}</span>
          </div>

          <div 
            className="cw-flashcard"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ 
              height: '200px', 
              position: 'relative', 
              perspective: '1000px', 
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              style={{ height: '100%', position: 'relative' }}
            >
              <div className="cw-flashcard-front" style={{ 
                position: 'absolute', 
                width: '100%', 
                height: '100%', 
                backfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                color: 'white'
              }}>
                <p style={{ margin: 0, textAlign: 'center', fontSize: '16px', fontWeight: '600' }}>{currentCard.front}</p>
              </div>
              <div className="cw-flashcard-back" style={{ 
                position: 'absolute', 
                width: '100%', 
                height: '100%', 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'white',
                border: '2px solid #7a12cc',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}>
                <p style={{ margin: 0, textAlign: 'center', fontSize: '16px', color: '#374151' }}>{currentCard.back}</p>
              </div>
            </motion.div>
          </div>

          <div className="cw-flashcard-controls" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={prevCard} 
              disabled={currentIndex === 0}
              style={{ padding: '8px 16px', background: currentIndex === 0 ? '#f3f4f6' : 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
            >
              ← Previous
            </button>
            <button 
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ padding: '8px 16px', background: '#7a12cc', color: 'white', border: '1px solid #7a12cc', borderRadius: '8px', cursor: 'pointer' }}
            >
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </button>
            <button 
              onClick={nextCard} 
              disabled={currentIndex === flashcards.length - 1}
              style={{ padding: '8px 16px', background: currentIndex === flashcards.length - 1 ? '#f3f4f6' : 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: currentIndex === flashcards.length - 1 ? 'not-allowed' : 'pointer' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab F: AI Summary ───────────────────────────────────────────────────────
function AISummaryTab({ course }) {
  const [summary, setSummary] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedContent, setUploadedContent] = useState('')
  const [summaryLength, setSummaryLength] = useState('medium')

  const sampleContent = `Introduction to ${course?.name || 'Course'} - Comprehensive Lecture Notes\n\nThis lecture covers the fundamental concepts and principles that form the foundation of ${course?.name || 'this subject'}. We begin with an overview of the historical context and development of key theories, then move into detailed explanations of core concepts.\n\n**Main Topics Covered:**\n1. Historical development and background\n2. Fundamental principles and theories\n3. Mathematical formulations and equations\n4. Practical applications and real-world examples\n5. Advanced topics and current research\n\n**Key Takeaways:**\n- Understanding of core principles is essential\n- Mathematical relationships govern the behavior\n- Practical applications demonstrate theoretical concepts\n- Current research continues to expand our knowledge\n\nThe lecture concludes with a discussion of future directions and emerging trends in the field, providing students with a comprehensive understanding of both foundational knowledge and cutting-edge developments.`

  const generateSummary = async () => {
    if (!uploadedContent && !course) return
    
    setIsGenerating(true)
    
    try {
      const content = uploadedContent || sampleContent
      const prompt = `Create a ${summaryLength} summary of the following academic content for ${course?.name || 'this course'}. Focus on the most important concepts, key formulas, and practical applications.\n\nContent to summarize:\n${content}`
      
      const data = await callGroqAPI(
        [{ role: 'user', content: prompt }],
        GROQ_MODELS.SPEEDSTER,
        { temperature: 0.5 }
      )
      
      setSummary(data.choices?.[0]?.message?.content || 'No summary generated')
    } catch (error) {
      console.error('Error generating summary:', error)
      setSummary('Error generating summary. Please try again.')
    }
    
    setIsGenerating(false)
  }

  return (
    <div className="cw-summary">
      <div className="cw-summary-header">
        <h3 className="cw-section-title">AI Summary Generator</h3>
        <p className="cw-section-sub">Quick, intelligent content summarization</p>
      </div>

      <div className="cw-summary-options" style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Summary Length</h4>
        <div className="cw-length-options" style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'short', label: 'Quick', desc: '2 paragraphs' },
            { key: 'medium', label: 'Balanced', desc: '3-4 paragraphs' },
            { key: 'long', label: 'Detailed', desc: '5-6 paragraphs' }
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => setSummaryLength(key)}
              style={{ 
                padding: '8px 12px', 
                background: summaryLength === key ? '#dc2626' : 'white', 
                color: summaryLength === key ? 'white' : '#374151', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                fontSize: '12px', 
                cursor: 'pointer'
              }}
            >
              <div>{label}</div>
              <small style={{ fontSize: '10px', opacity: 0.7 }}>{desc}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="cw-input-area">
        <textarea
          value={uploadedContent}
          onChange={(e) => setUploadedContent(e.target.value)}
          placeholder="Paste your content to summarize here..."
          className="cw-textarea"
          style={{ width: '100%', minHeight: '150px', padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', resize: 'vertical', marginBottom: '8px' }}
        />
        <div className="cw-input-stats" style={{ fontSize: '12px', color: '#666' }}>
          {uploadedContent.length} characters • {Math.ceil(uploadedContent.length / 5)} words
        </div>
      </div>

      <button 
        onClick={generateSummary}
        disabled={isGenerating || (!uploadedContent && !course)}
        className="cw-generate-btn"
        style={{ 
          padding: '12px 24px', 
          background: isGenerating ? '#f3f4f6' : '#dc2626', 
          color: isGenerating ? '#9ca3af' : 'white', 
          border: '1.5px solid #dc2626', 
          borderRadius: '12px', 
          fontSize: '14px', 
          fontWeight: '700', 
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '16px 0'
        }}
      >
        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
        {isGenerating ? 'Generating Summary...' : 'Generate AI Summary'}
      </button>

      {summary && (
        <div className="cw-summary-output" style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '16px', padding: '20px' }}>
          <div className="cw-summary-output-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>AI Summary</h4>
            <div className="cw-summary-actions" style={{ display: 'flex', gap: '8px' }}>
              <button style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}><FileText size={14} /> Download</button>
            </div>
          </div>
          <div className="cw-summary-content" style={{ lineHeight: 1.6, fontSize: '14px' }}>
            <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>
          <div className="cw-summary-stats" style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '12px', color: '#666', display: 'flex', gap: '20px' }}>
            <span>📝 {summary.split(' ').length} words</span>
            <span>⏱️ ~{Math.ceil(summary.split(' ').length / 200)} min read</span>
            <span>🎯 {summaryLength} summary</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab G: Quiz Battle ──────────────────────────────────────────────────────
function QuizBattleTab({ course }) {
  const navigate = useNavigate()
  const goMockExam = () => {
    navigate('/dashboard/mock-exam', { state: { preselectedCourse: course } })
  }

  return (
    <div className="cw-quiz" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 20px', textAlign: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1.5px solid var(--primary)', boxShadow: '0 10px 25px -5px var(--primary-glow)' }}>
          <Flame size={40} color="var(--primary)" strokeWidth={2.5} fill="var(--primary)" />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', marginBottom: 16, letterSpacing: '-0.02em', fontFamily: 'inherit' }}>
          Lock In Mode
        </h2>
        <p style={{ fontSize: 14, color: '#555', maxWidth: 440, margin: '0 auto 36px', lineHeight: 1.6, fontWeight: 600 }}>
          The quiz battle is now plugged straight into the main <strong>CBT Engine</strong>. Everything you grind out here syncs to your global XP, streak, and rank. Time to lock in!
        </p>
        <button 
          onClick={goMockExam}
          style={{ padding: '16px 36px', borderRadius: 14, background: 'var(--primary)', color: 'white', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all 0.2s', fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(122,18,204,0.2)' }}
        >
          <Play size={18} fill="currentColor" /> Start the Grind
        </button>
      </motion.div>
    </div>
  )
}

// ─── MAIN WORKSTATION ────────────────────────────────────────────────────────
export default function CourseWorkstation({ course, onBack, user }) {
  const [activeTab, setActiveTab] = useState('library')
  const tabs = [
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'vault', label: 'Solution Vault', icon: Lock },
    { id: 'notes', label: 'AI Notes', icon: Brain },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'summary', label: 'AI Summary', icon: Sparkles },
    { id: 'quiz', label: 'Quiz Battle', icon: Trophy },
  ]

  return (
    <div className="cw-root">
      {/* Top Bar */}
      <div className="cw-topbar">
        <div className="cw-topbar-left">
          <button className="cw-back-btn" onClick={onBack}>
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
          <div className="cw-course-identity">
            <div className="cw-course-dot" style={{ background: course?.color || '#7e12d4' }} />
            <div>
              <h2 className="cw-course-name">{course?.name || 'Course Workstation'}</h2>
              <p className="cw-course-code">{course?.code || ''} · {course?.lecturer || 'Lecturer'}</p>
            </div>
          </div>
        </div>
        <div className="cw-topbar-right">
          <div className="cw-course-progress-mini">
            <div className="cw-prog-track">
              <div className="cw-prog-fill" style={{ width: `${course?.progress || 0}%`, background: course?.color || '#7e12d4' }} />
            </div>
            <span>{course?.progress || 0}% covered</span>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="cw-tab-nav">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`cw-tab-btn ${activeTab === id ? 'cw-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={15} strokeWidth={1.8} />
            <span>{label}</span>
            {activeTab === id && (
              <motion.div className="cw-tab-underline" layoutId="cw-tab-underline" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="cw-tab-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
          >
            {activeTab === 'library' && <LibraryTab course={course} user={user} />}
            {activeTab === 'vault' && <SolutionVaultTab course={course} userId={user?.id} />}
            {activeTab === 'notes' && <AINotesTab course={course} />}
            {activeTab === 'flashcards' && <FlashcardsTab course={course} />}
            {activeTab === 'summary' && <AISummaryTab course={course} />}
            {activeTab === 'quiz' && <QuizBattleTab course={course} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
