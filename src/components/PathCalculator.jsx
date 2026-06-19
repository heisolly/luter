import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator,
  TrendUp,
  Target,
  Warning,
  Check,
  UploadSimple,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Star,
  Lightning,
  DownloadSimple
} from '@phosphor-icons/react';
import { PremiumButton, SharedNavbar, SharedFooter, PageBackground, RevealDiv } from './PageShared';
import LuterLogo from './shared/LuterLogo';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PathCalculator = () => {
  const containerRef = useRef(null);
  
  // Form states
  const [currentCGPA, setCurrentCGPA] = useState('');
  const [targetCGPA, setTargetCGPA] = useState('');
  const [semestersCompleted, setSemestersCompleted] = useState('');
  const [totalSemesters, setTotalSemesters] = useState(8);
  const [calculated, setCalculated] = useState(false);
  const [requiredGPA, setRequiredGPA] = useState(null);
  const [difficulty, setDifficulty] = useState('');
  const [isImpossible, setIsImpossible] = useState(false);
  const [showRecoveryCard, setShowRecoveryCard] = useState(false);

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".reveal-child", {
        scrollTrigger: { trigger: ".reveal-child", start: 'top 82%' },
        y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power2.out'
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const calculateRequiredGPA = () => {
    // Check if any required fields are empty
    if (!currentCGPA || !targetCGPA || !semestersCompleted) {
      return;
    }
    
    const current = parseFloat(currentCGPA);
    const target = parseFloat(targetCGPA);
    const completed = parseInt(semestersCompleted);
    const remainingSemesters = totalSemesters - completed;
    
    if (remainingSemesters <= 0) {
      setIsImpossible(true);
      setRequiredGPA(null);
      setDifficulty('Completed');
      return;
    }

    const required = ((target * totalSemesters) - (current * completed)) / remainingSemesters;
    
    setRequiredGPA(required);
    setCalculated(true);
    
    if (required > 5.0) {
      setIsImpossible(true);
      setDifficulty('Impossible');
    } else if (required >= 4.5) {
      setIsImpossible(false);
      setDifficulty('Extreme');
    } else if (required >= 4.0) {
      setIsImpossible(false);
      setDifficulty('Hard');
    } else if (required >= 3.5) {
      setIsImpossible(false);
      setDifficulty('Moderate');
    } else {
      setIsImpossible(false);
      setDifficulty('Easy');
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'Easy': return '#22c55e';
      case 'Moderate': return '#f59e0b';
      case 'Hard': return '#f97316';
      case 'Extreme': return '#ef4444';
      case 'Impossible': return '#dc2626';
      default: return '#4B0082';
    }
  };

  const getDifficultyGradient = () => {
    switch (difficulty) {
      case 'Easy': return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      case 'Moderate': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'Hard': return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
      case 'Extreme': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'Impossible': return 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
      default: return 'linear-gradient(135deg, #4B0082 0%, #A855F7 100%)';
    }
  };

  
  const generateRecoveryCard = () => {
    setShowRecoveryCard(true);
  };

  const downloadRecoveryCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 1200;
    
    // Background - Nebula Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 1200);
    bgGradient.addColorStop(0, '#fdfaff');
    bgGradient.addColorStop(0.5, '#f5f3ff');
    bgGradient.addColorStop(1, '#ede9fe');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 1200);
    
    // Decorative Glows
    const glow = ctx.createRadialGradient(1000, 200, 0, 1000, 200, 600);
    glow.addColorStop(0, 'rgba(167, 139, 250, 0.2)');
    glow.addColorStop(1, 'rgba(167, 139, 250, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1200, 1200);

    // Main Card
    ctx.shadowColor = 'rgba(124, 58, 237, 0.15)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 30;
    ctx.fillStyle = 'white';
    
    // roundRect(x, y, w, h, radius)
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(100, 100, 1000, 1000, 60);
      ctx.fill();
    } else {
      ctx.fillRect(100, 100, 1000, 1000);
    }
    ctx.shadowColor = 'transparent';

    // Header Badge
    ctx.fillStyle = 'rgba(124, 58, 237, 0.05)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(400, 180, 400, 50, 25);
      ctx.fill();
    }
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 18px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFIED ACADEMIC PATH', 600, 212);

    // Title
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 64px DM Sans';
    ctx.fillText('Commitment to Excellence', 600, 320);
    
    ctx.fillStyle = '#64748b';
    ctx.fillText('A verified roadmap for academic distinction', 600, 380);

    // Score Section
    const scoreGradient = ctx.createLinearGradient(300, 450, 900, 450);
    scoreGradient.addColorStop(0, '#1e1b4b');
    scoreGradient.addColorStop(1, '#312e81');
    ctx.fillStyle = scoreGradient;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(300, 450, 600, 300, 40);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 20px DM Sans';
    ctx.fillText('TARGET GRADUATION CGPA', 600, 520);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 180px DM Sans';
    ctx.fillText(targetCGPA, 600, 700);

    // Requirements
    ctx.fillStyle = '#f8fafc';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(300, 800, 280, 120, 20);
      ctx.roundRect(620, 800, 280, 120, 20);
      ctx.fill();
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px DM Sans';
    ctx.fillText('REQUIRED GPA', 440, 840);
    ctx.fillText('REMAINING', 760, 840);

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 36px DM Sans';
    ctx.fillText(requiredGPA?.toFixed(2), 440, 890);
    ctx.fillText(`${totalSemesters - semestersCompleted} Sem`, 760, 890);

    // Branding
    ctx.fillStyle = '#7c3aed';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(500, 1000, 50, 50, 12);
      ctx.fill();
    }
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px DM Sans';
    ctx.fillText('L', 525, 1038);

    ctx.fillStyle = '#1e1b4b';
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px DM Sans';
    ctx.fillText('Luter Academy', 570, 1025);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Inter';
    ctx.fillText('Verified Roadmap', 570, 1045);

    // Final Download
    const link = document.createElement('a');
    link.download = `luter-achievement-${targetCGPA}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const SalvationMeter = () => {
    if (!calculated) return null;
    
    const meterPositions = {
      'Easy': 10,
      'Moderate': 35,
      'Hard': 60,
      'Extreme': 85,
      'Impossible': 100
    };
    
    const position = meterPositions[difficulty] || 0;
    
    return (
      <div style={{ 
        marginTop: 60, 
        padding: '32px', 
        background: 'rgba(124, 58, 237, 0.03)', 
        borderRadius: 32, 
        border: '1px solid rgba(124, 58, 237, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Accent */}
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, transparent 70%)',
          zIndex: 0
        }} />

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 24,
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 800, 
            color: '#64748b', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-display)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Lightning size={18} weight="fill" color="#fbbf24" />
            Strategy Assessment
          </div>
          <motion.div
            animate={{ 
              backgroundColor: `${getDifficultyColor()}15`,
              color: getDifficultyColor()
            }}
            style={{
              fontSize: 13,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              padding: '6px 16px',
              borderRadius: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}
          >
            {difficulty}
          </motion.div>
        </div>
        
        <div style={{
          height: 12,
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 6,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${position}%` }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              background: getDifficultyGradient(),
              borderRadius: 6,
              boxShadow: `0 0 20px ${getDifficultyColor()}40`
            }}
          />
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: 16,
          opacity: 0.5,
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: 'var(--font-display)'
        }}>
          <span>Minimum Effort</span>
          <span>Maximum Effort</span>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: '#ffffff', color: '#111', position: 'relative', fontFamily: 'var(--font-body)' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 160, paddingBottom: 120 }}>
        <div className="container-custom">

          {/* Header */}
          <div className="reveal-child" style={{ textAlign: 'center', marginBottom: 80 }}>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'rgba(75, 0, 130, 0.06)', border: '1px solid rgba(75, 0, 130, 0.12)', 
              borderRadius: 9999, padding: '10px 24px', fontSize: 13, fontWeight: 800, 
              color: '#4B0082', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <Calculator size={18} weight="bold" /> GPA Calculator
            </div>
            
            <h1 style={{ 
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', 
              fontWeight: 300, 
              fontFamily: 'var(--font-display)', 
              color: '#111', 
              marginBottom: 24, 
              lineHeight: 1.1, 
              letterSpacing: '0.01em'
            }}>
              PATH TO{' '}
              <span style={{ color: '#a78bfa', fontWeight: 400 }}>
                FIRST CLASS
              </span>
            </h1>
            
            <p style={{ 
              fontSize: 20, 
              color: '#64748B', 
              maxWidth: 600, 
              margin: '0 auto 48px', 
              fontWeight: 300, 
              lineHeight: 1.8,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.005em'
            }}>
              Calculate your exact semester-by-semester GPA needed to reach your graduation goal.
            </p>
          </div>

          {/* Calculator Form */}
          <div className="reveal-child" style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: 40,
            padding: '60px',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.05)',
            marginBottom: 80,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 40,
              marginBottom: 50,
              position: 'relative',
              zIndex: 1
            }}>
              {/* Current CGPA */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#64748b',
                  marginBottom: 16,
                  fontFamily: 'var(--font-display)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  <TrendUp size={20} /> Current CGPA
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.01"
                  placeholder="0.00"
                  value={currentCGPA}
                  onChange={(e) => setCurrentCGPA(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    border: '2px solid #f1f5f9',
                    borderRadius: 24,
                    fontSize: 18,
                    fontFamily: 'var(--font-display)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: '#ffffff',
                    fontWeight: 700,
                    color: '#1e1b4b'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c3aed';
                    e.target.style.boxShadow = '0 15px 30px rgba(124, 58, 237, 0.1)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#f1f5f9';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                />
              </div>

              {/* Target CGPA */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#64748b',
                  marginBottom: 16,
                  fontFamily: 'var(--font-display)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  <Target size={20} /> Target CGPA
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.01"
                  placeholder="0.00"
                  value={targetCGPA}
                  onChange={(e) => setTargetCGPA(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    border: '2px solid #f1f5f9',
                    borderRadius: 24,
                    fontSize: 18,
                    fontFamily: 'var(--font-display)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: '#ffffff',
                    fontWeight: 700,
                    color: '#1e1b4b'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c3aed';
                    e.target.style.boxShadow = '0 15px 30px rgba(124, 58, 237, 0.1)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#f1f5f9';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                />
              </div>

              {/* Semesters Completed */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#64748b',
                  marginBottom: 16,
                  fontFamily: 'var(--font-display)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  <Check size={20} /> Completed
                </label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  placeholder="0"
                  value={semestersCompleted}
                  onChange={(e) => setSemestersCompleted(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    border: '2px solid #f1f5f9',
                    borderRadius: 24,
                    fontSize: 18,
                    fontFamily: 'var(--font-display)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: '#ffffff',
                    fontWeight: 700,
                    color: '#1e1b4b'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c3aed';
                    e.target.style.boxShadow = '0 15px 30px rgba(124, 58, 237, 0.1)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#f1f5f9';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                />
              </div>

              {/* Total Semesters */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#64748b',
                  marginBottom: 16,
                  fontFamily: 'var(--font-display)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  <BookOpen size={20} /> Program Length
                </label>
                <select
                  value={totalSemesters}
                  onChange={(e) => setTotalSemesters(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    border: '2px solid #f1f5f9',
                    borderRadius: 24,
                    fontSize: 18,
                    fontFamily: 'var(--font-display)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: '#ffffff',
                    fontWeight: 700,
                    color: '#1e1b4b',
                    appearance: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c3aed';
                    e.target.style.boxShadow = '0 15px 30px rgba(124, 58, 237, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#f1f5f9';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value={8}>8 Semesters (4 years)</option>
                  <option value={10}>10 Semesters (5 years)</option>
                  <option value={12}>12 Semesters (6 years)</option>
                </select>
              </div>
            </div>

            {/* Calculate Button */}
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <PremiumButton
                onClick={calculateRequiredGPA}
                style={{ 
                  width: '100%', 
                  maxWidth: 400,
                  padding: '24px 40px',
                  fontSize: 18,
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  boxShadow: '0 20px 40px rgba(124, 58, 237, 0.25)'
                }}
              >
                <Calculator size={24} weight="bold" />
                Analyze My Academic Path
              </PremiumButton>
              
              <div style={{ 
                marginTop: 24, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 8, 
                color: '#94a3b8', 
                fontSize: 14,
                fontFamily: 'var(--font-body)'
              }}>
                <Lightning size={16} weight="fill" color="#fbbf24" />
                AI-Powered Strategic Planning
              </div>
            </div>
          </div>

          <SalvationMeter />

          {/* Results Section */}
          <AnimatePresence>
            {calculated && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="reveal-child"
                style={{
                  background: 'linear-gradient(135deg, #fdfaff 0%, #f5f3ff 50%, #ede9fe 100%)',
                  borderRadius: 40,
                  padding: '60px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 40px 100px rgba(124, 58, 237, 0.12), 0 10px 40px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  marginTop: 80
                }}
              >
                {/* Decorative Elements */}
                <div style={{
                  position: 'absolute',
                  top: -100,
                  right: -100,
                  width: 300,
                  height: 300,
                  background: 'radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, rgba(167, 139, 250, 0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }} />
                
                {/* Frosted Glass Content Card */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(30px)',
                  borderRadius: 32,
                  padding: '50px',
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}>
                  {isImpossible ? (
                    <div style={{ padding: '20px 0' }}>
                      <div style={{
                        width: 100,
                        height: 100,
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 32px',
                        boxShadow: '0 10px 20px rgba(245, 158, 11, 0.1)'
                      }}>
                        <Target size={48} color="#f59e0b" weight="duotone" />
                      </div>
                      <h3 style={{
                        fontSize: 32,
                        fontWeight: 800,
                        color: '#92400e',
                        marginBottom: 16,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '-0.02em'
                      }}>
                        Let's Refine the Goal
                      </h3>
                      <p style={{
                        fontSize: 18,
                        color: '#78350f',
                        marginBottom: 40,
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.7,
                        maxWidth: 500,
                        margin: '0 auto 40px',
                        opacity: 0.8
                      }}>
                        A {targetCGPA} CGPA is a bold target! Based on your current progress, 
                        let's find a sweet spot that balances ambition with reality. 
                      </p>
                      <PremiumButton
                        onClick={() => {
                          setTargetCGPA(Math.min(4.9, Math.max(3.5, targetCGPA - 0.2)).toFixed(2));
                          setCalculated(false);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          border: 'none',
                          color: 'white',
                          boxShadow: '0 10px 25px rgba(217, 119, 6, 0.3)'
                        }}
                      >
                        🎯 Adjust My Goal
                      </PremiumButton>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        width: 80,
                        height: 80,
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        transform: 'rotate(-5deg)',
                        boxShadow: '0 8px 16px rgba(34, 197, 94, 0.1)'
                      }}>
                        <Check size={40} color="#22c55e" weight="bold" />
                      </div>
                      
                      <h3 style={{
                        fontSize: 42,
                        fontWeight: 800,
                        color: '#1e1b4b',
                        marginBottom: 12,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '-0.03em'
                      }}>
                        The Success Path
                      </h3>
                      <p style={{
                        fontSize: 18,
                        color: '#64748b',
                        marginBottom: 50,
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.6
                      }}>
                        A strategic roadmap to secure your <span style={{ color: '#7c3aed', fontWeight: 700 }}>{targetCGPA} CGPA</span>
                      </p>
                      
                      {/* Interactive Roadmap */}
                      <div style={{ marginBottom: 60, padding: '0 10px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 60,
                          position: 'relative',
                          padding: '0 30px'
                        }}>
                          {/* Enhanced Roadmap Line */}
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '60px',
                            right: '60px',
                            height: '8px',
                            background: 'rgba(0,0,0,0.04)',
                            borderRadius: 4,
                            zIndex: 0
                          }}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(semestersCompleted / totalSemesters) * 100}%` }}
                              transition={{ duration: 1.5, ease: "circOut" }}
                              style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #22c55e 0%, #10b981 100%)',
                                borderRadius: 4,
                                boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                              }}
                            />
                          </div>
                          
                          {/* Semester Nodes */}
                          {[...Array(totalSemesters)].map((_, index) => {
                            const semesterNum = index + 1;
                            const isCompleted = semesterNum <= semestersCompleted;
                            const isCurrent = semesterNum === semestersCompleted + 1;
                            
                            return (
                              <motion.div
                                key={semesterNum}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.08, type: "spring", stiffness: 150 }}
                                whileHover={{ y: -5 }}
                                style={{
                                  position: 'relative',
                                  zIndex: 1
                                }}
                              >
                                {/* 3D Semester Node */}
                                <div style={{
                                  width: isCurrent ? 56 : 44,
                                  height: isCurrent ? 56 : 44,
                                  borderRadius: isCurrent ? '18px' : '14px',
                                  background: isCompleted 
                                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                    : isCurrent
                                    ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                                    : 'white',
                                  boxShadow: isCurrent 
                                    ? '0 10px 20px rgba(124, 58, 237, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3)' 
                                    : isCompleted
                                    ? '0 8px 16px rgba(34, 197, 94, 0.2)'
                                    : '0 4px 10px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(0,0,0,0.05)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  border: isCurrent ? '3px solid white' : 'none'
                                }}>
                                  <span style={{
                                    fontSize: isCurrent ? 16 : 14,
                                    fontWeight: 800,
                                    color: isCompleted || isCurrent ? 'white' : '#94a3b8',
                                    fontFamily: 'var(--font-display)'
                                  }}>
                                    S{semesterNum}
                                  </span>
                                </div>
                                
                                {/* GPA Badge */}
                                <div style={{
                                  position: 'absolute',
                                  top: isCurrent ? 68 : 56,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap'
                                }}>
                                  <div style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    color: isCompleted ? '#22c55e' : isCurrent ? '#7c3aed' : '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: 4
                                  }}>
                                    {isCompleted ? 'Done' : isCurrent ? 'Now' : 'Aim'}
                                  </div>
                                  {!isCompleted && requiredGPA && (
                                    <motion.div 
                                      initial={{ scale: 0.9, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      style={{
                                        background: isCurrent ? '#7c3aed' : '#f8fafc',
                                        color: isCurrent ? 'white' : '#475569',
                                        padding: '4px 10px',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-display)',
                                        boxShadow: isCurrent ? '0 4px 10px rgba(124, 58, 237, 0.2)' : 'none',
                                        border: isCurrent ? 'none' : '1px solid #e2e8f0'
                                      }}
                                    >
                                      {requiredGPA.toFixed(2)}
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                        
                        {/* Summary Box */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.03) 0%, rgba(124, 58, 237, 0.03) 100%)',
                          borderRadius: 24,
                          padding: '32px',
                          border: '1px solid rgba(124, 58, 237, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 24,
                          textAlign: 'left'
                        }}>
                          <div style={{
                            width: 64,
                            height: 64,
                            background: 'white',
                            borderRadius: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 32,
                            boxShadow: '0 8px 20px rgba(0,0,0,0.04)'
                          }}>
                            🚀
                          </div>
                          <div>
                            <h4 style={{
                              fontSize: 20,
                              fontWeight: 800,
                              color: '#1e1b4b',
                              marginBottom: 4,
                              fontFamily: 'var(--font-display)'
                            }}>
                              Target: {targetCGPA} CGPA
                            </h4>
                            <p style={{
                              fontSize: 15,
                              color: '#64748b',
                              fontFamily: 'var(--font-body)',
                              margin: 0,
                              lineHeight: 1.5
                            }}>
                              Maintain a <span style={{ color: '#7c3aed', fontWeight: 700 }}>{requiredGPA?.toFixed(2)} GPA</span> for the next {totalSemesters - semestersCompleted} semesters to achieve excellence.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div style={{
                        display: 'flex',
                        gap: 20,
                        justifyContent: 'center',
                        marginTop: 40
                      }}>
                        <motion.button
                          onClick={() => window.location.href = '/signup'}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            background: 'linear-gradient(135deg, #111 0%, #333 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '18px 40px',
                            borderRadius: 20,
                            fontSize: 16,
                            fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                            cursor: 'pointer',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                          }}
                        >
                          Start Your Journey
                          <ArrowRight size={20} weight="bold" />
                        </motion.button>
                        
                        <motion.button
                          onClick={generateRecoveryCard}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            background: 'white',
                            color: '#111',
                            border: '1px solid #e2e8f0',
                            padding: '18px 32px',
                            borderRadius: 20,
                            fontSize: 16,
                            fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                          }}
                        >
                          <UploadSimple size={20} weight="bold" />
                          Share Roadmap
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Recovery Card Modal */}
      <AnimatePresence>
        {showRecoveryCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setShowRecoveryCard(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 32,
                padding: '48px',
                maxWidth: 520,
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 30px 60px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Achievement Header Badge */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 8,
                background: 'linear-gradient(90deg, #22c55e, #7c3aed, #fb923c)'
              }} />

              <div style={{
                background: '#ffffff',
                borderRadius: 24,
                padding: '32px',
                position: 'relative',
                border: '1px solid #f1f5f9',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                marginBottom: 32
              }}>
                {/* Academic Watermark Seal */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-15deg)',
                  opacity: 0.03,
                  pointerEvents: 'none',
                  zIndex: 0
                }}>
                  <GraduationCap size={240} weight="fill" />
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(124, 58, 237, 0.05)',
                    padding: '8px 16px',
                    borderRadius: 99,
                    color: '#7c3aed',
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 24,
                    fontFamily: 'var(--font-display)'
                  }}>
                    <Star size={16} weight="fill" />
                    Certified Academic Path
                  </div>

                  <h2 style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: '#1e1b4b',
                    marginBottom: 8,
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em'
                  }}>
                    Commitment to Excellence
                  </h2>
                  <p style={{
                    fontSize: 16,
                    color: '#64748b',
                    marginBottom: 32,
                    fontFamily: 'var(--font-body)'
                  }}>
                    A verified roadmap for academic distinction
                  </p>

                  {/* Target Display */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    borderRadius: 24,
                    padding: '40px 20px',
                    marginBottom: 24,
                    color: 'white',
                    boxShadow: '0 20px 40px rgba(30, 27, 75, 0.2)'
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Target Graduation CGPA</div>
                    <div style={{ fontSize: 72, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{targetCGPA}</div>
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      marginTop: 16, 
                      fontSize: 14, 
                      fontWeight: 600, 
                      background: 'rgba(255,255,255,0.1)', 
                      padding: '6px 12px', 
                      borderRadius: 8 
                    }}>
                      <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }} />
                      Strategic Milestone Set
                    </div>
                  </div>

                  {/* Requirement Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    marginBottom: 32
                  }}>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Required GPA</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#1e1b4b', fontFamily: 'var(--font-display)' }}>{requiredGPA?.toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Remaining</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#1e1b4b', fontFamily: 'var(--font-display)' }}>{totalSemesters - semestersCompleted} Sem</div>
                    </div>
                  </div>

                  {/* Luter Branding */}
                  <div style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12
                  }}>
                    <div style={{ width: 40, height: 40, background: '#7c3aed', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 20 }}>L</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b' }}>Luter Academy</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Verified Academic Roadmap</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <PremiumButton
                  onClick={downloadRecoveryCard}
                  style={{ flex: 1 }}
                >
                  <DownloadSimple size={20} weight="bold" />
                  Save Achievement
                </PremiumButton>
                
                <button
                  onClick={() => setShowRecoveryCard(false)}
                  style={{
                    padding: '16px 24px',
                    borderRadius: 20,
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#64748b',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SharedFooter />
    </div>
  );
};

export default PathCalculator;
