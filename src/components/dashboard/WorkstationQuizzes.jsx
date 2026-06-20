import React, { useState, useEffect } from 'react';
import './dhd.css';
import { useCollaboration, useOthers } from './CollaborationProvider';
import { callGroqAPI, GROQ_MODELS } from '../../groqClient';
import { supabase } from '../../supabaseClient';
import { reprocessMaterial } from '../../services/langchainPipeline';
import MaterialAnalysisService from '../../services/materialAnalysisService';
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext';
import { getCreditBalance } from '../../services/creditService';
import { 
  CircleNotch, Sparkle, Checks, X, PaperPlaneRight, 
  Users, UserCircle, CaretRight, ShieldCheck,
  Question, FileText, CaretDown, Smiley, SmileyMeh, SmileySad,
  ArrowLeft, FastForward, Timer, ListNumbers, CheckSquare, Square, 
  CheckCircle, Keyboard, Minus, TextAa, Key, MagnifyingGlass, Lightbulb, Robot,
  ThumbsUp, ThumbsDown, ChatCircle, Phone, PushPin, ShareFat, Gift, Trash, DotsThree,
  SpeakerHigh, SpeakerSlash, SignOut, Gear, MagicWand, PaperPlaneTilt,
  Play, ChartBar, ArrowCounterClockwise, ShareNetwork, GraduationCap, Target
} from '@phosphor-icons/react';

let audioCtx = null;
const playTone = (type) => {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  if (type === 'correct') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.5);
  } else if (type === 'wrong') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
  }
};

const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayedText}</span>;
};

export default function WorkstationQuizzes({ material, isDark, user, isMobile }) {
  const { yDoc, awareness } = useCollaboration();
  const others = useOthers() || [];
  
  // Yjs State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Local Voting State
  const [myVote, setMyVote] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Configuration Setup & Dashboard States
  const [showDashboard, setShowDashboard] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [mode, setMode] = useState('quick_quiz'); // 'quick_quiz' | 'mock_exam'
  const [language, setLanguage] = useState('Auto Detect');
  const [pastResults, setPastResults] = useState([]);
  const [sourceType, setSourceType] = useState('document'); // 'document' | 'flashcards'
  const [questionTypes, setQuestionTypes] = useState(['multiple_choice']); 
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [examSize, setExamSize] = useState(1); // 1 = Quick(5), 2 = Mid(10), 3 = In-Depth(15)
  const [isExplaining, setIsExplaining] = useState(false);
  const [removedOptions, setRemovedOptions] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Economy & New System States
  const { bundle } = useDashboardPrefetch() || {};
  const [realCoins, setRealCoins] = useState(Infinity);
  
  useEffect(() => {
    if (!user?.id) return;
    getCreditBalance(user.id).then(b => {
      if (typeof b === 'number') setRealCoins(b);
    }).catch(() => {});
  }, [user?.id]);
  
  const profile = bundle?.profile?.data || bundle?.profile;
  const stats = bundle?.stats?.data || {};
  
  const baseXp = stats?.total_xp ?? 0;
  const baseCoins = typeof realCoins === 'number' && realCoins !== Infinity ? realCoins : (profile?.credits ?? 0);

  const [localXpSpent, setLocalXpSpent] = useState(0);
  const [localCoinsSpent, setLocalCoinsSpent] = useState(0);

  const userXp = Math.max(0, baseXp - localXpSpent);
  const userCoins = Math.max(0, baseCoins - localCoinsSpent);
  const [selectedWrongOptions, setSelectedWrongOptions] = useState([]);
  const [explanationInput, setExplanationInput] = useState('');
  const [explainHistory, setExplainHistory] = useState([]);
  const [isAnsweringAI, setIsAnsweringAI] = useState(false);

  const [activeQuizStats, setActiveQuizStats] = useState({ correct: 0, wrong: 0 });

  // Get Yjs Shared Types
  const yQuestions = yDoc?.getArray('quiz_questions');
  const yQuizState = yDoc?.getMap('quiz_state');
  const yQuizResults = yDoc?.getArray('quiz_results');

  // 1. Sync Yjs State to Local React State
  useEffect(() => {
    if (!yQuestions || !yQuizState) return;

    const syncQuestions = () => {
      setQuestions(yQuestions.toArray());
    };
    
    const syncState = () => {
      const idx = yQuizState.get('currentIndex');
      if (idx !== undefined) setCurrentIndex(idx);
      
      const showing = yQuizState.get('showAnswer');
      if (showing !== undefined) setShowAnswer(showing);
      
      const generating = yQuizState.get('isGenerating');
      if (generating !== undefined) setIsGenerating(generating);

      const explaining = yQuizState.get('isExplaining');
      if (explaining !== undefined) setIsExplaining(explaining);
    };

    const syncResults = () => {
      if (yQuizResults) {
        setPastResults(yQuizResults.toArray());
      }
    };

    yQuestions.observe(syncQuestions);
    yQuizState.observe(syncState);
    if (yQuizResults) yQuizResults.observe(syncResults);
    
    // Initial sync
    syncQuestions();
    syncState();
    syncResults();

    return () => {
      yQuestions.unobserve(syncQuestions);
      yQuizState.unobserve(syncState);
      if (yQuizResults) yQuizResults.unobserve(syncResults);
    };
  }, [yQuestions, yQuizState, yQuizResults]);

  // 2. Handle Voting via Awareness
  const handleVote = (optionIndex) => {
    if (showAnswer) return; // Can't vote after reveal
    if (selectedWrongOptions.includes(optionIndex)) return; // Already picked and wrong

    setMyVote(optionIndex);
    
    // Immediate evaluation
    if (optionIndex === currentQ?.answer) {
      if (soundEnabled) playTone('correct');
      setActiveQuizStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      if (yQuizState) yQuizState.set('showAnswer', true);
    } else {
      if (soundEnabled) playTone('wrong');
      setActiveQuizStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      setSelectedWrongOptions(prev => [...prev, optionIndex]);
    }

    if (awareness) {
      const currentLocalState = awareness.getLocalState() || {};
      awareness.setLocalState({
        ...currentLocalState,
        quizVote: optionIndex
      });
    }
  };

  // Reset vote when moving to next question
  useEffect(() => {
    setMyVote(null);
    if (awareness) {
      const currentLocalState = awareness.getLocalState() || {};
      awareness.setLocalState({
        ...currentLocalState,
        quizVote: null
      });
    }
  }, [currentIndex, awareness]);

  // 3. AI Quiz Generation
  const generateQuiz = async () => {
    if (!material || !yQuestions || !yQuizState) return;
    
    yQuizState.set('isGenerating', true);
    
    try {
      let contentToUse = '';
      
      if (sourceType === 'flashcards') {
        const { data: fcData } = await supabase.from('flashcards').select('front, back').eq('material_id', material.id);
        if (fcData && fcData.length > 0) {
          contentToUse = fcData.map(fc => `Q: ${fc.front}\nA: ${fc.back}`).join('\n\n');
        } else {
          throw new Error("No flashcards found for this material. Please generate flashcards first.");
        }
      } else {
        contentToUse = MaterialAnalysisService.getGenerationContent(material.analysis || {}, material);
        
        // Emergency LangChain OCR Fallback
        if (!contentToUse || contentToUse.trim().length < 50) {
          setErrorMsg('Text missing or too short. Attempting emergency LangChain OCR...');
          console.log('[Quiz] No text found. Triggering reprocessMaterial...');
          const result = await reprocessMaterial(material);
          if (result && result.success && result.fullText) {
            contentToUse = result.fullText;
            setErrorMsg(''); // Clear emergency message
          } else {
            throw new Error("No document content available to generate a quiz.");
          }
        }
      }

      // Calculate question count based on size
      const countMap = { 1: 5, 2: 10, 3: 15 };
      const qCount = countMap[examSize] || 5;

      const qTypesMap = {
        'multiple_choice': 'Multiple Choice (4 options)',
        'open_ended': 'Open Ended (short paragraph)',
        'fill_in_blank': 'Fill in the blank',
        'true_false': 'True or False'
      };
      const selectedTypesStr = questionTypes.map(t => qTypesMap[t]).join(', ');

      const prompt = `Generate a ${qCount}-question quiz based on this text. 
Configuration:
- Source: ${sourceType}
- Difficulty: ${difficulty.toUpperCase()}
- Question Types to mix: ${selectedTypesStr}

Structure your response exactly as a JSON array of objects. Each object must have: 
"question" (string), 
"type" (string: "multiple_choice", "open_ended", "fill_in_blank", or "true_false"),
"options" (array of strings, ONLY required for multiple_choice and true_false), 
"answer" (string, the correct answer), 
"explanation" (string). \n\nText:\n${contentToUse.slice(0, 10000)}`;
      
      const response = await callGroqAPI([{ role: 'user', content: prompt }], GROQ_MODELS.SPEEDSTER);
      const content = response.choices?.[0]?.message?.content || '';
      
      // Extract JSON array
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            yQuestions.delete(0, yQuestions.length);
            yQuestions.push(parsed);
            yQuizState.set('currentIndex', 0);
            yQuizState.set('showAnswer', false);
            setShowSetup(false);
          } else {
            throw new Error("Generated quiz format was invalid.");
          }
        } catch {
          throw new Error("Failed to parse the generated quiz. Please try again.");
        }
      } else {
        throw new Error("The AI failed to generate a valid quiz format.");
      }
    } catch (error) {
      console.error("Failed to generate collaborative quiz", error);
      setErrorMsg(error.message === "No document content available to generate a quiz." 
        ? "This document contains no readable text to generate a quiz." 
        : "Failed to generate quiz. Please try again.");
    } finally {
      yQuizState.set('isGenerating', false);
    }
  };

  const currentQ = questions[currentIndex];

  const handleReveal = () => {
    if (!currentQ || showAnswer || userCoins < 1) return;
    setLocalCoinsSpent(prev => prev + 1);
    if (yQuizState) yQuizState.set('showAnswer', true);
  };

  const handleNext = () => {
    if (!yQuizState) return;
    setRemovedOptions([]);
    setSelectedWrongOptions([]);
    setExplanationInput('');
    setExplainHistory([]);
    if (currentIndex < questions.length - 1) {
      yQuizState.set('currentIndex', currentIndex + 1);
      yQuizState.set('showAnswer', false);
    } else {
      // Finished quiz
      yQuizState.set('currentIndex', 0);
      yQuizState.set('showAnswer', false);
      
      if (yQuizResults) {
        yQuizResults.push([{ ...activeQuizStats, total: questions.length, date: new Date().toISOString() }]);
      }
      
      if (yQuestions) {
        yQuestions.delete(0, yQuestions.length); // Clear active questions to remove "Continue" card
      }

      setActiveQuizStats({ correct: 0, wrong: 0 });
      setShowSetup(true);
    }
  };

  const handleHint = () => {
    if (!currentQ || showAnswer || userXp < 10) return;
    const incorrectOptions = currentQ.options.filter(opt => opt !== currentQ.answer && !removedOptions.includes(opt) && !selectedWrongOptions.includes(opt));
    if (incorrectOptions.length > 0) {
      setLocalXpSpent(prev => prev + 10);
      const optionToRemove = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
      setRemovedOptions(prev => [...prev, optionToRemove]);
    }
  };

  const handleAskAI = async () => {
    if (!explanationInput.trim() || isAnsweringAI || !currentQ) return;
    
    const userMsg = explanationInput.trim();
    setExplanationInput('');
    setExplainHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAnsweringAI(true);

    try {
      let docContext = '';
      if (material) {
        const docText = MaterialAnalysisService.getGenerationContent(material.analysis || {}, material);
        if (docText) {
          docContext = docText.slice(0, 5000);
        }
      }

      const systemPrompt = `You are a highly capable AI tutor helping a student understand a quiz question they just answered.
Your goal is to explain the concept educationally, referencing both the document/study material context and the quiz question details where relevant.

CONTEXT:
- Quiz Question: "${currentQ.question}"
- Correct Answer: "${currentQ.answer}"
- Initial Explanation: "${currentQ.explanation || ''}"
${docContext ? `\n- Document Context Snippet:\n"""\n${docContext}\n"""` : ''}

INSTRUCTIONS:
1. Explain the concepts educationally, clearly, and directly.
2. Keep your response extremely concise, brief, and conversational (maximum 1-2 short sentences).
3. If the student greets you or says something very generic/acknowledging (e.g., "hi", "hello", "thanks", "its good"), reply with a brief, friendly 3-5 word greeting or acknowledgment. But if they ask to explain more, clarify, or probe the question/options/document context, explain it educationally.`;

      const historyToSend = [
        ...explainHistory.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: userMsg }
      ];
      
      const response = await callGroqAPI(historyToSend, GROQ_MODELS.PROFESSOR, { systemPromptOverride: systemPrompt });
      const aiContent = response.choices?.[0]?.message?.content || "I'm not sure about that!";
      
      setExplainHistory(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (err) {
      console.error(err);
      setExplainHistory(prev => [...prev, { role: 'assistant', content: "Oops, I had trouble thinking about that. Try again?" }]);
    } finally {
      setIsAnsweringAI(false);
    }
  };

  // Aggregate Votes
  const votes = {};
  others.forEach(o => {
    const v = o.presence?.quizVote ?? o.info?.quizVote ?? (awareness?.getStates().get(o.connectionId)?.quizVote);
    if (v !== undefined && v !== null) {
      if (!votes[v]) votes[v] = [];
      votes[v].push(o);
    }
  });

  // Theme Constants (Standard App White/Dark Theme)
  const bgColor = isDark ? '#111827' : '#F3F4F6';
  const paperColor = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const subTextColor = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  
  const softShadow = isDark ? '0 12px 32px rgba(0,0,0,0.15)' : '0 10px 25px -5px rgba(0,0,0,0.05)';

  if (!material) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, fontFamily: 'var(--font-outfit)' }}>
        <p style={{ color: subTextColor }}>Loading document context...</p>
      </div>
    );
  }

  const isQuizActive = questions.length > 0;

  if (isGenerating) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: bgColor, 
        fontFamily: 'var(--font-geist-sans, "Inter", system-ui, sans-serif)',
        gap: '24px'
      }}>
        <div style={{ position: 'relative' }}>
          <CircleNotch size={64} weight="bold" color="#C4B5FD" className="spin-animation" />
          <Sparkle size={24} weight="fill" color="#98FF98" style={{ position: 'absolute', top: '-10px', right: '-10px', animation: 'pulse 2s infinite' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: textColor, margin: '0 0 6px 0' }}>Generating Quiz</h3>
          <p style={{ fontSize: '13px', color: subTextColor, margin: 0 }}>Reading document and generating questions...</p>
        </div>
        <button
          onClick={() => {
            yQuizState?.set('isGenerating', false);
            setIsGenerating(false);
            setShowDashboard(true);
            setShowSetup(false);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: textColor,
            border: `1.5px solid ${borderColor}`,
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.color = textColor; }}
        >
          Cancel
        </button>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .spin-animation { animation: spin 1.5s linear infinite; }
          @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        `}} />
      </div>
    );
  }

  if (showDashboard && !showSetup && !isQuizActive) {
    let totalCorrect = 0;
    let totalWrong = 0;
    pastResults.forEach(r => {
      totalCorrect += (r.correct || 0);
      totalWrong += (r.wrong || 0);
    });
    const totalQuestions = totalCorrect + totalWrong;

    // Today's average score calculation
    const todayStr = new Date().toLocaleDateString();
    const todayResults = pastResults.filter(r => new Date(r.date).toLocaleDateString() === todayStr);
    let todayAvg = 'N/A%';
    if (todayResults.length > 0) {
      const sumCorrect = todayResults.reduce((sum, r) => sum + (r.correct || 0), 0);
      const sumTotal = todayResults.reduce((sum, r) => sum + (r.total || 0), 0);
      todayAvg = sumTotal > 0 ? `${Math.round((sumCorrect / sumTotal) * 100)}%` : 'N/A%';
    }

    return (
      <div style={{ flex: 1, backgroundColor: bgColor, padding: isMobile ? '16px' : '32px 40px', fontFamily: 'var(--font-geist-sans, "Inter", system-ui, sans-serif)', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: textColor, margin: 0, letterSpacing: '-0.02em' }}>Quizzes</h1>
              <p style={{ fontSize: '13px', color: subTextColor, margin: '4px 0 0 0' }}>Practice and master your material through interactive quizzes</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => { setShowSetup(true); setShowDashboard(false); }}
                style={{ 
                  padding: '10px 16px', 
                  backgroundColor: 'transparent', 
                  color: textColor, 
                  border: `1.5px solid ${borderColor}`, 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  fontSize: '14px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.color = isDark ? '#C4B5FD' : '#7C3AED'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.color = textColor; }}
              >
                <Gear size={16} /> Setup
              </button>
              <button 
                onClick={() => {
                  setShowSetup(false);
                  setShowDashboard(false);
                  generateQuiz();
                }}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#98FF98', 
                  color: '#0F172A', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  fontSize: '14px',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 14px rgba(152, 255, 152, 0.25)'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#83FF83'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#98FF98'; e.currentTarget.style.transform = 'none'; }}
              >
                <Sparkle size={16} weight="fill" /> Generate Quiz
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '12px', color: '#EF4444', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: '24px', marginBottom: '32px' }}>
            {/* Performance Card */}
            <div style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderRadius: '20px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: softShadow, display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #34D399, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <Target size={22} weight="fill" />
                </div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: textColor, margin: 0 }}>Your Performance</h2>
              </div>
              
              {/* Dual Colored Progress Bar */}
              <div style={{ height: '12px', width: '100%', backgroundColor: isDark ? '#374151' : '#E5E7EB', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                {totalQuestions > 0 ? (
                  <>
                    <div style={{ height: '100%', width: `${(totalCorrect / totalQuestions) * 100}%`, backgroundColor: '#98FF98', transition: 'width 0.5s ease' }} />
                    <div style={{ height: '100%', width: `${(totalWrong / totalQuestions) * 100}%`, backgroundColor: '#F87171', transition: 'width 0.5s ease' }} />
                  </>
                ) : (
                  <div style={{ height: '100%', width: '100%', backgroundColor: isDark ? '#374151' : '#E5E7EB' }} />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#98FF98' }} />
                    <span style={{ color: subTextColor, fontWeight: 500 }}>Correct Answers</span>
                  </div>
                  <span style={{ fontWeight: 700, color: textColor }}>{totalCorrect}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F87171' }} />
                    <span style={{ color: subTextColor, fontWeight: 500 }}>Wrong Answers</span>
                  </div>
                  <span style={{ fontWeight: 700, color: textColor }}>{totalWrong}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: isDark ? '#4B5563' : '#E5E7EB' }} />
                    <span style={{ color: subTextColor, fontWeight: 500 }}>Total Questions</span>
                  </div>
                  <span style={{ fontWeight: 700, color: textColor }}>{totalQuestions}</span>
                </div>
              </div>
            </div>

            {/* Chart Card */}
            <div style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderRadius: '20px', padding: '24px', border: `1px solid ${borderColor}`, boxShadow: softShadow, display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                    <GraduationCap size={22} weight="fill" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: textColor, margin: 0 }}>Learning progress</h2>
                    <span style={{ fontSize: '11px', color: subTextColor }}>Today's average score</span>
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#C4B5FD', letterSpacing: '-0.02em' }}>
                  {todayAvg}
                </div>
              </div>

              {/* SVG Line/Area Chart */}
              <div style={{ height: '90px', position: 'relative', marginTop: '12px', display: 'flex', alignItems: 'flex-end' }}>
                {pastResults.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: subTextColor, fontSize: '12px', gap: '4px' }}>
                    <ChartBar size={24} style={{ opacity: 0.5 }} />
                    <span>No quiz data recorded yet</span>
                  </div>
                ) : (
                  (() => {
                    const lastResults = pastResults.slice(-7);
                    const width = 450;
                    const height = 70;
                    const padding = 15;
                    const chartW = width - padding * 2;
                    const chartH = height - padding * 2;
                    
                    // Generate points
                    const points = lastResults.map((r, index) => {
                      const x = padding + (lastResults.length > 1 ? (index / (lastResults.length - 1)) * chartW : chartW / 2);
                      const score = r.total > 0 ? (r.correct / r.total) : 0;
                      const y = height - padding - (score * chartH);
                      return { x, y, score, date: new Date(r.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) };
                    });
                    
                    const pathD = points.length > 0 
                      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                      : '';
                    const areaD = points.length > 0
                      ? `${pathD} L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
                      : '';
                      
                    return (
                      <div style={{ width: '100%', height: '100%' }}>
                        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          {/* Grid Lines */}
                          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke={borderColor} strokeDasharray="3 3" />
                          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={borderColor} />
                          
                          {/* Area Fill */}
                          {points.length > 0 && (
                            <path d={areaD} fill="url(#purpleGrad)" opacity="0.15" />
                          )}
                          
                          {/* Line Path */}
                          {points.length > 0 && (
                            <path d={pathD} fill="none" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          )}
                          
                          {/* Interactive Points */}
                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="4.5" fill="#98FF98" stroke="#C4B5FD" strokeWidth="1.5" />
                              <text x={p.x} y={height - 2} textAnchor="middle" fill={subTextColor} fontSize="8" fontWeight="600">
                                {p.date}
                              </text>
                            </g>
                          ))}
                          
                          <defs>
                            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#C4B5FD" />
                              <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Continue where you left off */}
          {isQuizActive && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: textColor, marginBottom: '16px', letterSpacing: '-0.01em' }}>Continue where you left off</h3>
              <div style={{
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderRadius: '16px',
                padding: '20px 24px',
                border: `1px solid ${borderColor}`,
                boxShadow: softShadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                    <Play size={20} weight="fill" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: textColor }}>Quiz in progress</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#8B5CF6',
                        backgroundColor: isDark ? 'rgba(196, 181, 253, 0.15)' : '#F5F3FF',
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>In progress</span>
                      <span style={{ fontSize: '12px', color: subTextColor }}>
                        {currentIndex + 1} of {questions.length} answered
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setShowSetup(false); setShowDashboard(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    backgroundColor: isDark ? '#374151' : '#FFFFFF',
                    color: textColor,
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.backgroundColor = isDark ? '#4B5563' : '#F9FAFB'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#FFFFFF'; }}
                >
                  <Play size={14} weight="fill" /> Continue
                </button>
              </div>
            </div>
          )}

          {/* Past Quizzes */}
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: textColor, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.01em' }}>
              Past Quizzes
            </h2>
            {pastResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', border: `2px dashed ${borderColor}`, borderRadius: '20px', backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : '#F9FAFB' }}>
                <CheckSquare size={32} color={subTextColor} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>No quizzes taken yet</div>
                <div style={{ fontSize: '12px', color: subTextColor, marginTop: '4px' }}>Click "New Quiz" above to generate your first practice exam!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pastResults.slice().reverse().map((r, i) => (
                  <div key={i} style={{ 
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
                    borderRadius: '16px', 
                    padding: '16px 20px', 
                    border: `1px solid ${borderColor}`, 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    alignItems: isMobile ? 'stretch' : 'center', 
                    justifyContent: 'space-between', 
                    gap: isMobile ? '16px' : '0', 
                    transition: 'border-color 0.15s ease' 
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#C4B5FD'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = borderColor}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '5px', backgroundColor: '#98FF98', color: '#0F172A', fontSize: '11px', fontWeight: 700 }}>
                          {r.correct}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '5px', backgroundColor: '#FCA5A5', color: '#7F1D1D', fontSize: '11px', fontWeight: 700 }}>
                          {r.wrong}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>{material?.title || 'Document'} Exam</div>
                        <div style={{ fontSize: '11px', color: subTextColor, marginTop: '2px' }}>
                          {new Date(r.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {
                          // View Results action
                          alert(`Score: ${r.correct}/${r.total} (${Math.round((r.correct/r.total)*100)}%)`);
                        }}
                        style={{ padding: '8px 14px', backgroundColor: 'transparent', color: textColor, border: `1.5px solid ${borderColor}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#F9FAFB'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <ChartBar size={14} /> Results
                      </button>
                      <button 
                        onClick={() => {
                          setShowSetup(true);
                          setShowDashboard(false);
                        }}
                        style={{ padding: '8px 14px', backgroundColor: 'transparent', color: textColor, border: `1.5px solid ${borderColor}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#F9FAFB'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <ArrowCounterClockwise size={14} /> Retake
                      </button>
                      <button 
                        onClick={() => {
                          // Share action
                          navigator.clipboard.writeText(`I scored ${r.correct}/${r.total} on my Luter quiz!`);
                          alert('Score link copied to clipboard!');
                        }}
                        style={{ 
                          padding: '8px 14px', 
                          backgroundColor: isDark ? 'rgba(152, 255, 152, 0.12)' : '#E6FDF0', 
                          color: isDark ? '#98FF98' : '#15803D', 
                          border: `1.5px solid ${isDark ? 'rgba(152, 255, 152, 0.2)' : '#A7F3D0'}`, 
                          borderRadius: '10px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          cursor: 'pointer', 
                          transition: 'all 0.15s' 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(152, 255, 152, 0.18)' : '#D1FAE5'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(152, 255, 152, 0.12)' : '#E6FDF0'; }}
                      >
                        <ShareNetwork size={14} /> Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showSetup && !isQuizActive) {
    return (
      <div style={{ 
        flex: 1,
        background: bgColor,
        overflowY: 'auto',
        fontFamily: 'var(--font-geist-sans, "Inter", system-ui, sans-serif)',
        padding: isMobile ? '20px 16px' : '40px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: isDark ? '#1F2937' : '#ffffff',
          borderRadius: '24px', 
          padding: isMobile ? '24px 20px' : '36px 40px',
          width: '100%', 
          maxWidth: '640px',
          boxShadow: isDark ? '0 24px 64px rgba(0, 0, 0, 0.4)' : '0 24px 64px rgba(15, 23, 42, 0.08)',
          border: `1px solid ${borderColor}`,
          maxHeight: '92vh',
          overflowY: 'auto',
          animation: 'dsb-modal-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}>
          
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: textColor, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Quiz Setup
            </h2>
            <p style={{ fontSize: '13px', color: subTextColor, margin: 0 }}>
              Customize your quiz generation parameters
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
            {/* MODE ROW */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'block' }}>
                Mode
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Quick Quiz Card */}
                <div 
                  onClick={() => setMode('quick_quiz')}
                  style={{
                    border: `1.5px solid ${mode === 'quick_quiz' ? '#C4B5FD' : borderColor}`,
                    borderRadius: '16px',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    backgroundColor: mode === 'quick_quiz' ? (isDark ? 'rgba(196, 181, 253, 0.1)' : '#F5F3FF') : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: mode === 'quick_quiz' ? 'rgba(196, 181, 253, 0.2)' : (isDark ? '#374151' : '#F3F4F6'),
                    color: mode === 'quick_quiz' ? '#8B5CF6' : subTextColor,
                    border: `1px solid ${mode === 'quick_quiz' ? '#C4B5FD' : borderColor}`
                  }}>
                    <Question size={20} weight="fill" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: textColor }}>Quick Quiz</div>
                    <div style={{ fontSize: '11px', color: subTextColor, marginTop: '2px' }}>Instant Q&A Results</div>
                  </div>
                </div>

                {/* Mock Exam Card */}
                <div 
                  onClick={() => setMode('mock_exam')}
                  style={{
                    border: `1.5px solid ${mode === 'mock_exam' ? '#C4B5FD' : borderColor}`,
                    borderRadius: '16px',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    backgroundColor: mode === 'mock_exam' ? (isDark ? 'rgba(196, 181, 253, 0.1)' : '#F5F3FF') : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: mode === 'mock_exam' ? 'rgba(196, 181, 253, 0.2)' : (isDark ? '#374151' : '#F3F4F6'),
                    color: mode === 'mock_exam' ? '#8B5CF6' : subTextColor,
                    border: `1px solid ${mode === 'mock_exam' ? '#C4B5FD' : borderColor}`
                  }}>
                    <FileText size={20} weight="fill" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: textColor }}>Mock Exam</div>
                    <div style={{ fontSize: '11px', color: subTextColor, marginTop: '2px' }}>Timed Exam Simulation, results at the end</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SOURCE & LANGUAGE ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                  Source
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div 
                    onClick={() => setSourceType(sourceType === 'document' ? 'flashcards' : 'document')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      border: `1.5px solid ${borderColor}`,
                      borderRadius: '12px',
                      backgroundColor: paperColor,
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: textColor,
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {sourceType === 'document' ? <FileText size={16} /> : <CheckSquare size={16} />}
                      <span style={{ textTransform: 'capitalize' }}>{sourceType}</span>
                    </div>
                    <CaretDown size={14} />
                  </div>
                  
                  <div style={{
                    padding: '10px 14px',
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: '12px',
                    backgroundColor: paperColor,
                    fontSize: '13px',
                    color: subTextColor,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Users size={14} /> All Pages
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                  Language
                </span>
                <div 
                  onClick={() => {
                    const langs = ['Auto Detect', 'English', 'Spanish', 'French'];
                    const nextIdx = (langs.indexOf(language) + 1) % langs.length;
                    setLanguage(langs[nextIdx]);
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: '12px',
                    backgroundColor: paperColor,
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: textColor,
                    fontWeight: 600
                  }}
                >
                  <span>{language}</span>
                  <CaretDown size={14} />
                </div>
              </div>
            </div>

            {/* QUESTION TYPE & DIFFICULTY ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                  Question type
                </span>
                <div 
                  onClick={() => {
                    // Cycles question type for simple selection
                    const types = ['multiple_choice', 'true_false', 'open_ended', 'fill_in_blank'];
                    const currentId = questionTypes[0] || 'multiple_choice';
                    const nextIdx = (types.indexOf(currentId) + 1) % types.length;
                    setQuestionTypes([types[nextIdx]]);
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: '12px',
                    backgroundColor: paperColor,
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: textColor,
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ListNumbers size={16} />
                    <span>
                      {questionTypes[0] === 'multiple_choice' ? 'Multiple Choice' :
                       questionTypes[0] === 'true_false' ? 'True or False' :
                       questionTypes[0] === 'open_ended' ? 'Open Ended' : 'Fill in the Blank'}
                    </span>
                  </div>
                  <CaretDown size={14} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                  Difficulty
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['easy', 'medium', 'hard'].map(level => {
                    const isActive = difficulty === level;
                    const Icon = level === 'easy' ? Smiley : level === 'medium' ? SmileyMeh : SmileySad;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        style={{
                          flex: 1, 
                          border: `1.5px solid ${isActive ? '#C4B5FD' : borderColor}`,
                          borderRadius: '12px', 
                          padding: '10px 4px', 
                          cursor: 'pointer',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '6px',
                          backgroundColor: isActive ? (isDark ? 'rgba(196, 181, 253, 0.1)' : '#F5F3FF') : 'transparent',
                          color: isActive ? (isDark ? '#C4B5FD' : '#4C1D95') : textColor,
                          fontWeight: 600, 
                          fontSize: '13px',
                          textTransform: 'capitalize',
                          transition: 'all 0.15s ease',
                          fontFamily: 'inherit'
                        }}
                      >
                        <Icon size={15} weight={isActive ? 'fill' : 'regular'} />
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SIZE OF EXAM ROW */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>
                Size of Exam
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Bubble Badge */}
                <div style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: `1.5px solid ${borderColor}`,
                  backgroundColor: paperColor,
                  color: textColor,
                  fontSize: '13px',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  width: '110px',
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  {examSize === 1 ? '5 questions' : examSize === 2 ? '10 questions' : '15 questions'}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="1"
                    value={examSize}
                    onChange={e => setExamSize(Number(e.target.value))}
                    style={{ cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: subTextColor }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: examSize === 1 ? '#C4B5FD' : subTextColor }}>
                      <FastForward size={12} /> Quick
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: examSize === 2 ? '#C4B5FD' : subTextColor }}>
                      <Target size={12} /> Mid
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: examSize === 3 ? '#C4B5FD' : subTextColor }}>
                      <FileText size={12} /> In-Depth
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => { setShowSetup(false); setShowDashboard(true); }}
              style={{
                flex: 1, 
                padding: '12px 24px', 
                border: `1.5px solid ${isDark ? '#374151' : '#E2E8F0'}`, 
                borderRadius: '999px',
                backgroundColor: 'transparent', 
                color: subTextColor, 
                fontWeight: 600, 
                fontSize: '14px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.color = isDark ? '#C4B5FD' : '#7C3AED'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#374151' : '#E2E8F0'; e.currentTarget.style.color = subTextColor; }}
            >
              <ArrowLeft size={16} /> Go back
            </button>

            <button 
              onClick={() => {
                if (isGenerating) {
                  yQuizState?.set('isGenerating', false);
                  setIsGenerating(false);
                  setErrorMsg('Quiz generation cancelled.');
                  return;
                }
                if(questionTypes.length === 0) {
                  setErrorMsg('Please select at least one question type.');
                  return;
                }
                generateQuiz();
              }}
              style={{
                flex: 1, 
                padding: '12px 24px', 
                border: 'none', 
                borderRadius: '999px',
                background: '#98FF98', 
                color: '#0F172A', 
                fontWeight: 700, 
                fontSize: '14px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                opacity: isGenerating ? 0.9 : 1, 
                transition: 'all 0.15s ease',
                boxShadow: isGenerating ? 'none' : '0 8px 24px rgba(152, 255, 152, 0.25)',
                fontFamily: 'inherit'
              }}
              title={isGenerating ? "Click to cancel and reset" : "Start generating quiz"}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {isGenerating ? <CircleNotch size={16} className="spin-animation" /> : <Sparkle size={16} weight="fill" />}
              {isGenerating ? 'Cancel Generation' : 'Start Quiz'}
            </button>
          </div>

          {errorMsg && (
            <div style={{ marginTop: '16px', color: '#EF4444', fontSize: '13px', fontWeight: 500, textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .spin-animation { animation: spin 1.5s linear infinite; }
          
          /* Styled range slider */
          input[type="range"] {
            -webkit-appearance: none;
            width: 100%;
            background: transparent;
          }
          input[type="range"]:focus {
            outline: none;
          }
          input[type="range"]::-webkit-slider-runnable-track {
            width: 100%;
            height: 6px;
            cursor: pointer;
            background: ${isDark ? '#4B5563' : '#E5E7EB'};
            border-radius: 3px;
          }
          input[type="range"]::-webkit-slider-thumb {
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: #C4B5FD;
            cursor: pointer;
            -webkit-appearance: none;
            margin-top: -6px;
            box-shadow: 0 2px 6px rgba(196, 181, 253, 0.4);
            transition: transform 0.1s ease;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }
        `}} />
      </div>
    );
  }

  if (!currentQ) return null;

  const isCorrectOption = (opt) => opt === currentQ.answer;

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', 
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      fontFamily: 'var(--font-geist-sans, "Inter", system-ui, sans-serif)'
    }}>
      {/* Top Header - sticky at top */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '12px 16px' : '16px 24px',
        backgroundColor: isDark ? '#1F2937' : '#FFF',
        borderBottom: `1px solid ${borderColor}`,
        flexShrink: 0,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: isMobile ? '8px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{ width: '18px', height: '18px', backgroundColor: '#9CA3AF', borderRadius: '4px', flexShrink: 0 }} />
          <span style={{ fontWeight: 800, color: textColor, fontSize: isMobile ? '15px' : '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {material?.title || 'Quiz'}
          </span>
        </div>
        
        {/* Progress Bar */}
        {!isMobile && (
          <div style={{ flex: 1, maxWidth: '400px', margin: '0 24px', display: 'flex', gap: '4px' }}>
            {questions.map((_, i) => (
              <div key={i} style={{ 
                height: '4px', flex: 1, borderRadius: '2px', 
                backgroundColor: i <= currentIndex ? '#C4B5FD' : (isDark ? '#374151' : '#E5E7EB') 
              }} />
            ))}
          </div>
        )}

        {/* Economy Stats */}
        <div style={{ display: 'flex', gap: isMobile ? '12px' : '16px', fontWeight: 700, fontSize: isMobile ? '12px' : '14px', marginRight: isMobile ? '0' : '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDark ? '#C4B5FD' : '#7C3AED' }}>
            <Sparkle size={isMobile ? 14 : 18} weight="fill" /> {userXp} XP
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B' }}>
            <Gift size={isMobile ? 14 : 18} weight="fill" /> {userCoins} Coins
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
          {!isMobile && (
            <button onClick={() => setSoundEnabled(!soundEnabled)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
              {soundEnabled ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}
            </button>
          )}
          {!isMobile && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
              <Gear size={20} />
            </button>
          )}
          <button 
            onClick={() => {
              if (yQuizState && yQuestions) {
                yQuizState.set('currentIndex', 0);
                yQuizState.set('showAnswer', false);
                yQuestions.delete(0, yQuestions.length);
              }
              setShowSetup(false);
              setShowDashboard(true);
            }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: isMobile ? '6px 12px' : '8px 16px', 
              borderRadius: '999px', border: `1.5px solid ${isDark ? '#374151' : '#E2E8F0'}`, backgroundColor: 'transparent', 
              color: subTextColor, fontWeight: 600, cursor: 'pointer', fontSize: isMobile ? '12px' : '14px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.color = isDark ? '#C4B5FD' : '#7C3AED'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#374151' : '#E2E8F0'; e.currentTarget.style.color = subTextColor; }}
          >
            <SignOut size={isMobile ? 14 : 16} /> {isMobile ? 'Leave' : 'Leave Quiz'}
          </button>
        </div>
      </div>

      {/* Mobile Progress Bar below header */}
      {isMobile && (
        <div style={{ display: 'flex', gap: '3px', padding: '8px 16px 0', flexShrink: 0 }}>
          {questions.map((_, i) => (
            <div key={i} style={{ 
              height: '3px', flex: 1, borderRadius: '2px', 
              backgroundColor: i <= currentIndex ? '#C4B5FD' : (isDark ? '#374151' : '#E5E7EB') 
            }} />
          ))}
        </div>
      )}

      {/* Scrollable Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isMobile ? '16px 12px 120px' : '40px 24px 100px' }}>
        {/* Quiz Container Card */}
        <div style={{
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          boxShadow: softShadow,
          borderRadius: isMobile ? '16px' : '24px',
          padding: isMobile ? '20px 16px' : '40px',
          maxWidth: '800px', width: '100%',
          position: 'relative',
          border: `1px solid ${borderColor}`
        }}>
  
        {/* Top Meta Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: subTextColor, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#FF3B30', borderRadius: '50%' }} />
            Live Sync
          </div>
          <div style={{ fontWeight: 800, fontSize: '16px', color: textColor }}>
            Question {currentIndex + 1} / {questions.length}
          </div>
        </div>
  
        {/* Question Text - Split Context and Question */}
        {(() => {
          let context = '';
          let question = currentQ.question;
          
          const match = currentQ.question.match(/(.*?[.!?])\s+([A-Z].*?\?)$/);
          if (match) {
            context = match[1];
            question = match[2];
          } else {
            const parts = currentQ.question.split(/(?<=[.?!])\s+/);
            if (parts.length > 1) {
              question = parts.pop();
              context = parts.join(' ');
            }
          }
  
          return (
            <div style={{ marginBottom: '32px' }}>
              {context && (
                <p style={{ fontSize: '15px', color: textColor, marginBottom: '24px', lineHeight: 1.6, fontWeight: 500 }}>
                  {context}
                </p>
              )}
              <div style={{ 
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#ECFCCB', // light greenish yellow from screenshot
                borderRadius: '12px', padding: '24px',
                border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.2)' : '#D9F99D'}`
              }}>
                <h3 style={{ 
                  fontWeight: 500, fontSize: '16px', color: isDark ? '#FFF' : '#3F6212', 
                  lineHeight: 1.5, margin: 0 
                }}>
                  {question}
                </h3>
              </div>
            </div>
          );
        })()}

        {/* Dynamic Rendering Based on Question Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentQ.options && currentQ.options.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                {currentQ.options.map((opt, i) => {
                  const isSelectedByMe = myVote === opt;
                  const isRemoved = removedOptions.includes(opt);
                  const optionVotes = Object.values(votes).flat().filter(o => 
                    (o.presence?.quizVote ?? o.info?.quizVote ?? awareness?.getStates().get(o.connectionId)?.quizVote) === opt
                  );
                  
                  let optionBg = isSelectedByMe ? (isDark ? 'rgba(196, 181, 253, 0.15)' : 'rgba(196, 181, 253, 0.08)') : (isDark ? '#1F2937' : '#FFFFFF');
                  let optionBorder = isSelectedByMe ? '#C4B5FD' : (isDark ? '#374151' : '#E5E7EB');
                  let optionText = textColor;

                  const isWrongPicked = selectedWrongOptions.includes(opt);

                  if (isWrongPicked) {
                    optionBg = '#FFC4C4';
                    optionBorder = '#F87171';
                    optionText = '#7F1D1D';
                  }

                  if (showAnswer) {
                    if (isCorrectOption(opt)) {
                      if (myVote === opt) {
                        optionBg = '#98FF98'; // Mint for correct guess
                        optionBorder = '#4ADE80';
                        optionText = '#064E3B';
                      } else {
                        optionBg = '#FFD2A6'; // Peach for revealed
                        optionBorder = '#FDBA74';
                        optionText = '#7C2D12';
                      }
                    }
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handleVote(opt)}
                      disabled={showAnswer || isRemoved}
                      style={{
                        padding: '16px 20px', borderRadius: '16px', textAlign: 'left',
                        backgroundColor: optionBg,
                        border: `1px solid ${optionBorder}`,
                        color: optionText, cursor: (showAnswer || isRemoved) ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: isRemoved ? 0.2 : (showAnswer && !isCorrectOption(opt) && !isSelectedByMe ? 0.8 : 1),
                        fontWeight: 500, fontSize: '15px',
                        boxShadow: isSelectedByMe && !showAnswer ? '0 0 0 2px #C4B5FD' : 'none'
                      }}
                      onMouseDown={e => { if(!showAnswer && !isRemoved) e.currentTarget.style.transform = 'scale(0.98)' }}
                      onMouseUp={e => { if(!showAnswer && !isRemoved) e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      <div style={{
                        padding: '4px 10px', borderRadius: '6px', 
                        backgroundColor: showAnswer ? 'rgba(255,255,255,0.3)' : (isDark ? '#374151' : '#F3F4F6'),
                        color: showAnswer ? optionText : subTextColor,
                        fontWeight: 700, fontSize: '13px'
                      }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span style={{ lineHeight: 1.4, flex: 1 }}>
                        {opt}
                      </span>

                      {/* Avatar Cluster for Live Votes */}
                      {optionVotes.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                          {optionVotes.map((v, idx) => (
                            <div key={v.connectionId} style={{ 
                              width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${optionBg}`, 
                              marginLeft: idx > 0 ? '-8px' : 0, overflow: 'hidden', backgroundColor: '#D1D1D6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }} title={v.info?.name || 'Collaborator'}>
                              {v.info?.avatar ? (
                                <img src={v.info.avatar} alt="avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                              ) : (
                                <UserCircle size={18} color="#6B6B6B" weight="fill" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ backgroundColor: bgColor, padding: '24px', borderRadius: '16px', border: `1px solid ${borderColor}`, color: subTextColor, textAlign: 'center', fontSize: '15px' }}>
                Discuss this question openly with your group. Click <strong>Reveal</strong> when you're ready!
              </div>
            )}
            
        </div>

        {/* Explain Chat Overlay (Inside Card) */}
        {showAnswer && isExplaining && (
          <div style={{ 
            marginTop: '24px',
            padding: isMobile ? '16px' : '24px',
            borderRadius: '16px',
            backgroundColor: isDark ? '#111827' : '#F9FAFB',
            border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                <img src="/mascot.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h4 style={{ margin: 0, fontWeight: 600, color: '#8B5CF6', fontSize: '14px' }}>
                Explain
              </h4>
              <button onClick={() => { setIsExplaining(false); yQuizState?.set('isExplaining', false); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: subTextColor }}>
                <X size={16} weight="bold" />
              </button>
            </div>
            
            {explainHistory.length === 0 && (
              <p style={{ margin: '0 0 24px 0', fontSize: '15px', lineHeight: 1.6, color: textColor }}>
                <TypewriterText text={currentQ.explanation || "The AI didn't provide a detailed explanation for this question."} />
              </p>
            )}

            {explainHistory.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: isMobile ? '160px' : '220px', overflowY: 'auto' }}>
                {explainHistory.map((msg, i) => (
                  <div key={i} style={{ 
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.role === 'user' ? '#C4B5FD' : (isDark ? '#374151' : '#FFF'),
                    color: msg.role === 'user' ? '#1E1B4B' : textColor,
                    padding: '12px 16px', borderRadius: '16px', border: msg.role === 'user' ? 'none' : `1px solid ${isDark ? '#4B5563' : '#E5E7EB'}`,
                    maxWidth: '85%', fontSize: '14px', lineHeight: 1.5
                  }}>
                    {msg.role === 'assistant' && i === explainHistory.length - 1 ? (
                      <TypewriterText text={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Follow up Input */}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: isDark ? '#374151' : '#FFF', border: `1px solid ${isDark ? '#4B5563' : '#E5E7EB'}`, borderRadius: '24px', padding: '4px 8px 4px 16px' }}>
              <input 
                type="text" 
                placeholder="Ask for a follow up" 
                value={explanationInput}
                onChange={e => setExplanationInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: textColor }}
              />
              <button onClick={handleAskAI} style={{ background: 'none', border: 'none', color: isAnsweringAI ? '#D1D5DB' : '#8B5CF6', cursor: isAnsweringAI ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                {isAnsweringAI ? <CircleNotch size={16} className="spin-animation" /> : <PaperPlaneTilt size={16} weight="fill" />}
              </button>
            </div>
          </div>
        )}
        
      </div>
      </div>
      </div>

      {/* Sticky Bottom Action Bar — always visible */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(249,250,251,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${borderColor}`,
        padding: isMobile ? '12px 16px' : '16px 24px',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '800px', width: '100%', display: 'flex', gap: isMobile ? '10px' : '16px' }}>
          {!showAnswer ? (
            <>
              <button 
                onClick={() => handleHint()}
                style={{
                  padding: isMobile ? '12px 16px' : '15px 24px',
                  borderRadius: '999px', border: '1.5px solid #C4B5FD',
                  backgroundColor: 'transparent', color: isDark ? '#C4B5FD' : '#4C1D95',
                  fontWeight: 600, fontSize: isMobile ? '13px' : '15px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(196, 181, 253, 0.12)' : 'rgba(196, 181, 253, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <MagicWand size={isMobile ? 15 : 18} color={isDark ? '#C4B5FD' : '#7C3AED'} />
                {isMobile ? 'Hint' : 'Hint (10 XP)'}
              </button>
              <button 
                onClick={handleReveal}
                style={{
                  flex: 1, padding: isMobile ? '12px' : '15px', borderRadius: '999px', border: 'none',
                  backgroundColor: '#98FF98', color: '#0F172A', fontWeight: 700,
                  fontSize: isMobile ? '14px' : '15px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(152, 255, 152, 0.3)'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#83FF83'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#98FF98'; e.currentTarget.style.transform = 'none'; }}
              >
                Reveal {isMobile ? '' : '(1 Coin)'}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => {
                  const state = !isExplaining;
                  setIsExplaining(state);
                  yQuizState?.set('isExplaining', state);
                }}
                style={{
                  flex: 1, padding: isMobile ? '12px' : '15px', borderRadius: '999px', border: 'none',
                  backgroundColor: isExplaining ? (isDark ? '#374151' : '#E5E7EB') : '#C4B5FD',
                  color: isExplaining ? textColor : '#1E1B4B', fontWeight: 700,
                  fontSize: isMobile ? '14px' : '15px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {!isMobile && <div style={{ border: `1px solid ${isExplaining ? borderColor : '#8B5CF6'}`, borderRadius: '4px', padding: '2px 6px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.3)' }}>E</div>}
                {isExplaining ? 'Explain Again' : 'Explain'}
              </button>
              <button 
                onClick={() => {
                  setIsExplaining(false);
                  handleNext();
                }}
                style={{
                  flex: 1, padding: isMobile ? '12px' : '15px', borderRadius: '999px', border: 'none',
                  backgroundColor: '#98FF98', color: '#0F172A', fontWeight: 700,
                  fontSize: isMobile ? '14px' : '15px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 14px rgba(152, 255, 152, 0.3)'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#83FF83'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#98FF98'; e.currentTarget.style.transform = 'none'; }}
              >
                {!isMobile && <div style={{ border: `1px solid ${borderColor}`, borderRadius: '4px', padding: '2px 6px', fontSize: '11px', backgroundColor: '#F3F4F6' }}>↵</div>}
                Next
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
