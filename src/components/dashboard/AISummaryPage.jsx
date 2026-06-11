import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Sparkle, Loader2, FileText } from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS } from '../../groqClient'
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService'
import ReactMarkdown from 'react-markdown'

export default function AISummaryPage() {
  const { user, profile } = useOutletContext()
  const [materials, setMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [summary, setSummary] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (user) fetchMaterials()
  }, [user])

  async function fetchMaterials() {
    const { data } = await supabase.from('materials').select('*').limit(20)
    if (data) setMaterials(data)
  }

  const generateSummary = async () => {
    if (!selectedMaterial?.extracted_text) return
    setIsGenerating(true)
    try {
      const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.GENERATE_SUMMARY, profile?.is_premium)
      if (!ok) { setIsGenerating(false); return }
      const response = await callGroqAPI(
        [{ role: 'user', content: selectedMaterial.extracted_text }],
        GROQ_MODELS.SPEEDSTER,
        { systemPromptOverride: "Create a concise and structured summary of the following academic material. Use clear headings and bullet points." }
      )
      setSummary(response.choices[0].message.content)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', background: 'white', borderBottom: '1px solid #E2E8F0' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A102D', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkle weight="fill" color="#6D28D9" size={24} /> AI Summary
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>Generate concise summaries from your materials</p>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar - Materials List */}
        <div style={{ width: '300px', background: 'white', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Materials</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {materials.map(m => (
              <button 
                key={m.id}
                onClick={() => setSelectedMaterial(m)}
                style={{ 
                  width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', border: '1px solid',
                  borderColor: selectedMaterial?.id === m.id ? '#6D28D9' : '#F1F5F9',
                  background: selectedMaterial?.id === m.id ? '#F5F3FF' : 'white',
                  fontSize: '14px', color: selectedMaterial?.id === m.id ? '#6D28D9' : '#475569',
                  fontWeight: 500, marginBottom: '8px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {m.title}
              </button>
            ))}
          </div>
          <div style={{ padding: '16px', borderTop: '1px solid #F1F5F9' }}>
            <button 
              onClick={generateSummary}
              disabled={!selectedMaterial || isGenerating}
              style={{ 
                width: '100%', padding: '12px', borderRadius: '8px', 
                background: '#6D28D9', color: 'white', fontWeight: 600, fontSize: '14px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: (!selectedMaterial || isGenerating) ? 0.5 : 1, cursor: 'pointer', border: 'none'
              }}
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkle weight="fill" size={18} />}
              Generate Summary
            </button>
          </div>
        </div>

        {/* Main Area - Summary Display */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '32px', minHeight: '400px' }}>
            {summary ? (
              <div className="markdown-body" style={{ fontSize: '15px', lineHeight: 1.7, color: '#334155' }}>
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <FileText size={48} weight="thin" color="#94A3B8" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '15px', color: '#64748B', textAlign: 'center' }}>Select a material and click "Generate Summary" to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
