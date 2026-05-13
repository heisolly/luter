import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  House,
  CaretLeft,
  CaretRight,
  FileText,
  Sparkle,
  CardsThree,
  Checks,
  ShareNetwork,
  DotsThree,
  Lightning,
  NotePencil,
  PencilSimple,
  ArrowRight,
  BookmarkSimple,
  User as UserIcon,
  ArrowSquareOut as ArrowSquareOutIcon,
  ChatCircleText as ChatCircleTextIcon,
  ThumbsUp,
  CopySimple,
  ArrowUpRight,
  Microphone,
  PaperPlaneRight,
  CircleNotch,
  SidebarSimple,
  SquaresFour,
  Stack,
  ClipboardText,
  List
} from '@phosphor-icons/react'
import useTourStore from '../../store/useTourStore'
import { 
  RiBookOpenFill as BookOpen, RiStarFill as Star, RiFileTextFill as RiFileText, RiCheckboxCircleFill as CheckCircle, RiArrowRightSLine as RiCaretRight, RiArrowLeftLine as ArrowLeft, RiExternalLinkLine as ArrowSquareOut, RiStackFill as RiStack, 
  RiQuestionFill as Question, RiAddLine as Plus, RiSearchLine as MagnifyingGlass, RiArrowLeftSLine as RiCaretLeft, RiBriefcaseFill as Briefcase, RiPlayCircleFill as PlayCircle, RiSettings4Fill as Settings, RiUserFill as User, RiLogoutBoxLine as SignOut, 
  RiMore2Fill as DotsThreeVertical, RiLayoutMasonryFill as RiLayoutMasonry, RiBookmarkFill as Bookmark, RiFlashlightFill as Zap, 
  RiErrorWarningFill as Warning, RiListCheck, RiShareFill as Share, 
  RiGraduationCapFill as GraduationCap, RiShareForwardFill as RiShareNetwork, RiClipboardFill as RiClipboardText, RiUserSmileFill as Baby, RiCheckLine as Check, RiSubtractLine as Minus, 
  RiLightbulbFill as Lightbulb, RiRefreshLine as ArrowClockwise, RiArrowRightLine as RiArrowRight, RiHome4Fill as RiHouse, RiCheckboxFill as CheckSquare, RiMoreFill as DotsThreeOutline, 
  RiStickyNoteFill as Note, RiArrowUpLine as ArrowUp, RiBookFill as Book, RiStackFill as Library, RiPencilFill as PencilLine, RiLayoutColumnFill as Columns, RiFullscreenFill as CornersOut, RiZoomInLine as MagnifyingGlassPlus,
  RiThumbUpLine, RiThumbDownLine, RiFileCopyLine, RiArrowRightUpLine, RiMicLine, RiEyeOffLine, RiEyeLine
} from "react-icons/ri"
import { Typing } from '../ui/Typing'
import { Wave } from '../ui/Wave'
import { DotmSquare11 } from '../ui/dotm-square-11'
import { LuterPageLoader } from '../shared/LuterPageLoader'

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
const VoiceModeBlob = React.lazy(() => import('./voice/VoiceModeBlob'))
import { preloadingService } from '../../services/preloadingService'
import './workstation.css'

const SUGGESTED_QUESTIONS = [
  { id: 'summary', text: "Summarize the core concepts" },
  { id: 'explain', text: "Explain this like I'm a student" },
  { id: 'analogy', text: "Give me an academic analogy" },
  { id: 'quiz', text: "Generate a quick practice quiz" },
]

function WorkstationContent() {
  const { t } = useTranslation(['workspace'])
  const navigate = useNavigate()
  const { courseId } = useParams()
  const [searchParams] = useSearchParams()
  const materialIdParam = searchParams.get('materialId')
  const { user, isMobile, sidebarCollapsed, setSidebarCollapsed, profile, mobileSidebarOpen, setMobileSidebarOpen } = useOutletContext() || {}
  const { setViewportData, highlightText, updateSpark, clearHighlights, viewportData, updateSelection, isSidePanelCollapsed, setSidePanelCollapsed } = useReadingSpace()
  
  const [activeTab, setActiveTab] = useState('content')
  const [activeSideTab, setActiveSideTab] = useState('chat')
  const { startTour, hasCompletedTour } = useTourStore()

  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isProcessingLoading, setIsProcessingLoading] = useState(false)
  const [courseMaterials, setCourseMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [courseInfo, setCourseInfo] = useState(null)

  // Tour effect — must come AFTER selectedMaterial declaration
  useEffect(() => {
    if (user?.id && selectedMaterial && !hasCompletedTour('workstation')) {
      const timer = setTimeout(() => startTour('workstation'), 2000)
      return () => clearTimeout(timer)
    }
  }, [user?.id, selectedMaterial, hasCompletedTour, startTour])
  const [analysisCache, setAnalysisCache] = useState({})
  const [materialAnalysis, setMaterialAnalysis] = useState(null)
  const [showTools, setShowTools] = useState(false)
  const [hasNewAssignment, setHasNewAssignment] = useState(false)
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false)
  const [isExtractingText, setIsExtractingText] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const constraintsRef = useRef(null)
  const [mobileReadingMode, setMobileReadingMode] = useState('document')
  const [pageSummaries, setPageSummaries] = useState({})
  const [loading, setLoading] = useState(false)
  const [showDashboard, setShowDashboard] = useState(true)
  const [userJottings, setUserJottings] = useState("")
  const [jottingNoteId, setJottingNoteId] = useState(null)
  const messagesEndRef = useRef(null)
  
  // Deck Store integration
  const { activeDeckItems } = useDeckStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [messages, isProcessingLoading])

  const currentAnalysis = React.useMemo(() => {
    if (!selectedMaterial) return {}
    const cached = analysisCache[selectedMaterial.id] || {}
    return {
      summary: cached.summary || materialAnalysis?.summary || null,
      flashcards: cached.flashcards || materialAnalysis?.flashcards || [],
      quiz: cached.quiz || materialAnalysis?.quiz || [],
      notes: cached.notes || materialAnalysis?.smart_notes || null,
      page_summaries: cached.page_summaries || materialAnalysis?.analysis?.page_summaries || {}
    }
  }, [selectedMaterial?.id, analysisCache, materialAnalysis])

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
  }, [])

  useEffect(() => {
    console.log('🔍 WorkstationPage useEffect triggered:', { materialIdParam, courseId, userId: user?.id })
    if (!user?.id) {
      console.log('❌ No user ID, skipping material loading')
      return
    }

    if (materialIdParam) {
      // If materialId is specified, load that specific material regardless of courseId
      console.log('📄 Loading standalone material:', materialIdParam)
      fetchStandaloneMaterial(materialIdParam)
    } else if (courseId) {
      // Load course-specific materials
      console.log('📚 Loading course materials for:', courseId)
      fetchCourseInfo()
      fetchMaterials()
      checkAssignments()
    } else if (activeDeckItems.length > 0) {
      // Load materials from deck if no courseId is provided
      console.log('🎒 Loading deck materials')
      loadDeckMaterials()
    } else {
      // Fallback: fetch all user's standalone + course materials
      console.log('🔄 Loading all user materials')
      fetchAllUserMaterials()
    }
  }, [courseId, materialIdParam, activeDeckItems.length, user?.id])

  async function loadDeckMaterials() {
    setLoading(true)
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      const materialIds = activeDeckItems
        .filter(item => item.content_type !== 'assignment' && item.content_type !== 'ai_note')
        .map(item => item.content_id)
        .filter(id => uuidRegex.test(id))

      if (materialIds.length === 0) {
        setCourseMaterials([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .in('id', materialIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading deck materials:', error)
        setCourseMaterials([])
        return
      }

      if (data && data.length > 0) {
        setCourseMaterials(data)
        const initialMaterial = materialIdParam
          ? data.find(m => m.id === materialIdParam) || data[0]
          : data[0]
        setSelectedMaterial(initialMaterial)
        setShowDashboard(false)
      } else {
        setCourseMaterials([])
      }
    } catch (err) {
      console.error('Error loading deck materials:', err)
      setCourseMaterials([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllUserMaterials() {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all user materials:', error)
        setCourseMaterials([])
        return
      }

      if (data && data.length > 0) {
        setCourseMaterials(data)
        const initialMaterial = materialIdParam
          ? data.find(m => m.id === materialIdParam) || data[0]
          : data[0]
        setSelectedMaterial(initialMaterial)
        setShowDashboard(false)
      } else {
        setCourseMaterials([])
      }
    } catch (err) {
      console.error('fetchAllUserMaterials error:', err)
      setCourseMaterials([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchStandaloneMaterial(materialId) {
    console.log('🔍 fetchStandaloneMaterial called with:', materialId)
    setLoading(true)
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(materialId)) {
        console.warn('❌ Invalid UUID provided for standalone material:', materialId)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        console.log('✅ Material found:', data.title)
        setCourseMaterials([data])
        setSelectedMaterial(data)
        setShowDashboard(false)
      } else {
        console.warn('❌ Material not found:', materialId)
        // Redirect to dashboard if material not found
        console.log('🔄 Redirecting to dashboard - material not found')
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('❌ Error loading standalone material:', err)
      // Redirect to dashboard on error
      console.log('🔄 Redirecting to dashboard - error occurred')
      navigate('/dashboard')
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
    setLoading(true)
    try {
      // Try to get preloaded data first
      const preloadedData = preloadingService.getCachedData(`course-${courseId}-${user?.id}`)
      
      if (preloadedData) {
        console.log('[Workstation] Using preloaded materials data')
        setCourseMaterials(preloadedData)
        const initialMaterial = materialIdParam
          ? preloadedData.find(m => m.id === materialIdParam) || preloadedData[0]
          : preloadedData[0]
        setSelectedMaterial(initialMaterial)
        setShowDashboard(false)
        setLoading(false)
        return
      }

      // Fallback to network request
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('course_id', courseId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching course materials:', error)
        setCourseMaterials([])
        return
      }

      if (data && data.length > 0) {
        setCourseMaterials(data)
        const initialMaterial = materialIdParam
          ? data.find(m => m.id === materialIdParam) || data[0]
          : data[0]
        setSelectedMaterial(initialMaterial)
        setShowDashboard(false)
      } else {
        setCourseMaterials([])
      }
    } catch (err) {
      console.error('fetchMaterials error:', err)
      setCourseMaterials([])
    } finally {
      setLoading(false)
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

      // Proactive extraction check (Process on Arrival)
      if (selectedMaterial && (!selectedMaterial.extracted_text || selectedMaterial.extracted_text.length < 50)) {
        console.log('[Workstation] Material missing text. Triggering proactive extraction...')
        MaterialAnalysisService.getOrCreateAnalysis(materialId, selectedMaterial, user?.id)
          .then(res => {
            if (res.success && res.material?.extracted_text) {
              // Update local state if text recovered
              selectedMaterial.extracted_text = res.material.extracted_text
            }
          })
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
      const docContext = (selectedMaterial?.extracted_text || "").replace(/\*\*/g, '').slice(0, 4000)
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
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.error(`[runAnalysis] Timeout reached for ${type}`)
      setIsAnalysisLoading(false)
    }, 30000) // 30 second timeout
    
    try {
      console.log(`[runAnalysis] Starting ${type} generation for material:`, selectedMaterial.id)
      
      // FORCE REFRESH: Fetch the latest material data to ensure we have the extracted_text
      const { data: latestMaterial } = await supabase
        .from('materials')
        .select('extracted_text')
        .eq('id', selectedMaterial.id)
        .single()
      
      if (latestMaterial?.extracted_text) {
        selectedMaterial.extracted_text = latestMaterial.extracted_text
        console.log(`[runAnalysis] Found extracted_text, length:`, latestMaterial.extracted_text.length)
      } else {
        console.warn(`[runAnalysis] No extracted_text found for material:`, selectedMaterial.id)
      }

      // ALWAYS get fresh analysis if we don't have it or if it's incomplete
      let currentAnalysisRow = materialAnalysis
      if (!materialAnalysis || !materialAnalysis.summary || materialAnalysis.isFallback) {
        console.log(`[runAnalysis] Generating new analysis...`)
        const analysisResult = await MaterialAnalysisService.getOrCreateAnalysis(selectedMaterial.id, selectedMaterial, user.id)
        if (analysisResult.success) {
          setMaterialAnalysis(analysisResult.analysis)
          currentAnalysisRow = analysisResult.analysis
          console.log(`[runAnalysis] Analysis generated successfully`)
        } else {
          throw new Error(analysisResult.error)
        }
      } else {
        console.log(`[runAnalysis] Using existing analysis`)
      }
      let finalResult
      switch(type) {
        case 'notes':
          try {
            const content = (selectedMaterial.extracted_text || "").replace(/\*\*/g, '').slice(0, 6000)
            if (!content) { finalResult = 'No content available.'; break; }
            const notesPrompt = `You are Luter Tutor. Provide academic notes for this material. Title: ${selectedMaterial.title}. Content: ${content}`
            const response = await callGroqAPI([{ role: 'user', content: notesPrompt }], GROQ_MODELS.SPEEDSTER, { systemPromptOverride: GROQ_PROMPTS.AI_NOTES })
            finalResult = response.choices[0].message.content
          } catch (e) { finalResult = 'Notes generation failed.' }
          break;
        case 'summary': finalResult = currentAnalysisRow?.summary || 'No summary available.'; break;
        case 'flashcards':
          console.log(`[runAnalysis] Generating flashcards...`)
          const fRes = await MaterialAnalysisService.generateFlashcards(currentAnalysisRow, 10, selectedMaterial);
          console.log(`[runAnalysis] Flashcards result:`, fRes)
          finalResult = fRes.success ? fRes.flashcards : [];
          break;
        case 'quiz':
          console.log(`[runAnalysis] Generating quiz...`)
          const qRes = await MaterialAnalysisService.generateQuiz(currentAnalysisRow, 5, 'medium', selectedMaterial);
          console.log(`[runAnalysis] Quiz result:`, qRes)
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
      clearTimeout(timeout)
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
      
      // REMOVED: Auto-run analysis on tab switch. Analysis is now user-initiated only.
      // Users must explicitly click 'Generate' buttons to create flashcards/quiz.
      // const content = currentAnalysis[toolToRun]
      // if (selectedMaterial && isPlaceholderContent(content) && selectedMaterial.processing_status !== 'pending' && !isAnalysisLoading) {
      //   runAnalysis(toolToRun);
      // }
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
        fallbackContext: (selectedMaterial?.extracted_text || "").replace(/\*\*/g, '').slice(0, 8000)
      })
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Luter encountered an error.' }])
    } finally { setIsProcessingLoading(false) }
  }

  // REMOVED: Auto-analysis on material load. Analysis should be user-initiated only.
  // The PDF viewer should display immediately without waiting for any analysis.
  // Users can click Summary/Flashcards/Quiz tabs when they want to generate content.


  return (
    <div className="ws-root" style={{ background: '#F8F9FA' }}>
      <SelectionActionBar onAction={handleSelectionAction} />
      
      {isMobile && (
        <div className="mobile-top-bar" style={{ 
          padding: '12px 16px', 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #F1F5F9', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: '60px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setMobileSidebarOpen(true)} 
              style={{ background: 'none', border: 'none', color: '#1E293B', display: 'flex', alignItems: 'center', padding: '8px' }}
            >
              <List size={22} weight="bold" />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {courseInfo?.code || 'Workstation'}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-outfit)' }}>
                {selectedMaterial?.title || 'Study'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ 
              background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', 
              fontWeight: 800, fontSize: '10px', padding: '8px 14px', borderRadius: '10px', 
              textTransform: 'uppercase', letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            Exit
          </button>
        </div>
      )}

      {!isMobile && (
        <header style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderBottom: '1px solid rgba(229, 231, 235, 0.6)', 
          height: '64px', 
          padding: '0 32px', 
          display: 'flex', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px', color: '#374151', cursor: 'pointer' }}
              title={sidebarCollapsed ? "Pin sidebar" : "Unpin sidebar"}
            >
              <SidebarSimple size={18} weight="bold" mirrored={!sidebarCollapsed} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '13px' }}>
              <House size={16} weight="bold" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', color: '#374151' }} />
              <CaretRight size={12} weight="bold" />
              <span onClick={() => navigate(`/dashboard/courses/${courseId}`)} style={{ cursor: 'pointer', color: '#374151' }}>{courseInfo?.code || 'Course'}</span>
              <CaretRight size={12} weight="bold" />
              <span style={{ color: '#111827', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedMaterial?.title || 'Material'}</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div id="tour-ai-tools" style={{ 
              display: 'flex', 
              background: '#F9FAFB', 
              padding: '4px', 
              borderRadius: '12px', 
              border: '1px solid #E5E7EB',
              gap: '2px'
            }}>
              <button 
                onClick={() => { setActiveTab('content'); setActiveSideTab('chat'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, 
                  borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: activeTab === 'content' && activeSideTab === 'chat' ? '#F3F4F6' : 'transparent',
                  color: activeTab === 'content' && activeSideTab === 'chat' ? '#111827' : '#6B7280',
                }}
              >
                <FileText size={14} weight="bold" /> Source
              </button>
              <button 
                onClick={() => { setActiveTab('summary'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, 
                  borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: activeTab === 'summary' ? '#F3F4F6' : 'transparent',
                  color: activeTab === 'summary' ? '#111827' : '#6B7280',
                }}
              >
                <Sparkle size={14} weight="bold" /> Summary
              </button>
              <button 
                onClick={() => { setActiveTab('flashcards'); setActiveSideTab('flashcards'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, 
                  borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: activeTab === 'flashcards' ? '#F3F4F6' : 'transparent',
                  color: activeTab === 'flashcards' ? '#111827' : '#6B7280',
                }}
              >
                <Stack size={14} weight="bold" /> Cards
              </button>
              <button 
                onClick={() => { setActiveTab('quiz'); setActiveSideTab('quiz'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, 
                  borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: activeTab === 'quiz' ? '#F3F4F6' : 'transparent',
                  color: activeTab === 'quiz' ? '#111827' : '#6B7280',
                }}
              >
                <Checks size={14} weight="bold" /> Quiz
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', 
              background: '#F3F4F6', borderRadius: '8px',
              fontSize: '11px', fontWeight: 600, color: '#6B7280'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div>
              {(() => {
                  let progress = 0;
                  if (selectedMaterial?.extracted_text) progress += 25;
                  if (currentAnalysis.summary && currentAnalysis.summary.length > 10) progress += 25;
                  if (currentAnalysis.flashcards && Array.isArray(currentAnalysis.flashcards) && currentAnalysis.flashcards.length > 0) progress += 25;
                  if (currentAnalysis.quiz && Array.isArray(currentAnalysis.quiz) && currentAnalysis.quiz.length > 0) progress += 25;
                  return progress;
              })()}%
            </div>
            <button 
              onClick={() => setFocusMode(!focusMode)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '10px 20px', 
                fontSize: '12px', 
                fontWeight: 700, 
                borderRadius: '12px', 
                border: '1.5px solid #000', 
                background: focusMode ? '#000' : 'white', 
                color: focusMode ? 'white' : '#000', 
                cursor: 'pointer', 
                fontFamily: 'var(--font-outfit)' 
              }}
            >
              {focusMode ? <RiEyeLine size={16} /> : <RiEyeOffLine size={16} />}
              {focusMode ? 'Exit Focus' : 'Focus Mode'}
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '12px', fontWeight: 700, borderRadius: '12px', border: '1.5px solid #000', background: 'white', color: '#000', cursor: 'pointer', fontFamily: 'var(--font-outfit)' }}>
              <ShareNetwork size={16} weight="bold" /> Share
            </button>
            <button style={{ padding: '10px', borderRadius: '12px', border: '1.5px solid #000', background: 'white', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DotsThree size={18} weight="bold" />
            </button>
          </div>
        </header>
      )}


      <main className="ws-main-layout" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : (focusMode ? '1fr' : 'minmax(0, 5fr) minmax(360px, 420px)'), 
        background: 'transparent', 
        overflow: 'hidden', 
        padding: '0', 
        flex: 1,
        minHeight: 'calc(100vh - 72px)',
        transition: 'grid-template-columns 0.3s ease'
      }}>
        <div ref={constraintsRef} className="ws-pane-left" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          background: 'linear-gradient(180deg, #FAFBFC 0%, #F8FAFC 50%, #F1F5F9 100%)', 
          position: 'relative',
          gridColumn: '1 / 2',
          height: '100%',
          minHeight: 0,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.03)'
        }}>

          {/* Source/Notes toggle */}
          {activeTab === 'content' && !isMobile && (
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid #E5E7EB',
              background: '#FAFAFA',
            }}>
              <div style={{ display: 'flex', background: '#F3F4F6', padding: '2px', borderRadius: '8px' }}>
                {['content', 'notes'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === tab ? 'white' : 'transparent',
                      color: activeTab === tab ? '#111827' : '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {tab === 'content' ? <FileText size={14} weight="bold" /> : <PencilSimple size={14} weight="bold" />}
                    {tab === 'content' ? 'Source' : 'Notes'}
                  </button>
                ))}
              </div>
            </div>
          )}

            {activeTab === 'notes' ? (
              <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', overflowY: 'auto', flex: 1 }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#111' }}>Extracted Text</h2>
                <div style={{ fontSize: '15px', lineHeight: '1.7', color: '#374151', whiteSpace: 'pre-wrap' }}>
                  {selectedMaterial?.extracted_text || (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                      <LuterPageLoader message="Extracting text..." minHeight="200px" />
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
                          padding: '12px 24px', background: '#6D28D9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                          marginTop: '24px'
                        }}
                      >
                        Extract now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'summary' ? (
              <div style={{ flex: 1, overflowY: 'auto', background: '#F9FAFB' }}>
                <WorkstationSummaryEnhanced 
                  content={currentAnalysis.summary} 
                  material={selectedMaterial} 
                  pageSummaries={pageSummaries}
                  onFetchPageSummaries={handleFetchPageSummaries}
                  onRegenerate={() => runAnalysis('summary')}
                />
              </div>
            ) : activeTab === 'flashcards' ? (
              <div style={{ flex: 1, overflowY: 'auto', background: '#F9FAFB' }}>
                <WorkstationFlashcards 
                  flashcards={currentAnalysis.flashcards} 
                  material={selectedMaterial} 
                  onRegenerate={() => runAnalysis('flashcards')} 
                />
              </div>
            ) : activeTab === 'quiz' ? (
              <div style={{ flex: 1, overflowY: 'auto', background: '#F9FAFB' }}>
                <WorkstationQuiz 
                  quiz={currentAnalysis.quiz} 
                  material={selectedMaterial} 
                  onRegenerate={() => runAnalysis('quiz')} 
                />
              </div>
            ) : !selectedMaterial ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', flex: 1 }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <BookOpen size={24} color="#6B7280" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111', marginBottom: '8px' }}>No material selected</h3>
                  <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>
                    Select a study material from the sidebar to begin.
                  </p>
                  <button 
                    onClick={() => navigate('/dashboard/upload')}
                    style={{ padding: '10px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Upload Material
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', width: '100%' }}>
                <MaterialRenderer
                  key={selectedMaterial.id}
                  material={selectedMaterial}
                  activeTab={activeTab}
                  onSparkUpdate={updateSpark}
                  setViewportData={setViewportData}
                  onMaterialUpdate={(updates) => {
                    setSelectedMaterial(prev => prev ? { ...prev, ...updates } : null)
                    setCourseMaterials(prev => prev.map(m => m.id === selectedMaterial.id ? { ...m, ...updates } : m))
                  }}
                />
              </div>
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
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: activeSideTab === 'write' 
                  ? 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)' 
                  : 'linear-gradient(135deg, #ffffff 0%, #F8FAFC 100%)',
                color: activeSideTab === 'write' ? 'white' : '#6D28D9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: activeSideTab === 'write'
                  ? '0 20px 40px rgba(109, 40, 217, 0.25), 0 8px 16px rgba(109, 40, 217, 0.15), 0 0 0 1px rgba(255,255,255,0.1)'
                  : '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 40,
                touchAction: 'none'
              }}
              whileHover={{ 
                scale: 1.05, 
                y: -6,
                boxShadow: activeSideTab === 'write'
                  ? '0 25px 50px rgba(109, 40, 217, 0.35), 0 10px 20px rgba(109, 40, 217, 0.2), 0 0 0 1px rgba(255,255,255,0.2)'
                  : '0 25px 50px rgba(0, 0, 0, 0.12), 0 10px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.06)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <PencilSimple size={32} weight={activeSideTab === 'write' ? 'regular' : 'bold'} />
            </motion.button>
        </div>

        {!isSidePanelCollapsed && !focusMode && (
          <aside id="tour-ai-chat" style={{ 
            display: isMobile ? (activeTab === 'chat' ? 'flex' : 'none') : 'flex', 
            minWidth: '360px',
            gridColumn: '2 / 3', 
            borderLeft: '1px solid #E5E7EB', 
            background: 'white',
            flexDirection: 'column',
            zIndex: 10,
            position: isMobile ? 'fixed' : 'sticky',
            top: isMobile ? '60px' : '72px',
            height: isMobile ? 'calc(100dvh - 132px)' : 'calc(100vh - 72px)'
          }}>
            <div style={{ padding: '16px 20px 8px' }}>
              <div style={{ 
                display: 'flex', 
                padding: '3px', 
                background: '#F3F4F6', 
                borderRadius: '10px'
              }}>
                <button 
                  onClick={() => setActiveSideTab('chat')}
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    background: activeSideTab === 'chat' ? 'white' : 'transparent', 
                    border: 'none', 
                    borderRadius: '7px', 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    color: activeSideTab === 'chat' ? '#111827' : '#6B7280',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px'
                  }}
                >
                  <ChatsCircleIcon size={14} weight={activeSideTab === 'chat' ? 'bold' : 'regular'} />
                  Chat
                </button>
                <button 
                  onClick={() => setActiveSideTab('write')}
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    background: activeSideTab === 'write' ? 'white' : 'transparent', 
                    border: 'none', 
                    borderRadius: '7px', 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    color: activeSideTab === 'write' ? '#111827' : '#6B7280',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px'
                  }}
                >
                  <PencilSimple size={14} weight={activeSideTab === 'write' ? 'bold' : 'regular'} />
                  Write
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeSideTab === 'write' ? (
                  <WorkstationWrite 
                    initialContent={userJottings} 
                    onSave={handleSaveNote} 
                    material={selectedMaterial} 
                    user={user} 
                  />
                ) : activeSideTab === 'voice' ? (
                  <React.Suspense fallback={<div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Initializing engine...</div>}>
                    <VoiceModeBlob onExit={() => setActiveSideTab('chat')} />
                  </React.Suspense>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="ws-chat-messages" style={{ flex: 1 }}>
                      {messages.length === 0 ? (
                        <div className="ws-chat-empty-state" style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>

                          <div className="ws-suggested-list" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {SUGGESTED_QUESTIONS.map((q, idx) => (
                              <motion.button 
                                key={q.id} 
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 + (idx * 0.05) }}
                                className="ws-suggested-item" 
                                onClick={() => handleSend(q.text)} 
                                style={{ 
                                  width: '100%', background: 'white', border: '1px solid #F1F5F9', 
                                  borderRadius: '16px', padding: '16px 20px', textAlign: 'left', 
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                  transition: 'all 0.2s', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6D28D9'; e.currentTarget.style.background = '#F8FAFC' }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#F1F5F9'; e.currentTarget.style.background = 'white' }}
                              >
                                <span style={{ fontSize: '14px', color: '#334155', fontWeight: 600, fontFamily: 'var(--font-outfit)' }}>{q.text}</span>
                                <ArrowSquareOutIcon size={16} color="#6D28D9" weight="bold" />
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="ws-chat-scroll" style={{ padding: '24px' }}>
                          {messages.map((msg, i) => {
                            const isUser = msg.role === 'user'
                            const [mainPart, suggestionPart] = msg.content.split('---SUGGESTIONS---')
                            const suggestions = suggestionPart ? suggestionPart.split('|').map(s => s.trim()).filter(Boolean) : []

                            return (
                              <div key={i} style={{ 
                                marginBottom: '40px', 
                                display: 'flex', 
                                gap: '16px',
                                animation: 'fadeUp 0.3s ease-out'
                              }}>
                                <div style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  borderRadius: '10px', 
                                  background: isUser ? 'rgba(0,0,0,0.03)' : 'var(--primary-bg)', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  color: isUser ? 'var(--muted)' : 'var(--primary)',
                                  flexShrink: 0,
                                  marginTop: '4px'
                                }}>
                                   {isUser ? <UserIcon size={20} weight="bold" /> : <Sparkle size={20} weight="fill" />}
                                </div>

                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    fontWeight: 800, 
                                    color: isUser ? 'var(--muted)' : 'var(--primary)', 
                                    marginBottom: '6px', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.08em',
                                    fontFamily: 'var(--font-outfit)'
                                  }}>
                                     {isUser ? 'You' : 'Luter AI'}
                                  </div>

                                  <div className="ws-plain-message" style={{ 
                                    fontSize: '15px', 
                                    color: 'var(--text)', 
                                    lineHeight: '1.6', 
                                    fontFamily: 'var(--font-outfit)'
                                  }}>
                                    {isUser ? (
                                       <p style={{ margin: 0, fontWeight: 500 }}>{msg.content}</p>
                                    ) : (
                                      <div style={{ width: '100%' }}>
                                         <div className="ws-ai-message-content">
                                           <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                             h1: ({ children }) => <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--text)', marginTop: '8px' }}>{children}</h3>,
                                             h2: ({ children }) => <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px', color: 'var(--text)', marginTop: '8px' }}>{children}</h3>,
                                             p: ({ children }) => <p style={{ marginBottom: '12px' }}>{children}</p>,
                                             li: ({ children }) => <li style={{ marginBottom: '8px' }}>{children}</li>,
                                             code: ({ children }) => <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '14px' }}>{children}</code>
                                           }}>{mainPart}</ReactMarkdown>
                                         </div>
                                         <div style={{ display: 'flex', gap: '20px', marginTop: '16px', opacity: 0.6 }}>
                                           <button style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, background: 'none', border: 'none', color: '#64748B' }}>
                                             <ThumbsUp size={14} /> <span>Helpful</span>
                                           </button>
                                           <button style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, background: 'none', border: 'none', color: '#64748B' }}>
                                             <CopySimple size={14} /> <span>Copy</span>
                                           </button>
                                         </div>
                                         
                                         {suggestions.length > 0 && (
                                           <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)' }}>
                                             <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Next Steps</div>
                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                               {suggestions.map((s, idx) => (
                                                 <button key={idx} onClick={() => handleSend(s)} style={{ width: '100%', background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '10px', padding: '12px 14px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--primary)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)' }}>
                                                   <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{s}</span>
                                                   <ArrowSquareOutIcon size={14} color="var(--primary)" />
                                                 </button>
                                               ))}
                                             </div>
                                           </div>
                                         )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          {isProcessingLoading && (
                            <div style={{ 
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', 
                              background: 'white', borderRadius: '16px', width: 'fit-content', 
                              border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' 
                            }}>
                               <Typing dots={3} className="text-[var(--primary)]" />
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                    <div className="ws-chat-input-area" style={{ 
                      padding: '24px 28px 40px', 
                      borderTop: '1px solid rgba(241, 245, 249, 0.5)',
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(40px)',
                      WebkitBackdropFilter: 'blur(40px)',
                    }}>
                      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div>
                          3 explanations left
                        </div>
                        <button style={{ fontSize: '11px', color: '#6D28D9', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', background: '#F5F3FF', padding: '4px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Upgrade <ArrowUpRight size={12} weight="bold" /></button>
                      </div>
                      
                      <div style={{ 
                        background: 'rgba(248, 250, 252, 0.8)', 
                        border: '1.5px solid rgba(226, 232, 240, 0.8)', 
                        borderRadius: '24px', 
                        padding: '12px 18px',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '14px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        position: 'relative'
                      }} onFocusCapture={(e) => { 
                        e.currentTarget.style.borderColor = '#6D28D9'; 
                        e.currentTarget.style.background = 'white'; 
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(109, 40, 217, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }} onBlurCapture={(e) => { 
                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; 
                        e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)'; 
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}>
                        <input 
                          type="text" 
                          placeholder="Ask Luter anything..." 
                          value={chatInput} 
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          disabled={isProcessingLoading}
                          style={{ 
                            flex: 1, border: 'none', background: 'transparent', outline: 'none', 
                            fontSize: '14px', color: '#1E293B', fontFamily: 'var(--font-outfit)',
                            padding: '8px 4px', fontWeight: 500
                          }}
                        />
                        <button style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#6D28D9'} onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}>
                          <Microphone size={20} weight="bold" />
                        </button>
                        <button 
                          onClick={() => handleSend()} 
                          disabled={isProcessingLoading || !chatInput.trim()}
                          style={{ 
                            background: '#000', 
                            color: 'white', border: 'none', borderRadius: '12px', width: '42px', height: '42px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            opacity: (!chatInput.trim() && !isProcessingLoading) ? 0.3 : 1
                          }}
                        >
                          <PaperPlaneRight size={20} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
          </aside>
        )}
      </main>

      {isMobile && (
        <header className="ws-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(229, 231, 235, 0.6)',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <button 
            className={`mobile-nav-item ${activeTab === 'content' ? 'mobile-nav-item--active' : ''}`} 
            onClick={() => setActiveTab('content')}
            style={{ color: activeTab === 'content' ? '#6D28D9' : '#64748B', transition: 'all 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <SquaresFour size={22} weight={activeTab === 'content' ? 'bold' : 'regular'} />
            <span style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Source</span>
          </button>
          <button 
            className={`mobile-nav-item ${activeTab === 'chat' ? 'mobile-nav-item--active' : ''}`} 
            onClick={() => { setActiveTab('chat'); setActiveSideTab('chat'); setSidePanelCollapsed(false); }}
            style={{ color: activeTab === 'chat' ? '#6D28D9' : '#64748B', transition: 'all 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ChatCircleTextIcon size={22} weight={activeTab === 'chat' ? 'bold' : 'regular'} />
            <span style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Chat</span>
          </button>
          <button 
            className={`mobile-nav-item ${activeTab === 'flashcards' ? 'mobile-nav-item--active' : ''}`} 
            onClick={() => { setActiveTab('flashcards'); setActiveSideTab('flashcards'); }}
            style={{ color: activeTab === 'flashcards' ? '#6D28D9' : '#64748B', transition: 'all 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Stack size={22} weight={activeTab === 'flashcards' ? 'bold' : 'regular'} />
            <span style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Cards</span>
          </button>
          <button 
            className={`mobile-nav-item ${activeTab === 'quiz' ? 'mobile-nav-item--active' : ''}`} 
            onClick={() => { setActiveTab('quiz'); setActiveSideTab('quiz'); }}
            style={{ color: activeTab === 'quiz' ? '#6D28D9' : '#64748B', transition: 'all 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ClipboardText size={22} weight={activeTab === 'quiz' ? 'bold' : 'regular'} />
            <span style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Quiz</span>
          </button>
        </header>
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
