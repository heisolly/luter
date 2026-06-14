import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Brain, Lightning, MagnifyingGlass, Question, XCircle, CheckCircle, ArrowClockwise, Spinner } from '@phosphor-icons/react'
import { ThinkingIndicator } from '../ui/thinking-indicator'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../../groqClient'
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService'
import './luterPages.css'

export default function AIQuizPage() {
  const { user, profile } = useOutletContext()
  const [materials, setMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [questions, setQuestions] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    const fetchMaterials = async () => {
      const { data } = await supabase
        .from('materials')
        .select('id, title, file_name, type, extracted_text, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (data) setMaterials(data)
    }
    fetchMaterials()
  }, [user?.id])

  const filteredMaterials = useMemo(() => {
    const q = search.trim().toLowerCase()
    return materials.filter((material) => !q || (material.title || material.file_name || '').toLowerCase().includes(q))
  }, [materials, search])

  const currentQuestion = questions[currentIdx]
  const complete = questions.length > 0 && currentIdx >= questions.length

  const generateQuiz = async () => {
    if (!selectedMaterial?.extracted_text) {
      setError('Choose a material with extracted text first.')
      return
    }

    setIsGenerating(true)
    setError('')
    setQuestions([])
    setScore(0)
    setCurrentIdx(0)
    setSelectedAnswer(null)

    try {
      const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.GENERATE_QUIZ, profile?.is_premium)
      if (!ok) { setError("You've used up your AI credits for today. They reset daily."); setIsGenerating(false); return }
      const response = await callGroqAPI(
        [{ role: 'user', content: selectedMaterial.extracted_text.slice(0, 12000) }],
        GROQ_MODELS.PROFESSOR,
        { systemPromptOverride: GROQ_PROMPTS.MOCK_EXAM }
      )
      const content = response.choices?.[0]?.message?.content || ''
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
      setQuestions(Array.isArray(parsed) ? parsed.slice(0, 10) : [])
    } catch (err) {
      console.error(err)
      setError('Luter could not generate this quiz yet. Try another material.')
    } finally {
      setIsGenerating(false)
    }
  }

  const chooseAnswer = (key) => {
    if (selectedAnswer || !currentQuestion) return
    setSelectedAnswer(key)
    if (key === currentQuestion.answer) setScore((value) => value + 1)
    setTimeout(() => {
      setSelectedAnswer(null)
      setCurrentIdx((value) => value + 1)
    }, 850)
  }

  return (
    <div className="lp-root">
      <div className="lp-shell">
        <section className="lp-hero">
          <div>
            <p className="lp-kicker">Quick Quiz</p>
            <h1 className="lp-title">Turn any uploaded material into a fast recall check.</h1>
            <p className="lp-subtitle">Pick a file, generate focused questions, and see where your memory is strong or slippery.</p>
          </div>
          <button className="lp-btn lp-btn-primary" disabled={!selectedMaterial || isGenerating} onClick={generateQuiz}>
            {isGenerating ? <Spinner size={18} className="lp-spin" /> : <Lightning size={18} weight="fill" />}
            {isGenerating ? 'Generating' : questions.length ? 'Regenerate' : 'Start quiz'}
          </button>
        </section>

        <section className="lp-two-col">
          <aside className="lp-panel" style={{ padding: 14 }}>
            <div className="lp-search" style={{ marginBottom: 12 }}>
              <MagnifyingGlass size={18} />
              <input className="lp-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials" />
            </div>
            <div className="lp-list">
              {filteredMaterials.length === 0 ? (
                <div className="lp-empty" style={{ minHeight: 220 }}>
                  <div><Question size={36} /><h3>No materials</h3><p>Upload notes in Backpack to generate quizzes.</p></div>
                </div>
              ) : filteredMaterials.map((material) => (
                <button
                  key={material.id}
                  className={`lp-list-btn${selectedMaterial?.id === material.id ? ' active' : ''}`}
                  onClick={() => setSelectedMaterial(material)}
                >
                  <span>{material.title || material.file_name || 'Untitled material'}</span>
                  <span className="lp-badge">{material.type || 'file'}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="lp-panel" style={{ minHeight: 480, padding: 20 }}>
            {error && <div className="lp-badge" style={{ marginBottom: 16, color: '#EF4444', background: 'rgba(239,68,68,0.1)' }}>{error}</div>}

            {complete ? (
              <div className="lp-empty" style={{ minHeight: 430 }}>
                <div>
                  <CheckCircle size={56} weight="duotone" />
                  <h3>Quiz complete</h3>
                  <p>You scored {score} out of {questions.length}. Run it again when the material needs another pass.</p>
                  <button className="lp-btn lp-btn-primary" onClick={generateQuiz}><ArrowClockwise size={18} /> Try again</button>
                </div>
              </div>
            ) : isGenerating ? (
              <div className="lp-empty" style={{ minHeight: 430 }}>
                <ThinkingIndicator />
              </div>
            ) : currentQuestion ? (
              <div>
                <div className="lp-row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
                  <span className="lp-badge">Question {currentIdx + 1} of {questions.length}</span>
                  <span className="lp-badge" style={{ background: 'rgba(152,255,152,0.24)', color: '#166534' }}>Score {score}</span>
                </div>
                <h2 style={{ margin: '0 0 18px', fontSize: 24, lineHeight: 1.25, fontWeight: 900 }}>{currentQuestion.question}</h2>
                <div className="lp-list">
                  {Object.entries(currentQuestion.options || {}).map(([key, value]) => {
                    const isSelected = selectedAnswer === key
                    const isCorrect = selectedAnswer && key === currentQuestion.answer
                    const isWrong = isSelected && key !== currentQuestion.answer
                    return (
                      <button
                        key={key}
                        className="lp-list-btn"
                        onClick={() => chooseAnswer(key)}
                        disabled={Boolean(selectedAnswer)}
                        style={{
                          minHeight: 60,
                          borderColor: isCorrect ? '#16a34a' : isWrong ? '#EF4444' : undefined,
                          background: isCorrect ? 'rgba(152,255,152,0.24)' : isWrong ? 'rgba(239,68,68,0.08)' : undefined,
                        }}
                      >
                        <span><strong>{key}.</strong> {value}</span>
                        {isCorrect && <CheckCircle size={22} color="#16a34a" weight="fill" />}
                        {isWrong && <XCircle size={22} color="#EF4444" weight="fill" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="lp-empty" style={{ minHeight: 430 }}>
                <div>
                  <Question size={56} weight="duotone" />
                  <h3>{selectedMaterial ? 'Ready when you are' : 'Choose a material'}</h3>
                  <p>{selectedMaterial ? 'Generate a short quiz from the selected material.' : 'Your quiz controls will appear here once you choose a material.'}</p>
                </div>
              </div>
            )}
          </main>
        </section>
      </div>
    </div>
  )
}
