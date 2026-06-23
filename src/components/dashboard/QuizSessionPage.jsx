import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X, Gear, Sparkle, CaretLeft, CaretRight, 
  CheckCircle, XCircle, Key, MagnifyingGlass, BookOpen,
  Heart, Trophy, CircleNotch, SpeakerHigh, SpeakerSlash,
  PaperPlaneRight, ArrowsCounterClockwise
} from '@phosphor-icons/react';
import { supabase } from '../../supabaseClient';

// ==========================================
// WEB AUDIO API PROCEDURAL SOUND ENGINE
// ==========================================
let audioCtx = null;
let bgMusicInterval = null;
let bgMusicOscs = [];
let isAudioMuted = false;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playCorrectSound = () => {
  if (isAudioMuted) return;
  try {
    initAudio();
    const t = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, t); // C5
    osc1.frequency.setValueAtTime(659.25, t + 0.1); // E5
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, t); // C6
    osc2.frequency.setValueAtTime(1318.51, t + 0.1); // E6
    
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.5);
    osc2.stop(t + 0.5);
  } catch (err) {
    console.warn("Audio play failed:", err);
  }
};

const playWrongSound = () => {
  if (isAudioMuted) return;
  try {
    initAudio();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220.00, t); // A3
    osc.frequency.setValueAtTime(196.00, t + 0.12); // G3
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, t);
    
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.22, t + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.45);
  } catch (err) {
    console.warn("Audio play failed:", err);
  }
};

const playClickSound = () => {
  if (isAudioMuted) return;
  try {
    initAudio();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.08);
    
    gainNode.gain.setValueAtTime(0.06, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.08);
  } catch (err) {
    console.warn("Audio play failed:", err);
  }
};

const startBgMusic = () => {
  try {
    initAudio();
    if (bgMusicInterval) return;
    
    const chords = [
      [130.81, 164.81, 196.00, 246.94], // C major 7 (C3, E3, G3, B3)
      [146.83, 174.61, 220.00, 261.63], // D minor 7 (D3, F3, A3, C4)
      [110.00, 130.81, 164.81, 196.00], // A minor 7 (A2, C3, E3, G3)
      [174.61, 220.00, 261.63, 329.63]  // F major 7 (F3, A3, C4, E4)
    ];
    
    let chordIdx = 0;
    
    const playNextChord = () => {
      if (isAudioMuted || !audioCtx) return;
      const t = audioCtx.currentTime;
      const chord = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;
      
      bgMusicOscs.forEach(o => {
        try { o.stop(t); } catch(e){}
      });
      bgMusicOscs = [];
      
      chord.forEach((freq) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(0.02, t + 1.5);
        gainNode.gain.setValueAtTime(0.02, t + 4.5);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 6.0);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(t);
        osc.stop(t + 6.0);
        bgMusicOscs.push(osc);
      });
    };
    
    playNextChord();
    bgMusicInterval = setInterval(playNextChord, 5600);
  } catch (err) {
    console.warn("Background music failed:", err);
  }
};

const stopBgMusic = () => {
  if (bgMusicInterval) {
    clearInterval(bgMusicInterval);
    bgMusicInterval = null;
  }
  const t = audioCtx ? audioCtx.currentTime : 0;
  bgMusicOscs.forEach(o => {
    try { o.stop(t); } catch(e){}
  });
  bgMusicOscs = [];
};

// ==========================================
// QUIZ SESSION PAGE COMPONENT
// ==========================================
export default function QuizSessionPage() {
  const { materialId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [material, setMaterial] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('luter-theme') === 'dark';
  });

  // Quiz Performance & States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Gamification stats
  const [keys, setKeys] = useState(15);
  const [hearts, setHearts] = useState(5);
  const [xp, setXp] = useState(0);
  const [disabledOptions, setDisabledOptions] = useState([]); // indices of options greyed out by Hint
  const [showExplain, setShowExplain] = useState(false);

  // Score tracking
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  // Sound settings
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // AI Chat Tutor states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Sync isAudioMuted global helper
  useEffect(() => {
    isAudioMuted = !sfxEnabled;
  }, [sfxEnabled]);

  // Sync background music state
  useEffect(() => {
    if (musicEnabled) {
      startBgMusic();
    } else {
      stopBgMusic();
    }
    return () => stopBgMusic();
  }, [musicEnabled]);

  // Fetch User and Material data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate('/signin');
          return;
        }
        setUser(currentUser);

        const { data: mat, error: matErr } = await supabase
          .from('materials')
          .select('*')
          .eq('id', materialId)
          .single();

        if (matErr || !mat) {
          console.error("Error loading material:", matErr);
          navigate('/home');
          return;
        }
        setMaterial(mat);

        const { data: analysis } = await supabase
          .from('material_analysis')
          .select('*')
          .eq('material_id', materialId)
          .maybeSingle();

        if (analysis) {
          const quizObj = analysis.quiz || analysis.analysis?.quiz;
          const loadedQuestions = Array.isArray(quizObj) 
            ? quizObj 
            : (quizObj?.questions || []);
          setQuestions(loadedQuestions);
        }
      } catch (err) {
        console.error("Failed to initialize quiz session:", err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [materialId, navigate]);

  // Dark mode class syncing
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('luter-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Sync chat messages on question change
  const currentQ = questions[currentIndex];
  useEffect(() => {
    if (currentQ) {
      setChatMessages([
        {
          id: 'initial',
          sender: 'assistant',
          text: currentQ.explanation || "Let me know if you would like me to explain this question!"
        }
      ]);
    }
  }, [currentIndex, currentQ]);

  // Answer matching helper
  const getCorrectIndex = (q) => {
    if (!q) return -1;
    const ans = q.correctAnswer ?? q.correct_answer ?? q.answer;
    if (ans === undefined || ans === null) return -1;
    if (typeof ans === 'number') return ans;

    if (typeof ans === 'string') {
      const lower = ans.trim().toLowerCase();
      if (lower === 'a') return 0;
      if (lower === 'b') return 1;
      if (lower === 'c') return 2;
      if (lower === 'd') return 3;
      if (lower === 'true' || lower === 'yes') return 1;
      if (lower === 'false' || lower === 'no') return 0;
      
      const parsed = parseInt(lower, 10);
      if (!isNaN(parsed)) return parsed;
      
      if (q.options) {
        const idx = q.options.findIndex(opt => {
          const text = (typeof opt === 'object' ? (opt.text || opt.choice || "") : opt).toString().toLowerCase();
          return text === lower;
        });
        if (idx !== -1) return idx;
      }
    }
    return -1;
  };

  const correctIdx = currentQ ? getCorrectIndex(currentQ) : -1;

  const handleSelectOption = (idx) => {
    if (submitted || disabledOptions.includes(idx)) return;
    playClickSound();
    setSelectedOption(idx);
  };

  // Submit current answer selection
  const handleConfirm = () => {
    if (selectedOption === null || submitted) return;

    const correct = selectedOption === correctIdx;
    setIsCorrect(correct);
    setSubmitted(true);
    setShowExplain(true); // Auto-reveal explanation/chat on confirm

    if (correct) {
      playCorrectSound();
      setCorrectCount(c => c + 1);
      setXp(x => x + 15);
      setKeys(k => k + 5); // Reward keys/coins
    } else {
      playWrongSound();
      setWrongCount(w => w + 1);
      setHearts(h => Math.max(0, h - 1));
    }
  };

  // Skip current question or next question
  const handleNext = () => {
    playClickSound();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(idx => idx + 1);
      setSelectedOption(null);
      setSubmitted(false);
      setDisabledOptions([]);
      setShowExplain(false);
    } else {
      handleFinishQuiz();
    }
  };

  // Stats-bar chevron navigation
  const handlePrevChevron = () => {
    if (currentIndex > 0) {
      playClickSound();
      setCurrentIndex(idx => idx - 1);
      setSelectedOption(null);
      setSubmitted(false);
      setDisabledOptions([]);
      setShowExplain(false);
    }
  };

  const handleNextChevron = () => {
    if (currentIndex < questions.length - 1) {
      handleNext();
    }
  };

  // Hint: use a key to disable one wrong option
  const handleHint = () => {
    if (submitted || keys < 3 || !currentQ) return;
    playClickSound();

    const incorrectIndices = currentQ.options
      .map((_, idx) => idx)
      .filter(idx => idx !== correctIdx && !disabledOptions.includes(idx));

    if (incorrectIndices.length > 0) {
      const randomIndex = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)];
      setDisabledOptions(prev => [...prev, randomIndex]);
      setKeys(k => Math.max(0, k - 3));
      
      if (selectedOption === randomIndex) {
        setSelectedOption(null);
      }
    }
  };

  // Reveal correct answer immediately using 5 keys
  const handleReveal = () => {
    if (submitted || keys < 5) return;
    playClickSound();
    setSelectedOption(correctIdx);
    setIsCorrect(true);
    setSubmitted(true);
    setShowExplain(true);
    setCorrectCount(c => c + 1);
    setXp(x => x + 5);
    setKeys(k => Math.max(0, k - 5));
  };

  const handleToggleExplain = () => {
    playClickSound();
    setShowExplain(prev => !prev);
  };

  // Save attempt and finish
  const handleFinishQuiz = async () => {
    setSavingResult(true);
    const finalAccuracy = questions.length > 0 
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

    try {
      if (user && material) {
        await supabase
          .from('quiz_attempts')
          .insert([{
            user_id: user.id,
            material_id: material.id,
            score: correctCount,
            total: questions.length,
            accuracy: finalAccuracy,
            correct: correctCount,
            wrong: wrongCount
          }]);
      }
    } catch (e) {
      console.error("Failed to save quiz attempt:", e);
    } finally {
      setSavingResult(false);
      setIsFinished(true);
    }
  };

  // Live Chat Tutor follow-up generator
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    playClickSound();
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: chatInput.trim()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let responseText = `Regarding your question: "${userMsg.text}". Let's take a look. `;
      const query = userMsg.text.toLowerCase();

      if (query.includes('why') || query.includes('explain') || query.includes('reason')) {
        responseText += `The core reason here is related to the explanation: "${currentQ.explanation}". Since the correct option is "${currentQ.options[correctIdx]}", any other choice doesn't align with these parameters.`;
      } else if (query.includes('how') || query.includes('formula') || query.includes('solve')) {
        responseText += `To solve this, analyze the step-by-step breakdown: First identify the definitions or values given. Then, eliminate options that are structurally incorrect. Would you like me to walk through another part of this question?`;
      } else if (query.includes('what') || query.includes('mean')) {
        responseText += `In this context, the terminology refers to standard concepts in ${material?.name || 'this deck'}. Let me know if you would like definitions of the terms used in the options!`;
      } else {
        responseText += `I see! That points to the core mechanism in ${material?.name || 'the material'}. Let me know if you want me to expand on why the correct answer is "${currentQ.options[correctIdx]}".`;
      }

      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: responseText
      }]);
      setIsTyping(false);
    }, 1100);
  };

  // Layout style selectors
  const pageBg = isDark ? '#0F172A' : '#F9FAFB';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderCol = isDark ? '#334155' : '#E2E8F0';
  const fontColor = isDark ? '#F9FAFB' : '#333333';
  const subFontColor = isDark ? '#94A3B8' : '#64748B';
  const gridDotColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';

  // Loading view
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: pageBg,
        fontFamily: 'Outfit, sans-serif'
      }}>
        <CircleNotch size={40} className="spin" color="#C4B5FD" />
      </div>
    );
  }

  // No questions view
  if (questions.length === 0) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: pageBg,
        fontFamily: 'Outfit, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        <XCircle size={64} color="#EF4444" />
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '20px', color: fontColor }}>No Questions Found</h2>
        <p style={{ fontSize: '15px', color: subFontColor, maxWidth: '440px', margin: '8px 0 28px' }}>
          This material does not contain any quiz questions. Please generate questions in the workstation workspace first.
        </p>
        <button
          onClick={() => navigate(`/workstation/${materialId}?view=quizzes`)}
          style={{
            padding: '14px 28px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: '#98FF98',
            color: '#14532D',
            fontWeight: 800,
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(152, 255, 152, 0.3)'
          }}
        >
          Go to Workstation
        </button>
      </div>
    );
  }

  // Final scorecard view
  if (isFinished) {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pageBg,
        fontFamily: 'Outfit, sans-serif',
        backgroundImage: `radial-gradient(${gridDotColor} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
        padding: '24px'
      }}>
        <div style={{
          background: cardBg,
          border: `1px solid ${borderCol}`,
          borderRadius: '28px',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '520px',
          textAlign: 'center',
          boxShadow: isDark ? '0 16px 48px rgba(0, 0, 0, 0.4)' : '0 16px 48px rgba(15, 23, 42, 0.06)'
        }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: accuracy >= 70 ? 'rgba(152, 255, 152, 0.15)' : 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            border: `2px solid ${accuracy >= 70 ? '#98FF98' : '#EF4444'}`
          }}>
            <Trophy size={42} color={accuracy >= 70 ? '#10B981' : '#F59E0B'} weight="fill" />
          </div>

          <h2 style={{ fontSize: '30px', fontWeight: 900, color: fontColor, margin: '0 0 10px' }}>
            {accuracy >= 70 ? 'Excellent job!' : 'Good try!'}
          </h2>
          <p style={{ fontSize: '15px', color: subFontColor, margin: '0 0 36px' }}>
            You scored {correctCount} out of {questions.length} correct.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '18px',
            marginBottom: '40px'
          }}>
            <div style={{
              background: isDark ? '#111827' : '#F8FAFC',
              borderRadius: '20px',
              padding: '20px',
              border: `1.5px solid ${borderCol}`
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: subFontColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accuracy</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: fontColor, marginTop: '6px' }}>{accuracy}%</div>
            </div>
            <div style={{
              background: isDark ? '#111827' : '#F8FAFC',
              borderRadius: '20px',
              padding: '20px',
              border: `1.5px solid ${borderCol}`
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: subFontColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP Earned</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#C4B5FD', marginTop: '6px' }}>+{xp} XP</div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/workstation/${materialId}?view=quizzes`)}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: '#C4B5FD',
              color: '#1E1B4B',
              fontWeight: 800,
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(196, 181, 253, 0.35)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            Close Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: pageBg,
      fontFamily: 'Outfit, sans-serif',
      backgroundImage: `radial-gradient(${gridDotColor} 1.5px, transparent 1.5px)`,
      backgroundSize: '28px 28px',
      display: 'flex',
      flexDirection: 'column',
      color: fontColor,
      overflowX: 'hidden'
    }}>
      
      {/* ==========================================
          HEADER CONTROLS
          ========================================== */}
      <div style={{
        padding: '18px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: cardBg,
        borderBottom: `1.5px solid ${borderCol}`,
        zIndex: 50
      }}>
        {/* Left Side: Document Symbol & Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 800,
          fontSize: '16px',
          maxWidth: '300px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            backgroundColor: '#C4B5FD'
          }} />
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: fontColor
          }}>
            {material?.name || 'Quiz Session'}
          </span>
        </div>

        {/* Center: Segmented Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {questions.map((_, qIdx) => {
            let segmentBg = isDark ? '#334155' : '#E2E8F0';
            if (qIdx < currentIndex) {
              segmentBg = '#98FF98'; // Mint for completed questions
            } else if (qIdx === currentIndex) {
              segmentBg = '#C4B5FD'; // Lavender for current question
            }
            return (
              <div
                key={qIdx}
                style={{
                  width: '42px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: segmentBg,
                  transition: 'background-color 0.25s ease'
                }}
              />
            );
          })}
        </div>

        {/* Right Side: Indicators, Audio Controls & Gear */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* XP Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 800, color: '#C4B5FD' }}>
            <Sparkle size={18} weight="fill" />
            <span>{xp} XP</span>
          </div>

          {/* Coins Chest Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 800, color: '#FFD2A6' }}>
            <Key size={18} weight="fill" />
            <span>{keys} Coins</span>
          </div>

          {/* Hearts Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>
            <Heart size={18} weight="fill" />
            <span>{hearts}</span>
          </div>

          <div style={{ height: '20px', width: '1.5px', background: borderCol }} />

          {/* Audio Mute Icon */}
          <button 
            onClick={() => setSfxEnabled(!sfxEnabled)}
            title={sfxEnabled ? "Mute sounds" : "Unmute sounds"}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: fontColor,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {sfxEnabled ? <SpeakerHigh size={20} weight="bold" /> : <SpeakerSlash size={20} weight="bold" />}
          </button>

          {/* Settings Trigger */}
          <button 
            onClick={() => {
              playClickSound();
              setShowSettingsModal(true);
            }}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: fontColor,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Gear size={20} weight="bold" />
          </button>

          {/* Leave Quiz Button */}
          <button
            onClick={() => navigate(`/workstation/${materialId}?view=quizzes`)}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: `1.5px solid ${borderCol}`,
              backgroundColor: cardBg,
              color: fontColor,
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Leave Quiz
          </button>
        </div>
      </div>

      {/* ==========================================
          MAIN CONTENT CARD
          ========================================== */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px 120px'
      }}>
        
        <div style={{
          width: '100%',
          maxWidth: '860px',
          background: cardBg,
          borderRadius: '28px',
          padding: '40px',
          border: `1.5px solid ${borderCol}`,
          boxShadow: isDark ? '0 16px 40px rgba(0, 0, 0, 0.3)' : '0 16px 40px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}>
          {/* Card Subheader */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: '#EF4444',
              fontSize: '12px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />
              Live Sync
            </span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: subFontColor }}>
              Question {currentIndex + 1} / {questions.length}
            </span>
          </div>

          {/* Question Text Box (Mint Background) */}
          <div style={{
            background: isDark ? 'rgba(152, 255, 152, 0.06)' : 'rgba(152, 255, 152, 0.12)',
            border: `1.5px solid ${isDark ? 'rgba(152, 255, 152, 0.2)' : 'rgba(152, 255, 152, 0.4)'}`,
            borderRadius: '20px',
            padding: '24px 32px'
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 800,
              lineHeight: 1.6,
              color: fontColor,
              margin: 0
            }}>
              {currentQ?.question}
            </h2>
          </div>

          {/* Options 2x2 Grid Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            {currentQ?.options?.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isOptDisabled = disabledOptions.includes(idx);
              const optionText = typeof opt === 'object' ? (opt.text || opt.choice || '') : opt;

              let optBg = cardBg;
              let optBorder = `1.5px solid ${borderCol}`;
              let optColor = fontColor;
              let badgeBg = isDark ? '#2D3748' : '#F1F5F9';
              let badgeColor = isDark ? '#94A3B8' : '#4B5563';
              let opacity = 1;

              if (isOptDisabled) {
                optBg = isDark ? '#111827' : '#F8FAFC';
                optBorder = `1.5px solid ${isDark ? '#1F2937' : '#E2E8F0'}`;
                optColor = subFontColor;
                badgeBg = isDark ? '#111827' : '#E2E8F0';
                badgeColor = subFontColor;
                opacity = 0.5;
              } else if (submitted) {
                if (idx === correctIdx) {
                  // Correct answer
                  optBg = '#98FF98';
                  optBorder = '1.5px solid #4ADE80';
                  optColor = '#064E3B';
                  badgeBg = '#4ADE80';
                  badgeColor = '#064E3B';
                } else if (isSelected) {
                  // Wrong selected answer
                  optBg = '#FEE2E2';
                  optBorder = '1.5px solid #FCA5A5';
                  optColor = '#7F1D1D';
                  badgeBg = '#FCA5A5';
                  badgeColor = '#7F1D1D';
                }
              } else if (isSelected) {
                // Currently clicked / selected (Peach)
                optBg = '#FFD2A6';
                optBorder = '1.5px solid #FDBA74';
                optColor = '#7C2D12';
                badgeBg = '#FDBA74';
                badgeColor = '#7C2D12';
              }

              return (
                <button
                  key={idx}
                  disabled={submitted || isOptDisabled}
                  onClick={() => handleSelectOption(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    width: '100%',
                    minHeight: '88px',
                    borderRadius: '20px',
                    border: optBorder,
                    backgroundColor: optBg,
                    color: optColor,
                    opacity: opacity,
                    cursor: (submitted || isOptDisabled) ? 'default' : 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    overflow: 'hidden',
                    transition: 'all 0.18s ease',
                    outline: 'none',
                    boxShadow: isSelected && !submitted ? '0 8px 24px rgba(253, 186, 116, 0.2)' : 'none'
                  }}
                  className="quiz-option-button"
                >
                  <div style={{
                    width: '64px',
                    background: badgeBg,
                    color: badgeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '22px',
                    borderRight: optBorder,
                    flexShrink: 0,
                    transition: 'all 0.18s ease'
                  }}>
                    {['A', 'B', 'C', 'D'][idx]}
                  </div>
                  <div style={{
                    flex: 1,
                    padding: '20px 24px',
                    fontSize: '18px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    lineHeight: 1.4
                  }}>
                    {optionText}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Floating Utilities Bar */}
          {!submitted && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              width: '100%'
            }}>
              {/* Hint */}
              <button
                onClick={handleHint}
                disabled={keys < 3}
                style={{
                  flex: 1,
                  maxWidth: '140px',
                  height: '42px',
                  borderRadius: '9999px',
                  border: `1.5px solid ${borderCol}`,
                  background: cardBg,
                  color: keys < 3 ? subFontColor : fontColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: keys < 3 ? 'default' : 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Key size={16} color="#D97706" weight="fill" />
                <span>Hint (3c)</span>
              </button>

              {/* Reveal */}
              <button
                onClick={handleReveal}
                disabled={keys < 5}
                style={{
                  flex: 1,
                  maxWidth: '140px',
                  height: '42px',
                  borderRadius: '9999px',
                  border: `1.5px solid ${borderCol}`,
                  background: cardBg,
                  color: keys < 5 ? subFontColor : fontColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: keys < 5 ? 'default' : 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <MagnifyingGlass size={16} color="#3B82F6" weight="bold" />
                <span>Reveal (5c)</span>
              </button>

              {/* Explain Toggle */}
              <button
                onClick={handleToggleExplain}
                style={{
                  flex: 1,
                  maxWidth: '140px',
                  height: '42px',
                  borderRadius: '9999px',
                  border: `1.5px solid ${borderCol}`,
                  background: cardBg,
                  color: fontColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <BookOpen size={16} color="#C4B5FD" weight="fill" />
                <span>Explain</span>
              </button>
            </div>
          )}

          {/* ==========================================
              INTERACTIVE AI MASCOT CHAT TUTOR
              ========================================== */}
          {showExplain && (
            <div style={{
              width: '100%',
              background: isDark ? 'rgba(196, 181, 253, 0.02)' : 'rgba(196, 181, 253, 0.05)',
              border: `1.5px solid ${borderCol}`,
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.3s ease'
            }}>
              {/* Tutor Header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: `1.5px solid ${borderCol}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark ? '#111827' : '#F9FAFB'
              }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: isDark ? '#1F2937' : '#F3F4F6',
                  padding: '6px 16px 6px 6px',
                  borderRadius: '9999px',
                  border: `1.5px solid ${isDark ? '#374151' : '#E5E7EB'}`
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#C4B5FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    <img src="/mascot.png" alt="Gizmo Mascot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: fontColor, lineHeight: 1.2 }}>Explain AI</div>
                    <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gizmo Online</div>
                  </div>
                </div>
                <button
                  onClick={handleToggleExplain}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: subFontColor,
                    padding: '4px'
                  }}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Chat Message List */}
              <div style={{
                maxHeight: '280px',
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }} className="custom-scrollbar">
                {chatMessages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                        animation: 'fadeIn 0.2s ease'
                      }}
                    >
                      <div style={{
                        backgroundColor: isUser 
                          ? (isDark ? 'rgba(196, 181, 253, 0.2)' : '#C4B5FD') 
                          : (isDark ? '#2D3748' : '#FFFFFF'),
                        color: isUser 
                          ? (isDark ? '#F5F3FF' : '#1E1B4B') 
                          : fontColor,
                        padding: '12px 18px',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        borderTop: isUser ? 'none' : `1.5px solid ${borderCol}`,
                        borderBottom: isUser ? 'none' : `1.5px solid ${borderCol}`,
                        borderLeft: isUser ? 'none' : `1.5px solid ${borderCol}`,
                        borderRight: isUser ? '3px solid #7C3AED' : `1.5px solid ${borderCol}`,
                        fontSize: '14px',
                        fontWeight: 700,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '12px 18px' }}>
                    <span className="dot-blink" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C4B5FD' }} />
                    <span className="dot-blink" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C4B5FD', animationDelay: '0.2s' }} />
                    <span className="dot-blink" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C4B5FD', animationDelay: '0.4s' }} />
                  </div>
                )}
              </div>

              {/* Chat Input Field */}
              <form 
                onSubmit={handleSendChat}
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '16px 20px',
                  borderTop: `1.5px solid ${borderCol}`,
                  background: isDark ? '#111827' : '#F9FAFB'
                }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for a follow up..."
                  style={{
                    flex: 1,
                    borderRadius: '9999px',
                    border: `1.5px solid ${borderCol}`,
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    outline: 'none',
                    background: cardBg,
                    color: fontColor,
                    transition: 'all 0.15s'
                  }}
                  className="chat-input-field"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: chatInput.trim() ? '#C4B5FD' : (isDark ? '#374151' : '#E2E8F0'),
                    color: chatInput.trim() ? '#1E1B4B' : subFontColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: chatInput.trim() ? 'pointer' : 'default',
                    transition: 'all 0.15s'
                  }}
                >
                  <PaperPlaneRight size={18} weight="fill" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* ==========================================
          BOTTOM STICKY ACTION BAR
          ========================================== */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: cardBg,
        borderTop: `1.5px solid ${borderCol}`,
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        zIndex: 100
      }}>
        {!submitted ? (
          <button
            onClick={handleConfirm}
            disabled={selectedOption === null}
            style={{
              width: '100%',
              maxWidth: '860px',
              height: '52px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: selectedOption === null ? (isDark ? '#334155' : '#E2E8F0') : '#98FF98',
              color: selectedOption === null ? subFontColor : '#14532D',
              fontWeight: 800,
              fontSize: '15px',
              cursor: selectedOption === null ? 'default' : 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: selectedOption !== null ? '0 8px 24px rgba(152, 255, 152, 0.3)' : 'none'
            }}
          >
            Confirm
          </button>
        ) : (
          <div style={{
            display: 'flex',
            width: '100%',
            maxWidth: '860px',
            gap: '16px'
          }}>
            {/* Explain Again / Toggle Explain */}
            <button
              onClick={handleToggleExplain}
              style={{
                flex: 1,
                height: '52px',
                borderRadius: '9999px',
                border: `2px solid ${borderCol}`,
                backgroundColor: cardBg,
                color: fontColor,
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              {showExplain ? "Hide Explanation" : "Explain Again"}
            </button>

            {/* Continue / Next */}
            <button
              onClick={handleNext}
              style={{
                flex: 2,
                height: '52px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: '#98FF98',
                color: '#14532D',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: '0 8px 24px rgba(152, 255, 152, 0.3)'
              }}
            >
              Continue
            </button>
          </div>
        )}
      </div>

      {/* ==========================================
          SETTINGS MODAL OVERLAY
          ========================================== */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          fontFamily: 'Outfit, sans-serif'
        }}>
          <div style={{
            background: cardBg,
            border: `1.5px solid ${borderCol}`,
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: fontColor, margin: 0 }}>Quiz Settings</h3>
              <button 
                onClick={() => {
                  playClickSound();
                  setShowSettingsModal(false);
                }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: fontColor }}
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Theme Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: fontColor }}>Dark Mode</span>
                <input 
                  type="checkbox" 
                  checked={isDark} 
                  onChange={() => {
                    playClickSound();
                    setIsDark(!isDark);
                  }}
                  style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              {/* Sound Effects Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: fontColor }}>Sound Effects</span>
                <input 
                  type="checkbox" 
                  checked={sfxEnabled} 
                  onChange={() => {
                    playClickSound();
                    setSfxEnabled(!sfxEnabled);
                  }}
                  style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              {/* Background Music Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: fontColor, display: 'block' }}>Background Music</span>
                  <span style={{ fontSize: '11px', color: subFontColor }}>Gentle ambient synth generator</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={musicEnabled} 
                  onChange={() => {
                    playClickSound();
                    setMusicEnabled(!musicEnabled);
                  }}
                  style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ height: '1.5px', background: borderCol, margin: '10px 0' }} />

              {/* Restart Session */}
              <button
                onClick={() => {
                  playClickSound();
                  setCurrentIndex(0);
                  setSelectedOption(null);
                  setSubmitted(false);
                  setDisabledOptions([]);
                  setShowExplain(false);
                  setCorrectCount(0);
                  setWrongCount(0);
                  setHearts(5);
                  setXp(0);
                  setShowSettingsModal(false);
                }}
                style={{
                  padding: '12px',
                  borderRadius: '9999px',
                  border: `1.5px solid ${borderCol}`,
                  backgroundColor: isDark ? '#111827' : '#F9FAFB',
                  color: '#EF4444',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ArrowsCounterClockwise size={16} weight="bold" />
                <span>Restart Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          INLINE ANIMATIONS & GLOBAL CUSTOM CSS
          ========================================== */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dot-blink {
          animation: dotBlink 1.4s infinite both;
        }
        @keyframes dotBlink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }

        .quiz-option-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
        }

        .chat-input-field:focus {
          border-color: #C4B5FD !important;
          box-shadow: 0 0 0 3px rgba(196, 181, 253, 0.25) !important;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? '#374151' : '#CBD5E1'};
          border-radius: 9999px;
        }
      `}</style>

    </div>
  );
}
