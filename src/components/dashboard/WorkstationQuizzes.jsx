import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, CheckCircle, XCircle, ArrowLeft, 
  Sparkle, CircleNotch, Trash, Play,
  BookOpen, ChartBar, CalendarBlank
} from '@phosphor-icons/react';
import { supabase } from '../../supabaseClient';

export default function WorkstationQuizzes({ 
  material, 
  isDark, 
  onRegenerateQuiz, 
  isAnalysisLoading, 
  user 
}) {
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'quiz'
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Active Quiz State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  // Load history from Supabase on mount or material change
  useEffect(() => {
    if (material?.id && user?.id) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('material_id', material.id)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error("Error fetching quiz attempts:", error);
          } else if (data) {
            setHistory(data.map(row => ({
              id: row.id,
              date: row.created_at,
              score: row.score,
              total: row.total,
              accuracy: row.accuracy,
              correct: row.correct,
              wrong: row.wrong
            })));
          }
        } catch (e) {
          console.error("Error loading quiz history:", e);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [material?.id, user?.id]);

  // Save history helper
  const saveHistory = async (newAttempt) => {
    if (!material?.id || !user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert([{
          user_id: user.id,
          material_id: material.id,
          score: newAttempt.score,
          total: newAttempt.total,
          accuracy: newAttempt.accuracy,
          correct: newAttempt.correct,
          wrong: newAttempt.wrong
        }])
        .select()
        .single();

      if (error) {
        console.error("Error inserting quiz attempt:", error);
      } else if (data) {
        setHistory(prev => [{
          id: data.id,
          date: data.created_at,
          score: data.score,
          total: data.total,
          accuracy: data.accuracy,
          correct: data.correct,
          wrong: data.wrong
        }, ...prev]);
      }
    } catch (e) {
      console.error("Error saving quiz attempt:", e);
    }
  };

  // Clear history
  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear your quiz history for this document?")) {
      try {
        const { error } = await supabase
          .from('quiz_attempts')
          .delete()
          .eq('material_id', material.id)
          .eq('user_id', user.id);

        if (error) {
          console.error("Error clearing quiz attempts:", error);
        } else {
          setHistory([]);
        }
      } catch (e) {
        console.error("Error clearing quiz history:", e);
      }
    }
  };

  // Helper to parse correct answer index from various shapes
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

  // Stats calculation
  const totalCorrect = history.reduce((sum, h) => sum + (h.correct || 0), 0);
  const totalWrong = history.reduce((sum, h) => sum + (h.wrong || 0), 0);
  const totalQuestions = history.reduce((sum, h) => sum + (h.total || 0), 0);
  const todayAverage = history.length > 0 
    ? Math.round(history.reduce((sum, h) => sum + h.accuracy, 0) / history.length)
    : 'N/A';

  // Get active quiz questions
  const quizObj = material?.analysis?.quiz;
  const questions = Array.isArray(quizObj) 
    ? quizObj 
    : (quizObj?.questions || []);

  const handleStartQuiz = () => {
    if (questions.length === 0) {
      if (onRegenerateQuiz) onRegenerateQuiz();
      return;
    }
    navigate(`/quiz/${material.id}`);
  };

  const handleSelectOption = (idx) => {
    if (showFeedback) return;
    setSelectedOption(idx);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null || showFeedback) return;
    
    const currentQ = questions[currentIndex];
    const correctIdx = getCorrectIndex(currentQ);
    const isCorrect = selectedOption === correctIdx;
    
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      // Quiz Finished!
      const finalScore = score + (selectedOption === getCorrectIndex(questions[currentIndex]) ? 1 : 0);
      const finalAccuracy = Math.round((finalScore / questions.length) * 100);
      const newAttempt = {
        score: finalScore,
        total: questions.length,
        accuracy: finalAccuracy,
        correct: finalScore,
        wrong: questions.length - finalScore
      };
      
      saveHistory(newAttempt);
      setView('dashboard');
    }
  };

  // Home Design Card Visual Tokens
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const cardShadow = isDark 
    ? '0 8px 32px rgba(0, 0, 0, 0.35)' 
    : '0 8px 32px rgba(15, 23, 42, 0.05), 0 2px 8px rgba(15, 23, 42, 0.03)';
  const cardBorder = 'none';
  const cardRadius = '24px';

  // SVG Chart Dimensions & plotting
  const chartWidth = 500;
  const chartHeight = 160;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const renderGraph = () => {
    if (history.length === 0) {
      return (
        <div style={{
          height: '160px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px',
          color: 'var(--wsr-text-muted)',
          fontSize: '13px',
          fontWeight: 600,
          background: isDark ? '#111827' : '#F8FAFC'
        }}>
          <ChartBar size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
          <span>No quiz progress recorded yet</span>
        </div>
      );
    }

    const dataPoints = [...history].reverse();
    
    const getCoordinates = (idx) => {
      const totalPoints = dataPoints.length;
      const x = totalPoints > 1 
        ? paddingLeft + (idx / (totalPoints - 1)) * (chartWidth - paddingLeft - paddingRight)
        : paddingLeft + (chartWidth - paddingLeft - paddingRight) / 2;
      const y = chartHeight - paddingBottom - (dataPoints[idx].accuracy / 100) * (chartHeight - paddingTop - paddingBottom);
      return { x, y };
    };

    let linePath = "";
    let areaPath = "";
    
    if (dataPoints.length > 0) {
      const start = getCoordinates(0);
      linePath = `M ${start.x} ${start.y}`;
      areaPath = `M ${start.x} ${chartHeight - paddingBottom} L ${start.x} ${start.y}`;
      
      for (let i = 1; i < dataPoints.length; i++) {
        const pt = getCoordinates(i);
        linePath += ` L ${pt.x} ${pt.y}`;
        areaPath += ` L ${pt.x} ${pt.y}`;
      }
      
      const end = getCoordinates(dataPoints.length - 1);
      areaPath += ` L ${end.x} ${chartHeight - paddingBottom} Z`;
    }

    return (
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = chartHeight - paddingBottom - (val / 100) * (chartHeight - paddingTop - paddingBottom);
            return (
              <g key={val}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={chartWidth - paddingRight} 
                  y2={y} 
                  stroke={isDark ? '#374151' : '#E2E8F0'} 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  fill={isDark ? '#9CA3AF' : '#64748B'} 
                  style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Shaded Area */}
          {dataPoints.length > 1 && (
            <path d={areaPath} fill="url(#chartGradient)" />
          )}

          {/* Trend Line */}
          {dataPoints.length > 1 && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="#C4B5FD" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {dataPoints.map((pt, idx) => {
            const coords = getCoordinates(idx);
            return (
              <g key={pt.id}>
                <circle 
                  cx={coords.x} 
                  cy={coords.y} 
                  r="5" 
                  fill={isDark ? '#1F2937' : '#FFFFFF'} 
                  stroke="#C4B5FD" 
                  strokeWidth="3" 
                />
                {dataPoints.length < 8 && (
                  <text
                    x={coords.x}
                    y={coords.y - 10}
                    textAnchor="middle"
                    fill={isDark ? '#F9FAFC' : '#0F172A'}
                    style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}
                  >
                    {pt.accuracy}%
                  </text>
                )}
              </g>
            );
          })}

          {/* X Axis labels */}
          {dataPoints.map((pt, idx) => {
            const coords = getCoordinates(idx);
            if (dataPoints.length > 6 && idx % 2 !== 0) return null;
            return (
              <text
                key={pt.id}
                x={coords.x}
                y={chartHeight - 10}
                textAnchor="middle"
                fill={isDark ? '#9CA3AF' : '#64748B'}
                style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}
              >
                Q{dataPoints.length - idx}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  if (view === 'quiz') {
    if (questions.length === 0) return null;
    const currentQ = questions[currentIndex];
    const correctIdx = getCorrectIndex(currentQ);

    return (
      <div style={{
        maxWidth: '680px',
        margin: '40px auto',
        width: '100%',
        padding: '0 16px',
        fontFamily: 'Outfit, sans-serif'
      }}>
        {/* Quiz Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button 
            onClick={() => setView('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'none',
              color: isDark ? '#9CA3AF' : '#64748B',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} /> Exit Quiz
          </button>
          
          <span style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#9CA3AF' : '#64748B' }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: '6px',
          width: '100%',
          backgroundColor: isDark ? '#374151' : '#E2E8F0',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginBottom: '32px'
        }}>
          <div style={{
            height: '100%',
            width: `${((currentIndex + (showFeedback ? 1 : 0)) / questions.length) * 100}%`,
            backgroundColor: '#C4B5FD',
            borderRadius: 'inherit',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Question Card */}
        <div style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: cardRadius,
          padding: '36px',
          boxShadow: isDark ? '0 12px 40px rgba(0, 0, 0, 0.45)' : '0 16px 48px rgba(15, 23, 42, 0.08)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 800,
            lineHeight: 1.4,
            color: isDark ? '#F9FAFC' : '#0F172A',
            marginBottom: '28px',
            marginTop: 0
          }}>
            {currentQ.question}
          </h2>

          {/* Options Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedOption === i;
              const isCorrect = i === correctIdx;
              const optionText = typeof opt === 'object' ? (opt.text || opt.choice || '') : opt;
              
              let optBg = 'transparent';
              let optBorder = `1.5px solid ${isDark ? '#374151' : '#E2E8F0'}`;
              let optColor = isDark ? '#D1D5DB' : '#334155';
              
              if (showFeedback) {
                if (isCorrect) {
                  optBg = isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)';
                  optBorder = '1.5px solid #10B981';
                  optColor = '#10B981';
                } else if (isSelected) {
                  optBg = isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)';
                  optBorder = '1.5px solid #EF4444';
                  optColor = '#EF4444';
                }
              } else if (isSelected) {
                optBg = isDark ? 'rgba(196, 181, 253, 0.12)' : 'rgba(196, 181, 253, 0.08)';
                optBorder = '1.5px solid #C4B5FD';
                optColor = isDark ? '#C4B5FD' : '#7C3AED';
              }

              return (
                <button
                  key={i}
                  disabled={showFeedback}
                  onClick={() => handleSelectOption(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: optBg,
                    border: optBorder,
                    color: optColor,
                    fontSize: '15px',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: showFeedback ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                    outline: 'none',
                    transform: (!showFeedback && isSelected) ? 'translateY(-1px)' : 'none',
                    boxShadow: (!showFeedback && isSelected) ? '0 4px 12px rgba(15, 23, 42, 0.05)' : 'none'
                  }}
                  onMouseEnter={e => {
                    if (!showFeedback && !isSelected) {
                      e.currentTarget.style.borderColor = '#C4B5FD';
                      e.currentTarget.style.background = isDark ? '#374151' : '#F8FAFC';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!showFeedback && !isSelected) {
                      e.currentTarget.style.borderColor = isDark ? '#374151' : '#E2E8F0';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    border: `1.5px solid ${isSelected || (showFeedback && isCorrect) ? 'transparent' : (isDark ? '#4B5563' : '#CBD5E1')}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: showFeedback && isCorrect 
                      ? '#10B981' 
                      : (showFeedback && isSelected && !isCorrect ? '#EF4444' : (isSelected ? '#C4B5FD' : 'transparent')),
                    color: isSelected || showFeedback ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#64748B'),
                    fontSize: '12px',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {showFeedback && isCorrect ? '✓' : (showFeedback && isSelected && !isCorrect ? '✗' : String.fromCharCode(65 + i))}
                  </div>
                  <span>{optionText}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {showFeedback && currentQ.explanation && (
            <div style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: isDark ? 'rgba(196, 181, 253, 0.08)' : '#F5F3FF',
              border: '1.5px dashed #C4B5FD',
              color: isDark ? '#D1D5DB' : '#4C1D95',
              fontSize: '14px',
              lineHeight: 1.5,
              fontWeight: 500,
              marginBottom: '28px'
            }}>
              <strong style={{ display: 'block', color: isDark ? '#C4B5FD' : '#6D28D9', marginBottom: '8px', fontWeight: 800 }}>Explanation</strong>
              {currentQ.explanation}
            </div>
          )}

          {/* Action button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {!showFeedback ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={selectedOption === null}
                style={{
                  padding: '12px 28px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: selectedOption === null ? (isDark ? '#374151' : '#F1F5F9') : '#98FF98',
                  color: selectedOption === null ? (isDark ? '#4B5563' : '#94A3B8') : '#14532D',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: selectedOption === null ? 'default' : 'pointer',
                  boxShadow: selectedOption !== null ? '0 4px 14px rgba(152, 255, 152, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Confirm
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                style={{
                  padding: '12px 28px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#C4B5FD',
                  color: '#1E1B4B',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Dashboard / Landing view
  return (
    <div style={{
      maxWidth: '1100px',
      margin: '24px auto',
      width: '100%',
      padding: '0 24px',
      fontFamily: 'Outfit, sans-serif'
    }}>
      
      {/* Top Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: isDark ? '#F9FAFC' : '#0F172A', margin: '0 0 4px 0' }}>Quiz Room</h1>
          <p style={{ fontSize: '13px', color: isDark ? '#9CA3AF' : '#64748B', margin: 0 }}>Review performance diagnostics and master your recall</p>
        </div>

        {questions.length > 0 && (
          <button
            onClick={handleStartQuiz}
            disabled={isAnalysisLoading}
            style={{
              padding: '12px 26px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: '#98FF98',
              color: '#14532D',
              fontWeight: 800,
              fontSize: '14px',
              cursor: isAnalysisLoading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(152, 255, 152, 0.25)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(152, 255, 152, 0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(152, 255, 152, 0.25)';
            }}
          >
            {isAnalysisLoading ? <CircleNotch className="spin" size={16} /> : <Play size={16} weight="fill" />}
            {isAnalysisLoading ? 'Generating' : (history.length > 0 ? 'Retake Quiz' : 'Start Quiz')}
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Stats & Graph Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Your Performance Metrics - Dashboard-like row */}
          <div style={{
            background: cardBg,
            border: cardBorder,
            borderRadius: cardRadius,
            padding: '24px',
            boxShadow: cardShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: isDark ? '#F9FAFC' : '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} color="#FFD2A6" weight="fill" /> Your Performance
            </h2>

            {/* Heatmap-like inline stats metrics */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Correct */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correct</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: isDark ? '#F9FAFC' : '#0F172A', lineHeight: 1.1, marginTop: '2px' }}>{totalCorrect}</span>
              </div>
              
              <div style={{ width: '1px', height: '24px', background: isDark ? '#374151' : '#E2E8F0' }} />

              {/* Wrong */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wrong</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: isDark ? '#F9FAFC' : '#0F172A', lineHeight: 1.1, marginTop: '2px' }}>{totalWrong}</span>
              </div>

              <div style={{ width: '1px', height: '24px', background: isDark ? '#374151' : '#E2E8F0' }} />

              {/* Total */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#C4B5FD', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: isDark ? '#F9FAFC' : '#0F172A', lineHeight: 1.1, marginTop: '2px' }}>{totalQuestions}</span>
              </div>
            </div>
          </div>

          {/* Learning Progress Trend Chart */}
          <div style={{
            background: cardBg,
            border: cardBorder,
            borderRadius: cardRadius,
            padding: '24px',
            boxShadow: cardShadow
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: isDark ? '#F9FAFC' : '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChartBar size={18} color="#C4B5FD" weight="bold" /> Learning progress
              </h2>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: isDark ? '#9CA3AF' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's average</span>
                <div style={{ fontSize: '18px', fontWeight: 900, color: isDark ? '#F9FAFC' : '#0F172A', lineHeight: 1.1, marginTop: '2px' }}>{todayAverage === 'N/A' ? 'N/A' : `${todayAverage}%`}</div>
              </div>
            </div>

            {loading ? (
              <div style={{
                height: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--wsr-text-muted)'
              }}>
                <CircleNotch className="spin" size={24} />
              </div>
            ) : renderGraph()}
          </div>

        </div>

        {/* Right Attempt History Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Past Quizzes Card */}
          <div style={{
            background: cardBg,
            border: cardBorder,
            borderRadius: cardRadius,
            padding: '24px',
            minHeight: '290px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: cardShadow
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: isDark ? '#F9FAFC' : '#0F172A', margin: 0 }}>Past Quizzes</h2>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.8
                  }}
                  title="Clear history"
                >
                  <Trash size={16} />
                </button>
              )}
            </div>

            {loading ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--wsr-text-muted)'
              }}>
                <CircleNotch className="spin" size={24} />
              </div>
            ) : history.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20px 12px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: isDark ? 'rgba(196, 181, 253, 0.12)' : '#F5F3FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  color: '#C4B5FD'
                }}>
                  <BookOpen size={24} weight="bold" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: isDark ? '#F9FAFC' : '#0F172A', margin: '0 0 6px 0' }}>You have no Quiz yet</h3>
                <p style={{ fontSize: '12px', color: isDark ? '#9CA3AF' : '#64748B', margin: '0 0 20px 0', lineHeight: 1.4 }}>
                  Create a new Quiz to test your knowledge and keep track of it!
                </p>

                {questions.length === 0 ? (
                  <button
                    onClick={onRegenerateQuiz}
                    disabled={isAnalysisLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '9999px',
                      border: 'none',
                      backgroundColor: isDark ? 'rgba(196, 181, 253, 0.12)' : '#EDE9FE',
                      color: isDark ? '#C4B5FD' : '#4C1D95',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: isAnalysisLoading ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s'
                    }}
                  >
                    {isAnalysisLoading ? <CircleNotch className="spin" size={14} /> : <Sparkle size={14} weight="bold" />}
                    {isAnalysisLoading ? 'Generating' : 'Generate Quiz'}
                  </button>
                ) : (
                  <button
                    onClick={handleStartQuiz}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '9999px',
                      border: 'none',
                      backgroundColor: '#98FF98',
                      color: '#14532D',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Play size={14} weight="fill" /> Start Quiz
                  </button>
                )}
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px', 
                overflowY: 'auto', 
                maxHeight: '300px',
                paddingRight: '4px'
              }}>
                {history.map((att, idx) => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '16px',
                      background: 'transparent',
                      transition: 'background 0.2s, transform 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isDark ? '#374151' : '#F8FAFC';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CalendarBlank size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: isDark ? '#F9FAFC' : '#0F172A', fontWeight: 800 }}>
                          Attempt #{history.length - idx}
                        </strong>
                        <span style={{ fontSize: '11px', color: isDark ? '#9CA3AF' : '#64748B' }}>
                          {new Date(att.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: 900,
                        color: att.accuracy >= 70 ? '#10B981' : (att.accuracy >= 50 ? '#F59E0B' : '#EF4444')
                      }}>
                        {att.score}/{att.total}
                      </span>
                      <span style={{ fontSize: '10px', color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 700 }}>
                        {att.accuracy}% Accuracy
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
