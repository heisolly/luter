import React, { useState } from 'react'
import { Brain, Zap, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'

export default function AnkiRenderer({ material }) {
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  
  // Demo data - in production this would be read via sql.js from .apkg
  const cards = [
    { front: "What is the primary function of Mitochondria?", back: "The 'powerhouse' of the cell, responsible for ATP production through cellular respiration." },
    { front: "Define Hydrostatic Equilibrium.", back: "A state where the compression due to gravity is balanced by a pressure gradient force." },
    { front: "Who proposed the Theory of Relativity?", back: "Albert Einstein." }
  ]

  return (
    <div className="ws-content-scroll" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#7a12cc', marginBottom: '16px' }}>
          <Brain size={32} />
          <h2 className="ws-heading" style={{ fontSize: '28px' }}>Active Recall Zone</h2>
        </div>
        <p style={{ fontFamily: 'Outfit', color: '#4A5568' }}>Master your Anki deck with Luter's assistance.</p>
      </div>

      <div 
        className={`ws-flashcard ${isFlipped ? 'ws-flashcard--flipped' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ width: '100%', maxWidth: '600px', height: '350px' }}
      >
        <div className="ws-flashcard-inner">
          <div className="ws-flashcard-front" style={{ border: '3px solid #7a12cc' }}>
            <span style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '12px', color: '#64748B', fontFamily: 'Outfit', fontWeight: 700, textTransform: 'uppercase' }}>Question</span>
            <p className="ws-flashcard-text" style={{ fontSize: '24px' }}>{cards[currentCard].front}</p>
            <div style={{ position: 'absolute', bottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#7a12cc', fontFamily: 'Outfit', fontSize: '14px', fontWeight: 600 }}>
              <Zap size={16} /> Click to reveal answer
            </div>
          </div>
          <div className="ws-flashcard-back" style={{ border: '3px solid #4C1D95', background: '#F5F3FF' }}>
            <span style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '12px', color: '#64748B', fontFamily: 'Outfit', fontWeight: 700, textTransform: 'uppercase' }}>Luter's Explanation</span>
            <p className="ws-flashcard-text" style={{ fontSize: '20px', lineHeight: 1.6 }}>{cards[currentCard].back}</p>
            
            <div style={{ position: 'absolute', bottom: '32px', display: 'flex', gap: '16px' }}>
              <button className="ws-tactile-btn" style={{ background: '#FEE2E2', borderColor: '#EF4444', color: '#991B1B' }} onClick={(e) => { e.stopPropagation(); setIsFlipped(false) }}>
                <XCircle size={18} /> hard
              </button>
              <button className="ws-tactile-btn" style={{ background: '#F3E8FF', borderColor: '#7a12cc', color: '#4C1D95' }} onClick={(e) => { e.stopPropagation(); setIsFlipped(false); setCurrentCard((prev) => (prev + 1) % cards.length) }}>
                <CheckCircle2 size={18} /> easy
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button className="ws-tactile-btn" onClick={() => setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length)}>
          <RotateCcw size={18} /> prev card
        </button>
        <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#4C1D95' }}>{currentCard + 1} / {cards.length}</span>
        <button className="ws-tactile-btn" onClick={() => setCurrentCard((prev) => (prev + 1) % cards.length)}>
          next card
        </button>
      </div>
    </div>
  )
}
