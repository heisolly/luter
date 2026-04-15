import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { 
  BookOpen, Star, FileText, CheckCircle2, ChevronRight, ArrowLeft, ExternalLink, Layers, 
  HelpCircle, Plus, Search, ChevronLeft, Briefcase, PlayCircle, Settings, User, LogOut, 
  MoreVertical, Layout, Bookmark, Zap, Send, Loader2, AlertCircle, Menu, Share, 
  GraduationCap, Share2, ClipboardList, Mic, Baby, Copy, Check, Minus, Sparkles, 
  Lightbulb, MessageSquare, RotateCcw, ArrowRight, Home as HomeIcon, CheckSquare, MoreHorizontal, 
  StickyNote, ArrowUp, Book, Library
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
  const context = useOutletContext() || {}
  const { user } = context
  const [searchParams] = useSearchParams()
  const materialIdParam = searchParams.get('materialId')
  const { setViewportData, highlightText, updateSpark, clearHighlights, viewportData, updateSelection, isSidePanelCollapsed } = useReadingSpace()
  
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [mobileReadingMode, setMobileReadingMode] = useState('document')
  const messagesEndRef = useRef(null)

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
    }
  }, [courseId])

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

  const runAnalysis = async (type) => {
    if (isExtractingText || isAnalysisLoading || !selectedMaterial) return
    setIsAnalysisLoading(true)
    try {
      if (analysisCache[selectedMaterial.id]?.[type]) {
        setIsAnalysisLoading(false)
        return
      }
      let currentAnalysisRow = materialAnalysis
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
          const fRes = await MaterialAnalysisService.generateFlashcards(currentAnalysisRow, 10);
          finalResult = fRes.success ? fRes.flashcards : [];
          break;
        case 'quiz':
          const qRes = await MaterialAnalysisService.generateQuiz(currentAnalysisRow, 5, 'medium');
          finalResult = qRes.success ? qRes.quiz : [];
          break;
        default: throw new Error('Unknown type');
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
      if (activeTab === 'notes' && selectedMaterial && !currentAnalysis[activeTab]) {
        try {
          const notesFromDb = await fetchUserNotes(user.id, courseId)
          const existingNote = notesFromDb.find(n => n.material_id === selectedMaterial.id && n.source_type === 'ai')
          if (existingNote) {
            setAnalysisCache(prev => ({ ...prev, [selectedMaterial.id]: { ...(prev[selectedMaterial.id] || {}), notes: existingNote.content } }))
            return
          }
        } catch (err) {}
      }
      const content = currentAnalysis[activeTab]
      if (activeTab !== 'content' && selectedMaterial && isPlaceholderContent(content) && selectedMaterial.processing_status !== 'pending' && !isAnalysisLoading) {
        runAnalysis(activeTab);
      }
    }
    checkExistingAnalysis();
  }, [activeTab, selectedMaterial, currentAnalysis]);

  const handleSend = async (forcedInput) => {
    const textToSend = typeof forcedInput === 'string' ? forcedInput : chatInput
    if (!textToSend.trim() || isProcessingLoading) return
    const userMsg = { role: 'user', content: textToSend }
    setMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsProcessingLoading(true)
    try {
      const aiResponse = await queryStudyMaterials({ question: textToSend, courseId, materialId: selectedMaterial?.id, fallbackContext: selectedMaterial?.extracted_text?.slice(0, 8000) || '' })
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
          background: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)', 
          height: '64px', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div className="ws-header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <button 
              className="ws-sidebar-toggle" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: '#f5f5f5', border: '1px solid #f1f1f1', borderRadius: '8px', padding: '6px', color: '#71717A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title={sidebarCollapsed ? "Open sidebar" : "Hide sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <div className="ws-breadcrumb-minimal" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717A', fontSize: '13px' }}>
              <HomeIcon size={14} onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} />
              <ChevronRight size={14} />
              <span onClick={() => navigate(`/dashboard/courses/${courseId}`)} style={{ cursor: 'pointer' }}>{courseInfo?.code || 'Course'}</span>
              <ChevronRight size={14} />
              <span style={{ fontWeight: '500', color: '#18181B', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedMaterial?.title || 'Material'}</span>
            </div>
          </div>

          <div className="ws-header-center" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div className="ws-top-nav-capsule" style={{ 
              display: 'flex', 
              background: '#f4f4f5', 
              padding: '4px', 
              borderRadius: '99px', 
              border: '1px solid #e4e4e7',
              gap: '4px'
            }}>
              <button 
                onClick={() => { setActiveTab('content'); setActiveSideTab('chat'); }}
                className={`ws-capsule-btn ${activeTab === 'content' && activeSideTab === 'chat' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', fontSize: '13px', fontWeight: '500', 
                  borderRadius: '99px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === 'content' && activeSideTab === 'chat' ? 'white' : 'transparent',
                  color: activeTab === 'content' && activeSideTab === 'chat' ? '#18181B' : '#71717A',
                  boxShadow: activeTab === 'content' && activeSideTab === 'chat' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <FileText size={16} /> Source
              </button>
              <button 
                onClick={() => setActiveSideTab('flashcards')}
                className={`ws-capsule-btn ${activeSideTab === 'flashcards' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', fontSize: '13px', fontWeight: '500', 
                  borderRadius: '99px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeSideTab === 'flashcards' ? 'white' : 'transparent',
                  color: activeSideTab === 'flashcards' ? '#18181B' : '#71717A',
                  boxShadow: activeSideTab === 'flashcards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Layers size={16} /> Flashcards <span style={{ opacity: 0.5, marginLeft: '4px' }}>{currentAnalysis.flashcards?.length || 0}</span>
              </button>
              <button 
                onClick={() => setActiveSideTab('quiz')}
                className={`ws-capsule-btn ${activeSideTab === 'quiz' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', fontSize: '13px', fontWeight: '500', 
                  borderRadius: '99px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeSideTab === 'quiz' ? 'white' : 'transparent',
                  color: activeSideTab === 'quiz' ? '#18181B' : '#71717A',
                  boxShadow: activeSideTab === 'quiz' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <CheckSquare size={16} /> Quizzes
              </button>
            </div>
          </div>

          <div className="ws-header-right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', border: '1px solid #e4e4e7', background: 'white', color: '#18181B', cursor: 'pointer' }}>
              <Share2 size={14} /> Share
            </button>
            <button style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e4e4e7', background: 'white', color: '#71717A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MoreHorizontal size={14} />
            </button>
          </div>
        </header>
      )}

      {isMobile && !showDashboard && (
        <div style={{ padding: '12px 20px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #E2E8F0', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', background: '#F5F3FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={20} color="#7a12cc" /></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '15px', fontWeight: 900, color: '#1A102D' }}>{courseInfo?.code || 'Luter'}</span><span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Week {selectedMaterial?.week_number || '1'}</span></div>
            </div>
            <button className="ws-tactile-btn" style={{ padding: '8px 16px', fontSize: '12px', background: '#F5F3FF', color: '#7a12cc', border: '1px solid #E2E8F0' }} onClick={() => navigate(`/dashboard/courses/${courseId}`)}><ArrowLeft size={16} /> Exit</button>
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
        <div className="ws-pane-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFB' }}>
          {/* Subheader for Document/Notes toggle */}
          <div className="ws-canvas-tabs" style={{ 
            padding: '12px 32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            borderBottom: '1px solid rgba(0,0,0,0.04)', 
            background: 'white' 
          }}>
            <div style={{ display: 'flex', background: '#f4f4f5', padding: '3px', borderRadius: '8px' }}>
              <button 
                onClick={() => setActiveTab('content')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '500', 
                  borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === 'content' ? 'white' : 'transparent',
                  color: activeTab === 'content' ? '#18181B' : '#71717A',
                  boxShadow: activeTab === 'content' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <FileText size={14} /> Document
              </button>
              <button 
                onClick={() => setActiveTab('notes')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '500', 
                  borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === 'notes' ? 'white' : 'transparent',
                  color: activeTab === 'notes' ? '#18181B' : '#71717A',
                  boxShadow: activeTab === 'notes' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <StickyNote size={14} /> Notes
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A1A1AA', fontSize: '11px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid #E4E4E7' }}></div>
              0% of this source generated
            </div>
          </div>

          <div className="ws-canvas-container" style={{ flex: 1, overflowY: 'auto', display: (isMobile && activeTab !== 'content' && activeTab !== 'notes') ? 'none' : 'block' }}>
            {activeTab === 'notes' ? (
              <div className="ws-ai-content-pane" style={{ padding: '60px', maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: '#111' }}>Extracted Text</h2>
                <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#3F3F46', whiteSpace: 'pre-wrap', fontStyle: 'normal' }}>
                  {selectedMaterial?.extracted_text || "The text is still being extracted. Please wait..."}
                </div>
              </div>
            ) : (
              <div className="ws-content-scroll" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <MaterialRenderer material={selectedMaterial} activeTab="content" onScrollUpdate={setViewportData} />
              </div>
            )}
          </div>
        </div>

        {!isSidePanelCollapsed && (
          <div className="ws-pane-right" style={{ 
            display: (isMobile && activeTab === 'content') ? 'none' : 'flex', 
            width: '440px', 
            borderLeft: '1px solid rgba(0,0,0,0.05)', 
            background: 'white',
            flexDirection: 'column'
          }}>
            {activeSideTab === 'chat' && (
              <div className="ws-chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <header className="ws-side-tabs-header" style={{ padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div className="ws-text-tabs-bar" style={{ display: 'flex', gap: '20px' }}>
                    <button 
                      className="ws-text-tab" 
                      onClick={() => setActiveSideTab('chat')}
                      style={{ 
                        background: 'none', border: 'none', padding: '20px 0', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', cursor: 'pointer',
                        color: activeSideTab === 'chat' ? '#18181B' : '#A1A1AA',
                        borderBottom: activeSideTab === 'chat' ? '2px solid #18181B' : '2px solid transparent',
                        textTransform: 'uppercase'
                      }}
                    >
                      chat
                    </button>
                    <button 
                      className="ws-text-tab" 
                      style={{ 
                        background: 'none', border: 'none', padding: '20px 0', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', cursor: 'pointer',
                        color: '#A1A1AA', textTransform: 'uppercase'
                      }}
                    >
                      source info
                    </button>
                  </div>
                </header>
                <div className="ws-chat-messages">
                  {messages.length === 0 ? (
                    <div className="ws-chat-empty-state" style={{ padding: '40px' }}>
                      <div className="ws-suggested-header" style={{ marginBottom: '24px', fontSize: '11px', letterSpacing: '0.1em', fontWeight: '600', color: '#A1A1AA' }}>SUGGESTIONS</div>
                      <div className="ws-suggested-list" style={{ gap: '12px' }}>
                        {SUGGESTED_QUESTIONS.map(q => (
                          <button key={q.id} className="ws-suggested-item" onClick={() => handleSend(q.text)} style={{ background: 'transparent', border: '1px solid #f1f1f1', borderRadius: '12px', padding: '16px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="ws-suggested-text" style={{ fontSize: '13px', color: '#444' }}>{q.text}</span>
                            <ArrowRight size={14} style={{ color: '#D4D4D8' }} />
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
                                 <div style={{ fontSize: '11px', fontWeight: '800', color: '#A1A1AA', letterSpacing: '0.05em', marginBottom: '4px' }}>YOU</div>
                                 <p style={{ margin: 0, fontSize: '15px', color: '#111', fontWeight: '500' }}>{msg.content}</p>
                              </div>
                            ) : (
                              <div style={{ marginBottom: '32px' }}>
                                 <div style={{ fontSize: '11px', fontWeight: '800', color: '#A1A1AA', letterSpacing: '0.05em', marginBottom: '8px' }}>LUTER</div>
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
                                                <Bookmark size={10} /> {pageNum}
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
                      {isProcessingLoading && <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: '800', letterSpacing: '0.05em' }}>LUTER IS THINKING...</div>}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                <div className="ws-chat-input-area">
                  <div className="ws-input-wrapper">
                    <input type="text" className="ws-chat-input" placeholder="Ask Luter anything..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Mic size={14} style={{ color: '#D4D4D8', cursor: 'pointer' }} />
                      <button className="ws-send-btn" onClick={() => handleSend()} disabled={isProcessingLoading || !chatInput.trim()} style={{ opacity: !chatInput.trim() ? 0.3 : 1 }}>
                        {isProcessingLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
