import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  List,
  ChatsCircle as ChatsCircleIcon,
  Users,
  X,
  PaperPlaneTilt as PaperPlaneIcon,
  Clock,
  Crown
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
import { useDeckStore } from '../../store/useDeckStore'
import MaterialAnalysisService from '../../services/materialAnalysisService'
import './workstation.css'

// Collaboration
import { CollaborationProvider } from './CollaborationProvider'
import { Whiteboard } from './Whiteboard'
import { GroupQuiz } from './GroupQuiz'
import { PresenceBar, SyncControl, LiveReactionBar } from './CollaborationTools'
import { useGroupChat } from '../../hooks/useGroupChat'
import { useLiveBroadcast, useLiveEventListener } from '../../hooks/useLiveCollaboration'
import { 
  useStorage, 
  useMutation, 
  useOthers, 
  useUpdateMyPresence,
  useSelf
} from '../../liveblocks.config'

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
  const [courseInfo, setCourseInfo] = useState(null)
  const [sessionMaterials, setSessionMaterials] = useState([])
  const { user, isMobile, sidebarCollapsed, setSidebarCollapsed, profile, mobileSidebarOpen, setMobileSidebarOpen } = useOutletContext() || {}
  const { setViewportData, highlightText, updateSpark, clearHighlights, viewportData, updateSelection, isSidePanelCollapsed, setSidePanelCollapsed } = useReadingSpace()

  const handleScrollUpdate = useCallback((data) => {
    if (data && setViewportData) setViewportData(data)
  }, [setViewportData])

  const handleSelectionAction = async (actionId, text) => {
    if (actionId === 'explain' || actionId === 'summarize') {
      setActivePanelContext('explanation')
      setActiveExplanation(actionId === 'explain' ? "Analyzing and explaining..." : "Summarizing selection...")
      setActiveSideTab('chat')
      if (isSidePanelCollapsed) setSidePanelCollapsed(false)
      
      try {
        // Usage check
        if (explanationsLeft <= 0 && !profile?.is_premium) {
          setActiveExplanation("You've used your 3 free explanations. Upgrade to Luter Pro for unlimited access!")
          return
        }

        const prompt = actionId === 'explain' 
          ? `Explain this concept clearly for a student: "${text}"`
          : `Provide a concise, high-impact summary of this section: "${text}"`

        const response = await callGroqAPI(
          GROQ_MODELS.LLAMA_3_70B,
          [{ role: 'user', content: prompt }],
          GROQ_PROMPTS.EXPLAINER
        )
        setActiveExplanation(response)

        // Decrement logic
        if (!profile?.is_premium) {
          const { data: newCount } = await supabase.rpc('decrement_user_explanations', { user_id: user.id })
          if (newCount !== undefined) setExplanationsLeft(newCount)
        }
      } catch (err) {
        setActiveExplanation("Failed to generate response. Please try again.")
      }
    } else if (actionId === 'save_note' || actionId === 'save') {
      const newNote = `> ${text}\n\n`
      setUserJottings(prev => prev + newNote)
      setActiveSideTab('write')
      if (isSidePanelCollapsed) setSidePanelCollapsed(false)
    } else if (actionId === 'flashcard') {
      setActiveSideTab('flashcards')
      if (isSidePanelCollapsed) setSidePanelCollapsed(false)
    }
  }

  const handleExit = () => {
    const xpEarned = Math.floor(elapsedTime / 10)
    setSessionXP(xpEarned)
    setShowExitSummary(true)
  }

  const confirmExit = () => {
    navigate(-1)
  }
  
  const [activeTab, setActiveTab] = useState('content')
  const [activeSideTab, setActiveSideTab] = useState('chat')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [explanationsLeft, setExplanationsLeft] = useState(profile?.explanations_left ?? 3)
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem('ws-panel-width')
    return saved ? parseInt(saved, 10) : 360
  })
  const isResizing = useRef(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= 280 && newWidth <= 600) {
        setPanelWidth(newWidth)
        localStorage.setItem('ws-panel-width', String(newWidth))
      }
    }
    const handleMouseUp = () => { isResizing.current = false }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])
  
  // Session Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')} elapsed`
  }
  const { startTour, hasCompletedTour, isLoadingTours } = useTourStore()

  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isProcessingLoading, setIsProcessingLoading] = useState(false)
  const [courseMaterials, setCourseMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isGroupSession, setIsGroupSession] = useState(false)
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(false)
  const [showExitSummary, setShowExitSummary] = useState(false)
  const [activePanelContext, setActivePanelContext] = useState('default') // default, explanation, quiz, flashcard
  const [activeExplanation, setActiveExplanation] = useState(null)
  // Tour effect — must come AFTER selectedMaterial declaration
  useEffect(() => {
    if (user?.id && selectedMaterial && !isLoadingTours && !hasCompletedTour('workstation')) {
      const timer = setTimeout(() => startTour('workstation'), 2000)
      return () => clearTimeout(timer)
    }
  }, [user?.id, selectedMaterial, hasCompletedTour, startTour, isLoadingTours])
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
  const [sessionXP, setSessionXP] = useState(0)
  const [showFileSwitcher, setShowFileSwitcher] = useState(false)
  
  // Collaboration Room ID
  const roomId = useMemo(() => {
    if (!materialIdParam) return null
    return `luter-material-${materialIdParam}`
  }, [materialIdParam])

  useEffect(() => {
    if (courseId) {
      fetchCourseData()
    }
  }, [courseId])

  async function fetchCourseData() {
    try {
      const { data: course, error: cErr } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()
      
      if (cErr) throw cErr
      setCourseInfo(course)

      const { data: materials, error: mErr } = await supabase
        .from('study_materials')
        .select('*')
        .eq('course_id', courseId)
      
      if (mErr) throw mErr
      setSessionMaterials(materials)
    } catch (err) {
      console.error('Error fetching course data:', err)
    }
  }
  const [userJottings, setUserJottings] = useState("")
  const [jottingNoteId, setJottingNoteId] = useState(null)
  
  // Liveblocks Hooks
  const updatePresence  = useUpdateMyPresence()
  const self            = useSelf()
  const syncMode        = useStorage((root) => root.syncMode)
  const presenterSlide  = useStorage((root) => root.presenterSlide)
  const presenterId     = useStorage((root) => root.presenterId)
  const others          = useOthers()

  // Group chat
  const { messages: groupMessages, sendMessage: sendGroupMessage, setTyping } = useGroupChat(user)
  const [groupInput, setGroupInput] = useState('')

  // Broadcast events
  const { broadcastSyncJump } = useLiveBroadcast()

  // Listen for broadcast events from others
  useLiveEventListener({
    onSyncJump: ({ slideNumber }) => {
      if (syncMode && presenterId !== user?.id) {
        // Jump MaterialRenderer to this page via existing CustomEvent bridge
        window.dispatchEvent(new CustomEvent('luter-jump-to-page', { detail: { page: slideNumber } }))
      }
    },
    onRaiseHand: ({ userName: who }) => {
      // Simple DOM toast — avoids pulling in a full toast library
      const el = document.createElement('div')
      el.innerText = `✋ ${who} raised their hand`
      Object.assign(el.style, {
        position: 'fixed', bottom: '80px', left: '50%',
        transform: 'translateX(-50%)',
        background: '#1E293B', color: 'white',
        padding: '10px 18px', borderRadius: '12px',
        fontSize: '13px', fontWeight: 700,
        zIndex: '9999', pointerEvents: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        animation: 'fadeUp 0.3s ease-out'
      })
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 3000)
    }
  })

  const setSyncMode = useMutation(({ storage }, val) => {
    storage.set('syncMode', val)
    if (val) {
      storage.set('presenterId', user?.id)
      // Set self as presenter role in presence
      updatePresence({ role: 'presenter' })
    } else {
      updatePresence({ role: 'participant' })
    }
  }, [user?.id, updatePresence])

  const setPresenterSlide = useMutation(({ storage }, page) => {
    storage.set('presenterSlide', page)
  }, [])

  // Broadcast presence + sync slide
  useEffect(() => {
    if (viewportData?.currentPage) {
      updatePresence({ currentPage: viewportData.currentPage })
      if (syncMode && presenterId === user?.id) {
        setPresenterSlide(viewportData.currentPage)
        // Broadcast so others jump immediately without polling
        broadcastSyncJump(viewportData.currentPage)
      }
    }
  }, [viewportData?.currentPage, syncMode, presenterId, user?.id, updatePresence, setPresenterSlide, broadcastSyncJump])
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


  async function handleFetchPageSummaries() {
    if (!selectedMaterial) return
    try {
      if (currentAnalysis.page_summaries) {
        setPageSummaries(currentAnalysis.page_summaries)
        return
      }
      const pageTextMap = await MaterialAnalysisService.fetchMaterialPageMap(selectedMaterial.id, selectedMaterial)
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
      
      // FORCE REFRESH & EXTRACTION GUARD: Ensure we have the extracted_text
      let materialText = selectedMaterial.extracted_text
      
      const { data: latestMaterial } = await supabase
        .from('materials')
        .select('extracted_text, processing_status')
        .eq('id', selectedMaterial.id)
        .single()
      
      if (latestMaterial?.extracted_text) {
        materialText = latestMaterial.extracted_text
        selectedMaterial.extracted_text = latestMaterial.extracted_text
        console.log(`[runAnalysis] Found extracted_text, length:`, materialText.length)
      }
      
      // If still no text, try one last emergency extraction
      if (!materialText) {
        console.log(`[runAnalysis] Text still missing, triggering emergency extraction...`)
        const extractionRes = await MaterialAnalysisService.reprocessMaterial(selectedMaterial)
        if (extractionRes.success && extractionRes.fullText) {
          materialText = extractionRes.fullText
          selectedMaterial.extracted_text = materialText
          console.log(`[runAnalysis] Emergency extraction successful, length:`, materialText.length)
        } else {
          console.error(`[runAnalysis] All extraction attempts failed`)
          // If we have a summary, we can still proceed, but flashcards will be poor
          if (!currentAnalysisRow?.summary) {
            throw new Error('Unable to extract text from this material. Please try re-uploading.')
          }
        }
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
      
      if (dbColumn && finalResult && (Array.isArray(finalResult) ? finalResult.length > 0 : true)) {
        console.log(`[runAnalysis] Saving ${type} to DB...`)
        const updateData = { 
          material_id: selectedMaterial.id, 
          user_id: user?.id, 
          [dbColumn]: finalResult, 
          updated_at: new Date().toISOString() 
        }
        
        // Use currentAnalysisRow to avoid state race condition
        if (currentAnalysisRow) {
          updateData.analysis = currentAnalysisRow
        }
        
        await supabase.from('material_analysis').upsert(updateData, { onConflict: 'material_id' });
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
      // Usage check
      if (explanationsLeft <= 0 && !profile?.is_premium) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: "You've reached your limit of free explanations for today. 🚀 **Upgrade to Luter Pro** to unlock unlimited AI power and continue your study session without interruptions!" 
        }])
        return
      }

      // Determine retrieval context: Specific material, or the whole deck?
      const materialContext = selectedMaterial?.id || activeDeckItems.map(i => i.content_id)
      
      const aiResponse = await queryStudyMaterials({ 
        question: textToSend, 
        courseId, 
        materialId: materialContext, 
        fallbackContext: (selectedMaterial?.extracted_text || "").replace(/\*\*/g, '').slice(0, 8000)
      })
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }])
      
      // Decrement logic
      if (!profile?.is_premium) {
        const { data: newCount } = await supabase.rpc('decrement_user_explanations', { user_id: user.id })
        if (newCount !== undefined) setExplanationsLeft(newCount)
      }
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
          background: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)', 
          height: '60px', 
          display: 'flex', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ 
            width: '100%',
            maxWidth: focusMode ? '1200px' : 'none',
            margin: '0 auto',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px',
                  borderRadius: '8px',
                  color: '#64748B',
                  transition: 'all 0.2s',
                  marginLeft: '-6px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <SidebarSimple size={20} weight={sidebarCollapsed ? "bold" : "regular"} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94A3B8', fontSize: '13px' }}>
                <div 
                  onClick={() => navigate('/dashboard')} 
                  style={{ 
                    cursor: 'pointer', 
                    color: '#64748B', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '6px',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <House size={18} weight="bold" />
                </div>
                <CaretRight size={14} weight="bold" />
                <span 
                  onClick={() => navigate(`/dashboard/courses/${courseId}`)} 
                  style={{ 
                    cursor: 'pointer', 
                    color: '#64748B', 
                    fontWeight: 600,
                    fontFamily: 'var(--font-outfit)',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
                >
                  {courseInfo?.code || 'Course'}
                </span>
                <CaretRight size={14} weight="bold" />
                
                {/* File Switcher Pill with Dropdown */}
                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setShowFileSwitcher(!showFileSwitcher)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      background: '#F1F5F9',
                      padding: '4px 10px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#E2E8F0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#F1F5F9'}
                  >
                    <FileText size={16} color="#6D28D9" weight="fill" />
                    <span style={{ 
                      color: '#111827', 
                      fontWeight: 700, 
                      fontSize: '12px',
                      fontFamily: 'var(--font-outfit)',
                      maxWidth: '180px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {selectedMaterial?.title || 'Material'}
                    </span>
                    <CaretRight size={12} weight="bold" style={{ transform: showFileSwitcher ? 'rotate(270deg)' : 'rotate(90deg)', transition: '0.2s', color: '#94A3B8' }} />
                  </div>

                  <AnimatePresence>
                    {showFileSwitcher && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                          position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '280px',
                          background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden'
                        }}
                      >
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                          Switch Material
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
                          {sessionMaterials.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedMaterial(m)
                                setShowFileSwitcher(false)
                              }}
                              style={{
                                width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px',
                                background: selectedMaterial?.id === m.id ? '#F5F3FF' : 'transparent',
                                color: selectedMaterial?.id === m.id ? '#6D28D9' : '#1E293B',
                                textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                transition: '0.2s', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-outfit)'
                              }}
                              onMouseEnter={(e) => { if (selectedMaterial?.id !== m.id) e.currentTarget.style.background = '#F8FAFC' }}
                              onMouseLeave={(e) => { if (selectedMaterial?.id !== m.id) e.currentTarget.style.background = 'transparent' }}
                            >
                              <FileText size={16} weight={selectedMaterial?.id === m.id ? 'fill' : 'bold'} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                            </button>
                          ))}
                          <button style={{
                            width: '100%', padding: '12px', marginTop: '4px', border: '1px dashed #E2E8F0', borderRadius: '10px',
                            background: 'transparent', color: '#64748B', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}>
                            <Plus size={14} weight="bold" /> Add file to session
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Timer Badge */}
                <div style={{ 
                  marginLeft: '8px',
                  padding: '4px 10px',
                  background: '#F5F3FF',
                  borderRadius: '20px',
                  color: '#6D28D9',
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-outfit)',
                  border: '1px solid rgba(109, 40, 217, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Clock size={12} weight="bold" />
                  {formatTime(elapsedTime)}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div id="tour-ai-tools" style={{ 
                display: 'flex', 
                background: '#F8FAFC', 
                padding: '3px', 
                borderRadius: '12px', 
                border: '1px solid #E2E8F0',
                gap: '2px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <button 
                  onClick={() => { setActiveTab('content'); setActiveSideTab('chat'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, 
                    borderRadius: '9px', border: 'none', cursor: 'pointer',
                    background: (activeTab === 'content' || activeTab === 'notes') ? 'white' : 'transparent',
                    color: (activeTab === 'content' || activeTab === 'notes') ? '#6D28D9' : '#64748B',
                    boxShadow: (activeTab === 'content' || activeTab === 'notes') ? '0 2px 6px rgba(109, 40, 217, 0.1)' : 'none',
                    fontFamily: 'var(--font-outfit)',
                    transition: 'all 0.2s'
                  }}
                >
                  <FileText size={16} weight={activeTab === 'content' ? 'fill' : 'bold'} /> Source
                </button>
                <button 
                  onClick={() => { setActiveTab('summary'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, 
                    borderRadius: '9px', border: 'none', cursor: 'pointer',
                    background: activeTab === 'summary' ? 'white' : 'transparent',
                    color: activeTab === 'summary' ? '#6D28D9' : '#64748B',
                    boxShadow: activeTab === 'summary' ? '0 2px 6px rgba(109, 40, 217, 0.1)' : 'none',
                    fontFamily: 'var(--font-outfit)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Sparkle size={16} weight={activeTab === 'summary' ? 'fill' : 'bold'} /> Summary
                </button>
                <button 
                  onClick={() => { setActiveTab('flashcards'); setActiveSideTab('flashcards'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, 
                    borderRadius: '9px', border: 'none', cursor: 'pointer',
                    background: activeTab === 'flashcards' ? 'white' : 'transparent',
                    color: activeTab === 'flashcards' ? '#6D28D9' : '#64748B',
                    boxShadow: activeTab === 'flashcards' ? '0 2px 6px rgba(109, 40, 217, 0.1)' : 'none',
                    fontFamily: 'var(--font-outfit)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Stack size={16} weight={activeTab === 'flashcards' ? 'fill' : 'bold'} /> Cards
                </button>
                <button 
                  onClick={() => { setActiveTab('quiz'); setActiveSideTab('quiz'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, 
                    borderRadius: '9px', border: 'none', cursor: 'pointer',
                    background: activeTab === 'quiz' ? 'white' : 'transparent',
                    color: activeTab === 'quiz' ? '#6D28D9' : '#64748B',
                    boxShadow: activeTab === 'quiz' ? '0 2px 6px rgba(109, 40, 217, 0.1)' : 'none',
                    fontFamily: 'var(--font-outfit)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Checks size={16} weight={activeTab === 'quiz' ? 'fill' : 'bold'} /> Quiz
                </button>
                <button 
                  onClick={() => setActiveTab('board')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, 
                    borderRadius: '20px', border: 'none', cursor: 'pointer',
                    background: activeTab === 'board' 
                      ? 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)' 
                      : 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
                    color: activeTab === 'board' ? 'white' : '#6D28D9',
                    boxShadow: activeTab === 'board' 
                      ? '0 4px 12px rgba(109, 40, 217, 0.35)' 
                      : '0 1px 4px rgba(109, 40, 217, 0.15)',
                    fontFamily: 'var(--font-outfit)',
                    transition: 'all 0.2s',
                    letterSpacing: '0.01em'
                  }}
                  onMouseEnter={(e) => { 
                    if (activeTab !== 'board') {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(109, 40, 217, 0.35)';
                    }
                  }}
                  onMouseLeave={(e) => { 
                    if (activeTab !== 'board') {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)';
                      e.currentTarget.style.color = '#6D28D9';
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(109, 40, 217, 0.15)';
                    }
                  }}
                >
                  <PencilLine size={14} weight={activeTab === 'board' ? 'fill' : 'bold'} /> Board
                </button>
              </div>
            </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            <PresenceBar />
            <div style={{ position: 'relative' }}>
              <button 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', 
                  fontSize: '12px', fontWeight: 800, borderRadius: '10px', 
                  border: 'none', background: profile?.is_premium ? 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)' : '#F5F3FF', 
                  color: profile?.is_premium ? 'white' : '#6D28D9', 
                  cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                  transition: '0.2s', position: 'relative'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {profile?.is_premium ? 'Luter Pro' : 'Upgrade'}
                {!profile?.is_premium && (
                  <div style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: '#EF4444', color: 'white', fontSize: '9px',
                    fontWeight: 900, padding: '2px 5px', borderRadius: '10px',
                    border: '2px solid white', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }}>
                    {explanationsLeft} LEFT
                  </div>
                )}
              </button>
            </div>
            <button 
              onClick={() => setFocusMode(!focusMode)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 13px', 
                fontSize: '12px', fontWeight: 700, borderRadius: '10px', 
                border: '1px solid #E2E8F0', 
                background: focusMode ? '#6D28D9' : 'white', 
                color: focusMode ? 'white' : '#1E293B', 
                cursor: 'pointer', fontFamily: 'var(--font-outfit)', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (!focusMode) { e.currentTarget.style.borderColor = '#6D28D9'; e.currentTarget.style.color = '#6D28D9'; e.currentTarget.style.background = '#F5F3FF'; }}}
              onMouseLeave={(e) => { if (!focusMode) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.background = 'white'; }}}
            >
              {focusMode ? <RiEyeLine size={15} /> : <RiEyeOffLine size={15} />}
              {focusMode ? 'Exit Focus' : 'Focus Mode'}
            </button>
            <button
              onClick={handleExit}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 13px',
                fontSize: '12px', fontWeight: 700, borderRadius: '10px',
                border: '1px solid #FDA4AF', background: '#FFF1F2', color: '#E11D48',
                cursor: 'pointer', fontFamily: 'var(--font-outfit)', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FFE4E6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFF1F2'; }}
            >
              Exit Session
            </button>
            <div style={{ position: 'relative' }}>
              <button
                id="ws-more-menu-btn"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                style={{
                  padding: '7px 9px', borderRadius: '10px', border: '1px solid #E2E8F0',
                  background: 'white', color: '#1E293B', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6D28D9'; e.currentTarget.style.color = '#6D28D9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
              >
                <DotsThree size={20} weight="bold" />
              </button>
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    style={{
                      position: 'absolute', right: 0,
                      top: 'calc(100% + 8px)', background: 'white', border: '1px solid #E2E8F0',
                      borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 200,
                      minWidth: '160px', overflow: 'hidden'
                    }}
                  >
                    <button 
                      onClick={() => setShowMoreMenu(false)}
                      style={{ padding: '11px 16px', width: '100%', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-outfit)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <ShareNetwork size={15} weight="bold" /> Share Session
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
      )}


      <main className="ws-main-layout" style={{ 
        display: 'flex',
        flexDirection: 'row',
        background: 'transparent', 
        overflow: 'hidden', 
        padding: '0', 
        flex: 1,
        height: 'calc(100vh - 60px)',
        position: 'relative'
      }}>
        {/* Main Workspace Area - Center Zone */}
        <div ref={constraintsRef} className="ws-center-viewer" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          background: 'linear-gradient(180deg, #FAFBFC 0%, #F8FAFC 50%, #F1F5F9 100%)', 
          position: 'relative',
          height: '100%',
          flex: 1,
          minWidth: 0,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.03)',
          zIndex: 1
        }}>
          {/* 1. Summary View */}
          <div style={{ flex: 1, display: activeTab === 'summary' ? 'block' : 'none', overflowY: 'auto', background: '#F9FAFB', height: '100%' }}>
            <WorkstationSummaryEnhanced 
              content={currentAnalysis.summary} 
              material={selectedMaterial} 
              pageSummaries={pageSummaries}
              onFetchPageSummaries={handleFetchPageSummaries}
              onRegenerate={() => runAnalysis('summary')}
              onJumpToPage={(p) => { handlePageJump(p); setActiveTab('content'); }}
            />
          </div>

          {/* 2. Flashcards View */}
          <div style={{ flex: 1, display: activeTab === 'flashcards' ? 'block' : 'none', overflowY: 'auto', background: '#F9FAFB', height: '100%' }}>
            <WorkstationFlashcards 
              flashcards={currentAnalysis.flashcards} 
              material={selectedMaterial} 
              onRegenerate={() => runAnalysis('flashcards')} 
            />
          </div>

          {/* 3. Quiz View */}
          <div style={{ flex: 1, display: activeTab === 'quiz' ? 'block' : 'none', overflowY: 'auto', background: '#F9FAFB', height: '100%' }}>
            <WorkstationQuiz 
              quiz={currentAnalysis.quiz} 
              material={selectedMaterial} 
              onRegenerate={() => runAnalysis('quiz')} 
            />
          </div>

          {/* 4. Whiteboard View */}
          <div style={{ flex: 1, display: activeTab === 'board' ? 'block' : 'none', height: '100%', background: 'white', position: 'relative' }}>
            <Whiteboard roomId={roomId} />
          </div>

          {/* 5. Main Workspace (Document & Notes) */}
          {!selectedMaterial ? (
            <div style={{ height: '100%', display: (activeTab !== 'summary' && activeTab !== 'flashcards' && activeTab !== 'quiz' && activeTab !== 'board') ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', flex: 1 }}>
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
            <div style={{ 
              flex: 1, 
              display: (activeTab !== 'summary' && activeTab !== 'flashcards' && activeTab !== 'quiz' && activeTab !== 'board') ? 'flex' : 'none', 
              flexDirection: 'column', 
              position: 'relative', 
              overflow: 'hidden', 
              height: '100%' 
            }}>
              {/* Notes View */}
              <div className="ws-scroll-container" style={{ 
                flex: 1, 
                display: activeTab === 'notes' ? 'block' : 'none',
                padding: '60px 40px', 
                overflowY: 'auto', 
                height: '100%' 
              }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                     <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <FileText size={20} color="#6D28D9" />
                     </div>
                     <div>
                       <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A102D', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em' }}>Personal Study Notes</h1>
                       <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Capture and organize your thoughts for {selectedMaterial.title}</p>
                     </div>
                  </div>
                  <div className="ws-notion-card" style={{ padding: '40px', minHeight: '600px' }}>
                     <textarea 
                        placeholder="Start typing your notes here..."
                        value={selectedMaterial.notes || ''}
                        onChange={(e) => {
                          const newNotes = e.target.value
                          setSelectedMaterial(prev => ({ ...prev, notes: newNotes }))
                        }}
                        style={{
                          width: '100%', height: '100%', minHeight: '500px', border: 'none', outline: 'none',
                          fontSize: '16px', lineHeight: '1.7', color: '#334155', fontFamily: 'var(--font-varela)',
                          resize: 'none', background: 'transparent'
                        }}
                     />
                  </div>
                </div>
              </div>

              {/* Document Viewer View */}
              <div className="ws-visual-viewport" style={{ 
                flex: 1, 
                display: activeTab !== 'notes' ? 'flex' : 'none',
                height: '100%', 
                overflow: 'hidden', 
                position: 'relative', 
                flexDirection: 'column' 
              }}>
                {/* Floating Selection Tool Pill */}
                {!isMobile && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      position: 'absolute',
                      bottom: '30px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 100,
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      padding: '6px',
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                      gap: '4px'
                    }}
                  >
                    <button 
                      onClick={() => setActiveTab('board')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                        background: activeTab === 'board' ? '#F5F3FF' : 'transparent',
                        color: activeTab === 'board' ? '#6D28D9' : '#64748B',
                        border: 'none', borderRadius: '12px',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                        transition: '0.2s',
                        boxShadow: activeTab === 'board' ? '0 2px 8px rgba(109, 40, 217, 0.1)' : 'none'
                      }}
                      onMouseEnter={(e) => { if (activeTab !== 'board') e.currentTarget.style.background = '#F8FAFC' }}
                      onMouseLeave={(e) => { if (activeTab !== 'board') e.currentTarget.style.background = 'transparent' }}
                    >
                      <PencilSimple size={16} weight={activeTab === 'board' ? "fill" : "bold"} />
                      Board <span style={{ opacity: 0.8, marginLeft: '4px', background: activeTab === 'board' ? 'white' : '#F1F5F9', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', color: '#6D28D9' }}>B</span>
                    </button>
                    <button 
                      onClick={() => {}} // Occlusion logic placeholder
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                        color: '#6D28D9',
                        border: '1px solid #DDD6FE', borderRadius: '12px',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(109, 40, 217, 0.08)'
                      }}
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.background = 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(109, 40, 217, 0.25)';
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.background = 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)';
                        e.currentTarget.style.color = '#6D28D9';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(109, 40, 217, 0.08)';
                      }}
                    >
                      <ClipboardText size={16} weight="bold" />
                      Occlusion <span style={{ opacity: 0.8, marginLeft: '4px', background: 'white', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', color: '#6D28D9' }}>O</span>
                    </button>
                    <div style={{ width: '1px', height: '24px', background: '#E2E8F0', margin: '0 4px' }} />
                    <button style={{ padding: '8px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowUp size={16} weight="bold" />
                    </button>
                    <button style={{ padding: '8px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowRight size={16} weight="bold" />
                    </button>
                  </motion.div>
                )}

                <MaterialRenderer 
                  key={selectedMaterial.id}
                  material={selectedMaterial} 
                  activeTab={activeTab}
                  onSparkUpdate={updateSpark}
                  setViewportData={(data) => {
                    setViewportData(data);
                    if (data.currentPage) updatePresence({ currentPage: data.currentPage });
                  }}
                  onScrollUpdate={handleScrollUpdate}
                  onMaterialUpdate={(m) => setSelectedMaterial(m)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Resizer Handle */}
        {!isSidePanelCollapsed && !focusMode && !isMobile && (
          <div
            onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'col-resize'; }}
            style={{
              width: '4px',
              cursor: 'col-resize',
              background: 'transparent',
              transition: 'background 0.2s',
              zIndex: 30,
              position: 'relative',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(109,40,217,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          />
        )}

        {/* Right Zone - Side Panel */}
        {!isSidePanelCollapsed && !focusMode && (
          <aside 
            id="tour-ai-chat" 
            style={{
              display: isMobile ? (activeTab === 'chat' ? 'flex' : 'none') : 'flex',
              width: isMobile ? '100%' : `${panelWidth}px`,
              borderLeft: '1px solid #EBEBEB',
              background: '#FAFAFA',
              flexDirection: 'column',
              zIndex: 10,
              position: isMobile ? 'fixed' : 'relative',
              top: isMobile ? '60px' : '0',
              height: isMobile ? 'calc(100dvh - 132px)' : '100%',
              boxShadow: '-2px 0 12px rgba(0,0,0,0.03)',
              flexShrink: 0
            }}
          >

            {/* Drag handle */}
            {!isMobile && (
              <div
                onMouseDown={() => { isResizing.current = true }}
                style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                  cursor: 'col-resize', zIndex: 20,
                  background: 'transparent',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(109,40,217,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              />
            )}

            {/* Tabs row */}
            <div style={{
              padding: '0 20px',
              borderBottom: '1px solid #EBEBEB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FAFAFA',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {[
                  { id: 'chat',       label: 'Chat',    emoji: '💬' },
                  { id: 'write',      label: 'Notes',   emoji: '✏️' },
                  { id: 'flashcards', label: 'Cards',   emoji: '🃏' },
                  { id: 'groupchat',  label: 'Group 💬', emoji: '👥' },
                  { id: 'group',      label: 'Hub',     emoji: '🖥️' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSideTab(tab.id)}
                    style={{
                      padding: '14px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeSideTab === tab.id ? '2px solid #6D28D9' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: activeSideTab === tab.id ? 700 : 500,
                      color: activeSideTab === tab.id ? '#6D28D9' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'var(--font-outfit)',
                      transition: 'all 0.18s',
                      marginBottom: '-1px'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{tab.emoji}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSidePanelCollapsed(true)}
                style={{
                  background: 'none', border: 'none', borderRadius: '8px', padding: '6px',
                  cursor: 'pointer', color: '#CBD5E1', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', transition: '0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FFF1F2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.background = 'none'; }}
              >
                <X size={15} weight="bold" />
              </button>
            </div>

            {/* Panel content */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {activeSideTab === 'write' ? (
                <WorkstationWrite
                  initialContent={userJottings}
                  onSave={handleSaveNote}
                  material={selectedMaterial}
                  user={user}
                />
              ) : activeSideTab === 'flashcards' ? (
                <div style={{ flex: 1, overflowY: 'auto', background: '#F9FAFB', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #EBEBEB', background: 'white', display: 'flex', justifyContent: 'center' }}>
                    <button 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
                        fontSize: '13px', fontWeight: 800, borderRadius: '12px', 
                        border: 'none', background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)', color: 'white', 
                        cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(109, 40, 217, 0.3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(109, 40, 217, 0.2)'; }}
                    >
                      <GraduationCap size={18} weight="fill" /> Open Study Deck
                    </button>
                  </div>
                  <WorkstationFlashcards
                    flashcards={currentAnalysis.flashcards}
                    material={selectedMaterial}
                    user={user}
                    onRegenerate={() => runAnalysis('flashcards')}
                  />
                </div>
              ) : activeSideTab === 'groupchat' ? (
                // ── Group Chat (Liveblocks-backed) ──────────────────────────
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {groupMessages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                        <ChatsCircleIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontSize: '13px', fontWeight: 600 }}>No messages yet</p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>Start the group conversation!</p>
                      </div>
                    ) : (
                      groupMessages.map((msg) => {
                        const isSelf = msg.userId === user?.id
                        return (
                          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start', gap: '3px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', paddingLeft: '4px', paddingRight: '4px' }}>
                              {isSelf ? 'You' : msg.userName}
                            </span>
                            <div style={{
                              maxWidth: '85%', padding: '9px 13px', borderRadius: isSelf ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              background: isSelf ? '#6D28D9' : 'white',
                              color: isSelf ? 'white' : '#1E293B',
                              fontSize: '13px', fontWeight: 500, lineHeight: 1.5,
                              border: isSelf ? 'none' : '1px solid #EBEBEB',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                            }}>
                              {msg.text}
                            </div>
                            <span style={{ fontSize: '10px', color: '#CBD5E1', paddingLeft: '4px', paddingRight: '4px' }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                  {/* Who's typing */}
                  {others.some(o => o.presence?.isTyping) && (
                    <div style={{ padding: '4px 20px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                      Someone is typing…
                    </div>
                  )}
                  {/* Input */}
                  <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #F1F5F9', background: '#FAFAFA', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '20px', padding: '6px 12px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                      <input
                        type="text"
                        placeholder="Message the group…"
                        value={groupInput}
                        onChange={(e) => { setGroupInput(e.target.value); setTyping(true); }}
                        onBlur={() => setTyping(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && groupInput.trim()) {
                            sendGroupMessage(groupInput)
                            setGroupInput('')
                            setTyping(false)
                          }
                        }}
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#1E293B', background: 'transparent', fontFamily: 'var(--font-outfit)', fontWeight: 500 }}
                      />
                      <button
                        onClick={() => { if (groupInput.trim()) { sendGroupMessage(groupInput); setGroupInput(''); setTyping(false); } }}
                        disabled={!groupInput.trim()}
                        style={{ background: groupInput.trim() ? '#6D28D9' : '#E2E8F0', color: groupInput.trim() ? 'white' : '#94A3B8', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: groupInput.trim() ? 'pointer' : 'default', transition: '0.2s', flexShrink: 0 }}
                      >
                        <PaperPlaneIcon size={14} weight="fill" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeSideTab === 'group' ? (
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                   <div style={{ padding: '16px 20px', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: 0, fontFamily: 'var(--font-outfit)' }}>Group Hub</h3>
                        <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, margin: '2px 0 0' }}>Collaborative board & session sync</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <LiveReactionBar userId={user?.id} userName={profile?.full_name || user?.email?.split('@')[0] || 'You'} />
                        <SyncControl 
                          isPresenter={presenterId === user?.id} 
                          syncEnabled={syncMode} 
                          onToggleSync={() => setSyncMode(!syncMode)} 
                        />
                        <button
                          onClick={() => window.open(`/board/${roomId}?name=${encodeURIComponent(selectedMaterial?.name || 'Board')}`, '_blank')}
                          title="Open full-screen board"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: '8px', border: 'none',
                            background: '#F1F5F9', color: '#64748B',
                            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#6D28D9'; e.currentTarget.style.color = 'white' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B' }}
                        >
                          <ArrowSquareOutIcon size={16} weight="bold" />
                        </button>
                      </div>
                   </div>
                   <div style={{ flex: 1, minHeight: '400px', background: '#F8FAFC', position: 'relative', margin: '0 16px 16px', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Whiteboard isCollaborative={true} roomId={roomId} />
                      </div>
                      <div style={{ padding: '16px', borderTop: '1px solid #E2E8F0', background: 'white' }}>
                        <GroupQuiz 
                          materialText={selectedMaterial?.extracted_text} 
                          isPresenter={presenterId === user?.id} 
                        />
                      </div>
                   </div>
                   <div style={{ padding: '20px', background: '#FAFAFA', borderTop: '1px solid #EBEBEB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>Active Participants</h4>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#6D28D9', background: '#F5F3FF', padding: '2px 8px', borderRadius: '10px' }}>{others.length + 1} ONLINE</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                         <ParticipantRow user={user} isSelf isPresenter={presenterId === user?.id} connectionId={self?.connectionId ?? 0} />
                         {others.map(({ connectionId, presence, info }) => (
                            <ParticipantRow 
                              key={connectionId} 
                              user={info} 
                              presence={presence} 
                              connectionId={connectionId}
                              isPresenter={connectionId === presenterId} 
                            />
                         ))}
                      </div>
                   </div>
                 </div>
               ) : (
                // Chat tab
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {activePanelContext === 'explanation' && activeExplanation ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ padding: '24px', flex: 1 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <button
                          onClick={() => setActivePanelContext('default')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                        >
                          <CaretLeft size={18} weight="bold" />
                        </button>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: 0, fontFamily: 'var(--font-outfit)' }}>Explanation</h3>
                      </div>
                      <div style={{ background: '#F5F3FF', padding: '20px', borderRadius: '20px', border: '1px solid rgba(109, 40, 217, 0.1)' }}>
                        <p style={{ fontSize: '15px', color: '#1E293B', lineHeight: '1.6', margin: 0 }}>{activeExplanation}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* Chat messages — scrollable */}
                      <div className="ws-chat-messages" style={{ flex: 1 }}>
                        {messages.length === 0 ? (
                          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: '8px' }}>
                            {/* Empty state chip prompts */}
                            <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500, marginBottom: '8px', fontFamily: 'var(--font-outfit)' }}>Ask me anything about this material</p>
                            {SUGGESTED_QUESTIONS.map((q, idx) => (
                              <motion.button
                                key={q.id}
                                initial={{ x: -8, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.06 * idx }}
                                onClick={() => handleSend(q.text)}
                                style={{
                                  width: '100%', background: 'white', border: '1px solid #EBEBEB',
                                  borderRadius: '12px', padding: '12px 16px', textAlign: 'left',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.18s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6D28D9'; e.currentTarget.style.background = '#F8F5FF'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = 'white'; }}
                              >
                                <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600, fontFamily: 'var(--font-outfit)' }}>{q.text}</span>
                                <ArrowSquareOutIcon size={14} color="#6D28D9" weight="bold" />
                              </motion.button>
                            ))}
                          </div>
                        ) : (
                          <div className="ws-chat-scroll" style={{ padding: '20px' }}>
                            {messages.map((msg, i) => {
                              const isUser = msg.role === 'user'
                              const [mainPart, suggestionPart] = msg.content.split('---SUGGESTIONS---')
                              const suggestions = suggestionPart ? suggestionPart.split('|').map(s => s.trim()).filter(Boolean) : []
                              return (
                                <div key={i} style={{ marginBottom: '32px', display: 'flex', gap: '12px', animation: 'fadeUp 0.3s ease-out' }}>
                                  <div style={{
                                    width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, marginTop: '3px',
                                    background: isUser ? '#F1F5F9' : '#EDE9FE',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isUser ? '#64748B' : '#6D28D9'
                                  }}>
                                    {isUser ? <UserIcon size={16} weight="bold" /> : <Sparkle size={16} weight="fill" />}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: isUser ? '#94A3B8' : '#6D28D9', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-outfit)' }}>
                                      {isUser ? 'You' : 'Luter AI'}
                                    </div>
                                    <div className="ws-plain-message" style={{ fontSize: '14px', color: '#1E293B', lineHeight: '1.65', fontFamily: 'var(--font-outfit)' }}>
                                      {isUser ? (
                                        <p style={{ margin: 0, fontWeight: 500 }}>{msg.content}</p>
                                      ) : (
                                        <div style={{ width: '100%' }}>
                                          <div className="ws-ai-message-content">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                              h1: ({ children }) => <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', color: '#1E293B', marginTop: '8px' }}>{children}</h3>,
                                              h2: ({ children }) => <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#1E293B', marginTop: '8px' }}>{children}</h3>,
                                              p: ({ children }) => <p style={{ marginBottom: '10px', margin: '0 0 10px 0' }}>{children}</p>,
                                              li: ({ children }) => <li style={{ marginBottom: '6px' }}>{children}</li>,
                                              code: ({ children }) => <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 5px', borderRadius: '4px', fontSize: '13px' }}>{children}</code>
                                            }}>{mainPart}</ReactMarkdown>
                                          </div>
                                          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', opacity: 0.55 }}>
                                            <button style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, background: 'none', border: 'none', color: '#64748B' }}>
                                              <ThumbsUp size={12} /> Helpful
                                            </button>
                                            <button style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, background: 'none', border: 'none', color: '#64748B' }}>
                                              <CopySimple size={12} /> Copy
                                            </button>
                                          </div>
                                          {suggestions.length > 0 && (
                                            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
                                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6D28D9', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Next Steps</div>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {suggestions.map((s, idx) => (
                                                  <button key={idx} onClick={() => handleSend(s)} style={{ width: '100%', background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', padding: '10px 12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'all 0.18s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.borderColor = '#6D28D9'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)'; }}>
                                                    <span style={{ fontSize: '12px', color: '#1E293B', fontWeight: 500 }}>{s}</span>
                                                    <ArrowSquareOutIcon size={13} color="#6D28D9" />
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'white', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                <Typing dots={3} className="text-[var(--primary)]" />
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </div>

                      {/* 3 chip prompts */}
                      <div style={{ padding: '12px 16px 8px', display: 'flex', gap: '6px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', background: '#FAFAFA' }}>
                        {[
                          { text: 'Summarize', prompt: 'Summarize the core concepts' },
                          { text: 'Explain', prompt: "Explain this like I'm a student" },
                          { text: 'Quick Quiz', prompt: 'Generate a quick practice quiz' },
                        ].map(chip => (
                          <button
                            key={chip.text}
                            onClick={() => handleSend(chip.prompt)}
                            style={{
                              padding: '5px 12px', borderRadius: '20px', border: '1px solid #E2E8F0',
                              background: 'white', fontSize: '12px', fontWeight: 600,
                              color: '#475569', cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                              transition: 'all 0.15s', whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6D28D9'; e.currentTarget.style.color = '#6D28D9'; e.currentTarget.style.background = '#F5F3FF'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'white'; }}
                          >
                            {chip.text}
                          </button>
                        ))}
                      </div>

                      {/* Input area — pinned bottom */}
                      <div style={{ padding: '10px 16px 18px', background: '#FAFAFA', flexShrink: 0 }}>
                        <div
                          style={{
                            background: 'white',
                            border: '1.5px solid #E2E8F0',
                            borderRadius: '28px',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            transition: 'all 0.25s'
                          }}
                          onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#6D28D9'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(109,40,217,0.12)'; }}
                          onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                        >
                          <button style={{ color: '#CBD5E1', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s', flexShrink: 0 }} onMouseEnter={(e) => e.currentTarget.style.color = '#6D28D9'} onMouseLeave={(e) => e.currentTarget.style.color = '#CBD5E1'}>
                            <Microphone size={18} weight="bold" />
                          </button>
                          <input
                            type="text"
                            placeholder="Ask Luter anything..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isProcessingLoading}
                            style={{
                              flex: 1, border: 'none', background: 'transparent', outline: 'none',
                              fontSize: '13px', color: '#1E293B', fontFamily: 'var(--font-outfit)',
                              padding: '4px 0', fontWeight: 500
                            }}
                          />
                          <button
                            onClick={() => handleSend()}
                            disabled={isProcessingLoading || !chatInput.trim()}
                            style={{
                              background: chatInput.trim() ? '#6D28D9' : '#E2E8F0',
                              color: chatInput.trim() ? 'white' : '#94A3B8',
                              border: 'none', borderRadius: '50%', width: '34px', height: '34px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: chatInput.trim() ? 'pointer' : 'default', transition: 'all 0.2s',
                              flexShrink: 0
                            }}
                          >
                            <PaperPlaneRight size={16} weight="bold" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
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

      {/* Session Exit Summary Modal */}
      <AnimatePresence>
        {showExitSummary && (
          <div style={{ 
            position: 'fixed', inset: 0, zIndex: 1000, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{ 
                width: '100%', maxWidth: '440px', background: 'white', 
                borderRadius: '32px', overflow: 'hidden', padding: '40px',
                textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ 
                width: '80px', height: '80px', background: '#F5F3FF', 
                borderRadius: '24px', margin: '0 auto 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6D28D9'
              }}>
                <Sparkle size={40} weight="fill" />
              </div>
              
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '12px', fontFamily: 'var(--font-outfit)' }}>
                Amazing Study Session!
              </h2>
              <p style={{ color: '#64748B', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
                You've made great progress today. Your consistency is building your future.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>TIME STUDIED</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{formatTime(elapsedTime).replace(' elapsed', '')}</div>
                </div>
                <div style={{ padding: '20px', background: '#F5F3FF', borderRadius: '20px', border: '1px solid #E9D5FF' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#A78BFA', textTransform: 'uppercase', marginBottom: '4px' }}>XP EARNED</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#6D28D9' }}>+{sessionXP} XP</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={confirmExit}
                  style={{ 
                    width: '100%', padding: '16px', background: '#000', color: 'white', 
                    borderRadius: '16px', fontWeight: 700, border: 'none', cursor: 'pointer',
                    transition: '0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  End Session
                </button>
                <button 
                  onClick={() => setShowExitSummary(false)}
                  style={{ 
                    width: '100%', padding: '12px', background: 'none', color: '#64748B', 
                    borderRadius: '16px', fontWeight: 600, border: 'none', cursor: 'pointer'
                  }}
                >
                  Keep Studying
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SelectionActionBar onAction={handleSelectionAction} />
    </div>
  )
}

const ParticipantRow = ({ user, isSelf, isPresenter, presence, connectionId }) => {
  // user is a Supabase auth user when isSelf=true, or Liveblocks info object for others
  const name = isSelf
    ? (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You')
    : (user?.name || `Peer`);

  // Generate a stable colour from the name initial
  const COLOURS = ['#6D28D9', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const colorIdx = name.charCodeAt(0) % COLOURS.length;
  const color = COLOURS[colorIdx];

  const currentPage = isSelf ? 'Active' : (presence?.currentPage ? `Page ${presence.currentPage}` : 'Idle');

  // quizScores is serialized to a plain object by useStorage (LiveObject → plain obj)
  const quizScores = useStorage((root) => root.quizScores);
  const quizState  = useStorage((root) => root.quizState);
  const score      = quizScores?.[String(connectionId)] ?? 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'white', borderRadius: '10px', border: '1px solid #EBEBEB' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white', fontWeight: 700, flexShrink: 0 }}>
             {name.charAt(0).toUpperCase()}
          </div>
          <div>
             <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {name}
                {isPresenter && <Crown size={12} weight="fill" color="#6D28D9" />}
             </div>
             <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
               {quizState !== 'idle' ? `Score: ${score}` : (
                 <>
                   {currentPage}
                   {presence?.currentPage && (
                     <span style={{ padding: '2px 5px', background: '#F1F5F9', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: '#475569' }}>
                       PG {presence.currentPage}
                     </span>
                   )}
                 </>
               )}
             </div>
          </div>
       </div>
       {isPresenter && (
          <div style={{ padding: '4px 8px', background: '#F5F3FF', borderRadius: '6px', fontSize: '10px', fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase', flexShrink: 0 }}>
             Presenter
          </div>
       )}
    </div>
  );
};

export default function WorkstationPage() {
  const { materialId } = useParams()
  const { user, profile } = useOutletContext() || {}
  const [searchParams] = useSearchParams()
  const matId   = searchParams.get('materialId') || materialId
  const roomId  = matId ? `luter-material-${matId}` : `luter-empty-${user?.id || 'guest'}`

  return (
    <ReadingSpaceProvider>
      <CollaborationProvider
        roomId={roomId}
        initialPresence={{
          role: 'presenter', // Default to presenter so user can use whiteboard
          currentPage: 1,
          isTyping: false,
          status: 'active',
          cursor: null,
        }}
      >
        <WorkstationContent />
      </CollaborationProvider>
    </ReadingSpaceProvider>
  )
}
