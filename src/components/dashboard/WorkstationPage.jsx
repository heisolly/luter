import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { 
  BookOpen, Star, FileText, CheckCircle2, ChevronRight, ArrowLeft, ExternalLink, Layers, HelpCircle, Plus, Search, ChevronLeft, Briefcase, PlayCircle, Settings, User, LogOut, MoreVertical, Layout, Bookmark, Zap, Send, Loader2, AlertCircle, Menu, Share, GraduationCap, Share2, ClipboardList, Mic, Baby, Copy, Check, Minus
} from 'lucide-react'

import LuterLogo from '../shared/LuterLogo'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import { supabase } from '../../supabaseClient'
import { ReadingSpaceProvider, useReadingSpace } from './ReadingSpaceContext'
import { SelectionActionBar } from './WorkstationOverlays'
import MaterialRenderer from './MaterialRenderer'
import { WorkstationNotes, WorkstationSummary, WorkstationFlashcards, WorkstationQuiz } from './WorkstationTools'
import { saveToVault, fetchUserNotes } from '../../services/materialsService'
import { queryStudyMaterials } from '../../services/langchainPipeline'
import { pollMaterialUntilReady } from '../../services/materialsService'
import { MaterialAnalysisService } from '../../services/materialAnalysisService'
import { debounce } from '../../utils/debounce'
import './workstation.css'

const SUGGESTED_QUESTIONS = [
  { id: 'el5', text: "explain it like i'm five years old" },
  { id: 'analogy', text: "give me an analogy" },
  { id: 'mnemonic', text: "give me a mnemonic to help me remember" },
  { id: 'animals', text: "explain it through a conversation between two animals" },
]

function WorkstationContent() {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const { user } = useOutletContext()
  const [searchParams] = useSearchParams()
  const materialIdParam = searchParams.get('materialId')
  const { setViewportData, highlightText, updateSpark, clearHighlights, viewportData, updateSelection, isSidePanelCollapsed } = useReadingSpace()
  
  const [activeTab, setActiveTab] = useState('content')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isProcessingLoading, setIsProcessingLoading] = useState(false)
  const [courseMaterials, setCourseMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [courseInfo, setCourseInfo] = useState(null)
  const [analysisCache, setAnalysisCache] = useState({})
  const [materialAnalysis, setMaterialAnalysis] = useState(null) // Cached analysis from Supabase
  const [showTools, setShowTools] = useState(false)
  const [hasNewAssignment, setHasNewAssignment] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  
  // Analysis cache: materialId -> { notes, summary, flashcards, quiz }
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false)
  const [isExtractingText, setIsExtractingText] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [mobileReadingMode, setMobileReadingMode] = useState('document') // 'document' or 'notes'
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom of chat with adaptive delay for smooth tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [messages, isProcessingLoading])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const currentAnalysis = selectedMaterial ? (analysisCache[selectedMaterial.id] || {}) : {}

  const isPlaceholderContent = (content) => {
    if (!content) return true
    if (typeof content !== 'string') return false
    return content.includes('will be available shortly') || 
           content.includes('analysis to complete') || 
           content.includes('temporarily unavailable') ||
           content.startsWith('Error:')
  }


  useEffect(() => {
    if (!selectedMaterial || selectedMaterial.processing_status !== 'pending') {
      setIsExtractingText(false)
      return
    }

    setIsExtractingText(true)
    let isMounted = true
    let cleanup = null

    cleanup = pollMaterialUntilReady(selectedMaterial.id, {
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
        setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't read the text inside this file. It might be corrupt or an unsupported format." }])
      }
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
    { id: 'smart-notes', label: 'Smart Notes', icon: BookOpen, path: '/dashboard/ai-notes' },
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
      fetchCourseInfo()
      fetchMaterials()
      checkAssignments()
    }
  }, [courseId])

  async function fetchCourseInfo() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle()
      
      if (data) {
        setCourseInfo(data)
      }
    } catch (err) {
      console.error('Error fetching course info:', err)
    }
  }

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
      
      // If materialId is provided in URL, find it. Otherwise default to first.
      const initialMaterial = materialIdParam 
        ? data.find(m => m.id === materialIdParam) || data[0]
        : data[0]
        
      setSelectedMaterial(initialMaterial)
      setShowDashboard(false) // Default to reader on material arrival
    }
  }

  // Fetch analysis from Supabase and cache it
  async function fetchAnalysis(materialId) {
    try {
      const { data, error } = await supabase
        .from('material_analysis')
        .select('*')
        .eq('material_id', materialId)
        .maybeSingle() // Use maybeSingle to handle no data gracefully
      
      if (data) {
        // Support both legacy (analysis column) and modern (granular columns)
        setAnalysisCache(prev => ({
          ...prev,
          [materialId]: {
            notes: data.smart_notes || (data.analysis?.smart_notes || data.analysis?.notes) || null,
            summary: data.summary || data.analysis?.summary || null,
            flashcards: data.flashcards || data.analysis?.flashcards || null,
            quiz: data.quiz || data.analysis?.quiz || null
          }
        }))
        // Store the full row as materialAnalysis to ensure we have the analysis object for fallbacks
        setMaterialAnalysis(data.analysis || data)
      }
    } catch (err) {
      console.error('Error fetching analysis:', err)
    }
  }

  useEffect(() => {
    if (selectedMaterial?.id) {
       fetchAnalysis(selectedMaterial.id)
    }
  }, [selectedMaterial?.id])



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
    setIsProcessingLoading(true)

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
      setIsProcessingLoading(false)
    }
  }

  // RAG & Analysis Logic - Updated to use cached analysis
  const runAnalysis = async (type) => {
    if (isExtractingText || isAnalysisLoading || !selectedMaterial) return
    
    setIsAnalysisLoading(true)
    try {
      // Check if we already have this type in cache
      if (analysisCache[selectedMaterial.id]?.[type]) {
        setIsAnalysisLoading(false)
        return
      }

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
            
            const notesPrompt = `You are Luter Tutor. Your mission is to provide 'Addictive Learning' — notes that are so clear and visually beautiful that students want to keep reading.

Rules for your layout:
1. USE HEADERS: Break topics into sections with ### headings to create hierarchy.
2. COLORFUL HIGHLIGHTS: Use **bolding** for critical keywords and terms.
3. BITE-SIZED: Never use text blocks longer than 3 sentences. Frequent use of bullet points is mandatory.
4. CALLOUTS: Use > blockquotes for 'Luter Lessons' or 'Exam Tips'.
5. ACADEMIC GOLD: Maintain high academic rigour while using Nigerian university context examples.

Material Title: ${selectedMaterial.title || 'Untitled'}
Material Type: ${selectedMaterial.type || 'document'}

Content:
${content}`
            
            const response = await callGroqAPI(
              [{ role: 'user', content: notesPrompt }],
              GROQ_MODELS.SPEEDSTER, // Switched to 8B for better TPD management
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
      
      // Save all analysis artifacts to material_analysis table for cross-session persistence
      try {
        const dbColumn = 
          type === 'notes' ? 'smart_notes' : 
          type === 'summary' ? 'summary' : 
          type === 'flashcards' ? 'flashcards' : 
          type === 'quiz' ? 'quiz' : null;

        if (dbColumn) {
          const { error: upsertError } = await supabase.from('material_analysis').upsert({
            material_id: selectedMaterial.id,
            user_id: user?.id,
            [dbColumn]: finalResult,
            analysis: materialAnalysis || {}, // Fallback for legacy NOT NULL constraint
            updated_at: new Date().toISOString()
          }, { onConflict: 'material_id' });

          if (upsertError) console.error(`Upsert Error (${type}):`, upsertError.message, upsertError.details);
        }
      } catch (dbError) {
        console.error('Failed to save analysis to DB:', dbError);
      }
      
      // Persist AI Notes to the vault (only for notes type)
      if (type === 'notes' && typeof finalResult === 'string') {
        try {
          console.log('Attempting to save to vault:', {
            material_id: selectedMaterial.id,
            user_id: user.id,
            course_id: courseId,
            title: `${selectedMaterial.title} - Smart Notes`,
            sourceType: 'ai_notes'
          })
          
          await saveToVault({
            materialId: selectedMaterial.id,
            userId: user.id,
            courseId: courseId,
            title: `${selectedMaterial.title} - Smart Notes`,
            content: finalResult,
            sourceType: 'ai'
          })
          
          console.log('Successfully saved to vault')
        } catch (error) {
          console.error('Failed to save notes to vault:', error)
          // Don't fail the entire operation if vault save fails
          // This is a non-critical feature
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
      
      const content = currentAnalysis[activeTab]
      if (activeTab !== 'content' && selectedMaterial && isPlaceholderContent(content) && selectedMaterial.processing_status !== 'pending' && !isAnalysisLoading) {
        runAnalysis(activeTab);
      }
    }
    
    checkExistingAnalysis();
  }, [activeTab, selectedMaterial, currentAnalysis]);

  // ─── LangChain RAG Chat ──────────────────────────────────────────────────────
  const handleSend = async (forcedInput) => {
    // If called from a suggestion button, forcedInput will be the string
    // If called from the send button/Enter key, forcedInput might be the event object
    const textToSend = typeof forcedInput === 'string' ? forcedInput : chatInput
    
    if (!textToSend.trim() || isProcessingLoading) return

    const userMsg = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setChatInput('') // Always clear manual input
    setIsProcessingLoading(true)

    try {
      if (selectedMaterial?.processing_status === 'pending') {
        setMessages(prev => [...prev, { role: 'ai', content: "Your document is still being processed. Please wait a moment." }])
        return
      }

      const aiResponse = await queryStudyMaterials({
        question: textToSend,
        courseId: courseId,
        materialId: selectedMaterial?.id,
        fallbackContext: selectedMaterial?.extracted_text?.slice(0, 8000) || ''
      })

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }])
    } catch (err) {
      console.error('[Chat] Error:', err)
      setMessages(prev => [...prev, { role: 'ai', content: 'Luter encountered an error. Please try again.' }])
    } finally {
      setIsProcessingLoading(false)
    }
  }

  const tabs = [
    { id: 'content', label: 'Read', icon: FileText },
    { id: 'notes', label: 'Smart Notes', icon: BookOpen, description: 'Notes that write themselves' },
    { id: 'summary', label: 'Summarization', icon: Zap, description: 'Review faster, anytime' },
    { id: 'flashcards', label: 'Smart Flashcards', icon: Layers, description: 'Make It Impossible to Forget' },
    { id: 'quiz', label: 'Practice Quizzes', icon: HelpCircle, description: 'Test yourself before exams do' },
  ]


  // AUTO-GENERATION ON ARRIVAL - Disabled to prevent 429 Rate Limits
  useEffect(() => {
    // Only pre-generate the summary on arrival to give the student a starting point.
    // Everything else (notes, quiz, flashcards) will generate ONLY when the tab is clicked.
    if (selectedMaterial?.processing_status === 'ready' && selectedMaterial?.extracted_text) {
      if (!analysisCache[selectedMaterial.id]?.summary) {
        runAnalysis('summary').catch(err => console.warn('Background summary failed:', err))
      }
    }
  }, [selectedMaterial?.id, selectedMaterial?.processing_status])


  return (
    <div className="ws-root">
      <SelectionActionBar onAction={handleSelectionAction} />
      
      {/* ── Desktop Header ── */}
      {!isMobile && (
        <header className="ws-global-glass-header">
          <div className="ws-header-left">
            <div className="ws-breadcrumb-minimal">
              <span className="ws-bc-course" onClick={() => navigate(`/dashboard/courses/${courseId}`)}>
                {courseInfo?.code || 'Course'}
              </span>
              <ChevronRight size={14} className="ws-bc-sep" />
              <span className="ws-bc-week">Week {selectedMaterial?.week_number || '1'}</span>
              <ChevronRight size={14} className="ws-bc-sep" />
              <h1 className="ws-bc-title">{selectedMaterial?.title || 'Material'}</h1>
            </div>
          </div>

          <div className="ws-header-right">
            <button className="ws-glass-action">
              <Share2 size={16} />
              <span>Share</span>
            </button>
            <button 
              className="ws-glass-exit"
              onClick={() => navigate(`/dashboard/courses/${courseId}`)}
            >
              Exit Workspace
            </button>
          </div>
        </header>
      )}

      {/* ── Mobile Toolbar (Unified) ── */}
      {isMobile && !showDashboard && (
        <div style={{ 
          padding: '12px 20px', 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #E2E8F0', 
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', background: '#F5F3FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} color="#7a12cc" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#1A102D' }}>{courseInfo?.code || 'Luter'}</span>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Week {selectedMaterial?.week_number || '1'}</span>
              </div>
            </div>
            <button 
              className="ws-tactile-btn" 
              style={{ padding: '8px 16px', fontSize: '12px', background: '#F5F3FF', color: '#7a12cc', border: '1px solid #E2E8F0' }}
              onClick={() => navigate(`/dashboard/courses/${courseId}`)}
            >
              <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Exit
            </button>
          </div>
          
          {activeTab === 'content' && (
            <div className="mobile-segmented-control" style={{ margin: '0', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
              <button 
                className={`segmented-item ${mobileReadingMode === 'document' ? 'segmented-item--active' : ''}`} 
                onClick={() => setMobileReadingMode('document')}
                style={{ borderRadius: '8px' }}
              >
                 <FileText size={16} /> Document
              </button>
              <button 
                className={`segmented-item ${mobileReadingMode === 'notes' ? 'segmented-item--active' : ''}`} 
                onClick={() => setMobileReadingMode('notes')}
                style={{ borderRadius: '8px' }}
              >
                 <BookOpen size={16} /> Notes
              </button>
            </div>
          )}
        </div>
      )}

      <main className="ws-main-layout" style={{ 
        flexDirection: isMobile ? 'column' : 'row',
        background: '#F3F4F6',
        overflow: isMobile ? 'auto' : 'hidden',
        padding: '0'
      }}>
        <div className="ws-pane-left" style={{ 
          display: (isMobile && activeTab !== 'content' && activeTab !== 'notes') ? 'none' : 'flex',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Removed redundant mobile controls to unify with topbar */}

          <div className="ws-canvas-container" style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'notes' ? (
              <div className="ws-ai-content-pane main-canvas-tool">
                <WorkstationNotes material={selectedMaterial} content={currentAnalysis.notes} />
              </div>
            ) : activeTab === 'summary' ? (
              <div className="ws-ai-content-pane main-canvas-tool">
                <WorkstationSummary material={selectedMaterial} content={currentAnalysis.summary} />
              </div>
            ) : activeTab === 'flashcards' ? (
              <div className="ws-ai-content-pane main-canvas-tool">
                <WorkstationFlashcards material={selectedMaterial} items={currentAnalysis.flashcards} user={user} />
              </div>
            ) : activeTab === 'quiz' ? (
              <div className="ws-ai-content-pane main-canvas-tool">
                <WorkstationQuiz material={selectedMaterial} items={currentAnalysis.quiz} />
              </div>
            ) : (isMobile && mobileReadingMode === 'notes') ? (
              <div className="ws-ai-content-pane">
                <WorkstationNotes material={selectedMaterial} content={currentAnalysis.notes} />
              </div>
            ) : (
              <div className="ws-content-scroll" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <MaterialRenderer 
                  material={selectedMaterial} 
                  activeTab="content"
                  onScrollUpdate={setViewportData} 
                />
              </div>
            )}
          </div>
        </div>

        {!isSidePanelCollapsed && (
          <div className="ws-pane-right" style={{ 
            display: (isMobile && activeTab === 'content') ? 'none' : 'flex',
            flexDirection: 'column'
          }}>
          {!isMobile || activeTab === 'content' ? (
            <div className="ws-chat-container">
              <header className="ws-side-tabs-header">
                <div className="ws-side-tabs">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`ws-side-tab ${activeTab === tab.id ? 'ws-side-tab--active' : ''}`}
                    >
                      <div className={`ws-tab-dot ${activeTab === tab.id ? 'active' : ''}`} />
                      <tab.icon size={14} />
                      <span>{tab.label.replace('AI ', '').replace('Smart ', '').replace('Practice ', '')}</span>
                    </button>
                  ))}
                  <button className="ws-side-tab">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </header>

              <div className="ws-chat-messages">
                {messages.length === 0 ? (
                  <div className="ws-chat-empty-state">
                    <h2 className="ws-chat-empty-title">Research Assistant</h2>
                    <p className="ws-chat-empty-subtitle">I've analyzed this document. How can I help you today?</p>
                    
                    <div className="ws-suggested-section">
                      <div className="ws-suggested-list-premium">
                        {SUGGESTED_QUESTIONS.map(q => (
                          <button key={q.id} className="ws-suggested-row" onClick={() => handleSend(q.text)}>
                            <span className="ws-suggested-text">{q.text}</span>
                            <Plus size={14} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    // Turn "page 5" or "Page 12" into clickable markdown links
                    // Regex fix: AI sometimes adds a space between [View Source] and (source://)
                    // We also ensure the URL part is properly encoded if it contains spaces
                    const sanitizedContent = msg.content.replace(/\[View Source\]\s*\(source:\/\/([^)]+)\)/g, (match, p1) => {
                      const encoded = p1.split('|').map((part, index) => {
                        // If it's a text snippet (odd index after split by | if we count 0 as 'page', 1 as num, 2 as 'text', 3 as snippet)
                        // Actually, parts are [key, val, key, val]
                        return index % 2 === 1 ? encodeURIComponent(decodeURIComponent(part)) : part
                      }).join('|')
                      return `[View Source](source://${encoded})`
                    })
                    
                    const withLinks = msg.role === 'ai' 
                      ? sanitizedContent.replace(/\b(page\s*(\d+))\b/gi, '[$1](#page-$2)')
                      : msg.content

                    // Split suggestions from main content
                    const [mainPart, suggestionPart] = withLinks.split('---SUGGESTIONS---')
                    const suggestions = suggestionPart ? suggestionPart.split('|').map(s => s.trim()).filter(Boolean) : []

                    return (
                      <div key={i} className={`ws-chat-bubble-group`}>
                        <div className={`ws-chat-bubble ws-chat-bubble--${msg.role}`}>
                          {msg.role === 'ai' && (
                            <button 
                              className="ws-copy-to-notes" 
                              title="Add to Smart Notes"
                              onClick={() => {
                                // Add to notes logic
                                setAnalysisCache(prev => ({
                                  ...prev,
                                  [selectedMaterial.id]: {
                                    ...(prev[selectedMaterial.id] || {}),
                                    notes: (prev[selectedMaterial.id]?.notes || '') + '\n\n' + mainPart
                                  }
                                }))
                                alert('Added to Smart Notes!')
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          )}
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ children, href, ...props }) => {
                                if (href?.startsWith('source://')) {
                                  try {
                                    const parts = href.replace('source://', '').split('|')
                                    let pageNum = 1
                                    let snippet = ""
                                    for(let i=0; i<parts.length; i+=2) {
                                      if(parts[i] === 'page' && parts[i+1]) pageNum = parseInt(parts[i+1])
                                      if(parts[i] === 'text' && parts[i+1]) snippet = decodeURIComponent(parts[i+1])
                                    }
                                    return (
                                      <button 
                                        className="ws-citation-pill" 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          window.dispatchEvent(new CustomEvent('luter-jump-to-page', { detail: { page: pageNum } }))
                                          if (snippet) window.dispatchEvent(new CustomEvent('luter-highlight-text', { detail: { text: snippet } }))
                                        }}
                                      >
                                        <Bookmark size={10} />
                                        View Page {pageNum}
                                      </button>
                                    )
                                  } catch (e) { return <span className="ws-citation-error">{children}</span> }
                                }
                                
                                if (href?.startsWith('#page-')) {
                                  const pageNum = parseInt(href.split('-')[1])
                                  return (
                                    <span 
                                      className="ws-chat-page-link"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        window.dispatchEvent(new CustomEvent('luter-jump-to-page', { detail: { page: pageNum } }))
                                      }}
                                    >
                                      {children}
                                    </span>
                                  )
                                }
                                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
                              }
                            }}
                          >
                            {mainPart}
                          </ReactMarkdown>
                        </div>
                        
                        {suggestions.length > 0 && (
                          <div className="ws-follow-up-section">
                            <h4 className="ws-follow-up-title">Follow-up questions</h4>
                            <div className="ws-follow-up-list">
                              {suggestions.map((s, idx) => (
                                <button 
                                  key={idx} 
                                  className="ws-follow-up-item"
                                  onClick={() => handleSend(s)}
                                >
                                  <span>{s}</span>
                                  <Plus size={16} className="ws-follow-up-plus" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
                {isProcessingLoading && (
                  <div className="ws-chat-bubble ws-chat-bubble--ai ws-thinking-bubble">
                    <div className="ws-thinking-content">
                      <div className="ws-thinking-dots">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 1, 0.3]
                            }}
                            transition={{ 
                              duration: 1.2, 
                              repeat: Infinity, 
                              delay: i * 0.2,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="ws-chat-input-area">
                <div className="ws-chat-input-outer">
                  <input 
                    className="ws-chat-input-field" 
                    placeholder="Ask a question..." 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSend()} 
                  />
                  <button className="ws-chat-mic-btn">
                    <Mic size={18} />
                  </button>
                  <button 
                    className="ws-chat-send-btn" 
                    onClick={() => handleSend()} 
                    disabled={isProcessingLoading || !chatInput.trim()}
                    style={{ background: '#7a12cc', color: 'white' }}
                  >
                    {isProcessingLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          </div>
        )}
      </main>

      {isMobile && (
        <div className="mobile-bottom-nav">
          <button className={`mobile-nav-item ${activeTab === 'content' ? 'mobile-nav-item--active mobile-nav-item--accent' : ''}`} onClick={() => setActiveTab('content')}>
            <Layout size={20} /><span>Source</span>
          </button>
          <button className={`mobile-nav-item ${activeTab === 'flashcards' ? 'mobile-nav-item--active' : ''}`} onClick={() => setActiveTab('flashcards')}>
            <Layers size={20} /><span>Flashcards</span>
          </button>
          <button className={`mobile-nav-item ${activeTab === 'quiz' ? 'mobile-nav-item--active' : ''}`} onClick={() => setActiveTab('quiz')}>
            <ClipboardList size={20} /><span>Quizzes</span>
          </button>
        </div>
      )}
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
