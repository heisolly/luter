import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { RiQuestionFill as HelpCircle, RiLoader4Line as Loader2, RiFlashlightFill as Zap, RiCheckboxCircleFill as CheckCircle2, RiCloseCircleFill as XCircle } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import LuterLogo from '../shared/LuterLogo'

export default function AIQuizPage() {
  const { user } = useOutletContext()
  const [materials, setMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [questions, setQuestions] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)

  useEffect(() => {
    if (user) fetchMaterials()
  }, [user])

  async function fetchMaterials() {
    const { data } = await supabase.from('materials').select('*').limit(20)
    if (data) setMaterials(data)
  }

  const generateQuiz = async () => {
    if (!selectedMaterial?.extracted_text) return
    setIsGenerating(true)
    setQuestions([])
    setShowResult(false)
    setScore(0)
    setCurrentIdx(0)
    try {
      const response = await callGroqAPI(
        [{ role: 'user', content: selectedMaterial.extracted_text }],
        GROQ_MODELS.PROFESSOR,
        { systemPromptOverride: GROQ_PROMPTS.MOCK_EXAM }
      )
      const content = response.choices[0].message.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
      setQuestions(parsed)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswer = (key) => {
    setSelectedAnswer(key)
    const isCorrect = key === questions[currentIdx].answer
    if (isCorrect) setScore(s => s + 1)
    
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1)
        setSelectedAnswer(null)
      } else {
        setShowResult(true)
      }
    }, 1000)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Outfit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A3A32', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HelpCircle color="#7a12cc" size={32} /> AI Quick Quiz
          </h1>
          <p style={{ color: '#4A5568' }}>Test your knowledge with instant AI-generated questions.</p>
        </div>
        <LuterLogo size={40} showText={false} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', height: 'fit-content' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#4A5568', marginBottom: '16px', textTransform: 'uppercase' }}>Select Material</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {materials.map(m => (
              <button 
                key={m.id}
                onClick={() => setSelectedMaterial(m)}
                style={{ 
                  textAlign: 'left', padding: '12px', borderRadius: '10px', border: '1px solid',
                  borderColor: selectedMaterial?.id === m.id ? '#7a12cc' : '#F1F5F9',
                  background: selectedMaterial?.id === m.id ? '#F5F3FF' : 'white',
                  fontSize: '13px', color: selectedMaterial?.id === m.id ? '#7a12cc' : '#4A5568'
                }}
              >
                {m.title}
              </button>
            ))}
          </div>
          <button 
            onClick={generateQuiz}
            disabled={!selectedMaterial || isGenerating}
            style={{ 
              width: '100%', marginTop: '24px', padding: '12px', borderRadius: '10px', 
              background: '#7a12cc', color: 'white', fontWeight: 700, display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
            Start Quiz
          </button>
        </div>

        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', minHeight: '400px' }}>
          {showResult ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A3A32' }}>Quiz Complete!</h2>
              <p style={{ fontSize: '18px', margin: '16px 0', color: '#4A5568' }}>You scored <strong>{score}</strong> out of <strong>{questions.length}</strong></p>
              <button onClick={generateQuiz} style={{ padding: '12px 24px', background: '#7a12cc', color: 'white', borderRadius: '10px', fontWeight: 700 }}>Try Again</button>
            </div>
          ) : questions.length > 0 ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '14px', fontWeight: 600, color: '#7a12cc' }}>
                <span>Question {currentIdx + 1} of {questions.length}</span>
                <span>Score: {score}</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A3A32', marginBottom: '24px', lineHeight: 1.5 }}>{questions[currentIdx].question}</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {Object.entries(questions[currentIdx].options || {}).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => !selectedAnswer && handleAnswer(key)}
                    style={{
                      textAlign: 'left', padding: '16px', borderRadius: '12px', border: '1px solid',
                      borderColor: selectedAnswer === key ? (key === questions[currentIdx].answer ? '#10B981' : '#EF4444') : '#E2E8F0',
                      background: selectedAnswer === key ? (key === questions[currentIdx].answer ? '#ECFDF5' : '#FEF2F2') : 'white',
                      fontSize: '15px', color: '#4A5568', transition: 'all 0.2s', position: 'relative'
                    }}
                  >
                    <strong>{key}:</strong> {value}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
              <HelpCircle size={48} style={{ marginBottom: '16px' }} />
              <p>Select a material to generate a quick quiz.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
