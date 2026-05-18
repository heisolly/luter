import { useState, useEffect, useRef } from 'react'
import { useOutletContext, useLocation } from 'react-router-dom'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { FlaskConical, Clock, CheckCircle2, XCircle, Search, Loader2, Zap, ArrowRight, ArrowLeft, Dices, Share2, Award, Trophy, RotateCcw, BarChart3, Flame, Star, Users, ThumbsUp, ThumbsDown, MessageCircle, Gift, Trash2, MoreHorizontal } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { toPng } from 'html-to-image'
import confetti from 'canvas-confetti'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import LuterLogo from '../shared/LuterLogo'

const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

// Sample course materials for AI generation
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
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch() || { ready: false, bundle: null }
  const location = useLocation()
  const preselectedCourse = location.state?.preselectedCourse
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('configure') // configure | exam | result
  const [configStep, setConfigStep] = useState(1) // 1: courses | 2: qs | 3: time
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState({})
  const [isSharing, setIsSharing] = useState(false)
  const resultRef = useRef(null)
  
  // Custom configurations
  const [examCourses, setExamCourses] = useState(preselectedCourse ? [preselectedCourse] : [])
  const [examQs, setExamQs] = useState(10)
  const [examTimer, setExamTimer] = useState(0) // 0 means untimed
  const [timeLeft, setTimeLeft] = useState(0)
  const [loadingStep, setLoadingStep] = useState(0)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

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

  useEffect(() => {
    if (preselectedCourse) {
      setExamCourses([preselectedCourse])
      setConfigStep(2)
    }
  }, [preselectedCourse])

  const toggleCourseConfig = (c) => {
    setExamCourses(p => p.find(x => x.id === c.id) ? p.filter(x => x.id !== c.id) : [...p, c])
  }

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

  const handleAiChat = (question) => {
    setAiChatOpen(true)
    setAiChatMessages([
      { role: 'system', content: 'You are a helpful tutor. Explain this question clearly.' },
      { role: 'user', content: `Question: ${question.question}\nOptions: ${question.options.join(', ')}` }
    ])
  }

  const sendAiMessage = async () => {
    if (!aiChatInput.trim()) return
    
    const userMessage = { role: 'user', content: aiChatInput }
    setAiChatMessages(prev => [...prev, userMessage])
    setAiChatInput('')
    setIsAiLoading(true)

    try {
      const response = await callGroqAPI(
        GROQ_MODELS.DEFAULT,
        [...aiChatMessages, userMessage].map(m => m.content).join('\n'),
        GROQ_PROMPTS.DEFAULT
      )
      
      setAiChatMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setAiChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setIsAiLoading(false)
    }
  }

  const score = Object.entries(selected).reduce((acc, [idx, ansIdx]) => acc + (ansIdx === (generatedQuestions[idx]?.answer ?? 0) ? 1 : 0), 0)
  const pass = score >= (generatedQuestions?.length || 1) / 2

  // ── Celebration Effect (Triggers on any completion) ──
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
      data.map((row, i) => ({
        ...row.course,
        color: PALETTE[i % PALETTE.length]
      }))

    const fetchCourses = async () => {
      const { data } = await supabase
        .from('user_courses')
        .select('course:courses(id, code, name, faculty)')
        .eq('user_id', user.id)

      if (data) setCourses(mapFromRows(data))
      setLoading(false)
    }

    if (bundle?.uc && !bundle.uc.error && Array.isArray(bundle.uc.data)) {
      setCourses(mapFromRows(bundle.uc.data))
      setLoading(false)
      return
    }
    fetchCourses()
  }, [user, ready, bundle])

  // Generate AI-powered questions
  const generateQuestions = async () => {
    if (examCourses.length === 0) return
    
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
        
        const prompt = `${GROQ_PROMPTS.MOCK_EXAM}\n\nCourse: ${course.code} - ${course.name}\n\nStudy Materials:\n${courseMaterial}\n\nGenerate exactly ${questionsToGenerate} questions.\n\nIMPORTANT: Return your response as a JSON object with this exact structure:\n{\n  "questions": [\n    {\n      "question": "question text here",\n      "options": ["option A", "option B", "option C", "option D"],\n      "correct_answer": 1,\n      "explanation": "explanation text here"\n    }\n  ]\n}\n\nDo NOT include any markdown formatting or code blocks. Return ONLY the JSON object.\n\n${existingQuestions.length > 0 ? `Existing questions: ${existingQuestions.length}. Generate ${questionsToGenerate} more questions.` : 'Generate: first batch of questions.'}`
        
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
        const formattedQuestions = allQuestions.map((q, idx) => ({
          id: idx,
          question: q.question,
          options: q.options,
          answer: q.correct_answer - 1, // Convert to 0-based index
          explanation: q.explanation
        }))
        
        setGeneratedQuestions(formattedQuestions)
      }
      setLoadingStep(2)
      
      // Simulate processing time for better UX
      setTimeout(() => {
        setLoadingStep(3)
        setTimeout(() => {
          setMode('exam')
          setCurrent(0)
          setSelected({})
          setIsGenerating(false)
          setLoadingStep(0)
        }, 1000)
      }, 2000)
      
    } catch (error) {
      console.error('Error generating questions:', error)
      // Fallback to sample questions if AI fails
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
          setIsGenerating(false)
          setLoadingStep(0)
        }, 500)
      }, 1000)
    }
  }

  const choose = (idx) => {
    setSelected(prev => ({ ...prev, [current]: idx }))
  }

  const next = () => {
    if (current < (generatedQuestions?.length || 1) - 1) {
      setCurrent(c => c + 1)
      if (examTimer > 0) setTimeLeft(examTimer)
    } else {
      setMode('result')
    }
  }

  useEffect(() => {
    let t = null;
    if (mode === 'exam' && examTimer > 0) {
      if (timeLeft > 0) {
        t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
      } else {
        next() // auto skip if timer hits 0
      }
    }
    return () => clearTimeout(t)
  }, [timeLeft, mode, examTimer, current])

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
        if (examTimer > 0) setTimeLeft(examTimer);
      }, 7000);
    }
    return () => { clearTimeout(t); clearInterval(int); };
  }, [mode, examTimer]);

  // if (loading) {
  //   return (
  //     <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
  //       <Loader2 className="animate-spin" size={28} color="var(--primary)" />
  //     </div>
  //   )
  // }

  if (mode === 'preparing') {
    const loadingStrings = [
      "reading your documents...",
      "processing luter knowledge...",
      "calibrating neural matrix...",
      "generating flash questions...",
      "almost ready..."
    ];
    return (
      <div className="dh-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
        
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
                style={{ height: '100%', background: 'var(--primary)', borderRadius: 99 }} 
            </div>
            
            {/* The Moving Element: A fun animated vessel alternative */}
            <motion.div
              initial={{ left: '20px' }}
              animate={{ left: 'calc(100% - 20px)' }}
              transition={{ duration: 7, ease: "linear" }}
              style={{ position: 'absolute', top: -50, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}
            >
              {/* Fire Exhaust */}
              <motion.div 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 40, marginRight: -8, zIndex: 0 }}
              >
                <motion.div 
                  animate={{ width: [12, 32, 12], opacity: [0.8, 1, 0.8] }} 
                  transition={{ duration: 0.2, repeat: Infinity }} 
                  style={{ height: 12, background: '#ef4444', borderRadius: '99px 0 0 99px', marginRight: -4 }} 
                />
                <motion.div 
                  animate={{ width: [6, 16, 6], opacity: [0.9, 1, 0.9] }} 
                  transition={{ duration: 0.15, repeat: Infinity, delay: 0.1 }} 
                  style={{ height: 6, background: '#f59e0b', borderRadius: '99px 0 0 99px' }} 
                />
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

  if (mode === 'configure') {
    const isStepReady = configStep === 1 ? examCourses.length > 0 : true;

    return (
      <div className="dh-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
        
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
          <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FlaskConical size={20} color="#111" /> {isMobile ? 'Exam Setup' : 'Mock Exam Setup'}
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
            boxShadow: '0 4px 12px rgba(217,119,6,0.1)' 
          }}>
            <Zap size={14} fill="#fbbf24" strokeWidth={0} /> {isMobile ? 'Configuring' : 'Configuration Stage'}
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
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: configStep === 1 ? (isMobile ? 500 : 900) : 560, display: 'flex', flexDirection: 'column' }}
          >
            {/* Heading */}
            <div style={{ background: '#eefaec', borderRadius: 12, padding: isMobile ? '20px' : '24px 28px', marginBottom: 24 }}>
              <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: '#222', margin: 0, lineHeight: 1.5 }}>
                {configStep === 1 && "Which courses do you want to pull questions from for this Mock Exam?"}
                {configStep === 2 && "How many questions do you want to attempt?"}
                {configStep === 3 && "What time limit per question do you want to set?"}
              </h2>
            </div>
            
            {/* Step 1: Responsive Grid of Courses */}
            {configStep === 1 && courses.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: isMobile ? 12 : 20, 
                marginBottom: 40 
              }}>
                <motion.button 
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    if (courses.length === 0) return;
                    const amount = Math.min(courses.length, Math.floor(Math.random() * 2) + 1);
                    const shuffled = [...courses].sort(() => 0.5 - Math.random());
                    setExamCourses(shuffled.slice(0, amount));
                  }}
                  style={{ 
                    padding: isMobile ? '16px 20px' : '24px', 
                    borderRadius: 16, 
                    background: '#fffbeb', 
                    textAlign: 'left', 
                    cursor: 'pointer', 
                    outline: 'none', 
                    transition: 'all 0.1s', 
                    fontFamily: 'inherit',
                    border: '1.5px solid #fbbf24',
                    color: '#b45309', 
                    boxShadow: '0 4px 12px rgba(217,119,6,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Dices size={20} color="#d97706" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 2px', color: '#d97706' }}>Dice Roll</h3>
                  <p style={{ fontSize: 12, margin: 0, fontWeight: 700, color: '#b45309' }}>Select random courses</p>
                </motion.button>
                {courses.map(c => {
                  const isSelected = examCourses.some(x => x.id === c.id)
                  return (
                    <motion.button 
                      key={c.id}
                      whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                      onClick={() => toggleCourseConfig(c)}
                      style={{ 
                        padding: isMobile ? '16px 20px' : '24px', 
                        borderRadius: 16, 
                        background: 'white', 
                        textAlign: 'left', 
                        cursor: 'pointer', 
                        outline: 'none', 
                        transition: 'all 0.1s', 
                        fontFamily: 'inherit',
                        border: isSelected ? '1.5px solid #111' : '1px solid #e5e7eb',
                        color: isSelected ? '#111' : '#555'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#111' }}>{c.code.slice(0, 3)}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={24} color="#111" />}
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px', color: '#111' }}>{c.code}</h3>
                      <p style={{ fontSize: 12, margin: 0, fontWeight: 600 }}>{c.name}</p>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Step 2: Question Quantities */}
            {configStep === 2 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                gap: 12, 
                marginBottom: 40 
              }}>
                {[
                  { n: 10, label: 'Small Batch', desc: 'Quick drill' },
                  { n: 20, label: 'Standard Run', desc: 'Daily goal' },
                  { n: 50, label: 'The Marathon', desc: 'Deep dive' },
                  { n: 100, label: 'CBT Simulator', desc: 'Exam ready' }
                ].map((item, i) => {
                  const isSelected = examQs === item.n;
                  return (
                    <motion.button 
                      key={item.n}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setExamQs(item.n)}
                      style={{ 
                        padding: isMobile ? '16px 20px' : '20px 24px', 
                        borderRadius: 12, 
                        background: 'white', 
                        textAlign: 'left', 
                        cursor: 'pointer', 
                        outline: 'none', 
                        transition: 'all 0.1s', 
                        fontFamily: 'inherit',
                        border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                        color: isSelected ? 'var(--primary)' : '#555', 
                        boxShadow: isSelected ? '0 8px 20px -6px var(--primary-glow)' : 'none',
                        display: 'flex', flexDirection: 'column', gap: 2
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 900 }}>{item.n} Qs</span>
                        {isSelected && <CheckCircle2 size={20} color="#111" />}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>{item.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Step 3: Timed Engagements */}
            {configStep === 3 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                gap: 12, 
                marginBottom: 40 
              }}>
                {[
                  { v: 0, l: 'No Limit', sub: 'Study Mode' }, 
                  { v: 5, l: '5s / Q', sub: 'Flash Zone' },
                  { v: 10, l: '10s / Q', sub: 'Very Fast' },
                  { v: 15, l: '15s / Q', sub: 'Fast Pace' }, 
                  { v: 30, l: '30s / Q', sub: 'Standard' }, 
                  { v: 60, l: '60s / Q', sub: 'Deep Work' }
                ].map((t, i) => {
                  const isSelected = examTimer === t.v;
                  return (
                    <motion.button 
                      key={t.v}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setExamTimer(t.v)}
                      style={{ 
                        padding: isMobile ? '16px 20px' : '20px 24px', 
                        borderRadius: 12, 
                        background: 'white', 
                        textAlign: 'left', 
                        cursor: 'pointer', 
                        outline: 'none', 
                        transition: 'all 0.1s', 
                        fontFamily: 'inherit',
                        border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                        color: isSelected ? 'var(--primary)' : '#555', 
                        boxShadow: isSelected ? '0 8px 20px -6px var(--primary-glow)' : 'none',
                        display: 'flex', flexDirection: 'column', gap: 2
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 900 }}>{t.l}</span>
                        {isSelected && <CheckCircle2 size={20} color="#111" />}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>{t.sub}</span>
                    </motion.button>
                  )
                })}
              </div>
            )}

          </motion.div>
        </div>

        {/* Floating Retro Footer */}
        <div style={{ 
          background: '#f4fdf4', 
          padding: isMobile ? '16px 20px' : '24px 40px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginTop: 'auto',
          position: isMobile ? 'fixed' : 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          borderTop: '2px solid #111'
        }}>
          <div style={{ width: '100%', maxWidth: configStep === 1 ? 900 : 560, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            <button 
              disabled={configStep===1} 
              onClick={() => setConfigStep(c=>c-1)}
              style={{ 
                padding: isMobile ? '10px 16px' : '10px 28px', borderRadius: 12, background: 'white', color: '#111', 
                border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, cursor: configStep===1?'not-allowed':'pointer',
                border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 600, cursor: configStep===1?'not-allowed':'pointer',
                opacity: configStep===1?0:1, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s', fontFamily: 'inherit'
              }}
            >
              ← {isMobile ? '' : 'back'}
            </button>
            
            <div style={{ display:'flex', gap:4 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ 
                  width:s===configStep?24:8, height:8, borderRadius:99, 
                  background:s===configStep?'var(--primary)':(s<configStep?'#10b981':'#ddd'),
                  transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)'
                }} />
              ))}
            </div>
            
            <button 
              onClick={() => {
                if (configStep < 3) setConfigStep(c=>c+1)
                else generateQuestions()
              }}
              disabled={!isStepReady || isGenerating}
              style={{ 
                padding: isMobile ? '10px 16px' : '10px 28px', borderRadius: 12, 
                border: '1.5px solid var(--primary)', fontSize: 13, fontWeight: 800, 
                cursor: (!isStepReady || isGenerating)?'not-allowed':'pointer', 
                opacity: (!isStepReady || isGenerating)?0.5:1, boxShadow: (!isStepReady || isGenerating)?'none':'0 10px 25px -5px var(--primary-glow)',
                background: (isStepReady && !isGenerating) ? 'var(--primary)' : 'white',
                color: (isStepReady && !isGenerating) ? 'white' : '#111',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.1s', fontFamily: 'inherit'
              }}
            >
              {isGenerating ? <Loader2 className="animate-spin" size={16} /> : null}
              {configStep === 3 ? (isGenerating ? 'GENERATING' : 'GENERATE EXAM') : 'NEXT'} →
            </button>

          </div>
        </div>

      </div>
    )
  }

  if (mode === 'result') {
    const handleShare = async () => {
      if (resultRef.current === null) return
      setIsSharing(true)
      try {
        const dataUrl = await toPng(resultRef.current, { cacheBust: true, pixelRatio: 2 })
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], 'luter-result.png', { type: 'image/png' })
        
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ [blob.type]: blob })
            ]);
            alert('🎉 Copied to clipboard! Ready to paste and flex on Discord/Slack.');
          } catch (clipboardErr) {
            console.error('Clipboard write failed, trying native share...', clipboardErr);
            if (navigator.share) {
              await navigator.share({
                files: [file],
                title: 'My Luter Study Result',
                text: `I just scored ${score}/${generatedQuestions?.length || 1} on Luter! Lock in 🎯`
              })
            } else {
              const link = document.createElement('a');
              link.download = 'luter-result.png';
              link.href = dataUrl;
              link.click();
            }
          }
        } else if (navigator.share) {
          await navigator.share({
            files: [file],
            title: 'My Luter Study Result',
            text: `I just scored ${score}/${generatedQuestions?.length || 1} on Luter! Lock in 🎯`
          })
        } else {
          const link = document.createElement('a');
          link.download = 'luter-result.png';
          link.href = dataUrl;
          link.click();
        }
      } catch (err) {
        console.error('Error sharing', err)
      } finally {
        setIsSharing(false)
      }
    }

    return (
      <div className="dh-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
        
        <div style={{ flex: 1, padding: isMobile ? '20px 12px 100px' : '20px 20px 100px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ width: '100%', maxWidth: 520, marginTop: isMobile ? '0' : '2vh' }}>
            
            {/* Luter Branding Header */}
            <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 40, display: 'flex', justifyContent: 'center' }}>
              <LuterLogo size={isMobile ? 40 : 52} fontSize={isMobile ? 32 : 40} />
            </div>

            {/* Shareable Container */}
            <div ref={resultRef} style={{ background: '#fff', borderRadius: 24, padding: isMobile ? 12 : 2, position: 'relative', overflow: 'hidden' }}>
              
              {/* Static Confetti ... (stays same) */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.8 }}>
                <svg style={{ position: 'absolute', top: -10, left: '5%', transform: 'rotate(-10deg)' }} width="40" height="150" viewBox="0 0 40 150">
                  <path d="M10 0 Q 30 25 10 50 Q -10 75 10 100 Q 30 125 10 150" fill="none" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
                </svg>
                <svg style={{ position: 'absolute', top: 20, right: '12%', transform: 'rotate(15deg)' }} width="40" height="180" viewBox="0 0 40 180">
                  <path d="M20 0 Q 0 30 20 60 Q 40 90 20 120 Q 0 150 20 180" fill="none" stroke="#7a12cc" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
                </svg>
              </div>

              <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32, position: 'relative', zIndex: 1 }}>
                <motion.div
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  style={{ display: 'inline-block', marginBottom: isMobile ? 16 : 20 }}
                >
                  <div style={{ background: '#fffbeb', border: '1.5px solid #fbbf24', padding: isMobile ? '12px 16px' : '16px 24px', borderRadius: 20, boxShadow: '0 8px 16px rgba(251, 191, 36, 0.2)', display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Zap size={isMobile ? 20 : 28} fill="#fbbf24" color="#d97706" />
                    </motion.div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Reward</div>
                      <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 1000, color: '#111', lineHeight: 1 }}>+{score * 50} XP</div>
                    </div>
                  </div>
                </motion.div>

                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{ fontSize: isMobile ? 28 : 36, fontWeight: 1000, color: '#111', margin: '0 0 4px', letterSpacing: '-0.04em' }}
                >
                  {pass ? 'Incredible Work!' : 'Keep Going!'}
                </motion.h2>
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{ fontSize: isMobile ? 14 : 16, color: '#555', fontWeight: 600, margin: 0 }}
                >
                  {isMobile ? 'Session complete 🎯' : `You completed your ${examCourses[0]?.name || 'Mock Exam'} session`}
                </motion.p>
              </div>

              {/* The Score Circle/Box */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                style={{ 
                  background: pass ? '#f0fdf4' : '#fff7ed', 
                  borderRadius: 24, 
                  padding: isMobile ? '32px 20px' : '40px 32px', 
                  marginBottom: 20, 
                  border: '1.5px solid #eaeaea', 
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, opacity: 0.6 }}>Final Score</div>
                  <div style={{ fontSize: isMobile ? 64 : 88, fontWeight: 1000, color: '#111', lineHeight: 1, letterSpacing: '-0.05em' }}>
                    {score}<span style={{ opacity: 0.3, fontSize: isMobile ? 24 : 32 }}>/{generatedQuestions?.length || 1}</span>
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16, marginBottom: 24 }}>
                {[
                  { label: 'ACCURACY', value: `${Math.round((score/(generatedQuestions?.length || 1))*100)}%`, icon: <BarChart3 size={18} />, color: '#7a12cc' },
                  { label: 'STREAK', value: pass ? '+1 Day' : 'Paused', icon: <Flame size={18} />, color: '#ef4444' },
                  { label: 'PERFORMANCE', value: score > (generatedQuestions?.length || 1)/2 ? 'Master' : 'Student', icon: <Star size={18} />, color: '#fbbf24' },
                  { label: 'NEXT TARGET', value: score === (generatedQuestions?.length || 1) ? '100%' : `${generatedQuestions?.length || 1}/${generatedQuestions?.length || 1}`, icon: <Zap size={18} />, color: '#22c55e' }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    style={{ 
                      padding: '20px', 
                      borderRadius: 20, 
                      background: 'white', 
                      border: '1.5px solid #eee', 
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: stat.color }}>
                      {stat.icon}
                      <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', opacity: 0.8 }}>{stat.label}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: '#111' }}>{stat.value}</div>
                  </motion.div>
                ))}
              </div>
              {/* Marketing & Referral Card (Captured in Share) */}
              <div style={{ 
                marginTop: 12, 
                padding: '24px', 
                background: '#fafafa', 
                borderRadius: 24, 
                border: '1.5px solid #f0f0f0',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Subtle Background Accent */}
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: '#7a12cc10', borderRadius: '50%', blur: '20px' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
                    <LuterLogo size={36} fontSize={30} />
                  </div>
                  
                  <h3 style={{ fontSize: 13, fontWeight: 900, color: '#111', margin: '0 0 8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Locked in with Luter AI 🎯
                  </h3>
                  
                  <p style={{ fontSize: 13, color: '#666', fontWeight: 600, margin: '0 0 20px', lineHeight: 1.5, padding: '0 10px' }}>
                    I'm using Luter to crush my exams and master my courses with AI. Join me and study 10x faster.
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div style={{ height: 1.5, flex: 1, background: '#eee' }}></div>
                    <div style={{ 
                      fontSize: 12, 
                      fontWeight: 1000, 
                      color: 'white', 
                      background: '#111', 
                      padding: '8px 20px', 
                      borderRadius: 14,
                      letterSpacing: '0.05em'
                    }}>
                      LUTER.AI
                    </div>
                    <div style={{ height: 1.5, flex: 1, background: '#eee' }}></div>
                  </div>
                </div>
              </div>
            </div>

          {/* ── Subtle Referral Prompt ── */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            style={{ 
              marginTop: 32, 
              padding: '20px 24px', 
              borderRadius: 24, 
              background: '#fdfbff', 
              border: '1.5px solid #f5eeff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              cursor: 'pointer'
            }}
            whileHover={{ y: -2, borderColor: '#7a12cc33' }}
            onClick={() => { window.location.reload(); /* This will reset to home where they can find the refer card, or we could redirect if we had a router ref */ }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'white', border: '1px solid #f5eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a12cc' }}>
                <Users size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Invite a classmate</div>
                <div style={{ fontSize: 11, color: '#7a12cc99', fontWeight: 600 }}>Gift a free trial & earn 500 XP.</div>
              </div>
            </div>
            <ArrowRight size={18} color="#7a12cc" />
          </motion.div>

          </div>
        </div>

          {/* Floating Action Island */}
        <div style={{
          position: 'fixed',
          bottom: isMobile ? 20 : 30,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '0 16px',
          pointerEvents: 'none'
        }}>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring', damping: 20 }}
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'rgba(255, 255, 255, 0.96)',
              borderRadius: isMobile ? 24 : 36,
              border: '1.5px solid #111',
              boxShadow: '0px 20px 50px rgba(0,0,0,0.15)',
              padding: isMobile ? '8px 10px' : '12px 14px',
              display: 'flex',
              gap: isMobile ? 8 : 12,
              alignItems: 'center',
              pointerEvents: 'auto',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* Retake */}
            <button
              onClick={() => { setMode('configure'); setConfigStep(1); setCurrent(0); setSelected({}); setExamCourses(preselectedCourse ? [preselectedCourse] : []) }}
              style={{
                height: isMobile ? 48 : 54,
                width: isMobile ? 48 : 54,
                borderRadius: isMobile ? 18 : 22,
                background: '#f8f8f8',
                color: '#111',
                border: '1.5px solid #111',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <RotateCcw size={isMobile ? 18 : 22} strokeWidth={2.5} />
            </button>

            {/* Share Primary */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              style={{
                flex: 1,
                height: isMobile ? 48 : 54,
                borderRadius: isMobile ? 18 : 22,
                background: '#7a12cc',
                color: 'white',
                border: '1.5px solid #111',
                fontSize: isMobile ? 13 : 16,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                letterSpacing: '0.02em'
              }}
            >
              {isSharing ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={isMobile ? 18 : 20} strokeWidth={2.5} />}
              {isMobile ? 'SHARE' : 'SHARE PROOF'}
            </button>

            {/* Done */}
            <button
              onClick={() => { window.location.reload() }}
              style={{
                height: isMobile ? 48 : 54,
                padding: isMobile ? '0 16px' : '0 24px',
                borderRadius: isMobile ? 18 : 22,
                background: '#111',
                color: '#fff',
                border: 'none',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              DONE
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (mode === 'exam') {
    const q = generatedQuestions[current] || { question: 'Loading...', options: [], answer: 0 }
    const progress = (generatedQuestions?.length || 1) > 0 ? ((current) / (generatedQuestions?.length || 1)) * 100 : 0

    return (
    <div className="dh-root" style={{ 
      background: '#ffffff', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'row', 
      fontFamily: 'inherit',
      overflow: 'hidden'
    }}>
      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'margin-right 0.3s ease',
        marginRight: aiChatOpen ? '400px' : '0'
      }}>
      
      {/* Toolbar - Matching Configure Mode */}
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
        <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <FlaskConical size={20} color="#111" /> {isMobile ? 'Mock Exam' : 'Mock Exam'}
        </h1>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 6, 
          background: '#eefaec', 
          color: '#16a34a', 
          padding: '6px 14px', 
          borderRadius: 99, 
          fontSize: 12, 
          fontWeight: 800, 
          border: '1.5px solid #4ade80', 
          boxShadow: '0 4px 12px rgba(22,163,74,0.1)' 
        }}>
          <Clock size={14} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Main Content - Matching Configure Mode Layout */}
      <div style={{ 
        flex: 1, 
        padding: isMobile ? '20px 16px 100px' : '20px 40px 40px 40px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start' 
      }}>
        <motion.div 
          key={current}
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: isMobile ? 500 : 560, display: 'flex', flexDirection: 'column' }}
        >
          
          {/* Question Heading - Light Green Card Style */}
          <div style={{ 
            background: '#eefaec', 
            borderRadius: 12, 
            padding: isMobile ? '20px' : '24px 28px', 
            marginBottom: 24 
          }}>
            <h2 style={{ 
              fontSize: isMobile ? 14 : 16, 
              fontWeight: 600, 
              color: '#222', 
              margin: 0, 
              lineHeight: 1.5 
            }}>
              {q.question}
            </h2>
          </div>
          
          {/* Options - Card Style Matching Configure Mode */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12, 
            marginBottom: 40 
          }}>
            {q.options.map((opt, i) => {
              const isSelected = selected[current] === i
              const isCorrect = mode === 'result' && i === q.answer
              const isWrong = mode === 'result' && selected[current] === i && i !== q.answer
              
              return (
                <motion.button
                  key={i}
                  whileHover={{ y: -2 }} 
                  whileTap={{ scale: 0.94 }}
                  onClick={() => !mode.includes('result') && choose(i)}
                  disabled={mode.includes('result')}
                  style={{ 
                    padding: isMobile ? '16px 20px' : '20px 24px', 
                    borderRadius: 16, 
                    background: isSelected ? '#f3e8ff' : isCorrect ? '#f0fdf4' : isWrong ? '#fef2f2' : '#ffffff', 
                    textAlign: 'left', 
                    cursor: mode.includes('result') ? 'default' : 'pointer', 
                    outline: 'none', 
                    transition: 'all 0.1s', 
                    fontFamily: 'inherit',
                    border: isSelected ? '1.5px solid #a855f7' : isCorrect ? '1.5px solid #4ade80' : isWrong ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb',
                    color: isSelected ? '#7e22ce' : isCorrect ? '#16a34a' : isWrong ? '#dc2626' : '#374151', 
                    boxShadow: isSelected ? '0 4px 12px rgba(168,85,247,0.1)' : isCorrect ? '0 4px 12px rgba(22,163,74,0.1)' : isWrong ? '0 4px 12px rgba(220,38,38,0.1)' : '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </span>
                    {isSelected && <Zap size={18} color="#fbbf24" />}
                    {isCorrect && <CheckCircle2 size={18} color="#4ade80" />}
                    {isWrong && <XCircle size={18} color="#ef4444" />}
                  </div>
                </motion.button>
              )
            })}
          {/* Action Buttons Toolbar */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #E2E8F0',
            position: 'relative'
          }}>
            {/* Like Button */}
            <motion.button 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLike(current)}
              style={{ 
                background: likedQuestions[current] ? '#dcfce7' : 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: likedQuestions[current] ? '#16a34a' : '#6A6B6A',
                transition: 'all 0.2s ease'
              }}
              title="Good question"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={likedQuestions[current] ? '#16a34a' : 'none'} stroke={likedQuestions[current] ? '#16a34a' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
            </motion.button>

            {/* Dislike Button */}
            <motion.button 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDislike(current)}
              style={{ 
                background: dislikedQuestions[current] ? '#fee2e2' : 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: dislikedQuestions[current] ? '#dc2626' : '#6A6B6A',
                transition: 'all 0.2s ease'
              }}
              title="Bad question"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={dislikedQuestions[current] ? '#dc2626' : 'none'} stroke={dislikedQuestions[current] ? '#dc2626' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/>
              </svg>
            </motion.button>

            {/* Dislike Options Popup */}
            <AnimatePresence>
              {showDislikeOptions === current && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    top: '50px',
                    left: '40px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    minWidth: '280px'
                  }}
                >
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>What made it a bad question?</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['answer is wrong', 'correct answer is obvious', 'duplicate question', 'poorly worded / confusing', 'not important / relevant', 'too easy', 'too hard', 'other'].map((option) => (
                      <motion.button
                        key={option}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDislikeOption(option)}
                        style={{
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: '#4b5563',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Chat Button */}
            <motion.button 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAiChat(q)}
              style={{ 
                background: aiChatOpen ? '#f3e8ff' : 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: aiChatOpen ? '#7e22ce' : '#6A6B6A',
                transition: 'all 0.2s ease'
              }}
              title="AI Chat"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <circle cx="9" cy="10" r="1"/>
                <circle cx="15" cy="10" r="1"/>
              </svg>
            </motion.button>

            {/* Share Button */}
            <motion.button 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => handleShare(q)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6A6B6A',
                transition: 'all 0.2s ease'
              }}
              title="Share"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </motion.button>

            {/* Gift Button */}
            <motion.button 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6A6B6A',
                transition: 'all 0.2s ease'
              }}
              title="Gift"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8" width="18" height="4" rx="1"/>
                <path d="M12 8v13"/>
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 2.5 2.5v5"/>
                <path d="M16.5 8v-2.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5h-5"/>
              </svg>
            </motion.button>

            {/* Delete Button */}
            <motion.button 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDelete(current)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6A6B6A',
                transition: 'all 0.2s ease'
              }}
              title="Delete"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </motion.button>

            {/* More Options Button */}
            <div style={{ position: 'relative' }}>
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                style={{ 
                  background: showMoreOptions ? '#f3f4f6' : 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6A6B6A',
                  transition: 'all 0.2s ease'
                }}
                title="More options"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="19" cy="12" r="1"/>
                  <circle cx="5" cy="12" r="1"/>
                </svg>
              </motion.button>

              {/* More Options Dropdown */}
              <AnimatePresence>
                {showMoreOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      bottom: '40px',
                      right: '0',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '8px 0',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                      zIndex: 100,
                      minWidth: '200px'
                    }}
                  >
                    {[
                      { icon: '✏️', label: 'Edit question' },
                      { icon: '📥', label: 'Export cards to Anki' },
                      { icon: '📄', label: 'View summary outline' },
                      { icon: '☰', label: 'View all questions' }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setShowMoreOptions(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 16px',
                          width: '100%',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          textAlign: 'left',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
          
        </motion.div>
      </div>
      
      {/* Bottom Navigation - Matching Configure Mode Style */}
      <div style={{ 
        position: 'fixed',
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: isMobile ? '16px 20px' : '24px 40px', 
        background: '#ffffff',
        borderTop: '1.5px solid #f5f5f5',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: 560, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          
          <motion.button 
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            disabled={current===0} 
            onClick={()=>setCurrent(c=>c-1)}
            style={{ 
              padding: '14px 24px', 
              borderRadius: 14, 
              background: current===0 ? '#f5f5f5' : '#ffffff', 
              color: current===0 ? '#9ca3af' : '#374151', 
              border: '1.5px solid #e5e7eb', 
              fontSize: 14, 
              fontWeight: 800, 
              cursor: current===0?'not-allowed':'pointer',
              opacity: current===0?0.6:1,
              fontFamily: 'inherit',
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              boxShadow: current===0 ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>
          
          <div style={{ 
            fontSize: 14, 
            color: '#6b7280', 
            fontWeight: 700 
          }}>
            {current + 1} / {generatedQuestions?.length || 1}
          </div>
          
          <motion.button 
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={next}
            disabled={selected[current] === undefined}
            style={{ 
              padding: '14px 24px', 
              borderRadius: 14, 
              background: selected[current]===undefined ? '#f5f5f5' : '#fffbeb', 
              color: selected[current]===undefined ? '#9ca3af' : '#d97706', 
              border: selected[current]===undefined ? '1.5px solid #e5e7eb' : '1.5px solid #fbbf24', 
              fontSize: 14, 
              fontWeight: 800, 
              cursor: selected[current]===undefined?'not-allowed':'pointer',
              opacity: selected[current]===undefined?0.6:1,
              fontFamily: 'inherit',
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              boxShadow: selected[current]===undefined ? 'none' : '0 4px 12px rgba(217,119,6,0.1)'
            }}
          >
            {current === (generatedQuestions?.length || 1) - 1 ? 'Finish' : 'Next'}
            <ArrowRight size={18} />
          </motion.button>

        </div>
      </div>

      </div>

      {/* AI Chat Right-Side Panel */}
      <AnimatePresence>
        {aiChatOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: '400px',
              background: '#ffffff',
              borderLeft: '1px solid #e5e7eb',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1000
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7a12cc, #b04dfc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111' }}>AI Tutor</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Ask about this question</p>
                </div>
              </div>
              <button
                onClick={() => setAiChatOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  color: '#6b7280'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Tabs - Hidden for now, AI Chat is default */}
            <div style={{
              display: 'none',
              borderBottom: '1px solid #e5e7eb',
              padding: '0 24px'
            }}>
              {[
                { id: 'chat', label: 'chat' },
                { id: 'source', label: 'view source - pg 4' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAiChatMode(tab.id)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: aiChatMode === tab.id ? '2px solid #7a12cc' : '2px solid transparent',
                    color: aiChatMode === tab.id ? '#7a12cc' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Chat Messages - Only chat mode, no source tab */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px 24px',
              background: '#f9fafb'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Quick Actions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {["explain it like i'm five years old", 'give me an example', 'why is this important?'].map((quick) => (
                      <button
                        key={quick}
                        onClick={() => {
                          setAiChatInput(quick)
                          setTimeout(sendAiMessage, 100)
                        }}
                        style={{
                          background: '#dcfce7',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '8px 14px',
                          fontSize: '12px',
                          color: '#166534',
                          cursor: 'pointer'
                        }}
                      >
                        {quick}
                      </button>
                    ))}
                  </div>

                  {/* Messages */}
                  {aiChatMessages.filter(m => m.role !== 'system').map((message, idx) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                        background: message.role === 'user' ? '#7a12cc' : '#ffffff',
                        color: message.role === 'user' ? 'white' : '#374151',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        maxWidth: '85%',
                        fontSize: '14px',
                        lineHeight: 1.5,
                        boxShadow: message.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      {message.content}
                    </div>
                  ))}
                  {isAiLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px' }}>
                      <Loader2 size={16} className="animate-spin" />
                      AI is thinking...
                    </div>
                  )}
                </div>
            </div>

            {/* Follow-up Questions */}
            {aiChatMessages.length > 1 && (
              <div style={{
                padding: '16px 24px',
                background: '#ffffff',
                borderTop: '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Follow-up questions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['can you give me an example?', "what's the purpose?", 'are there other versions?', 'give me an analogy'].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiChatInput(q)
                        setTimeout(sendAiMessage, 100)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px',
                        color: '#4b5563',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {q}
                      <span style={{ color: '#9ca3af' }}>+</span>
                    </button>
                  ))}
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 0',
                    background: 'none',
                    border: 'none',
                    fontSize: '13px',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}>
                    <span>›</span> more questions
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              background: '#ffffff'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f3f4f6',
                borderRadius: '12px',
                padding: '4px'
              }}>
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendAiMessage()}
                  placeholder="ask your document anything"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'none',
                    padding: '12px 16px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={sendAiMessage}
                  disabled={!aiChatInput.trim() || isAiLoading}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#7a12cc',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: !aiChatInput.trim() || isAiLoading ? 0.5 : 1
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', textAlign: 'center' }}>
                7 explanations left. then resets in 1 hour. <a href="#" style={{ color: '#7a12cc', textDecoration: 'none' }}>want unlimited?</a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
    )
  }
}
