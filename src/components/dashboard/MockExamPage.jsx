import { useState, useEffect, useRef } from 'react'
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { 
  RiFlaskFill as FlaskConical, RiTimeFill as Clock, RiCheckboxCircleFill as CheckCircle2, RiCloseCircleFill as XCircle, RiSearchLine as Search, RiLoader4Line as Loader2, RiFlashlightFill as Zap, 
  RiArrowRightLine as ArrowRight, RiArrowLeftLine as ArrowLeft, RiShuffleLine as Dices, RiShareFill as Share2, RiAwardFill as Award, RiTrophyFill as Trophy, 
  RiRefreshLine as RotateCcw, RiBarChartFill as BarChart3, RiFireFill as Flame, RiStarFill as Star, RiTeamFill as Users, RiThumbUpFill as ThumbsUp, 
  RiThumbDownFill as ThumbsDown, RiChat3Fill as MessageCircle, RiChat4Fill as MessageSquare, RiGiftFill as Gift, RiDeleteBin6Fill as Trash2, 
  RiMoreFill as MoreHorizontal, RiCloseLine as X, RiBookOpenFill as BookOpen, RiMenuLine as Menu
} from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarSimple } from '@phosphor-icons/react'
import { toPng } from 'html-to-image'
import confetti from 'canvas-confetti'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService'
import { usePlanGate } from '../../hooks/usePlanGate'
import LockedOverlay from '../shared/LockedOverlay'
import LuterLogo from '../shared/LuterLogo'


// Sound Effects
import correctSound from '../../assets/sounds/dragon-studio-correct-472358.mp3'
import wrongSound from '../../assets/sounds/universfield-wrong-answer-126515.mp3'

const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

// Sample course materials for Luter generation
const SAMPLE_COURSE_MATERIALS = {
  'CHM 101': `Atomic Theory and Chemical Bonding

**Key Concepts:**
- Bohr's Atomic Model: Electrons occupy fixed energy levels (n=1,2,3...)
- de Broglie Equation: λ = h/p (wavelength-momentum relationship)
- Quantum Numbers: n (principal), l (azimuthal), m (magnetic), s (spin)

**Important Formulas:**
1. Energy of electron: E = -13.6/n² eV
2. de Broglie wavelength: λ = h/(mv)
3. Rydberg equation: 1/λ = R(1/n₁² - 1/n₂²)

**Applications:**
- Spectroscopy and atomic spectra
- Chemical bonding based on electron configuration
- Periodic trends in atomic properties`,
  
  'PHY 101': `Mechanics and Motion

**Key Concepts:**
- Newton's Laws of Motion
- Work-Energy Principle
- Conservation of Momentum

**Important Formulas:**
1. F = ma (Newton's Second Law)
2. Work: W = F·d·cos(θ)
3. Kinetic Energy: KE = ½mv²
4. Momentum: p = mv

**Applications:**
- Projectile motion analysis
- Collision problems
- Energy conservation in mechanical systems`
}

export default function MockExamPage() {
  const { user, isMobile, sidebarCollapsed, setSidebarCollapsed, profile } = useOutletContext()
  const navigate = useNavigate()
  const { ready, bundle } = useDashboardPrefetch() || { ready: false, bundle: null }
  const location = useLocation()
  const preselectedCourse = location.state?.preselectedCourse
  const { canMockExam } = usePlanGate(profile)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('configure') // configure | preparing | exam | result
  const [configStep, setConfigStep] = useState(1) // 1: courses | 2: qs | 3: time | 4: advanced options
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState({})
  const [isSharing, setIsSharing] = useState(false)
  const resultRef = useRef(null)
  const messagesEndRef = useRef(null)
  const chatScrollRef = useRef(null)
  
  // Custom configurations
  const [examCourses, setExamCourses] = useState(preselectedCourse ? [preselectedCourse] : [])
  const [examQs, setExamQs] = useState(10)
  const [examTimer, setExamTimer] = useState(0) // 0 means untimed
  const [timeLeft, setTimeLeft] = useState(0)
  const [loadingStep, setLoadingStep] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackQuestion, setFeedbackQuestion] = useState(null)
  const [selfAssessment, setSelfAssessment] = useState('')

  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // New feature states
  const [instantFeedback, setInstantFeedback] = useState(false)
  const [includeTrueFalse, setIncludeTrueFalse] = useState(false)
  const [includeTypeIn, setIncludeTypeIn] = useState(false)
  const [typeInAnswers, setTypeInAnswers] = useState({}) // Store user's type-in answers

  // Action buttons state
  const [likedQuestions, setLikedQuestions] = useState({})
  const [dislikedQuestions, setDislikedQuestions] = useState({})
  const [showDislikeOptions, setShowDislikeOptions] = useState(null) // question index
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [aiChatMessages, setAiChatMessages] = useState([])
  const [aiChatInput, setAiChatInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiChatMode, setAiChatMode] = useState('chat')
  const [activeTab, setActiveTab] = useState('arena') // arena | history
  const [showReview, setShowReview] = useState(false)
  const [aiWeaknessAnalysis, setAiWeaknessAnalysis] = useState(null)
  const [isAnalyzingWeakness, setIsAnalyzingWeakness] = useState(false)
  const [hasPersistedResults, setHasPersistedResults] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [isSavingSession, setIsSavingSession] = useState(false)
  const [pastSessions, setPastSessions] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [lastAutoAdvancedIndex, setLastAutoAdvancedIndex] = useState(-1)


  useEffect(() => {
    if (user && mode === 'configure') {
      fetchPastSessions();
    }
  }, [user, mode]);

  const fetchPastSessions = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('id, course_code, course_name, score, total_questions, accuracy, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setPastSessions(data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (data) {
        setGeneratedQuestions(data.questions);
        setSelected(data.user_answers);
        setTypeInAnswers(data.type_in_answers);
        setCurrentSessionId(data.id);
        setMode('result');
        setHasPersistedResults(true); // Don't resave
      }
    } catch (err) {
      console.error('Error loading session:', err);
    }
  };

  const toggleCourseConfig = (c) => {
    setExamCourses(p => p.find(x => x.id === c.id) ? p.filter(x => x.id !== c.id) : [...p, c])
  }

  useEffect(() => {
    if (preselectedCourse) {
      setExamCourses([preselectedCourse])
      setConfigStep(2)
    }
  }, [preselectedCourse])

  // Action button handlers
  const handleLike = (questionIndex) => {
    setLikedQuestions(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }))
    if (dislikedQuestions[questionIndex]) {
      setDislikedQuestions(prev => ({ ...prev, [questionIndex]: false }))
      setShowDislikeOptions(null)
    }
  }

  const handleDislike = (questionIndex) => {
    setDislikedQuestions(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }))
    if (likedQuestions[questionIndex]) {
      setLikedQuestions(prev => ({ ...prev, [questionIndex]: false }))
    }
    setShowDislikeOptions(dislikedQuestions[questionIndex] ? null : questionIndex)
  }

  const handleDislikeOption = (option) => {
    console.log('Dislike reason:', option)
    setShowDislikeOptions(null)
  }

  const handleShare = async (question) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mock Exam Question',
          text: question.question,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(question.question)
      alert('Question copied to clipboard!')
    }
  }

  const handleDelete = (questionIndex) => {
    if (confirm('Are you sure you want to remove this question?')) {
      const newQuestions = generatedQuestions.filter((_, i) => i !== questionIndex)
      setGeneratedQuestions(newQuestions)
      if (current >= newQuestions.length) {
        setCurrent(Math.max(0, newQuestions.length - 1))
      }
    }
  }

  const handleAiChat = () => {
    if (aiChatOpen) {
      setAiChatOpen(false)
    } else {
      setAiChatOpen(true)
      setAiChatMessages([])
    }
  }

  const handleSearchAction = (question) => {
    const query = encodeURIComponent(question.question);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  }

  const handleGiftAction = () => {
    alert("🎁 Gift feature: You can share this study set with a friend to earn 50 XP! (Coming soon in full version)");
  }

  const sendAiMessage = async (overrideText) => {
    const text = overrideText !== undefined ? overrideText : aiChatInput
    if (!text.trim()) return
    const userMessage = { role: 'user', content: text }
    setAiChatMessages(prev => [...prev, userMessage])
    const currentInput = text
    setAiChatInput('')
    setIsAiLoading(true)

    try {
      const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.MOCK_TUTOR, profile?.is_premium)
      if (!ok) { setIsAiLoading(false); return }

      // Get current question context
      const currentQuestion = generatedQuestions[current]
      let contextPrompt = 'You are Luter Tutor, a helpful assistant for Nigerian university students.'
      
      if (currentQuestion) {
        contextPrompt += `\n\nCurrent Question: ${currentQuestion.question}`
        
        if (currentQuestion.type === 'typein') {
          contextPrompt += `\n\nType: Type-in Answer\nExpected Answer: ${currentQuestion.expectedAnswer || 'Not specified'}`
        } else if (currentQuestion.type === 'truefalse') {
          contextPrompt += `\n\nType: True/False\nCorrect Answer: ${currentQuestion.answer === 1 ? 'TRUE' : 'FALSE'}`
        } else {
          // Multiple choice
          contextPrompt += `\n\nType: Multiple Choice\nOptions:\n${currentQuestion.options?.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n') || 'No options available'}\n\nCorrect Answer: ${String.fromCharCode(65 + (currentQuestion.answer || 0))}`
        }
        
        contextPrompt += `\n\nExplanation: ${currentQuestion.explanation || 'No explanation provided'}`
      }
      
      // Build messages array in correct format
      const messages = [
        { role: 'system', content: contextPrompt },
        ...aiChatMessages.filter(m => m.role !== 'system'),
        userMessage
      ]
      
      const response = await callGroqAPI(
        messages,
        GROQ_MODELS.PROFESSOR,
        { 
          temperature: 0.7
        }
      )
      
      // Add safety check for response structure
      if (response?.choices?.[0]?.message?.content) {
        setAiChatMessages(prev => [...prev, { role: 'assistant', content: response.choices[0].message.content }])
      } else {
        throw new Error('Invalid response from Luter service')
      }
    } catch (error) {
      console.error('Luter Tutor Error:', error)
      setAiChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.' 
      }])
    } finally {
      setIsAiLoading(false)
    }
  }

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [aiChatMessages, isAiLoading])

  // Render AI markdown-style text with beautiful formatting
  const renderAiText = (text) => {
    if (!text) return null
    
    let processedText = text
    
    // Remove ### headers and convert to styled sections
    processedText = processedText.replace(/###\s*(.+?)(?=\n|$)/g, (match, header) => {
      return `##HEADER##${header.trim()}##ENDHEADER##`
    })
    
    // Convert **bold** to styled spans
    processedText = processedText.replace(/\*\*(.+?)\*\*/g, (match, bold) => {
      return `##BOLD##${bold}##ENDBOLD##`
    })
    
    // Convert bullet points * item to styled list items
    processedText = processedText.replace(/^\*\s(.+?)(?=\n|$)/gm, (match, item) => {
      return `##BULLET##${item.trim()}##ENDBULLET##`
    })
    
    // Convert numbered lists 1. item to styled list items
    processedText = processedText.replace(/^\d+\.\s(.+?)(?=\n|$)/gm, (match, item) => {
      return `##NUMBER##${item.trim()}##ENDNUMBER##`
    })
    
    // Split by our special markers and render
    const parts = processedText.split(/(##HEADER##|##ENDHEADER##|##BOLD##|##ENDBOLD##|##BULLET##|##ENDBULLET##|##NUMBER##|##ENDNUMBER##)/)
    
    const elements = []
    let currentType = 'text'
    let buffer = ''
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      
      switch (part) {
        case '##HEADER##':
          if (buffer.trim()) {
            elements.push(<span key={elements.length}>{buffer}</span>)
            buffer = ''
          }
          currentType = 'header'
          break
        case '##ENDHEADER##':
          if (buffer.trim()) {
            elements.push(
              <div key={elements.length} style={{ 
                fontWeight: 700, 
                fontSize: '14px', 
                color: '#7a12cc', 
                marginBottom: '8px', 
                marginTop: '12px',
                textTransform: 'lowercase',
                letterSpacing: '0.5px'
              }}>
                {buffer}
              </div>
            )
            buffer = ''
          }
          currentType = 'text'
          break
        case '##BOLD##':
          if (buffer.trim()) {
            elements.push(<span key={elements.length}>{buffer}</span>)
            buffer = ''
          }
          currentType = 'bold'
          break
        case '##ENDBOLD##':
          if (buffer.trim()) {
            elements.push(
              <span key={elements.length} style={{ 
                fontWeight: 600, 
                color: '#111827',
                fontSize: '13px'
              }}>
                {buffer}
              </span>
            )
            buffer = ''
          }
          currentType = 'text'
          break
        case '##BULLET##':
          if (buffer.trim()) {
            elements.push(<span key={elements.length}>{buffer}</span>)
            buffer = ''
          }
          currentType = 'bullet'
          break
        case '##ENDBULLET##':
          if (buffer.trim()) {
            elements.push(
              <div key={elements.length} style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                marginBottom: '4px',
                fontSize: '12px',
                color: '#374151',
                lineHeight: '1.4'
              }}>
                <span style={{ 
                  color: '#7a12cc', 
                  marginRight: '8px',
                  fontSize: '14px',
                  fontWeight: 700
                }}>•</span>
                <span>{buffer}</span>
              </div>
            )
            buffer = ''
          }
          currentType = 'text'
          break
        case '##NUMBER##':
          if (buffer.trim()) {
            elements.push(<span key={elements.length}>{buffer}</span>)
            buffer = ''
          }
          currentType = 'number'
          break
        case '##ENDNUMBER##':
          if (buffer.trim()) {
            elements.push(
              <div key={elements.length} style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                marginBottom: '4px',
                fontSize: '12px',
                color: '#374151',
                lineHeight: '1.4'
              }}>
                <span style={{ 
                  color: '#7a12cc', 
                  marginRight: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  minWidth: '16px'
                }}>•</span>
                <span>{buffer}</span>
              </div>
            )
            buffer = ''
          }
          currentType = 'text'
          break
        default:
          buffer += part
      }
    }
    
    // Add any remaining buffer
    if (buffer.trim()) {
      elements.push(<span key={elements.length} style={{ fontSize: '13px', lineHeight: '1.5' }}>{buffer}</span>)
    }
    
    return <>{elements}</>
  }

  const SUGGESTED_QUESTIONS = [
    "Explain it like I'm five years old",
    'Give me an analogy',
    'Give me a mnemonic to help me remember',
    'Explain it through a conversation between two animals'
  ]

  const FOLLOWUP_QUESTIONS = [
    'What are some examples of this?',
    'How can I apply this in practice?',
    'Why is this important to know?',
    "Explain it like I'm five years old",
    'Give me an analogy'
  ]

  const score = Object.entries(selected).reduce((acc, [idx, ansIdx]) => {
  const question = generatedQuestions[parseInt(idx)]
  if (!question) return acc
  
  // Don't know answers are always incorrect
  if (ansIdx === -1) return acc
  
  if (question.type === 'typein') {
    // For type-in questions, compare user answer to expected answer
    const userAnswer = (typeInAnswers[idx]?.trim() || '').toLowerCase()
    const expectedAnswer = (question.expectedAnswer || '').toLowerCase()
    return userAnswer === expectedAnswer ? acc + 1 : acc
  } else {
    // For multiple choice and true/false
    return acc + (ansIdx == (question.answer ?? 0) ? 1 : 0)
  }
}, 0)
  const pass = score >= (generatedQuestions?.length || 1) / 2
  const isAnswered = selected[current] !== undefined
  const currentQuestion = generatedQuestions[current]
  const isCorrect = isAnswered && currentQuestion && (
    currentQuestion.type === 'typein' 
      ? (typeInAnswers[current]?.trim()?.toLowerCase() || '') === (currentQuestion.expectedAnswer?.toLowerCase() || '')
      : selected[current] == currentQuestion.answer
  )

  // ── Sound effects logic ──
  useEffect(() => {
    if (instantFeedback && isAnswered && mode === 'exam' && lastAutoAdvancedIndex !== current) {
      const audio = new Audio(isCorrect ? correctSound : wrongSound);
      audio.volume = 0.5;
      audio.play().catch(err => console.error('Sound playback failed:', err));
    }
  }, [isAnswered, isCorrect, instantFeedback, mode, current, lastAutoAdvancedIndex]);

  // ── Persistence Logic (Supabase & Luter Weakness) ──
  useEffect(() => {
    if (mode === 'result' && !hasPersistedResults && user && generatedQuestions.length > 0) {
      persistResults();
    }
  }, [mode, hasPersistedResults, user, generatedQuestions]);

  const persistResults = async () => {
    setHasPersistedResults(true);
    setIsSavingSession(true);
    const courseCode = examCourses[0]?.code;
    const finalScore = score;
    const totalQs = generatedQuestions.length;
    const accuracy = Math.round((finalScore / totalQs) * 100);

    try {
      // 1. Update user gamification (XP, Coins) via RPC
      await supabase.rpc('update_user_gamification', {
        p_user_id: user.id,
        p_xp_gain: finalScore * 50,
        p_coins_gain: finalScore * 10,
        p_questions_answered: totalQs,
        p_sessions_completed: 1,
        p_source: 'mock_exam'
      });

      // 2. Update user_courses progress
      if (courseCode) {
        const { data: userCourse } = await supabase
          .from('user_courses')
          .select('id, progress')
          .eq('user_id', user.id)
          .eq('course_code', courseCode)
          .maybeSingle();

        if (userCourse) {
          const progressGain = Math.floor(accuracy / 10);
          const newProgress = Math.min(100, (userCourse.progress || 0) + progressGain);
          await supabase
            .from('user_courses')
            .update({ progress: newProgress })
            .eq('id', userCourse.id);
        }
      }

      // 3. Save full session for future access & sharing
      const { data: sessionData, error: sessionError } = await supabase
        .from('exam_sessions')
        .insert([{
          user_id: user.id,
          course_code: courseCode,
          course_name: examCourses[0]?.name,
          score: finalScore,
          total_questions: totalQs,
          accuracy: accuracy,
          questions: generatedQuestions,
          user_answers: selected,
          type_in_answers: typeInAnswers,
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (sessionData) {
        setCurrentSessionId(sessionData.id);
        console.log('✅ session persisted:', sessionData.id);
      } else if (sessionError) {
        console.error('❌ session persistence error:', sessionError);
      }

      // 4. Generate Luter Weakness Analysis if there are errors
      const incorrectQuestions = generatedQuestions.filter((q, idx) => {
        const userAns = selected[idx];
        if (userAns === -1) return true;
        if (q.type === 'typein') return !typeInAnswers[idx]?.trim();
        return userAns !== q.answer;
      });

      if (incorrectQuestions.length > 0) {
        analyzeWeaknesses(incorrectQuestions);
      }
    } catch (err) {
      console.error('Error persisting results:', err);
    } finally {
      setIsSavingSession(false);
    }
  };

  const analyzeWeaknesses = async (incorrectQs) => {
    setIsAnalyzingWeakness(true);
    try {
      const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.MOCK_WEAKNESS, profile?.is_premium)
      if (!ok) { setIsAnalyzingWeakness(false); return }
      const prompt = `Based on these incorrect questions from a mock exam on ${examCourses[0]?.name || 'the course'}, identify the student's key weaknesses and provide a brief 2-sentence study recommendation.
      
      Questions:
      ${incorrectQs.map(q => `- ${q.question}`).join('\n')}
      
      Return the response in this JSON format:
      {
        "weakness": "one sentence identifying the core concept missed",
        "recommendation": "one sentence advice"
      }`;

      const response = await callGroqAPI(
        [{ role: 'user', content: prompt }],
        GROQ_MODELS.SPEEDSTER,
        { temperature: 0.5, responseFormat: { type: 'json_object' } }
      );

      let content = response.choices[0].message.content;
      // Sanitize Luter response to ensure it's valid JSON
      if (content.includes('```')) {
        content = content.replace(/```json\n?|```/g, '').trim();
      }
      // If it still starts with something like "Based on...", try to find the JSON part
      if (!content.startsWith('{')) {
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          content = content.substring(start, end + 1);
        }
      }

      const analysis = JSON.parse(content);
      setAiWeaknessAnalysis(analysis);
    } catch (err) {
      console.error('Luter Analysis Error:', err);
    } finally {
      setIsAnalyzingWeakness(false);
    }
  };

  // ── Celebration Effect (Triggers on any completion) ──
  useEffect(() => {
    if (mode === 'result') {
      // 1. Initial Grand Burst
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#7a12cc', '#fbbf24', '#ffffff', '#22c55e'],
        ticks: 300,
        gravity: 0.8,
        scalar: 1.2
      });

      // 2. Persistent "Streamer Rain" (The Background Feel)
      const duration = (pass ? 5 : 2.5) * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 5 * (timeLeft / duration);
        // "Golden Streamers"
        confetti({ 
          ...defaults, 
          particleCount, 
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#fbbf24', '#7a12cc'],
          scalar: randomInRange(0.6, 1.4),
          drift: randomInRange(-0.5, 0.5)
        });
        confetti({ 
          ...defaults, 
          particleCount, 
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#7a12cc', '#ffffff'],
          scalar: randomInRange(0.6, 1.4),
          drift: randomInRange(-0.5, 1)
        });
      }, 250);

      // 3. One last big finish after a delay if they passed
      if (pass) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 90,
            spread: 120,
            origin: { x: 0.5, y: 1.2 },
            colors: ['#7a12cc', '#fbbf24'],
            scalar: 2,
            ticks: 400
          });
        }, 3000);
      }
    }
  }, [mode, pass]);

  useEffect(() => {
    if (!user) return
    if (!ready) return

    const mapFromRows = (data) =>
      data.map((row, i) => {
        // Handle both 'course' (aliased) and 'courses' (auto-joined) formats
        const courseData = row.courses || row.course || {}
        return {
          ...courseData,
          color: PALETTE[i % PALETTE.length]
        }
      })

    const fetchCourses = async () => {
      const { data } = await supabase
        .from('user_courses')
        .select('*, courses(*)')
        .eq('user_id', user.id)

      // Filter out entries where course was deleted (soft-delete handling)
      const validData = (data || []).filter(row => row.courses !== null && row.courses !== undefined)
      if (validData) setCourses(mapFromRows(validData))
      setLoading(false)
    }

    if (bundle?.uc && !bundle.uc.error && Array.isArray(bundle.uc.data)) {
      const validData = bundle.uc.data.filter(row => row.courses !== null && row.courses !== undefined)
      setCourses(mapFromRows(validData))
      setLoading(false)
      return
    }
    fetchCourses()
  }, [user, ready, bundle])

  // Generate Luter-powered questions
  const generateQuestions = async () => {
    if (examCourses.length === 0) return

    const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.START_MOCK_EXAM, profile?.is_premium)
    if (!ok) return
    
    setIsGenerating(true)
    setLoadingStep(1)
    
    try {
      const course = examCourses[0]
      const courseMaterial = SAMPLE_COURSE_MATERIALS[course.code] || `Course materials for ${course.name}`
      
      // Progressive generation for large question counts
      const batchSize = 5 // Generate 5 questions at a time
      const totalBatches = Math.ceil(examQs / batchSize)
      
      const generateBatch = async (batchNumber, existingQuestions = []) => {
        const questionsToGenerate = Math.min(batchSize, examQs - existingQuestions.length)
        
        if (questionsToGenerate <= 0) return existingQuestions
        
        // Build prompt based on question types with balanced distribution
        let questionTypeInstructions = ""
        let jsonStructure = ""
        
        // Determine types to include based on user settings
        const activeTypes = []
        if (includeTrueFalse) activeTypes.push('truefalse')
        if (includeTypeIn) activeTypes.push('typein')
        
        // Always include Multiple Choice if nothing else is picked, 
        // or add it to the mix if we want variety
        if (activeTypes.length === 0 || (!includeTrueFalse && !includeTypeIn)) {
          activeTypes.push('multiple')
        } else if (activeTypes.length > 0) {
          // Add multiple choice to the mix of other types
          activeTypes.push('multiple')
        }

        // Choose a type for this specific batch to ensure variety
        // We use batchNumber to rotate through activeTypes
        const currentType = activeTypes[batchNumber % activeTypes.length]
        
        if (currentType === 'typein') {
          questionTypeInstructions = "Generate type-in answer questions where users write their own answers. The expected answer should be a concise phrase or sentence."
          jsonStructure = `{\n  "questions": [\n    {\n      "question": "question text here",\n      "type": "typein",\n      "expected_answer": "expected answer text",\n      "explanation": "explanation text here"\n    }\n  ]\n}`
        } else if (currentType === 'truefalse') {
          questionTypeInstructions = "Generate true/false questions based on the course material."
          jsonStructure = `{\n  "questions": [\n    {\n      "question": "statement that is true or false",\n      "type": "truefalse",\n      "correct_answer": true,\n      "explanation": "explanation text here"\n    }\n  ]\n}`
        } else {
          questionTypeInstructions = "Generate multiple choice questions with 4 distinct options (A, B, C, D)."
          jsonStructure = `{\n  "questions": [\n    {\n      "question": "question text here",\n      "type": "multiple",\n      "options": ["option A", "option B", "option C", "option D"],\n      "correct_answer": 1,\n      "explanation": "explanation text here"\n    }\n  ]\n}`
        }

        const prompt = `Generate ${questionsToGenerate} challenging multiple-choice questions suitable for Nigerian university students based on this course material.

Course: ${course.code} - ${course.name}

Study Materials:
${courseMaterial}

${questionTypeInstructions}

Each question must have exactly 4 distinct options (A, B, C, D) with only one correct answer. Questions should test understanding, not just memorization.

IMPORTANT: Return your response as a JSON object with this exact structure:
${jsonStructure}

Do NOT include any markdown formatting or code blocks. Return ONLY the JSON object.

${existingQuestions.length > 0 ? `Existing questions: ${existingQuestions.length}. Generate ${questionsToGenerate} more questions.` : 'Generate: first batch of questions.'}`
        
        const data = await callGroqAPI(
          [{ role: 'user', content: prompt }],
          GROQ_MODELS.SPEEDSTER,
          { temperature: 0.7, responseFormat: { type: 'json_object' } }
        )
        
        // Parse JSON response with error handling
        let response
        try {
          response = JSON.parse(data.choices[0].message.content)
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError)
          console.log('Raw response:', data.choices[0].message.content)
          // If JSON parsing fails, return empty array
          response = { questions: [] }
        }
        
        const newQuestions = response?.questions || []
        const allQuestions = [...existingQuestions, ...newQuestions]
        
        return allQuestions
      }
      
      // Generate all batches
      let allQuestions = []
      for (let batch = 0; batch < totalBatches; batch++) {
        setLoadingStep(1 + (batch * 0.5)) // Show progress
        allQuestions = await generateBatch(batch, allQuestions)
        
        // Update UI with current batch
        const formattedQuestions = allQuestions.map((q, idx) => {
          // Normalize type handling
          let normalizedType = q.type || 'multiple';
          const questionText = (q.question || "").toLowerCase();
          
          // Fallback: If Luter includes "Boss Level" or "type" in text, force typein
          if (questionText.includes('boss level') || questionText.includes('type your answer')) {
            normalizedType = 'typein';
          } else if (normalizedType.toLowerCase().includes('type')) {
            normalizedType = 'typein';
          }
          
          if (normalizedType.toLowerCase().includes('true') || normalizedType.toLowerCase().includes('false')) {
            normalizedType = 'truefalse';
          }

          const baseQuestion = {
            id: idx,
            question: q.question,
            explanation: q.explanation,
            type: normalizedType
          }
          
          if (normalizedType === 'typein') {
            return {
              ...baseQuestion,
              expectedAnswer: q.expected_answer || q.expectedAnswer || ""
            }
          } else if (normalizedType === 'truefalse') {
            return {
              ...baseQuestion,
              answer: (q.correct_answer === true || q.correct_answer === 1 || q.answer === 1) ? 1 : 0
            }
          } else {
            // Multiple choice
            return {
              ...baseQuestion,
              options: q.options || [],
              answer: (q.correct_answer || q.answer || 1) - 1
            }
          }
        })
        
        setGeneratedQuestions(formattedQuestions.sort(() => Math.random() - 0.5))
      }
      setLoadingStep(2)
      
      // Simulate processing time for better UX
      setTimeout(() => {
        setLoadingStep(3)
        setTimeout(() => {
          setMode('exam')
          setCurrent(0)
          setSelected({})
          setTypeInAnswers({}) // Reset type-in answers
          setIsGenerating(false)
          setAiChatOpen(false)
          setLoadingStep(0)
        }, 1000)
      }, 2000)
      
    } catch (error) {
      console.error('Error generating questions:', error)
      // Fallback to sample questions if Luter fails
      const fallbackQuestions = [
        {
          id: 0,
          question: 'Which of the following best describes Bohr\'s atomic model?',
          options: ['Electrons orbit randomly', 'Electrons occupy fixed energy levels', 'Nucleus is diffuse', 'Protons orbit the nucleus'],
          answer: 1,
          explanation: 'Bohr\'s model proposes that electrons occupy specific energy levels around the nucleus.'
        },
        {
          id: 1,
          question: 'What does the de Broglie equation relate?',
          options: ['Mass and charge', 'Wavelength and momentum', 'Energy and time', 'Velocity and spin'],
          answer: 1,
          explanation: 'The de Broglie equation λ = h/p relates to wavelength of a particle to its momentum.'
        }
      ]
      setGeneratedQuestions(fallbackQuestions)
      setLoadingStep(2)
      setTimeout(() => {
        setLoadingStep(3)
        setTimeout(() => {
          setMode('exam')
          setCurrent(0)
          setSelected({})
          setTypeInAnswers({}) // Reset type-in answers
          setIsGenerating(false)
          setAiChatOpen(false)
          setLoadingStep(0)
        }, 1000)
      }, 2000)
    }
  }

  const explainWithTutor = (question, isCorrect, userChoice) => {
    setAiChatOpen(true)
    let prompt = ""
    
    if (isCorrect) {
      prompt = `Explain why the answer to this question is correct: "${question.question}". 
    
${question.type === 'multiple' ? `Options:
${question.options.map((o, i) => `${String.fromCharCode(65+i)}. ${o}`).join('\n')}
Correct Answer: ${String.fromCharCode(65+question.answer)}` : ''}
${question.type === 'truefalse' ? `Correct Answer: ${question.answer === 1 ? 'TRUE' : 'FALSE'}` : ''}
${question.type === 'typein' ? `Expected Answer: ${question.expectedAnswer}` : ''}

Please provide a concise but thorough explanation for a Nigerian university student.`
    } else {
      prompt = `I got this question wrong, please explain my mistake: "${question.question}". 
    
${question.type === 'multiple' ? `Options:
${question.options.map((o, i) => `${String.fromCharCode(65+i)}. ${o}`).join('\n')}
My Answer: ${userChoice !== undefined ? String.fromCharCode(65+userChoice) : 'None'}
Correct Answer: ${String.fromCharCode(65+question.answer)}` : ''}
${question.type === 'truefalse' ? `My Answer: ${userChoice === 1 ? 'TRUE' : 'FALSE'}
Correct Answer: ${question.answer === 1 ? 'TRUE' : 'FALSE'}` : ''}
${question.type === 'typein' ? `My Answer: "${typeInAnswers[current] || ''}"
Expected Answer: "${question.expectedAnswer}"` : ''}

Please explain where I went wrong and why the correct answer is the right choice. Provide a supportive explanation for a Nigerian university student.`
    }
    
    sendAiMessage(prompt)
  }

  const choose = (idx) => {
    setSelected(prev => ({ ...prev, [current]: idx }))
  }

  // ── Auto-advance logic ──
  useEffect(() => {
    // Only auto-advance if:
    // 1. We are in exam mode
    // 2. Question is answered
    // 3. We haven't already auto-advanced for this specific question index
    if (mode === 'exam' && isAnswered && lastAutoAdvancedIndex !== current) {
      // 4. ONLY auto-advance if the answer is CORRECT
      // This allows the user to see their mistake and interact with the utility bar if wrong
      if (isCorrect) {
        // If feedback is ON, we want a slightly longer delay so they see the green color
        const delay = instantFeedback ? 1200 : 600;
        const timer = setTimeout(() => {
          setLastAutoAdvancedIndex(current);
          next();
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [isAnswered, isCorrect, instantFeedback, mode, current, lastAutoAdvancedIndex]);

  const next = () => {
    if (current >= (generatedQuestions?.length || 1) - 1) {
      setMode('result')
    } else {
      setCurrent(c => c + 1)
      if (examTimer > 0) setTimeLeft(examTimer)
    }
  }

  useEffect(() => {
    let t = null;
    // Only run the timer if we are in exam mode, have a timer, and the question is NOT answered yet
    if (mode === 'exam' && examTimer > 0 && !isAnswered) {
      if (timeLeft > 0) {
        t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
      } else {
        next() // auto skip if timer hits 0
      }
    }
    return () => clearTimeout(t)
  }, [timeLeft, mode, examTimer, current, isAnswered])

  useEffect(() => {
    let t = null;
    let int = null;
    if (mode === 'preparing') {
      int = setInterval(() => {
        setLoadingStep(s => (s + 1) % 4);
      }, 1500);
      t = setTimeout(() => {
        setMode('exam');
        setCurrent(0);
        setSelected({});
        setTypeInAnswers({});
        if (examTimer > 0) setTimeLeft(examTimer);
      }, 7000);
    }
    return () => { 
      if (t) clearTimeout(t); 
      if (int) clearInterval(int); 
    };
  }, [mode, examTimer]);

  const handleResultShare = async () => {
    setShowShareModal(true);
  }

  const shareReviewLink = async () => {
    if (!currentSessionId) {
      if (isSavingSession) {
        alert('⏳ still saving your session, please wait a moment...');
      } else {
        alert('❌ session not found. try retaking the exam.');
      }
      return;
    }
    const shareUrl = `${window.location.origin}/exam-session/${currentSessionId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('🚀 session link copied to clipboard!');
      setShowShareModal(false);
    } catch (err) {
      console.error('clipboard copy failed');
      alert('❌ failed to copy link. please try again.');
    }
  };

  const shareViaWebShare = async () => {
    if (!currentSessionId) {
      if (isSavingSession) {
        alert('⏳ still saving your session, please wait a moment...');
      } else {
        alert('❌ session not found. try retaking the exam.');
      }
      return;
    }
    const shareUrl = `${window.location.origin}/exam-session/${currentSessionId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Luter Study Result',
          text: `I just scored ${score}/${generatedQuestions?.length || 1} on Luter! Check out my session review here:`,
          url: shareUrl
        });
        setShowShareModal(false);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard if Web Share is not supported
      shareReviewLink();
    }
  };

  const downloadResultImage = async () => {
    if (resultRef.current === null) return
    setIsSharing(true)
    try {
      const dataUrl = await toPng(resultRef.current, { cacheBust: true, pixelRatio: 2 })
      const link = document.createElement('a');
      link.download = `luter-result-${currentSessionId || 'score'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading image', err)
    } finally {
      setIsSharing(false)
    }
  }

  const copyImageToClipboard = async () => {
    if (resultRef.current === null) return
    setIsSharing(true)
    try {
      const dataUrl = await toPng(resultRef.current, { cacheBust: true, pixelRatio: 2 })
      const blob = await (await fetch(dataUrl)).blob()
      
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        alert('🎉 Image copied to clipboard!');
      } else {
        alert('Your browser does not support copying images. Try downloading instead.');
      }
    } catch (err) {
      console.error('Error copying image', err)
    } finally {
      setIsSharing(false)
    }
  }

  // --- RENDERING HELPERS ---

  const renderPreparing = () => {
    const loadingStrings = [
      "reading your documents...",
      "processing luter knowledge...",
      "calibrating neural matrix...",
      "generating flash questions...",
      "almost ready..."
    ];
    return (
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <div style={{ width: '100%', maxWidth: 440, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ marginBottom: 60 }}>
            <LuterLogo size={100} fontSize={100} />
          </div>

          <div style={{ width: '100%', textAlign: 'center', marginBottom: 20, height: 28, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.p 
                key={loadingStep}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ fontSize: 20, color: '#333', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', textTransform: 'lowercase' }}
              >
                {loadingStrings[loadingStep]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress Bar Container */}
          <div style={{ position: 'relative', width: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
            
            <div style={{ width: '100%', height: 12, background: '#f5f3ff', borderRadius: 99, border: '1.5px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 7, ease: "linear" }}
                style={{ height: '100%', background: 'var(--primary)', borderRadius: 99 }} 
              />
            </div>
            
            <motion.div
              initial={{ left: '20px' }}
              animate={{ left: 'calc(100% - 20px)' }}
              transition={{ duration: 7, ease: "linear" }}
              style={{ position: 'absolute', top: -50, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}
            >
              {/* Fire Exhaust */}
              <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 40, marginRight: -8, zIndex: 0 }}>
                <motion.div animate={{ width: [12, 32, 12], opacity: [0.8, 1, 0.8] }} transition={{ duration: 0.2, repeat: Infinity }} style={{ height: 12, background: '#ef4444', borderRadius: '99px 0 0 99px', marginRight: -4 }} />
                <motion.div animate={{ width: [6, 16, 6], opacity: [0.9, 1, 0.9] }} transition={{ duration: 0.15, repeat: Infinity, delay: 0.1 }} style={{ height: 6, background: '#f59e0b', borderRadius: '99px 0 0 99px' }} />
              </motion.div>

              {/* Main Vessel */}
              <motion.div
                animate={{ y: [-3, 3, -3], rotate: [0, 4, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ 
                  zIndex: 10, width: 56, height: 44, background: '#fff', 
                  border: '1.5px solid var(--primary)', borderRadius: '50% 50% 40% 40%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: '0 10px 25px -5px var(--primary-glow)' 
                }}
              >
                <div style={{ transform: 'rotate(90deg)', display: 'flex' }}>
                  <FlaskConical size={24} color="#064e3b" fill="#064e3b" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  const renderConfigure = () => {
    const isStepReady = configStep === 1 ? examCourses.length > 0 : true;
    return (
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* Wizard Navbar */}
        <div style={{ 
          padding: isMobile ? '16px 20px' : '24px 40px', 
          background: '#ffffff', 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: isMobile ? 'center' : 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 12 : 0,
          borderBottom: isMobile ? '1.5px solid #f5f5f5' : 'none'
        }}>
          <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10, textTransform: 'lowercase' }}>
            <FlaskConical size={20} color="#111" /> {isMobile ? 'exam setup' : 'mock exam setup'}
          </h1>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            background: '#fffbeb', 
            color: '#d97706', 
            padding: '6px 14px', 
            borderRadius: 99, 
            fontSize: 12, 
            fontWeight: 800, 
            border: '1.5px solid #fbbf24', 
            boxShadow: '0 4px 12px rgba(217,119,6,0.1)',
            textTransform: 'lowercase'
          }}>
            <Zap size={14} fill="#fbbf24" strokeWidth={0} /> {isMobile ? 'configuring' : 'configuration stage'}
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          padding: isMobile ? '20px 16px 100px' : '20px 40px 40px 40px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start' 
        }}>
          <motion.div
            key={configStep}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ width: '100%', maxWidth: (configStep === 1 || configStep === 4) ? (isMobile ? 500 : 900) : 560, display: 'flex', flexDirection: 'column' }}
          >
            {/* Heading Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderRadius: 16, padding: isMobile ? '20px' : '24px 28px', marginBottom: 28, border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)' }}>
                {configStep === 1 && <BookOpen size={22} color="#10b981" />}
                {configStep === 2 && <BarChart3 size={22} color="#10b981" />}
                {configStep === 3 && <Clock size={22} color="#10b981" />}
                {configStep === 4 && <Zap size={22} color="#10b981" />}
              </div>
              <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: '#065f46', margin: 0, lineHeight: 1.5, textTransform: 'lowercase' }}>
                {configStep === 1 && "which courses do you want to pull questions from for this mock exam?"}
                {configStep === 2 && "how many questions do you want to attempt?"}
                {configStep === 3 && "what time limit per question do you want to set?"}
                {configStep === 4 && "customize your exam experience"}
              </h2>
            </motion.div>
            
            {configStep === 1 && (
              <>
                {courses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#111' }}>No courses available</h3>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>Please add courses to your backpack first to create mock exams.</p>
                    <button 
                      onClick={() => navigate('/backpack')}
                      style={{ 
                        marginTop: 24, 
                        padding: '12px 24px', 
                        background: '#111', 
                        color: '#fff', 
                        borderRadius: 12, 
                        border: 'none', 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#111'}
                    >
                      Go to Courses
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? 12 : 20, marginBottom: 40 }}>
                    <motion.button
                      key="dice-roll"
                      whileHover={{ y: -3, boxShadow: '0 16px 40px -8px rgba(217,119,6,0.2)' }} whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        if (courses.length === 0) return;
                        const amount = Math.min(courses.length, Math.floor(Math.random() * 2) + 1);
                        const shuffled = [...courses].sort(() => 0.5 - Math.random());
                        setExamCourses(shuffled.slice(0, amount));
                      }}
                      style={{
                        padding: isMobile ? '16px 20px' : '24px', borderRadius: 16, background: '#fffbeb', textAlign: 'left', cursor: 'pointer', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', border: '1.5px solid #fbbf24', color: '#b45309', boxShadow: '0 4px 12px rgba(217,119,6,0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Dices size={20} color="#d97706" />
                        </div>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 2px', color: '#d97706', textTransform: 'lowercase' }}>dice roll</h3>
                      <p style={{ fontSize: 12, margin: 0, fontWeight: 700, color: '#b45309', textTransform: 'lowercase' }}>select random courses</p>
                    </motion.button>
                    {courses.map((c, idx) => {
                      const isSelected = examCourses.some(x => x.id === c.id)
                      const courseColor = PALETTE[idx % PALETTE.length]
                      return (
                        <motion.button
                          key={c.id} whileHover={{ y: -3, boxShadow: `0 16px 40px -8px ${courseColor}20` }} whileTap={{ scale: 0.97 }}
                          onClick={() => toggleCourseConfig(c)}
                          style={{
                            padding: isMobile ? '16px 20px' : '24px', borderRadius: 16, background: 'white', textAlign: 'left', cursor: 'pointer', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', border: isSelected ? `2px solid ${courseColor}` : '1px solid #e5e7eb', color: isSelected ? '#111' : '#555', boxShadow: isSelected ? `0 4px 16px ${courseColor}25` : '0 1px 3px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: `${courseColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${courseColor}30` }}>
                              <span style={{ fontSize: 14, fontWeight: 900, color: courseColor }}>
                                {(c.code || '??').slice(0, 3)}
                              </span>
                            </div>
                            {isSelected && (
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: courseColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={16} color="#fff" />
                              </div>
                            )}
                          </div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: '#111' }}>{c.code}</h3>
                          <p style={{ fontSize: 12, margin: 0, fontWeight: 600, color: '#64748b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.name}</p>
                        </motion.button>
                      )
                    })}
                  </div>
                )}

                {/* Past Sessions History */}
                {pastSessions.length > 0 && (
                  <div style={{ marginTop: 20, marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <Clock size={18} color="#64748b" />
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#64748b', margin: 0, textTransform: 'lowercase' }}>recent sessions</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {pastSessions.map((session, idx) => (
                        <motion.div key={session.id || `session-${idx}`} whileHover={{ x: 4 }} onClick={() => navigate(`/exam-session/${session.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 16, border: '1.5px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s', background: 'white' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a12cc' }}>
                              <BookOpen size={20} />
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{session.course_code}</div>
                              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{new Date(session.created_at).toLocaleDateString()} • {session.total_questions} qs</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: session.accuracy >= 50 ? '#10b981' : '#ef4444' }}>{session.score}/{session.total_questions}</div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'lowercase' }}>{session.accuracy}% accuracy</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {configStep === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16, marginBottom: 40 }}>
                {[
                  { n: 10, label: 'small batch', desc: 'quick drill', color: '#14b8a6', icon: <Zap size={20} /> },
                  { n: 20, label: 'standard run', desc: 'daily goal', color: '#7a12cc', icon: <BarChart3 size={20} /> },
                  { n: 50, label: 'the marathon', desc: 'deep dive', color: '#f59e0b', icon: <Flame size={20} /> },
                  { n: 100, label: 'cbt simulator', desc: 'exam ready', color: '#ef4444', icon: <Trophy size={20} /> }
                ].map((item) => {
                  const isSelected = examQs === item.n;
                  return (
                    <motion.button
                      key={item.n} whileHover={{ y: -3, boxShadow: `0 16px 40px -8px ${item.color}20` }} whileTap={{ scale: 0.97 }}
                      onClick={() => setExamQs(item.n)}
                      style={{
                        padding: isMobile ? '16px 20px' : '24px', borderRadius: 16, background: 'white', textAlign: 'left', cursor: 'pointer', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', border: isSelected ? `2px solid ${item.color}` : '1.5px solid #e5e7eb', color: isSelected ? item.color : '#555', boxShadow: isSelected ? `0 4px 16px ${item.color}25` : '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 10, textTransform: 'lowercase'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, border: `1.5px solid ${item.color}30` }}>
                          {item.icon}
                        </div>
                        {isSelected && (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={16} color="#fff" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 2 }}>{item.n} <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>qs</span></div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{item.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 4 }}>{item.desc}</div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {configStep === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16, marginBottom: 40 }}>
                {[
                  { v: 0, l: 'no limit', sub: 'study mode', color: '#14b8a6', icon: <BookOpen size={20} /> },
                  { v: 5, l: '5s / q', sub: 'flash zone', color: '#ef4444', icon: <Zap size={20} /> },
                  { v: 10, l: '10s / q', sub: 'very fast', color: '#f97316', icon: <Flame size={20} /> },
                  { v: 15, l: '15s / q', sub: 'fast pace', color: '#f59e0b', icon: <Clock size={20} /> },
                  { v: 30, l: '30s / q', sub: 'standard', color: '#7a12cc', icon: <BarChart3 size={20} /> },
                  { v: 60, l: '60s / q', sub: 'deep work', color: '#6366f1', icon: <Star size={20} /> }
                ].map((t) => {
                  const isSelected = examTimer === t.v;
                  return (
                    <motion.button
                      key={t.v} whileHover={{ y: -3, boxShadow: `0 16px 40px -8px ${t.color}20` }} whileTap={{ scale: 0.97 }}
                      onClick={() => setExamTimer(t.v)}
                      style={{
                        padding: isMobile ? '16px 20px' : '24px', borderRadius: 16, background: 'white', textAlign: 'left', cursor: 'pointer', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', border: isSelected ? `2px solid ${t.color}` : '1.5px solid #e5e7eb', color: isSelected ? t.color : '#555', boxShadow: isSelected ? `0 4px 16px ${t.color}25` : '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 10, textTransform: 'lowercase'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color, border: `1.5px solid ${t.color}30` }}>
                          {t.icon}
                        </div>
                        {isSelected && (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={16} color="#fff" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#111', marginBottom: 2 }}>{t.l}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{t.sub}</div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {configStep === 4 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                gap: 20, 
                marginBottom: 40 
              }}>
                {[
                  { 
                    id: 'feedback',
                    title: 'instant feedback', 
                    desc: 'see correct/incorrect answers immediately after each question',
                    icon: <Zap size={28} />,
                    active: instantFeedback,
                    toggle: () => setInstantFeedback(!instantFeedback)
                  },
                  { 
                    id: 'truefalse',
                    title: 'true/false questions', 
                    desc: 'include true/false questions in your exam mix for variety',
                    icon: <CheckCircle2 size={28} />,
                    active: includeTrueFalse,
                    toggle: () => setIncludeTrueFalse(!includeTrueFalse)
                  },
                  { 
                    id: 'typein',
                    title: 'type-in answers', 
                    desc: 'luter will provide questions and you type your answers manually',
                    icon: <MessageSquare size={28} />,
                    active: includeTypeIn,
                    toggle: () => setIncludeTypeIn(!includeTypeIn)
                  }
                ].map((option) => (
                  <motion.div
                    key={option.id}
                    onClick={option.toggle}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: 'white',
                      border: option.active ? '2px solid var(--primary)' : '1.5px solid #E2E8F0',
                      borderRadius: 24,
                      padding: '32px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: option.active ? '6px 6px 0px 0px rgba(151, 24, 251, 0.1)' : '4px 4px 0px 0px #F8FAFC',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 24,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Active indicator background */}
                    {option.active && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--primary)' }} />
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: 18, 
                        background: option.active ? 'var(--primary-bg)' : '#f8fafc',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: option.active ? 'var(--primary)' : '#94a3b8',
                        border: option.active ? '1.5px solid var(--primary)' : '1.5px solid #E2E8F0',
                      }}>
                        {option.icon}
                      </div>

                      {/* Custom Toggle Switch */}
                      <div style={{
                        width: 52,
                        height: 30,
                        background: option.active ? 'var(--primary)' : '#f1f5f9',
                        borderRadius: 99,
                        position: 'relative',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1.5px solid #E2E8F0'
                      }}>
                        <motion.div 
                          animate={{ x: option.active ? 22 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          style={{
                            position: 'absolute',
                            top: 2,
                            width: 22,
                            height: 22,
                            background: 'white',
                            borderRadius: '50%',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            border: '1px solid #E2E8F0'
                          }} 
                        />
                      </div>
                    </div>

                    <div>
                      <h3 style={{ 
                        fontSize: 18, 
                        fontWeight: 900, 
                        color: '#111', 
                        margin: '0 0 8px', 
                        textTransform: 'lowercase',
                        letterSpacing: '-0.01em'
                      }}>
                        {option.title}
                      </h3>
                      <p style={{ 
                        fontSize: 14, 
                        color: '#64748b', 
                        lineHeight: 1.5, 
                        margin: 0,
                        fontWeight: 500,
                        textTransform: 'lowercase'
                      }}>
                        {option.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Floating Config Footer */}
        <div style={{ background: '#ffffff', padding: isMobile ? '16px 20px' : '20px 40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', position: isMobile ? 'fixed' : 'relative', bottom: 0, left: 0, right: 0, zIndex: 100, borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '100%', maxWidth: (configStep === 1 || configStep === 4) ? 900 : 560, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <motion.button
              whileHover={configStep !== 1 ? { scale: 1.02 } : {}}
              whileTap={configStep !== 1 ? { scale: 0.98 } : {}}
              disabled={configStep===1}
              onClick={() => setConfigStep(c=>c-1)}
              style={{ padding: isMobile ? '10px 18px' : '12px 28px', borderRadius: 12, background: 'white', color: '#111', border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 600, cursor: configStep===1?'not-allowed':'pointer', opacity: configStep===1?0.4:1, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', fontFamily: 'inherit', textTransform: 'lowercase' }}
            >
              <ArrowLeft size={16} /> {isMobile ? '' : 'back'}
            </motion.button>

            {/* Step Indicators */}
            <div style={{ display:'flex', alignItems: 'center', gap: 8 }}>
              {[1,2,3,4].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: s === configStep ? '#7a12cc' : (s < configStep ? '#d1fae5' : '#f1f5f9'),
                    color: s === configStep ? 'white' : (s < configStep ? '#059669' : '#94a3b8'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    border: s < configStep ? '1.5px solid #a7f3d0' : (s === configStep ? 'none' : '1.5px solid #e2e8f0')
                  }}>
                    {s < configStep ? <CheckCircle2 size={14} /> : s}
                  </div>
                  {s < 4 && <div style={{ width: 16, height: 2, borderRadius: 1, background: s < configStep ? '#a7f3d0' : '#e2e8f0', transition: 'all 0.3s' }} />}
                </div>
              ))}
            </div>

            <motion.button
              whileHover={isStepReady && !isGenerating ? { scale: 1.02 } : {}}
              whileTap={isStepReady && !isGenerating ? { scale: 0.98 } : {}}
              onClick={() => { if (configStep < 4) setConfigStep(c=>c+1); else generateQuestions() }}
              disabled={!isStepReady || isGenerating}
              style={{ padding: isMobile ? '10px 18px' : '12px 28px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700, cursor: (!isStepReady || isGenerating)?'not-allowed':'pointer', opacity: (!isStepReady || isGenerating)?0.5:1, boxShadow: (isStepReady && !isGenerating) ? '0 4px 14px rgba(122, 18, 204, 0.25)' : 'none', background: (isStepReady && !isGenerating) ? '#7a12cc' : '#f1f5f9', color: (isStepReady && !isGenerating) ? 'white' : '#64748b', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', fontFamily: 'inherit', textTransform: 'lowercase' }}
            >
              {isGenerating ? <Loader2 className="animate-spin" size={16} /> : null}
              {configStep === 4 ? (isGenerating ? 'generating' : 'generate exam') : 'next'}
              <ArrowRight size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  const renderExam = () => {
    const q = currentQuestion || { question: 'loading...', options: [], answer: 0 }
    const userAns = selected[current]
    const isCorrectAnswer = q.type === 'typein' 
      ? (typeInAnswers[current]?.trim()?.toLowerCase() || '') === (q.expectedAnswer?.toLowerCase() || '')
      : userAns == q.answer;

    return (
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#1A3A32', position: 'relative' }}>
        
        {/* Exit Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMode('configure')}
          style={{ position: 'absolute', top: 24, left: 24, background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer', color: '#64748b', zIndex: 20, width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#111'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
        >
          <X size={22} strokeWidth={2} />
        </motion.button>

        {/* Exam Header with Timer */}
        <div id="tour-exam-timer" style={{ padding: isMobile ? '20px 20px 8px' : '28px 40px 8px', background: 'transparent', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', color: '#16a34a', padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, border: '1.5px solid #bbf7d0', boxShadow: '0 4px 12px rgba(22,163,74,0.08)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: timeLeft < 10 ? '#ef4444' : '#22c55e', animation: timeLeft < 10 ? 'pulse 1s infinite' : 'none' }} />
            <Clock size={14} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Exam Content */}
        <div style={{ flex: 1, padding: isMobile ? '20px 16px 40px' : '20px 40px 60px 40px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflowY: 'auto' }}>
          <motion.div key={current} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Question Card */}
            <motion.div
              id="tour-exam-engine"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderRadius: 20, padding: '28px', marginBottom: 32, boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)', border: '1px solid #a7f3d0', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontSize: 13, fontWeight: 800 }}>
                  {current + 1}
                </div>
                <h2 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 600, color: '#065f46', margin: 0, lineHeight: 1.6 }}>{q.question}</h2>
              </div>
            </motion.div>

            {/* Answer Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, width: '100%' }}>
              {/* Multiple Choice Options */}
              {q.type === 'multiple' && q.options && q.options.length > 0 && q.options.map((opt, i) => {
                const isSelected = selected[current] === i
                const showFeedbackState = instantFeedback && isAnswered
                const isCorrectOption = showFeedbackState && i === q.answer
                const isWrongOption = showFeedbackState && isSelected && i !== q.answer
                const letterColors = ['#7a12cc', '#8b5cf6', '#6366f1', '#14b8a6']
                const letterColor = letterColors[i % letterColors.length]

                return (
                  <motion.button
                    key={i} whileHover={{ y: isAnswered ? 0 : -2, boxShadow: isAnswered ? 'none' : '0 8px 24px rgba(0,0,0,0.08)' }} whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                    onClick={() => !isAnswered && choose(i)}
                    disabled={isAnswered}
                    style={{ padding: '18px 20px', borderRadius: 14, background: isCorrectOption ? '#f0fdf4' : isWrongOption ? '#fef2f2' : (isSelected && !instantFeedback ? '#f5f3ff' : '#ffffff'), textAlign: 'left', cursor: isAnswered ? 'default' : 'pointer', outline: 'none', transition: 'all 0.2s ease', fontFamily: 'inherit', border: isCorrectOption ? '2px solid #22c55e' : isWrongOption ? '2px solid #ef4444' : (isSelected && !instantFeedback ? '2px solid #7a12cc' : '1.5px solid #e2e8f0'), color: '#111827', boxShadow: isSelected && !isAnswered ? `0 4px 12px ${letterColor}20` : '0 2px 8px rgba(0,0,0,0.03)', fontWeight: 500, position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: isCorrectOption ? '#dcfce7' : isWrongOption ? '#fee2e2' : (isSelected && !instantFeedback ? `${letterColor}15` : '#f8fafc'),
                      color: isCorrectOption ? '#16a34a' : isWrongOption ? '#dc2626' : (isSelected && !instantFeedback ? letterColor : '#94a3b8'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, flexShrink: 0,
                      border: isSelected || isCorrectOption || isWrongOption ? `1.5px solid ${isCorrectOption ? '#86efac' : isWrongOption ? '#fca5a5' : letterColor + '40'}` : '1.5px solid #e2e8f0'
                    }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span style={{ fontSize: 15, flex: 1, lineHeight: 1.5 }}>{opt}</span>
                    {isCorrectOption && <CheckCircle2 size={22} strokeWidth={2} color="#22c55e" />}
                    {isWrongOption && <XCircle size={22} strokeWidth={2} color="#ef4444" />}
                  </motion.button>
                )
              })}

              {/* True/False Options */}
              {q.type === 'truefalse' && [1, 0].map((i) => {
                const isSelected = selected[current] === i
                const showFeedbackState = instantFeedback && isAnswered
                const isCorrectOption = showFeedbackState && i === q.answer
                const isWrongOption = showFeedbackState && isSelected && i !== q.answer
                const label = i === 1 ? 'true' : 'false'
                const tfColors = { true: '#22c55e', false: '#ef4444' }
                const tfColor = i === 1 ? '#22c55e' : '#ef4444'

                return (
                  <motion.button
                    key={i} whileHover={{ y: isAnswered ? 0 : -2, boxShadow: isAnswered ? 'none' : '0 8px 24px rgba(0,0,0,0.08)' }} whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                    onClick={() => !isAnswered && choose(i)}
                    disabled={isAnswered}
                    style={{ padding: '18px 20px', borderRadius: 14, background: isCorrectOption ? '#f0fdf4' : isWrongOption ? '#fef2f2' : (isSelected && !instantFeedback ? '#f5f3ff' : '#ffffff'), textAlign: 'left', cursor: isAnswered ? 'default' : 'pointer', outline: 'none', transition: 'all 0.2s ease', fontFamily: 'inherit', border: isCorrectOption ? '2px solid #22c55e' : isWrongOption ? '2px solid #ef4444' : (isSelected && !instantFeedback ? '2px solid #7a12cc' : '1.5px solid #e2e8f0'), color: '#111827', boxShadow: isSelected && !isAnswered ? `0 4px 12px ${tfColor}20` : '0 2px 8px rgba(0,0,0,0.03)', fontWeight: 500, position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: isCorrectOption ? '#dcfce7' : isWrongOption ? '#fee2e2' : (isSelected && !instantFeedback ? `${tfColor}15` : '#f8fafc'),
                      color: isCorrectOption ? '#16a34a' : isWrongOption ? '#dc2626' : (isSelected && !instantFeedback ? tfColor : '#94a3b8'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, flexShrink: 0,
                      border: isSelected || isCorrectOption || isWrongOption ? `1.5px solid ${isCorrectOption ? '#86efac' : isWrongOption ? '#fca5a5' : tfColor + '40'}` : '1.5px solid #e2e8f0'
                    }}>
                      {i === 1 ? 'T' : 'F'}
                    </div>
                    <span style={{ fontSize: 15, flex: 1, lineHeight: 1.5, textTransform: 'lowercase' }}>{label}</span>
                    {isCorrectOption && <CheckCircle2 size={22} strokeWidth={2} color="#22c55e" />}
                    {isWrongOption && <XCircle size={22} strokeWidth={2} color="#ef4444" />}
                  </motion.button>
                )
              })}

              {/* Type-in Answer (Boss Level) */}
              {(q.type === 'typein' || (q.type === 'multiple' && (!q.options || q.options.length === 0))) && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <textarea 
                    placeholder="type your answer here..." 
                    value={typeInAnswers[current] || ''} 
                    onChange={(e) => setTypeInAnswers(prev => ({ ...prev, [current]: e.target.value }))} 
                    disabled={isAnswered} 
                    style={{ 
                      width: '100%', 
                      minHeight: 120, 
                      padding: '20px 24px', 
                      borderRadius: 12, 
                      background: '#ffffff', 
                      border: isAnswered ? (instantFeedback ? '1.5px solid #2D8A4E' : '1.5px solid #E2E8F0') : '1.5px solid #E2E8F0', 
                      fontSize: 16, 
                      fontFamily: 'inherit', 
                      color: '#1A3A32', 
                      outline: 'none', 
                      resize: 'none', 
                      transition: 'all 0.2s ease', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.02)' 
                    }} 
                  />
                  {!isAnswered && (
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (typeInAnswers[current]?.trim()) {
                          setSelected(prev => ({ ...prev, [current]: 1 }));
                        }
                      }}
                      style={{
                        padding: '12px 32px',
                        borderRadius: 16,
                        background: typeInAnswers[current]?.trim() ? 'var(--primary)' : '#f1f5f9',
                        color: typeInAnswers[current]?.trim() ? 'white' : '#94a3b8',
                        border: 'none',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: typeInAnswers[current]?.trim() ? 'pointer' : 'not-allowed',
                        alignSelf: 'flex-end',
                        transition: 'all 0.2s ease',
                        textTransform: 'lowercase'
                      }}
                    >
                      submit answer
                    </motion.button>
                  )}
                  {isAnswered && instantFeedback && (
                    <div style={{ background: '#F0FDF4', padding: '20px', borderRadius: 16, border: '1.5px solid #22C55E' }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: '#166534', marginBottom: 8, textTransform: 'lowercase' }}>expected answer:</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#14532d' }}>{q.expectedAnswer || "No answer provided by Luter"}</div>
                    </div>
                  )}
                </div>
              )}
              
              {!isAnswered && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => choose(-1)} style={{ alignSelf: 'center', marginTop: 8, padding: '10px 22px', borderRadius: 99, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'lowercase', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)' }}>
                  <X size={14} /> i don't know this one
                </motion.button>
              )}
            </div>

            {/* Utility Bar (In-flow) */}
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? 8 : 12,
              padding: '32px 0', width: '100%'
            }}>
              {[
                { id: 'like', icon: <ThumbsUp size={20} strokeWidth={1.5} />, action: () => handleLike(current), active: likedQuestions[current], activeColor: '#22c55e', bg: '#dcfce7' },
                { id: 'dislike', icon: <ThumbsDown size={20} strokeWidth={1.5} />, action: () => handleDislike(current), active: dislikedQuestions[current], activeColor: '#ef4444', bg: '#fee2e2' },
                { id: 'chat', icon: <MessageCircle id="tour-ai-review" size={20} strokeWidth={1.5} />, action: handleAiChat, activeColor: '#7a12cc', bg: '#f5f3ff' },
                { id: 'search', icon: <Search size={20} strokeWidth={1.5} />, action: () => handleSearchAction(q), activeColor: '#3b82f6', bg: '#dbeafe' },
                { id: 'share', icon: <Share2 size={20} strokeWidth={1.5} />, action: () => handleShare(q), activeColor: '#f59e0b', bg: '#fef3c7' },
                { id: 'gift', icon: <Gift size={20} strokeWidth={1.5} />, action: handleGiftAction, activeColor: '#ec4899', bg: '#fce7f3' },
                { id: 'delete', icon: <Trash2 size={20} strokeWidth={1.5} />, action: () => handleDelete(current), activeColor: '#64748b', bg: '#f1f5f9' },
                { id: 'more', icon: <MoreHorizontal size={20} strokeWidth={1.5} />, action: () => setShowMoreOptions(!showMoreOptions), activeColor: '#111827', bg: '#f1f5f9' }
              ].map((item) => (
                <div key={item.id} style={{ position: 'relative' }}>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={item.action}
                    style={{
                      background: item.active ? item.bg : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: item.active ? item.activeColor : '#94a3b8',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 12
                    }}
                    onMouseEnter={(e) => { if (!item.active) { e.currentTarget.style.background = item.bg; e.currentTarget.style.color = item.activeColor; }}}
                    onMouseLeave={(e) => { if (!item.active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
                  >
                    {item.icon}
                  </motion.button>

                  {/* More Options Popover */}
                  {item.id === 'more' && (
                    <AnimatePresence>
                      {showMoreOptions && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          style={{ 
                            position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 12,
                            background: 'white', borderRadius: 16, border: '1.5px solid #E2E8F0',
                            padding: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            display: 'flex', flexDirection: 'column', gap: 4, zIndex: 50, minWidth: 160
                          }}
                        >
                          {[
                            { label: 'report issue', icon: <X size={16} /> },
                            { label: 'save to backpack', icon: <Star size={16} /> },
                            { label: 'view discussion', icon: <Users size={16} /> }
                          ].map((opt, i) => (
                            <button key={i} onClick={() => { alert(`Action: ${opt.label}`); setShowMoreOptions(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1A3A32', textAlign: 'left', transition: 'background 0.2s', textTransform: 'lowercase', fontFamily: 'inherit' }}>
                              <span style={{ color: '#94A3B8' }}>{opt.icon}</span>
                              {opt.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tactile Footer */}
        <div style={{ 
          background: '#F0FDF4', 
          padding: isMobile ? '24px 20px 40px' : '32px 40px 48px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 100, 
          position: 'sticky', 
          bottom: 0, 
          width: '100%', 
          borderTop: '1px solid #E2E8F0',
          marginTop: 'auto'
        }}>
          <div style={{ width: '100%', maxWidth: 560, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              disabled={current === 0} 
              onClick={() => setCurrent(c => c - 1)} 
              style={{ 
                padding: '10px 32px', 
                borderRadius: 16, 
                background: '#ffffff', 
                color: '#1A3A32', 
                border: '1.5px solid #4A5568', 
                fontSize: 14, 
                fontWeight: 500, 
                cursor: current === 0 ? 'not-allowed' : 'pointer', 
                opacity: current === 0 ? 0.5 : 1, 
                boxShadow: '4px 4px 0px 0px rgba(74, 85, 104, 1)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                transition: 'all 0.1s', 
                fontFamily: 'inherit', 
                textTransform: 'lowercase' 
              }}
            >
              <ArrowLeft size={18} strokeWidth={1.5} /> back
            </button>
            
            <div style={{ fontSize: 14, fontWeight: 500, color: '#4A5568', textTransform: 'lowercase' }}>
              {current + 1} of {generatedQuestions?.length}
            </div>

            {!isAnswered ? (
              <button 
                onClick={next} 
                style={{ 
                  padding: '10px 32px', 
                  borderRadius: 16, 
                  background: '#ffffff', 
                  color: '#1A3A32', 
                  border: '1.5px solid #4A5568', 
                  fontSize: 14, 
                  fontWeight: 500, 
                  cursor: 'pointer', 
                  boxShadow: '4px 4px 0px 0px rgba(74, 85, 104, 1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  transition: 'all 0.1s', 
                  fontFamily: 'inherit', 
                  textTransform: 'lowercase' 
                }}
              >
                {current >= (generatedQuestions?.length || 1) - 1 ? 'finish' : 'skip'} <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                {instantFeedback && !isCorrectAnswer && (
                  <button 
                    onClick={() => explainWithTutor(q, false, userAns)} 
                    style={{ 
                      padding: '10px 24px', 
                      borderRadius: 16, 
                      background: '#2D8A4E', 
                      color: '#ffffff', 
                      border: '1.5px solid #1A3A32', 
                      fontSize: 14, 
                      fontWeight: 700, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      transition: 'all 0.1s', 
                      fontFamily: 'inherit', 
                      textTransform: 'lowercase' 
                    }}
                  >
                    explain my mistake
                  </button>
                )}
                <button 
                  onClick={next} 
                  style={{ 
                    padding: '10px 24px', 
                    borderRadius: 16, 
                    background: '#DCFCE7', 
                    color: '#2D8A4E', 
                    border: '1.5px solid #2D8A4E', 
                    fontSize: 14, 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    transition: 'all 0.1s', 
                    fontFamily: 'inherit', 
                    textTransform: 'lowercase',
                    boxShadow: '4px 4px 0px 0px rgba(45, 138, 78, 0.2)'
                  }}
                >
                  {current >= (generatedQuestions?.length || 1) - 1 ? 'finish' : 'next question'} <ArrowRight size={18} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderResult = () => {
    return (
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: isMobile ? '20px 12px 100px' : '20px 20px 100px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ width: '100%', maxWidth: 520, marginTop: isMobile ? '0' : '2vh' }}>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 40, display: 'flex', justifyContent: 'center' }}>
              <LuterLogo size={isMobile ? 40 : 52} fontSize={isMobile ? 32 : 40} />
            </div>
            <div ref={resultRef} style={{ background: '#fff', borderRadius: 24, padding: isMobile ? 12 : 2, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.8 }}>
                <svg style={{ position: 'absolute', top: -10, left: '5%', transform: 'rotate(-10deg)' }} width="40" height="150" viewBox="0 0 40 150"><path d="M10 0 Q 30 25 10 50 Q -10 75 10 100 Q 30 125 10 150" fill="none" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" /></svg>
                <svg style={{ position: 'absolute', top: 20, right: '12%', transform: 'rotate(15deg)' }} width="40" height="180" viewBox="0 0 40 180"><path d="M20 0 Q 0 30 20 60 Q 40 90 20 120 Q 0 150 20 180" fill="none" stroke="#7a12cc" strokeWidth="4" strokeLinecap="round" opacity="0.5" /></svg>
              </div>
              <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32, position: 'relative', zIndex: 1 }}>
                <motion.div initial={{ rotate: -10, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} style={{ display: 'inline-block', marginBottom: isMobile ? 16 : 20 }}>
                  <div style={{ background: '#fffbeb', border: '1.5px solid #fbbf24', padding: isMobile ? '12px 16px' : '16px 24px', borderRadius: 20, boxShadow: '0 8px 16px rgba(251, 191, 36, 0.2)', display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                    <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}><Zap size={isMobile ? 20 : 28} fill="#fbbf24" color="#d97706" /></motion.div>
                    <div style={{ textAlign: 'left', display: 'flex', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#d97706', textTransform: 'lowercase', letterSpacing: '0.05em' }}>daily reward</div>
                        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 1000, color: '#111', lineHeight: 1 }}>+{score * 50} xp</div>
                      </div>
                      <div style={{ borderLeft: '1px solid #fcd34d', paddingLeft: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#d97706', textTransform: 'lowercase', letterSpacing: '0.05em' }}>coins earned</div>
                        <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 1000, color: '#f59e0b', lineHeight: 1 }}>+{score * 10} coins</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ fontSize: isMobile ? 28 : 36, fontWeight: 1000, color: '#111', margin: '0 0 4px', letterSpacing: '-0.04em', textTransform: 'lowercase' }}>{pass ? 'incredible work!' : 'keep going!'}</motion.h2>
                <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ fontSize: isMobile ? 14 : 16, color: '#555', fontWeight: 600, margin: 0, textTransform: 'lowercase' }}>{isMobile ? 'session complete 🎯' : `you completed your ${examCourses[0]?.name || 'mock exam'} session`}</motion.p>
              </div>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ delay: 0.4, type: "spring" }} 
                style={{ 
                  background: '#ECFDF5', 
                  borderRadius: 40, 
                  padding: isMobile ? '40px 24px' : '48px 40px', 
                  marginBottom: 40, 
                  position: 'relative', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  minHeight: isMobile ? 200 : 260,
                  overflow: 'visible',
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.02)'
                }}
              >
                {/* Left Section: Score */}
                <div style={{ flex: 1, textAlign: 'left', zIndex: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#4A5568', textTransform: 'lowercase', marginBottom: 8, letterSpacing: '0.02em', opacity: 0.8 }}>
                    final exam score
                  </div>
                  <div style={{ fontSize: isMobile ? 64 : 110, fontWeight: 1000, color: '#111', lineHeight: 1, display: 'flex', alignItems: 'baseline', letterSpacing: '-0.04em' }}>
                    {score}<span style={{ fontSize: isMobile ? 28 : 48, color: '#D1D5DB', marginLeft: 4 }}>/{generatedQuestions?.length || 1}</span>
                  </div>
                  <div style={{ marginTop: 24, fontSize: isMobile ? 18 : 22, fontWeight: 1000, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {pass ? 'Smashed it! 🎉' : 'Keep going! 💪'}
                  </div>
                </div>

                {/* Right Section: Mascot BREAKOUT */}
                <div style={{ 
                  position: 'absolute', 
                  right: isMobile ? -30 : -80, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  width: isMobile ? 220 : 380,
                  pointerEvents: 'none'
                }}>
                  <motion.img 
                    initial={{ x: 30, opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring', damping: 15 }}
                    src="/mock-session-mascot.png" 
                    alt="Mascot" 
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </motion.div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16, marginBottom: 24 }}>
                {[
                  { label: 'accuracy', value: `${Math.round((score/(generatedQuestions?.length || 1))*100)}%`, icon: <BarChart3 size={18} />, color: '#7a12cc' },
                  { label: 'streak', value: pass ? '+1 day' : 'paused', icon: <Flame size={18} />, color: '#ef4444' },
                  { label: 'performance', value: score > (generatedQuestions?.length || 1)/2 ? 'master' : 'student', icon: <Star size={18} />, color: '#fbbf24' },
                  { label: 'next target', value: score === (generatedQuestions?.length || 1) ? '100%' : `${generatedQuestions?.length || 1}/${generatedQuestions?.length || 1}`, icon: <Zap size={18} />, color: '#22c55e' }
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 + (i * 0.1) }} style={{ padding: '20px', borderRadius: 20, background: 'white', border: '1.5px solid #eee', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: stat.color }}>{stat.icon}<span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', opacity: 0.8, textTransform: 'lowercase' }}>{stat.label}</span></div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: '#111', textTransform: 'lowercase' }}>{stat.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* AI Weakness Analysis */}
              <AnimatePresence>
                {aiWeaknessAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ background: '#f8fafc', borderRadius: 20, border: '1.5px solid #e2e8f0', padding: '20px', marginBottom: 24, overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: '#7a12cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Zap size={18} />
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: 0, textTransform: 'lowercase' }}>luter insight: where to focus</h3>
                    </div>
                    <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px 0', lineHeight: 1.5, fontWeight: 500 }}>
                      <span style={{ fontWeight: 800, color: '#7a12cc' }}>weakness:</span> {aiWeaknessAnalysis.weakness}
                    </p>
                    <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                      <span style={{ fontWeight: 800, color: '#10b981' }}>advice:</span> {aiWeaknessAnalysis.recommendation}
                    </p>
                  </motion.div>
                )}
                {isAnalyzingWeakness && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px', background: '#f8fafc', borderRadius: 20, marginBottom: 24 }}>
                    <Loader2 className="animate-spin" size={20} color="#7a12cc" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'lowercase' }}>luter is analyzing your session...</span>
                  </div>
                )}
              </AnimatePresence>

              {/* Review Section */}
              <div style={{ marginTop: 12 }}>
                <button 
                  onClick={() => setShowReview(!showReview)}
                  style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'white', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 800, color: '#1A3A32', cursor: 'pointer', textTransform: 'lowercase', transition: 'all 0.2s' }}
                >
                  <BookOpen size={20} /> {showReview ? 'hide review' : 'view detailed review'}
                </button>

                <AnimatePresence>
                  {showReview && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                        {generatedQuestions.map((q, idx) => {
                          const userAns = selected[idx];
                          const isCorrect = q.type === 'typein' 
                            ? (typeInAnswers[idx]?.trim()?.toLowerCase() || '') === (q.expectedAnswer?.toLowerCase() || '')
                            : userAns === q.answer;
                          
                          return (
                            <div key={idx} style={{ padding: '16px', borderRadius: 16, background: isCorrect ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${isCorrect ? '#dcfce7' : '#fee2e2'}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0, lineHeight: 1.5 }}>{idx + 1}. {q.question}</p>
                                {isCorrect ? <CheckCircle2 size={18} color="#22c55e" /> : <XCircle size={18} color="#ef4444" />}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'lowercase' }}>
                                {q.type === 'typein' ? (
                                  <>your answer: <span style={{ color: isCorrect ? '#166534' : '#991b1b' }}>{typeInAnswers[idx] || 'none'}</span></>
                                ) : (
                                  <>your answer: <span style={{ color: isCorrect ? '#166534' : '#991b1b' }}>{userAns === -1 ? 'skipped' : (q.type === 'truefalse' ? (userAns === 1 ? 'true' : 'false') : q.options[userAns])}</span></>
                                )}
                              </div>
                              {!isCorrect && (
                                <div style={{ fontSize: 12, color: '#166534', fontWeight: 700, marginTop: 4, textTransform: 'lowercase' }}>
                                  correct: {q.type === 'typein' ? q.expectedAnswer : (q.type === 'truefalse' ? (q.answer === 1 ? 'true' : 'false') : q.options[q.answer])}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {/*Retake and Share*/}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
              <button 
                onClick={() => navigate(`/exam-session/${currentSessionId}`)}
                disabled={!currentSessionId}
                style={{ width: '100%', padding: '18px', borderRadius: 20, background: '#111', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 900, fontSize: 16 }}
              >
                <BarChart3 size={22} /> View Full Performance Analysis
              </button>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setMode('configure'); setConfigStep(1); setCurrent(0); setSelected({}); setExamCourses(preselectedCourse ? [preselectedCourse] : []); setHasPersistedResults(false); setAiWeaknessAnalysis(null); setShowReview(false); setCurrentSessionId(null); }} style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#f8f8f8', color: '#111', border: '1.5px solid #111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 900, textTransform: 'lowercase' }}><RotateCcw size={20} /> retake</button>
                <button onClick={handleResultShare} disabled={isSharing} style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#7a12cc', color: 'white', border: '1.5px solid #111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 900, textTransform: 'lowercase' }}>{isSharing ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />} share proof</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  // --- MAIN RENDER ---

  return (
    <div className="dh-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', 'Outfit', sans-serif", position: 'relative' }}>

      {/* Plan gate — Free users */}
      {!canMockExam && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <LockedOverlay
            inline
            feature="Mock Exams"
            description="Test yourself with timed, full-length exams with AI-powered weakness analysis and tutoring. Upgrade to Pro to unlock."
            requiredPlan="Pro"
            onUpgrade={() => navigate('/upgrade')}
          />
        </div>
      )}

      {canMockExam && mode === 'configure' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, marginBottom: 8 }}>
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: 12,
            padding: 4,
            gap: 4
          }}>
            <button
              onClick={() => setActiveTab('arena')}
              style={{
                padding: '10px 24px',
                background: activeTab === 'arena' ? '#7a12cc' : 'transparent',
                color: activeTab === 'arena' ? '#fff' : '#64748b',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              Luter Arena
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '10px 24px',
                background: activeTab === 'history' ? '#fb923c' : 'transparent',
                color: activeTab === 'history' ? '#fff' : '#64748b',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              Session History
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Content based on mode — Pro/Beast only */}
      {canMockExam && mode === 'preparing' && renderPreparing()}
      {canMockExam && mode === 'configure' && (
        <AnimatePresence mode="wait">
          {activeTab === 'arena' ? (
            <motion.div
              key="arena"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderConfigure()}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div style={{ padding: '40px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                   <Trophy size={32} color="#7a12cc" />
                   <h2 style={{ fontSize: 24, fontWeight: 1000, margin: 0 }}>Your Mock Exam Legacy</h2>
                </div>
                
                {loadingHistory ? (
                  <div style={{ textAlign: 'center', padding: '100px 0' }}>
                     <Loader2 className="animate-spin" size={40} color="#7a12cc" />
                  </div>
                ) : pastSessions.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    style={{ textAlign: 'center', padding: '100px 40px', background: '#f8fafc', borderRadius: 32, border: '1.5px dashed #e2e8f0' }}
                  >
                     <BookOpen size={48} color="#cbd5e1" style={{ marginBottom: 20 }} />
                     <h3 style={{ fontSize: 18, fontWeight: 800, color: '#64748b' }}>No sessions yet</h3>
                     <p style={{ color: '#94a3b8', fontWeight: 500, marginTop: 8 }}>Complete your first mock exam to build your history!</p>
                     <button onClick={() => setActiveTab('arena')} style={{ marginTop: 24, padding: '12px 24px', background: '#111', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer' }}>Start Exam</button>
                  </motion.div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {pastSessions.map((session, i) => (
                      <motion.div 
                        key={session.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        whileHover={{ x: 6, borderColor: '#7a12cc' }}
                        onClick={() => navigate(`/exam-session/${session.id}`)} 
                        style={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                          padding: '24px', borderRadius: 24, border: '1.5px solid #E2E8F0', 
                          cursor: 'pointer', transition: 'all 0.2s', background: 'white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 18, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a12cc' }}>
                            <BarChart3 size={28} />
                          </div>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>{session.course_code}</div>
                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{session.course_name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginTop: 4 }}>{new Date(session.created_at).toLocaleDateString()} • {session.total_questions} questions</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 24, fontWeight: 1000, color: session.accuracy >= 50 ? '#10b981' : '#ef4444', lineHeight: 1 }}>{session.score}/{session.total_questions}</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'lowercase', marginTop: 8 }}>{session.accuracy}% accuracy</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      {mode === 'exam' && renderExam()}
      {mode === 'result' && renderResult()}

      {/* Shared Modals / Panels (Luter Chat & Feedback) */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '100%', maxWidth: 440, background: 'white', borderRadius: 32, padding: '32px', border: '1.5px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}
            >
              <button onClick={() => setShowShareModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: '#f8fafc', border: 'none', borderRadius: 12, padding: 8, cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 56, height: 56, background: '#f5f3ff', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#7a12cc' }}><Share2 size={28} /></div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: '0 0 8px', textTransform: 'lowercase' }}>share your win!</h2>
                <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, margin: 0, textTransform: 'lowercase' }}>choose how you want to share your progress.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button 
                  onClick={shareReviewLink}
                  disabled={isSavingSession}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%', opacity: isSavingSession ? 0.6 : 1 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a12cc' }}>{isSavingSession ? <Loader2 className="animate-spin" size={20} /> : <BookOpen size={20} />}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textTransform: 'lowercase' }}>share review link</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'lowercase' }}>{isSavingSession ? 'saving session...' : 'let others check your session'}</div>
                  </div>
                </button>

                <button 
                  onClick={copyImageToClipboard}
                  disabled={isSharing}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%', opacity: isSharing ? 0.6 : 1 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>{isSharing ? <Loader2 className="animate-spin" size={20} /> : <Award size={20} />}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textTransform: 'lowercase' }}>copy score card</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'lowercase' }}>copy result image to clipboard</div>
                  </div>
                </button>

                <button 
                  onClick={downloadResultImage}
                  disabled={isSharing}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%', opacity: isSharing ? 0.6 : 1 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><Zap size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textTransform: 'lowercase' }}>download image</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'lowercase' }}>save your result to your device</div>
                  </div>
                </button>

                <button 
                  onClick={shareViaWebShare}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}><Share2 size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textTransform: 'lowercase' }}>share</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'lowercase' }}>share via other apps</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiChatOpen && (
          <motion.div
            initial={{ x: 360, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '360px', background: '#FFFFFF', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', zIndex: 1000, fontFamily: "'Outfit', 'Outfit', sans-serif" }}
          >
            {/* Luter Chat Panel Content */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E5E7EB', flexShrink: 0, gap: 8 }}>
              <div style={{
                display: 'flex',
                background: '#f1f5f9',
                borderRadius: 10,
                padding: 3,
                gap: 3
              }}>
                {[{ id: 'chat', label: 'chat' }, { id: 'source', label: 'view source' }].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAiChatMode(tab.id)}
                    style={{
                      background: aiChatMode === tab.id ? '#7a12cc' : 'transparent',
                      color: aiChatMode === tab.id ? '#fff' : '#64748b',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: "'Outfit', sans-serif",
                      textTransform: 'lowercase'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <button onClick={() => setAiChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#6B7280', display: 'flex', alignItems: 'center', borderRadius: 8, transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}><X size={18} /></button>
            </div>
            <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              {aiChatMessages.filter(m => m.role !== 'system').length === 0 ? (
                <div>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px 0', fontWeight: 500, textTransform: 'lowercase' }}>suggested questions</p>
                  {SUGGESTED_QUESTIONS.map((question, idx) => (
                    <button key={idx} onClick={() => sendAiMessage(question)} disabled={isAiLoading} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 0', border: 'none', borderBottom: '1px solid #E5E7EB', background: 'transparent', cursor: isAiLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s ease', textAlign: 'left', opacity: isAiLoading ? 0.6 : 1, fontFamily: 'inherit', textTransform: 'lowercase' }}>
                      <span style={{ fontSize: '14px', color: '#111827' }}>{question}</span>
                      <span style={{ color: '#9CA3AF', fontSize: '20px', lineHeight: 1, flexShrink: 0, marginLeft: '8px' }}>+</span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {aiChatMessages.filter(m => m.role !== 'system').map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                      <div style={{ 
                        background: msg.role === 'user' 
                          ? 'linear-gradient(135deg, #7a12cc 0%, #9718fb 100%)' 
                          : '#ffffff', 
                        color: msg.role === 'user' ? '#ffffff' : '#111827', 
                        padding: '12px 16px', 
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        fontSize: '13px', 
                        maxWidth: '85%', 
                        lineHeight: 1.5, 
                        display: 'inline-block',
                        boxShadow: msg.role === 'user' 
                          ? '0 4px 12px rgba(122, 18, 204, 0.3)' 
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
                        position: 'relative'
                      }}>
                        {msg.role === 'assistant' ? renderAiText(msg.content) : msg.content}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>{[0,1,2].map(i => (<motion.div key={i} animate={{ y: [0,-5,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i*0.15 }} style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#9CA3AF' }} />))}</div>}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB', background: '#FAFAFA', flexShrink: 0 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  value={aiChatInput} 
                  onChange={e => setAiChatInput(e.target.value)} 
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage() } }} 
                  placeholder="ask luter anything..." 
                  disabled={isAiLoading} 
                  style={{ 
                    width: '100%', 
                    height: '44px', 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '22px', 
                    padding: '0 48px 0 20px', 
                    fontSize: '14px', 
                    outline: 'none', 
                    boxSizing: 'border-box', 
                    fontFamily: 'inherit', 
                    color: '#111827',
                    background: '#ffffff',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }} 
                />
                <button 
                  onClick={() => sendAiMessage()} 
                  disabled={!aiChatInput.trim() || isAiLoading} 
                  style={{ 
                    position: 'absolute', 
                    right: '6px', 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '18px', 
                    background: aiChatInput.trim() && !isAiLoading 
                      ? 'linear-gradient(135deg, #7a12cc 0%, #9718fb 100%)' 
                      : '#e5e7eb', 
                    border: 'none', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: aiChatInput.trim() && !isAiLoading 
                      ? '0 4px 12px rgba(122, 18, 204, 0.3)' 
                      : 'none'
                  }}
                >
                  <ArrowRight size={16} color="white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFeedback && feedbackQuestion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '16px' : '40px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', background: 'white', borderRadius: 32, padding: isMobile ? '24px' : '40px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflowY: 'auto', position: 'relative' }}>
              <button onClick={() => { setShowFeedback(false); setFeedbackQuestion(null); }} style={{ position: 'absolute', top: 24, right: 24, width: 40, height: 40, borderRadius: 12, background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}><X size={20} /></button>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 64, height: 64, background: '#f5f3ff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#7c3aed' }}><FlaskConical size={32} /></div>
                <h2 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, color: '#111', marginBottom: 8, letterSpacing: '-0.02em', textTransform: 'lowercase' }}>no worries! let's learn.</h2>
                <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500, margin: 0, textTransform: 'lowercase' }}>here is the correct answer for this challenge.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                <div style={{ background: '#f8fafc', padding: '20px 24px', borderRadius: 20, border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 8, textTransform: 'lowercase', letterSpacing: '0.1em' }}>question</div>
                  <div style={{ fontSize: 16, color: '#1e293b', lineHeight: 1.6, fontWeight: 600 }}>{feedbackQuestion.question}</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '24px', borderRadius: 20, border: '2px solid #4ade80', boxShadow: '0 4px 12px rgba(74, 222, 128, 0.1)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', marginBottom: 10, textTransform: 'lowercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> correct answer</div>
                  <div style={{ fontSize: 18, color: '#14532d', lineHeight: 1.5, fontWeight: 800 }}>{feedbackQuestion.type === 'typein' ? feedbackQuestion.expectedAnswer : feedbackQuestion.type === 'truefalse' ? (feedbackQuestion.answer === 1 ? 'true' : 'false') : feedbackQuestion.options?.[feedbackQuestion.answer] || 'not specified'}</div>
                </div>
              </div>
              <motion.button whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => { setSelected(prev => ({ ...prev, [current]: -1 })); setShowFeedback(false); setFeedbackQuestion(null); setSelfAssessment(''); next(); }} style={{ width: '100%', padding: '18px 24px', borderRadius: 18, background: '#111', color: 'white', fontSize: 16, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', textTransform: 'lowercase' }}>continue journey <ArrowRight size={20} /></motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}