import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { RiStackFill as Layers, RiLoader4Line as Loader2, RiFlashlightFill as Zap, RiRefreshLine as RotateCcw, RiArrowRightSLine as ChevronRight, RiArrowLeftSLine as ChevronLeft } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import MaterialAnalysisService from '../../services/materialAnalysisService'
import LuterLogo from '../shared/LuterLogo'

export default function FlashcardPage() {
  const { user } = useOutletContext()
  const [materials, setMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [flashcards, setFlashcards] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    if (user) fetchMaterials()
  }, [user])

  async function fetchMaterials() {
    const { data } = await supabase.from('materials').select('*').limit(20)
    if (data) setMaterials(data)
  }

  const generateCards = async () => {
    if (!selectedMaterial) return
    setIsGenerating(true)
    setFlashcards([])
    try {
      // Ensure we have text
      let text = selectedMaterial.extracted_text
      if (!text) {
        const { data: latest } = await supabase.from('materials').select('extracted_text').eq('id', selectedMaterial.id).single()
        if (latest?.extracted_text) {
          text = latest.extracted_text
        } else {
          // Trigger emergency extraction
          const res = await MaterialAnalysisService.reprocessMaterial(selectedMaterial)
          if (res.success) text = res.fullText
        }
      }

      if (!text) throw new Error('No content available in this material')

      const result = await MaterialAnalysisService.generateDirectFlashcards(text, 10)
      if (result.success) {
        // Normalize cards for the local display
        const normalized = result.flashcards.map(c => ({
          front: c.front || c.question || 'No content',
          back: c.back || c.answer || 'No content'
        }))
        setFlashcards(normalized)
        setCurrentIndex(0)
      }
    } catch (err) {
      console.error(err)
      alert(err.message || 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Outfit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A3A32', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers color="#7a12cc" size={32} /> AI Flashcards
          </h1>
          <p style={{ color: '#4A5568' }}>Master your materials with active recall.</p>
        </div>
        <LuterLogo size={40} showText={false} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', height: 'fit-content' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#4A5568', marginBottom: '16px', textTransform: 'uppercase' }}>Select Material</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {materials.map(m => (
              <button 
                key={m.id}
                onClick={() => setSelectedMaterial(m)}
                style={{ 
                  textAlign: 'left', padding: '12px', borderRadius: '10px', border: '1px solid',
                  borderColor: selectedMaterial?.id === m.id ? '#7a12cc' : '#F1F5F9',
                  background: selectedMaterial?.id === m.id ? '#F5F3FF' : 'white',
                  fontSize: '13px', color: selectedMaterial?.id === m.id ? '#7a12cc' : '#4A5568'
                }}
              >
                {m.title}
              </button>
            ))}
          </div>
          <button 
            onClick={generateCards}
            disabled={!selectedMaterial || isGenerating}
            style={{ 
              width: '100%', marginTop: '24px', padding: '12px', borderRadius: '10px', 
              background: '#7a12cc', color: 'white', fontWeight: 700, display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
            Generate Cards
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
          {flashcards.length > 0 ? (
            <>
              <div 
                className={`ws-flashcard ${isFlipped ? 'ws-flashcard--flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ width: '100%', maxWidth: '500px', height: '320px' }}
              >
                <div className="ws-flashcard-inner">
                  <div className="ws-flashcard-front" style={{ border: '2px solid #7a12cc' }}>
                    <p style={{ fontSize: '18px', fontWeight: 600 }}>{flashcards[currentIndex].front}</p>
                    <span style={{ position: 'absolute', bottom: '20px', fontSize: '12px', color: '#7a12cc', opacity: 0.6 }}>Click to flip</span>
                  </div>
                  <div className="ws-flashcard-back" style={{ border: '2px solid #4C1D95', background: '#F5F3FF' }}>
                    <p style={{ fontSize: '16px', color: '#4C1D95' }}>{flashcards[currentIndex].back}</p>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <button 
                  className="ws-tactile-btn" 
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={20} />
                </button>
                <span style={{ fontWeight: 800 }}>{currentIndex + 1} / {flashcards.length}</span>
                <button 
                  className="ws-tactile-btn" 
                  onClick={() => setCurrentIndex(prev => Math.min(flashcards.length - 1, prev + 1))}
                  disabled={currentIndex === flashcards.length - 1}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
              <Layers size={64} style={{ marginBottom: '16px' }} />
              <p>Generate cards to start your active recall session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
