import React, { useState, useRef, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Send, Sparkles, Brain, BookOpen, 
  Layers, MessageSquare, History, 
  Plus, Zap, Trash2, ChevronRight,
  Maximize2, Minimize2, Settings,
  Hash, Search, FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeckStore } from '../../store/useDeckStore'

export default function PlaygroundPage() {
  const { user, isMobile } = useOutletContext()
  const { activeDeckItems } = useDeckStore()
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hello! I\'m Lute, your personal academic engine. I have synchronized with your active deck. What shall we analyze today?', timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSidbar, setShowSidebar] = useState(!isMobile)
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg = { id: Date.now(), role: 'user', content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI
    setTimeout(() => {
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: 'Processing your request across the active deck. I see ' + activeDeckItems.length + ' primary resources that might have the answer...', timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="ai-studio-root" style={{ 
      display: 'flex', height: '100vh', background: '#fff', overflow: 'hidden',
      fontFamily: "'Outfit', sans-serif"
    }}>
      
      {/* ── LEFT SIDEBAR (HISTORY & CONTEXT) ── */}
      {showSidbar && (
        <motion.aside 
          initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }}
          style={{ 
            borderRight: '1.5px solid #f1f1f1', background: '#f8fafc', 
            display: 'flex', flexDirection: 'column', flexShrink: 0 
          }}
        >
          <div style={{ padding: '24px 20px', borderBottom: '1.5px solid #f1f1f1' }}>
             <h2 style={{ fontSize: 13, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
               <History size={16} color="#7a12cc" /> Archive
             </h2>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
             <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', padding: '0 8px 8px', display: 'block', textTransform: 'uppercase' }}>Active Deck Context</span>
                {activeDeckItems.length === 0 ? (
                  <div style={{ padding: '16px', color: '#cbd5e1', fontSize: 12, textAlign: 'center' }}>No items in deck</div>
                ) : (
                  activeDeckItems.map((item, idx) => (
                    <div key={idx} style={{ 
                      padding: '10px 12px', borderRadius: 12, background: 'white', border: '1px solid #eee',
                      marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600
                    }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f5f3ff', color: '#7a12cc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Hash size={12} />
                      </div>
                      <span style={{ truncate: 'true', flex: 1 }}>{item.metadata?.title || 'Resource'}</span>
                    </div>
                  ))
                )}
             </div>

             <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', padding: '0 8px 8px', display: 'block', textTransform: 'uppercase' }}>Recent Sessions</span>
                <button style={{ 
                  width: '100%', padding: '12px', borderRadius: 14, background: 'white', border: '1px solid #eee', 
                  display: 'flex', alignItems: 'center', gap: 12, color: '#475569', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  <MessageSquare size={16} /> Concepts of Bio...
                </button>
             </div>
          </div>
        </motion.aside>
      )}

      {/* ── MAIN CHAT AREA ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Top Header */}
        <header style={{ 
          padding: '16px 32px', borderBottom: '1.5px solid #f1f1f1', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             {!showSidbar && (
               <button onClick={() => setShowSidebar(true)} style={{ color: '#94a3b8' }}><Plus size={20} /></button>
             )}
             <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: 0 }}>AI Study Chat</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                   <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                   <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Lute Intelligence v4.5 Active</span>
                </div>
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <button style={{ padding: '8px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #eee', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={14} color="#7a12cc" /> Mode: Analyzer
             </button>
          </div>
        </header>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px' : '40px 10%' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {messages.map((m) => (
                <div key={m.id} style={{ 
                  display: 'flex', 
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 16
                }}>
                  {m.role === 'assistant' && (
                    <div style={{ width: 40, height: 40, borderRadius: 14, background: '#7a12cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                       <Brain size={24} />
                    </div>
                  )}
                  <div style={{ 
                    maxWidth: '80%', 
                    padding: m.role === 'user' ? '16px 20px' : '20px 24px', 
                    borderRadius: m.role === 'user' ? '24px 24px 4px 24px' : '4px 24px 24px 24px',
                    background: m.role === 'user' ? '#7a12cc' : '#f8fafc',
                    color: m.role === 'user' ? 'white' : '#1e293b',
                    fontSize: 15, fontWeight: 600, lineHeight: 1.6,
                    boxShadow: m.role === 'user' ? '0 10px 20px -5px rgba(122, 18, 204, 0.3)' : 'none',
                    border: m.role === 'assistant' ? '1.5px solid #eee' : 'none'
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: 'flex', gap: 16 }}>
                   <div style={{ width: 40, height: 40, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}><Zap size={18} color="#94a3b8" /></motion.div>
                   </div>
                   <div style={{ background: '#f8fafc', padding: '12px 20px', borderRadius: 20, border: '1.5px solid #eee', fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Engines are thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} style={{ height: 160 }} /> {/* Extra space to avoid dock overlap */}
           </div>
        </div>

        {/* Input Bar */}
        <div style={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0, 
          padding: '24px 10% 48px', background: 'linear-gradient(to top, white 60%, transparent)',
          zIndex: 5
        }}>
           <div style={{ 
             background: 'white', borderRadius: 24, padding: 8, 
             border: '2px solid #7a12cc1a', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.1)',
             display: 'flex', alignItems: 'center', gap: 12
           }}>
             <button style={{ width: 44, height: 44, borderRadius: 18, color: '#94a3b8' }}><Plus size={24} /></button>
             <input 
               type="text" value={input} onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Ask Lute anything about your deck..."
               style={{ 
                 flex: 1, border: 'none', background: 'none', padding: '12px 0',
                 fontSize: 15, fontWeight: 700, outline: 'none', color: '#111'
               }}
             />
             <button 
               onClick={handleSend}
               style={{ 
                 width: 50, height: 50, borderRadius: 18, background: '#7a12cc', color: 'white',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 boxShadow: '0 8px 16px -4px rgba(122, 18, 204, 0.4)'
               }}
             >
               <Send size={24} strokeWidth={2.5} />
             </button>
           </div>
        </div>

      </main>
    </div>
  )
}
