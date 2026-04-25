import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  House as HouseLight,
  CaretLeft as CaretLeftLight,
  CaretRight as CaretRightLight,
  FileText as FileTextLight,
  Sparkle as SparkleLight,
  CardsThree,
  Checks,
  ShareNetwork as ShareNetworkLight,
  DotsThree as DotsThreeLight,
  Lightning as LightningLight,
  NotePencil,
  PencilSimple,
  ArrowRight as ArrowRightLight,
  BookmarkSimple
} from '@phosphor-icons/react'
import { 
  RiBookOpenFill as BookOpen, RiStarFill as Star, RiFileTextFill as FileText, RiCheckboxCircleFill as CheckCircle, RiArrowRightSLine as CaretRight, RiArrowLeftLine as ArrowLeft, RiExternalLinkLine as ArrowSquareOut, RiStackFill as Stack, 
  RiQuestionFill as Question, RiAddLine as Plus, RiSearchLine as MagnifyingGlass, RiArrowLeftSLine as CaretLeft, RiBriefcaseFill as Briefcase, RiPlayCircleFill as PlayCircle, RiSettings4Fill as Settings, RiUserFill as User, RiLogoutBoxLine as SignOut, 
  RiMore2Fill as DotsThreeVertical, RiLayoutMasonryFill as Layout, RiBookmarkFill as Bookmark, RiFlashlightFill as Zap, RiSendPlaneFill as PaperPlaneRight, RiLoader4Line as CircleNotch, RiErrorWarningFill as Warning, RiListCheck as List, RiShareFill as Share, 
  RiGraduationCapFill as GraduationCap, RiShareForwardFill as ShareNetwork, RiClipboardFill as ClipboardText, RiMicFill as Microphone, RiUserSmileFill as Baby, RiFileCopyFill as Copy, RiCheckLine as Check, RiSubtractLine as Minus, RiMagicFill as Sparkles, 
  RiLightbulbFill as Lightbulb, RiChat3Fill as ChatCircleText, RiRefreshLine as ArrowClockwise, RiArrowRightLine as ArrowRight, RiHome4Fill as House, RiCheckboxFill as CheckSquare, RiMoreFill as DotsThreeOutline, 
  RiStickyNoteFill as Note, RiArrowUpLine as ArrowUp, RiBookFill as Book, RiStackFill as Library, RiPencilFill as PencilLine, RiLayoutColumnFill as Columns, RiFullscreenFill as CornersOut, RiZoomInLine as MagnifyingGlassPlus
} from "react-icons/ri"

import LuterLogo from '../shared/LuterLogo'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import { supabase } from '../../supabaseClient'
import { ReadingSpaceProvider, useReadingSpace } from './ReadingSpaceContext'
import { SelectionActionBar } from './WorkstationOverlays'
import MaterialRenderer from './MaterialRenderer'
import { WorkstationNotes, WorkstationSummary, WorkstationFlashcards, WorkstationQuiz, WorkstationWrite, WorkstationSummaryEnhanced } from './WorkstationTools'
import { saveToVault, fetchUserNotes, deleteUserNote } from '../../services/materialsService'
import { queryStudyMaterials, reprocessMaterial } from '../../services/langchainPipeline'
import { pollMaterialUntilReady } from '../../services/materialsService'
import { MaterialAnalysisService } from '../../services/materialAnalysisService'
import { useDeckStore } from '../../store/useDeckStore'
import { debounce } from '../../utils/debounce'
import './workstation.css'

const SUGGESTED_QUESTIONS = [
  { id: 'el5', text: "explain it like i'm five years old" },
  { id: 'analogy', text: "give me an analogy" },
  { id: 'mnemonic', text: "give me a mnemonic to help me remember" },
  { id: 'animals', text: "explain it through a conversation between two animals" },
]

function WorkstationContent() {
  const { t } = useTranslation(['workspace'])
  const navigate = useNavigate()
  const { courseId } = useParams()
  const context = useOutletContext() || {}
  const { user } = context
  const [searchParams] = useSearchParams()
  const materialIdParam = searchParams.get('materialId')
  const { setViewportData, highlightText, updateSpark, clearHighlights, viewportData, updateSelection, isSidePanelCollapsed, setSidePanelCollapsed } = useReadingSpace()
  
  const [activeTab, setActiveTab] = useState('content')
  const [activeSideTab, setActiveSideTab] = useState('chat')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isProcessingLoading, setIsProcessingLoading] = useState(false)
  const [courseMaterials, setCourseMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [courseInfo, setCourseInfo] = useState(null)
  const [analysisCache, setAnalysisCache] = useState({})
  const [materialAnalysis, setMaterialAnalysis] = useState(null)
  const [showTools, setShowTools] = useState(false)
  const [hasNewAssignment, setHasNewAssignment] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false)
  const [isExtractingText, setIsExtractingText] = useState(false)
  const constraintsRef = useRef(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [mobileReadingMode, setMobileReadingMode] = useState('document')
  const [pageSummaries, setPageSummaries] = useState({})
  const [userJottings, setUserJottings] = useState("")
  const [jottingNoteId, setJottingNoteId] = useState(null)
  const messagesEndRef = useRef(null)
  
  // Deck Store integration
  const { activeDeckItems } = useDeckStore()

  // Use the context from useOutletContext to handle sidebar
  const { sidebarCollapsed, setSidebarCollapsed } = context

  useEffect(() => {
    // Auto-collapse sidebar only once on mount
    if (typeof setSidebarCollapsed === 'function') {
      setSidebarCollapsed(true)
    }
  }, []) // Empty dependency array means this runs only once on mount

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
    if (!selectedMaterial) return

    // Case 1: Material is pending -> Start polling
    if (selectedMaterial.processing_status === 'pending') {
      setIsExtractingText(true)
      let isMounted = true
      const cleanup = pollMaterialUntilReady(selectedMaterial.id, {
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
        }
      })
      return () => { isMounted = false; if (cleanup) cleanup(); }
    }

    // Case 2: Material is "ready" but has NO text -> Trigger emergency extraction
    if (selectedMaterial.processing_status === 'ready' && !selectedMaterial.extracted_text) {
      const triggerEmergency = async () => {
        setIsExtractingText(true)
        const result = await reprocessMaterial(selectedMaterial)
        if (result.success && result.fullText) {
          setSelectedMaterial(prev => ({ ...prev, extracted_text: result.fullText }))
          setCourseMaterials(prev => prev.map(m => m.id === selectedMaterial.id ? { ...m, extracted_text: result.fullText } : m))
        }
        setIsExtractingText(false)
      }
      triggerEmergency()
    }
  }, [selectedMaterial?.id, selectedMaterial?.processing_status, selectedMaterial?.extracted_text])

  useEffect(() => {
    const handleMouseUp = (e) => {
      const readingPane = document.querySelector('.ws-pane-left')
      if (!readingPane || !readingPane.contains(e.target)) {
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
    } else if (materialIdParam) {
      fetchStandaloneMaterial(materialIdParam)
    } else if (activeDeckItems.length > 0) {
      // Load materials from deck if no courseId is provided
      loadDeckMaterials()
    }
  }, [courseId, materialIdParam, activeDeckItems.length])

  async function loadDeckMaterials() {
    setLoading(true)
    try {
      const materialIds = activeDeckItems
        .filter(item => item.content_type !== 'assignment' && item.content_type !== 'ai_note')
        .map(item => item.content_id)
      
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .in('id', materialIds)
      
      if (data) {
        setCourseMaterials(data)
        const initialMaterial = materialIdParam 
          ? data.find(m => m.id === materialIdParam) || data[0]
          : data[0]
        setSelectedMaterial(initialMaterial)
      }
    } catch (err) {
      console.error('Error loading deck materials:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStandaloneMaterial(materialId) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setCourseMaterials([data])
        setSelectedMaterial(data)
        setShowDashboard(false)
      }
    } catch (err) {
      console.error('Error loading standalone material:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCourseInfo() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle()
      if (data) setCourseInfo(data)
    } catch (err) {
      console.error('Error fetching course info:', err)
    }
  }

  async function checkAssignments() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('materials')
      .select('id')
      .eq('course_id', courseId)
      .eq('type', 'assignment')
      .gt('created_at', yesterday)
    if (data && data.length > 0) setHasNewAssignment(true)
  }

  async function fetchMaterials() {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', courseId)
    if (data && data.length > 0) {
      setCourseMaterials(data)
      const initialMaterial = materialIdParam 
        ? data.find(m => m.id === materialIdParam) || data[0]
        : data[0]
      setSelectedMaterial(initialMaterial)
      setShowDashboard(false)
    }
  }

  async function fetchAnalysis(materialId) {
    try {
      const { data, error } = await supabase
        .from('material_analysis')
        .select('*')
        .eq('material_id', materialId)
        .maybeSingle()
      if (data) {
        setAnalysisCache(prev => ({
          ...prev,
          [materialId]: {
            notes: data.smart_notes || (data.analysis?.smart_notes || data.analysis?.notes) || null,
            summary: data.summary || data.analysis?.summary || null,
            flashcards: data.flashcards || data.analysis?.flashcards || null,
            quiz: data.quiz || data.analysis?.quiz || null
          }
        }))
        setMaterialAnalysis(data.analysis || data)
      }
    } catch (err) {
      console.error('Error fetching analysis:', err)
    }
  }

  useEffect(() => {
    if (selectedMaterial?.id) fetchAnalysis(selectedMaterial.id)
  }, [selectedMaterial?.id])

  const handleSelectionAction = async (action, text) => {
    let prompt;
    switch(action) {
      case 'explain': prompt = `User highlighted this text: "${text}". Please explain this specific part of the document in simple terms.`; break;
      case 'summarize': prompt = `User highlighted this text: "${text}". Provide a concise summary of this specific section.`; break;
      case 'save': prompt = `User highlighted this text: "${text}". I want to add this to my vault/summary. Can you rephrase it into a key learning point?`; break;
      default: return;
    }
    const userMsg = { role: 'user', content: `[${action.toUpperCase()}] "${text.slice(0, 50)}..."` }
    setMessages(prev => [...prev, userMsg])
    setIsProcessingLoading(true)
    try {
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
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't process that selection. Please try again." }])
    } finally {
      setIsProcessingLoading(false)
    }
  }

  async function handleFetchPageSummaries() {
    if (!selectedMaterial) return
    try {
      if (currentAnalysis.page_summaries) {
        setPageSummaries(currentAnalysis.page_summaries)
        return
      }
      const pageTextMap = await MaterialAnalysisService.getPageTextMap(selectedMaterial.id)
      const summaries = await MaterialAnalysisService.generatePageByPageSummary(selectedMaterial.id, pageTextMap)
      setPageSummaries(summaries)
      
      // Cache it
      setAnalysisCache(prev => ({
        ...prev,
        [selectedMaterial.id]: {
          ...(prev[selectedMaterial.id] || {}),
          page_summaries: summaries
        }
      }))
      
      // Sync to DB
      await supabase.from('material_analysis')
        .upsert({ 
          material_id: selectedMaterial.id, 
          user_id: user.id, 
          analysis: { ...(currentAnalysis || {}), page_summaries: summaries },
          updated_at: new Date().toISOString()
        }, { onConflict: 'material_id' })

    } catch (e) {
      console.error('Error fetching page summaries:', e)
    }
  }

  async function handleSaveNote(content) {
    if (!selectedMaterial || !user) return
    try {
      // If we have an existing note ID, we should update it. 
      // Current saveToVault always inserts. Let's update saveToVault or use a direct upsert here.
      const { data, error } = await supabase
        .from('user_notes')
        .upsert({
          id: jottingNoteId || undefined,
          user_id: user.id,
          course_id: courseId,
          material_id: selectedMaterial.id,
          title: `Jottings for ${selectedMaterial.title}`,
          content: content,
          source_type: 'jotting',
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (data) {
        setJottingNoteId(data.id)
        setUserJottings(data.content)
      }
    } catch (e) {
      console.error('Error saving note:', e)
    }
  }

  useEffect(() => {
    async function fetchJottings() {
      if (!selectedMaterial || !user) return
      const { data } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('material_id', selectedMaterial.id)
        .eq('source_type', 'jotting')
        .maybeSingle()
      
      if (data) {
        setJottingNoteId(data.id)
        setUserJottings(data.content)
      } else {
        setJottingNoteId(null)
        setUserJottings("")
      }
    }
    fetchJottings()
    // Also reset page summaries when material changes
    setPageSummaries(currentAnalysis.page_summaries || {})
  }, [selectedMaterial?.id, user?.id])

  useEffect(() => {
    if ((activeTab === 'content' || activeTab === 'summary') && selectedMaterial?.processing_status === 'ready' && !selectedMaterial.extracted_text) {
      reprocessMaterial(selectedMaterial).then(res => {
        if (res.success && res.fullText) {
          setSelectedMaterial(prev => ({ ...prev, extracted_text: res.fullText }))
        }
      })
    }
  }, [activeTab, selectedMaterial?.id])

  const runAnalysis = async (type) => {
    if (isExtractingText || isAnalysisLoading || !selectedMaterial) return
    setIsAnalysisLoading(true)
    try {
      if (analysisCache[selectedMaterial.id]?.[type]) {
        setIsAnalysisLoading(false)
        return
      }
      let currentAnalysisRow = materialAnalysis
      
      // FORCE REFRESH: Fetch the latest material data to ensure we have the extracted_text
      const { data: latestMaterial } = await supabase
        .from('materials')
        .select('extracted_text')
        .eq('id', selectedMaterial.id)
        .single()
      
      if (latestMaterial?.extracted_text) {
        selectedMaterial.extracted_text = latestMaterial.extracted_text
      }

      if (!materialAnalysis || !materialAnalysis.summary) {
        const analysisResult = await MaterialAnalysisService.getOrCreateAnalysis(selectedMaterial.id, selectedMaterial, user.id)
        if (analysisResult.success) {
          setMaterialAnalysis(analysisResult.analysis)
          currentAnalysisRow = analysisResult.analysis
        } else {
          throw new Error(analysisResult.error)
        }
      }
      let finalResult
      switch(type) {
        case 'notes':
          try {
            const content = selectedMaterial.extracted_text?.slice(0, 6000) || ''
            if (!content) { finalResult = 'No content available.'; break; }
            const notesPrompt = `You are Luter Tutor. Provide academic notes for this material. Title: ${selectedMaterial.title}. Content: ${content}`
            const response = await callGroqAPI([{ role: 'user', content: notesPrompt }], GROQ_MODELS.SPEEDSTER, { systemPromptOverride: GROQ_PROMPTS.AI_NOTES })
            finalResult = response.choices[0].message.content
          } catch (e) { finalResult = 'Notes generation failed.' }
          break;
        case 'summary': finalResult = currentAnalysisRow?.summary || 'No summary available.'; break;
        case 'flashcards':
          const fRes = await MaterialAnalysisService.generateFlashcards(currentAnalysisRow, 10, selectedMaterial);
          finalResult = fRes.success ? fRes.flashcards : [];
          break;
        case 'quiz':
          const qRes = await MaterialAnalysisService.generateQuiz(currentAnalysisRow, 5, 'medium', selectedMaterial);
          finalResult = qRes.success ? qRes.quiz : [];
          break;
        default: 
          console.warn('runAnalysis called with unsupported tool type:', type);
          setIsAnalysisLoading(false);
          return;
      }
      setAnalysisCache(prev => ({ ...prev, [selectedMaterial.id]: { ...(prev[selectedMaterial.id] || {}), [type]: finalResult } }))
      const dbColumn = type === 'notes' ? 'smart_notes' : type === 'summary' ? 'summary' : type === 'flashcards' ? 'flashcards' : type === 'quiz' ? 'quiz' : null;
      if (dbColumn) {
        await supabase.from('material_analysis').upsert({ material_id: selectedMaterial.id, user_id: user?.id, [dbColumn]: finalResult, analysis: materialAnalysis || {}, updated_at: new Date().toISOString() }, { onConflict: 'material_id' });
      }
      if (type === 'notes' && typeof finalResult === 'string') {
        saveToVault({ materialId: selectedMaterial.id, userId: user.id, courseId, title: `${selectedMaterial.title} - Smart Notes`, content: finalResult, sourceType: 'ai' }).catch(() => {});
      }
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setIsAnalysisLoading(false)
    }
  }

  useEffect(() => { if (selectedMaterial) setMaterialAnalysis(null) }, [selectedMaterial?.id])

  useEffect(() => {
    async function checkExistingAnalysis() {
      const toolToRun = activeTab !== 'content' ? activeTab : activeSideTab
      if (toolToRun === 'chat' || toolToRun === 'content' || toolToRun === 'write' || toolToRun === 'source info') return

      if (toolToRun === 'notes' && selectedMaterial && !currentAnalysis.notes) {
        try {
          const notesFromDb = await fetchUserNotes(user.id, courseId)
          const existingNote = notesFromDb.find(n => n.material_id === selectedMaterial.id && n.source_type === 'ai')
          if (existingNote) {
            setAnalysisCache(prev => ({ ...prev, [selectedMaterial.id]: { ...(prev[selectedMaterial.id] || {}), notes: existingNote.content } }))
            return
          }
        } catch (err) {}
      }
      
      const content = currentAnalysis[toolToRun]
      if (selectedMaterial && isPlaceholderContent(content) && selectedMaterial.processing_status !== 'pending' && !isAnalysisLoading) {
        runAnalysis(toolToRun);
      }
    }
    checkExistingAnalysis();
  }, [activeTab, activeSideTab, selectedMaterial, currentAnalysis]);

  const handleSend = async (forcedInput) => {
    const textToSend = typeof forcedInput === 'string' ? forcedInput : chatInput
    if (!textToSend.trim() || isProcessingLoading) return
    const userMsg = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsProcessingLoading(true)
    try {
      // Determine retrieval context: Specific material, or the whole deck?
      const materialContext = selectedMaterial?.id || activeDeckItems.map(i => i.content_id)
      
      const aiResponse = await queryStudyMaterials({ 
        question: textToSend, 
        courseId, 
        materialId: materialContext, 
        fallbackContext: selectedMaterial?.extracted_text?.slice(0, 8000) || '' 
      })
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Luter encountered an error.' }])
    } finally { setIsProcessingLoading(false) }
  }

  useEffect(() => {
    if (selectedMaterial?.processing_status === 'ready' && selectedMaterial?.extracted_text) {
      if (!analysisCache[selectedMaterial.id]?.summary) runAnalysis('summary').catch(() => {})
    }
  }, [selectedMaterial?.id, selectedMaterial?.processing_status])


  return (
    <div className="ws-root" style={{ background: '#F8F9FA' }}>
      <SelectionActionBar onAction={handleSelectionAction} />
      
      {!isMobile && (
        <header className="ws-global-glass-header" style={{ 
          background: 'rgba(255, 255, 255, 0.9)', 
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #F1F5F9', 
          height: '72px', 
          padding: '0 32px', 
          display: 'flex', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div className="ws-header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
            <button 
              className="ws-sidebar-toggle" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: '#F8FAFC', border: '1.5px solid #F1F5F9', borderRadius: '12px', padding: '8px', color: '#4B0082', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              title={sidebarCollapsed ? "Open sidebar" : "Hide sidebar"}
            >
              {sidebarCollapsed ? <CaretRightLight size={18} weight="light" /> : <CaretLeftLight size={18} weight="light" />}
            </button>
            <div className="ws-breadcrumb-minimal" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748B', fontSize: '13px', fontFamily: 'var(--font-outfit)', fontWeight: 500 }}>
              <HouseLight size={18} weight="light" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', color: '#4B0082' }} />
              <CaretRightLight size={14} weight="light" color="#CBD5E1" />
              <span onClick={() => navigate(`/dashboard/courses/${courseId}`)} style={{ cursor: 'pointer', letterSpacing: '0.02em', fontWeight: 600 }}>{courseInfo?.code || 'Course'}</span>
              <CaretRightLight size={14} weight="light" color="#CBD5E1" />
              <span style={{ fontWeight: 600, color: '#1A102D', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedMaterial?.title || 'Material'}</span>
            </div>
          </div>

          <div className="ws-header-center" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div className="ws-top-nav-capsule" style={{ 
              display: 'flex', 
              background: '#F1F5F9', 
              padding: '4px', 
              borderRadius: '20px', 
              border: '1.5px solid #E2E8F0',
              gap: '4px'
            }}>
              <button 
                onClick={() => { setActiveTab('content'); setActiveSideTab('chat'); }}
                className={`ws-capsule-btn ${activeTab === 'content' && activeSideTab === 'chat' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, 
                  borderRadius: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em',
                  background: activeTab === 'content' && activeSideTab === 'chat' ? '#4B0082' : 'transparent',
                  color: activeTab === 'content' && activeSideTab === 'chat' ? 'white' : '#64748B',
                }}
              >
                <FileTextLight size={18} weight="light" /> Source
              </button>
              <button 
                onClick={() => { setActiveTab('summary'); }}
                className={`ws-capsule-btn ${activeTab === 'summary' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, 
                  borderRadius: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em',
                  background: activeTab === 'summary' ? '#4B0082' : 'transparent',
                  color: activeTab === 'summary' ? 'white' : '#64748B',
                }}
              >
                <SparkleLight size={18} weight="light" /> Summary
              </button>
              <button 
                onClick={() => { setActiveTab('flashcards'); }}
                className={`ws-capsule-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, 
                  borderRadius: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em',
                  background: activeTab === 'flashcards' ? '#4B0082' : 'transparent',
                  color: activeTab === 'flashcards' ? 'white' : '#64748B',
                }}
              >
                <CardsThree size={18} weight="light" /> Flashcards
              </button>
              <button 
                onClick={() => { setActiveTab('quiz'); }}
                className={`ws-capsule-btn ${activeTab === 'quiz' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, 
                  borderRadius: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em',
                  background: activeTab === 'quiz' ? '#4B0082' : 'transparent',
                  color: activeTab === 'quiz' ? 'white' : '#64748B',
                }}
              >
                <Checks size={18} weight="light" /> Quiz
              </button>
            </div>
          </div>

          <div className="ws-header-right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center' }}>
            <div className="ws-analysis-badge" style={{ 
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', 
              background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', border: '1.5px solid #BAE6FD', borderRadius: '14px',
              fontSize: '11px', fontWeight: 600, color: '#475569', letterSpacing: '0.04em',
              fontFamily: 'var(--font-outfit)', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.1)'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0EA5E9', boxShadow: '0 0 10px rgba(14, 165, 233, 0.6)' }}></div>
              {(() => {
                  let progress = 0;
                  if (selectedMaterial?.extracted_text) progress += 25;
                  if (currentAnalysis.summary && currentAnalysis.summary.length > 10) progress += 25;
                  if (currentAnalysis.flashcards && Array.isArray(currentAnalysis.flashcards) && currentAnalysis.flashcards.length > 0) progress += 25;
                  if (currentAnalysis.quiz && Array.isArray(currentAnalysis.quiz) && currentAnalysis.quiz.length > 0) progress += 25;
                  return progress;
              })()}% analyzed
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '12px', fontWeight: 600, borderRadius: '12px', border: '1.5px solid #F1F5F9', background: 'white', color: '#1A102D', cursor: 'pointer', fontFamily: 'var(--font-outfit)' }}>
              <ShareNetworkLight size={16} weight="light" /> Share
            </button>
            <button style={{ padding: '10px', borderRadius: '12px', border: '1.5px solid #F1F5F9', background: 'white', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DotsThreeLight size={18} weight="light" />
            </button>
          </div>
        </header>
      )}

      {isMobile && !showDashboard && (
        <div style={{ padding: '12px 20px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #E2E8F0', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', background: 'white', border: '1px solid var(--luter-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LightningLight size={20} color="var(--luter-primary)" weight="light" /></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--luter-primary-dark)' }}>{courseInfo?.code || 'Luter'}</span><span style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>Week {selectedMaterial?.week_number || '1'}</span></div>
            </div>
            <button className="ws-tactile-btn" style={{ padding: '8px 16px', fontSize: '12px', background: 'white', color: '#EF4444', border: '1px solid #FEE2E2' }} onClick={() => navigate(`/dashboard/courses/${courseId}`)}><ArrowLeft size={16} /> Exit</button>
          </div>
          {activeTab === 'content' && (
            <div className="mobile-segmented-control" style={{ margin: '0', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
              <button className={`segmented-item ${mobileReadingMode === 'document' ? 'segmented-item--active' : ''}`} onClick={() => setMobileReadingMode('document')}><FileText size={16} /> Document</button>
              <button className={`segmented-item ${mobileReadingMode === 'notes' ? 'segmented-item--active' : ''}`} onClick={() => setMobileReadingMode('notes')}><BookOpen size={16} /> Notes</button>
            </div>
          )}
        </div>
      )}

      <main className="ws-main-layout" style={{ flexDirection: isMobile ? 'column' : 'row', background: 'transparent', overflow: 'hidden', padding: '0', display: 'flex', flex: 1 }}>
        <div ref={constraintsRef} className="ws-pane-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFB', position: 'relative' }}>
          {/* Subheader for Document/Notes toggle */}
          {(activeTab === 'content' || activeTab === 'notes') && (
            <div className="ws-canvas-tabs" style={{ 
              padding: '16px 32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              borderBottom: '1.5px solid #F1F5F9', 
              background: 'white' 
            }}>
              <div style={{ display: 'flex', background: '#F8FAFC', padding: '4px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                <button 
                  onClick={() => setActiveTab('content')}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, 
                    borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em',
                    background: activeTab === 'content' ? 'white' : 'transparent',
                    color: activeTab === 'content' ? '#4B0082' : '#64748B',
                    boxShadow: activeTab === 'content' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <FileTextLight size={16} weight="light" /> Source
                </button>
                <button 
                  onClick={() => setActiveTab('notes')}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, 
                    borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em',
                    background: activeTab === 'notes' ? 'white' : 'transparent',
                    color: activeTab === 'notes' ? '#4B0082' : '#64748B',
                    boxShadow: activeTab === 'notes' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <NotePencil size={16} weight="light" /> Notes
                </button>
              </div>
            </div>
          )}

          <div className="ws-canvas-container" style={{ flex: 1, overflowY: 'auto', display: (isMobile && activeTab !== 'content' && activeTab !== 'notes' && activeTab !== 'summary' && activeTab !== 'write' && activeTab !== 'flashcards' && activeTab !== 'quiz') ? 'none' : 'block' }}>
            {activeTab === 'notes' ? (
              <div className="ws-ai-content-pane" style={{ padding: '60px', maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#111' }}>Extracted Text</h2>
                <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#3F3F46', whiteSpace: 'pre-wrap', fontStyle: 'normal' }}>
                  {selectedMaterial?.extracted_text || (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                         <CircleNotch size={48} weight="bold" color="#4B0082" className="animate-spin" />
                      </div>
                      <p style={{ marginBottom: '32px', color: '#64748B', fontWeight: 400, fontFamily: 'var(--font-varela)', fontSize: '15px' }}>Luter is extracting the text for optimized analysis...</p>
                      <button 
                        onClick={async () => {
                          setIsExtractingText(true)
                          const res = await reprocessMaterial(selectedMaterial)
                          if (res.success && res.fullText) {
                            setSelectedMaterial(prev => ({ ...prev, extracted_text: res.fullText }))
                          }
                          setIsExtractingText(false)
                        }}
                        style={{
                          padding: '14px 28px', background: '#6D28D9', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto', fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em'
                        }}
                      >
                        <LightningLight size={18} weight="light" /> Extract now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'summary' ? (
              <div className="ws-ai-content-pane" style={{ background: '#F8FAFB', height: '100%', overflowY: 'auto' }}>
                <WorkstationSummaryEnhanced 
                  content={currentAnalysis.summary} 
                  material={selectedMaterial} 
                  pageSummaries={pageSummaries}
                  onFetchPageSummaries={handleFetchPageSummaries}
                />
              </div>
            ) : activeTab === 'flashcards' ? (
              <div className="ws-ai-content-pane" style={{ background: '#F8FAFB', height: '100%', overflowY: 'auto' }}>
                <WorkstationFlashcards 
                  flashcards={currentAnalysis.flashcards} 
                  material={selectedMaterial} 
                  onRegenerate={() => runAnalysis('flashcards')} 
                />
              </div>
            ) : activeTab === 'quiz' ? (
              <div className="ws-ai-content-pane" style={{ background: '#F8FAFB', height: '100%', overflowY: 'auto' }}>
                <WorkstationQuiz 
                  quiz={currentAnalysis.quiz} 
                  material={selectedMaterial} 
                  onRegenerate={() => runAnalysis('quiz')} 
                />
              </div>
            ) : (
              <MaterialRenderer 
                material={selectedMaterial} 
                onSparkUpdate={updateSpark}
                setViewportData={setViewportData}
              />
            )}
            
            {/* Floating Write Toggle */}
            <motion.button 
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.1}
              dragTransition={{ power: 0.2, timeConstant: 200 }}
              onClick={() => {
                if (isSidePanelCollapsed) {
                  setSidePanelCollapsed(false)
                  setActiveSideTab('write')
                } else {
                  if (activeSideTab === 'write') {
                    setActiveSideTab('chat')
                  } else {
                    setActiveSideTab('write')
                  }
                }
                if (typeof updateSelection === 'function') updateSelection('', null, false)
              }}
              className="ws-floating-pen"
              style={{
                position: 'absolute',
                bottom: '32px',
                right: '32px',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: activeSideTab === 'write' ? '#4B0082' : 'white',
                color: activeSideTab === 'write' ? 'white' : '#4B0082',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(75, 0, 130, 0.15)',
                border: '1.5px solid #F1F5F9',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 40,
                touchAction: 'none'
              }}
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.9 }}
            >
              <PencilSimple size={28} weight="light" />
            </motion.button>
          </div>
        </div>

        {!isSidePanelCollapsed && (
          <div className="ws-pane-right" style={{ 
            display: (isMobile && activeTab === 'content') ? 'none' : 'flex', 
            width: '440px', 
            borderLeft: '1px solid var(--luter-border)', 
            background: 'white',
            flexDirection: 'column'
          }}>
            <div className="ws-chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <header className="ws-side-tabs-header" style={{ padding: '0 24px', height: '72px', display: 'flex', alignItems: 'center', borderBottom: '1.5px solid #F1F5F9' }}>
                <div className="ws-text-tabs-bar" style={{ display: 'flex', gap: '24px' }}>
                  <button 
                    className="ws-text-tab" 
                    onClick={() => setActiveSideTab('chat')}
                    style={{ 
                      background: 'none', border: 'none', padding: '24px 0', fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em', cursor: 'pointer',
                      color: activeSideTab === 'chat' ? '#4B0082' : '#94A3B8',
                      borderBottom: activeSideTab === 'chat' ? '3px solid #4B0082' : '3px solid transparent',
                      fontFamily: 'var(--font-outfit)', transition: 'all 0.2s'
                    }}
                  >
                    Chat
                  </button>
                  <button 
                    className="ws-text-tab" 
                    onClick={() => setActiveSideTab('write')}
                    style={{ 
                      background: 'none', border: 'none', padding: '24px 0', fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em', cursor: 'pointer',
                      color: activeSideTab === 'write' ? '#4B0082' : '#94A3B8',
                      borderBottom: activeSideTab === 'write' ? '3px solid #4B0082' : '3px solid transparent',
                      fontFamily: 'var(--font-outfit)', transition: 'all 0.2s'
                    }}
                  >
                    Write
                  </button>
                </div>
              </header>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeSideTab === 'write' ? (
                  <WorkstationWrite 
                    initialContent={userJottings} 
                    onSave={handleSaveNote} 
                    material={selectedMaterial} 
                    user={user} 
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="ws-chat-messages" style={{ flex: 1 }}>
                      {messages.length === 0 ? (
                        <div className="ws-chat-empty-state" style={{ padding: '48px 32px', textAlign: 'center' }}>
                          <motion.img 
                            src="/mascot.png" 
                            alt="Luter" 
                            style={{ height: '100px', marginBottom: '24px' }}
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <div className="ws-suggested-header" style={{ marginBottom: '24px', fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600, color: '#94A3B8', fontFamily: 'var(--font-outfit)' }}>Choose a starting point</div>
                          <div className="ws-suggested-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {SUGGESTED_QUESTIONS.map(q => (
                              <button key={q.id} className="ws-suggested-item" onClick={() => handleSend(q.text)} style={{ background: '#F8FAFC', border: '1.5px solid #F1F5F9', borderRadius: '16px', padding: '16px 20px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer' }}>
                                <span className="ws-suggested-text" style={{ fontSize: '13px', color: '#1A102D', fontWeight: 600, fontFamily: 'var(--font-outfit)' }}>{q.text}</span>
                                <ArrowRightLight size={16} weight="light" color="#4B0082" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="ws-chat-scroll" style={{ padding: '40px' }}>
                          {messages.map((msg, i) => {
                            const sanitizedContent = msg.content.replace(/\[View Source\]\s*\(source:\/\/([^)]+)\)/g, (match, p1) => {
                              const encoded = p1.split('|').map((part, index) => index % 2 === 1 ? encodeURIComponent(decodeURIComponent(part)) : part).join('|')
                              return `[View Source](source://${encoded})`
                            })
                            const withLinks = msg.role === 'ai' ? sanitizedContent.replace(/\b(page\s*(\d+))\b/gi, '[$1](#page-$2)') : msg.content
                            const [mainPart, suggestionPart] = withLinks.split('---SUGGESTIONS---')
                            const suggestions = suggestionPart ? suggestionPart.split('|').map(s => s.trim()).filter(Boolean) : []

                            return (
                              <div key={i} className={`ws-chat-bubble ws-chat-bubble--${msg.role === 'user' ? 'user' : 'ai'}`}>
                                {msg.role === 'user' ? (
                                  <div style={{ marginBottom: '24px' }}>
                                     <div style={{ fontSize: '11px', fontWeight: 600, color: '#A1A1AA', letterSpacing: '0.04em', marginBottom: '4px' }}>You</div>
                                     <p style={{ margin: 0, fontSize: '15px', color: '#111', fontWeight: '500' }}>{msg.content}</p>
                                  </div>
                                ) : (
                                  <div style={{ marginBottom: '32px' }}>
                                     <div style={{ fontSize: '11px', fontWeight: 600, color: '#A1A1AA', letterSpacing: '0.04em', marginBottom: '8px' }}>Luter</div>
                                     <div className="ws-ai-message-content" style={{ fontSize: '15px', color: '#333' }}>
                                       <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                         a: ({ children, href, ...props }) => {
                                           if (href?.startsWith('source://')) {
                                              try {
                                                const parts = href.replace('source://', '').split('|')
                                                let pageNum = 1, snippet = ""
                                                for(let i=0; i<parts.length; i+=2) {
                                                  if(parts[i] === 'page' && parts[i+1]) pageNum = parseInt(parts[i+1])
                                                  if(parts[i] === 'text' && parts[i+1]) snippet = decodeURIComponent(parts[i+1])
                                                }
                                                return (
                                                  <button className="ws-citation-pill" onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.dispatchEvent(new CustomEvent('luter-jump-to-page', { detail: { page: pageNum } }))
                                                    if (snippet) window.dispatchEvent(new CustomEvent('luter-highlight-text', { detail: { text: snippet } }))
                                                  }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8f8f8', border: '1px solid #f1f1f1', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: '600', color: '#71717A', margin: '0 4px', cursor: 'pointer' }}>
                                                    <BookmarkSimple size={10} weight="light" /> {pageNum}
                                                  </button>
                                                )
                                              } catch (e) { return <span>{children}</span> }
                                           }
                                           if (href?.startsWith('#page-')) {
                                             const pageNum = parseInt(href.split('-')[1])
                                             return <span style={{ color: '#7a12cc', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => window.dispatchEvent(new CustomEvent('luter-jump-to-page', { detail: { page: pageNum } }))}>{children}</span>
                                           }
                                           return <a href={href} target="_blank" rel="noopener noreferrer" {...props} style={{ color: '#7a12cc' }}>{children}</a>
                                         }
                                       }}>{mainPart}</ReactMarkdown>
                                     </div>
                                     {suggestions.length > 0 && (
                                       <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                         {suggestions.map((s, idx) => (
                                           <button key={idx} onClick={() => handleSend(s)} style={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: '#111', fontWeight: '500', cursor: 'pointer' }}>{s}</button>
                                         ))}
                                       </div>
                                     )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          {isProcessingLoading && <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, letterSpacing: '0.04em' }}>Luter is thinking...</div>}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                    <div className="ws-chat-input-area" style={{ padding: '24px', borderTop: '1.5px solid #F1F5F9' }}>
                      <div className="ws-input-wrapper" style={{ border: '1.5px solid #F1F5F9', background: '#F8FAFC', borderRadius: '16px', padding: '8px 8px 8px 20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <input 
                          className="ws-chat-input" 
                          placeholder={t('ai_placeholder')}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          disabled={isProcessingLoading}
                          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', fontWeight: 600, color: '#1A102D', fontFamily: 'var(--font-varela)' }}
                        />
                        <button 
                          className="ws-send-btn" 
                          onClick={() => handleSend()} 
                          disabled={isProcessingLoading || !chatInput.trim()}
                          style={{ 
                            background: chatInput.trim() ? '#4B0082' : '#E2E8F0', 
                            color: 'white', border: 'none', borderRadius: '12px', width: '40px', height: '40px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', cursor: 'pointer',
                            boxShadow: chatInput.trim() ? '0 4px 12px rgba(75, 0, 130, 0.2)' : 'none'
                          }}
                        >
                          {isProcessingLoading ? <CircleNotch className="animate-spin" size={20} weight="bold" /> : <PaperPlaneRight size={20} weight="bold" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {activeSideTab === 'summary' && (
              <div className="ws-side-tool-container" style={{ padding: '32px', height: '100%', overflowY: 'auto' }}>
                <WorkstationSummary material={selectedMaterial} content={currentAnalysis.summary} />
              </div>
            )}

            {activeSideTab === 'flashcards' && (
              <div className="ws-side-tool-container" style={{ height: '100%', overflow: 'hidden' }}>
                <WorkstationFlashcards material={selectedMaterial} items={currentAnalysis.flashcards} user={user} />
              </div>
            )}

            {activeSideTab === 'quiz' && (
              <div className="ws-side-tool-container" style={{ padding: '32px', height: '100%', overflowY: 'auto' }}>
                <WorkstationQuiz material={selectedMaterial} items={currentAnalysis.quiz} />
              </div>
            )}
          </div>
        )}
      </main>

      {isMobile && (
        <div className="mobile-bottom-nav">
          <button className={`mobile-nav-item ${activeTab === 'content' ? 'mobile-nav-item--active mobile-nav-item--accent' : ''}`} onClick={() => setActiveTab('content')}><Layout size={20} /><span>Source</span></button>
          <button className={`mobile-nav-item ${activeTab === 'flashcards' ? 'mobile-nav-item--active' : ''}`} onClick={() => setActiveTab('flashcards')}><Layers size={20} /><span>Flashcards</span></button>
          <button className={`mobile-nav-item ${activeTab === 'quiz' ? 'mobile-nav-item--active' : ''}`} onClick={() => setActiveTab('quiz')}><ClipboardList size={20} /><span>Quizzes</span></button>
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
