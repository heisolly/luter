// Complete render functions for CompetePageEnhanced.jsx
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Users, Zap, Shield, Sword, Target, Crown, Star, Award, 
  Flame, Timer, Loader2, Eye, MessageSquare, Calendar, UserPlus,
  Medal, CheckCircle2, X, Copy, Volume2
} from 'lucide-react'

export const renderLeaderboard = (props) => {
  const { leaderboard, loading, isMobile } = props
  
  return (
    <motion.div
      key="leaderboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div style={{ background: 'white', borderRadius: 24, border: '1.5px solid #7a12cc', overflow: 'hidden' }}>
        {!isMobile && (
          <div style={{
            padding: '24px 32px',
            borderBottom: '1.5px solid #f5eeff',
            display: 'grid',
            gridTemplateColumns: '80px 2fr 120px 120px 120px 100px',
            fontSize: 11,
            fontWeight: 800,
            color: '#7a12cc99',
            textTransform: 'uppercase',
            background: '#fdfbff'
          }}>
            <span>Rank</span>
            <span>Scholar</span>
            <span style={{ textAlign: 'center' }}>Streak</span>
            <span style={{ textAlign: 'center' }}>Win Rate</span>
            <span style={{ textAlign: 'right' }}>Total XP</span>
            <span style={{ textAlign: 'center' }}>Level</span>
          </div>
        )}
        
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Loader2 className="animate-spin" color="#7a12cc" size={32} />
          </div>
        ) : (
          leaderboard.map((student) => (
            <motion.div
              key={student.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: student.rank * 0.05 }}
              style={{
                padding: isMobile ? '16px' : '20px 32px',
                display: 'grid',
                gridTemplateColumns: isMobile ? '48px 1fr 80px' : '80px 2fr 120px 120px 120px 100px',
                alignItems: 'center',
                borderBottom: '1px solid #f8f8f8',
                background: student.rank <= 3 ? 'linear-gradient(90deg, #f5eeff20, transparent)' : 'transparent'
              }}
            >
              <div style={{
                fontSize: isMobile ? 18 : 24,
                fontWeight: 800,
                color: student.rank <= 3 ? '#7a12cc' : '#111',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                {student.rank <= 3 && <Medal size={20} color="#7a12cc" fill="#7a12cc" />}
                #{student.rank}
              </div>
              
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: 800,
                  color: '#111',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  {student.name}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                  {isMobile && `${student.xp.toLocaleString()} XP • ${student.winRate}%`}
                  {!isMobile && student.uni}
                </div>
              </div>
              
              {!isMobile && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f5eeff',
                    color: '#7a12cc',
                    padding: '6px 14px',
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: 800
                  }}>
                    <Flame size={14} fill="#7a12cc" />
                    {student.streak}
                  </div>
                </div>
              )}
              
              {!isMobile && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: student.winRate >= 70 ? '#22c55e' : student.winRate >= 50 ? '#f59e0b' : '#ef4444'
                  }}>
                    {student.winRate}%
                  </div>
                </div>
              )}
              
              <div style={{
                textAlign: 'right',
                fontSize: isMobile ? 14 : 18,
                fontWeight: 800,
                color: isMobile ? '#7a12cc' : '#111'
              }}>
                {isMobile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <Flame size={12} fill="#7a12cc" />
                    {student.streak}
                  </div>
                ) : (
                  student.xp.toLocaleString() + ' XP'
                )}
              </div>
              
              {!isMobile && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: '#7a12cc',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 800
                  }}>
                    L{student.battleLevel}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export const renderArena = (props) => {
  const { 
    isMobile, findOpponent, createInviteLink, user, battlePhase, 
    battleQuestion, battleAnswer, timeLeft, battleResults, 
    liveCount, copiedLink, searchTarget, isSearching, submitAnswer,
    findQuickBattle
  } = props

  const handleAnswerClick = (answer) => {
    if (battleAnswer) return
    submitAnswer(answer)
  }

  const handleCopyLink = async () => {
    // If no current battle exists, create one first
    if (!props.currentBattle?.session_id) {
      console.log('No battle exists, creating one...')
      await props.createInviteLink()
      return
    }
    
    const sessionId = props.currentBattle?.session_id
    if (!sessionId) {
      console.error('No session ID available for battle link')
      return
    }
    
    // Use the NEW battle-exam route for real-time battles
    const link = `${window.location.origin}/battle-exam/${sessionId}`
    navigator.clipboard.writeText(link)
    props.setCopiedLink && props.setCopiedLink(true)
    setTimeout(() => props.setCopiedLink && props.setCopiedLink(false), 2000)
    console.log('Copied REAL-TIME battle link:', link)
  }

  // Menu Phase
  if (battlePhase === 'menu' || !battlePhase) {
    return (
      <motion.div
        key="arena"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '60px 40px' }}
      >
        <div style={{
          width: isMobile ? 100 : 120,
          height: isMobile ? 100 : 120,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px'
        }}>
          <Trophy size={isMobile ? 50 : 60} color="white" />
        </div>
        
        <h1 style={{ fontSize: isMobile ? 32 : 40, fontWeight: 800, color: '#111', margin: '0 0 16px' }}>
          Battle Arena
        </h1>
        <p style={{ fontSize: isMobile ? 16 : 18, color: '#64748b', margin: '0 0 48px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
          Challenge live students to epic knowledge duels. Test your speed, accuracy, and mastery!
        </p>
        
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, width: '100%', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
          <button
            onClick={findQuickBattle}
            style={{
              flex: 1,
              height: 60,
              borderRadius: 16,
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transition: 'all 0.2s'
            }}
          >
            <Zap size={20} />
            Quick Battle
          </button>
          
          <button
            onClick={findOpponent}
            disabled={isSearching}
            style={{
              flex: 1,
              height: 60,
              borderRadius: 16,
              background: isSearching ? '#94a3b8' : '#22c55e',
              color: 'white',
              border: 'none',
              fontSize: 16,
              fontWeight: 800,
              cursor: isSearching ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transition: 'all 0.2s'
            }}
          >
            {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Users size={20} />}
            {isSearching ? 'Searching...' : 'Find Match'}
          </button>
          
          <button
            onClick={createInviteLink}
            style={{
              height: 60,
              borderRadius: 16,
              background: 'white',
              color: '#7a12cc',
              border: '2px solid #7a12cc',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Users size={18} />
            Invite
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 32,
          fontSize: 14,
          color: '#64748b',
          justifyContent: 'center'
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 10px #22c55e'
          }} className="animate-pulse" />
          <span>{liveCount || 1} Scholars Online</span>
        </div>
      </motion.div>
    )
  }

  // Searching Phase
  if (battlePhase === 'searching') {
    return (
      <motion.div
        key="arena-searching"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '60px 40px' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: '#7a12cc20',
            border: '4px solid #7a12cc',
            borderTopColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px'
          }}
        >
          <Search size={40} color="#7a12cc" />
        </motion.div>
        
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: '0 0 12px' }}>
          Finding Opponent...
        </h2>
        <p style={{ fontSize: 16, color: '#64748b', margin: 0 }}>
          Scanning for available scholars
        </p>
      </motion.div>
    )
  }

  // Opponent Found Phase
  if (battlePhase === 'found') {
    return (
      <motion.div
        key="arena-found"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '60px 40px' }}
      >
        <div style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: '#22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Users size={50} color="white" />
        </div>
        
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
          Opponent Found!
        </h2>
        <p style={{ fontSize: 18, color: '#64748b', margin: '0 0 8px' }}>
          {searchTarget}
        </p>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
          Starting battle...
        </p>
      </motion.div>
    )
  }

  // Waiting Phase
  if (battlePhase === 'waiting') {
    return (
      <motion.div
        key="arena-waiting"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '60px 40px' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#7a12cc20',
            border: '3px dashed #7a12cc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}
        >
          <Users size={40} color="#7a12cc" />
        </motion.div>
        
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
          Waiting for Opponent...
        </h2>
        <p style={{ fontSize: 16, color: '#64748b', margin: '0 0 24px' }}>
          Share the battle link to invite friends
        </p>
        
        <button
          onClick={handleCopyLink}
          style={{
            padding: '12px 24px',
            background: '#7a12cc',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {copiedLink ? <CheckCircle2 size={16} /> : <Copy size={16} />}
          {copiedLink ? 'Link Copied!' : 'Copy Battle Link'}
        </button>
      </motion.div>
    )
  }

  // Question Phase
  if (battlePhase === 'question') {
    return (
      <motion.div
        key="arena-question"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ padding: isMobile ? '20px' : '40px' }}
      >
        {/* Timer */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 32
        }}>
          <div style={{
            width: isMobile ? 60 : 80,
            height: isMobile ? 60 : 80,
            borderRadius: '50%',
            background: timeLeft > 5 ? '#22c55e' : '#ef4444',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? 20 : 24,
            fontWeight: 800
          }}>
            {timeLeft}
          </div>
        </div>

        {/* Question */}
        <div style={{
          background: '#f8fafc',
          padding: isMobile ? '24px' : '32px',
          borderRadius: 20,
          marginBottom: 32,
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: '#111', margin: '0 0 24px' }}>
            {battleQuestion?.question_text}
          </h3>
          
          {battleQuestion?.question_type === 'multiple' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              {battleQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(option)}
                  disabled={battleAnswer !== ''}
                  style={{
                    padding: '20px',
                    background: battleAnswer === option ? '#7a12cc' : 'white',
                    color: battleAnswer === option ? 'white' : '#111',
                    border: '2px solid #e5e7eb',
                    borderRadius: 16,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: battleAnswer ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    opacity: battleAnswer && battleAnswer !== option ? 0.6 : 1
                  }}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Answer Phase
  if (battlePhase === 'answer') {
    return (
      <motion.div
        key="arena-answer"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '60px 40px' }}
      >
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: battleAnswer === battleQuestion?.correct_answer ? '#22c55e' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px'
        }}>
          {battleAnswer === battleQuestion?.correct_answer ? (
            <CheckCircle2 size={60} color="white" />
          ) : (
            <X size={60} color="white" />
          )}
        </div>
        
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111', margin: '0 0 12px' }}>
          {battleAnswer === battleQuestion?.correct_answer ? 'Correct!' : 'Wrong!'}
        </h2>
        <p style={{ fontSize: 18, color: '#64748b', margin: '0 0 8px' }}>
          Correct answer: {battleQuestion?.correct_answer}
        </p>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
          Next question starting...
        </p>
      </motion.div>
    )
  }

  // Result Phase
  if (battlePhase === 'result') {
    return (
      <motion.div
        key="arena-result"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '60px 40px' }}
      >
        <Trophy size={100} color="#7a12cc" style={{ marginBottom: 32 }} />
        
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111', margin: '0 0 16px' }}>
          Battle Complete!
        </h2>
        
        <div style={{ display: 'flex', gap: 32, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#7a12cc' }}>
              {battleResults.filter(r => r.is_correct).length}
            </div>
            <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase' }}>Correct</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#111' }}>
              {battleResults.reduce((sum, r) => sum + r.points_earned, 0)}
            </div>
            <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase' }}>Points</div>
          </div>
        </div>
        
        <button
          onClick={() => props.setBattlePhase('menu')}
          style={{
            padding: '16px 32px',
            background: '#7a12cc',
            color: 'white',
            border: 'none',
            borderRadius: 16,
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Back to Arena
        </button>
      </motion.div>
    )
  }

  return null
}

export const renderTournaments = (props) => {
  const { tournaments, loading, isMobile, joinTournament, user } = props
  
  return (
    <motion.div
      key="tournaments"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: 0 }}>
          Tournaments
        </h2>
        <button
          style={{
            padding: '12px 20px',
            background: '#7a12cc',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Trophy size={16} />
          Create Tournament
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Loader2 className="animate-spin" color="#7a12cc" size={32} />
        </div>
      ) : tournaments.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
          {tournaments.map((tournament) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              style={{
                background: 'white',
                borderRadius: 20,
                border: '1.5px solid #e5e7eb',
                overflow: 'hidden',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                height: 120,
                background: `linear-gradient(135deg, ${tournament.status === 'registration' ? '#7a12cc' : tournament.status === 'active' ? '#22c55e' : '#64748b'}, ${tournament.status === 'registration' ? '#9718fb' : tournament.status === 'active' ? '#34d399' : '#94a3b8'})`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trophy size={48} color="white" opacity={0.3} />
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'white',
                  textTransform: 'uppercase'
                }}>
                  {tournament.status}
                </div>
              </div>
              
              <div style={{ padding: '20px' }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#111',
                  margin: '0 0 8px'
                }}>
                  {tournament.name}
                </h3>
                
                <p style={{
                  fontSize: 12,
                  color: '#64748b',
                  margin: '0 0 16px',
                  lineHeight: 1.5
                }}>
                  {tournament.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={14} color="#7a12cc" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
                      {tournament.current_participants}/{tournament.max_participants}
                    </span>
                  </div>
                  
                  {tournament.prize_pool > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Zap size={14} color="#f59e0b" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                        {tournament.prize_pool} XP
                      </span>
                    </div>
                  )}
                </div>
                
                {tournament.start_time && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 16,
                    fontSize: 11,
                    color: '#64748b'
                  }}>
                    <Calendar size={12} />
                    {new Date(tournament.start_time).toLocaleDateString()} at {new Date(tournament.start_time).toLocaleTimeString()}
                  </div>
                )}
                
                <button
                  onClick={() => joinTournament(tournament.id)}
                  disabled={tournament.status !== 'registration' || tournament.current_participants >= tournament.max_participants}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: tournament.status === 'registration' && tournament.current_participants < tournament.max_participants ? '#7a12cc' : '#e5e7eb',
                    color: tournament.status === 'registration' && tournament.current_participants < tournament.max_participants ? 'white' : '#94a3b8',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: tournament.status === 'registration' && tournament.current_participants < tournament.max_participants ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                >
                  {tournament.status === 'registration' ? (
                    tournament.current_participants >= tournament.max_participants ? 'FULL' : 'JOIN TOURNAMENT'
                  ) : tournament.status === 'active' ? 'IN PROGRESS' : 'COMPLETED'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 24,
          border: '1.5px solid #e5e7eb',
          padding: '60px 40px',
          textAlign: 'center'
        }}>
          <Trophy size={64} color="#e5e7eb" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
            No Active Tournaments
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
            Be the first to create a tournament and invite others to compete!
          </p>
          <button
            style={{
              padding: '12px 24px',
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Create Tournament
          </button>
        </div>
      )}
    </motion.div>
  )
}

export const renderTeams = (props) => {
  const { myTeams, isMobile, createTeam, joinTeam, user } = props
  
  return (
    <motion.div
      key="teams"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: 0 }}>
          Teams
        </h2>
        <button
          style={{
            padding: '12px 20px',
            background: '#7a12cc',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Users size={16} />
          Create Team
        </button>
      </div>

      {myTeams.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {myTeams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              style={{
                background: 'white',
                borderRadius: 20,
                border: '1.5px solid #e5e7eb',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, #7a12cc, #9718fb)'
              }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: '#7a12cc',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 800
                }}>
                  {team.tag}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>
                    {team.name}
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                    Level {team.team_level} • {team.wins}W / {team.losses}L
                  </p>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color="#7a12cc" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
                    {team.current_members}/{team.max_members}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={14} color="#f59e0b" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                    {team.team_xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: 8
              }}>
                <button
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#f5eeff',
                    color: '#7a12cc',
                    border: '1px solid #7a12cc',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View Team
                </button>
                <button
                  style={{
                    padding: '10px 16px',
                    background: '#7a12cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Team Battle
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 24,
          border: '1.5px solid #e5e7eb',
          padding: '60px 40px',
          textAlign: 'center'
        }}>
          <Users size={64} color="#e5e7eb" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
            No Teams Yet
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
            Create a team or join an existing one to compete in team battles!
          </p>
          <button
            style={{
              padding: '12px 24px',
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Create Team
          </button>
        </div>
      )}
    </motion.div>
  )
}

export const renderBattleModal = (props) => {
  const {
    showBattleModal, currentBattle, spectatorMode, soundEnabled,
    setSoundEnabled, battlePhase, battleQuestion, battleAnswer,
    timeLeft, battleResults, battleChat, chatInput, setChatInput,
    sendBattleChat, setShowBattleModal, isMobile, copiedLink
  } = props

  return (
    <AnimatePresence>
      {showBattleModal && currentBattle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '16px' : '40px'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            style={{
              width: '100%',
              maxWidth: spectatorMode ? 1200 : 800,
              height: isMobile ? '100vh' : '90vh',
              background: 'white',
              borderRadius: isMobile ? 0 : 24,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Battle Header */}
            <div style={{
              background: 'linear-gradient(135deg, #7a12cc 0%, #9718fb 100%)',
              color: 'white',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Trophy size={24} />
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                    {spectatorMode ? 'Spectating' : 'Battle Arena'}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
                    {currentBattle.battle_type} • Question {currentBattle.current_question + 1}/{currentBattle.question_count}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {soundEnabled && (
                  <button onClick={() => setSoundEnabled(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <Volume2 size={20} />
                  </button>
                )}
                <button onClick={() => setShowBattleModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Battle Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
              {/* Main Battle Area */}
              <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                {battlePhase === 'waiting' && renderWaitingPhase(props)}
                {battlePhase === 'question' && renderQuestionPhase(props)}
                {battlePhase === 'answer' && renderAnswerPhase(props)}
                {battlePhase === 'result' && renderResultPhase(props)}
              </div>

              {/* Chat Sidebar (Desktop) */}
              {!isMobile && (
                <div style={{
                  width: 300,
                  borderLeft: '1px solid #e5e7eb',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #e5e7eb',
                    background: '#f8fafc'
                  }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MessageSquare size={16} />
                      Battle Chat
                    </h3>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {battleChat.map(msg => (
                      <div key={msg.id} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                        <div style={{ fontSize: 13, color: '#111' }}>
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && sendBattleChat(chatInput)}
                        placeholder="Type message..."
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          fontSize: 13
                        }}
                      />
                      <button
                        onClick={() => sendBattleChat(chatInput)}
                        style={{
                          padding: '8px 12px',
                          background: '#7a12cc',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer'
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const renderWaitingPhase = (props) => {
  const { currentBattle, copiedLink } = props
  
  const handleCopyLink = () => {
    // Use the NEW battle-exam route for real-time battles
    const link = `${window.location.origin}/battle-exam/${currentBattle.session_id}`
    navigator.clipboard.writeText(link)
    props.setCopiedLink && props.setCopiedLink(true)
    setTimeout(() => props.setCopiedLink && props.setCopiedLink(false), 2000)
  }
  
  return (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#7a12cc20',
          border: '3px dashed #7a12cc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24
        }}
      >
        <Users size={40} color="#7a12cc" />
      </motion.div>
      
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
        Waiting for Opponent...
      </h2>
      <p style={{ fontSize: 16, color: '#64748b', margin: '0 0 24px' }}>
        Share the REAL-TIME battle link to invite friends
      </p>
      
      {/* Participant List */}
      {currentBattle?.participants && currentBattle.participants.length > 0 && (
        <div style={{ marginBottom: 24, textAlign: 'left', width: '100%', maxWidth: 300 }}>
          <h4 style={{ fontSize: 11, fontWeight: 800, color: '#111', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
            Joined Players ({currentBattle.participants.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentBattle.participants.map((participant, index) => (
              <div key={participant.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: 12,
                border: participant.isCurrentPlayer ? '1.5px solid #7a12cc' : '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: '50%', background: '#7a12cc', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800
                  }}>
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                    {participant.name} {participant.isCurrentPlayer && '(You)'}
                  </span>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={handleCopyLink}
        style={{
          padding: '12px 24px',
          background: '#7a12cc',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        {copiedLink ? <CheckCircle2 size={16} /> : <Copy size={16} />}
        {copiedLink ? 'Link Copied!' : 'Share Real-Time Battle'}
      </button>
    </div>
  )
}

const renderQuestionPhase = (props) => {
  const { timeLeft, battleQuestion, battleAnswer, submitAnswer } = props
  
  const handleAnswerClick = (answer) => {
    // Prevent multiple submissions
    if (battleAnswer) return
    submitAnswer(answer)
  }
  
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Timer */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 24
      }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: timeLeft > 5 ? '#22c55e' : '#ef4444',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 800
        }}>
          {timeLeft}
        </div>
      </div>

      {/* Question */}
      <div style={{
        background: '#f8fafc',
        padding: '24px',
        borderRadius: 16,
        marginBottom: 24
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 16px' }}>
          {battleQuestion?.question_text}
        </h3>
        
        {battleQuestion?.question_type === 'multiple' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {battleQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(option)}
                disabled={battleAnswer !== ''}
                style={{
                  padding: '16px',
                  background: battleAnswer === option ? '#7a12cc' : 'white',
                  color: battleAnswer === option ? 'white' : '#111',
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: battleAnswer ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  opacity: battleAnswer && battleAnswer !== option ? 0.6 : 1
                }}
              >
                {String.fromCharCode(65 + index)}. {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const renderAnswerPhase = (props) => {
  const { battleQuestion, battleAnswer } = props
  
  return (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: battleAnswer === battleQuestion?.correct_answer ? '#22c55e' : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24
      }}>
        {battleAnswer === battleQuestion?.correct_answer ? (
          <CheckCircle2 size={50} color="white" />
        ) : (
          <X size={50} color="white" />
        )}
      </div>
      
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
        {battleAnswer === battleQuestion?.correct_answer ? 'Correct!' : 'Wrong!'}
      </h2>
      <p style={{ fontSize: 16, color: '#64748b', margin: '0 0 8px' }}>
        Correct answer: {battleQuestion?.correct_answer}
      </p>
      <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
        Next question starting...
      </p>
    </div>
  )
}

const renderResultPhase = (props) => {
  const { battleResults, setShowBattleModal } = props
  
  return (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Trophy size={80} color="#7a12cc" style={{ marginBottom: 24 }} />
      
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
        Battle Complete!
      </h2>
      
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#7a12cc' }}>
            {battleResults.filter(r => r.is_correct).length}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Correct</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#111' }}>
            {battleResults.reduce((sum, r) => sum + r.points_earned, 0)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Points</div>
        </div>
      </div>
      
      <button
        onClick={() => setShowBattleModal(false)}
        style={{
          padding: '16px 32px',
          background: '#7a12cc',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        Back to Arena
      </button>
    </div>
  )
}

export const renderAchievements = (props) => {
  const { achievements, isMobile } = props
  
  const categories = ['battle', 'tournament', 'streak', 'social', 'special']
  const categoryIcons = {
    battle: Sword,
    tournament: Trophy,
    streak: Flame,
    social: Users,
    special: Star
  }
  
  return (
    <motion.div
      key="achievements"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 24px' }}>
        Achievements
      </h2>

      {categories.map((category) => {
        const categoryAchievements = achievements.filter(a => a.achievements.category === category)
        const Icon = categoryIcons[category]
        
        if (categoryAchievements.length === 0) return null
        
        return (
          <div key={category} style={{ marginBottom: 32 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#7a12cc',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={16} />
              </div>
              <h3 style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#111',
                margin: 0,
                textTransform: 'capitalize'
              }}>
                {category}
              </h3>
              <div style={{
                background: '#f5eeff',
                color: '#7a12cc',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700
              }}>
                {categoryAchievements.length}
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16
            }}>
              {categoryAchievements.map((userAchievement) => (
                <motion.div
                  key={userAchievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                  style={{
                    background: userAchievement.completed_at ? 'linear-gradient(135deg, #f5eeff, #ffffff)' : 'white',
                    borderRadius: 16,
                    border: userAchievement.completed_at ? '1.5px solid #7a12cc' : '1.5px solid #e5e7eb',
                    padding: '16px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {userAchievement.completed_at && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#22c55e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircle2 size={14} color="white" />
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: userAchievement.completed_at ? '#7a12cc' : '#e5e7eb',
                      color: userAchievement.completed_at ? 'white' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18
                    }}>
                      {userAchievement.achievements.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: '#111',
                        margin: '0 0 2px'
                      }}>
                        {userAchievement.achievements.name}
                      </h4>
                      <p style={{
                        fontSize: 11,
                        color: '#64748b',
                        margin: 0,
                        lineHeight: 1.4
                      }}>
                        {userAchievement.achievements.description}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: userAchievement.completed_at ? '#22c55e' : '#7a12cc'
                    }}>
                      {userAchievement.completed_at ? 'Completed!' : `${userAchievement.progress}/${userAchievement.achievements.requirement_value}`}
                    </div>
                    
                    {userAchievement.achievements.reward_xp > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#f59e0b'
                      }}>
                        <Zap size={10} />
                        {userAchievement.achievements.reward_xp} XP
                      </div>
                    )}
                  </div>
                  
                  {userAchievement.completed_at && !userAchievement.reward_claimed && (
                    <button
                      style={{
                        width: '100%',
                        marginTop: 12,
                        padding: '8px',
                        background: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Claim Reward
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}
      
      {achievements.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: 24,
          border: '1.5px solid #e5e7eb',
          padding: '60px 40px',
          textAlign: 'center'
        }}>
          <Award size={64} color="#e5e7eb" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
            No Achievements Yet
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Start battling and completing challenges to unlock achievements!
          </p>
        </div>
      )}
    </motion.div>
  )
}
