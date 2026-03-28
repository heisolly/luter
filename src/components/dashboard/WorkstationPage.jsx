import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FileText, MessageSquare, Sparkles, Search, BookOpen } from 'lucide-react'

export default function WorkstationPage() {
  const { isMobile } = useOutletContext()
  const [tab, setTab] = useState('notes')
  return (
    <div className="dh-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="dh-topbar" style={{ background: isMobile ? 'transparent' : '#fff', borderBottom: isMobile ? 'none' : '1px solid #eee', padding: isMobile ? '20px 20px 0' : '20px 40px' }}>
        <div className="dh-topbar-left">
          <h1 className="dh-page-title" style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900 }}>Workstation</h1>
          <p className="dh-page-sub" style={{ fontSize: isMobile ? 12 : 14, opacity: 0.6 }}>CHM 101 · Atomic Theory</p>
        </div>
      </div>
      
      <div className="ws-layout" style={{ 
        flex: 1, 
        padding: isMobile ? '12px 16px' : '20px 40px', 
        display: 'flex', 
        flexDirection: 'column',
        gap: 20
      }}>
        <div className="ws-tabs" style={{ 
          display: 'flex', 
          gap: 8, 
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? 12 : 0
        }}>
          {[
            ['notes', 'Analysis', FileText],
            ['ask', 'Tutor AI', MessageSquare],
            ['flashcards', 'Flash', Sparkles]
          ].map(([id, label, Icon]) => {
            const active = tab === id
            return (
              <button 
                key={id} 
                onClick={() => setTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
                  borderRadius: 14, border: '1.5px solid #111', background: active ? '#111' : 'white',
                  color: active ? 'white' : '#111', fontWeight: 800,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: active ? 'none' : '4px 4px 0px #111',
                  transform: active ? 'translate(2px, 2px)' : 'none',
                  transition: 'all 0.1s', flexShrink: 0
                }}
              >
                <Icon size={16} /> {label}
              </button>
            )
          })}
        </div>

        <div className="ws-body" style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          gap: 24, 
          flex: 1,
          paddingBottom: 100
        }}>
          {/* Resource Panel */}
          <div style={{ 
            flex: 1, 
            background: 'white', 
            borderRadius: 24, 
            border: '1.5px solid #111', 
            boxShadow: '6px 6px 0px #111',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #111', background: '#f8f4ff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={16} color="#7a12cc" />
              <span style={{ fontSize: 13, fontWeight: 900 }}>Resource Base</span>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0f0f0', border: '1.5px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <FileText size={32} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 20px', opacity: 0.6 }}>Upload course materials to begin analysis.</p>
              <button style={{ 
                padding: '12px 24px', borderRadius: 12, background: '#7a12cc', color: 'white', border: '1.5px solid #111', fontSize: 14, fontWeight: 900, boxShadow: '4px 4px 0px #111', cursor: 'pointer'
              }}>Upload PDF</button>
            </div>
          </div>

          {/* AI Output Panel (Hidden if mobile and not primary tab - simplifies interface) */}
          {(!isMobile || tab !== 'notes') && (
            <div style={{ 
              flex: 1, 
              background: 'white', 
              borderRadius: 24, 
              border: '1.5px solid #111', 
              boxShadow: '6px 6px 0px #111',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #111', background: '#fdfbeb', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Search size={16} color="#d97706" strokeWidth={2.5} />
                <span style={{ fontSize: 13, fontWeight: 900 }}>AI Output</span>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                <Sparkles size={32} color="#fbbf24" style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111', opacity: 0.6 }}>AI waiting for context...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
