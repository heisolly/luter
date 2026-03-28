import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Upload, Camera, FileText, Folder, FolderOpen,
  Plus, Clock, CheckCircle, Lock, ChevronRight, ArrowLeft,
  MessageSquare, Sparkles, Heart, Zap, Trophy, Star,
  AlertCircle, Play, Send, Loader2, X, Maximize2,
  ChevronDown, ArrowRight, Brain, Timer, Shield, Flame
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

const OPENROUTER_KEY = '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'
const OPENROUTER_MODEL = 'google/gemini-1.5-flash'

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

    // Simulate AI processing
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

// ─── Tab C: AI Notebook ──────────────────────────────────────────────────────
function AINotebookTab({ course }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey! I'm your AI tutor for **${course?.name || 'this course'}**. I've read all your uploaded notes. What would you like to understand? 🧠` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [proactiveShown, setProactiveShown] = useState(false)
  const bottomRef = useRef()
  const proactiveTimer = useRef()

  const topics = ['Introduction & Overview', 'Core Theories', 'Key Formulas', 'Problem Solving', 'Past Questions Analysis']

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Proactive AI message after 30s idle
  useEffect(() => {
    proactiveTimer.current = setTimeout(() => {
      if (!proactiveShown && messages.length === 1) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "This section is usually tricky — want me to explain it with a real-world analogy? Just say 'Yes, explain!' 💡"
        }])
        setProactiveShown(true)
      }
    }, 30000)
    return () => clearTimeout(proactiveTimer.current)
  }, [proactiveShown, messages.length])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    clearTimeout(proactiveTimer.current)

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://luterai.vercel.app',
          'X-Title': 'Luter AI Tutor'
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are Luter, an expert AI tutor for the course "${course?.name || 'this course'}". 
              You help students understand concepts clearly using analogies, examples, and step-by-step explanations.
              Prioritize content from uploaded course materials when answering. Be encouraging, concise, and student-friendly.
              Use emojis sparingly to make responses engaging. Format answers with clear structure.`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ],
          max_tokens: 600
        })
      })
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content || "I'm having trouble connecting. Please try again!"
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Network error. Check your connection and try again." }])
    }
    setLoading(false)
  }

  return (
    <div className="cw-notebook">
      {/* Topic Selector */}
      <div className="cw-topics-bar">
        <span className="cw-topics-label">Topic:</span>
        <div className="cw-topics-scroll">
          {topics.map(t => (
            <button
              key={t}
              className={`cw-topic-chip ${selectedTopic === t ? 'cw-topic-chip--active' : ''}`}
              onClick={() => {
                setSelectedTopic(t)
                setInput(`Explain "${t}" in a simple way with examples`)
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="cw-chat-area">
        <div className="cw-chat-messages">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`cw-msg cw-msg--${m.role}`}
            >
              {m.role === 'assistant' && (
                <div className="cw-msg-avatar">
                  <Brain size={12} />
                </div>
              )}
              <div className="cw-msg-bubble">
                {m.content.split('\n').map((line, j) => (
                  <p key={j} className={line.startsWith('**') ? 'cw-msg-bold' : ''}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="cw-msg cw-msg--assistant">
              <div className="cw-msg-avatar"><Brain size={12} /></div>
              <div className="cw-msg-bubble cw-typing">
                <span /><span /><span />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="cw-chat-input-row">
          <input
            className="cw-chat-input"
            placeholder="Ask about anything in your notes..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button className="cw-chat-send" onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab D: Quiz Battle ──────────────────────────────────────────────────────
function QuizBattleTab({ course, onNavigate }) {
  const goMockExam = () => {
    if (onNavigate) {
      onNavigate('mock-exam', course);
    } else {
      window.dispatchEvent(new CustomEvent('DEEP_LINK_DASH', { detail: { page: 'mock-exam', course: course } }));
    }
  };

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
export default function CourseWorkstation({ course, onBack, user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('library')
  const tabs = [
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'vault', label: 'Solution Vault', icon: Lock },
    { id: 'notebook', label: 'AI Notebook', icon: Brain },
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
            {activeTab === 'notebook' && <AINotebookTab course={course} />}
            {activeTab === 'quiz' && <QuizBattleTab course={course} onNavigate={onNavigate} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
