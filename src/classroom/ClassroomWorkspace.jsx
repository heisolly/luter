import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Chalkboard, Cards, CheckCircle, 
  Sparkle, PaperPlaneRight, ChatsTeardrop, Trophy, Sparkle as SparkleIcon, Notebook
} from '@phosphor-icons/react';
import { supabase } from '../supabaseClient';
import { callGroqAPI, GROQ_MODELS } from '../groqClient';
import { RoomProvider, ClientSideSuspense } from '../components/dashboard/CollaborationProvider';
import { CommentsProvider } from '../components/dashboard/CommentsProvider';
import { LiveNoteEditor } from '../components/dashboard/NotesStudioPage';
import { Whiteboard } from '../components/dashboard/Whiteboard';
import WorkstationFlashcards from '../components/dashboard/WorkstationFlashcards';

export default function ClassroomWorkspace({ 
  classId, 
  displayTitle, 
  userName, 
  user, 
  isTeacher,
  announcements = [],
  assignments = []
}) {
  const [workspaceTab, setWorkspaceTab] = useState('notes');
  const isAuthReady = user?.id && user.id !== 'undefined';

  const mockClassroomMaterial = {
    id: classId,
    title: displayTitle + " Classroom Material",
    extracted_text: `
      Classroom feed context for the class "${displayTitle}".
      
      Announcements posted by teacher:
      ${announcements.slice(0, 5).map(a => `- ${a.author_name}: "${a.content}"`).join('\n')}
      
      Assignments due:
      ${assignments.slice(0, 5).map(a => `- "${a.title}": "${a.description}" (Due: ${a.due_date})`).join('\n')}
    `,
    analysis: {
      summary: `Workspace study helper for the classroom "${displayTitle}".`
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f8f9fa' }}>
      
      {/* Secondary Sub Navigation */}
      <div style={{ 
        display: 'flex', borderBottom: '1px solid #dadce0', background: '#ffffff', 
        padding: '12px 24px', gap: '10px', alignItems: 'center', flexShrink: 0
      }}>
        {[
          { id: 'notes', label: 'Class Notes', icon: <FileText size={18} /> },
          { id: 'whiteboard', label: 'Whiteboard', icon: <Chalkboard size={18} /> },
          { id: 'flashcards', label: 'Flashcards', icon: <Cards size={18} /> },
          { id: 'quiz', label: 'Class Quiz', icon: <CheckCircle size={18} /> },
          { id: 'practice', label: 'Practice Sets', icon: <Notebook size={18} /> },
        ].map(t => {
          const isActive = workspaceTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setWorkspaceTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '9999px',
                border: 'none', background: isActive ? '#E8F0FE' : 'transparent',
                color: isActive ? '#1967D2' : '#5f6368',
                fontWeight: 600, fontSize: '13.5px', cursor: 'pointer', transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Frame */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* Left Side: Active Tool */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', position: 'relative' }}>
          
          {!isAuthReady && (
            <div style={{ padding: '32px', fontFamily: 'Outfit', color: '#5f6368', background: '#ffffff', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <Sparkle size={32} style={{ animation: 'spin 2s linear infinite', color: '#7C3AED' }} />
                <span>Checking classroom session authentication...</span>
              </div>
            </div>
          )}

          {workspaceTab === 'notes' && isAuthReady && (
            <RoomProvider
              id={`luter:classroom:notes:${classId}`}
              userInfo={{
                id: user?.id || 'guest',
                name: userName,
                avatar: user?.user_metadata?.avatar_url || null,
                color: '#7C3AED',
                role: 'editor'
              }}
              initialPresence={{
                cursor: null,
                cursorChat: null,
                status: 'active',
                currentTool: 'notes',
                user: {
                  id: user?.id || 'guest',
                  name: userName,
                  avatar: user?.user_metadata?.avatar_url || null,
                  color: '#7C3AED',
                  role: 'editor',
                },
              }}
              initialStorage={{
                noteTitle: displayTitle + " Classroom Notes",
                noteIcon: '📝',
                noteCover: null
              }}
            >
              <ClientSideSuspense fallback={<div style={{ padding: '24px', fontFamily: 'Outfit', color: '#5f6368' }}>Connecting to classroom notes...</div>}>
                <CommentsProvider roomId={`luter:classroom:notes:${classId}`}>
                  <LiveNoteEditor 
                    title={displayTitle + " Notes"} 
                    roomId={`luter:classroom:notes:${classId}`} 
                    displayName={userName} 
                    user={user} 
                    profile={null} 
                    hideHeader={true}
                    workstationMode={true}
                  />
                </CommentsProvider>
              </ClientSideSuspense>
            </RoomProvider>
          )}

          {workspaceTab === 'whiteboard' && isAuthReady && (
            <RoomProvider
              id={`luter:classroom:board:${classId}`}
              userInfo={{
                id: user?.id || 'guest',
                name: userName,
                avatar: user?.user_metadata?.avatar_url || null,
                color: '#7C3AED',
                role: 'editor'
              }}
              initialPresence={{
                cursor: null,
                status: 'active',
                currentTool: 'whiteboard'
              }}
            >
              <ClientSideSuspense fallback={<div style={{ padding: '24px', fontFamily: 'Outfit', color: '#5f6368' }}>Connecting to classroom whiteboard...</div>}>
                <div style={{ width: '100%', height: '100%', position: 'relative', background: '#f8f9fa' }}>
                  <Whiteboard isCollaborative={true} roomId={`luter:classroom:board:${classId}`} />
                </div>
              </ClientSideSuspense>
            </RoomProvider>
          )}

          {workspaceTab === 'flashcards' && isAuthReady && (
            <RoomProvider
              id={`luter:classroom:flashcards:${classId}`}
              userInfo={{
                id: user?.id || 'guest',
                name: userName,
                avatar: user?.user_metadata?.avatar_url || null,
                color: '#10B981',
                role: 'editor'
              }}
              initialPresence={{}}
              initialStorage={{
                flashcards: []
              }}
            >
              <ClientSideSuspense fallback={<div style={{ padding: '24px', fontFamily: 'Outfit', color: '#5f6368' }}>Connecting to classroom flashcards...</div>}>
                <WorkstationFlashcards 
                  isDark={false} 
                  user={user} 
                  material={mockClassroomMaterial}
                />
              </ClientSideSuspense>
            </RoomProvider>
          )}

          {workspaceTab === 'quiz' && (
            <ClassroomQuizSection 
              classId={classId} 
              user={user} 
              isTeacher={isTeacher} 
              displayTitle={displayTitle}
              announcements={announcements}
              assignments={assignments}
            />
          )}

          {workspaceTab === 'practice' && (
            <ClassroomPracticeSets
              classId={classId}
              user={user}
              displayTitle={displayTitle}
              announcements={announcements}
              assignments={assignments}
            />
          )}

        </div>

      </div>
    </div>
  );
}

/* =========================================================================
   SUBCOMPONENT: Classroom Quiz Section
   ========================================================================= */
function ClassroomQuizSection({ classId, user, isTeacher, displayTitle, announcements, assignments }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState('idle'); // 'idle' | 'taking' | 'finished'
  const [history, setHistory] = useState([]);

  // Load history on mount
  useEffect(() => {
    if (user?.id && user.id !== 'undefined') {
      fetchQuizAttempts();
    }
  }, [classId, user?.id]);

  const fetchQuizAttempts = async () => {
    if (!user?.id || user.id === 'undefined') return;
    try {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('material_id', classId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (data) setHistory(data);
    } catch (e) {
      console.error("Error fetching quiz attempts:", e);
    }
  };

  const handleGenerateQuiz = async () => {
    setLoading(true);
    try {
      const contextText = `
        This is the classroom: ${displayTitle}.
        Teacher announcements:
        ${announcements.map(a => `- ${a.author_name}: "${a.content}"`).join('\n')}

        Assignments:
        ${assignments.map(a => `- "${a.title}": "${a.description}" (Due: ${a.due_date})`).join('\n')}
      `;

      const prompt = `Generate a JSON array of exactly 5 multiple choice questions for the class "${displayTitle}" based on this context:
      ${contextText}

      Each question MUST follow this schema:
      {
        "question": "question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answerIndex": 0, // 0-based index of correct option
        "explanation": "Brief explanation of why this option is correct"
      }

      Return ONLY the raw JSON array (no markdown code blocks, no other text).`;

      const resObj = await callGroqAPI([{ role: 'user', content: prompt }], GROQ_MODELS.SPEEDSTER);
      const res = resObj?.choices?.[0]?.message?.content || '';
      let cleanText = res.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```/g, '').trim();
      }

      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setQuestions(parsed);
        setActiveQuestionIdx(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setScore(0);
        setQuizState('taking');
      }
    } catch (err) {
      alert("Failed to generate quiz: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (idx) => {
    if (showExplanation) return;
    setSelectedOption(idx);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    const currentQ = questions[activeQuestionIdx];
    if (selectedOption === currentQ.answerIndex) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = async () => {
    if (activeQuestionIdx < questions.length - 1) {
      setActiveQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // Finished
      setQuizState('finished');
      // Save attempt
      try {
        const accuracy = Math.round((score / questions.length) * 100);
        await supabase
          .from('quiz_attempts')
          .insert({
            material_id: classId,
            user_id: user?.id,
            score: score,
            total: questions.length,
            accuracy: accuracy,
            correct: score,
            wrong: questions.length - score
          });
        fetchQuizAttempts();
      } catch (e) {
        console.error("Error saving quiz attempt:", e);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', background: '#ffffff', padding: '40px' }}>
        <div style={{ animation: 'float 4s ease-in-out infinite' }}>
          <img src="/mascot.png" alt="Luter Mascot" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E293B', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Generating Quiz with Luter AI...</h2>
        <p style={{ fontSize: '14px', color: '#5f6368', margin: 0, textAlign: 'center', maxWidth: '300px', fontFamily: 'Outfit, sans-serif' }}>
          Analysing announcements, classwork, and notes to prepare CBT-standard practice questions.
        </p>
      </div>
    );
  }

  if (quizState === 'taking') {
    const currentQ = questions[activeQuestionIdx];
    return (
      <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', padding: '40px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dadce0', paddingBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#5f6368' }}>
              Question {activeQuestionIdx + 1} of {questions.length}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a73e8' }}>
              Current Score: {score}
            </span>
          </div>

          {/* Question Text */}
          <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#202124', lineHeight: '1.4', margin: 0 }}>
            {currentQ.question}
          </h2>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = selectedOption === oIdx;
              const isCorrectAnswer = currentQ.answerIndex === oIdx;
              
              let bg = '#ffffff';
              let border = '1px solid #dadce0';
              let color = '#3c4043';
              let opacity = 1;

              if (isSelected) {
                bg = '#E8F0FE';
                border = '2px solid #1a73e8';
                color = '#1967D2';
              }

              if (showExplanation) {
                if (isCorrectAnswer) {
                  bg = '#E6F4EA';
                  border = '2px solid #137333';
                  color = '#137333';
                } else if (isSelected) {
                  bg = '#FCE8E6';
                  border = '2px solid #C5221F';
                  color = '#C5221F';
                } else {
                  bg = '#ffffff';
                  border = '1px solid #dadce0';
                  color = '#5f6368';
                  opacity = 0.5;
                }
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => handleOptionClick(oIdx)}
                  disabled={showExplanation}
                  style={{
                    padding: '16px 20px', borderRadius: '12px', border: border,
                    background: bg, color: color, fontSize: '15px', textAlign: 'left',
                    fontWeight: 500, cursor: showExplanation ? 'default' : 'pointer',
                    transition: 'all 0.2s', outline: 'none', opacity: opacity
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            {!showExplanation ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={selectedOption === null}
                style={{
                  padding: '12px 24px', borderRadius: '8px', border: 'none',
                  background: selectedOption === null ? '#f1f3f4' : '#1a73e8',
                  color: selectedOption === null ? '#70757a' : '#ffffff',
                  fontSize: '14px', fontWeight: 600, cursor: selectedOption === null ? 'default' : 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                style={{
                  padding: '12px 24px', borderRadius: '8px', border: 'none',
                  background: '#1a73e8', color: '#ffffff',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {activeQuestionIdx < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            )}
          </div>

          {/* Explanation Banner */}
          {showExplanation && (
            <div style={{ 
              padding: '20px', borderRadius: '12px', 
              background: selectedOption === currentQ.answerIndex ? '#E6F4EA' : '#FCE8E6',
              border: `1px solid ${selectedOption === currentQ.answerIndex ? '#A3E2B8' : '#F5B4B4'}`,
              display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <span style={{ 
                fontSize: '14px', fontWeight: 700, 
                color: selectedOption === currentQ.answerIndex ? '#137333' : '#C5221F'
              }}>
                {selectedOption === currentQ.answerIndex ? '✓ Correct!' : '✗ Incorrect'}
              </span>
              <p style={{ fontSize: '14px', color: '#3c4043', margin: 0, lineHeight: '1.5' }}>
                {currentQ.explanation}
              </p>
            </div>
          )}

        </div>
      </div>
    );
  }

  if (quizState === 'finished') {
    const accuracy = Math.round((score / questions.length) * 100);
    return (
      <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', padding: '40px' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8' }}>
            <Trophy size={44} weight="fill" />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#202124', margin: '0 0 8px 0' }}>Quiz Completed!</h2>
            <p style={{ fontSize: '15px', color: '#5f6368', margin: 0 }}>
              Well done! You have completed the CBT-standard practice set.
            </p>
          </div>

          {/* Score Cards */}
          <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            <div style={{ flex: 1, padding: '16px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #dadce0' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a73e8' }}>{score}/{questions.length}</div>
              <div style={{ fontSize: '12px', color: '#5f6368', fontWeight: 500, marginTop: '4px' }}>Correct Answers</div>
            </div>
            <div style={{ flex: 1, padding: '16px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #dadce0' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#137333' }}>{accuracy}%</div>
              <div style={{ fontSize: '12px', color: '#5f6368', fontWeight: 500, marginTop: '4px' }}>Accuracy Rate</div>
            </div>
          </div>

          <button
            onClick={handleGenerateQuiz}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: '8px', border: 'none',
              background: '#1a73e8', color: '#ffffff', fontSize: '15px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <Sparkle size={18} weight="fill" />
            <span>Generate Another Quiz</span>
          </button>

          <button
            onClick={() => setQuizState('idle')}
            style={{
              width: '100%', padding: '12px 20px', borderRadius: '8px', border: '1px solid #dadce0',
              background: '#ffffff', color: '#5f6368', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', padding: '32px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Intro Hero */}
        <div style={{ 
          background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', 
          borderRadius: '16px', padding: '32px', color: 'white', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 0 }} />
          
          <div style={{ flex: 1, zIndex: 1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif' }}>AI CBT Exam Prep</h2>
            <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5', margin: '0 0 24px 0', maxWidth: '500px', fontFamily: 'Outfit, sans-serif' }}>
              Instant mock quiz generation from announcements, class notes, and syllabus materials. Test your knowledge and get real-time feedback.
            </p>
            <button
              onClick={handleGenerateQuiz}
              style={{
                padding: '12px 24px', borderRadius: '8px', border: 'none',
                background: '#ffffff', color: '#7C3AED', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Outfit, sans-serif'
              }}
            >
              <Sparkle size={18} weight="fill" />
              <span>Generate CBT Mock Quiz</span>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }} className="cls-mascot-img-wrap">
            <img 
              src="/mascot.png" 
              alt="Luter Mascot" 
              style={{ width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))', animation: 'float 5s ease-in-out infinite' }} 
            />
          </div>
        </div>

        {/* History / Previous attempts */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#202124', margin: '0 0 16px 0' }}>Your Attempt History</h3>
          {history.length === 0 ? (
            <div style={{ 
              border: '1px dashed #dadce0', borderRadius: '12px', padding: '32px', 
              textAlign: 'center', color: '#5f6368', fontSize: '14px' 
            }}>
              No quiz attempts recorded yet. Click "Generate" to start practicing!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((row, idx) => (
                <div 
                  key={row.id} 
                  style={{ 
                    border: '1px solid #dadce0', borderRadius: '12px', padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E6F4EA', color: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#3c4043' }}>
                        Attempt #{history.length - idx}
                      </div>
                      <div style={{ fontSize: '11px', color: '#70757a', marginTop: '2px' }}>
                        {new Date(row.created_at).toLocaleDateString()} at {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#202124' }}>
                      {row.score} / {row.total}
                    </div>
                    <div style={{ fontSize: '12px', color: '#137333', fontWeight: 500, marginTop: '2px' }}>
                      {row.accuracy}% Accuracy
                    </div>
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

/* =========================================================================
   SUBCOMPONENT: Workspace Scoped AI Chat Panel
   ========================================================================= */
function WorkspaceAiChatPanel({ classId, user, displayTitle, announcements, assignments }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi there! I am Luter AI, your class study partner. Ask me anything about the assignments, timetable, or notes in **${displayTitle}**!` }
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const userMsg = { role: 'user', content: inputText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSending(true);

    try {
      const contextText = `
        You are Luter AI, study tutor.
        The classroom title: "${displayTitle}"
        Announcements posted:
        ${announcements.map(a => `- ${a.author_name}: "${a.content}"`).join('\n')}

        Assignments:
        ${assignments.map(a => `- "${a.title}": "${a.description}" (Due: ${a.due_date})`).join('\n')}
      `;

      const apiMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        userMsg
      ];

      const resObj = await callGroqAPI(apiMessages, GROQ_MODELS.PROFESSOR, {
        systemPromptOverride: `You are Luter AI, a helpful tutor.
        Here is the current classroom context:
        ${contextText}

        Be encouraging, sharp, and concise. Explain concepts clearly. Use university/NUC contexts where helpful.`
      });
      const res = resObj?.choices?.[0]?.message?.content || '';

      setMessages(prev => [...prev, { role: 'assistant', content: res }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Failed to load response: " + err.message }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }} className="ns-ai-panel">
      
      {/* AI Panel Header */}
      <div style={{ 
        padding: '16px 20px', borderBottom: '1px solid #dadce0', 
        display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
        background: '#ffffff'
      }} className="ns-ai-panel-header">
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          width: '36px', height: '36px', borderRadius: '50%', 
          background: '#F5F3FF', border: '1px solid #E9D5FF'
        }} className="ns-ai-mascot-wrap">
          <img src="/mascot.png" alt="Luter Mascot" style={{ width: '24px', height: '24px', objectFit: 'contain' }} className="ns-ai-mascot" />
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Luter AI Tutor</h3>
          <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            Active Study Partner
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        className="ns-ai-messages"
      >
        {messages.map((m, idx) => {
          const isAi = m.role === 'assistant';
          return (
            <div 
              key={idx}
              className={`ns-ai-msg ${isAi ? 'assistant' : 'user'}`}
              style={{
                alignSelf: isAi ? 'flex-start' : 'flex-end',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: isAi ? 'row' : 'row-reverse',
                width: '100%',
                margin: '4px 0'
              }}
            >
              {isAi && (
                <img 
                  src="/mascot.png" 
                  className="ns-ai-msg-avatar" 
                  alt="Luter AI" 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'contain',
                    background: '#F5F3FF',
                    padding: '4px',
                    border: '1px solid #E9D5FF',
                    flexShrink: 0
                  }}
                />
              )}
              <div 
                className="ns-ai-msg-bubble"
                style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  borderTopLeftRadius: isAi ? '4px' : '16px',
                  borderTopRightRadius: isAi ? '16px' : '4px',
                  background: isAi ? '#F8F9FA' : '#7C3AED',
                  color: isAi ? '#3C4043' : '#FFFFFF',
                  fontSize: '13.5px',
                  lineHeight: '1.5',
                  boxShadow: isAi ? '0 1px 3px rgba(0,0,0,0.05)' : '0 2px 8px rgba(124, 58, 237, 0.2)',
                  fontFamily: 'Outfit, sans-serif',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="ns-ai-msg assistant" style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', margin: '4px 0' }}>
            <img 
              src="/mascot.png" 
              className="ns-ai-msg-avatar" 
              alt="Luter AI" 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'contain',
                background: '#F5F3FF',
                padding: '4px',
                border: '1px solid #E9D5FF',
                flexShrink: 0,
                animation: 'float 3s ease-in-out infinite'
              }}
            />
            <div style={{
              padding: '10px 14px',
              borderRadius: '16px',
              borderBottomLeftRadius: '4px',
              background: '#F8F9FA',
              color: '#70757a',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Outfit, sans-serif',
              border: '1px solid #E2E8F0'
            }}>
              <Sparkle size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
              <span>Luter is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form 
        onSubmit={handleSend}
        style={{ padding: '16px', borderTop: '1px solid #dadce0', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, background: '#ffffff' }}
      >
        <input 
          type="text" 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Ask Luter AI..."
          disabled={sending}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #E2E8F0',
            fontSize: '13.5px', outline: 'none', transition: 'all 0.2s', background: '#F8FAFC',
            fontFamily: 'Outfit, sans-serif'
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#7C3AED';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.15)';
            e.currentTarget.style.background = '#ffffff';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = '#F8FAFC';
          }}
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            background: sending || !inputText.trim() ? '#F1F5F9' : '#7C3AED',
            color: sending || !inputText.trim() ? '#94A3B8' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'all 0.2s', outline: 'none',
            boxShadow: sending || !inputText.trim() ? 'none' : '0 2px 8px rgba(124, 58, 237, 0.25)'
          }}
        >
          <PaperPlaneRight size={18} weight="fill" />
        </button>
      </form>

    </div>
  );
}

/* =========================================================================
   SUBCOMPONENT: Classroom AI Practice Sets
   ========================================================================= */
function ClassroomPracticeSets({ classId, user, displayTitle, announcements, assignments }) {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const handleGeneratePractice = async () => {
    setLoading(true);
    setFeedback(null);
    setAnswers({});
    try {
      const classContext = `
        Classroom: "${displayTitle}"
        Announcements:
        ${announcements.slice(0, 3).map(a => `- ${a.content}`).join('\n')}
        Assignments:
        ${assignments.slice(0, 3).map(a => `- ${a.title}: ${a.description}`).join('\n')}
      `;

      const prompt = `Generate a JSON object containing 3 practice questions on the topic "${topic || 'General Class Syllabus'}" for the class "${displayTitle}".
      Context details:
      ${classContext}

      The output MUST be a JSON object with this format:
      {
        "topic": "Finalized Topic Title",
        "questions": [
          {"id": 1, "text": "Question 1"},
          {"id": 2, "text": "Question 2"},
          {"id": 3, "text": "Question 3"}
        ]
      }
      
      Return ONLY the raw JSON object (no markdown formatting, no backticks).`;

      const resObj = await callGroqAPI([{ role: 'user', content: prompt }], GROQ_MODELS.SPEEDSTER);
      const res = resObj?.choices?.[0]?.message?.content || '';
      let cleanText = res.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```/g, '').trim();
      }

      const parsed = JSON.parse(cleanText);
      if (parsed.questions && parsed.questions.length > 0) {
        setQuestions(parsed.questions);
        if (parsed.topic) setTopic(parsed.topic);
      }
    } catch (e) {
      alert("Failed to generate practice set: " + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGetFeedback = async () => {
    setEvaluating(true);
    try {
      const submissionText = questions.map(q => `Question: "${q.text}"\nStudent Answer: "${answers[q.id] || '(No Answer Provided)'}"`).join('\n\n');
      
      const prompt = `You are Luter AI, a supportive academic tutor. Please evaluate these student answers for a practice set on "${topic}":
      
      ${submissionText}
      
      Provide constructive feedback for each question:
      - Score out of 10
      - What was correct/good
      - Missing concepts or errors
      - Ideal reference answer
      
      Present your evaluation in a beautiful, structured markdown format. Use bullet points and clean headers.`;

      const resObj = await callGroqAPI([{ role: 'user', content: prompt }], GROQ_MODELS.PROFESSOR);
      const res = resObj?.choices?.[0]?.message?.content || '';
      setFeedback(res);
    } catch (e) {
      alert("Failed to evaluate: " + e.message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', padding: '32px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Outfit, sans-serif' }}>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', 
          borderRadius: '16px', padding: '32px', color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 0 }} />
          
          <div style={{ flex: 1, zIndex: 1 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif' }}>AI Practice Sets</h2>
            <p style={{ fontSize: '13.5px', opacity: 0.9, lineHeight: '1.5', margin: '0 0 20px 0', maxWidth: '480px' }}>
              Input a study topic or leave it blank to generate custom conceptual worksheets matching your classroom stream. Submit your responses and get instant grading feedback from Luter AI.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="e.g. Newton's Laws, SQL Joins, Photosynthesis..." 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '8px', border: 'none',
                  fontSize: '14px', outline: 'none', color: '#3c4043', background: '#ffffff',
                  fontFamily: 'Outfit, sans-serif'
                }}
              />
              <button
                onClick={handleGeneratePractice}
                disabled={loading}
                style={{
                  padding: '12px 24px', borderRadius: '8px', border: 'none',
                  background: '#ffffff', color: '#7C3AED', fontWeight: 700, fontSize: '14px',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
                  fontFamily: 'Outfit, sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {loading ? 'Generating...' : 'Generate Worksheet'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }} className="cls-mascot-img-wrap">
            <img 
              src="/mascot.png" 
              alt="Luter Mascot" 
              style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))', animation: 'float 5s ease-in-out infinite' }} 
            />
          </div>
        </div>

        {questions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#3c4043', margin: '12px 0 0 0' }}>Practice Set: {topic}</h3>
            
            {questions.map((q) => (
              <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #dadce0', borderRadius: '10px', padding: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#202124' }}>{q.id}. {q.text}</span>
                <textarea 
                  rows={3}
                  placeholder="Type your explanation or answer..."
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #dadce0',
                    fontSize: '13.5px', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>
            ))}

            <button
              onClick={handleGetFeedback}
              disabled={evaluating || Object.keys(answers).length === 0}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: '8px', border: 'none',
                background: Object.keys(answers).length === 0 ? '#f1f3f4' : '#7C3AED',
                color: Object.keys(answers).length === 0 ? '#70757a' : 'white',
                fontSize: '15px', fontWeight: 600, cursor: Object.keys(answers).length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {evaluating ? 'Analyzing Answers with Luter AI...' : 'Submit Worksheet for AI Feedback'}
            </button>
          </div>
        )}

        {feedback && (
          <div style={{
            background: '#F5F3FF', border: '1px solid #C084FC', borderRadius: '12px', padding: '24px',
            marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#6B21A8', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Outfit, sans-serif' }}>
              <img src="/mascot.png" alt="Luter Mascot" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              <span>AI Evaluation & Feedback</span>
            </h3>
            
            <div style={{
              fontSize: '14px', color: '#3c4043', lineHeight: '1.6', 
              whiteSpace: 'pre-wrap', fontFamily: 'Outfit'
            }}>
              {feedback}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

