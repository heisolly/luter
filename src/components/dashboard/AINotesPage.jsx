import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Brain, Plus, Loader2, Download, Share2, FileText, ChevronRight } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import ReactMarkdown from 'react-markdown'
import LuterLogo from '../shared/LuterLogo'

export default function AINotesPage() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [materials, setMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [notes, setNotes] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (user) fetchMaterials()
  }, [user])

  async function fetchMaterials() {
    const { data } = await supabase
      .from('materials')
      .select('*, courses(name)')
      .limit(20)
    if (data) setMaterials(data)
  }

  const generateNotes = async () => {
    if (!selectedMaterial?.extracted_text) return
    setIsGenerating(true)
    try {
      const response = await callGroqAPI(
        [{ role: 'user', content: selectedMaterial.extracted_text }],
        GROQ_MODELS.PROFESSOR,
        { systemPromptOverride: GROQ_PROMPTS.AI_NOTES }
      )
      setNotes(response.choices[0].message.content)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Outfit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A3A32', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain color="#7a12cc" size={32} /> AI Study Notes
          </h1>
          <p style={{ color: '#4A5568' }}>Generate high-quality academic notes from your materials.</p>
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
                  textAlign: 'left', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: '1px solid',
                  borderColor: selectedMaterial?.id === m.id ? '#7a12cc' : '#F1F5F9',
                  background: selectedMaterial?.id === m.id ? '#F5F3FF' : 'white',
                  fontSize: '13px',
                  color: selectedMaterial?.id === m.id ? '#7a12cc' : '#4A5568',
                  transition: 'all 0.2s'
                }}
              >
                {m.title}
              </button>
            ))}
            {materials.length === 0 && <p style={{ fontSize: '12px', color: '#94A3B8' }}>No materials found.</p>}
          </div>
          
          <button 
            onClick={generateNotes}
            disabled={!selectedMaterial || isGenerating}
            style={{ 
              width: '100%', 
              marginTop: '24px', 
              padding: '12px', 
              borderRadius: '10px', 
              background: '#7a12cc', 
              color: 'white', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: (!selectedMaterial || isGenerating) ? 0.6 : 1
            }}
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Generate Notes
          </button>
        </div>

        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', minHeight: '500px' }}>
          {notes ? (
            <div className="markdown-body">
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
                <button style={{ color: '#7a12cc', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Download size={14} /> Save PDF</button>
                <button style={{ color: '#7a12cc', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Share2 size={14} /> Share</button>
              </div>
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
              <FileText size={48} style={{ marginBottom: '16px' }} />
              <p>Select a material and click generate to start.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
