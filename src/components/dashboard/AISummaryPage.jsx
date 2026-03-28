import { useState } from 'react'
import { FileText, Sparkles, Download, Share2, Loader2, Zap, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'

export default function AISummaryPage({ course, isMobile }) {
  const [summary, setSummary] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedContent, setUploadedContent] = useState('')
  const [summaryLength, setSummaryLength] = useState('medium')

  const sampleContent = `Introduction to Quantum Mechanics - Lecture 12

**Topic**: Wave Function and Probability Density

The wave function ψ(x,t) is a complex-valued function that contains all the information about a quantum system. The square of the absolute value |ψ|² gives the probability density of finding the particle at position x at time t.

**Key Points Covered:**
1. Born's interpretation of the wave function
2. Normalization condition: ∫|ψ|² dx = 1
3. Probability current density
4. Continuity equation
5. Physical significance of complex wave functions

**Mathematical Derivations:**
- Derivation of the continuity equation from Schrödinger equation
- Calculation of probability current for plane waves
- Normalization of Gaussian wave packets

**Examples:**
- Particle in a box: ψ(x) = √(2/L) sin(nπx/L)
- Harmonic oscillator ground state: ψ₀(x) = (mω/πℏ)^(1/4) e^(-mωx²/2ℏ)
- Free particle Gaussian wave packet evolution

**Applications:**
- Quantum tunneling probability
- Scattering cross sections
- Quantum measurement theory`

  const lengthOptions = {
    short: 'Create a concise 2-paragraph summary',
    medium: 'Create a detailed 3-4 paragraph summary',
    long: 'Create a comprehensive 5-6 paragraph summary'
  }

  const generateSummary = async () => {
    if (!uploadedContent && !course) return
    
    setIsGenerating(true)
    
    try {
      const content = uploadedContent || sampleContent
      const prompt = `Create a ${summaryLength} summary of the following academic content. Focus on the most important concepts, key formulas, and practical applications. Use clear headings and bullet points for readability.

Content to summarize:
${content}

${lengthOptions[summaryLength]}

Format with clear H2 headings and bullet points. Include key takeaways at the end.`
      
      const data = await callGroqAPI(
        [{ role: 'user', content: prompt }],
        GROQ_MODELS.SPEEDSTER,
        { temperature: 0.5 }
      )
      
      setSummary(data.choices?.[0]?.message?.content || 'No summary generated')
    } catch (error) {
      console.error('Error generating summary:', error)
      setSummary('Error generating summary. Please try again.')
    }
    
    setIsGenerating(false)
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>AI Summary Generator</h2>
        <p style={{ color: '#666', margin: 0 }}>Transform lengthy content into concise, intelligent summaries</p>
      </div>

      {/* Summary Length Options */}
      <div style={{ 
        background: 'white', 
        border: '1.5px solid #e5e7eb', 
        borderRadius: '16px', 
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} /> Summary Length
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Object.entries({
            short: { label: 'Quick', desc: '2 paragraphs', icon: '⚡' },
            medium: { label: 'Balanced', desc: '3-4 paragraphs', icon: '📝' },
            long: { label: 'Detailed', desc: '5-6 paragraphs', icon: '📚' }
          }).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setSummaryLength(key)}
              style={{
                padding: '12px 16px',
                background: summaryLength === key ? '#7a12cc' : 'white',
                color: summaryLength === key ? 'white' : '#374151',
                border: '1.5px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: summaryLength === key ? '0 4px 12px rgba(122, 18, 204, 0.3)' : 'none'
              }}
            >
              <span style={{ fontSize: '16px' }}>{value.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div>{value.label}</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>{value.desc}</div>
              </div>
            </button>
          ))}
        </div>
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
          <FileText size={18} /> Content to Summarize
        </h3>
        <textarea
          value={uploadedContent}
          onChange={(e) => setUploadedContent(e.target.value)}
          placeholder="Paste your lecture notes, articles, or any content to summarize..."
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          {uploadedContent.length} characters • {Math.ceil(uploadedContent.length / 5)} words (approximately)
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateSummary}
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
        {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
        {isGenerating ? 'Generating Summary...' : 'Generate AI Summary'}
      </button>

      {/* Generated Summary */}
      {summary && (
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
              <Sparkles size={20} color="#7a12cc" /> AI Summary
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
          
          <div style={{ 
            lineHeight: 1.7, 
            fontSize: '15px',
            color: '#374151'
          }}>
            <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
          </div>

          {/* Summary Stats */}
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            background: '#f9fafb', 
            borderRadius: '8px', 
            fontSize: '12px', 
            color: '#666',
            display: 'flex',
            gap: '20px'
          }}>
            <span>📝 {summary.split(' ').length} words</span>
            <span>⏱️ ~{Math.ceil(summary.split(' ').length / 200)} min read</span>
            <span>🎯 {summaryLength} summary</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
