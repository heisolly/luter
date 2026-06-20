import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import {
  CheckCircle,
  Copy,
  Crown,
  Lightning,
  Medal,
  Play,
  QrCode,
  ShareNetwork,
  Timer,
  Trophy,
  Users,
  X,
  XCircle,
} from '@phosphor-icons/react'
import { playgroundService } from '../../services/playgroundService'
import { supabase } from '../../supabaseClient'

const GAME_FONT = "'Inter','Inter',system-ui,sans-serif"
const TEXT = '#172033'
const MUTED = '#64748b'
const MINT = '#98FF98'
const PEACH = '#FFD2A6'
const LAVENDER = '#C4B5FD'
const PURPLE = '#7C3AED'

const REACTIONS = [
  { id: 'spark', label: 'Nice', symbol: '✨' },
  { id: 'fire', label: 'Hot', symbol: '🔥' },
  { id: 'heart', label: 'Love', symbol: '💜' },
  { id: 'mind', label: 'Brainy', symbol: '🧠' },
  { id: 'clap', label: 'Clapped', symbol: '👏' },
  { id: 'wow', label: 'Wow', symbol: '😮' },
]

const QUESTION_TEMPLATES = [
  (term) => `What best explains ${term}?`,
  (term) => `Which answer is correct for "${term}"?`,
  (term) => `In this topic, "${term}" means what?`,
  (term) => `Choose the strongest explanation for ${term}.`,
  (term) => `A classmate asks about "${term}". What should you answer?`,
]

function buildQuestions(deck = []) {
  const cleanDeck = (deck || [])
    .map((item, index) => ({
      id: item.id || `q_${index}`,
      term: String(item.term || item.question || `Question ${index + 1}`).replace(/\*\*/g, '').trim(),
      definition: String(item.definition || item.answer || '').replace(/\*\*/g, '').trim(),
    }))
    .filter((item) => item.term && item.definition)

  const pool = cleanDeck.length ? cleanDeck : [
    { id: 'fallback_1', term: 'Active recall', definition: 'Testing memory by retrieving an answer without looking' },
    { id: 'fallback_2', term: 'Study focus', definition: 'Giving attention to one learning task at a time' },
    { id: 'fallback_3', term: 'Practice', definition: 'Repeating a skill until it becomes easier to use' },
    { id: 'fallback_4', term: 'Mastery', definition: 'Understanding a topic well enough to explain and apply it' },
  ]

  return pool.slice(0, 8).map((item, index) => {
    const wrongOptions = pool
      .filter((candidate) => candidate.definition !== item.definition)
      .map((candidate) => candidate.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    const fallbackOptions = [
      'A detail that is not supported by the topic',
      'A repeated phrase with no clear meaning',
      'An unrelated answer from another subject',
    ]

    const prompt = item.term.endsWith('?')
      ? item.term
      : QUESTION_TEMPLATES[index % QUESTION_TEMPLATES.length](item.term)

    return {
      id: item.id,
      prompt,
      answer: item.definition,
      options: [item.definition, ...wrongOptions, ...fallbackOptions]
        .slice(0, 4)
        .sort(() => Math.random() - 0.5),
    }
  })
}

function getPlayerName(participant) {
  return participant?.profiles?.full_name || participant?.guest_name || 'Scholar'
}

function getInitial(name) {
  return (name || 'S').charAt(0).toUpperCase()
}

export default function ClutLivePage() {
  const navigate = useNavigate()
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const [room, setRoom] = useState(null)
  const [participants, setParticipants] = useState([])
  const [user, setUser] = useState(null)
  const [guestName] = useState(() => localStorage.getItem('luter-clut-guest') || `Scholar ${Math.floor(100 + Math.random() * 900)}`)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [lastResult, setLastResult] = useState(null)
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now())
  const [finishing, setFinishing] = useState(false)
  const [answerHistory, setAnswerHistory] = useState([])
  const [qrDataUrl, setQrDataUrl] = useState('')

  const displayCode = (roomCode || '').toUpperCase()
  const inviteUrl = `${window.location.origin}/clut/live/${displayCode}`
  const title = room?.metadata?.title || searchParams.get('title') || searchParams.get('topic') || 'Clut Live'
  const questions = useMemo(() => buildQuestions(room?.metadata?.deck || []), [room?.metadata?.deck])
  const currentQuestion = questions[currentIndex]
  const isHost = user?.id && room?.created_by === user.id
  const isFinished = room?.status === 'finished'
  const activeReactions = (room?.metadata?.clut_reactions || []).slice(-8)
  const currentParticipant = participants.find((participant) => (
    user?.id ? participant.user_id === user.id : participant.guest_name === guestName
  ))

  const refreshParticipants = useCallback(async (targetRoomId) => {
    if (!targetRoomId) return
    const list = await playgroundService.getParticipants(targetRoomId)
    setParticipants(list || [])
  }, [])

  useEffect(() => {
    localStorage.setItem('luter-clut-guest', guestName)
  }, [guestName])

  useEffect(() => {
    setQuestionStartedAt(Date.now())
  }, [currentIndex])

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(inviteUrl, {
      margin: 1,
      width: 170,
      color: { dark: '#172033', light: '#FFFFFF' },
    }).then((url) => {
      if (alive) setQrDataUrl(url)
    }).catch(() => {
      if (alive) setQrDataUrl('')
    })
    return () => { alive = false }
  }, [inviteUrl])

  useEffect(() => {
    let channel
    let mounted = true

    const loadRoom = async () => {
      setLoading(true)
      setError('')
      const { data: authData } = await supabase.auth.getUser()
      const authUser = authData?.user || null
      if (!mounted) return
      setUser(authUser)

      const { data, error: roomError } = await supabase
        .from('playground_rooms')
        .select('*')
        .eq('game_type', 'clut-live')
        .contains('metadata', { clut_code: displayCode })
        .maybeSingle()

      if (!mounted) return
      if (roomError || !data) {
        setError('This Clut room was not found.')
        setLoading(false)
        return
      }

      setRoom(data)
      try {
        await playgroundService.joinRoom(data.id, authUser?.id || null, authUser ? null : guestName)
      } catch (joinError) {
        console.error('Clut join failed:', joinError)
      }
      await refreshParticipants(data.id)

      channel = playgroundService.subscribeToRoom(data.id, (type, payload) => {
        if (type === 'room') setRoom((previous) => ({ ...previous, ...payload }))
        if (type === 'participants') refreshParticipants(data.id)
      })
      setLoading(false)
    }

    loadRoom()
    return () => {
      mounted = false
      if (channel) playgroundService.supabase.removeChannel(channel)
    }
  }, [displayCode, guestName, refreshParticipants])

  const copyLink = async () => {
    await navigator.clipboard?.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const inviteFriends = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Join my Clut Live game', text: `Join my Clut Live game: ${displayCode}`, url: inviteUrl }).catch(() => copyLink())
      return
    }
    copyLink()
  }

  const startGame = async () => {
    if (!room?.id || !isHost) return
    await playgroundService.updateRoomMetadata(room.id, {
      clut_state: { started_at: new Date().toISOString() },
      clut_reactions: [],
      winner_participant_id: null,
      winner_name: null,
      winner_score: null,
    })
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setLastResult(null)
    setScore(0)
    setAnswerHistory([])
    await playgroundService.startGame(room.id)
  }

  const sendReaction = async (reaction) => {
    if (!room?.id) return
    const name = getPlayerName(currentParticipant) || (user?.email?.split('@')[0]) || guestName
    const nextReaction = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      symbol: reaction.symbol,
      label: reaction.label,
      from: name,
      at: new Date().toISOString(),
    }
    const previous = room?.metadata?.clut_reactions || []
    await playgroundService.updateRoomMetadata(room.id, {
      clut_reactions: [...previous.slice(-12), nextReaction],
    }).catch(() => {})
  }

  const chooseAnswer = async (answer) => {
    if (selectedAnswer || isFinished || !currentQuestion) return
    const seconds = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000))
    const correct = answer === currentQuestion.answer
    const xp = correct ? Math.max(25, 65 - Math.min(seconds, 40)) : 0
    const nextScore = score + xp
    setSelectedAnswer(answer)
    setLastResult({ correct, seconds, xp })
    setScore(nextScore)
    setAnswerHistory((previous) => [
      ...previous,
      {
        questionId: currentQuestion.id,
        prompt: currentQuestion.prompt,
        answer: currentQuestion.answer,
        selected: answer,
        correct,
        seconds,
        xp,
      },
    ])

    if (currentParticipant?.id) {
      playgroundService.updateParticipantScore(currentParticipant.id, nextScore).catch(() => {})
    }
  }

  const finishGame = async (finalScore = score) => {
    if (!room?.id || finishing || isFinished) return
    setFinishing(true)
    const name = getPlayerName(currentParticipant)
    if (currentParticipant?.id) {
      await playgroundService.updateParticipantScore(currentParticipant.id, finalScore).catch(() => {})
    }
    await playgroundService.finishRoom(room.id, {
      winner_participant_id: currentParticipant?.id || null,
      winner_name: name,
      winner_score: finalScore,
    }).catch(() => {})
    refreshParticipants(room.id)
    setFinishing(false)
  }

  const nextQuestion = () => {
    setSelectedAnswer(null)
    setLastResult(null)
    if (currentIndex >= questions.length - 1) {
      finishGame(score)
      return
    }
    setCurrentIndex((value) => value + 1)
  }

  const playAgain = async () => {
    if (!isHost || !room?.id) return
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setLastResult(null)
    setScore(0)
    setAnswerHistory([])
    await playgroundService.updateRoomMetadata(room.id, {
      clut_state: { restarted_at: new Date().toISOString() },
      clut_reactions: [],
      winner_participant_id: null,
      winner_name: null,
      winner_score: null,
      finished_at: null,
    })
    await playgroundService.startGame(room.id)
  }

  if (loading) {
    return <ClutFrame title="Clut Live" onClose={() => navigate('/playground')}><CenteredState text="Opening live room..." /></ClutFrame>
  }

  if (error) {
    return <ClutFrame title="Clut Live" onClose={() => navigate('/playground')}><CenteredState text={error} /></ClutFrame>
  }

  return (
    <ClutFrame title={room?.status === 'playing' ? title : 'Clut Live'} onClose={() => navigate('/playground')}>
      <AnimatePresence>
        {copied && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} style={toastStyle}>
            Link copied
          </motion.div>
        )}
      </AnimatePresence>

      <ReactionRail onReact={sendReaction} />
      <ReactionBursts reactions={activeReactions} />

      {room?.status === 'waiting' ? (
        <LobbyView
          title={title}
          displayCode={displayCode}
          participants={participants}
          isHost={isHost}
          qrDataUrl={qrDataUrl}
          onCopy={copyLink}
          onInvite={inviteFriends}
          onStart={startGame}
        />
      ) : isFinished ? (
        <ResultView
          room={room}
          localScore={score}
          total={questions.length}
          participants={participants}
          answers={answerHistory}
          isHost={isHost}
          onReplay={playAgain}
          onExit={() => navigate('/playground')}
        />
      ) : (
        <QuestionView
          title={title}
          question={currentQuestion}
          index={currentIndex}
          total={questions.length}
          selectedAnswer={selectedAnswer}
          lastResult={lastResult}
          score={score}
          participants={participants}
          onChoose={chooseAnswer}
          onNext={nextQuestion}
          finishing={finishing}
        />
      )}
    </ClutFrame>
  )
}

function ClutFrame({ title, onClose, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', color: TEXT, fontFamily: GAME_FONT, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes clut-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes clut-pop { 0% { transform: scale(.82); opacity: 0; } 35% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes clut-reaction { 0% { transform: translateY(0) scale(.8) rotate(-5deg); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(-110px) scale(1.15) rotate(8deg); opacity: 0; } }
        @keyframes clut-spin { to { transform: rotate(360deg); } }
      `}</style>
      <header style={{ height: 58, borderBottom: '1px solid #e2e8f0', background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(16px)', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 22px', flexShrink: 0 }}>
        <span />
        <strong style={{ fontSize: 17, fontWeight: 900 }}>{title}</strong>
        <button onClick={onClose} aria-label="Close Clut" style={{ justifySelf: 'end', width: 42, height: 42, borderRadius: 16, border: '1px solid transparent', background: 'transparent', cursor: 'pointer', color: '#0f172a', display: 'grid', placeItems: 'center' }}>
          <X size={26} weight="bold" />
        </button>
      </header>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(34px, 6vh, 82px) 20px 34px', position: 'relative', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

function LobbyView({ title, displayCode, participants, isHost, qrDataUrl, onCopy, onInvite, onStart }) {
  return (
    <>
      <img src="/mascot.png" alt="" style={{ width: 116, height: 116, objectFit: 'contain', marginBottom: 18, animation: 'clut-float 4s ease-in-out infinite' }} />
      <h1 style={{ margin: '0 0 26px', fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em' }}>{title}</h1>
      <section style={lobbyCardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 132px', gap: 24, alignItems: 'center' }}>
          <div>
            <p style={labelStyle}>Game Code</p>
            <div style={{ fontSize: 35, fontWeight: 900, color: '#071122', letterSpacing: '-0.04em' }}>{displayCode}</div>
            <p style={{ margin: '10px 0 18px', color: MUTED, fontWeight: 700 }}>Enter this code or copy the invite link.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {participants.map((participant, index) => <PlayerPill key={participant.id} participant={participant} index={index} />)}
            </div>
          </div>
          <div style={qrStyle}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Live game QR code" style={{ width: 116, height: 116, display: 'block', borderRadius: 12 }} />
            ) : (
              <QrCode size={74} weight="bold" />
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
          <button onClick={onCopy} style={pillButtonStyle}><Copy size={23} /> Copy link</button>
          <button onClick={onInvite} style={pillButtonStyle}><ShareNetwork size={23} /> Invite friends</button>
        </div>
      </section>
      <button onClick={onStart} disabled={!isHost} style={{ ...startButtonStyle, background: isHost ? `linear-gradient(135deg, ${PURPLE}, ${LAVENDER})` : '#94a3b8', cursor: isHost ? 'pointer' : 'not-allowed' }}>
        {isHost ? <><Play size={20} weight="fill" /> Start game</> : <><Spinner /> Waiting for host to start...</>}
      </button>
    </>
  )
}

function QuestionView({ title, question, index, total, selectedAnswer, lastResult, score, participants, onChoose, onNext, finishing }) {
  const answered = Boolean(selectedAnswer)
  const progress = `${Math.round(((index + 1) / Math.max(total, 1)) * 100)}%`

  return (
    <>
      <div style={{ width: 'min(780px, 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 16 }}>
        <div style={statusPillStyle}><Timer size={19} weight="bold" /> Live round</div>
        <div style={{ ...statusPillStyle, background: '#fff7ed' }}><Lightning size={18} weight="fill" color="#f59e0b" /> {score} XP</div>
        <div style={{ ...statusPillStyle, background: '#f5f3ff' }}><Users size={18} weight="bold" color={PURPLE} /> {participants.length || 1}</div>
      </div>
      <h1 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 900 }}>{title}</h1>
      <div style={progressShellStyle}>
        <span style={{ width: progress, height: '100%', background: `linear-gradient(90deg, ${MINT}, ${LAVENDER})`, borderRadius: 999, transition: 'width .25s ease' }} />
      </div>
      <motion.section key={question?.id || index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={questionCardStyle}>
        <p style={{ margin: '0 0 16px', color: PURPLE, fontWeight: 900 }}>Question {index + 1} of {total}</p>
        <h2 style={{ margin: 0, fontSize: 'clamp(20px, 3vw, 26px)', lineHeight: 1.18, fontWeight: 900 }}>{question?.prompt || 'Preparing question...'}</h2>
      </motion.section>
      <div style={{ width: 'min(780px, 100%)', display: 'grid', gap: 12 }}>
        {(question?.options || []).map((option) => {
          const correct = answered && option === question.answer
          const wrong = selectedAnswer === option && option !== question.answer
          return (
            <motion.button
              key={option}
              whileTap={!answered ? { scale: 0.985 } : {}}
              onClick={() => onChoose(option)}
              disabled={answered}
              style={{
                minHeight: 66,
                border: `2px solid ${correct ? MINT : wrong ? PEACH : '#dce5f0'}`,
                borderRadius: 22,
                background: correct ? '#efffed' : wrong ? '#fff2e5' : 'white',
                cursor: answered ? 'default' : 'pointer',
                fontWeight: 800,
                color: TEXT,
                boxShadow: correct ? '0 12px 32px rgba(34,197,94,.13)' : wrong ? '0 12px 32px rgba(239,68,68,.12)' : '0 8px 24px rgba(15,23,42,.035)',
                fontFamily: GAME_FONT,
                position: 'relative',
              }}
            >
              {option}
            </motion.button>
          )
        })}
      </div>
      <AnimatePresence>
        {lastResult && (
          <motion.div initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} style={resultPillStyle(lastResult.correct)}>
            {lastResult.correct ? <CheckCircle size={22} weight="fill" /> : <XCircle size={22} weight="fill" />}
            <strong>{lastResult.correct ? 'Correct answer!' : 'Incorrect answer'}</strong>
            <span style={miniDividerStyle} />
            <Timer size={19} weight="bold" />
            <strong>{lastResult.seconds}s</strong>
            <span style={miniDividerStyle} />
            <strong>+ {lastResult.xp} XP</strong>
          </motion.div>
        )}
      </AnimatePresence>
      {answered && (
        <button onClick={onNext} disabled={finishing} style={startButtonStyle}>
          {finishing ? <><Spinner /> Ending game...</> : index >= total - 1 ? 'Finish' : 'Next'}
        </button>
      )}
    </>
  )
}

function ResultView({ room, localScore, total, participants, answers, isHost, onReplay, onExit }) {
  const sorted = [...participants].sort((a, b) => (b.score || 0) - (a.score || 0))
  const winnerName = room?.metadata?.winner_name || getPlayerName(sorted[0])

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={resultsShellStyle}>
      <div style={celebrationStyle} />
      <div style={{ width: 86, height: 86, borderRadius: 28, margin: '0 auto 14px', background: `linear-gradient(135deg, ${MINT}, ${LAVENDER})`, display: 'grid', placeItems: 'center', boxShadow: '0 18px 45px rgba(124,58,237,.18)' }}>
        <Trophy size={46} weight="duotone" color="#172033" />
      </div>
      <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em' }}>Clut Complete</h1>
      <p style={{ margin: '10px 0 24px', color: MUTED, fontWeight: 750 }}>
        {winnerName ? `${winnerName} finished first.` : 'Game complete.'} Your score: {localScore} XP from {total} questions.
      </p>

      <div style={podiumStyle}>
        {sorted.slice(0, 3).map((participant, index) => (
          <PodiumPlayer key={participant.id} participant={participant} index={index} />
        ))}
      </div>

      <section style={reviewStyle}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 900 }}>Your answers</h2>
        {answers.length ? answers.map((item, index) => <AnswerReview key={`${item.questionId}_${index}`} item={item} />) : (
          <p style={{ margin: 0, color: MUTED, fontWeight: 750 }}>This device did not answer before the game ended.</p>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: isHost ? '1fr 1fr' : '1fr', gap: 12, marginTop: 22 }}>
        {isHost && <button onClick={onReplay} style={{ ...startButtonStyle, marginTop: 0, width: '100%' }}>Play Again</button>}
        <button onClick={onExit} style={{ ...secondaryButtonStyle, width: '100%' }}>Back to Arcade</button>
      </div>
    </motion.section>
  )
}

function PodiumPlayer({ participant, index }) {
  const name = getPlayerName(participant)
  const colors = [LAVENDER, MINT, PEACH]
  const heights = [104, 82, 68]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', minHeight: 170, order: index === 0 ? 2 : index === 1 ? 1 : 3 }}>
      <span style={{ width: 58, height: 58, borderRadius: 22, background: colors[index], display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, marginBottom: 8, boxShadow: '0 12px 28px rgba(15,23,42,.10)' }}>{getInitial(name)}</span>
      <strong style={{ fontSize: 14, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</strong>
      <span style={{ marginTop: 6, borderRadius: 999, padding: '5px 12px', background: index === 0 ? '#fff2e5' : '#f5f3ff', color: TEXT, fontWeight: 900 }}>{participant.score || 0} XP</span>
      <div style={{ width: 78, height: heights[index], marginTop: 10, borderRadius: '18px 18px 8px 8px', background: `linear-gradient(180deg, ${colors[index]}, #fff)`, border: '1px solid #e2e8f0', display: 'grid', placeItems: 'start center', paddingTop: 12, fontWeight: 900 }}>{index + 1}</div>
    </div>
  )
}

function AnswerReview({ item }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden', background: 'white' }}>
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px dashed #e2e8f0' }}>
        <strong style={{ textAlign: 'left', lineHeight: 1.35 }}>{item.prompt}</strong>
        <span style={{ color: item.correct ? '#166534' : '#9a3412', fontWeight: 900, whiteSpace: 'nowrap' }}>{item.correct ? 'Correct' : 'Missed'}</span>
      </div>
      <div style={{ padding: 14, display: 'grid', gap: 8 }}>
        <div style={{ ...answerChipStyle, background: item.correct ? '#efffed' : '#fff2e5' }}>Your answer: {item.selected}</div>
        {!item.correct && <div style={{ ...answerChipStyle, background: '#f5f3ff' }}>Correct answer: {item.answer}</div>}
        <div style={{ color: MUTED, fontWeight: 750, fontSize: 13 }}>{item.seconds}s · +{item.xp} XP</div>
      </div>
    </div>
  )
}

function LeaderboardRow({ participant, index }) {
  const name = getPlayerName(participant)
  const colors = [PEACH, LAVENDER, MINT]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '42px 1fr auto', alignItems: 'center', gap: 12, background: index === 0 ? '#fff7ed' : '#f8fafc', border: `2px solid ${index === 0 ? PEACH : '#e2e8f0'}`, borderRadius: 20, padding: '12px 14px', fontWeight: 900 }}>
      <span style={{ width: 42, height: 42, borderRadius: 16, background: colors[index] || '#e2e8f0', display: 'grid', placeItems: 'center' }}>{index === 0 ? <Crown size={22} weight="fill" /> : <Medal size={21} weight="fill" />}</span>
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ color: PURPLE }}>{participant.score || 0} XP</span>
    </div>
  )
}

function ReactionRail({ onReact }) {
  return (
    <div style={reactionDockStyle}>
      {REACTIONS.map((reaction) => (
        <motion.button
          key={reaction.id}
          whileHover={{ x: -4 }}
          whileTap={{ scale: .94 }}
          onClick={() => onReact(reaction)}
          title={reaction.label}
          style={{
            width: 44,
            height: 44,
            padding: 0,
            borderRadius: 16,
            border: '1px solid rgba(196,181,253,.6)',
            background: 'rgba(255,255,255,.92)',
            boxShadow: '0 10px 22px rgba(124,58,237,.10)',
            cursor: 'pointer',
            fontFamily: GAME_FONT,
            fontSize: 20,
            fontWeight: 900,
            backdropFilter: 'blur(10px)',
          }}
        >
          {reaction.symbol}
        </motion.button>
      ))}
    </div>
  )
}

function ReactionBursts({ reactions }) {
  return (
    <div style={{ position: 'fixed', right: 92, bottom: 90, pointerEvents: 'none', zIndex: 7 }}>
      <AnimatePresence>
        {reactions.map((reaction, index) => (
          <motion.div
            key={reaction.id}
            initial={{ opacity: 0, y: 16, scale: .92 }}
            animate={{ opacity: [0, 1, 1, 0], y: -74 - index * 4, scale: [0.92, 1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.45 }}
            style={{ position: 'absolute', right: 0, bottom: index * 8, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 14px 34px rgba(15,23,42,.12)', padding: '8px 12px', fontWeight: 900, whiteSpace: 'nowrap' }}
          >
            <span style={{ fontSize: 22 }}>{reaction.symbol}</span>
            <span style={{ fontSize: 12, color: MUTED }}>{reaction.from}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function PlayerPill({ participant, index }) {
  const name = getPlayerName(participant)
  const colors = [PEACH, LAVENDER, MINT, '#dbeafe']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 900 }}>
      <span style={{ width: 28, height: 28, borderRadius: 999, background: colors[index % colors.length], display: 'grid', placeItems: 'center', color: TEXT }}>{getInitial(name)}</span>
      {name}
    </span>
  )
}

function Spinner() {
  return <span style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,.35)', borderTopColor: 'white', borderRadius: '50%', animation: 'clut-spin .8s linear infinite', display: 'inline-block' }} />
}

function CenteredState({ text }) {
  return <div style={{ margin: 'auto', color: MUTED, fontWeight: 900 }}>{text}</div>
}

const toastStyle = {
  position: 'fixed',
  top: 76,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#16a34a',
  color: 'white',
  borderRadius: 999,
  padding: '10px 16px',
  fontWeight: 900,
  zIndex: 10,
}

const labelStyle = {
  margin: '0 0 6px',
  color: MUTED,
  fontSize: 13,
  fontWeight: 900,
}

const lobbyCardStyle = {
  width: 'min(560px, 100%)',
  background: 'white',
  border: '1px solid #dbe3ee',
  borderRadius: 22,
  padding: 24,
  boxShadow: '0 22px 60px rgba(15,23,42,0.08)',
}

const qrStyle = {
  width: 128,
  height: 128,
  borderRadius: 20,
  background: 'white',
  display: 'grid',
  placeItems: 'center',
  color: TEXT,
  border: `6px solid ${LAVENDER}`,
  boxShadow: `0 12px 28px rgba(124,58,237,.12), 0 0 0 6px ${MINT}`,
}

const pillButtonStyle = {
  height: 52,
  border: '2px solid #dbe3ee',
  background: 'white',
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 15,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  color: TEXT,
  fontFamily: GAME_FONT,
}

const startButtonStyle = {
  marginTop: 'auto',
  width: 'min(490px, 100%)',
  minHeight: 56,
  border: 'none',
  borderRadius: 999,
  background: `linear-gradient(135deg, ${PURPLE}, ${LAVENDER})`,
  color: 'white',
  fontSize: 17,
  fontWeight: 900,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  boxShadow: '0 16px 38px rgba(23,32,51,.16)',
  fontFamily: GAME_FONT,
}

const secondaryButtonStyle = {
  minHeight: 56,
  border: '2px solid #dbe3ee',
  borderRadius: 999,
  background: 'white',
  color: TEXT,
  fontSize: 17,
  fontWeight: 900,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  fontFamily: GAME_FONT,
}

const statusPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid #e2e8f0',
  background: 'white',
  color: TEXT,
  borderRadius: 999,
  padding: '9px 14px',
  fontWeight: 900,
  boxShadow: '0 8px 22px rgba(15,23,42,.04)',
}

const progressShellStyle = {
  width: 'min(420px, 100%)',
  height: 14,
  borderRadius: 999,
  background: '#eceff6',
  padding: 3,
  marginBottom: 28,
  display: 'flex',
}

const questionCardStyle = {
  width: 'min(780px, 100%)',
  border: `3px solid ${MINT}`,
  borderRadius: 28,
  background: 'white',
  padding: 'clamp(24px, 4vw, 34px)',
  marginBottom: 28,
  boxShadow: '0 20px 50px rgba(124,58,237,.08)',
}

const miniDividerStyle = {
  width: 1,
  height: 24,
  background: '#e2e8f0',
}

const resultPillStyle = (correct) => ({
  marginTop: 26,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #e2e8f0',
  borderRadius: 999,
  background: 'white',
  color: correct ? '#166534' : '#9a3412',
  padding: '11px 18px',
  fontWeight: 900,
  boxShadow: '0 16px 36px rgba(15,23,42,.08)',
})

const leaderboardStyle = {
  width: 'min(640px, 100%)',
  background: 'white',
  borderRadius: 30,
  border: '1px solid #e2e8f0',
  padding: 34,
  textAlign: 'center',
  boxShadow: '0 24px 70px rgba(15,23,42,0.10)',
}

const resultsShellStyle = {
  width: 'min(680px, 100%)',
  background: 'white',
  borderRadius: 30,
  border: '1px solid #e2e8f0',
  padding: 34,
  textAlign: 'center',
  boxShadow: '0 24px 70px rgba(15,23,42,0.10)',
  position: 'relative',
  overflow: 'hidden',
}

const celebrationStyle = {
  position: 'absolute',
  inset: 0,
  background: `radial-gradient(circle at 18% 16%, ${PEACH}55 0 4px, transparent 5px),
    radial-gradient(circle at 82% 18%, ${MINT}66 0 5px, transparent 6px),
    radial-gradient(circle at 75% 82%, ${LAVENDER}66 0 5px, transparent 6px),
    radial-gradient(circle at 24% 78%, ${PEACH}55 0 5px, transparent 6px)`,
  pointerEvents: 'none',
}

const podiumStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  alignItems: 'end',
  gap: 12,
  margin: '10px 0 24px',
  padding: '22px 18px 6px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
}

const reviewStyle = {
  position: 'relative',
  display: 'grid',
  gap: 10,
  textAlign: 'left',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 18,
  maxHeight: 360,
  overflowY: 'auto',
}

const answerChipStyle = {
  borderRadius: 14,
  padding: '10px 12px',
  color: TEXT,
  fontWeight: 800,
  lineHeight: 1.35,
}

const reactionDockStyle = {
  position: 'fixed',
  right: 24,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  zIndex: 5,
  padding: 8,
  borderRadius: 24,
  border: '1px solid rgba(226,232,240,.78)',
  background: 'rgba(255,255,255,.55)',
  boxShadow: '0 18px 42px rgba(15,23,42,.08)',
  backdropFilter: 'blur(14px)',
}
