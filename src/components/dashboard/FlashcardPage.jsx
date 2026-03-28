import { useState } from 'react'
import { Layers, RotateCcw, Download, Share2, Loader2, CheckCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'

export default function FlashcardPage({ course, isMobile }) {
  const [flashcards, setFlashcards] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedContent, setUploadedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studiedCards, setStudiedCards] = useState(new Set())

  const sampleContent = `Quantum Mechanics Key Concepts

**de Broglie Hypothesis**: All matter exhibits wave-like properties with wavelength λ = h/p

**Heisenberg Uncertainty Principle**: Δx·Δp ≥ ℏ/2 - cannot simultaneously know position and momentum precisely

**Quantum Numbers**: 
- n (1,2,3...) - principal energy level
- l (0 to n-1) - orbital angular momentum
- m (-l to +l) - magnetic quantum number
- s (+1/2, -1/2) - spin quantum number

**Photoelectric Effect**: Light of frequency f on metal surface ejects electrons with KE = hf - φ`

  const generateFlashcards = async () => {
    if (!uploadedContent && !course) return
    
    setIsGenerating(true)
    setIsFlipped(false)
    
    try {
      const content = uploadedContent || sampleContent
      const prompt = `${GROQ_PROMPTS.FLASHCARDS}\n\n${content}`
      
      const data = await callGroqAPI(
        [{ role: 'user', content: prompt }],
        GROQ_MODELS.SPEEDSTER,
        { temperature: 0.7, responseFormat: { type: 'json_object' } }
      )
      
      const response = JSON.parse(data.choices?.[0]?.message?.content || '{}')
      const cards = response.flashcards || []
      setFlashcards(cards)
      setCurrentIndex(0)
      setStudiedCards(new Set())
    } catch (error) {
      console.error('Error generating flashcards:', error)
      // Fallback flashcards
      const fallbackCards = [
        { front: 'What is the de Broglie equation?', back: 'λ = h/p, where λ is wavelength, h is Planck constant, p is momentum' },
        { front: 'State the Heisenberg Uncertainty Principle', back: 'Δx·Δp ≥ ℏ/2 - position and momentum cannot be known simultaneously' },
        { front: 'What are the four quantum numbers?', back: 'n (principal), l (azimuthal), m (magnetic), s (spin)' }
      ]
      setFlashcards(fallbackCards)
      setCurrentIndex(0)
      setStudiedCards(new Set())
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

  const markAsStudied = () => {
    setStudiedCards(new Set([...studiedCards, currentIndex]))
  }

  const resetProgress = () => {
    setStudiedCards(new Set())
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const currentCard = flashcards[currentIndex]

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>AI Flashcards</h2>
        <p style={{ color: '#666', margin: 0 }}>Generate smart flashcards for active recall learning</p>
      </div>

      {/* Content Input */}
      <div style={{ 
        background: 'white', 
        border: '1.5px solid #e5e7eb', 
        borderRadius: '16px', 
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} /> Study Material
        </h3>
        <textarea
          value={uploadedContent}
          onChange={(e) => setUploadedContent(e.target.value)}
          placeholder="Paste your study material here, or use sample content..."
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={generateFlashcards}
        disabled={isGenerating || (!uploadedContent && !course)}
        style={{
          width: '100%',
          padding: '16px',
          background: isGenerating ? '#f3f4f6' : '#7a12cc',
          color: isGenerating ? '#9ca3af' : 'white',
          border: '1.5px solid #7a12cc',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '800',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}
      >
        {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Layers size={20} />}
        {isGenerating ? 'Generating Flashcards...' : 'Generate Flashcards'}
      </button>

      {/* Flashcard Display */}
      {flashcards.length > 0 && currentCard && (
        <div>
          {/* Progress Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>
                Card {currentIndex + 1} of {flashcards.length}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#7a12cc' }}>
                {studiedCards.size} studied
              </span>
            </div>
            <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${((currentIndex + 1) / flashcards.length) * 100}%`, 
                  background: '#7a12cc',
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
          </div>

          {/* Flashcard */}
          <div 
            style={{
              position: 'relative',
              height: isMobile ? '200px' : '250px',
              perspective: '1000px',
              marginBottom: '20px'
            }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                cursor: 'pointer'
              }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Front */}
              <div 
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  boxShadow: '0 10px 30px rgba(122, 18, 204, 0.3)'
                }}
              >
                <p style={{ 
                  color: 'white', 
                  fontSize: isMobile ? '16px' : '18px', 
                  fontWeight: '600',
                  textAlign: 'center',
                  margin: 0
                }}>
                  {currentCard.front}
                </p>
              </div>

              {/* Back */}
              <div 
                style={{
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
                  padding: '24px',
                  boxShadow: '0 10px 30px rgba(122, 18, 204, 0.2)'
                }}
              >
                <p style={{ 
                  color: '#374151', 
                  fontSize: isMobile ? '16px' : '18px', 
                  fontWeight: '500',
                  textAlign: 'center',
                  margin: 0
                }}>
                  {currentCard.back}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={prevCard}
              disabled={currentIndex === 0}
              style={{
                flex: 1,
                padding: '12px',
                background: currentIndex === 0 ? '#f3f4f6' : 'white',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              ← Previous
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                flex: 2,
                padding: '12px',
                background: '#7a12cc',
                color: 'white',
                border: '1.5px solid #7a12cc',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </button>

            <button
              onClick={nextCard}
              disabled={currentIndex === flashcards.length - 1}
              style={{
                flex: 1,
                padding: '12px',
                background: currentIndex === flashcards.length - 1 ? '#f3f4f6' : 'white',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: currentIndex === flashcards.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              Next →
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={markAsStudied}
              disabled={studiedCards.has(currentIndex)}
              style={{
                flex: 1,
                padding: '12px',
                background: studiedCards.has(currentIndex) ? '#10b981' : '#f3f4f6',
                color: studiedCards.has(currentIndex) ? 'white' : '#374151',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: studiedCards.has(currentIndex) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {studiedCards.has(currentIndex) ? <CheckCircle size={16} /> : <CheckCircle size={16} />}
              {studiedCards.has(currentIndex) ? 'Studied' : 'Mark as Studied'}
            </button>

            <button
              onClick={resetProgress}
              style={{
                padding: '12px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
