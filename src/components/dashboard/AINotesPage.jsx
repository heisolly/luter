import { useState } from 'react'
import { FileText, Brain, Sparkles, Download, Share2, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'

export default function AINotesPage({ course, isMobile }) {
  const [notes, setNotes] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedContent, setUploadedContent] = useState('')

  const sampleContent = `Lecture: Introduction to Quantum Mechanics

**Wave-Particle Duality**
- Light exhibits both wave and particle properties
- de Broglie wavelength: λ = h/p
- Photoelectric effect demonstrates particle nature

**Schrödinger Equation**
- Fundamental equation of quantum mechanics
- Describes how quantum states evolve over time
- Hψ = Eψ (time-independent form)

**Quantum Numbers**
- n: Principal quantum number (energy level)
- l: Azimuthal quantum number (orbital shape)
- m: Magnetic quantum number (orientation)
- s: Spin quantum number (+1/2 or -1/2)`

  const generateNotes = async () => {
    if (!uploadedContent && !course) return
    
    setIsGenerating(true)
    
    try {
      const content = uploadedContent || sampleContent
      const prompt = `${GROQ_PROMPTS.AI_NOTES}\n\n${content}`
      
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
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>AI Notes Generator</h2>
        <p style={{ color: '#666', margin: 0 }}>Transform your lecture materials into structured, First-Class quality notes</p>
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
          <FileText size={18} /> Lecture Content
        </h3>
        <textarea
          value={uploadedContent}
          onChange={(e) => setUploadedContent(e.target.value)}
          placeholder="Paste your lecture content here, or use sample content..."
          style={{
            width: '100%',
            minHeight: '150px',
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
        onClick={generateNotes}
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
        {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Brain size={20} />}
        {isGenerating ? 'Generating Notes...' : 'Generate AI Notes'}
      </button>

      {/* Generated Notes */}
      {notes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: '16px',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#7a12cc" /> Generated Notes
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <Download size={14} />
              </button>
              <button style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <Share2 size={14} />
              </button>
            </div>
          </div>
          
          <div 
            style={{ 
              lineHeight: 1.6, 
              fontSize: '14px',
              color: '#374151'
            }}
            dangerouslySetInnerHTML={{ __html: notes.replace(/\n/g, '<br />') }}
          />
        </motion.div>
      )}
    </div>
  )
}
