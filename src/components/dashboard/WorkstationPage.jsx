import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { 
  ArrowLeft, FileText, Brain, Layers, Sparkles, 
  Send, MessageSquare, ChevronRight, ChevronLeft,
  Volume2, Share2, Download, Plus, Loader2,
  HelpCircle, Settings, MoreVertical
} from 'lucide-react'
import LuterLogo from '../shared/LuterLogo'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import { supabase } from '../../supabaseClient'
import { ReadingSpaceProvider, useReadingSpace } from './ReadingSpaceContext'
import { SelectionActionBar } from './WorkstationOverlays'
import MaterialRenderer from './MaterialRenderer'
import './workstation.css'

function WorkstationContent() {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const { user } = useOutletContext()
  const { setViewportData, highlightText, updateSpark, clearHighlights, viewportData, updateSelection } = useReadingSpace()
  
  const [activeTab, setActiveTab] = useState('content')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [courseMaterials, setCourseMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [showTools, setShowTools] = useState(false)
  const [analysisState, setAnalysisState] = useState({
    summary: '',
    notes: '',
    flashcards: [],
    quiz: [],
    loading: false
  })
  
  const [isFlipped, setIsFlipped] = useState(false)
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)

  const toolLinks = [
    { id: 'ai-notes', label: 'Full AI Notes', icon: Brain, path: '/dashboard/ai-notes' },
    { id: 'ai-summary', label: 'Full AI Summary', icon: Sparkles, path: '/dashboard/ai-summary' },
    { id: 'flashcards', label: 'Flashcard Vault', icon: Layers, path: '/dashboard/flashcards' },
    { id: 'ai-quiz', label: 'Knowledge Quiz', icon: HelpCircle, path: '/dashboard/ai-quiz' },
  ]

  useEffect(() => {
    const handleMouseUp = (e) => {
      const sel = window.getSelection()
      const text = sel.toString().trim()
      
      if (text && text.length > 2) {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        updateSelection(text, rect, true)
      } else {
        // If clicking on the selection bar itself, don't hide it immediately
        if (!e.target.closest('.selection-action-bar')) {
          updateSelection('', null, false)
        }
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [updateSelection])

  useEffect(() => {
    if (courseId) {
      fetchMaterials()
    }
  }, [courseId])

  async function fetchMaterials() {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', courseId)
    
    if (data && data.length > 0) {
      setCourseMaterials(data)
      setSelectedMaterial(data[0])
    }
  }

  // Action Bar Logic
  const handleSelectionAction = async (action, text) => {
    let prompt;
    switch(action) {
      case 'explain': 
        prompt = `User highlighted this text: "${text}". Please explain this specific part of the document in simple terms.`; 
        break;
      case 'summarize': 
        prompt = `User highlighted this text: "${text}". Provide a concise summary of this specific section.`; 
        break;
      case 'save':
        prompt = `User highlighted this text: "${text}". I want to add this to my vault/summary. Can you rephrase it into a key learning point?`;
        break;
      default: return;
    }

    // Zero-latency: Immediately show user's action in chat
    const userMsg = { role: 'user', content: `[${action.toUpperCase()}] "${text.slice(0, 50)}..."` }
    setMessages(prev => [...prev, userMsg])
    setIsAiLoading(true)

    try {
      // Get document context to ground the answer
      const docContext = selectedMaterial?.extracted_text?.slice(0, 4000) || ""
      const response = await callGroqAPI(
        [
          { role: 'system', content: `You are Luter, a helpful tutor. Ground your answer in this document context: ${docContext}` },
          { role: 'user', content: prompt }
        ],
        GROQ_MODELS.SPEEDSTER,
        { systemPromptOverride: GROQ_PROMPTS.AI_TUTOR }
      )
      const aiMsg = { role: 'ai', content: response.choices[0].message.content }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.error('Action error:', err)
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't process that selection. Please try again." }])
    } finally {
      setIsAiLoading(false)
    }
  }

  // RAG & Analysis Logic
  const runAnalysis = async (type) => {
    if (!selectedMaterial?.extracted_text || analysisState.loading) return
    
    setAnalysisState(prev => ({ ...prev, loading: true }))
    try {
      let prompt;
      let model = GROQ_MODELS.PROFESSOR;

      switch(type) {
        case 'notes': prompt = GROQ_PROMPTS.AI_NOTES; break;
        case 'summary': prompt = GROQ_PROMPTS.AI_NOTES; break; // Or a specific summary prompt if available
        case 'flashcards': prompt = GROQ_PROMPTS.FLASHCARDS; break;
        case 'quiz': prompt = GROQ_PROMPTS.MOCK_EXAM; break;
        default: prompt = GROQ_PROMPTS.AI_NOTES;
      }

      const context = selectedMaterial.extracted_text;
      const response = await callGroqAPI(
        [{ role: 'user', content: `Material Title: ${selectedMaterial.title}\n\nContent:\n${context}` }],
        model,
        { systemPromptOverride: prompt }
      )
      
      const content = response.choices[0].message.content
      
      if (type === 'flashcards' || type === 'quiz') {
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content.replace(/```json|```/g, ''));
          setAnalysisState(prev => ({ ...prev, [type]: parsed }));
        } catch (e) {
          console.error("Failed to parse AI JSON:", e);
          setAnalysisState(prev => ({ ...prev, [type]: content }));
        }
      } else {
        setAnalysisState(prev => ({ ...prev, [type]: content }))
      }
    } catch (err) {
      console.error('Analysis failed:', err)
    } finally {
      setAnalysisState(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    if (activeTab !== 'content' && selectedMaterial && !analysisState[activeTab]) {
      runAnalysis(activeTab);
    }
  }, [activeTab, selectedMaterial]);

  const handleSend = async () => {
    if (!chatInput.trim() || isAiLoading) return
    
    const userMsg = { role: 'user', content: chatInput }
    setMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsAiLoading(true)

    try {
      // Use active context from the reading space
      const context = viewportData.visibleText || selectedMaterial?.extracted_text?.slice(0, 4000) || ""
      const response = await callGroqAPI(
        [
          { role: 'user', content: `Current Material: ${selectedMaterial?.title}. Active Context from current view: ${context}\n\nUser Question: ${chatInput}` }
        ],
        GROQ_MODELS.SPEEDSTER,
        { systemPromptOverride: GROQ_PROMPTS.AI_TUTOR }
      )

      const aiMsg = { role: 'ai', content: response.choices[0].message.content }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, { role: 'ai', content: `Luter encountered an error: ${err.message}. Please check your connection or try again.` }])
    } finally {
      setIsAiLoading(false)
    }
  }

  const tabs = [
    { id: 'content', label: 'Original Content', icon: FileText },
    { id: 'notes', label: 'AI Notes', icon: Brain },
    { id: 'summary', label: 'AI Summary', icon: Sparkles },
    { id: 'flashcards', label: 'AI Flashcards', icon: Layers },
    { id: 'quiz', label: 'AI Quiz', icon: HelpCircle },
  ]

  const currentTabIcon = tabs.find(t => t.id === activeTab)?.icon || FileText;

  return (
    <div className="ws-root">
      <SelectionActionBar onAction={handleSelectionAction} />
      <header className="ws-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} className="ws-back-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ArrowLeft size={24} color="#7a12cc" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4A5568', fontFamily: 'Outfit' }}>
              <span>Home</span> <ChevronRight size={14} /> <span style={{ fontWeight: 600 }}>{selectedMaterial?.title || 'Loading...'}</span>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#F5F3FF', borderRadius: '20px', fontSize: '12px', color: '#7a12cc', fontWeight: 600, border: '1px solid #DDD6FE' }}>
              {React.createElement(currentTabIcon, { size: 14 })}
              <span>{tabs.find(t => t.id === activeTab)?.label}</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {courseMaterials.length > 0 && (
            <select 
              value={selectedMaterial?.id}
              onChange={(e) => {
                const mat = courseMaterials.find(m => m.id === e.target.value)
                setSelectedMaterial(mat)
                clearHighlights()
                // Reset analysis state for new material if needed or keep cached
              }}
              style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #F3E8FF', fontFamily: 'Varela Round', outline: 'none', background: 'white', fontSize: '13px' }}
            >
              {courseMaterials.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          )}
          <button className="ws-send-btn" onClick={() => navigate('/dashboard/courses')}>
            <Plus size={16} /> add material
          </button>
          
          <div style={{ position: 'relative' }}>
            <button 
              className="ws-tactile-btn" 
              style={{ padding: '8px' }}
              onClick={() => setShowTools(!showTools)}
            >
              <MoreVertical size={18} />
            </button>
            
            <AnimatePresence>
              {showTools && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    width: '220px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    border: '1px solid #E2E8F0',
                    padding: '8px',
                    zIndex: 100
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Luter Power Tools
                  </div>
                  {toolLinks.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => navigate(tool.path)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F5F3FF'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ color: '#7a12cc' }}><tool.icon size={16} /></div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#4A5568' }}>{tool.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="ws-tabs-bar">
        <div className="ws-nav-tabs">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ws-tab ${activeTab === tab.id ? 'ws-tab--active' : ''}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '16px', color: '#7a12cc' }}>
          <Volume2 size={20} cursor="pointer" />
          <Share2 size={20} cursor="pointer" />
        </div>
      </div>

      <main className="ws-main-layout">
        <section className="ws-pane-left" style={{ position: 'relative' }}>
          <MaterialRenderer 
            material={selectedMaterial} 
            activeTab={activeTab}
            analysisState={analysisState}
            onRunAnalysis={runAnalysis}
          />
        </section>

        <section className="ws-pane-right">
          <div className="ws-chat-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3E8FF', display: 'flex', alignItems: 'center', gap: 10 }}>
              <LuterLogo size={20} showText={false} />
              <span style={{ fontFamily: 'Varela Round', fontSize: '15px', color: '#4C1D95', fontWeight: 700 }}>Luter</span>
              <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}></div>
            </div>
            
            <div className="ws-chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
                  <LuterLogo size={40} showText={false} style={{ margin: '0 auto 16px', filter: 'grayscale(0.2)' }} />
                  <p style={{ fontSize: '14px', fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 500 }}>I'm Luter, your personal tutor. Ask me anything about these materials!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`ws-chat-bubble ws-chat-bubble--${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {isAiLoading && (
                <div className="ws-chat-bubble ws-chat-bubble--ai" style={{ display: 'flex', gap: '4px' }}>
                  <div className="ws-typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7a12cc', animation: 'bounce 1s infinite' }}></div>
                  <div className="ws-typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7a12cc', animation: 'bounce 1s infinite 0.2s' }}></div>
                  <div className="ws-typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7a12cc', animation: 'bounce 1s infinite 0.4s' }}></div>
                </div>
              )}
            </div>

            <div className="ws-chat-input-area">
              <div className="ws-input-wrapper">
                <input 
                  type="text" 
                  className="ws-chat-input" 
                  placeholder="Ask Luter anything..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isAiLoading}
                />
                <button 
                  className="ws-send-btn" 
                  style={{ position: 'absolute', right: '8px', padding: '8px 12px' }}
                  onClick={handleSend}
                  disabled={isAiLoading || !chatInput.trim()}
                >
                  {isAiLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function WorkstationPage() {
  return (
    <ReadingSpaceProvider>
      <WorkstationContent />
    </ReadingSpaceProvider>
  )
}
