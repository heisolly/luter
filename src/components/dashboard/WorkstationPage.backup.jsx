/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useOutletContext, useSearchParams, useLocation } from 'react-router-dom'
import {
  House,
  CaretLeft,
  CaretRight,
  CaretDown,
  CaretUp,
  FileText,
  FileDoc,
  FilePdf,
  FilePpt,
  Sparkle,
  Cards,
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
  MicrophoneSlash,
  SpeakerHigh,
  SpeakerSlash,
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
  Crown,
  GridFour,
  PenNib,
  ChatCircle,
  ChatCircleText,
  EyeSlash,
  PencilLine,
  Highlighter,
  PaintBrush,
  Timer,
  ArrowsOut,
  SignOut,
  ArrowsLeftRight,
  Trash,
  Copy,
  DownloadSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  FloppyDisk,
  ArrowUp,
  Pen,
  TextT,
  Function as PhosphorFunction,
  Eraser,
  ArrowsIn,
  CaretLineUp,
  CaretLineDown,
  Minus,
  Square
} from '@phosphor-icons/react'


import {
  RiBookOpenFill as BookOpen, RiStarFill as Star, RiFileTextFill as RiFileText, RiCheckboxCircleFill as CheckCircle, RiArrowRightSLine as RiCaretRight, RiArrowLeftLine as ArrowLeft, RiExternalLinkLine as ArrowSquareOut, RiStackFill as RiStack,
  RiQuestionFill as Question, RiAddLine as Plus, RiSearchLine as MagnifyingGlass, RiArrowLeftSLine as RiCaretLeft, RiBriefcaseFill as Briefcase, RiPlayCircleFill as PlayCircle, RiSettings4Fill as Settings, RiUserFill as User, RiLogoutBoxLine as RiSignOut,
  RiMore2Fill as DotsThreeVertical, RiLayoutMasonryFill as RiLayoutMasonry, RiBookmarkFill as Bookmark, RiFlashlightFill as Zap,
  RiErrorWarningFill as Warning, RiListCheck, RiShareFill as Share,
  RiGraduationCapFill as GraduationCap, RiShareForwardFill as RiShareNetwork, RiClipboardFill as RiClipboardText, RiUserSmileFill as Baby, RiCheckLine as Check,
  RiLightbulbFill as Lightbulb, RiRefreshLine as ArrowClockwise, RiArrowRightLine as RiArrowRight, RiHome4Fill as RiHouse, RiCheckboxFill as CheckSquare, RiMoreFill as DotsThreeOutline,
  RiStickyNoteFill as Note, RiBookFill as Book, RiStackFill as Library, RiLayoutColumnFill as Columns, RiFullscreenFill as CornersOut,
  RiThumbUpLine, RiThumbDownLine, RiFileCopyLine, RiArrowRightUpLine, RiMicLine, RiEyeOffLine, RiEyeLine
} from "react-icons/ri"
import { Typing } from '../ui/Typing'
import { Wave } from '../ui/Wave'
import { DotmSquare11 } from '../ui/dotm-square-11'
import { LuterPageLoader } from '../shared/LuterPageLoader'

import LuterLogo from '../shared/LuterLogo'
import { motion, AnimatePresence } from 'framer-motion'
import ShareSessionModal from './ShareSessionModal'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import { supabase } from '../../supabaseClient'
import { ReadingSpaceProvider, useReadingSpace } from './ReadingSpaceContext'
import { SelectionActionBar } from './WorkstationOverlays'
import MaterialRenderer from './MaterialRenderer'
import { WorkstationNotes, WorkstationSummary, WorkstationFlashcards, WorkstationQuiz, WorkstationWrite, WorkstationSummaryEnhanced } from './WorkstationTools'
import { AiChatPanel } from './NotesStudioPage'
import { saveToVault, fetchUserNotes, deleteUserNote } from '../../services/materialsService'
import { queryStudyMaterials, reprocessMaterial } from '../../services/langchainPipeline'
import { pollMaterialUntilReady } from '../../services/materialsService'
import { preloadingService } from '../../services/preloadingService'
import { useDeckStore } from '../../store/useDeckStore'
import { useSessionStore } from '../../store/useSessionStore'
import MaterialAnalysisService from '../../services/materialAnalysisService'
import { askDograhVoiceAgent } from '../../services/dograhVoiceAgent'
import { checkAndDeductCredits, CREDIT_COSTS, getCreditBalance } from '../../services/creditService'
import './workstation.css'
import { useHighlight } from '../../hooks/useHighlight.jsx'
import { useAnnotation } from '../../hooks/useAnnotation'
import AnnotationToolbar from './AnnotationToolbar'
import HighlightToolbox from './HighlightToolbox'
import katex from 'katex'
import 'katex/dist/katex.min.css'

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
  useSelf,
  useBroadcastEvent
} from '../../liveblocks.config'
import { Thread } from '@liveblocks/react-ui'
import { useAudioSession } from '../../hooks/useAudioSession'

const SUGGESTED_QUESTIONS = [
  { id: 'summary', text: "Summarize the core concepts" },
  { id: 'explain', text: "Explain this like I'm a student" },
  { id: 'analogy', text: "Give me an academic analogy" },
  { id: 'quiz', text: "Generate a quick practice quiz" },
]

const WS_COLORS = {
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',
  purpleBorder: '#DDD6FE',
  purpleHover: '#EDE9FE',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#111827',
  white: '#FFFFFF',
  red: '#EF4444',
}

const WORKSTATION_FONT_STACK = '"Helvetica Neue", Helvetica, Arial, sans-serif'

const ANNOTATION_TOOL_OPTIONS = [
  { id: 'draw', label: 'Draw', icon: Pen, shortcut: 'D' },
  { id: 'text', label: 'Text', icon: TextT, shortcut: 'T' },
  { id: 'arrow', label: 'Arrow', icon: ArrowUpRight, shortcut: 'A' },
  { id: 'line', label: 'Line', icon: Minus, shortcut: 'L' },
]

const ANNOTATION_COLOR_OPTIONS = ['#111827', '#7C3AED', '#EF4444', '#10B981', '#F59E0B']

const ANNOTATION_STROKE_OPTIONS = [4, 7, 10]

const BOTTOM_WORKSPACE_TOOLS = [
  {
    id: 'highlight',
    label: 'Highlight Tool',
    shortcut: 'H',
    icon: Highlighter,
    baseBg: '#FEF3C7',
    baseBorder: '#FDE68A',
    baseColor: '#D97706',
    activeBg: '#FDE68A',
    activeBorder: '#F59E0B',
    activeColor: '#92400E',
  },
  {
    id: 'board',
    label: 'Board Tool',
    shortcut: 'B',
    icon: PencilLine,
    baseBg: '#DBEAFE',
    baseBorder: '#BFDBFE',
    baseColor: '#2563EB',
    activeBg: '#BFDBFE',
    activeBorder: '#60A5FA',
    activeColor: '#1D4ED8',
  },
  {
    id: 'annotate',
    label: 'Annotate Tool',
    shortcut: 'A',
    icon: PencilSimple,
    baseBg: '#F5F3FF',
    baseBorder: '#DDD6FE',
    baseColor: '#7C3AED',
    activeBg: '#EDE9FE',
    activeBorder: '#A78BFA',
    activeColor: '#6D28D9',
  },
]

const truncateLabel = (value = '', max = 22) => (
  value.length > max ? `${value.slice(0, max - 3)}...` : value
)

const getMaterialChipMeta = (material) => {
  const type = (material?.type || '').toLowerCase()
  if (type.includes('pdf')) return { Icon: FilePdf, color: WS_COLORS.purple, labelColor: '#6D28D9' }
  if (type.includes('doc')) return { Icon: FileDoc, color: WS_COLORS.purple, labelColor: '#6D28D9' }
  return { Icon: FilePpt, color: WS_COLORS.purple, labelColor: '#6D28D9' }
}

function WorkstationContent() {
  const { t } = useTranslation(['workspace'])
  const navigate = useNavigate()
  const location = useLocation()
  const { courseId, materialId: materialIdParam2 } = useParams()
  const [searchParams] = useSearchParams()
  const materialIdParam = searchParams.get('materialId') || materialIdParam2
  const [courseInfo, setCourseInfo] = useState(null)
  const [sessionMaterials, setSessionMaterials] = useState([])
  const { user, isMobile, sidebarCollapsed, setSidebarCollapsed, profile, mobileSidebarOpen, setMobileSidebarOpen } = useOutletContext() || {}
  const { setViewportData, highlightText, updateSpark, clearHighlights, viewportData, updateSelection, isSidePanelCollapsed, setSidePanelCollapsed } = useReadingSpace()

  const sessionIdParam = searchParams.get('sessionId')
  const shareCodeParam = searchParams.get('share')
  const groupIdParam = searchParams.get('groupId')
  const sessionType = searchParams.get('sessionType') || searchParams.get('mode') || (groupIdParam || sessionIdParam ? 'group' : 'solo')
  const currentUserRole = profile?.role === 'teacher' || searchParams.get('role') === 'teacher' || sessionType === 'teacher'
    ? 'teacher'
    : (sessionType === 'solo' ? 'peer' : 'student')

  // Collaboration Room ID
  const roomId = useMemo(() => {
    if (sessionIdParam) return `luter-session-${sessionIdParam}`
    if (shareCodeParam) return `luter-share-${shareCodeParam}`
    if (groupIdParam) return `luter-group-${groupIdParam}`
    if (materialIdParam) return `luter-material-v2-${materialIdParam}`
    return `luter-empty-${user?.id || 'guest'}`
  }, [sessionIdParam, shareCodeParam, groupIdParam, materialIdParam, user?.id])

  const handleScrollUpdate = useCallback((data) => {
    if (data && setViewportData) setViewportData(data)
  }, [setViewportData])

  const handleSelectionAction = async (actionId, text) => {
    if (actionId === 'highlight') {
      window.dispatchEvent(new CustomEvent('luter-highlight-selection'))
      return 'Highlighted selection'
    }

    if (actionId === 'send_to_ai') {
      setActivePanelContext('default')
      setActiveSideTab('chat')
      if (isSidePanelCollapsed) setSidePanelCollapsed(false)
      await handleSend(`Use this selected text as the focus and help me study it:\n\n"${text}"`)
      return 'Sent to chat'
    }

    if (actionId === 'comment') {
      setActiveStudyTool('comment')
      window.dispatchEvent(new CustomEvent('luter-open-comment-popover'))
      return 'Comment mode ready'
    }

    if (actionId === 'copy') {
      await navigator.clipboard?.writeText?.(text)
      return 'Copied'
    }

    if (actionId === 'quiz') {
      setActiveTab('quiz')
      setActiveSideTab('chat')
      await handleSend(`Generate a quick study quiz from this selected text:\n\n"${text}"`)
      return 'Quiz generated'
    }

    if (actionId === 'explain' || actionId === 'summarize') {
      setActivePanelContext('explanation')
      setActiveExplanation(actionId === 'explain' ? "Analyzing and explaining..." : "Summarizing selection...")
      setActiveSideTab('chat')
      if (isSidePanelCollapsed) setSidePanelCollapsed(false)

      try {
        // Credit check
        const cost = CREDIT_COSTS.EXPLAIN_TEXT
        const { ok } = await checkAndDeductCredits(user?.id, cost, profile?.is_premium)
        if (!ok) {
          setActiveExplanation("You've used up your AI credits for today. They reset daily — come back tomorrow or upgrade to Pro for more!")
          return
        }
        setCreditsBalance(prev => typeof prev === 'number' ? prev - cost : prev)

        const prompt = actionId === 'explain'
          ? `Explain this concept clearly for a student: "${text}"`
          : `Provide a concise, high-impact summary of this section: "${text}"`

        const response = await callGroqAPI(
          [{ role: 'user', content: prompt }],
          GROQ_MODELS.PROFESSOR,
          { systemPromptOverride: GROQ_PROMPTS.TUTOR }
        )
        setActiveExplanation(response)
        return response
      } catch (err) {
        setActiveExplanation("Failed to generate response. Please try again.")
        return "Failed to generate response. Please try again."
      }
    } else if (actionId === 'save_note' || actionId === 'save') {
      const newNote = `> ${text}\n\n`
      setUserJottings(prev => prev + newNote)
      setActiveSideTab('write')
      if (isSidePanelCollapsed) setSidePanelCollapsed(false)
      return 'Saved to notes'
    } else if (actionId === 'flashcard') {
      setActiveSideTab('flashcards')
      if (isSidePanelCollapsed) setSidePanelCollapsed(false)
      return 'Opened flashcards'
    }

    return null
  }

  const handlePageJump = useCallback((page) => {
    window.dispatchEvent(new CustomEvent('luter-jump-to-page', { detail: { page } }))
  }, [])

  const handleExit = () => {
    const xpEarned = Math.floor(elapsedTime / 10)
    setSessionXP(xpEarned)
    setShowExitSummary(true)
  }

  const confirmExit = () => {
    navigate(-1)
  }

  const [activeTab, setActiveTab] = useState(() => searchParams.get('tool') === 'quiz' ? 'quiz' : 'content')
  const [activeSideTab, setActiveSideTab] = useState('chat')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareTargetSession, setShareTargetSession] = useState(null)
  const [isPreparingShare, setIsPreparingShare] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState(sessionIdParam || null)
  const [creditsBalance, setCreditsBalance] = useState(Infinity)
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem('luter-panel-width') || localStorage.getItem('ws-panel-width')
    return saved ? parseInt(saved, 10) : 360
  })
  const [isResizeHovered, setIsResizeHovered] = useState(false)
  const [isResizeActive, setIsResizeActive] = useState(false)
  const isResizing = useRef(false)
  const createStudyRoomSession = useSessionStore((state) => state.createSession)

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
  const [showMobileTools, setShowMobileTools] = useState(false)
  const [activeStudyTool, setActiveStudyTool] = useState('none')
  const activeBottomTool = activeStudyTool === 'cover' ? 'focus' : activeStudyTool
  const activeWorkspaceTool = activeTab === 'board'
    ? 'board'
    : (activeBottomTool === 'highlight' || activeBottomTool === 'annotate' ? activeBottomTool : null)

  const handleWorkspaceToolSelect = (toolId) => {
    if (toolId === 'board') {
      setActiveTab('board')
      return
    }

    if (activeTab === 'board') setActiveTab('content')
    setActiveStudyTool(activeStudyTool === toolId ? 'none' : toolId)
  }
  const [selectedThread, setSelectedThread] = useState(null)
  const [activeRun, setActiveRun] = useState(null)
  const [voiceState, setVoiceState] = useState('idle')
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [voiceResponse, setVoiceResponse] = useState('')
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [selectedVoiceTone, setSelectedVoiceTone] = useState('Natural')
  const [showEquationModal, setShowEquationModal] = useState(false)
  const [equationInput, setEquationInput] = useState('\\frac{a}{b}')
  const [pendingEquation, setPendingEquation] = useState('')

  const audioRoomId = activeSessionId || sessionIdParam || groupIdParam || shareCodeParam || null
  const audioRoomName = activeSessionId || sessionIdParam
    ? `luter-session-${activeSessionId || sessionIdParam}`
    : shareCodeParam
      ? `luter-share-${shareCodeParam.toLowerCase()}`
      : groupIdParam
        ? `luter-group-${groupIdParam}`
        : null
  const audioUserName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest'
  const audioSession = useAudioSession(audioRoomName, {
    userId: user?.id,
    userName: audioUserName,
  })

  const recognitionRef = useRef(null)
  const voiceFinalTranscriptRef = useRef('')

  const scrollContainerRef = useRef(null)

  const {
    toolbox: highlightToolbox,
    setToolbox: setHighlightToolbox,
    highlights,
    selectedColor: selectedHighlightColor,
    setSelectedColor: setSelectedHighlightColor,
    COLORS: HIGHLIGHT_COLORS,
    applyHighlight,
    deleteHighlight,
    loadHighlights,
  } = useHighlight({
    fileId: selectedMaterial?.id,
    userId: user?.id,
    isActive: activeStudyTool === 'highlight',
    containerRef: scrollContainerRef,
  });

  const {
    canvasRefs,
    initCanvas,
    startDrawing,
    draw,
    stopDrawing,
    clearPage,
    drawMode,
    setDrawMode,
    strokeColor: annotationColor,
    setStrokeColor: setAnnotationColor,
    strokeSize: annotationStrokeSize,
    setStrokeSize: setAnnotationStrokeSize,
    showAnnotationBar,
    ANNOTATION_COLORS,
    STROKE_SIZES,
  } = useAnnotation({
    fileId: selectedMaterial?.id,
    userId: user?.id,
    isActive: activeStudyTool === 'annotate',
    currentPage: viewportData?.currentPage || 1,
    totalPages: viewportData?.totalPages || 1,
  });

  // Load highlights when material or user changes
  useEffect(() => {
    if (selectedMaterial?.id && user?.id) {
      loadHighlights();
    }
  }, [selectedMaterial?.id, user?.id, loadHighlights]);



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
  const syncState       = useStorage((root) => root.syncState)
  const raisedHands     = useStorage((root) => root.raisedHands) || {}
  const broadcast       = useBroadcastEvent()

  // Group chat
  const { messages: groupMessages, sendMessage: sendGroupMessage, setTyping } = useGroupChat(user)
  const [groupInput, setGroupInput] = useState('')
  const appendGroupMessage = useMutation(({ storage }, message) => {
    const list = storage.get('messages')
    list?.push?.(message)
  }, [])
  const removeGroupMessage = useMutation(({ storage }, messageId) => {
    const list = storage.get('messages')
    if (!list?.get || !list?.delete) return
    for (let index = 0; index < list.length; index += 1) {
      if (list.get(index)?.id === messageId) {
        list.delete(index)
        return
      }
    }
  }, [])

  // Broadcast events
  const { broadcastSyncJump } = useLiveBroadcast()

  const sendGroupMessageWithAI = async (text) => {
    if (!text?.trim()) return
    sendGroupMessage(text)
    setGroupInput('')
    setTyping(false)

    if (!text.toLowerCase().includes('@luter')) return

    if (!profile?.is_premium && user?.id) {
      const { ok } = await checkAndDeductCredits(user.id, CREDIT_COSTS.AI_CHAT, false)
      if (!ok) {
        appendGroupMessage({
          id: `ai-error-${Date.now()}`,
          userId: 'luter-ai',
          userName: 'Luter AI',
          userColor: '#7C3AED',
          text: "You've used up your AI credits for today.",
          isAI: true,
          timestamp: Date.now(),
        })
        return
      }
    }

    const typingId = `ai-typing-${Date.now()}`
    appendGroupMessage({
      id: typingId,
      userId: 'luter-ai',
      userName: 'Luter AI',
      userColor: '#7C3AED',
      text: '...',
      isAI: true,
      isTyping: true,
      timestamp: Date.now(),
    })

    try {
      const question = text.replace(/@luter/ig, '').trim()
      const prompt = `Question: ${question}\n\nCurrent material: ${selectedMaterial?.title || 'Study material'}\nCurrent page: ${viewportData?.currentPage || 1}\nSession: ${sessionType}\nContext:\n${(selectedMaterial?.extracted_text || '').slice(0, 5000)}`
      const response = await callGroqAPI(
        [{ role: 'user', content: prompt }],
        GROQ_MODELS.SPEEDSTER,
        { systemPromptOverride: 'You are Luter AI in a live group study chat. Answer clearly and concisely.' }
      )
      const aiResponse = response?.choices?.[0]?.message?.content || 'I could not generate a response right now.'
      removeGroupMessage(typingId)
      appendGroupMessage({
        id: `ai-${Date.now()}`,
        userId: 'luter-ai',
        userName: 'Luter AI',
        userColor: '#7C3AED',
        text: aiResponse,
        isAI: true,
        timestamp: Date.now(),
      })
      broadcast({ type: 'AI_RESPONSE', question: text, response: aiResponse, timestamp: Date.now() })
    } catch (error) {
      removeGroupMessage(typingId)
      appendGroupMessage({
        id: `ai-error-${Date.now()}`,
        userId: 'luter-ai',
        userName: 'Luter AI',
        userColor: '#7C3AED',
        text: 'I hit an error while answering. Try again in a moment.',
        isAI: true,
        timestamp: Date.now(),
      })
    }
  }

  const processVoiceQuestion = async (question) => {
    const cleanQuestion = question?.trim()
    if (!cleanQuestion || !selectedMaterial) {
      setVoiceState('idle')
      return
    }

    const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.VOICE_AGENT, profile?.is_premium)
    if (!ok) { setVoiceState('idle'); return }

    setVoiceState('processing')
    setMessages((prev) => [...prev, { role: 'user', content: cleanQuestion }])

    try {
      const answer = await askDograhVoiceAgent({
        question: cleanQuestion,
        fileName: selectedMaterial.title,
        currentPage: viewportData?.currentPage || 1,
        totalPages: viewportData?.totalPages,
        materialContext: (selectedMaterial.extracted_text || '').slice(0, 5000),
      })
      const responseText = answer || 'I could not answer that right now.'
      setVoiceResponse(responseText)
      setMessages((prev) => [...prev, { role: 'ai', content: responseText }])

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(responseText)
        const toneSettings = {
          'Natural': { rate: 1.0, pitch: 1.0 },
          'Clear': { rate: 0.85, pitch: 1.1 },
          'Warm': { rate: 0.9, pitch: 0.85 },
          'Calm': { rate: 0.75, pitch: 0.9 },
        }
        const settings = toneSettings[selectedVoiceTone] || toneSettings['Natural']
        utterance.rate = settings.rate
        utterance.pitch = settings.pitch
        utterance.onend = () => setVoiceState('idle')
        utterance.onerror = () => setVoiceState('idle')
        setVoiceState('speaking')
        window.speechSynthesis.speak(utterance)
      } else {
        setVoiceState('idle')
      }
    } catch (error) {
      console.error('Voice agent error:', error)
      setVoiceResponse('Voice agent error. Try again.')
      setVoiceState('idle')
    }
  }

  const startVoiceListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setShowVoiceModal(true)
      setVoiceResponse('Voice input is not supported in this browser.')
      return
    }
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(t => t.stop())
      } catch {
        setShowVoiceModal(true)
        setVoiceResponse('Microphone access denied. Please allow microphone permissions in your browser settings.')
        return
      }
    }

    setShowVoiceModal(true)
    window.speechSynthesis?.cancel()
    voiceFinalTranscriptRef.current = ''
    setVoiceTranscript('')
    setVoiceResponse('')
    setVoiceState('listening')

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      let interim = ''
      let finalText = voiceFinalTranscriptRef.current
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript
        if (event.results[index].isFinal) finalText += ` ${text}`
        else interim += text
      }
      voiceFinalTranscriptRef.current = finalText.trim()
      setVoiceTranscript(`${voiceFinalTranscriptRef.current} ${interim}`.trim())
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setVoiceState('idle')
    }

    recognition.onend = () => {
      recognitionRef.current = null
      const finalText = voiceFinalTranscriptRef.current || voiceTranscript
      if (finalText?.trim()) processVoiceQuestion(finalText)
      else setVoiceState('idle')
    }

    recognition.start()
  }

  const stopVoiceListening = () => {
    if (voiceState === 'speaking') {
      window.speechSynthesis?.cancel()
      setVoiceState('idle')
      return
    }
    if (recognitionRef.current) recognitionRef.current.stop()
    else setVoiceState('idle')
  }

  const closeVoiceModal = () => {
    recognitionRef.current?.stop?.()
    window.speechSynthesis?.cancel()
    setVoiceState('idle')
    setShowVoiceModal(false)
    setShowVoiceSettings(false)
  }

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

  const setSyncState = useMutation(({ storage }, enabled, slide) => {
    const state = storage.get('syncState')
    state?.set?.('isSynced', enabled)
    state?.set?.('leaderId', enabled ? user?.id : null)
    state?.set?.('currentSlide', slide || viewportData?.currentPage || 1)
    storage.set('syncMode', enabled)
    storage.set('presenterId', enabled ? user?.id : null)
  }, [user?.id, viewportData?.currentPage])

  const setRaisedHand = useMutation(({ storage }, raised) => {
    const hands = storage.get('raisedHands')
    if (!hands?.set || !hands?.delete || !user?.id) return
    if (raised) {
      hands.set(user.id, {
        userId: user.id,
        userName: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
        raisedAt: Date.now(),
      })
    } else {
      hands.delete(user.id)
    }
  }, [user, profile?.full_name])

  const pushQuizToGroup = useMutation(({ storage }) => {
    const quiz = storage.get('quiz')
    quiz?.set?.('status', 'active')
    quiz?.set?.('question', 'Quick check from this material')
    quiz?.set?.('options', ['A', 'B', 'C', 'D'])
    quiz?.set?.('startedAt', Date.now())
  }, [])

  // Broadcast presence + sync slide
  const lastPresenceRef = useRef({ currentPage: null, activeStudyTool: null, syncMode: null, presenterId: null })
  
  useEffect(() => {
    const currentPage = viewportData?.currentPage
    const tool = activeStudyTool === 'cover' ? 'focus' : activeStudyTool
    
    if (currentPage && (
      lastPresenceRef.current.currentPage !== currentPage || 
      lastPresenceRef.current.activeStudyTool !== tool ||
      lastPresenceRef.current.syncMode !== syncMode ||
      lastPresenceRef.current.presenterId !== presenterId
    )) {
      lastPresenceRef.current = { currentPage, activeStudyTool: tool, syncMode, presenterId }
      
      updatePresence({
        currentPage,
        currentSlide: Math.max(0, currentPage - 1),
        currentTool: tool,
        user: {
          id: user?.id || 'guest',
          name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You',
          avatar: user?.user_metadata?.avatar_url || null,
          color: user?.user_metadata?.color || '#7C3AED',
          role: currentUserRole,
        },
      })
      
      if (syncMode && presenterId === user?.id) {
        setPresenterSlide(currentPage)
        broadcastSyncJump(currentPage)
      }
    }
  }, [viewportData?.currentPage, syncMode, presenterId, user?.id, currentUserRole, activeStudyTool, updatePresence, setPresenterSlide, broadcastSyncJump])
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

  useEffect(() => {
    const isTextInput = (target) => ['INPUT', 'TEXTAREA'].includes(target?.tagName) || target?.isContentEditable
    const handleKeyDown = (event) => {
      if (isTextInput(event.target)) return
      const key = event.key.toLowerCase()
      if (key === 'a') setActiveStudyTool((tool) => tool === 'annotate' ? 'none' : 'annotate')
      if (key === 'c') setActiveStudyTool((tool) => tool === 'comment' ? 'none' : 'comment')
      if (key === 'v') setActiveStudyTool((tool) => tool === 'cover' ? 'none' : 'cover')
      if (event.code === 'Space' && voiceState === 'idle') {
        event.preventDefault()
        startVoiceListening()
      }
    }
    const handleKeyUp = (event) => {
      if (isTextInput(event.target)) return
      if (event.code === 'Space' && voiceState === 'listening') {
        event.preventDefault()
        stopVoiceListening()
      }
    }
    const handleVisibilityChange = () => {
      if (document.hidden && voiceState === 'speaking') {
        window.speechSynthesis?.cancel()
        setVoiceState('idle')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [voiceState, selectedMaterial, viewportData?.currentPage])

  const currentAnalysis = React.useMemo(() => {
    if (!selectedMaterial) return {}
    const cached = analysisCache[selectedMaterial.id] || {}
    return {
      summary: cached.summary || materialAnalysis?.summary || null,
      flashcards: cached.flashcards || materialAnalysis?.flashcards || [],
      quiz: cached.quiz || materialAnalysis?.quiz || [],
      notes: cached.notes || materialAnalysis?.smart_notes || null,
      page_summaries: cached.page_summaries || materialAnalysis?.page_summaries || materialAnalysis?.analysis?.page_summaries || {}
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
    let frameId = null

    const syncSelection = (event) => {
      if (frameId) cancelAnimationFrame(frameId)

      frameId = requestAnimationFrame(() => {
        const readingPane = document.querySelector('.ws-center-viewer') || document.querySelector('.ws-pane-left')
        const selectionBar = event?.target?.closest?.('.selection-action-bar')
        const sel = window.getSelection()

        if (!readingPane || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
          if (!selectionBar) updateSelection('', null, false)
          return
        }

        const text = sel.toString().trim()
        const range = sel.getRangeAt(0)
        const containerNode = range.commonAncestorContainer?.nodeType === Node.TEXT_NODE
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer

        if (!text || text.length < 2 || !containerNode || !readingPane.contains(containerNode)) {
          if (!selectionBar) updateSelection('', null, false)
          return
        }

        const rect = range.getBoundingClientRect()
        if (!rect || (!rect.width && !rect.height)) {
          updateSelection('', null, false)
          return
        }

        updateSelection(text, rect, true)
      })
    }

    document.addEventListener('mouseup', syncSelection)
    document.addEventListener('selectionchange', syncSelection)
    window.addEventListener('resize', syncSelection)
    window.addEventListener('scroll', syncSelection, true)

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      document.removeEventListener('mouseup', syncSelection)
      document.removeEventListener('selectionchange', syncSelection)
      window.removeEventListener('resize', syncSelection)
      window.removeEventListener('scroll', syncSelection, true)
    }
  }, [updateSelection])

  useEffect(() => {
    if (activeStudyTool !== 'annotate') {
      setShowEquationModal(false)
      setPendingEquation('')
    }
  }, [activeStudyTool])

  async function fetchSessionMaterials(sessionId, shareCode) {
    setLoading(true)
    try {
      let session = null
      if (sessionId) {
        const { data, error } = await supabase
          .from('deck_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()
        if (!error) session = data
      } else if (shareCode) {
        const { data, error } = await supabase
          .from('deck_sessions')
          .select('*')
          .eq('share_code', shareCode)
          .maybeSingle()
        if (!error) session = data
      }

      if (!session) {
        console.warn('❌ Session not found for workstation session loading')
        setCourseMaterials([])
        setLoading(false)
        return
      }

      setActiveSessionId(session.id)
      const itemIds = (session.items || []).map(item => item.id).filter(Boolean)
      if (itemIds.length === 0) {
        setCourseMaterials([])
        setSessionMaterials([])
        setLoading(false)
        return
      }

      const { data: fullMaterials, error: mErr } = await supabase
        .from('materials')
        .select('*')
        .in('id', itemIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (mErr) throw mErr

      if (fullMaterials && fullMaterials.length > 0) {
        setCourseMaterials(fullMaterials)
        setSessionMaterials(fullMaterials)
        const initialMaterial = materialIdParam
          ? fullMaterials.find(m => m.id === materialIdParam) || fullMaterials[0]
          : fullMaterials[0]
        setSelectedMaterial(initialMaterial)
        setShowDashboard(false)
      } else {
        setCourseMaterials([])
        setSessionMaterials([])
      }
    } catch (err) {
      console.error('❌ fetchSessionMaterials error:', err)
      setCourseMaterials([])
      setSessionMaterials([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.id) {
      return
    }

    // Priority 0: material passed directly via navigation state (from Backpack, SharedMaterialPreview etc.)
    const stateMaterial = location?.state?.material
    if (stateMaterial?.id && !sessionIdParam && !shareCodeParam && !materialIdParam && !courseId) {
      setCourseMaterials([stateMaterial])
      setSessionMaterials([stateMaterial])
      setSelectedMaterial(stateMaterial)
      setShowDashboard(false)
      return
    }

    if (sessionIdParam || shareCodeParam) {
      fetchSessionMaterials(sessionIdParam, shareCodeParam)
    } else if (materialIdParam) {
      // If materialId is specified, load that specific material regardless of courseId
      fetchStandaloneMaterial(materialIdParam)
    } else if (courseId) {
      // Load course-specific materials
      fetchCourseInfo()
      fetchMaterials()
      checkAssignments()
    } else if (activeDeckItems.length > 0) {
      // Load materials from deck if no courseId is provided
      loadDeckMaterials()
    } else {
      // Fallback: fetch all user's standalone + course materials
      fetchAllUserMaterials()
    }
  }, [courseId, materialIdParam, sessionIdParam, shareCodeParam, activeDeckItems.length, user?.id])

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
        navigate('/home')
      }
    } catch (err) {
      console.error('❌ Error loading standalone material:', err)
      // Redirect to dashboard on error
      console.log('🔄 Redirecting to dashboard - error occurred')
      navigate('/home')
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
            quiz: data.quiz || data.analysis?.quiz || null,
            page_summaries: data.page_summaries || data.analysis?.page_summaries || {}
          }
        }))
        setMaterialAnalysis(data.analysis || data)
      }

      // Proactive extraction check (Process on Arrival)
      if (selectedMaterial && (!selectedMaterial.extracted_text || selectedMaterial.extracted_text.length < 50)) {
        console.log('[Workstation] Material missing text. Triggering proactive extraction...')
        if (!profile?.is_premium && user?.id) {
          const { ok } = await checkAndDeductCredits(user.id, CREDIT_COSTS.OPEN_MATERIAL, false)
          if (!ok) return // silently skip; user sees analysis unavailable
        }
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
      if (!profile?.is_premium && user?.id) {
        const { ok } = await checkAndDeductCredits(user.id, CREDIT_COSTS.GENERATE_SUMMARY, false)
        if (!ok) { setPageSummaries({}); return }
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
        if (!profile?.is_premium && user?.id) {
          const { ok } = await checkAndDeductCredits(user.id, CREDIT_COSTS.OPEN_MATERIAL, false)
          if (!ok) { setIsAnalysisLoading(false); clearTimeout(timeout); return }
        }
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
          if (!profile?.is_premium && user?.id) {
            const { ok } = await checkAndDeductCredits(user.id, CREDIT_COSTS.GENERATE_AI_NOTES, false)
            if (!ok) { finalResult = "You've used up your AI credits for today."; break; }
          }
          try {
            const content = (selectedMaterial.extracted_text || "").replace(/\*\*/g, '').slice(0, 6000)
            if (!content) { finalResult = 'No content available.'; break; }
            const notesPrompt = `You are Luter Tutor. Provide academic notes for this material. Title: ${selectedMaterial.title}. Content: ${content}`
            const response = await callGroqAPI([{ role: 'user', content: notesPrompt }], GROQ_MODELS.SPEEDSTER, { systemPromptOverride: GROQ_PROMPTS.AI_NOTES })
            finalResult = response.choices[0].message.content
          } catch {
            finalResult = 'Notes generation failed.'
          }
          break;
        case 'summary': {
          if (!profile?.is_premium && user?.id) {
            const { ok } = await checkAndDeductCredits(user.id, CREDIT_COSTS.GENERATE_SUMMARY, false)
            if (!ok) { finalResult = "You've used up your AI credits for today."; break; }
          }
          try {
            const content = (selectedMaterial.extracted_text || '').replace(/\*\*/g, '').slice(0, 6000)
            if (!content) { finalResult = 'No content available.'; break; }
            const summaryPrompt = `You are Luter Tutor. Provide a concise executive summary of this material. Title: ${selectedMaterial.title}. Content: ${content}`
            const response = await callGroqAPI([{ role: 'user', content: summaryPrompt }], GROQ_MODELS.SPEEDSTER, { systemPromptOverride: GROQ_PROMPTS.SUMMARY })
            finalResult = response.choices[0].message.content
          } catch {
            finalResult = 'Summary generation failed.'
          }
          break;
        }
        case 'flashcards': {
          if (!profile?.is_premium && user?.id) {
            const { ok } = await checkAndDeductCredits(user.id, CREDIT_COSTS.GENERATE_FLASHCARDS, false)
            if (!ok) { finalResult = []; break; }
          }
          console.log(`[runAnalysis] Generating flashcards...`)
          const fRes = await MaterialAnalysisService.generateFlashcards(currentAnalysisRow, 10, selectedMaterial);
          console.log(`[runAnalysis] Flashcards result:`, fRes)
          finalResult = fRes.success ? fRes.flashcards : [];
          break;
        }
        case 'quiz': {
          if (!profile?.is_premium && user?.id) {
            const { ok } = await checkAndDeductCredits(user.id, CREDIT_COSTS.GENERATE_QUIZ, false)
            if (!ok) { finalResult = []; break; }
          }
          console.log(`[runAnalysis] Generating quiz...`)
          const qRes = await MaterialAnalysisService.generateQuiz(currentAnalysisRow, 5, 'medium', selectedMaterial);
          console.log(`[runAnalysis] Quiz result:`, qRes)
          finalResult = qRes.success ? qRes.quiz : [];
          break;
        }
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
        } catch (err) {
          console.warn('Unable to fetch existing AI notes:', err)
        }
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
      // Credit check
      const cost = CREDIT_COSTS.AI_CHAT
      const { ok } = await checkAndDeductCredits(user?.id, cost, profile?.is_premium)
      if (!ok) {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: "You've used up your AI credits for today. They reset daily — come back tomorrow or upgrade to Pro for more!"
        }])
        return
      }
      setCreditsBalance(prev => typeof prev === 'number' ? prev - cost : prev)

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

  const mobileSectionLabel = { content: 'Source', chat: 'AI Chat', flashcards: 'Cards', summary: 'Summary', quiz: 'Quiz', board: 'Board', write: 'Notes', groupchat: 'Group', group: 'Hub' }
  const mobileActiveLabel = mobileSectionLabel[activeTab] || mobileSectionLabel[activeSideTab] || 'Study'
  const isCollaborativeSession = sessionType !== 'solo'
  const fileName = selectedMaterial?.title || 'Material'
  const elapsed = formatTime(elapsedTime)
  const materialChipMeta = getMaterialChipMeta(selectedMaterial)
  const audioStatusMeta = {
    idle: { label: 'Voice ready', color: '#64748B' },
    connecting: { label: 'Connecting', color: '#D97706' },
    connected: { label: 'Live voice', color: '#059669' },
    reconnecting: { label: 'Reconnecting', color: '#D97706' },
    failed: { label: 'Voice issue', color: '#EF4444' },
  }[audioSession.connectionStatus] || { label: 'Voice ready', color: '#64748B' }
  const audioButtonLabel = audioSession.connectionStatus === 'connecting'
    ? 'Joining'
    : audioSession.isJoined ? 'Leave' : 'Join Audio'
  const activeSpeakerLabel = audioSession.activeSpeakers?.length
    ? `${audioSession.activeSpeakers.map((speaker) => speaker.name).slice(0, 2).join(', ')} speaking`
    : `${audioSession.participantCount || 0} in audio`
  const topNavigationTabs = [
    { id: 'content', label: 'Source', icon: FileText, onClick: () => { setActiveTab('content'); setActiveSideTab('chat') } },
    { id: 'summary', label: 'Summary', icon: Sparkle, onClick: () => setActiveTab('summary') },
    { id: 'flashcards', label: 'Cards', icon: Stack, onClick: () => { setActiveTab('flashcards'); setActiveSideTab('flashcards') } },
    { id: 'quiz', label: 'Quiz', icon: Checks, onClick: () => { setActiveTab('quiz'); setActiveSideTab('quiz') } },
  ]
  const sidePanelTabs = [
    { id: 'chat', label: 'Chat', icon: ChatCircle },
    { id: 'write', label: 'Notes', icon: PencilLine },
    { id: 'groupchat', label: 'Group', icon: ChatsCircleIcon },

  ].filter((tab) => {
    if (!isCollaborativeSession) return ['chat', 'write'].includes(tab.id)
    return true
  })
  const voiceToneOptions = ['Natural', 'Clear', 'Warm', 'Calm']
  const equationPreviewMarkup = useMemo(() => {
    try {
      return katex.renderToString(equationInput || '\\frac{a}{b}', {
        throwOnError: false,
        displayMode: true,
      })
    } catch (error) {
      return ''
    }
  }, [equationInput])
  const isAnnotateActive = activeStudyTool === 'annotate'

  if (loading || !selectedMaterial) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: 'radial-gradient(120% 120% at 50% 0%, #FAF5FF 0%, #F5F3FF 50%, #F9FAFB 100%)',
        color: '#7C3AED',
        fontFamily: 'var(--font-display)'
      }}>
        <LuterPageLoader />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280' }}>Loading your study room...</span>
      </div>
    )
  }

  return (
    <div className="ws-root" style={{
      background: 'radial-gradient(120% 120% at 50% 0%, #FAF5FF 0%, #F5F3FF 50%, #F9FAFB 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <style>{`
        /* Sleek custom scrollbars */
        .ws-chat-scroll::-webkit-scrollbar,
        .ws-right-panel-content::-webkit-scrollbar,
        .ws-sidebar::-webkit-scrollbar,
        .ws-plain-message::-webkit-scrollbar,
        .ws-right-panel::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .ws-chat-scroll::-webkit-scrollbar-track,
        .ws-right-panel-content::-webkit-scrollbar-track,
        .ws-sidebar::-webkit-scrollbar-track,
        .ws-right-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .ws-chat-scroll::-webkit-scrollbar-thumb,
        .ws-right-panel-content::-webkit-scrollbar-thumb,
        .ws-sidebar::-webkit-scrollbar-thumb,
        .ws-right-panel::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.15);
          border-radius: 9999px;
        }
        .ws-chat-scroll::-webkit-scrollbar-thumb:hover,
        .ws-right-panel-content::-webkit-scrollbar-thumb:hover,
        .ws-sidebar::-webkit-scrollbar-thumb:hover,
        .ws-right-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.35);
        }

        /* Active Tool pulse effect */
        @keyframes activeToolPulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(109, 40, 217, 0.15), 0 0 0 0px rgba(124, 58, 237, 0.2); }
          50% { box-shadow: 0 6px 18px rgba(109, 40, 217, 0.25), 0 0 0 4px rgba(124, 58, 237, 0.3); }
        }
        .active-tool-glow {
          animation: activeToolPulse 2s infinite ease-in-out;
        }
      `}</style>
      {isMobile && (
        <div className="mobile-top-bar" style={{
            padding: '0 16px',
            background: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            height: '60px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                style={{ background: 'none', border: 'none', color: '#1E293B', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <List size={22} weight="bold" />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)' }}>
                  {selectedMaterial?.title || courseInfo?.code || 'Workstation'}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#8B5CF6', background: '#F5F3FF', padding: '2px 7px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', border: '1px solid #EDE9FE', flexShrink: 0 }}>
                  {mobileActiveLabel}
                </span>
              </div>
            </div>
            <button
              onClick={handleExit}
              style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', fontWeight: 800, fontSize: '10px', padding: '8px 14px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              Exit
            </button>
        </div>
      )}

      {!isMobile && (
        <header style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(109, 40, 217, 0.08)',
          height: '64px',
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
            padding: '0 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  width: '42px',
                  height: '42px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  color: '#6B7280',
                  transition: 'all 150ms ease'
                }}
              >
                <SidebarSimple size={21} weight={sidebarCollapsed ? 'fill' : 'duotone'} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <House size={19} color="#6B7280" weight="duotone" />
                </button>

                <CaretRight size={13} color="#D1D5DB" />
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                  {courseInfo?.code || 'Course'}
                </span>
                <CaretRight size={13} color="#D1D5DB" />

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowFileSwitcher(!showFileSwitcher)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: '#F5F3FF', border: '1px solid #DDD6FE',
                      borderRadius: 9999, padding: '8px 14px',
                      cursor: 'pointer', transition: 'all 150ms',
                      maxWidth: 220
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}
                  >
                    <materialChipMeta.Icon size={17} color={materialChipMeta.color} weight="fill" />
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: '#6D28D9',
                      fontFamily: WORKSTATION_FONT_STACK,
                      maxWidth: 160, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {fileName}
                    </span>
                    <CaretDown size={13} color="#8B5CF6" weight="bold" />
                  </button>

                  <AnimatePresence>
                    {showFileSwitcher && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                          position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '300px',
                          background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB',
                          boxShadow: '0 12px 32px rgba(17,24,39,0.12)', zIndex: 100, overflow: 'hidden'
                        }}
                      >
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                                width: '100%', padding: '10px 12px', border: 'none', borderRadius: '12px',
                                background: selectedMaterial?.id === m.id ? '#F5F3FF' : 'transparent',
                                color: selectedMaterial?.id === m.id ? '#6D28D9' : '#374151',
                                textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                transition: 'all 150ms ease', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)'
                              }}
                            >
                              <FileText size={16} weight={selectedMaterial?.id === m.id ? 'fill' : 'regular'} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                            </button>
                          ))}
                          <button style={{
                            width: '100%', padding: '12px', marginTop: '4px', border: '1px dashed #E5E7EB', borderRadius: '12px',
                            background: 'transparent', color: '#6B7280', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}>
                            <Plus size={14} weight="bold" /> Add file to session
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(124, 58, 237, 0.1)',
                  borderRadius: 9999, padding: '8px 14px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.01)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <Timer size={16} color="#7C3AED" weight="duotone" />
                  <span style={{ fontSize: 12, color: '#4B5563', fontWeight: 800, fontFamily: WORKSTATION_FONT_STACK }}>
                    {elapsed}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div id="tour-ai-tools" style={{
                background: 'rgba(243, 244, 246, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(229, 231, 235, 0.5)',
                borderRadius: '9999px',
                padding: 4,
                display: 'inline-flex',
                gap: '4px',
              }}>
                {topNavigationTabs.map((tab) => {
                  const isActive = activeTab === tab.id || (tab.id === 'content' && activeTab === 'notes')
                  return (
                    <button
                      key={tab.id}
                      onClick={tab.onClick}
                      style={{
                        position: 'relative',
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 200ms ease',
                        background: 'transparent',
                        color: isActive ? '#7C3AED' : '#6B7280',
                        fontFamily: WORKSTATION_FONT_STACK,
                        zIndex: 1,
                      }}
                      onMouseEnter={e => { if(!isActive) e.currentTarget.style.color = '#7C3AED' }}
                      onMouseLeave={e => { if(!isActive) e.currentTarget.style.color = '#6B7280' }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: '#FFFFFF',
                            borderRadius: '9999px',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.08), 0 1px 3px rgba(124, 58, 237, 0.04)',
                            zIndex: -1,
                          }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <tab.icon size={18} weight={isActive ? 'fill' : 'duotone'} color={isActive ? '#7C3AED' : '#6B7280'} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
              {isCollaborativeSession && <PresenceBar />}
              {isCollaborativeSession && audioRoomId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    title={audioSession.error || activeSpeakerLabel}
                    style={{
                      minWidth: 92,
                      maxWidth: 160,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      lineHeight: 1.15,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: audioStatusMeta.color, whiteSpace: 'nowrap' }}>
                      {audioStatusMeta.label}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {audioSession.error || activeSpeakerLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={audioSession.isJoined ? audioSession.leaveSession : audioSession.joinSession}
                    disabled={audioSession.connectionStatus === 'connecting'}
                    title={audioSession.isJoined ? 'Leave audio room' : 'Join audio room'}
                    style={{
                      height: 34,
                      borderRadius: 9999,
                      border: '1px solid rgba(109, 40, 217, 0.16)',
                      background: audioSession.isJoined ? '#111827' : '#FFFFFF',
                      color: audioSession.isJoined ? '#FFFFFF' : '#6D28D9',
                      cursor: audioSession.connectionStatus === 'connecting' ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '0 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 160ms ease',
                    }}
                  >
                    {audioSession.isJoined ? <SignOut size={15} weight="bold" /> : <Microphone size={15} weight="bold" />}
                    <span>{audioButtonLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={audioSession.toggleMicrophone}
                    disabled={!audioSession.isJoined}
                    title={audioSession.isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9999,
                      border: `1px solid ${audioSession.isMicEnabled ? 'rgba(109, 40, 217, 0.14)' : 'rgba(239, 68, 68, 0.22)'}`,
                      background: audioSession.isMicEnabled ? 'rgba(255,255,255,0.72)' : '#FEF2F2',
                      color: audioSession.isMicEnabled ? '#6D28D9' : '#EF4444',
                      cursor: audioSession.isJoined ? 'pointer' : 'not-allowed',
                      opacity: audioSession.isJoined ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      transition: 'all 160ms ease',
                    }}
                  >
                    {audioSession.isMicEnabled ? <Microphone size={17} weight="duotone" /> : <MicrophoneSlash size={17} weight="duotone" />}
                  </button>
                  <button
                    type="button"
                    onClick={audioSession.toggleSpeaker}
                    disabled={!audioSession.isJoined}
                    title={audioSession.isSpeakerEnabled ? 'Mute workspace audio' : 'Unmute workspace audio'}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9999,
                      border: `1px solid ${audioSession.isSpeakerEnabled ? 'rgba(109, 40, 217, 0.14)' : 'rgba(239, 68, 68, 0.22)'}`,
                      background: audioSession.isSpeakerEnabled ? 'rgba(255,255,255,0.72)' : '#FEF2F2',
                      color: audioSession.isSpeakerEnabled ? '#6D28D9' : '#EF4444',
                      cursor: audioSession.isJoined ? 'pointer' : 'not-allowed',
                      opacity: audioSession.isJoined ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      transition: 'all 160ms ease',
                    }}
                  >
                    {audioSession.isSpeakerEnabled ? <SpeakerHigh size={17} weight="duotone" /> : <SpeakerSlash size={17} weight="duotone" />}
                  </button>
                </div>
              )}

              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #F5D0FE 100%)',
                  border: '1px solid rgba(217, 119, 6, 0.15)',
                  borderRadius: 9999, padding: '6px 14px',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.06)',
                  transition: 'all 200ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 6, 0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 119, 6, 0.06)';
                }}
              >
                <Crown size={14} color="#D97706" weight="fill" />
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#B45309',
                  letterSpacing: '0.02em',
                  fontFamily: WORKSTATION_FONT_STACK,
                }}>{typeof creditsBalance === 'number' ? `${creditsBalance} CREDITS` : '∞'}</span>
                <span style={{ color: 'rgba(180, 83, 9, 0.2)' }}>|</span>
                <span style={{
                  fontSize: 11, fontWeight: 800, color: '#7C3AED',
                  letterSpacing: '0.02em',
                  fontFamily: WORKSTATION_FONT_STACK,
                }}>Upgrade</span>
              </div>
              <button
                onClick={() => setFocusMode(!focusMode)}
                style={{
                  display:'flex',alignItems:'center',gap:6,
                  border:'1px solid rgba(109, 40, 217, 0.12)',
                  borderRadius:9999,
                  padding:'8px 16px',fontSize:13,color:'#4B5563',fontWeight:700,
                  background:'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(8px)',
                  cursor:'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition:'all 200ms ease',
                  fontFamily: WORKSTATION_FONT_STACK,
                }}
                onMouseEnter={e=>{
                  e.currentTarget.style.background='rgba(255, 255, 255, 1)';
                  e.currentTarget.style.borderColor='rgba(109, 40, 217, 0.3)';
                  e.currentTarget.style.boxShadow='0 4px 12px rgba(109, 40, 217, 0.08)';
                  e.currentTarget.style.transform='translateY(-1px)';
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.background='rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.borderColor='rgba(109, 40, 217, 0.12)';
                  e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.02)';
                  e.currentTarget.style.transform='translateY(0)';
                }}
              >
                <ArrowsOut size={16} color="#7C3AED" weight="duotone" />
                Focus Mode
              </button>
              <button
                onClick={handleExit}
                style={{
                  display:'flex',alignItems:'center',gap:6,
                  border:'1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius:9999,
                  padding:'8px 16px',fontSize:13,fontWeight:700,
                  color:'#EF4444',
                  background:'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(8px)',
                  cursor:'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition:'all 200ms ease',
                  fontFamily: WORKSTATION_FONT_STACK,
                }}
                onMouseEnter={e=>{
                  e.currentTarget.style.background='rgba(254, 242, 242, 0.8)';
                  e.currentTarget.style.borderColor='rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.08)';
                  e.currentTarget.style.transform='translateY(-1px)';
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.background='rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.borderColor='rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.02)';
                  e.currentTarget.style.transform='translateY(0)';
                }}
              >
                <SignOut size={16} color="#EF4444" weight="duotone" />
                Exit Session
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  id="ws-more-menu-btn"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  style={{
                    width:36,height:36,borderRadius:10,border:'none',
                    background:'transparent',cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center'
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background='#F3F4F6'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <DotsThree size={22} color="#6B7280" weight="duotone"/>
                </button>
                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      style={{
                        position: 'absolute', right: 0,
                        top: 'calc(100% + 8px)', background: 'white', border: '1px solid #E5E7EB',
                        borderRadius: '16px', boxShadow: '0 12px 32px rgba(17,24,39,0.12)', zIndex: 200,
                        minWidth: '160px', overflow: 'hidden'
                      }}
                    >
                      <button
                        onClick={handleShareCurrentWorkspace}
                        disabled={isPreparingShare || (!selectedMaterial && !(activeSessionId || sessionIdParam))}
                        style={{ padding: '12px 16px', width: '100%', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-body)' }}
                      >
                        <ShareNetwork size={15} weight="regular" /> {activeSessionId || sessionIdParam ? 'Share Session' : isPreparingShare ? 'Preparing...' : 'Share Material Live'}
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
        flexDirection: isMobile ? 'column' : 'row',
        background: 'transparent',
        overflow: 'hidden',
        padding: isMobile ? '0' : '12px',
        gap: isMobile ? 0 : '12px',
        flex: 1,
        height: isMobile ? 'auto' : 'calc(100vh - 52px)',
        position: 'relative',
        boxSizing: 'border-box',
        paddingBottom: isMobile ? 'calc(84px + env(safe-area-inset-bottom, 0px))' : '12px'
      }}>
        {/* Main Workspace Area - Center Zone */}
        {/* On mobile: show for 'content', 'summary', 'quiz', 'board' tabs. Hide for side panel tabs. */}
        <div ref={constraintsRef} className="ws-center-viewer" style={{
          display: isMobile
            ? (['content', 'summary', 'quiz', 'board'].includes(activeTab) ? 'flex' : 'none')
            : 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: '0',
          borderRadius: '0',
          border: 'none',
          background: 'transparent',
          position: 'relative',
          height: '100%',
          flex: 1,
          minWidth: 0,
          zIndex: 1
        }}>
          {/* 1. Summary View */}
          <div style={{
            flex: 1,
            display: activeTab === 'summary' ? 'flex' : 'none',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid rgba(139, 92, 246, 0.08)',
            boxShadow: '0 8px 32px rgba(109, 40, 217, 0.03)',
            height: '100%'
          }}>
            <WorkstationSummaryEnhanced
              content={currentAnalysis.summary}
              material={selectedMaterial}
              pageSummaries={pageSummaries}
              onFetchPageSummaries={handleFetchPageSummaries}
              onRegenerate={() => runAnalysis('summary')}
              onJumpToPage={(p) => { handlePageJump(p); setActiveTab('content'); }}
              isLoading={isAnalysisLoading}
              user={user}
              courseId={courseId}
              numPages={viewportData?.numPages}
              onAskQuestion={async (question) => {
                setActiveSideTab('chat');
                if (isSidePanelCollapsed) setSidePanelCollapsed(false);
                handleSend(question);
              }}
              onSaveNotes={async (summaryText) => {
                if (!selectedMaterial || !user) return;
                await saveToVault({
                  materialId: selectedMaterial.id,
                  userId: user.id,
                  courseId,
                  title: `${selectedMaterial.title} - AI Summary`,
                  content: summaryText,
                  sourceType: 'ai'
                });
              }}
            />
          </div>

          {/* 2. Flashcards View */}
          <div style={{
            flex: 1,
            display: activeTab === 'flashcards' ? 'block' : 'none',
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid rgba(139, 92, 246, 0.08)',
            boxShadow: '0 8px 32px rgba(109, 40, 217, 0.03)',
            height: '100%'
          }}>
            <WorkstationFlashcards
              flashcards={currentAnalysis.flashcards}
              material={selectedMaterial}
              onRegenerate={() => runAnalysis('flashcards')}
            />
          </div>

          {/* 3. Quiz View */}
          <div style={{
            flex: 1,
            display: activeTab === 'quiz' ? 'block' : 'none',
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid rgba(139, 92, 246, 0.08)',
            boxShadow: '0 8px 32px rgba(109, 40, 217, 0.03)',
            height: '100%'
          }}>
            <WorkstationQuiz
              quiz={currentAnalysis.quiz}
              material={selectedMaterial}
              onRegenerate={() => runAnalysis('quiz')}
            />
          </div>

          {/* 4. Whiteboard View */}
          <div style={{
            flex: 1,
            display: activeTab === 'board' ? 'flex' : 'none',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            background: 'white',
            position: 'relative',
          }}>
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
                  onClick={() => navigate('/upload')}
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
                       <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A102D', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Personal Study Notes</h1>
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
                          fontSize: '16px', lineHeight: '1.7', color: '#334155', fontFamily: WORKSTATION_FONT_STACK,
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


                {/* Inner scrollable document area */}
                <div
                  className="document-scroll-area"
                  ref={scrollContainerRef}
                  style={{
                    background: 'transparent',
                    flex: 1,
                    overflow: 'hidden',
                    borderRadius: '0',
                    padding: '0',
                    position: 'relative',
                  }}
                >
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
                    onMaterialUpdate={(m) => setSelectedMaterial(prev => prev ? { ...prev, ...m } : m)}
                    annotateMode={activeStudyTool === 'annotate'}
                    highlightMode={activeStudyTool === 'highlight'}
                    commentMode={activeStudyTool === 'comment'}
                    focusModeTool={activeStudyTool === 'cover'}
                    annotationColor={annotationColor}
                    annotationStrokeSize={annotationStrokeSize}
                    isEraserMode={drawMode === 'eraser'}
                    annotationToolType={drawMode}
                    pendingEquation={pendingEquation}
                    onEquationPlaced={() => setPendingEquation('')}
                    onCommentThreadSelect={(thread) => {
                      setSelectedThread(thread)
                      setActiveSideTab('chat')
                      if (isSidePanelCollapsed) setSidePanelCollapsed(false)
                    }}
                    canvasRefs={canvasRefs}
                    scrollContainerRef={scrollContainerRef}
                    highlights={highlights}
                    initCanvas={initCanvas}
                    startDrawing={startDrawing}
                    draw={draw}
                    stopDrawing={stopDrawing}
                    drawMode={drawMode}
                    loadHighlights={loadHighlights}
                    setHighlightToolbox={setHighlightToolbox}
                  />

                  {highlightToolbox && (
                    <HighlightToolbox
                      toolbox={highlightToolbox}
                      COLORS={HIGHLIGHT_COLORS}
                      selectedColor={selectedHighlightColor}
                      setSelectedColor={setSelectedHighlightColor}
                      onApply={applyHighlight}
                      onDelete={deleteHighlight}
                      onSendToAI={(text) => {
                        setActiveSideTab('chat');
                        if (isSidePanelCollapsed) setSidePanelCollapsed(false);
                        handleSend(`Explain this selected text from the document: "${text}"`);
                      }}
                      onClose={() => setHighlightToolbox(null)}
                      containerRef={scrollContainerRef}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Centered Study Tools Toolbar Dock */}
          {!isMobile && ['content', 'board'].includes(activeTab) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <AnnotationToolbar
                drawMode={drawMode}
                setDrawMode={setDrawMode}
                strokeColor={annotationColor}
                setStrokeColor={setAnnotationColor}
                strokeSize={annotationStrokeSize}
                setStrokeSize={setAnnotationStrokeSize}
                ANNOTATION_COLORS={ANNOTATION_COLORS}
                STROKE_SIZES={STROKE_SIZES}
                onClear={() => clearPage(viewportData?.currentPage || 1)}
                visible={activeWorkspaceTool === 'annotate' || activeStudyTool === 'annotate'}
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '6px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(124, 58, 237, 0.15)',
                boxShadow: '0 12px 30px rgba(109, 40, 217, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04)',
                gap: '4px',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
              }}>
                {BOTTOM_WORKSPACE_TOOLS.map((tool, index) => {
                  const ToolIcon = tool.icon
                  const isActive = activeWorkspaceTool === tool.id || activeStudyTool === tool.id
                  return (
                    <React.Fragment key={tool.id}>
                      <button
                        type="button"
                        onClick={() => handleWorkspaceToolSelect(tool.id)}
                        style={{
                          display:'flex',alignItems:'center',gap:6,
                          padding:'8px 14px',borderRadius:'9999px',
                          fontSize:13,fontWeight:800,
                          cursor:'pointer',
                          border:'1px solid',
                          transition:'all 200ms ease',
                          background: isActive ? tool.activeBg : 'rgba(255, 255, 255, 0.6)',
                          borderColor: isActive ? tool.activeBorder : 'rgba(229, 231, 235, 0.5)',
                          color: isActive ? tool.activeColor : '#4B5563',
                          boxShadow: isActive ? '0 6px 14px rgba(109, 40, 217, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                          fontFamily: WORKSTATION_FONT_STACK,
                          transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          if (!isActive) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.25)';
                            e.currentTarget.style.boxShadow = '0 6px 14px rgba(124, 58, 237, 0.08)';
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = isActive ? 'translateY(-2px)' : 'translateY(0)';
                          if (!isActive) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                            e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.5)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                          }
                        }}
                      >
                        <ToolIcon size={16} weight={isActive ? 'fill' : 'duotone'} color={isActive ? tool.activeColor : '#7C3AED'} />
                        <span>{tool.label}</span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 20,
                          height: 20,
                          padding: '0 4px',
                          borderRadius: 6,
                          background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(109, 40, 217, 0.08)',
                          border: isActive ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(109, 40, 217, 0.15)',
                          fontSize: 10,
                          fontWeight: 800,
                          lineHeight: 1,
                          color: isActive ? 'inherit' : '#7C3AED',
                          marginLeft: 4,
                          transition: 'all 200ms ease',
                        }}>
                          {tool.shortcut}
                        </span>
                      </button>
                      {index < BOTTOM_WORKSPACE_TOOLS.length - 1 && (
                        <div style={{ width:1,height:20,background:'rgba(229, 231, 235, 0.5)',margin:'0 2px' }}/>
                      )}
                    </React.Fragment>
                  )
                })}
                {activeTab !== 'board' && (
                  <>
                    <div style={{ width:1,height:20,background:'rgba(229, 231, 235, 0.5)',margin:'0 2px' }}/>
                    <button
                      onClick={() => {
                        const cur = viewportData?.currentPage || 1
                        if (cur > 1) handlePageJump(cur - 1)
                      }}
                      disabled={(viewportData?.currentPage || 1) <= 1}
                      style={{
                        width:34,height:34,borderRadius:9999,
                        border:'none',background:'transparent',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        cursor: (viewportData?.currentPage || 1) <= 1 ? 'not-allowed' : 'pointer',
                        color: (viewportData?.currentPage || 1) <= 1 ? '#CBD5E1' : '#64748B',
                        transition: 'all 200ms ease',
                      }}
                      onMouseEnter={(e) => { if ((viewportData?.currentPage || 1) > 1) { e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'; e.currentTarget.style.color = '#7C3AED'; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; if ((viewportData?.currentPage || 1) > 1) e.currentTarget.style.color = '#64748B'; }}
                    >
                      <CaretUp size={16} weight="bold" color={(viewportData?.currentPage || 1) <= 1 ? '#CBD5E1' : '#7C3AED'} />
                    </button>
                    <button
                      onClick={() => {
                        const cur = viewportData?.currentPage || 1
                        const total = viewportData?.totalPages || 1
                        if (cur < total) handlePageJump(cur + 1)
                      }}
                      disabled={(viewportData?.currentPage || 1) >= (viewportData?.totalPages || 1)}
                      style={{
                        width:34,height:34,borderRadius:9999,
                        border:'none',background:'transparent',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        cursor: (viewportData?.currentPage || 1) >= (viewportData?.totalPages || 1) ? 'not-allowed' : 'pointer',
                        color: (viewportData?.currentPage || 1) >= (viewportData?.totalPages || 1) ? '#CBD5E1' : '#64748B',
                      }}
                      onMouseEnter={(e) => { if ((viewportData?.currentPage || 1) < (viewportData?.totalPages || 1)) e.currentTarget.style.background = '#F3F4F6' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <CaretDown size={16} weight="bold" color={(viewportData?.currentPage || 1) >= (viewportData?.totalPages || 1) ? '#CBD5E1' : '#6B7280'} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Resizer Handle */}
        {!isSidePanelCollapsed && !focusMode && !isMobile && (
          <div
            onMouseDown={() => {
              isResizing.current = true
              setIsResizeActive(true)
              document.body.style.cursor = 'col-resize'
            }}
            onMouseEnter={() => setIsResizeHovered(true)}
            onMouseLeave={() => setIsResizeHovered(false)}
            style={{
              width: '14px',
              cursor: 'col-resize',
              background: 'transparent',
              transition: 'all 150ms ease',
              zIndex: 30,
              position: 'relative',
              flexShrink: 0
            }}
          >
            <div style={{
              position: 'absolute',
              top: '20px',
              bottom: '20px',
              left: '50%',
              width: '2px',
              transform: 'translateX(-50%)',
              background: isResizeActive || isResizeHovered ? '#C4B5FD' : '#E5E7EB',
              borderRadius: '9999px',
              transition: 'all 150ms ease'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 28,
              height: 28,
              transform: 'translate(-50%, -50%)',
              borderRadius: '9999px',
              background: isResizeActive || isResizeHovered ? '#FFFFFF' : 'rgba(255,255,255,0.72)',
              border: `1px solid ${isResizeActive || isResizeHovered ? '#C4B5FD' : '#E5E7EB'}`,
              boxShadow: isResizeActive || isResizeHovered ? '0 10px 18px rgba(124,58,237,0.16)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isResizeActive || isResizeHovered ? 1 : 0,
              transition: 'all 150ms ease',
              pointerEvents: 'none'
            }}>
              <ArrowsLeftRight size={14} weight="bold" color={isResizeActive || isResizeHovered ? '#7C3AED' : '#94A3B8'} />
            </div>
          </div>
        )}

        {isSidePanelCollapsed && !focusMode && !isMobile && (
          <button
            type="button"
            onClick={() => setSidePanelCollapsed(false)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 45,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '16px',
              border: '1px solid #DDD6FE',
              background: '#FFFFFF',
              color: '#7C3AED',
              boxShadow: '0 12px 24px rgba(17,24,39,0.08)',
              cursor: 'pointer',
              transition: 'all 180ms ease',
              fontFamily: WORKSTATION_FONT_STACK,
              fontSize: '13px',
              fontWeight: 800,
            }}
            onMouseEnter={(event) => { event.currentTarget.style.transform = 'translateY(-50%) translateX(-2px)' }}
            onMouseLeave={(event) => { event.currentTarget.style.transform = 'translateY(-50%)' }}
          >
            <SidebarSimple size={18} weight="fill" />
            <CaretLeft size={16} weight="bold" />
            Open Panel
          </button>
        )}

        {/* Right Zone - Side Panel */}
        {!isSidePanelCollapsed && !focusMode && (
          <aside
            id="tour-ai-chat"
            className="ws-right-panel"
            style={{
              // On mobile: show the side panel ONLY when a side-panel tool is active
              // (chat, flashcards via side panel, write, hub, group)
              // Hide it when the user is on content/summary/quiz/board (center-viewer tabs)
              display: isMobile
                ? (['content', 'summary', 'quiz', 'board'].includes(activeTab) ? 'none' : 'flex')
                : 'flex',
              width: isMobile ? '100%' : `${panelWidth}px`,
              margin: '0',
              borderRadius: '24px',
              border: '1px solid rgba(139, 92, 246, 0.1)',
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(109, 40, 217, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
              overflow: 'hidden',
              flexDirection: 'column',
              height: isMobile ? 'calc(100dvh - 144px - env(safe-area-inset-bottom, 0px))' : '100%',
              minHeight: 0,
              position: 'relative',
              flexShrink: 0
            }}
          >

            {/* Drag handle */}
            {!isMobile && (
              <div
                onMouseDown={() => { isResizing.current = true; setIsResizeActive(true) }}
                style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                  cursor: 'col-resize', zIndex: 20,
                  background: 'transparent',
                  transition: 'all 150ms ease'
                }}
                onMouseEnter={() => setIsResizeHovered(true)}
                onMouseLeave={() => setIsResizeHovered(false)}
              />
            )}

            {/* Drag handle glow line if resizing */}
            {!isMobile && isResizeHovered && (
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: '#7C3AED', zIndex: 25 }} />
            )}

            {/* Tabs row */}
            <div className="ws-right-panel-header" style={{
              display: 'flex',
              alignItems: 'center',
              height: '60px',
              borderBottom: '1px solid rgba(109, 40, 217, 0.08)',
              padding: '0 10px 0 14px',
              gap: '8px',
              background: 'transparent',
              flexShrink: 0,
              justifyContent: 'space-between'
            }}>
              <div className="ws-right-tabs" style={{ display: 'flex', alignItems: 'center', gap: '0px', minWidth: 0 }}>
                {sidePanelTabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`ws-right-tab ${activeSideTab===tab.id ? 'is-active' : ''}`}
                    onClick={() => setActiveSideTab(tab.id)}
                    style={{
                      height:58,
                      padding:'0 16px',
                      display:'flex',alignItems:'center',gap:6,
                      fontSize:13,
                      fontWeight: activeSideTab===tab.id ? 700 : 500,
                      color: activeSideTab===tab.id ? '#7C3AED' : '#9CA3AF',
                      background:'none',border:'none',
                      cursor:'pointer',
                      position: 'relative',
                      transition:'color 200ms ease',
                      whiteSpace:'nowrap',
                      fontFamily: WORKSTATION_FONT_STACK,
                    }}
                    onMouseEnter={e=>{ if(activeSideTab!==tab.id) e.currentTarget.style.color='#7C3AED' }}
                    onMouseLeave={e=>{ if(activeSideTab!==tab.id) e.currentTarget.style.color='#9CA3AF' }}
                  >
                    <tab.icon size={17} weight={activeSideTab===tab.id ? 'fill' : 'bold'} color={activeSideTab===tab.id ? '#7C3AED' : '#9CA3AF'} />
                    <span>{tab.label}</span>
                    {activeSideTab === tab.id && (
                      <motion.div
                        layoutId="activeSideTabIndicator"
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 12,
                          right: 12,
                          height: '3px',
                          background: '#7C3AED',
                          borderRadius: '9999px',
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Open in full AI Chat page */}
                <button
                  className="ws-open-aichat-btn"
                  onClick={() => {
                    // Write material context so AiChatPanel picks it up
                    try {
                      if (selectedMaterial) {
                        sessionStorage.setItem('luter-ws-ai-context', JSON.stringify({
                          title: selectedMaterial.title || selectedMaterial.file_name || 'Study material',
                          text: (selectedMaterial.extracted_text || '').slice(0, 8000),
                        }))
                      }
                    } catch {}
                    navigate('/ai-chat')
                  }}
                  title="Open full AI Chat"
                >
                  <ArrowSquareOutIcon size={12} weight="bold" />
                  Full Chat
                </button>
                {/* Collapse panel */}
                <button
                  onClick={() => setSidePanelCollapsed(true)}
                  style={{
                    background: 'rgba(248, 250, 252, 0.8)', border: '1px solid rgba(229, 231, 235, 0.8)', borderRadius: '12px', padding: '8px 10px',
                    cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', transition: 'all 150ms ease', gap: '6px',
                    fontFamily: WORKSTATION_FONT_STACK, fontSize: '12px', fontWeight: 700
                  }}
                  onMouseEnter={(event) => { event.currentTarget.style.background = '#F3F4F6' }}
                  onMouseLeave={(event) => { event.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)' }}
                >
                  <CaretRight size={15} weight="bold" />
                  <SidebarSimple size={16} weight="duotone" />
                </button>
              </div>            </div>

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
                        fontSize: '13px', fontWeight: 700, borderRadius: '9999px',
                        border: '1px solid #DDD6FE', background: '#F5F3FF', color: '#6D28D9',
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <GraduationCap size={18} weight="regular" /> Open Study Deck
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
                  {isCollaborativeSession && audioRoomId && (
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9', background: '#FFFFFF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#1E293B' }}>Audio room</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: audioStatusMeta.color }}>{audioStatusMeta.label}</div>
                        </div>
                        <button
                          type="button"
                          onClick={audioSession.isJoined ? audioSession.leaveSession : audioSession.joinSession}
                          disabled={audioSession.connectionStatus === 'connecting'}
                          style={{
                            height: 30,
                            border: 'none',
                            borderRadius: 9999,
                            background: audioSession.isJoined ? '#111827' : '#6D28D9',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0 11px',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: audioSession.connectionStatus === 'connecting' ? 'wait' : 'pointer',
                          }}
                        >
                          {audioSession.isJoined ? <SignOut size={14} weight="bold" /> : <Microphone size={14} weight="bold" />}
                          <span>{audioButtonLabel}</span>
                        </button>
                      </div>
                      {audioSession.error && (
                        <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, marginBottom: 8 }}>
                          {audioSession.error}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(audioSession.participants.length ? audioSession.participants : [{ id: 'empty', name: 'No one in audio yet', isSpeaking: false }]).map((participant) => (
                          <div
                            key={participant.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              padding: '7px 9px',
                              borderRadius: 10,
                              background: participant.isSpeaking ? '#ECFDF5' : '#F8FAFC',
                              border: `1px solid ${participant.isSpeaking ? '#BBF7D0' : '#E2E8F0'}`,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 9999, background: participant.isSpeaking ? '#10B981' : '#CBD5E1', flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: '#334155', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {participant.isLocal ? 'You' : participant.name}
                              </span>
                            </div>
                            <span style={{ fontSize: 10, color: participant.isSpeaking ? '#059669' : '#94A3B8', fontWeight: 800, flexShrink: 0 }}>
                              {participant.isSpeaking ? 'Speaking' : participant.isMicrophoneEnabled === false ? 'Muted' : 'Audio'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#1E293B', background: 'transparent', fontFamily: 'var(--font-display)', fontWeight: 500 }}
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
              ) : false ? (
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                   <div style={{ padding: '16px 20px', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: 0, fontFamily: 'var(--font-display)' }}>Group Hub</h3>
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
                          user={user}
                          profile={profile}
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
                  <AiChatPanel
                    isOpen={activeSideTab === 'chat'}
                    onClose={() => setSidePanelCollapsed(true)}
                    mode="sidebar"
                    setMode={() => {}}
                    editor={null}
                    currentNoteId={selectedMaterial?.id || 'ws'}
                    panelWidth={panelWidth}
                    setPanelWidth={setPanelWidth}
                    user={user}
                    profile={profile}
                  />
                )}
            </div>
          </aside>
        )}
      </main>

      {isMobile && (
        <>
          <nav className="mobile-bottom-nav">
            <button
              className={`mobile-nav-item ${activeTab === 'content' ? 'mobile-nav-item--active' : ''}`}
              onClick={() => { setActiveTab('content'); setSidePanelCollapsed(true); setShowMobileTools(false); }}
            >
              <SquaresFour size={24} weight={activeTab === 'content' ? 'fill' : 'regular'} />
              <span>Source</span>
            </button>
            <button
              className={`mobile-nav-item ${(activeTab === 'chat' && activeSideTab === 'chat') ? 'mobile-nav-item--active' : ''}`}
              onClick={() => { setActiveTab('chat'); setActiveSideTab('chat'); setSidePanelCollapsed(false); setShowMobileTools(false); }}
            >
              <ChatCircleTextIcon size={24} weight={(activeTab === 'chat' && activeSideTab === 'chat') ? 'fill' : 'regular'} />
              <span>Chat</span>
            </button>
            <button
              className={`mobile-nav-item ${(activeTab === 'flashcards' || activeSideTab === 'flashcards') ? 'mobile-nav-item--active' : ''}`}
              onClick={() => { setActiveTab('flashcards'); setActiveSideTab('flashcards'); setSidePanelCollapsed(false); setShowMobileTools(false); }}
            >
              <Stack size={24} weight={(activeTab === 'flashcards' || activeSideTab === 'flashcards') ? 'fill' : 'regular'} />
              <span>Cards</span>
            </button>
            <button
              className={`mobile-nav-item ${showMobileTools || activeTab === 'summary' || activeTab === 'quiz' || activeTab === 'board' || activeSideTab === 'write' || activeSideTab === 'groupchat' ? 'mobile-nav-item--active' : ''}`}
              onClick={() => setShowMobileTools(!showMobileTools)}
            >
              <GridFour size={24} weight={showMobileTools ? 'fill' : 'regular'} />
              <span>Tools</span>
            </button>
          </nav>

          <AnimatePresence>
            {showMobileTools && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 1200,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
              }} onClick={() => setShowMobileTools(false)}>
                <motion.div
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: 'white', borderRadius: '32px 32px 0 0', padding: '32px 24px',
                    paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0, fontFamily: 'var(--font-display)' }}>Workspace Tools</h3>
                    <button onClick={() => setShowMobileTools(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
                      <X size={16} weight="bold" />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                      { id: 'summary', icon: FileText, label: 'Summary', isMain: true },
                      { id: 'quiz', icon: ClipboardText, label: 'Quiz', isMain: true },
                      { id: 'board', icon: PencilLine, label: 'Board', isMain: true },
                      { id: 'write', icon: PenNib, label: 'Notes', isSide: true },
                      { id: 'groupchat', icon: Users, label: 'Group', isSide: true },
                    ].map(tool => {
                      const isActive = tool.isMain ? activeTab === tool.id : activeSideTab === tool.id;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            if (tool.isMain) {
                              setActiveTab(tool.id)
                              setSidePanelCollapsed(true)
                            } else {
                              setActiveTab('chat')
                              setActiveSideTab(tool.id)
                              setSidePanelCollapsed(false)
                            }
                            setShowMobileTools(false)
                          }}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            background: isActive ? '#F5F3FF' : '#F8FAFC',
                            border: `1px solid ${isActive ? '#C4B5FD' : '#E2E8F0'}`,
                            borderRadius: '16px', padding: '16px 8px',
                            color: isActive ? '#6D28D9' : '#475569', cursor: 'pointer',
                            transition: 'all 0.2s', boxShadow: isActive ? '0 4px 12px rgba(109, 40, 217, 0.1)' : 'none'
                          }}
                        >
                          <tool.icon size={28} weight={isActive ? "fill" : "regular"} />
                          <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{tool.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {showEquationModal && isAnnotateActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1250,
              background: 'rgba(17,24,39,0.20)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
            onClick={() => setShowEquationModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '24px',
                boxShadow: '0 24px 50px rgba(17,24,39,0.16)',
                padding: '22px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-display)' }}>Insert equation</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280', fontFamily: WORKSTATION_FONT_STACK }}>Write LaTeX and click insert, then place it on the page.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEquationModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '9999px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <textarea
                value={equationInput}
                onChange={(event) => setEquationInput(event.target.value)}
                placeholder="\\frac{a}{b}"
                style={{
                  width: '100%',
                  minHeight: '112px',
                  borderRadius: '18px',
                  border: '1px solid #DDD6FE',
                  background: '#FAF8FF',
                  padding: '14px 16px',
                  resize: 'vertical',
                  outline: 'none',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#1F2937',
                  fontFamily: '"JetBrains Mono", Consolas, monospace'
                }}
              />

              <div style={{ marginTop: '14px', marginBottom: '18px', border: '1px solid #E5E7EB', borderRadius: '20px', background: '#FFFFFF', padding: '18px', minHeight: '92px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontFamily: WORKSTATION_FONT_STACK }}>Preview</div>
                {equationPreviewMarkup ? (
                  <div dangerouslySetInnerHTML={{ __html: equationPreviewMarkup }} />
                ) : (
                  <div style={{ fontSize: '14px', color: '#6B7280', fontFamily: WORKSTATION_FONT_STACK }}>Preview unavailable</div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEquationModal(false)}
                  style={{
                    borderRadius: '9999px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#374151',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: WORKSTATION_FONT_STACK
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!equationInput.trim()) return
                    setPendingEquation(equationInput.trim())
                    setDrawMode('text')
                    setShowEquationModal(false)
                  }}
                  style={{
                    borderRadius: '9999px',
                    border: '1px solid #8B5CF6',
                    background: '#7C3AED',
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(124,58,237,0.18)',
                    fontFamily: WORKSTATION_FONT_STACK
                  }}
                >
                  Insert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
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

      <AnimatePresence>
        {showVoiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(17,24,39,0.22)',
              backdropFilter: 'blur(8px)',
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
            onClick={closeVoiceModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              style={{
                width: '100%',
                maxWidth: '420px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(17,24,39,0.16)',
                overflow: 'hidden'
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 16px 12px',
                borderBottom: '1px solid #F3F4F6'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Voice chat</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>Speak with Luter about this material</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowVoiceSettings((current) => !current)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9999px',
                      border: '1px solid #E5E7EB',
                      background: showVoiceSettings ? '#F9FAFB' : '#FFFFFF',
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <DotsThreeVertical size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={closeVoiceModal}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9999px',
                      border: '1px solid #E5E7EB',
                      background: '#FFFFFF',
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {showVoiceSettings && (
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', background: '#FCFCFD' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '10px' }}>Voice</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {voiceToneOptions.map((tone) => {
                      const isSelected = selectedVoiceTone === tone
                      return (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => setSelectedVoiceTone(tone)}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: `1px solid ${isSelected ? '#111827' : '#E5E7EB'}`,
                            background: isSelected ? '#111827' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#374151',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 150ms ease'
                          }}
                        >
                          {tone}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ padding: '24px 20px 20px', textAlign: 'center' }}>
                <div style={{
                  width: '112px',
                  height: '112px',
                  margin: '0 auto',
                  borderRadius: '9999px',
                  border: voiceState === 'listening' ? '2px solid #EF4444' : '2px solid #E5E7EB',
                  background: voiceState === 'listening' ? '#FEF2F2' : '#F9FAFB',
                  color: voiceState === 'listening' ? '#EF4444' : '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: voiceState === 'listening' ? '0 0 0 8px rgba(239,68,68,0.08)' : 'none',
                  transition: 'all 150ms ease'
                }}>
                  {voiceState === 'processing' ? (
                    <CircleNotch size={32} className="ws-spin" />
                  ) : voiceState === 'speaking' ? (
                    <SpeakerHigh size={32} weight="regular" />
                  ) : (
                    <Microphone size={32} weight="regular" />
                  )}
                </div>

                <div style={{ marginTop: '16px', fontSize: '15px', fontWeight: 600, color: '#374151' }}>
                  {voiceState === 'listening'
                    ? 'Listening...'
                    : voiceState === 'processing'
                      ? 'Thinking...'
                      : voiceState === 'speaking'
                        ? 'Speaking...'
                        : 'Tap the mic to start'}
                </div>

                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280', lineHeight: 1.5, minHeight: '36px' }}>
                  {voiceState === 'listening'
                    ? (voiceTranscript || 'Ask anything about this material')
                    : voiceState === 'speaking'
                      ? (voiceResponse || 'Luter is replying...')
                      : voiceState === 'processing'
                        ? 'Luter is working on your answer.'
                        : 'Use voice mode for quick questions, explanations, and follow-ups.'}
                </div>

                <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
                  {[14, 24, 18, 28].map((height, index) => (
                    <span
                      key={`${height}-${index}`}
                      style={{
                        width: '6px',
                        height,
                        borderRadius: '9999px',
                        background: voiceState === 'listening' ? '#EF4444' : '#7C3AED',
                        opacity: voiceState === 'idle' ? 0.22 : 0.7,
                        animation: voiceState === 'idle' ? 'none' : `ws-dot-pulse 1s ${index * 0.16}s infinite`
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{
                padding: '0 16px 16px',
                borderTop: '1px solid #F3F4F6',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                alignItems: 'center'
              }}>
                {voiceState === 'idle' ? (
                  <button
                    type="button"
                    onClick={startVoiceListening}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: '#7C3AED',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <Microphone size={20} weight="bold" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={closeVoiceModal}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: '#F3F4F6',
                        color: '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <X size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={stopVoiceListening}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: voiceState === 'listening' ? '#EF4444' : '#111827',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {voiceState === 'processing' ? <CircleNotch size={20} className="ws-spin" /> : voiceState === 'speaking' ? <SpeakerHigh size={20} weight="bold" /> : <Microphone size={20} weight="bold" />}
                    </button>
                    <button
                      type="button"
                      onClick={stopVoiceListening}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: '#F3F4F6',
                        color: '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <CheckCircle size={18} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SelectionActionBar onAction={handleSelectionAction} />
      <ShareSessionModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false)
          setShareTargetSession(null)
        }}
        sessionId={shareTargetSession?.id || activeSessionId || sessionIdParam}
        session={shareTargetSession}
        materialId={selectedMaterial?.id || materialIdParam}
      />
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

function nameForUser(user, profile) {
  return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'
}

function colorFromText(text = 'user') {
  const colors = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2']
  return colors[String(text).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length]
}

export default function WorkstationPage() {
  const { materialId } = useParams()
  const { user, profile } = useOutletContext() || {}
  const [searchParams] = useSearchParams()

  useEffect(() => {
    document.body.classList.add('in-workspace')
    return () => {
      document.body.classList.remove('in-workspace')
    }
  }, [])

  const matId   = searchParams.get('materialId') || materialId
  const sessionId = searchParams.get('sessionId')
  const shareCode = searchParams.get('share')
  const groupId = searchParams.get('groupId')
  const roomId  = sessionId
    ? `luter-session-${sessionId}`
    : shareCode
      ? `luter-share-${shareCode}`
      : groupId
        ? `luter-group-${groupId}`
        : matId
          ? `luter-material-v2-${matId}`
          : `luter-empty-${user?.id || 'guest'}`
  const sessionType = searchParams.get('sessionType') || searchParams.get('mode') || (sessionId || groupId ? 'group' : 'solo')
  const role = profile?.role === 'teacher' || searchParams.get('role') === 'teacher'
    ? 'teacher'
    : (sessionType === 'solo' ? 'peer' : 'student')
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'

  return (
    <ReadingSpaceProvider>
      <CollaborationProvider
        roomId={roomId}
        userInfo={{
          id: user?.id || 'guest',
          name: displayName,
          avatar: user?.user_metadata?.avatar_url || null,
          color: user?.user_metadata?.color || '#7C3AED',
          role,
        }}
        initialPresence={{
          role: 'presenter', // Default to presenter so user can use whiteboard
          currentPage: 1,
          currentSlide: 0,
          isTyping: false,
          status: 'active',
          cursor: null,
          selectedText: null,
          currentTool: 'none',
          user: {
            id: user?.id || 'guest',
            name: displayName,
            avatar: user?.user_metadata?.avatar_url || null,
            color: user?.user_metadata?.color || '#7C3AED',
            role,
          },
        }}
      >
        <WorkstationContent />
      </CollaborationProvider>
    </ReadingSpaceProvider>
  )
}
