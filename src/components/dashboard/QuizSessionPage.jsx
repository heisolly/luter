import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X, Gear, Sparkle, CaretLeft, CaretRight, 
  CheckCircle, XCircle, Key, MagnifyingGlass, BookOpen,
  Heart, Trophy, CircleNotch, SpeakerHigh, SpeakerSlash,
  PaperPlaneRight, ArrowsCounterClockwise, Plant, MagicWand, Lightning, Microphone, ArrowUp
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
  const [, setHearts] = useState(5);
  const [xp, setXp] = useState(0);
  const [disabledOptions, setDisabledOptions] = useState([]); // indices of options greyed out by Hint
  const [showExplain, setShowExplain] = useState(false);

  // Score tracking
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [, setSavingResult] = useState(false);

  // Sound settings
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // AI Chat Tutor states
  const [chatMessages, setChatMessages] = useState([]); // [{role: 'user'|'assistant', content: string}]
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

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

  const currentQ = questions[currentIndex];

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
    handleConfirm(idx);
  };



  // Submit current answer selection
  const handleConfirm = (overrideIdx = null) => {
    const targetIdx = overrideIdx !== null ? overrideIdx : selectedOption;
    if (targetIdx === null || submitted) return;

    const correct = targetIdx === correctIdx;
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
    // Clear AI chat for next question
    setChatMessages([]);
    setInitialMessage('');
    setIsChatOpen(false);
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


  // Hint: use a key to disable one wrong option + open AI chat
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

    // Open AI tutor and auto-send a hint request
    setIsChatOpen(true);
    setInitialMessage('Give me a useful hint for this question without revealing the answer.');
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

    // Open AI tutor and auto-explain the revealed answer
    setIsChatOpen(true);
    setInitialMessage('Explain why this is the correct answer and help me understand the concept behind it.');
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

  // Auto-send the initialMessage when the panel opens from Hint/Reveal
  useEffect(() => {
    if (initialMessage && isChatOpen && chatMessages.length === 0) {
      sendChatMessage(initialMessage);
      setInitialMessage('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, isChatOpen]);

  // Real Anthropic API chat call
  const sendChatMessage = async (text) => {
    if (!text.trim() || isTyping) return;

    playClickSound();
    const userMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...chatMessages, userMessage];

    setChatMessages(updatedMessages);
    setChatInput('');
    setIsTyping(true);

    const correctOptionText = currentQ?.options?.[correctIdx];
    const correctOptionLabel = typeof correctOptionText === 'object'
      ? (correctOptionText.text || correctOptionText.choice || '')
      : (correctOptionText || '');

    const systemPrompt = `You are a friendly and encouraging AI tutor inside Luter, a study platform.
The student is answering this quiz question:
"${currentQ?.question || ''}"

Correct answer: "${correctOptionLabel}"
${currentQ?.explanation ? `Explanation: "${currentQ.explanation}"` : ''}

${material?.extracted_text ? `Here is the relevant document context for the quiz:
"""
${material.extracted_text.slice(0, 4000)}
"""` : ''}

Rules:
- Be concise: 2–4 sentences max.
- Be warm and encouraging — like a cool senior student.
- If asked for the answer directly, give a useful hint instead, don't just reveal it.
- If the student got it wrong, help them understand WHY without just giving the answer.
- Use simple, clear language.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 300,
          messages: [
            { role: 'system', content: systemPrompt },
            ...updatedMessages
          ],
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      } else {
        throw new Error('Empty response from AI');
      }
    } catch (error) {
      console.error('AI Tutor error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Try again in a moment!",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Form submit handler
  const handleSendChat = (e) => {
    e.preventDefault();
    sendChatMessage(chatInput);
  };

  // Layout style selectors
  const pageBg = isDark ? '#0F172A' : '#F9FAFB';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderCol = isDark ? '#334155' : '#E2E8F0';
  const fontColor = isDark ? '#F9FAFB' : '#1F2937';
  const subFontColor = isDark ? '#94A3B8' : '#4B5563';
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
      height: '100dvh',
      width: '100vw',
      backgroundColor: isDark ? '#0B0F19' : '#FFFFFF',
      fontFamily: 'Outfit, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      color: fontColor,
      overflow: 'hidden'
    }}>
      
      {/* ==========================================
          HEADER CONTROLS (Top Navbar)
          ========================================== */}
      <div style={{
        height: '64px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Left Side: X Button */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <button
            onClick={() => navigate(`/workstation/${materialId}?view=quizzes`)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: subFontColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px'
            }}
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Center: Progress Bar Area */}
        <div style={{ display: 'flex', flex: 2, alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ width: '100%', maxWidth: '400px', height: '12px', background: isDark ? '#334155' : '#DDD6FE', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${((currentIndex) / questions.length) * 100}%`, height: '100%', background: '#7C3AED', borderRadius: '999px', transition: 'width 0.3s ease' }} />
          </div>
          {/* Decorative dots to match screenshot */}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDark ? '#334155' : '#F3F4F6' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDark ? '#334155' : '#F3F4F6' }} />
        </div>

        {/* Right Side: XP and Streak */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1,
          justifyContent: 'flex-end'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 600, color: subFontColor }}>
            <span>{xp}</span>
            <Sparkle size={20} weight="regular" color={subFontColor} />
            <Lightning size={20} weight="fill" color="#FACC15" />
          </div>
        </div>
      </div>

      {/* ==========================================
          LOWER CONTENT AREA (Split Screen)
          ========================================== */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        padding: '0 24px 24px 24px',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
        transition: 'background 0.3s ease'
      }}>
        
        {/* Fixed Left Icons (Flag, Speaker) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          paddingTop: '24px',
          width: '24px',
          zIndex: 20
        }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path d="M224,112v24a8,8,0,0,1-16,0V112a48,48,0,0,0-48-48H120a8,8,0,0,1,0-16h40A64.07,64.07,0,0,1,224,112Z" fill="currentColor"></path><path d="M192,208H40V48A8,8,0,0,0,24,48V208a8,8,0,0,0,16,0h16a8,8,0,0,0,0-16H40V120H152a48.05,48.05,0,0,1,48,48V208A8,8,0,0,1,192,208Z" fill="currentColor"></path></svg>
          </button>
          <button onClick={() => setSfxEnabled(!sfxEnabled)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB' }}>
            {sfxEnabled ? <SpeakerHigh size={20} weight="fill" /> : <SpeakerSlash size={20} weight="fill" />}
          </button>
        </div>

        {/* Persistent Mascot Toggle Button (always visible at bottom-left) */}
        {!isChatOpen && (
          <button
            onClick={() => { playClickSound(); setIsChatOpen(true); }}
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '60px',
              width: '56px',
              height: '56px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              zIndex: 50,
              padding: 0,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Open AI Tutor"
          >
            <img src="/mascot.png" alt="AI Tutor" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
          </button>
        )}

        {/* Floating Chat Panel (Left Sidebar) — no container */}
        <div style={{
          width: isChatOpen ? '340px' : '0px',
          opacity: isChatOpen ? 1 : 0,
          pointerEvents: isChatOpen ? 'auto' : 'none',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
          background: 'transparent',
        }}>
          <div style={{ width: '340px', display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 16px 16px 4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maskImage: 'linear-gradient(to bottom, transparent, black 15%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%)',
            }}>
              {chatMessages.length === 0 && !isTyping && (
                <div style={{ textAlign: 'center', color: isDark ? '#64748B' : '#9CA3AF', fontSize: '13px', marginTop: '32px', lineHeight: 1.6 }}>
                  <img src="/mascot.png" alt="Mascot" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '12px', opacity: 0.7 }} />
                  <p>Ask me anything about this question!</p>
                </div>
              )}

              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isLastBotMsg = !isUser && idx === chatMessages.length - 1;

                const bg = isUser 
                  ? (isDark ? '#334155' : '#F3F4F6')
                  : (isLastBotMsg ? (isDark ? '#B45309' : '#FDE68A') : (isDark ? '#1E293B' : '#FFFFFF'));
                  
                const border = isUser
                  ? 'none'
                  : (isLastBotMsg ? `1px solid ${isDark ? '#D97706' : '#FCD34D'}` : `1px solid ${isDark ? '#475569' : '#E5E7EB'}`);
                  
                const color = isUser
                  ? (isDark ? '#F3F4F6' : '#111827')
                  : (isLastBotMsg ? (isDark ? '#FEF3C7' : '#111827') : (isDark ? '#D1D5DB' : '#374151'));

                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      borderBottomRightRadius: isUser ? '4px' : '16px',
                      borderBottomLeftRadius: isUser ? '16px' : '4px',
                      fontSize: '14px',
                      fontWeight: isLastBotMsg ? 500 : 400,
                      lineHeight: 1.5,
                      background: bg,
                      color: color,
                      border: border,
                      boxShadow: isLastBotMsg && !isDark ? '0 2px 4px rgba(253, 230, 138, 0.3)' : 'none'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomLeftRadius: '4px',
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#475569' : '#E5E7EB'}`,
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    <div className="dot-blink" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7C3AED', animationDelay: '0ms' }} />
                    <div className="dot-blink" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7C3AED', animationDelay: '160ms' }} />
                    <div className="dot-blink" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7C3AED', animationDelay: '320ms' }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{
              padding: '16px',
              flexShrink: 0
            }}>
              <form onSubmit={handleSendChat} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isDark ? '#1E293B' : '#F3F4F6',
                borderRadius: '9999px',
                padding: '8px 8px 8px 20px',
                border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`
              }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(chatInput); } }}
                  placeholder="How can I help?"
                  disabled={isTyping}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    color: isDark ? '#F3F4F6' : '#111827',
                    minWidth: 0
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: chatInput.trim() && !isTyping ? 'pointer' : 'not-allowed',
                    background: 'transparent',
                    color: chatInput.trim() && !isTyping ? '#7C3AED' : '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                    flexShrink: 0
                  }}
                >
                  <ArrowUp size={14} weight="bold" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ==========================================
            MAIN QUIZ CARD
            ========================================== */}
        <div style={{
          flex: 1,
          border: submitted 
            ? `2px solid ${isCorrect ? '#4ADE80' : '#FBBF24'}`
            : `2px solid ${isDark ? '#1E293B' : '#E5E7EB'}`,
          borderRadius: '32px',
          background: cardBg,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: submitted
            ? (isCorrect 
                ? '0 0 0 4px rgba(74, 222, 128, 0.15)'
                : '0 0 0 4px rgba(251, 191, 36, 0.15)'
              )
            : (isDark ? 'none' : '0 10px 40px rgba(0,0,0,0.02)'),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          
          {/* Main Quiz Content (Centered) */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 80px',
            overflowY: 'auto'
          }}>
            {currentQ && (
              <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{
                  fontFamily: '"Quicksand", sans-serif',
                  letterSpacing: '2px',
                  fontSize: '28px',
                  fontWeight: 800,
                  color: fontColor,
                  marginBottom: '48px',
                  textAlign: 'left',
                  width: '100%'
                }}>
                  {currentQ.question}
                </h2>



                {/* Options Grid */}
                <div className="options-grid" style={{ display: 'grid', gap: '16px', width: '100%' }}>
                  {currentQ.options.map((opt, i) => {
                    const isSelected = selectedOption === i;
                    const isCorrectOption = i === correctIdx;
                    const isEliminated = disabledOptions.includes(i);
                    const optionText = typeof opt === 'object' ? (opt.text || opt.choice || '') : opt;
                    
                    if (isEliminated) return null;
                    
                    let optBg = isDark ? '#1E293B' : '#FFFFFF';
                    let optBorderColor = isDark ? '#334155' : '#E5E7EB';
                    let optColor = isDark ? '#F3F4F6' : '#1F2937';
                    let isPressed = false;
                    
                    if (submitted) {
                      if (isCorrectOption) {
                        optBg = isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7';
                        optBorderColor = '#22C55E';
                        optColor = isDark ? '#4ADE80' : '#166534';
                        isPressed = false; // Pops out
                      } else if (isSelected) {
                        optBg = isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2';
                        optBorderColor = '#EF4444';
                        optColor = isDark ? '#F87171' : '#991B1B';
                        isPressed = true; // Stays pressed
                      }
                    } else if (isSelected) {
                      optBg = isDark ? 'rgba(167, 139, 250, 0.15)' : '#F3E8FF';
                      optBorderColor = '#A78BFA';
                      optColor = isDark ? '#C4B5FD' : '#6D28D9';
                      isPressed = true;
                    }

                    return (
                      <button
                        key={i}
                        disabled={submitted}
                        onClick={() => handleSelectOption(i)}
                        style={{
                          fontFamily: '"Outfit", sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          padding: '16px 24px',
                          borderRadius: '16px',
                          backgroundColor: optBg,
                          border: `2px solid ${optBorderColor}`,
                          borderBottom: `${isPressed ? '2px' : '6px'} solid ${optBorderColor}`,
                          color: optColor,
                          fontSize: '16px',
                          fontWeight: 700,
                          textAlign: 'left',
                          cursor: submitted ? 'default' : 'pointer',
                          transition: 'all 0.1s ease',
                          outline: 'none',
                          transform: isPressed ? 'translateY(4px)' : 'none',
                          marginBottom: isPressed ? '4px' : '0'
                        }}
                        onMouseEnter={e => {
                          if (!submitted && !isSelected) {
                            e.currentTarget.style.borderColor = '#C4B5FD';
                            e.currentTarget.style.borderBottomColor = '#C4B5FD';
                            e.currentTarget.style.background = isDark ? '#1E293B' : '#F9FAFB';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!submitted && !isSelected) {
                            e.currentTarget.style.borderColor = isDark ? '#334155' : '#E5E7EB';
                            e.currentTarget.style.borderBottomColor = isDark ? '#334155' : '#E5E7EB';
                            e.currentTarget.style.background = isDark ? '#1E293B' : '#FFFFFF';
                          }
                        }}
                      >
                        {optionText}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar inside the Quiz Card */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 32px',
            zIndex: 30
          }}>
            {/* Left spacer for perfect centering */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>

            </div>
            
            {/* Center Check/Continue Buttons */}
            <div style={{ flex: 'none', display: 'flex', justifyContent: 'center', gap: '16px' }}>
              {submitted && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <button
                    onClick={isCorrect ? handleToggleExplain : () => setIsChatOpen(true)}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '9999px',
                      border: `1px solid ${isDark ? '#475569' : '#D1D5DB'}`,
                      background: isDark ? '#1E293B' : '#FFFFFF',
                      color: isDark ? '#F3F4F6' : '#374151',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? '#334155' : '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = isDark ? '#1E293B' : '#FFFFFF'}
                  >
                    {isCorrect ? 'Why?' : 'Get help'}
                  </button>
                  <button
                    className="btn-3d"
                    onClick={handleNext}
                    style={{
                      '--btn-bg-color': isCorrect ? '#10B981' : '#F87171',
                      '--btn-shadow-color': isCorrect ? '#047857' : '#B91C1C',
                      '--btn-text-color': '#FFFFFF'
                    }}
                  >
                    <span className="btn-3d-face">Next</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Right side Hint/Reveal Actions */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              {!submitted && (
                <>
                  <button
                    onClick={handleHint}
                    disabled={keys < 3 || selectedOption !== null}
                    style={{
                      background: isDark ? '#1E293B' : '#F3F4F6',
                      border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                      borderRadius: '999px',
                      padding: '8px 16px',
                      color: isDark ? '#94A3B8' : '#4B5563',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: (keys < 3 || selectedOption !== null) ? 'not-allowed' : 'pointer',
                      opacity: (keys < 3 || selectedOption !== null) ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => {
                      if (!(keys < 3 || selectedOption !== null)) {
                        e.currentTarget.style.background = isDark ? '#334155' : '#E5E7EB';
                        e.currentTarget.style.color = '#7C3AED';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!(keys < 3 || selectedOption !== null)) {
                        e.currentTarget.style.background = isDark ? '#1E293B' : '#F3F4F6';
                        e.currentTarget.style.color = isDark ? '#94A3B8' : '#4B5563';
                      }
                    }}
                  >
                    <Key size={16} weight="fill" /> Hint
                  </button>
                  <button
                    onClick={handleReveal}
                    disabled={keys < 5 || selectedOption !== null}
                    style={{
                      background: isDark ? '#1E293B' : '#F3F4F6',
                      border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                      borderRadius: '999px',
                      padding: '8px 16px',
                      color: isDark ? '#94A3B8' : '#4B5563',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: (keys < 5 || selectedOption !== null) ? 'not-allowed' : 'pointer',
                      opacity: (keys < 5 || selectedOption !== null) ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => {
                      if (!(keys < 5 || selectedOption !== null)) {
                        e.currentTarget.style.background = isDark ? '#334155' : '#E5E7EB';
                        e.currentTarget.style.color = '#7C3AED';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!(keys < 5 || selectedOption !== null)) {
                        e.currentTarget.style.background = isDark ? '#1E293B' : '#F3F4F6';
                        e.currentTarget.style.color = isDark ? '#94A3B8' : '#4B5563';
                      }
                    }}
                  >
                    <MagnifyingGlass size={16} weight="bold" /> Reveal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
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
        
        .options-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .options-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .btn-3d {
          position: relative;
          display: inline-flex;
          cursor: pointer;
          padding: 0;
          background: transparent;
          border: none;
          outline: none;
          font-family: inherit;
        }
        .btn-3d:disabled {
          cursor: not-allowed;
          pointer-events: none;
        }
        .btn-3d-face {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 40px;
          border-radius: 9999px;
          transform: translateY(-4px);
          box-shadow: 0 4px 0 0 var(--btn-shadow-color, #D1D5DB);
          background-color: var(--btn-bg-color, #E5E7EB);
          color: var(--btn-text-color, #374151);
          font-weight: 700;
          font-size: 16px;
          transition: transform 100ms ease-out, box-shadow 100ms ease-out;
          width: 100%;
        }
        .btn-3d:disabled .btn-3d-face {
          transform: none;
          box-shadow: none;
          background-color: ${isDark ? '#334155' : '#E5E7EB'} !important;
          color: #9CA3AF !important;
        }
        .btn-3d:not(:disabled):active .btn-3d-face {
          transform: translateY(0);
          box-shadow: 0 0 0 0 var(--btn-shadow-color, #D1D5DB);
        }
        
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
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
