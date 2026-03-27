import { useState, useEffect, useRef } from 'react'
import { FlaskConical, Clock, CheckCircle2, XCircle, Search, Loader2, Zap, ArrowRight, ArrowLeft, Dices, Share2, Award, Trophy, RotateCcw, BarChart3, Flame, Star, Users } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { toPng } from 'html-to-image'
import confetti from 'canvas-confetti'
import LuterLogo from '../shared/LuterLogo'

const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

const SAMPLE_QUESTIONS = [
  {
    q: 'What is the student\'s academic programme and level?',
    opts: ['Male, Registration Number', 'Economics, Registration Number', 'Economics, Level 100', 'Male, Level 100'],
    ans: 2
  },
  {
    q: 'Which of the following best describes Bohr\'s atomic model?',
    opts: ['Electrons orbit randomly', 'Electrons occupy fixed energy levels', 'Nucleus is diffuse', 'Protons orbit the nucleus'],
    ans: 1
  },
  {
    q: 'What does the de Broglie equation relate?',
    opts: ['Mass and charge', 'Wavelength and momentum', 'Energy and time', 'Velocity and spin'],
    ans: 1
  }
]

export default function MockExamPage({ user, preselectedCourse }) {
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

  useEffect(() => {
    if (preselectedCourse) {
      setExamCourses([preselectedCourse])
      setConfigStep(2)
    }
  }, [preselectedCourse])

  const toggleCourseConfig = (c) => {
    setExamCourses(p => p.find(x => x.id === c.id) ? p.filter(x => x.id !== c.id) : [...p, c])
  }

  const score = Object.entries(selected).reduce((acc, [idx, ansIdx]) => acc + (ansIdx === SAMPLE_QUESTIONS[idx].ans ? 1 : 0), 0)
  const pass = score >= SAMPLE_QUESTIONS.length / 2

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
    const fetchCourses = async () => {
      const { data } = await supabase
        .from('user_courses')
        .select('course:courses(id, code, name, faculty)')
        .eq('user_id', user.id)
      
      if (data) {
        setCourses(data.map((row, i) => ({
          ...row.course,
          color: PALETTE[i % PALETTE.length]
        })))
      }
      setLoading(false)
    }
    fetchCourses()
  }, [user])

  const startExam = (c) => {
    setActiveCourse(c)
    setMode('exam')
    setCurrent(0)
    setSelected({})
  }

  const choose = (idx) => {
    setSelected(prev => ({ ...prev, [current]: idx }))
  }

  const next = () => {
    if (current < SAMPLE_QUESTIONS.length - 1) {
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

  if (loading) {
    return (
      <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
        <Loader2 className="animate-spin" size={28} color="var(--primary)" />
      </div>
    )
  }

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
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');`}</style>
        
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
            
            <div style={{ width: '100%', height: 16, background: '#f4fdf4', borderRadius: 99, border: '2px solid #111', overflow: 'hidden', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>
              <motion.div 
                initial={{ width: '0%' }} 
                animate={{ width: '100%' }} 
                transition={{ duration: 7, ease: "linear" }}
                style={{ height: '100%', background: '#10b981', borderRight: '2px solid #111' }} 
              />
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
                  border: '2.5px solid #111', borderRadius: '50% 50% 40% 40%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: '3px 3px 0px #111' 
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
        <div style={{ padding: '24px 40px', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FlaskConical size={20} color="#111" /> Mock Exam Setup
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fffbeb', color: '#d97706', padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 800, border: '1.5px solid #d97706', boxShadow: '2px 2px 0px #d97706' }}>
            <Zap size={14} fill="#d97706" /> Configuration Stage
          </div>
        </div>

        <div style={{ flex: 1, padding: '20px 40px 40px 40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <motion.div 
            key={configStep}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: configStep === 1 ? 900 : 560, display: 'flex', flexDirection: 'column' }}
          >
            {/* Heading styled exactly like the CBT Question Box */}
            <div style={{ background: '#eefaec', borderRadius: 12, padding: '24px 28px', marginBottom: 30 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#222', margin: 0, lineHeight: 1.5 }}>
                {configStep === 1 && "Which courses do you want to pull questions from for this Mock Exam? Select one or multiple."}
                {configStep === 2 && "How many questions do you want to attempt?"}
                {configStep === 3 && "What time limit per question do you want to set?"}
              </h2>
            </div>
            
            {/* Step 1: Responsive Grid of Courses */}
            {configStep === 1 && courses.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
                <motion.button 
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    if (courses.length === 0) return;
                    const amount = Math.min(courses.length, Math.floor(Math.random() * 2) + 1);
                    const shuffled = [...courses].sort(() => 0.5 - Math.random());
                    setExamCourses(shuffled.slice(0, amount));
                  }}
                  style={{ 
                    padding: '24px', borderRadius: 16, background: '#fffbeb', textAlign: 'left', cursor: 'pointer', outline: 'none', transition: 'all 0.1s', fontFamily: 'inherit',
                    border: '1.5px solid #d97706',
                    color: '#d97706', boxShadow: '3px 3px 0px #d97706'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Dices size={20} color="#d97706" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px', color: '#d97706' }}>Dice Roll</h3>
                  <p style={{ fontSize: 13, margin: 0, fontWeight: 700, color: '#b45309' }}>Select random courses</p>
                </motion.button>
                {courses.map(c => {
                  const isSelected = examCourses.some(x => x.id === c.id)
                  return (
                    <motion.button 
                      key={c.id}
                      whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                      onClick={() => toggleCourseConfig(c)}
                      style={{ 
                        padding: '24px', borderRadius: 16, background: 'white', textAlign: 'left', cursor: 'pointer', outline: 'none', transition: 'all 0.1s', fontFamily: 'inherit',
                        border: isSelected ? '1.5px solid #111' : '1px solid #e5e7eb',
                        color: isSelected ? '#111' : '#555'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{c.code.slice(0, 3)}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={24} color="#111" />}
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#111' }}>{c.code}</h3>
                      <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>{c.name}</p>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Step 2: Question Quantities */}
            {configStep === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 40 }}>
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
                        padding: '20px 24px', borderRadius: 12, background: 'white', textAlign: 'left', cursor: 'pointer', outline: 'none', transition: 'all 0.1s', fontFamily: 'inherit',
                        border: isSelected ? '1.5px solid #111' : '1px solid #e5e7eb',
                        color: isSelected ? '#111' : '#555', 
                        boxShadow: isSelected ? '3px 3px 0px #111' : 'none',
                        display: 'flex', flexDirection: 'column', gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 900 }}>{item.n} Qs</span>
                        {isSelected && <CheckCircle2 size={20} color="#111" />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>{item.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Step 3: Timed Engagements */}
            {configStep === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 40 }}>
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
                        padding: '20px 24px', borderRadius: 12, background: 'white', textAlign: 'left', cursor: 'pointer', outline: 'none', transition: 'all 0.1s', fontFamily: 'inherit',
                        border: isSelected ? '1.5px solid #111' : '1px solid #e5e7eb',
                        color: isSelected ? '#111' : '#555', 
                        boxShadow: isSelected ? '3px 3px 0px #111' : 'none',
                        display: 'flex', flexDirection: 'column', gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 900 }}>{t.l}</span>
                        {isSelected && <CheckCircle2 size={20} color="#111" />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>{t.sub}</span>
                    </motion.button>
                  )
                })}
              </div>
            )}

          </motion.div>
        </div>

        {/* Floating Retro Footer matching Exam mode perfectly */}
        <div style={{ background: '#f4fdf4', padding: '24px 40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ width: '100%', maxWidth: configStep === 1 ? 900 : 560, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            <button 
              disabled={configStep===1} 
              onClick={() => setConfigStep(c=>c-1)}
              style={{ 
                padding: '10px 28px', borderRadius: 12, background: 'white', color: '#111', 
                border: '1.5px solid #111', fontSize: 14, fontWeight: 600, cursor: configStep===1?'not-allowed':'pointer',
                opacity: configStep===1?0.5:1, boxShadow: configStep===1?'none':'3px 3px 0px #111', 
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s', fontFamily: 'inherit'
              }}
            >
              ← back
            </button>
            
            <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>
              {configStep} of 3
            </span>
            
            <button 
              onClick={() => {
                if (configStep < 3) setConfigStep(c=>c+1)
                else {
                  setMode('preparing');
                }
              }}
              disabled={!isStepReady}
              style={{ 
                padding: '10px 28px', borderRadius: 12, background: 'white', color: '#111', 
                border: '1.5px solid #111', fontSize: 14, fontWeight: 600, 
                cursor: !isStepReady?'not-allowed':'pointer', 
                opacity: !isStepReady?0.5:1, boxShadow: !isStepReady?'none':'3px 3px 0px #111',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s', fontFamily: 'inherit'
              }}
            >
              {configStep === 3 ? 'start run' : 'continue'} →
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
                text: `I just scored ${score}/${SAMPLE_QUESTIONS.length} on Luter! Lock in 🎯`
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
            text: `I just scored ${score}/${SAMPLE_QUESTIONS.length} on Luter! Lock in 🎯`
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
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');`}</style>
        
        <div style={{ flex: 1, padding: '20px 20px 100px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ width: '100%', maxWidth: 520, marginTop: '2vh' }}>
            
            {/* Luter Branding Header */}
            <div style={{ textAlign: 'center', marginBottom: 40, display: 'flex', justifyContent: 'center' }}>
              <LuterLogo size={52} fontSize={40} />
            </div>

            {/* Shareable Container */}
            <div ref={resultRef} style={{ background: '#fff', borderRadius: 24, padding: 2, position: 'relative', overflow: 'hidden' }}>
              
              {/* Static Confetti for the captured image (Absolute Positioned) */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.8 }}>
                {/* Top Ribbons */}
                <svg style={{ position: 'absolute', top: -10, left: '5%', transform: 'rotate(-10deg)' }} width="40" height="150" viewBox="0 0 40 150">
                  <path d="M10 0 Q 30 25 10 50 Q -10 75 10 100 Q 30 125 10 150" fill="none" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
                </svg>
                <svg style={{ position: 'absolute', top: 20, right: '12%', transform: 'rotate(15deg)' }} width="40" height="180" viewBox="0 0 40 180">
                  <path d="M20 0 Q 0 30 20 60 Q 40 90 20 120 Q 0 150 20 180" fill="none" stroke="#7a12cc" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
                </svg>
                <svg style={{ position: 'absolute', top: 120, left: '25%', transform: 'rotate(5deg)' }} width="30" height="100" viewBox="0 0 30 100">
                  <path d="M5 0 Q 25 15 5 30 Q -15 45 5 60 Q 25 75 5 100" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                </svg>

                {/* Middle/Bottom Ribbons */}
                <svg style={{ position: 'absolute', top: 280, right: '4%' }} width="40" height="140" viewBox="0 0 40 140">
                  <path d="M15 0 Q 35 25 15 50 Q -5 75 15 100 Q 35 125 15 140" fill="none" stroke="#7a12cc" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <svg style={{ position: 'absolute', bottom: 100, left: '10%', transform: 'rotate(20deg)' }} width="40" height="150" viewBox="0 0 40 150">
                  <path d="M10 0 Q 30 25 10 50 Q -10 75 10 100 Q 30 125 10 150" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
                </svg>
                
                {/* Scattering confetti dots/squares */}
                <div style={{ position: 'absolute', top: 40, left: '42%', width: 8, height: 8, borderRadius: 2, background: '#7a12cc', transform: 'rotate(45deg)' }} />
                <div style={{ position: 'absolute', top: 160, right: '35%', width: 6, height: 6, borderRadius: '50%', background: '#fbbf24' }} />
                <div style={{ position: 'absolute', bottom: 240, left: '15%', width: 10, height: 10, borderRadius: 2, background: '#fbbf24', transform: 'rotate(15deg)' }} />
                <div style={{ position: 'absolute', bottom: 80, right: '20%', width: 7, height: 7, borderRadius: 1, background: '#7a12cc', transform: 'rotate(60deg)' }} />
                <div style={{ position: 'absolute', top: '50%', left: '8%', width: 6, height: 6, borderRadius: '50%', background: '#ff3366', opacity: 0.4 }} />
              </div>

              <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 1 }}>
                <motion.div
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  style={{ display: 'inline-block', marginBottom: 20 }}
                >
                  <div style={{ background: '#fffbeb', border: '1.5px solid #fbbf24', padding: '16px 24px', borderRadius: 24, boxShadow: '0 8px 16px rgba(251, 191, 36, 0.2)', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Zap size={28} fill="#fbbf24" color="#d97706" />
                    </motion.div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Reward</div>
                      <div style={{ fontSize: 24, fontWeight: 1000, color: '#111', lineHeight: 1 }}>+{score * 50} XP</div>
                    </div>
                  </div>
                </motion.div>

                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{ fontSize: 36, fontWeight: 1000, color: '#111', margin: '0 0 8px', letterSpacing: '-0.04em' }}
                >
                  {pass ? 'Incredible Work!' : 'Keep Going!'}
                </motion.h2>
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{ fontSize: 16, color: '#555', fontWeight: 600, margin: 0 }}
                >
                  You completed your {examCourses[0]?.name || 'Mock Exam'} session
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
                  padding: '40px 32px', 
                  marginBottom: 24, 
                  border: '1.5px solid #eaeaea', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Floating "Springlrs" / Sparkles */}
                {pass && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          scale: [0, 1, 0.8, 0],
                          x: [0, (i%2===0?20:-20) * (i+1), (i%2===0?40:-40) * (i+1)],
                          y: [0, -40, -80],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity, 
                          delay: i * 0.4,
                          ease: "easeOut"
                        }}
                        style={{ 
                          position: 'absolute', 
                          top: '60%', 
                          left: `${15 + (i * 15)}%`, 
                          color: '#fbbf24', 
                          zIndex: 0,
                          pointerEvents: 'none'
                        }}
                      >
                        <Star size={16} fill="#fbbf24" strokeWidth={0} />
                      </motion.div>
                    ))}
                  </>
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16, opacity: 0.6 }}>Final Score</div>
                  <div style={{ fontSize: 88, fontWeight: 1000, color: '#111', lineHeight: 1, letterSpacing: '-0.05em' }}>
                    {score}<span style={{ opacity: 0.3, fontSize: 32 }}>/{SAMPLE_QUESTIONS.length}</span>
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid - 2x2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                {[
                  { label: 'ACCURACY', value: `${Math.round((score/SAMPLE_QUESTIONS.length)*100)}%`, icon: <BarChart3 size={18} />, color: '#7a12cc' },
                  { label: 'STREAK', value: pass ? '+1 Day' : 'Paused', icon: <Flame size={18} />, color: '#ef4444' },
                  { label: 'PERFORMANCE', value: score > SAMPLE_QUESTIONS.length/2 ? 'Master' : 'Student', icon: <Star size={18} />, color: '#fbbf24' },
                  { label: 'NEXT TARGET', value: score === SAMPLE_QUESTIONS.length ? '100%' : `${SAMPLE_QUESTIONS.length}/${SAMPLE_QUESTIONS.length}`, icon: <Zap size={18} />, color: '#22c55e' }
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
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
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
          bottom: 30,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 100,
          padding: '0 20px',
          pointerEvents: 'none'
        }}>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring', damping: 20 }}
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 36,
              border: '1px solid #f0f0f0',
              boxShadow: '0px 20px 50px rgba(0,0,0,0.1)',
              padding: '12px 14px',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              pointerEvents: 'auto',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* Secondary: Retake */}
            <button
              onClick={() => { setMode('configure'); setConfigStep(1); setCurrent(0); setSelected({}); setExamCourses(preselectedCourse ? [preselectedCourse] : []) }}
              style={{
                height: 54,
                width: 54,
                borderRadius: 22,
                background: '#f8f8f8',
                color: '#555',
                border: '1px solid #eee',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.1s',
                fontFamily: 'inherit'
              }}
              onMouseDown={e => {e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.background = '#eee'}}
              onMouseUp={e => {e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#f8f8f8'}}
              title="RETAKE"
            >
              <RotateCcw size={22} strokeWidth={2} />
            </button>

            {/* Social Share Tray (WhatsApp, Instagram, etc) */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => window.open(`https://wa.me/?text=I just scored ${score}/${SAMPLE_QUESTIONS.length} on Luter! 🎯 Lock in for your exams at: https://luter.ai`, '_blank')}
                style={{
                  height: 54, width: 54, borderRadius: 22, background: '#22c55e10', color: '#22c55e', border: '1px solid #22c55e20',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Share to WhatsApp"
              >
                <Share2 size={24} />
              </button>
            </div>

            {/* Primary: Share Proof (Image Copy for Insta/Snap) */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              style={{
                flex: 1,
                height: 54,
                borderRadius: 22,
                background: '#7a12cc',
                color: 'white',
                border: 'none',
                fontSize: 16,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0px 10px 20px rgba(122, 18, 204, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.1s',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}
              onMouseDown={e => {e.currentTarget.style.transform = 'scale(0.98)'; e.currentTarget.style.boxShadow = '0px 4px 10px rgba(122, 18, 204, 0.2)'}}
              onMouseUp={e => {e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0px 10px 20px rgba(122, 18, 204, 0.25)'}}
            >
              {isSharing ? <Loader2 className="animate-spin" size={20} /> : <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Trophy size={20} fill="white" /></div>}
              SHARE PROOF
            </button>

            {/* Finish/Dashboard (Standard Exit) */}
            <button
              onClick={() => { window.location.reload() }}
              style={{
                height: 54,
                padding: '0 24px',
                borderRadius: 22,
                background: '#111',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.1s',
                fontFamily: 'inherit'
              }}
              onMouseDown={e => {e.currentTarget.style.transform = 'scale(0.95)'}}
              onMouseUp={e => {e.currentTarget.style.transform = 'scale(1)'}}
            >
              DONE
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  const q = SAMPLE_QUESTIONS[current]
  const progress = ((current) / SAMPLE_QUESTIONS.length) * 100

  return (
    <div className="dh-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      
      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ width: '100%', maxWidth: 520, marginTop: '5vh' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#111', letterSpacing: '-0.02em' }}>Q.{current + 1}</span>
              <div style={{ background: '#f0f0f0', height: 8, width: 60, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ background: '#111', height: '100%', width: `${progress}%`, transition: 'width 0.3s ease-out' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {examTimer > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: timeLeft <= 5 ? '#fef2f2' : '#f0fdf4', color: timeLeft <= 5 ? '#ef4444' : '#10b981', padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 800, border: `1px solid ${timeLeft <= 5 ? '#fca5a5' : '#86efac'}` }}>
                  <Clock size={14} /> {timeLeft}s
                </div>
              )}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fffbeb', color: '#d97706', padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 800, border: '1px solid #fde68a' }}>
                <Zap size={14} fill="#d97706" /> {Object.keys(selected).length * 50} XP Potential
              </div>
            </div>
          </div>
          
          <div style={{ background: '#f8fdf8', border: '1px solid #eefae1', borderRadius: 16, padding: '28px 32px', marginBottom: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: 0, lineHeight: 1.6 }}>
              {q.q}
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {q.opts.map((opt, i) => {
              const isSelected = selected[current] === i;
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  style={{
                    display: 'block', width: '100%', padding: '18px 24px', borderRadius: 12,
                    background: isSelected ? '#f8f4ff' : 'white', 
                    border: isSelected ? '1.5px solid #7a12cc' : '1px solid #eee',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.1s',
                    fontSize: 14, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#7a12cc' : '#555',
                    fontFamily: 'inherit', outline: 'none'
                  }}
                >
                  {String.fromCharCode(65+i)}. {opt}
                </button>
              )
            })}
          </div>

        </div>
      </div>

      {/* Floating Retro Footer */}
      <div style={{ background: '#f4fdf4', padding: '24px 40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 520, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
            <button 
              disabled={current===0} 
              onClick={()=>setCurrent(c=>c-1)}
              style={{ 
                padding: '10px 28px', borderRadius: 12, background: 'white', color: '#111', 
                border: '1px solid #eee', fontSize: 14, fontWeight: 600, cursor: current===0?'not-allowed':'pointer',
                opacity: current===0?0.5:1, boxShadow: current===0?'none':'0 4px 12px rgba(0,0,0,0.05)', 
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s', fontFamily: 'inherit'
              }}
            >
              back
            </button>
          
          <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>
            {current + 1} of {SAMPLE_QUESTIONS.length}
          </span>
          
          <button 
            onClick={next}
            disabled={selected[current] === undefined}
            style={{ 
              padding: '10px 28px', borderRadius: 12, background: '#111', color: '#fff', 
              border: 'none', fontSize: 14, fontWeight: 600, 
              cursor: selected[current]===undefined?'not-allowed':'pointer', 
              opacity: selected[current]===undefined?0.5:1, boxShadow: selected[current]===undefined?'none':'0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s', fontFamily: 'inherit'
            }}
          >
            {current === SAMPLE_QUESTIONS.length - 1 ? 'Finish' : 'Next'}
          </button>

        </div>
      </div>

    </div>
  )
}
