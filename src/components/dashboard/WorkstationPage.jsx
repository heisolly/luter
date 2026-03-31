import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { 
  Brain, Star, FileText, CheckCircle2, ChevronRight, ArrowLeft, ExternalLink, Sparkles, Layers, HelpCircle, Plus, Search, ChevronLeft, Briefcase, PlayCircle, Settings, User, LogOut, MoreVertical, Layout, Bookmark, Zap, Send, Loader2, AlertCircle 
} from 'lucide-react'

import LuterLogo from '../shared/LuterLogo'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import { supabase } from '../../supabaseClient'
import { ReadingSpaceProvider, useReadingSpace } from './ReadingSpaceContext'
import { SelectionActionBar } from './WorkstationOverlays'
import MaterialRenderer from './MaterialRenderer'
import { WorkstationNotes, WorkstationSummary, WorkstationFlashcards, WorkstationQuiz } from './WorkstationAITools'
import { saveToVault, fetchUserNotes, pollMaterialUntilReady } from '../../services/materialsService'
import { AIHighlightService } from '../../services/aiHighlightService'
import { MaterialAnalysisService } from '../../services/materialAnalysisService'
import { debounce } from '../../utils/debounce'
import './workstation.css'

function WorkstationContent() {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const { user } = useOutletContext()
  const { setViewportData, highlightText, updateSpark, clearHighlights, viewportData, updateSelection } = useReadingSpace()
  
  const [activeTab, setActiveTab] = useState('content')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [courseMaterials, setCourseMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [analysisCache, setAnalysisCache] = useState({})
  const [materialAnalysis, setMaterialAnalysis] = useState(null) // Cached analysis from Supabase
  const [showTools, setShowTools] = useState(false)
  const [hasNewAssignment, setHasNewAssignment] = useState(false)
  
  // Analysis cache: materialId -> { notes, summary, flashcards, quiz }
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false)
  const [isExtractingText, setIsExtractingText] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false) // Default to reader for "Workspace Home"


  const currentAnalysis = selectedMaterial ? (analysisCache[selectedMaterial.id] || {}) : {}


  useEffect(() => {
    if (!selectedMaterial || selectedMaterial.processing_status !== 'pending') {
      setIsExtractingText(false)
      return
    }

    setIsExtractingText(true)
    let isMounted = true
    let cleanup = null

    pollMaterialUntilReady(selectedMaterial.id, {
      onReady: (text) => {
        if (!isMounted) return
        setSelectedMaterial(prev => prev ? { ...prev, extracted_text: text, processing_status: 'ready' } : null)
        setIsExtractingText(false)
        setCourseMaterials(prevList => prevList.map(m => m.id === selectedMaterial.id ? { ...m, extracted_text: text, processing_status: 'ready' } : m))
      },
      onFailed: () => {
        if (!isMounted) return
        setIsExtractingText(false)
        setSelectedMaterial(prev => prev ? { ...prev, processing_status: 'failed' } : null)
        setMessages(prev => [...prev, { role: 'ai', content: "I couldn't read the text inside this file. It might be corrupt or an unsupported format." }])
      }
    }).then(fn => {
      cleanup = fn
    })

    return () => {
      isMounted = false
      if (cleanup) cleanup()
    }
  }, [selectedMaterial?.id, selectedMaterial?.processing_status])

  const [isFlipped, setIsFlipped] = useState(false)
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)

  const toolLinks = [
    { id: 'files', label: 'Files', icon: FileText, path: '/dashboard/files' },
    { id: 'ai-notes', label: 'AI Notes', icon: Brain, path: '/dashboard/ai-notes' },
    { id: 'assignments', label: 'Assignments', icon: Layers, path: '/dashboard/assignments' },
  ]

  useEffect(() => {
    const handleMouseUp = (e) => {
      // ONLY trigger if the selection happened inside the reading pane (ws-pane-left)
      const readingPane = document.querySelector('.ws-pane-left')
      if (!readingPane || !readingPane.contains(e.target)) {
        // If clicking outside and not on the selection bar, hide it
        if (!e.target.closest('.selection-action-bar')) {
          updateSelection('', null, false)
        }
        return
      }

      const sel = window.getSelection()
      const text = sel.toString().trim()
      
      if (text && text.length > 2) {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        updateSelection(text, rect, true)
      } else {
        updateSelection('', null, false)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [updateSelection])

  useEffect(() => {
    if (courseId) {
      fetchMaterials()
      checkAssignments()
    }
  }, [courseId])

  async function checkAssignments() {
    // A simple check for any assignment in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('materials')
      .select('id')
      .eq('course_id', courseId)
      .eq('type', 'assignment')
      .gt('created_at', yesterday)
    
    if (data && data.length > 0) {
      setHasNewAssignment(true)
    }
  }

  async function fetchMaterials() {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', courseId)
    
    if (data && data.length > 0) {
      setCourseMaterials(data)
      setSelectedMaterial(data[0])
      setShowDashboard(false) // Default to reader on material arrival
    }
  }



  // Action Bar Logic
  const handleSelectionAction = async (action, text) => {
    let prompt;
    switch(action) {
      case 'explain': 
        prompt = `User highlighted this text: "${text}". Please explain this specific part of the document in simple terms.`; 
        break;
      case 'summarize': 
        prompt = `User highlighted this text: "${text}". Provide a concise summary of this specific section.`; 
        break;
      case 'save':
        prompt = `User highlighted this text: "${text}". I want to add this to my vault/summary. Can you rephrase it into a key learning point?`;
        break;
      default: return;
    }

    // Zero-latency: Immediately show user's action in chat
    const userMsg = { role: 'user', content: `[${action.toUpperCase()}] "${text.slice(0, 50)}..."` }
    setMessages(prev => [...prev, userMsg])
    setIsAiLoading(true)

    try {
      // Get document context to ground the answer
      const docContext = selectedMaterial?.extracted_text?.slice(0, 4000) || ""
      const response = await callGroqAPI(
        [
          { role: 'system', content: `You are Luter, a helpful tutor. Ground your answer in this document context: ${docContext}` },
          { role: 'user', content: prompt }
        ],
        GROQ_MODELS.SPEEDSTER,
        { systemPromptOverride: GROQ_PROMPTS.AI_TUTOR }
      )
      const aiMsg = { role: 'ai', content: response.choices[0].message.content }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.error('Action error:', err)
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't process that selection. Please try again." }])
    } finally {
      setIsAiLoading(false)
    }
  }

  // RAG & Analysis Logic - Updated to use cached analysis
  const runAnalysis = async (type) => {
    if (isExtractingText || isAnalysisLoading || !selectedMaterial) return
    
    setIsAnalysisLoading(true)
    try {
      // Get or create cached analysis for this material
      let currentAnalysis = materialAnalysis
      if (!materialAnalysis || !materialAnalysis.summary) {
        console.log('Getting material analysis for:', selectedMaterial.id)
        const analysisResult = await MaterialAnalysisService.getOrCreateAnalysis(
          selectedMaterial.id,
          selectedMaterial,
          user.id
        )
        
        if (analysisResult.success) {
          setMaterialAnalysis(analysisResult.analysis)
          console.log('Analysis loaded:', analysisResult.isCached ? 'from cache' : 'newly generated')
          currentAnalysis = analysisResult.analysis // Use the new analysis immediately
          
          // Validate analysis has required properties
          if (!analysisResult.analysis || !analysisResult.analysis.summary) {
            console.warn('Analysis missing summary, creating fallback')
            const fallbackAnalysis = {
              ...analysisResult.analysis,
              summary: 'Analysis processing complete. Summary will be available shortly.',
              keyTopics: analysisResult.analysis?.keyTopics || [],
              learningObjectives: analysisResult.analysis?.learningObjectives || [],
              extracted_text: selectedMaterial.extracted_text, // Add content for direct generation
              materialMetadata: {
                ...analysisResult.analysis?.materialMetadata,
                content: selectedMaterial.extracted_text
              }
            }
            setMaterialAnalysis(fallbackAnalysis)
            currentAnalysis = fallbackAnalysis // Use fallback immediately
          }
        } else {
          throw new Error(analysisResult.error)
        }
      }
      
      let finalResult
      
      // Generate content based on type using cached analysis
      switch(type) {
        case 'notes':
          // Generate AI notes using Groq API
          try {
            // Check if we're rate limited
            const dailyUsage = window.groqDailyUsage || 0
            if (dailyUsage > 95000) {
              console.log('Approaching daily token limit, using cached summary for notes')
              finalResult = currentAnalysis?.summary || 'Notes generation temporarily unavailable due to API limits. Please try again later.'
              break
            }
            
            const content = selectedMaterial.extracted_text?.slice(0, 6000) || ''
            if (!content) {
              finalResult = 'No content available for note generation.'
              break
            }
            
            const notesPrompt = `Act as a world-class academic tutor. Create highly detailed, structured, and comprehensive study notes from the provided text.
            
            Structure:
            1. **Topic Overview**: A brief 2-3 sentence introduction.
            2. **Core Concepts & Definitions**: Use bolding for key terms.
            3. **Detailed Breakdown**: Deep dive into the main arguments, mechanisms, or theories.
            4. **Key Examples**: Practical applications or examples.
            5. **Summary Points**: Bullet point summary of the most important takeaways.
            
            Material Title: ${selectedMaterial.title || 'Untitled'}
            Material Type: ${selectedMaterial.type || 'document'}
            
            Content:
            ${content}`
            
            const response = await callGroqAPI(
              [{ role: 'user', content: notesPrompt }],
              'llama-3.3-70b-versatile',
              { systemPromptOverride: GROQ_PROMPTS.AI_NOTES }
            )
            
            // Track usage
            window.groqDailyUsage = (window.groqDailyUsage || 0) + 3000 // Estimate
            
            finalResult = response.choices[0].message.content
            
          } catch (notesError) {
            console.error('AI notes generation failed:', notesError)
            // Check if it's a rate limit error
            if (notesError.message?.includes('Rate limit reached') || notesError.message?.includes('429')) {
              console.log('Rate limit reached for notes, using fallback')
              window.groqDailyUsage = 100000
              finalResult = 'Notes generation temporarily unavailable due to API limits. Please try again later.'
            } else {
              finalResult = currentAnalysis?.summary || 'Notes are being generated. Please wait a moment for the analysis to complete.'
            }
          }
          break
          
        case 'summary':
          // Use cached summary
          finalResult = currentAnalysis?.summary || 'Summary is being generated. Please wait a moment for the analysis to complete.'
          break
          
        case 'flashcards':
          // Generate flashcards from cached analysis
          try {
            const flashcardResult = await MaterialAnalysisService.generateFlashcards(currentAnalysis, 10)
            if (flashcardResult.success) {
              finalResult = flashcardResult.flashcards
            } else {
              throw new Error(flashcardResult.error)
            }
          } catch (flashcardError) {
            console.error('Flashcard generation failed:', flashcardError)
            // Use fallback flashcards
            const fallbackResult = MaterialAnalysisService.createFallbackFlashcards(10)
            finalResult = fallbackResult.flashcards
          }
          break
          
        case 'quiz':
          // Generate quiz from cached analysis
          try {
            const quizResult = await MaterialAnalysisService.generateQuiz(currentAnalysis, 5, 'medium')
            if (quizResult.success) {
              finalResult = quizResult.quiz
            } else {
              throw new Error(quizResult.error)
            }
          } catch (quizError) {
            console.error('Quiz generation failed:', quizError)
            // Use fallback quiz
            const fallbackResult = MaterialAnalysisService.createFallbackQuiz(5, 'medium')
            finalResult = fallbackResult.quiz
          }
          break
          
        default:
          throw new Error('Unknown analysis type')
      }
      
      // Update cache with new result
      setAnalysisCache(prev => ({
        ...prev,
        [selectedMaterial.id]: {
          ...(prev[selectedMaterial.id] || {}),
          [type]: finalResult
        }
      }))
      
      // Persist AI Notes to the vault (only for notes type)
      if (type === 'notes' && typeof finalResult === 'string') {
        try {
          await saveToVault({
            material_id: selectedMaterial.id,
            user_id: user.id,
            content: finalResult,
            type: 'ai_notes'
          })
        } catch (error) {
          console.error('Failed to save notes to vault:', error)
        }
      }
      
    } catch (error) {
      console.error('Analysis error:', error)
      // Set error message in cache
      setAnalysisCache(prev => ({
        ...prev,
        [selectedMaterial.id]: {
          ...(prev[selectedMaterial.id] || {}),
          [type]: `Error: ${error.message}`
        }
      }))
    } finally {
      setIsAnalysisLoading(false)
    }
  }
  
  // Reset analysis when material changes
  useEffect(() => {
    if (selectedMaterial) {
      setMaterialAnalysis(null) // Reset cached analysis for new material
      console.log('Material changed, resetting analysis cache')
    }
  }, [selectedMaterial?.id])
  
  // Create debounced version of runAnalysis to prevent excessive calls
  const debouncedRunAnalysis = useCallback(debounce(async (type) => {
    await runAnalysis(type)
  }, 1000), [selectedMaterial, user, materialAnalysis])

  useEffect(() => {
    async function checkExistingAnalysis() {
      if (activeTab === 'notes' && selectedMaterial && !currentAnalysis[activeTab]) {
        // Try to fetch existing AI notes for this material
        try {
          const notesFromDb = await fetchUserNotes(user.id, courseId)
          const existingNote = notesFromDb.find(n => n.material_id === selectedMaterial.id && n.source_type === 'ai')
          
          if (existingNote) {
            setAnalysisCache(prev => ({
              ...prev,
              [selectedMaterial.id]: {
                ...(prev[selectedMaterial.id] || {}),
                notes: existingNote.content
              }
            }))
            return // Skip running analysis if already exists
          }
        } catch (err) {
          console.error("Error fetching existing notes:", err)
        }
      }
      
      if (activeTab !== 'content' && selectedMaterial && !currentAnalysis[activeTab] && selectedMaterial.processing_status !== 'pending') {
        runAnalysis(activeTab);
      }
    }
    
    checkExistingAnalysis();
  }, [activeTab, selectedMaterial, currentAnalysis]);

  const handleSend = async () => {
    if (!chatInput.trim() || isAiLoading) return
    
    const userMsg = { role: 'user', content: chatInput }
    setMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsAiLoading(true)

    try {
      // Use active context from the reading space, default to extracted_text
      const context = viewportData.visibleText || selectedMaterial?.extracted_text?.slice(0, 6000) || "" // Reduced token limit
      const statusContext = selectedMaterial?.processing_status === 'pending' 
        ? "NOTE: The document text is still being extracted so you cannot see it yet." 
        : `Active Context from current view: ${context}`

      // Check if user is asking for highlights
      const isHighlightRequest = chatInput.toLowerCase().includes('highlight') || 
                               chatInput.toLowerCase().includes('show me') ||
                               chatInput.toLowerCase().includes('point out') ||
                               chatInput.toLowerCase().includes('identify')

      let aiResponse
      let documentType = 'pdf' // Default, should be determined from material

      // Determine document type from material
      if (selectedMaterial?.type) {
        const type = selectedMaterial.type.toLowerCase()
        if (type.includes('pdf')) documentType = 'pdf'
        else if (type.includes('docx')) documentType = 'docx'
        else if (type.includes('xlsx') || type.includes('excel')) documentType = 'xlsx'
      }

      if (isHighlightRequest && selectedMaterial) {
        // Generate contextual highlights
        const highlightAnalysis = await AIHighlightService.triggerContextualHighlights(
          selectedMaterial, 
          chatInput, 
          documentType
        )
        
        // Generate AI response about the highlights
        const highlightPrompt = `
The user asked: "${chatInput}"

I have generated ${highlightAnalysis.highlights?.length || 0} highlights in the document. 
Please explain what I highlighted and why it's relevant to their question.

Highlights generated:
${highlightAnalysis.highlights?.map(h => `- ${h.label}: ${h.reason}`).join('\n') || 'No highlights generated'}

Provide a helpful response explaining the highlights.
`

        const response = await callGroqAPI(
          [
            { role: 'user', content: `Current Material: ${selectedMaterial?.title}. ${statusContext}\n\n${highlightPrompt}` }
          ],
          GROQ_MODELS.SPEEDSTER,
          { systemPromptOverride: GROQ_PROMPTS.AI_TUTOR }
        )
        
        aiResponse = response.choices[0].message.content
      } else {
        // Regular chat response
        const response = await callGroqAPI(
          [
            { role: 'user', content: `Current Material: ${selectedMaterial?.title}. ${statusContext}\n\nUser Question: ${chatInput}` }
          ],
          GROQ_MODELS.SPEEDSTER,
          { systemPromptOverride: GROQ_PROMPTS.AI_TUTOR }
        )
        
        aiResponse = response.choices[0].message.content
      }

      const aiMsg = { role: 'ai', content: aiResponse }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.error('Chat error:', err)
      let errorMessage = `Luter encountered an error. Please try again.`
      if (err.message.includes('413') || err.message.includes('tokens per minute')) {
        errorMessage = `The message is too large. Try asking a shorter question or breaking it into parts.`
      } else if (err.message) {
        errorMessage = `Luter encountered an error: ${err.message}. Please check your connection or try again.`
      }
      setMessages(prev => [...prev, { role: 'ai', content: errorMessage }])
    } finally {
      setIsAiLoading(false)
    }
  }

  const tabs = [
    { id: 'content', label: 'Workspace Home', icon: FileText },
    { id: 'notes', label: 'AI Notes', icon: Brain, description: 'Notes that write themselves' },
    { id: 'summary', label: 'AI Summarization', icon: Sparkles, description: 'Review faster, anytime' },
    { id: 'flashcards', label: 'AI Flashcards', icon: Layers, description: 'Make It Impossible to Forget' },
    { id: 'quiz', label: 'AI Quizzes', icon: HelpCircle, description: 'Test yourself before exams do' },
  ]


  // AUTO-GENERATION ON ARRIVAL - Non-blocking with error handling
  useEffect(() => {
    if (selectedMaterial?.processing_status === 'ready' && selectedMaterial?.extracted_text) {
      const categories = ['notes', 'summary', 'flashcards', 'quiz']
      categories.forEach(cat => {
        if (!analysisCache[selectedMaterial.id]?.[cat]) {
          // Run analysis in background without blocking UI
          runAnalysis(cat).catch(err => {
            console.warn(`Background analysis for ${cat} failed:`, err)
            // Set a fallback message so users can still access the tab
            setAnalysisCache(prev => ({
              ...prev,
              [selectedMaterial.id]: {
                ...(prev[selectedMaterial.id] || {}),
                [cat]: `AI analysis temporarily unavailable due to rate limits. Please try again later.`
              }
            }))
          })
        }
      })
    }
  }, [selectedMaterial?.id, selectedMaterial?.processing_status, selectedMaterial?.extracted_text])

  const AIDashboard = () => (
    <div style={{ padding: '40px', background: '#F8FAFC', minHeight: '100%', fontFamily: 'Outfit' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1A102D', marginBottom: '8px' }}>Welcome to your Workspace</h1>
        <p style={{ color: '#64748B', fontSize: '16px' }}>Luter has analyzed your material. What would you like to do first?</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {tabs.filter(t => ['notes', 'summary', 'flashcards', 'quiz'].includes(t.id)).map(feature => {
          const isDone = !!analysisCache[selectedMaterial?.id]?.[feature.id]
          const isLoading = isAnalysisLoading && activeTab === 'content' && !isDone
          const hasError = analysisCache[selectedMaterial?.id]?.[feature.id]?.includes('temporarily unavailable') || 
                          analysisCache[selectedMaterial?.id]?.[feature.id]?.includes('too large') ||
                          analysisCache[selectedMaterial?.id]?.[feature.id]?.includes('Analysis failed')

          return (
            <motion.div
              key={feature.id}
              whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(122, 18, 204, 0.1)' }}
              onClick={() => setActiveTab(feature.id)}
              style={{
                background: 'white',
                padding: '32px',
                borderRadius: '24px',
                border: '1.5px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ 
                width: '56px', 
                height: '56px', 
                background: hasError ? '#FEE2E2' : '#F5F3FF', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: hasError ? '#DC2626' : '#7a12cc'
              }}>
                {hasError ? <AlertCircle size={28} /> : <feature.icon size={28} />}
              </div>
              
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A102D', marginBottom: '8px' }}>{feature.label}</h3>
                <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.5 }}>
                  {hasError ? 'AI analysis failed. Tap to retry.' : feature.description}
                </p>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isDone && !hasError ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '13px', fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> Ready to use
                  </div>
                ) : hasError ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontSize: '13px', fontWeight: 700 }}>
                    <AlertCircle size={16} /> Tap to retry
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7a12cc', fontSize: '13px', fontWeight: 700 }}>
                    <Loader2 className="animate-spin" size={16} /> Generating...
                  </div>
                )}
                <div style={{ marginLeft: 'auto', color: '#94A3B8' }}>
                  <ChevronRight size={20} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Document always available */}
      <div style={{ marginTop: '48px', padding: '24px', background: '#F0FDF4', borderRadius: '16px', border: '1px solid #BBF7D0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <FileText size={20} color="#16A34A" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#16A34A', margin: 0 }}>Document Always Available</h3>
        </div>
        <p style={{ fontSize: '14px', color: '#15803D', margin: 0, lineHeight: 1.5 }}>
          Your document "{selectedMaterial?.title}" is always accessible for viewing, even if AI features are temporarily unavailable due to high demand.
        </p>
        <button 
          onClick={() => setShowDashboard(false)}
          style={{ 
            marginTop: '16px',
            padding: '12px 24px', 
            borderRadius: '12px', 
            background: '#16A34A', 
            color: 'white', 
            fontWeight: 600, 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          Open Document <ExternalLink size={16} />
        </button>
      </div>
    </div>
  )


  const currentTabIcon = tabs.find(t => t.id === activeTab)?.icon || FileText;

  return (
    <div className="ws-root">
      <SelectionActionBar onAction={handleSelectionAction} />
      <header className="ws-tabs-bar" style={{ 
        borderBottom: '1px solid #E2E8F0', 
        background: 'white', 
        height: '72px', 
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px'
      }}>
        {/* Left Section - Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }} 
            onMouseEnter={e => e.target.style.background = '#F5F3FF'} 
            onMouseLeave={e => e.target.style.background = 'none'}
          >
            <ArrowLeft size={20} color="#7a12cc" />
          </button>
          
          <div style={{ height: '20px', width: '1px', background: '#E2E8F0' }}></div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: '#64748B', minWidth: 0 }}>
            <span>Home</span> 
            <ChevronRight size={14} style={{ flexShrink: 0 }} /> 
            <span style={{ 
              color: '#1A102D', 
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '300px'
            }}>
              {selectedMaterial?.title || 'Loading...'}
            </span>
          </nav>
        </div>

        {/* Center Section - Tabs */}
        <div className="ws-nav-tabs" style={{ 
          background: '#F8FAFC', 
          padding: '4px', 
          borderRadius: '12px', 
          border: '1px solid #E2E8F0', 
          gap: '2px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'content') setShowDashboard(true) 
                if (tab.id === 'assignments') setHasNewAssignment(false)
              }}
              className={`ws-tab ${activeTab === tab.id ? 'ws-tab--active' : ''}`}
              style={{
                fontSize: '12px',
                padding: '8px 16px',
                height: '36px',
                minWidth: 'fit-content',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? '#7a12cc' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#64748B',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={e => {
                if (activeTab !== tab.id) {
                  e.target.style.background = '#F1F5F9'
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'transparent'
                }
              }}
            >
              <tab.icon size={13} />
              {tab.label === 'Workspace Home' ? 'Home' : tab.label.replace('AI ', '')}
            </button>
          ))}
        </div>

        {/* Right Section - Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
          {/* Reading Environment Indicator */}
          {activeTab === 'content' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '6px 12px',
              background: '#F0FDF4',
              borderRadius: '20px',
              border: '1px solid #BBF7D0'
            }}>
              <div style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: '#16A34A', 
                boxShadow: '0 0 6px #16A34A' 
              }} />
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 600, 
                color: '#16A34A', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Reading Mode
              </span>
            </div>
          )}

          {/* Material Selector */}
          {courseMaterials.length > 1 && (
            <select 
              value={selectedMaterial?.id}
              onChange={(e) => {
                const mat = courseMaterials.find(m => m.id === e.target.value)
                setSelectedMaterial(mat)
                clearHighlights()
              }}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '8px', 
                border: '1px solid #E2E8F0', 
                fontSize: '12px', 
                fontWeight: 500, 
                outline: 'none', 
                background: 'white',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              {courseMaterials.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          )}
          
          {/* Add Material Button */}
          <button 
            className="ws-send-btn" 
            onClick={() => navigate('/dashboard/courses')} 
            style={{ 
              padding: '8px 16px', 
              fontSize: '12px',
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.target.style.background = '#6d11b8'}
            onMouseLeave={e => e.target.style.background = '#7a12cc'}
          >
            <Plus size={14} /> Add Material
          </button>
        </div>
      </header>


      {/* Removed Redundant Header Bar */}


      <main className="ws-main-layout">
        <section className="ws-pane-left" style={{ position: 'relative', overflowY: 'auto', background: '#F8FAFC' }}>
          {activeTab === 'content' && (
            <MaterialRenderer 
              material={selectedMaterial} 
              activeTab={activeTab}
              analysisState={{ ...currentAnalysis, loading: isAnalysisLoading || isExtractingText }}
              onRunAnalysis={runAnalysis}
            />
          )}

          {activeTab === 'notes' && (
            <WorkstationNotes 
              content={currentAnalysis.notes} 
              material={selectedMaterial} 
              onRegenerate={() => runAnalysis('notes')} 
            />
          )}

          {activeTab === 'summary' && (
            <WorkstationSummary 
              content={currentAnalysis.summary} 
              material={selectedMaterial} 
            />
          )}

          {activeTab === 'flashcards' && (
            <WorkstationFlashcards 
              items={currentAnalysis.flashcards} 
              material={selectedMaterial} 
            />
          )}

          {activeTab === 'quiz' && (
            <WorkstationQuiz 
              items={currentAnalysis.quiz} 
              material={selectedMaterial} 
            />
          )}
        </section>

        <section className="ws-pane-right">

          <div className="ws-chat-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3E8FF', display: 'flex', alignItems: 'center', gap: 10 }}>
              <LuterLogo size={20} showText={false} />
              <span style={{ fontFamily: 'Varela Round', fontSize: '15px', color: '#4C1D95', fontWeight: 700 }}>Luter</span>
              <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#7a12cc', boxShadow: '0 0 8px rgba(122, 18, 204, 0.4)' }}></div>
            </div>
            
            <div className="ws-chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
                  <LuterLogo size={40} showText={false} style={{ margin: '0 auto 16px', filter: 'grayscale(0.2)' }} />
                  <p style={{ fontSize: '14px', fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 500 }}>I'm Luter, your personal tutor. Ask me anything about these materials!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`ws-chat-bubble ws-chat-bubble--${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {isAiLoading && (
                <div className="ws-chat-bubble ws-chat-bubble--ai" style={{ display: 'flex', gap: '4px' }}>
                  <div className="ws-typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7a12cc', animation: 'bounce 1s infinite' }}></div>
                  <div className="ws-typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7a12cc', animation: 'bounce 1s infinite 0.2s' }}></div>
                  <div className="ws-typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7a12cc', animation: 'bounce 1s infinite 0.4s' }}></div>
                </div>
              )}
            </div>

            <div className="ws-chat-input-area">
              <div className="ws-input-wrapper">
                <input 
                  type="text" 
                  className="ws-chat-input" 
                  placeholder="Ask Luter anything..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isAiLoading}
                />
                <button 
                  className="ws-send-btn" 
                  style={{ position: 'absolute', right: '8px', padding: '8px 12px' }}
                  onClick={handleSend}
                  disabled={isAiLoading || !chatInput.trim()}
                >
                  {isAiLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function WorkstationPage() {
  return (
    <ReadingSpaceProvider>
      <WorkstationContent />
    </ReadingSpaceProvider>
  )
}
