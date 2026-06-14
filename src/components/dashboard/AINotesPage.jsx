import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { 
  RiBrainFill as Brain 
} from 'react-icons/ri'
import { Sparkles, FileText, ChevronRight, Download, Share2, Plus, CheckCircle, Loader2 } from 'lucide-react'
import { ThinkingIndicator } from '../ui/thinking-indicator'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService'
import { fetchUserNotes, saveToVault } from '../../services/materialsService'
import { useDeckStore } from '../../store/useDeckStore'
import ReactMarkdown from 'react-markdown'
import LuterLogo from '../shared/LuterLogo'

export default function AINotesPage() {
  const { user, profile } = useOutletContext()
  const navigate = useNavigate()
  const [materials, setMaterials] = useState([])
  const [savedAiNotes, setSavedAiNotes] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [notes, setNotes] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'view'

  useEffect(() => {
    if (user) {
      fetchMaterials()
      fetchAllAiNotes()
    }
  }, [user])

  async function fetchMaterials() {
    const { data } = await supabase
      .from('materials')
      .select('*, courses(name)')
      .limit(20)
    if (data) setMaterials(data)
  }

  async function fetchAllAiNotes() {
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('*, materials(title)')
        .eq('user_id', user.id)
        .eq('source_type', 'ai')
        .order('created_at', { ascending: false })
      
      if (data) setSavedAiNotes(data)
    } catch (err) {
      console.error("Error fetching all AI notes:", err)
    }
  }

  const generateNotes = async () => {
    if (!selectedMaterial?.extracted_text) return
    setIsGenerating(true)
    try {
      const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.GENERATE_AI_NOTES, profile?.is_premium)
      if (!ok) { setIsGenerating(false); return }
      const response = await callGroqAPI(
        [{ role: 'user', content: selectedMaterial.extracted_text }],
        GROQ_MODELS.PROFESSOR,
        { systemPromptOverride: GROQ_PROMPTS.AI_NOTES }
      )
      const content = response.choices[0].message.content
      setNotes(content)
      
      // Save newly generated notes to vault (scaffolded to skip gracefully if policy fails)
      try {
        await saveToVault({
          userId: user.id,
          courseId: selectedMaterial.course_id,
          materialId: selectedMaterial.id,
          title: `AI Notes: ${selectedMaterial.title}`,
          content: content,
          sourceType: 'ai',
          tags: ['ai-generated']
        })
        fetchAllAiNotes() // Only refresh if save was successful
      } catch (saveErr) {
        console.warn('Vault saving skipped due to policy or connection error:', saveErr)
      }
      
      setViewMode('view')
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNoteClick = (note) => {
    setSelectedMaterial(note) // Temporarily use this for the deck ID match
    setNotes(note.content)
    setViewMode('view')
  }

  const { addToDeck, activeDeckItems } = useDeckStore()
  const currentNoteId = savedAiNotes.find(n => n.content === notes)?.id
  const isAdded = activeDeckItems.some(i => i.content_id === currentNoteId)

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Outfit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A102D', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain color="#7a12cc" size={32} /> AI Study Notes
          </h1>
          <p style={{ color: '#4A5568' }}>Access all AI-generated notes from your workspace or create new ones.</p>
        </div>
        <LuterLogo size={40} showText={false} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* New Generation Panel */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', height: 'fit-content' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#4A5568', marginBottom: '16px', textTransform: 'uppercase' }}>Generate New</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select 
                onChange={(e) => {
                  const mat = materials.find(m => m.id === e.target.value)
                  setSelectedMaterial(mat)
                }}
                style={{ 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'Outfit'
                }}
              >
                <option value="">Select Material...</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={generateNotes}
              disabled={!selectedMaterial || isGenerating}
              style={{ 
                width: '100%', 
                marginTop: '16px', 
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
              Generate
            </button>
          </div>

          {/* Saved Notes List */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', height: 'fit-content' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#4A5568', marginBottom: '16px', textTransform: 'uppercase' }}>Saved AI Notes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
              {savedAiNotes.map(note => (
                <button 
                  key={note.id}
                  onClick={() => handleNoteClick(note)}
                  style={{ 
                    textAlign: 'left', 
                    padding: '12px', 
                    borderRadius: '10px', 
                    border: '1px solid #F1F5F9',
                    background: 'white',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#7a12cc'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#F1F5F9'}
                >
                  <div style={{ fontWeight: 600, color: '#1A202C', marginBottom: '4px' }}>{note.title}</div>
                  <div style={{ fontSize: '11px', color: '#718096' }}>{new Date(note.created_at).toLocaleDateString()}</div>
                </button>
              ))}
              {savedAiNotes.length === 0 && <p style={{ fontSize: '12px', color: '#94A3B8' }}>No saved AI notes yet.</p>}
            </div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #E2E8F0', minHeight: '600px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          {notes ? (
            <div className="markdown-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <button onClick={() => setViewMode('list')} style={{ color: '#7a12cc', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to list
                </button>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    onClick={() => {
                      if (!currentNoteId) return;
                      const noteObj = savedAiNotes.find(n => n.id === currentNoteId);
                      addToDeck({
                        content_id: currentNoteId,
                        content_type: 'ai_note',
                        metadata: {
                          title: noteObj?.title || 'AI Note',
                          icon: 'brain'
                        }
                      })
                    }}
                    disabled={isAdded || !currentNoteId}
                    style={{ 
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: isAdded ? 'var(--accent-gold)' : '#F1F5F9',
                      color: isAdded ? 'white' : '#7a12cc',
                      fontSize: '13px', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      border: 'none',
                      cursor: isAdded ? 'default' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isAdded ? <CheckCircle size={16} /> : <Plus size={16} />}
                    {isAdded ? 'Added to Deck' : 'Add to Deck'}
                  </button>
                  <button style={{ color: '#7a12cc', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Download size={14} /> PDF</button>
                  <button style={{ color: '#7a12cc', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Share2 size={14} /> Share</button>
                </div>
              </div>
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
          ) : isGenerating ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
              <ThinkingIndicator />
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4, minHeight: '500px' }}>
              <FileText size={64} style={{ marginBottom: '24px', color: '#7a12cc' }} />
              <p style={{ fontSize: '18px', fontWeight: 500 }}>Select a note from the list or generate a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
