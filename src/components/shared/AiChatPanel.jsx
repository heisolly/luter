import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trash, Clock, Crown, X, MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react';
import { ArrowRight, Sparkle, CircleNotch, PaperPlaneRight, CaretDown, CaretUp, User as UserIcon } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThinkingIndicator } from '../ui/thinking-indicator';
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS, transcribeAudioGroq } from '../../groqClient';
import { callMistralAPI, MISTRAL_MODELS } from '../../mistralClient';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Typing } from '../ui/Typing';
import { VoiceWave } from '../ui/VoiceWave';
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService';

const HISTORY_KEY = 'luter-ai-chat-history'
const MAX_SESSIONS = 20

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveSession(messages, id) {
  if (!messages.length) return
  const sessions = loadHistory()
  const sessionId = id || `chat-${Date.now()}`
  const firstUser = messages.find(m => m.role === 'user')
  const newSession = {
    id: sessionId,
    title: firstUser?.content?.slice(0, 60) || 'Chat',
    messages,
    createdAt: new Date().toISOString(),
  }
  const existing = sessions.findIndex(s => s.id === sessionId)
  let updated
  if (existing >= 0) {
    updated = [...sessions]
    updated[existing] = newSession
  } else {
    updated = [newSession, ...sessions].slice(0, MAX_SESSIONS)
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  return updated
}
export function AiChatPanel({ isOpen, onClose, mode, setMode, editor, currentNoteId, panelWidth, setPanelWidth, user, profile, hideWrapper }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aiModeType, setAiModeType] = useState('Default')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState(loadHistory)
  const [conversationId] = useState(() => {
    try { return crypto.randomUUID() }
    catch { return Math.random().toString(36).substring(2) + Date.now().toString(36) }
  })

  // Detect standalone /ai-chat route — no nav to notes, no close/widget buttons
  const location = useLocation()
  const isStandaloneChat = location.pathname.includes('/ai-chat')

  // Read workstation material context (set by WorkstationPage before navigating here)
  const [wsContext, setWsContext] = useState(() => {
    try {
      const raw = sessionStorage.getItem('luter-ws-ai-context')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  // Check periodically or when opening for updated sessionStorage (since AiChatPanel might mount before material loads)
  useEffect(() => {
    const checkContext = () => {
      try {
        const raw = sessionStorage.getItem('luter-ws-ai-context');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.text && parsed.text !== wsContext?.text) {
            setWsContext(parsed);
            setContextEnabled(true);
          }
        }
      } catch {}
    };
    checkContext();
    const interval = setInterval(checkContext, 2000);
    return () => clearInterval(interval);
  }, [wsContext?.text]);

  // Context is only available when: inside notes editor (editor exists) OR workstation material was passed
  const hasRealContext = Boolean(editor) || Boolean(wsContext?.text)
  const contextLabel = wsContext?.title
    ? `📎 ${wsContext.title.slice(0, 40)}${wsContext.title.length > 40 ? '…' : ''}`
    : editor
      ? 'Current page'
      : null

  // Default context ON only when there's real context to attach
  const [contextEnabled, setContextEnabled] = useState(hasRealContext)
  
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  // Save current chat session when navigating away / starting new
  const startNewChat = () => {
    if (messages.length > 0) {
      const updated = saveSession(messages, conversationId)
      if (updated) setChatHistory(updated)
    }
    setMessages([])
    setHistoryOpen(false)
  }

  const loadSession = (session) => {
    if (messages.length > 0) saveSession(messages, conversationId)
    setMessages(session.messages)
    setHistoryOpen(false)
  }

  const deleteSession = (e, sessionId) => {
    e.stopPropagation()
    const updated = chatHistory.filter(s => s.id !== sessionId)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    setChatHistory(updated)
  }

  // --- Voice Input Logic ---
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const toggleVoiceInput = async (e) => {
    e.preventDefault();
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          setAudioStream(null);
          
          try {
            const text = await transcribeAudioGroq(audioBlob);
            if (text && textareaRef.current) {
               const currentVal = textareaRef.current.value;
               const newVal = currentVal ? `${currentVal} ${text}` : text;
               textareaRef.current.value = newVal;
               growTextarea();
            }
          } catch (err) {
            console.error("Audio transcription failed", err);
          }
        };
        
        mediaRecorder.start();
        setIsRecording(true);
        setAudioStream(stream);
      } catch (err) {
        console.error("Microphone access denied or error:", err);
        alert("Microphone access is required for dictation.");
      }
    }
  };
  
  const quickActions = [
    { label: 'Summarize this document', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg> },
    { label: 'Extract key concepts', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
    { label: 'Explain this to a beginner', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { label: 'Generate flashcards', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
  ]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save session on unmount
  useEffect(() => {
    return () => {
      if (messages.length > 0) saveSession(messages, conversationId)
    }
  }, [messages, conversationId])

  // Dragging logic
  const isDragging = useRef(false)
  
  const handleMouseDown = (e) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.classList.add('ns-dragging')
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return
      // Calculate new width: viewport width - mouse X
      const newWidth = Math.max(280, Math.min(window.innerWidth - e.clientX, 800))
      setPanelWidth(newWidth)
    }
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = 'default'
        document.body.classList.remove('ns-dragging')
      }
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [setPanelWidth])

  const handleSetMode = (newMode) => {
    setMode(newMode)
    setMenuOpen(false)
    // Only navigate when inside the Notes editor, never on the standalone /ai-chat page
    if (!isStandaloneChat) {
      if (newMode === 'fullscreen') navigate(`/ai-chat?note=${currentNoteId}`)
      else navigate(`/notes/editor?note=${currentNoteId}`)
    }
  }

  const handleClose = () => {
    // On standalone /ai-chat there is no close â€” nothing to navigate back to
    if (isStandaloneChat) return
    if (mode === 'fullscreen') {
      navigate(`/notes/editor?note=${currentNoteId}`)
      setMode('sidebar')
    }
    onClose()
  }

  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest('.ns-ai-layout-menu-wrap')) setMenuOpen(false)
      if (!e.target.closest('.ns-ai-settings-wrap') && !e.target.closest('.ns-ai-input-settings-btn')) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', content: text, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    const shouldEditDocument = contextEnabled && editor && promptShouldEditDocument(text)
    const placeholderText = `Luter AI is working on: ${text.slice(0, 64)}${text.length > 64 ? '...' : ''}`
    
    try {
      const cost = CREDIT_COSTS.NOTES_AI_CHAT
      const { ok } = await checkAndDeductCredits(user?.id, cost, profile?.is_premium)
      if (!ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: "You've used up your AI credits for today. They reset daily â€” come back tomorrow or upgrade to Pro for more!", id: Date.now() + 1 }])
        setLoading(false)
        return
      }

      if (shouldEditDocument) {
        editor.chain().focus('end').insertContent(`<blockquote><p>${escapeHtml(placeholderText)}</p></blockquote>`).run()
      }

      // Build context from editor
      let contextStr = ''
      if (contextEnabled && editor) {
        const textContent = editor.getText()
        if (textContent.trim()) {
          contextStr = `\n\n--- DOCUMENT CONTEXT ---\n${textContent.slice(0, 10000)}\n------------------------\nUser is currently editing this document. You may use the entire note as context.`
        }
      }

      // Also pick up workstation material context (set by WorkstationPage before navigating)
      if (!contextStr && contextEnabled) {
        try {
          const wsCtx = sessionStorage.getItem('luter-ws-ai-context')
          if (wsCtx) {
            const { title: matTitle, text: matText } = JSON.parse(wsCtx)
            if (matText) {
              contextStr = `\n\n--- STUDY MATERIAL: ${matTitle || 'Uploaded material'} ---\n${matText.slice(0, 10000)}\n---\nUse this material as context when answering.`
            }
          }
        } catch {}
      }
      
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const finalMsg = { role: 'user', content: shouldEditDocument ? getDocumentAiPrompt(text, editor) : text + contextStr };

      let aiResponse;
      if (aiModeType === 'Smart Tutor') {
        const tools = [
          {
            type: "function",
            function: {
              name: "generate_flashcards",
              description: "Generate flashcards from the student's text to test their knowledge.",
              parameters: {
                type: "object",
                properties: {
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" }
                      },
                      required: ["question", "answer"]
                    }
                  }
                },
                required: ["flashcards"]
              }
            }
          }
        ];
        aiResponse = await callMistralAPI([...history, finalMsg], MISTRAL_MODELS.LARGE, { temperature: 0.7, tools });
      } else {
        aiResponse = await callGroqAPI([...history, finalMsg], GROQ_MODELS.PROFESSOR, { temperature: 0.7 });
      }

      const responseMessage = aiResponse?.choices?.[0]?.message;
      let responseText = responseMessage?.content || "I'm sorry, I couldn't process that.";

      if (responseMessage?.tool_calls?.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        if (toolCall.function.name === 'generate_flashcards') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const flashcardMarkdown = args.flashcards.map(f => `**Q: ${f.question}**\n*A: ${f.answer}*`).join('\n\n---\n\n');
            responseText = (responseText && responseText !== "I'm sorry, I couldn't process that." ? responseText + '\n\n' : '') + `I created some flashcards for you to study!\n\n${flashcardMarkdown}`;
          } catch (e) {
            console.error("Failed to parse Mistral tool arguments", e);
          }
        }
      }

      if (shouldEditDocument) {
        const range = findTextRange(editor, placeholderText)
        const contentHtml = markdownToEditorHtml(responseText)
        if (range) {
          editor.chain().focus().insertContentAt(range, contentHtml).run()
        } else {
          editor.chain().focus('end').insertContent(contentHtml).run()
        }
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: shouldEditDocument ? 'Done. I updated the note so everyone in the room can see the new content live.' : responseText,
        id: Date.now() + 1,
      }])
    } catch (err) {
      console.error(err)
      if (shouldEditDocument) {
        const range = findTextRange(editor, placeholderText)
        if (range) {
          editor.chain().focus().insertContentAt(range, '<p>Luter AI could not finish this edit. Please try again.</p>').run()
        }
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oops, an error occurred while connecting to the AI.",
        id: Date.now() + 1,
      }])
    } finally {
      setLoading(false)
    }
  }

  const insertToNote = (text) => {
    let html = text
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*?<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
      .split(/\n\n+/)
      .map(p => {
        if (p.startsWith('<h') || p.startsWith('<ul')) return p;
        return `<p>${p.replace(/\n/g, '<br/>')}</p>`
      })
      .join('\n')

    editor?.chain().focus().insertContent(html).run()
  }

  const isFullscreen = mode === 'fullscreen'
  const hasMessages = messages.length > 0

  // Suggested actions for fullscreen two-column layout
  const suggestedActions = [
    { label: 'Write meeting agenda', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { label: 'Analyze PDFs or images', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
    { label: 'Create a task tracker', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  ]

  // textarea ref lives at panel level â€” single source of truth for input value
  // Using UNCONTROLLED textarea to avoid React re-render cursor corruption
  const textareaRef = useRef(null)

  // Auto-grow height via ref â€” no state involved
  const growTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const handleTextareaInput = (e) => {
    growTextarea()
    // We only need the value when sending â€” do NOT call setInput here
    // to prevent controlled re-render cursor corruption
  }

  const handleTextareaKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const text = textareaRef.current?.value || ''
      if (!text.trim()) return
      sendMessage(text)
      // Clear textarea directly and reset height
      if (textareaRef.current) {
        textareaRef.current.value = ''
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  // Also update sendMessage to read from ref when called via suggestion chips
  const handleSendFromRef = () => {
    const text = textareaRef.current?.value || ''
    if (!text.trim()) return
    sendMessage(text)
    if (textareaRef.current) {
      textareaRef.current.value = ''
      textareaRef.current.style.height = 'auto'
    }
  }

  // The shared input block
  const InputBlock = ({ isBottom = false }) => (
    <div className={`ns-ai-input-container${isBottom ? ' is-bottom' : ''}`}>
      <div className="ns-ai-input-top">
        {contextEnabled && contextLabel ? (
          <span className="ns-ai-new-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            {contextLabel}
            <button className="ns-ai-badge-close" onClick={() => setContextEnabled(false)}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
        ) : (
          <button className="ns-ai-add-context-btn" onClick={() => setContextEnabled(true)}>
            + Add context
          </button>
        )}
      </div>

      {isRecording ? (
        <VoiceWave isRecording={isRecording} stream={audioStream} />
      ) : (
        <textarea
          ref={textareaRef}
          className="ns-ai-input"
          defaultValue=""
          onChange={handleTextareaInput}
          onKeyDown={handleTextareaKey}
          placeholder="Do anything with AI..."
          rows={1}
        />
      )}

      <div className="ns-ai-input-bottom">
        <div className="ns-ai-input-tools">
          <button 
            title="Voice input" 
            onClick={toggleVoiceInput}
            style={{
              color: isRecording ? '#EF4444' : undefined
            }}
          >
            {isRecording ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            )}
          </button>
          <button>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <div className="ns-ai-settings-dropdown">
            <button className={`ns-ai-input-settings-btn ${settingsOpen ? 'active' : ''}`} onClick={() => setSettingsOpen(!settingsOpen)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            </button>
            {settingsOpen && (
              <div className="ns-ai-settings-wrap">
                <div className="ns-set-item">
                  <div className="ns-set-label">Web access</div>
                  <div className="ns-set-toggle active"><div className="ns-set-knob"/></div>
                </div>
                <div className="ns-set-divider"/>
                <div className="ns-set-item" onClick={() => setAiModeType(aiModeType === 'Default' ? 'Smart Tutor' : 'Default')}>
                  <div className="ns-set-label">Mode</div>
                  <span className="ns-set-val">{aiModeType} {'>'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {!isRecording && (
          <div className="ns-ai-input-actions">
            <span className="ns-ai-auto-text">{aiModeType === 'Default' ? 'Auto' : aiModeType}</span>
            <button className="ns-ai-submit-btn" onClick={handleSendFromRef} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (!isOpen && mode !== 'fullscreen') return null;

  return (
    <aside
      className={`ns-ai-panel mode-${mode}${hasMessages ? ' has-messages' : ''}`}
      style={hideWrapper ? { flex: 1, border: 'none', background: 'transparent' } : (mode === 'sidebar' ? { width: panelWidth } : {})}
    >
      {/* Drag Handle */}
      {mode === 'sidebar' && (
        <div className="ns-ai-drag-handle" onMouseDown={handleMouseDown} />
      )}

      {/* ── Header ── */}
      {!hideWrapper && (
        <div className="ns-ai-panel-header">
          <div className="ns-ai-top-left">
            <span className="ns-ai-title">New AI chat</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div className="ns-ai-top-right">
          {/* History button â€” always visible */}
          <button className="ns-ai-icon-btn" title="Chat history" onClick={() => setHistoryOpen(v => !v)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M3 21h18"/></svg>
          </button>
          {/* New chat button â€” always visible */}
          <button className="ns-ai-icon-btn" title="New chat" onClick={startNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="10" y1="11" x2="14" y2="11"/></svg>
          </button>

          {/* Layout switcher + Close â€” only shown inside the Notes editor, not on /ai-chat */}
          {!isStandaloneChat && (
            <>
              <div className="ns-ai-layout-menu-wrap">
                <button className={`ns-ai-icon-btn ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
                  {mode === 'sidebar'    && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>}
                  {mode === 'floating'   && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="14" y="14" width="5" height="5" rx="1"/></svg>}
                  {mode === 'fullscreen' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>}
                </button>
                {menuOpen && (
                  <div className="ns-ai-layout-menu">
                    <button onClick={() => handleSetMode('sidebar')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                      Sidebar {mode === 'sidebar' && <span className="ns-ai-check">âœ“</span>}
                    </button>
                    <button onClick={() => handleSetMode('floating')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="14" y="14" width="5" height="5" rx="1"/></svg>
                      Floating {mode === 'floating' && <span className="ns-ai-check">âœ“</span>}
                    </button>
                    <button onClick={() => handleSetMode('fullscreen')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                      Full screen {mode === 'fullscreen' && <span className="ns-ai-check">âœ“</span>}
                    </button>
                  </div>
                )}
              </div>
              <button className="ns-ai-icon-btn close-btn" title="Close" onClick={handleClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              </button>
            </>
          )}
        </div>
      </div>
      )}

      {/* History Panel */}
      {historyOpen && (
        <div className="ns-ai-history-panel">
          <div className="ns-ai-history-header">
            <span>Chat History</span>
            <button onClick={() => setHistoryOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {chatHistory.length === 0 ? (
            <div className="ns-ai-history-empty">No past chats yet</div>
          ) : (
            <div className="ns-ai-history-list">
              {chatHistory.map(session => (
                <div key={session.id} className="ns-ai-history-item" onClick={() => loadSession(session)}>
                  <div className="ns-ai-history-title">{session.title}</div>
                  <div className="ns-ai-history-meta">{new Date(session.createdAt).toLocaleDateString()}</div>
                  <button className="ns-ai-history-del" onClick={(e) => deleteSession(e, session.id)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ FULLSCREEN EMPTY STATE â€” centered Notion AI style â”€â”€ */}
      {isFullscreen && !hasMessages ? (
        <div className="ns-ai-messages">
          <div className="ns-ai-empty-state">
              <div className="ns-ai-mascot">
                <img src="/mascot.png" alt="AI Mascot" width={64} height={64} />
              </div>
            <h3>What magic shall we make happen?</h3>

            {/* Input â€” centered, prominent */}
            <InputBlock />

            {/* Two-column grid */}
            <div className="ns-ai-quick-grid">
              <div>
                <div className="ns-ai-quick-col-header">Recent chats</div>
                {chatHistory.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9CA3AF', padding: '2px 6px' }}>No recent chats yet</p>
                ) : (
                  chatHistory.slice(0, 3).map(session => (
                    <button key={session.id} className="ns-ai-quick-action" onClick={() => loadSession(session)}>
                      <span className="ns-ai-quick-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.title}</span>
                    </button>
                  ))
                )}
              </div>
              <div>
                <div className="ns-ai-quick-col-header">Suggested</div>
                {suggestedActions.map(a => (
                  <button key={a.label} className="ns-ai-quick-action" onClick={() => sendMessage(a.label)}>
                    <span className="ns-ai-quick-icon">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* â”€â”€ NORMAL / CONVERSATION view â”€â”€ */
        <>
          <div className={`ns-ai-messages${hasMessages ? ' has-messages' : ''}`}>
            {!isFullscreen && messages.length === 0 && (
              <div className="ns-ai-empty-state">
                <div className="ns-ai-mascot-wrap">
                  <img src="/mascot.png" alt="Luter Mascot" className="ns-ai-mascot" />
                </div>
                <h3>What magic shall we make happen?</h3>
                <div className="ns-ai-quick-grid">
                  {quickActions.map(a => (
                    <button key={a.label} className="ns-ai-quick-action" onClick={() => sendMessage(a.label)}>
                      <span className="ns-ai-quick-icon">{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`ns-ai-msg ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <img src="/mascot.png" className="ns-ai-msg-avatar" alt="AI" />
                )}
                <div className="ns-ai-msg-bubble">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : msg.content}
                  {msg.role === 'assistant' && editor && !isFullscreen && aiModeType !== 'Ask' && (
                    <button className="ns-ai-insert-btn" onClick={() => insertToNote(msg.content)}>+ Insert</button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ns-ai-msg assistant">
                <img src="/mascot.png" className="ns-ai-msg-avatar" alt="AI" />
                <div className="ns-ai-msg-bubble" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                  <ThinkingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <InputBlock isBottom={isFullscreen} />
        </>
      )}
    </aside>
  )
}

// â”€â”€â”€ Share Dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ShareDropdown({ roomId, onClose }) {
  const [copied, setCopied] = useState(false)
  const shortId = roomId.split(':').pop()
  
  // Construct the absolute share URL with the exact note ID
  const shareUrl = `${window.location.origin}/dashboard/notes/editor?note=${shortId}&shared=1`

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(shareUrl) } catch { }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('.ns-share-wrap')) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="ns-share-dropdown">
      <div className="ns-share-header">
        <strong>Share & Collaborate</strong>
        <p>Anyone with this link can join and edit in real time.</p>
      </div>
      <div className="ns-share-room-id">
        <span className="ns-share-room-label">Room ID</span>
        <code className="ns-share-room-code">{shortId}</code>
      </div>
      <div className="ns-share-link-row">
        <input className="ns-share-link-input" value={shareUrl} readOnly />
        <button className={`ns-share-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          {copied ? 'âœ“ Copied' : 'Copy'}
        </button>
      </div>
      <div className="ns-share-hint">
        Share this link with classmates to collaborate in real time via Liveblocks.
      </div>
    </div>
  )
}

function NotesLiveCursors() {
  const others = useOthers()

  return (
    <div className="ns-live-cursors" aria-hidden="true">
      {others.map((other) => {
        const cursor = other.presence?.cursor
        if (!cursor) return null

        const user = other.presence?.user || {}
        const color = user.color || '#7C3AED'

        return (
          <div
            key={other.connectionId}
            className="ns-live-cursor"
            style={{
              transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
              '--cursor-color': color,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 3L18 11.2L11.4 12.7L8.2 18.7L4 3Z" fill={color} stroke="white" strokeWidth="1.4" />
            </svg>
            <span className="ns-live-cursor-name">{user.name || 'Peer'}</span>
            {other.presence?.cursorChat && (
              <span className="ns-live-cursor-chat">{other.presence.cursorChat}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function NotesCommentNotifications({ threads, onOpenComments }) {
  const [toasts, setToasts] = useState([])
  const seenRef = useRef(new Set())
  const initializedRef = useRef(false)

  useEffect(() => {
    const currentThreadIds = new Set((threads || []).map((thread) => thread.id))

    if (!initializedRef.current) {
      seenRef.current = currentThreadIds
      initializedRef.current = true
      return
    }

    const newThreads = (threads || []).filter((thread) => !seenRef.current.has(thread.id))
    if (newThreads.length) {
      newThreads.forEach((thread) => seenRef.current.add(thread.id))
      setToasts((prev) => [
        ...newThreads.map((thread) => ({
          id: thread.id,
          title: 'New comment',
          body: 'A collaborator added a note comment.',
        })),
        ...prev,
      ].slice(0, 3))
    }

    seenRef.current = currentThreadIds
  }, [threads])

  useEffect(() => {
    if (!toasts.length) return undefined
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1))
    }, 4500)
    return () => window.clearTimeout(timer)
  }, [toasts])

  if (!toasts.length) return null

  return (
    <div className="ns-comment-toasts">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className="ns-comment-toast"
          onClick={() => {
            onOpenComments?.()
            setToasts((prev) => prev.filter((item) => item.id !== toast.id))
          }}
        >
          <span className="ns-comment-toast-icon">#</span>
          <span>
            <strong>{toast.title}</strong>
            <small>{toast.body}</small>
          </span>
        </button>
      ))}
    </div>
  )
}

function NotesCommentsPanel({ open, threads = [], onClose }) {
  if (!open) return null

  const openThreads = threads.filter((thread) => !thread.resolved)
  const resolvedThreads = threads.filter((thread) => thread.resolved)

  return (
    <aside className="ns-comments-panel">
      <div className="ns-comments-head">
        <div>
          <strong>Comments</strong>
          <span>{openThreads.length} open</span>
        </div>
        <button type="button" className="ns-icon-close" onClick={onClose} aria-label="Close comments">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="ns-comments-hint">
        Highlight text and use the comment button in the floating toolbar to anchor a new thread.
      </div>

      <div className="ns-comments-list">
        {!threads.length && (
          <div className="ns-comments-empty">
            <strong>No comments yet</strong>
            <span>Threads created in this note will appear here live.</span>
          </div>
        )}
        {openThreads.map((thread) => (
          <Thread key={thread.id} thread={thread} />
        ))}
        {!!resolvedThreads.length && (
          <details className="ns-resolved-comments">
            <summary>{resolvedThreads.length} resolved</summary>
            {resolvedThreads.map((thread) => (
              <Thread key={thread.id} thread={thread} />
            ))}
          </details>
        )}
      </div>
    </aside>
  )
}
