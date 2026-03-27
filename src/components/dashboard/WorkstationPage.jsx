import { useState } from 'react'
import { FileText, MessageSquare, Sparkles, Search, BookOpen } from 'lucide-react'

export default function WorkstationPage() {
  const [tab, setTab] = useState('notes')
  return (
    <div className="dh-root">
      <div className="dh-topbar">
        <div className="dh-topbar-left">
          <h1 className="dh-page-title">Workstation</h1>
          <p className="dh-page-sub">CHM 101 · Atomic Theory</p>
        </div>
      </div>
      <div className="ws-layout">
        <div className="ws-tabs">
          {[['notes','Notes',FileText],['ask','Ask AI',MessageSquare],['flashcards','Flashcards',Sparkles]].map(([id,label,Icon])=>(
            <button key={id} className={`ws-tab ${tab===id?'ws-tab--active':''}`} onClick={()=>setTab(id)}>
              <Icon size={14} strokeWidth={2} />{label}
            </button>
          ))}
        </div>
        <div className="ws-body">
          <div className="ws-panel ws-pdf-panel">
            <div className="ws-panel-header">
              <BookOpen size={14} strokeWidth={2} />
              <span>CHM101_AtomicTheory.pdf</span>
            </div>
            <div className="ws-pdf-placeholder">
              <FileText size={48} strokeWidth={0.8} />
              <p>Upload a PDF to begin studying</p>
              <button className="dh-upload-btn">Upload PDF</button>
            </div>
          </div>
          <div className="ws-panel ws-editor-panel">
            <div className="ws-panel-header">
              <Search size={14} strokeWidth={2} />
              <span>AI Notes &amp; Summary</span>
            </div>
            <div className="ws-editor-placeholder">
              <Sparkles size={36} strokeWidth={0.8} />
              <p>Upload notes to generate an AI summary, ask questions, and create flashcards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
