import React, { useState, useEffect, useCallback } from 'react';
import { useCollaboration, useOthers } from './CollaborationProvider';
import { callGroqAPI, GROQ_MODELS } from '../../groqClient';
import { 
  CircleNotch, Sparkle, Checks, X, PaperPlaneRight, 
  Users, UserCircle, CaretRight, ShieldCheck
} from '@phosphor-icons/react';

export default function WorkstationQuizzes({ material, isDark, user }) {
  const { provider, yDoc, awareness } = useCollaboration();
  const others = useOthers() || [];
  
  // Yjs State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Local Voting State
  const [myVote, setMyVote] = useState(null);

  // Get Yjs Shared Types
  const yQuestions = yDoc?.getArray('quiz_questions');
  const yQuizState = yDoc?.getMap('quiz_state');

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
    };

    yQuestions.observe(syncQuestions);
    yQuizState.observe(syncState);
    
    // Initial sync
    syncQuestions();
    syncState();

    return () => {
      yQuestions.unobserve(syncQuestions);
      yQuizState.unobserve(syncState);
    };
  }, [yQuestions, yQuizState]);

  // 2. Handle Voting via Awareness
  const handleVote = (optionIndex) => {
    if (showAnswer) return; // Can't vote after reveal
    setMyVote(optionIndex);
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
    if (!material?.extracted_text || !yQuestions || !yQuizState) return;
    
    yQuizState.set('isGenerating', true);
    
    try {
      const prompt = `Generate a 5-question multiple choice quiz based on this text. Structure your response exactly as a JSON array of objects. Each object must have: "question" (string), "options" (array of exactly 4 strings), "answer" (string, must exactly match one of the options), and "explanation" (string). \n\nText:\n${material.extracted_text.slice(0, 10000)}`;
      
      const response = await callGroqAPI([{ role: 'user', content: prompt }], GROQ_MODELS.PROFESSOR);
      const content = response.choices?.[0]?.message?.content || '';
      
      // Extract JSON array
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          yQuestions.delete(0, yQuestions.length);
          yQuestions.push(parsed);
          yQuizState.set('currentIndex', 0);
          yQuizState.set('showAnswer', false);
        }
      }
    } catch (error) {
      console.error("Failed to generate collaborative quiz", error);
    } finally {
      yQuizState.set('isGenerating', false);
    }
  };

  const handleReveal = () => {
    if (yQuizState) yQuizState.set('showAnswer', true);
  };

  const handleNext = () => {
    if (!yQuizState) return;
    if (currentIndex < questions.length - 1) {
      yQuizState.set('currentIndex', currentIndex + 1);
      yQuizState.set('showAnswer', false);
    } else {
      // Finished!
      yQuizState.set('currentIndex', 0);
      yQuizState.set('showAnswer', false);
    }
  };

  // 4. Render Helpers
  const currentQ = questions[currentIndex];
  
  // Aggregate Votes
  const votes = {};
  others.forEach(o => {
    const v = o.presence?.quizVote ?? o.info?.quizVote ?? (awareness?.getStates().get(o.connectionId)?.quizVote);
    if (v !== undefined && v !== null) {
      if (!votes[v]) votes[v] = [];
      votes[v].push(o);
    }
  });

  // Theme Constants (Tactile/Physical Paper Look)
  const bgColor = isDark ? '#1C1C1E' : '#F4F0EB';
  const paperColor = isDark ? '#2C2C2E' : '#FDFBF7';
  const textColor = isDark ? '#E5E5EA' : '#1C1C1E';
  const subTextColor = isDark ? '#8E8E93' : '#6B6B6B';
  const borderColor = isDark ? '#48484A' : '#D1D1D6';
  
  const brutalShadow = isDark ? '4px 4px 0px #000000' : '4px 4px 0px #1C1C1E';

  if (!material?.extracted_text) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, fontFamily: 'Outfit, sans-serif' }}>
        <p style={{ color: subTextColor }}>No document content available to generate a quiz.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: bgColor, padding: '32px'
      }}>
        <div style={{
          backgroundColor: paperColor, padding: '48px', borderRadius: '8px',
          border: `2px solid ${isDark ? '#48484A' : '#1C1C1E'}`,
          boxShadow: brutalShadow,
          maxWidth: '500px', width: '100%', textAlign: 'center',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* subtle paper noise texture via css radial gradients could go here, keeping it flat for now */}
          <ShieldCheck size={48} weight="duotone" color={isDark ? '#E5E5EA' : '#1C1C1E'} style={{ marginBottom: '16px' }} />
          <h2 style={{ fontFamily: '"Lora", serif', fontWeight: 700, fontSize: '28px', color: textColor, margin: '0 0 12px 0' }}>
            Shared Study Sheet
          </h2>
          <p style={{ fontFamily: 'Outfit, sans-serif', color: subTextColor, fontSize: '16px', lineHeight: 1.5, margin: '0 0 32px 0' }}>
            Generate a collaborative quiz. Everyone in the workspace will vote on the answers in real-time.
          </p>
          
          <button 
            onClick={generateQuiz}
            disabled={isGenerating}
            style={{
              backgroundColor: isDark ? '#E5E5EA' : '#1C1C1E',
              color: isDark ? '#1C1C1E' : '#FFFFFF',
              border: 'none', padding: '16px 32px', borderRadius: '4px',
              fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '16px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', transition: 'transform 0.1s',
            }}
            onMouseDown={e => { if(!isGenerating) e.currentTarget.style.transform = 'translate(2px, 2px)' }}
            onMouseUp={e => { if(!isGenerating) e.currentTarget.style.transform = 'translate(0px, 0px)' }}
          >
            {isGenerating ? <CircleNotch size={20} weight="bold" className="spin-animation" /> : <Sparkle size={20} weight="fill" />}
            {isGenerating ? 'Printing Sheet...' : 'Generate Study Sheet'}
          </button>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .spin-animation { animation: spin 1.5s linear infinite; }
        `}} />
      </div>
    );
  }

  if (!currentQ) return null;

  const isCorrectOption = (opt) => opt === currentQ.answer;

  return (
    <div style={{ 
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
      backgroundColor: bgColor, padding: '40px 24px', overflowY: 'auto'
    }}>
      {/* Quiz Container */}
      <div style={{
        backgroundColor: paperColor,
        border: `2px solid ${isDark ? '#48484A' : '#1C1C1E'}`,
        boxShadow: brutalShadow,
        borderRadius: '4px', padding: '40px',
        maxWidth: '800px', width: '100%',
        position: 'relative'
      }}>
        
        {/* Header Ribbon */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '8px',
          backgroundColor: isDark ? '#48484A' : '#1C1C1E'
        }} />

        {/* Top Meta Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', fontFamily: 'Outfit, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: subTextColor, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#FF3B30', borderRadius: '50%' }} />
            Live Sync
          </div>
          <div style={{ fontWeight: 800, fontSize: '16px', color: textColor }}>
            Question {currentIndex + 1} / {questions.length}
          </div>
        </div>

        {/* Question Text */}
        <h3 style={{ 
          fontFamily: '"Lora", serif', fontWeight: 600, fontSize: '26px', color: textColor, 
          lineHeight: 1.5, margin: '0 0 32px 0' 
        }}>
          {currentQ.question}
        </h3>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentQ.options.map((opt, i) => {
            const isSelectedByMe = myVote === i;
            const optionVotes = votes[i] || [];
            
            // Physical paper states
            let optBg = 'transparent';
            let optBorder = `2px solid ${borderColor}`;
            let optTextColor = textColor;

            if (showAnswer) {
              if (isCorrectOption(opt)) {
                optBg = isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)';
                optBorder = `2px solid #34C759`; // Correct Green
                optTextColor = isDark ? '#34C759' : '#248A3D';
              } else if (isSelectedByMe && !isCorrectOption(opt)) {
                optBg = isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)';
                optBorder = `2px solid #FF3B30`; // Wrong Red
                optTextColor = isDark ? '#FF3B30' : '#C92A2A';
              }
            } else if (isSelectedByMe) {
              optBg = isDark ? '#3A3A3C' : '#E5E5EA';
              optBorder = `2px solid ${isDark ? '#8E8E93' : '#1C1C1E'}`;
            }

            return (
              <button 
                key={i}
                disabled={showAnswer}
                onClick={() => handleVote(i)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 24px', borderRadius: '4px',
                  backgroundColor: optBg, border: optBorder, color: optTextColor,
                  fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 500,
                  cursor: showAnswer ? 'default' : 'pointer', transition: 'all 0.1s',
                  textAlign: 'left', minHeight: '64px'
                }}
                onMouseEnter={e => { if(!showAnswer && !isSelectedByMe) e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                onMouseLeave={e => { if(!showAnswer && !isSelectedByMe) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    border: `2px solid ${showAnswer && isCorrectOption(opt) ? '#34C759' : (isSelectedByMe ? (isDark ? '#E5E5EA' : '#1C1C1E') : borderColor)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: showAnswer && isCorrectOption(opt) ? '#34C759' : (isSelectedByMe && !showAnswer ? (isDark ? '#E5E5EA' : '#1C1C1E') : 'transparent'),
                    color: showAnswer && isCorrectOption(opt) ? '#FFF' : (isSelectedByMe && !showAnswer ? (isDark ? '#1C1C1E' : '#FFF') : textColor),
                    fontWeight: 800, fontSize: '14px'
                  }}>
                    {showAnswer && isCorrectOption(opt) ? <Checks weight="bold" /> : String.fromCharCode(65 + i)}
                  </div>
                  <span>{opt}</span>
                </div>

                {/* Avatar Cluster for Live Votes */}
                {(!showAnswer || true) && optionVotes.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {optionVotes.map((v, idx) => (
                      <div key={v.connectionId} style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${paperColor}`, 
                        marginLeft: idx > 0 ? '-12px' : 0, overflow: 'hidden', backgroundColor: '#D1D1D6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }} title={v.info?.name || 'Collaborator'}>
                        {v.info?.avatar ? (
                          <img src={v.info.avatar} alt="avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                        ) : (
                          <UserCircle size={24} color="#6B6B6B" weight="fill" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Block (Ink Stamp style) */}
        {showAnswer && (
          <div style={{ 
            marginTop: '32px', padding: '24px', borderRadius: '4px',
            border: `2px dashed ${isDark ? '#48484A' : '#D1D1D6'}`,
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: textColor }}>
              Explanation
            </h4>
            <p style={{ margin: 0, fontFamily: '"Lora", serif', fontSize: '16px', lineHeight: 1.6, color: subTextColor }}>
              {currentQ.explanation || "The AI didn't provide a detailed explanation for this question."}
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: subTextColor, fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600 }}>
            <Users size={20} weight="fill" />
            {others.length} peers in room
          </div>
          
          {!showAnswer ? (
            <button 
              onClick={handleReveal}
              style={{
                backgroundColor: 'transparent', color: textColor,
                border: `2px solid ${isDark ? '#E5E5EA' : '#1C1C1E'}`, padding: '12px 24px', borderRadius: '4px',
                fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '16px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              Reveal Answer
            </button>
          ) : (
            <button 
              onClick={handleNext}
              style={{
                backgroundColor: isDark ? '#E5E5EA' : '#1C1C1E', color: isDark ? '#1C1C1E' : '#FFFFFF',
                border: 'none', padding: '12px 24px', borderRadius: '4px',
                fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '16px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Sheet'}
              <CaretRight weight="bold" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
