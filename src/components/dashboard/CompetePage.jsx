import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Users, Zap, Shield, Search, Sword, Target, 
  Crown, Star, Award, Flame, Timer, Loader2, ArrowRight,
  Copy, CheckCircle2, X
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'

export default function CompetePage() {
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('leaderboard') 
  
  // Real-time Match States
  const [isSearching, setIsSearching] = useState(false)
  const [searchTarget, setSearchTarget] = useState(null)
  const [currentMatch, setCurrentMatch] = useState(null)
  const [matchingStep, setMatchingStep] = useState(0) 
  const [liveCount, setLiveCount] = useState(0)
  const [players, setPlayers] = useState({ challenger: null, opponent: null })

  // 1. Initial Match Check (Deep Link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mId = params.get('matchId')
    if (mId && user) {
      joinInviteMatch(mId)
    }
  }, [user])

  const joinInviteMatch = async (mId) => {
    setLoading(true)
    setMatchingStep(1) // Searching...
    
    const { data: m, error } = await supabase
      .from('matches')
      .select('*, profiles:challenger_id(full_name)')
      .eq('session_id', mId)
      .maybeSingle()

    if (m) {
      if (m.status === 'active' || m.opponent_id) {
         // Already active or joined
         const { data: oppPrf } = await supabase.from('profiles').select('full_name').eq('id', m.opponent_id).single()
         setPlayers({ 
            challenger: m.profiles?.full_name || 'Challenger', 
            opponent: oppPrf?.full_name || 'Joined Player' 
         })
         setMatchingStep(4) // Battle Lobby
         setCurrentMatch(m)
      } else if (m.challenger_id === user.id) {
         // I am the challenger
         setPlayers(prev => ({ ...prev, challenger: user.user_metadata?.full_name || 'You' }))
         setCurrentMatch(m)
         setMatchingStep(3) // Waiting room
      } else {
         // Joining as opponent
         const { data: updated } = await supabase
           .from('matches')
           .update({ 
             opponent_id: user.id,
             status: 'active'
           })
           .eq('id', m.id)
           .select('*, profiles:challenger_id(full_name)')
           .single()

         if (updated) {
            setPlayers({ 
               challenger: updated.profiles?.full_name || 'Challenger', 
               opponent: user.user_metadata?.full_name || 'You' 
            })
            setMatchingStep(4) // Battle Lobby
            setCurrentMatch(updated)
         }
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    const fetchLive = async () => {
       const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString()
       const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('last_active_at', fiveMinsAgo)
       setLiveCount(count || 1)
    }
    fetchLive()
    const int = setInterval(fetchLive, 60000)
    return () => clearInterval(int)
  }, [])
  
  const [copiedLink, setCopiedLink] = useState(false)

  const mapLeaderboard = (data) =>
    data.map((row, i) => ({
      rank: i + 1,
      name: row.profiles?.full_name || 'Anonymous Scholar',
      streak: row.streak_days || 0,
      xp: row.total_xp || 0,
      uni: row.profiles?.university || 'University Student',
      level: row.profiles?.level || 'L100'
    }))

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_stats')
      .select(`
        total_xp, streak_days,
        profiles (full_name, level, university)
      `)
      .order('streak_days', { ascending: false })
      .limit(10)

    if (data) {
      setLeaderboard(mapLeaderboard(data))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    const heartbeat = setInterval(async () => {
      if (user) await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id)
    }, 30000)
    return () => clearInterval(heartbeat)
  }, [user])

  // Leaderboard: prefetched with dashboard bundle
  useEffect(() => {
    if (!user) return
    if (!ready) return
    if (bundle?.leaderboard?.data && !bundle.leaderboard.error) {
      setLeaderboard(mapLeaderboard(bundle.leaderboard.data))
      setLoading(false)
      return
    }
    fetchLeaderboard()
  }, [user, ready, bundle, fetchLeaderboard])

  // 2. Real-time Matchmaking Engine
  const findOpponent = async () => {
    setIsSearching(true)
    setMatchingStep(1)
    
    // Simulate scanning for "Live" users
    const { data: liveUsers } = await supabase
      .from('profiles')
      .select('id, full_name, level')
      .neq('id', user.id)
      .limit(5)

    // Scanning animation duration
    setTimeout(() => {
       if (liveUsers && liveUsers.length > 0) {
          const opponent = liveUsers[Math.floor(Math.random() * liveUsers.length)]
          setSearchTarget(opponent.full_name)
          setMatchingStep(2)
          setTimeout(() => {
             alert(`Duel found with ${opponent.full_name}! Linking to the Arena...`)
             setMatchingStep(0)
             setIsSearching(false)
          }, 2000)
       } else {
          setMatchingStep(3) // Waiting room
          setIsSearching(false)
       }
    }, 4000)
  }

  const createInviteLink = async () => {
    const matchId = `luter_${Math.random().toString(36).substr(2, 9)}`
    const { data } = await supabase
      .from('matches')
      .insert({ 
        challenger_id: user.id, 
        match_type: 'invite', 
        session_id: matchId,
        status: 'pending' 
      })
      .select()
      .single()

    if (data) {
      const link = `${window.location.origin}/compete?matchId=${matchId}`
       navigator.clipboard.writeText(link)
       setCopiedLink(true)
       setMatchingStep(3) 
       setCurrentMatch(data)
       setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // 3. Real-time Listener
  useEffect(() => {
     if (!currentMatch) return
     const channel = supabase
       .channel(`match_${currentMatch.id}`)
       .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${currentMatch.id}` }, 
         async (payload) => {
           if (payload.new.opponent_id && payload.new.opponent_id !== user.id) {
              // Fetch opponent name
              const { data: oppPrf } = await supabase.from('profiles').select('full_name').eq('id', payload.new.opponent_id).single()
              const { data: chalPrf } = await supabase.from('profiles').select('full_name').eq('id', payload.new.challenger_id).single()
              
              setPlayers({
                 challenger: chalPrf?.full_name || "Challenger",
                 opponent: oppPrf?.full_name || "Joined Player"
              })
              setMatchingStep(4) // Battle Lobby
           }
         }
       ).subscribe()
     return () => { supabase.removeChannel(channel) }
  }, [currentMatch, user])

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '40px', maxWidth: 1000, margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* ── Header ── */}
      <div style={{ 
        marginBottom: isMobile ? 32 : 40, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        gap: 20
      }}>
        <div style={{ maxWidth: 520 }}>
           <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(90deg, #f5eeff, #ffffff)', padding: '6px 14px', borderRadius: 99, marginBottom: 16, border: '1.5px solid #e9d5ff' }}>
              <Trophy size={14} color="#7a12cc" fill="#7a12cc" />
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7a12cc' }}>Arena v2.0</span>
           </div>
           <h1 style={{ 
             fontSize: isMobile ? 32 : 44, 
             fontWeight: 800, color: '#111', margin: '0 0 12px', 
             letterSpacing: '-0.05em', lineHeight: 1 
           }}>Study. Duel. <span style={{ color: '#7a12cc' }}>Conquer.</span></h1>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
             <p style={{ fontSize: isMobile ? 14 : 16, color: '#666', fontWeight: 500, margin: 0, lineHeight: 1.6 }}>Battle top students for XP dominance.</p>
             <div style={{ width: 1.5, height: 16, background: '#eee' }}></div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} className="animate-pulse" />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#111' }}>{liveCount} Online</span>
             </div>
           </div>
        </div>

        <div style={{ 
          display: 'flex', gap: 4, background: '#f5eeff10', padding: '5px', 
          borderRadius: 18, border: '1.5px solid #f5eeff', backdropFilter: 'blur(10px)',
          width: isMobile ? '100%' : 'auto'
        }}>
            {['leaderboard', 'arena'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: isMobile ? 1 : 'initial',
                  padding: isMobile ? '10px 14px' : '10px 28px', 
                  borderRadius: 14, fontSize: 12, fontWeight: 900,
                  background: activeTab === tab ? '#7a12cc' : 'transparent',
                  color: activeTab === tab ? 'white' : '#7a12cc99',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                {tab}
              </button>
            ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {matchingStep > 0 ? (
          <motion.div 
            key="matching"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            style={{ 
              background: 'white', borderRadius: 40, border: '1.5px solid #7a12cc', padding: isMobile ? '40px 20px' : '80px 40px',
              textAlign: 'center', boxShadow: '0 10px 40px -10px rgba(122, 18, 204, 0.2)',
              position: 'relative', overflow: 'hidden'
            }}
          >
             <button onClick={() => setMatchingStep(0)} style={{ position: 'absolute', top: 32, right: 32, background: '#f5eeff', border: 'none', padding: 8, borderRadius: 12, cursor: 'pointer', color: '#7a12cc' }}>
                <X size={20} />
             </button>

             {matchingStep === 1 && (
               <>
                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity }} style={{ display: 'inline-flex', padding: 32, borderRadius: '50%', background: '#7a12cc10', border: '2px dashed #7a12cc', marginBottom: 32 }}>
                   <Users size={48} color="#7a12cc" />
                 </motion.div>
                 <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 12px' }}>Searching...</h2>
               </>
             )}

             {matchingStep === 4 && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 <div style={{ marginBottom: 40, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 32 : 60 }}>
                    <div style={{ textAlign: 'center' }}>
                       <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#7a12cc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 800, border: '6px solid #f5eeff' }}>
                          {players.challenger?.slice(0, 1).toUpperCase()}
                       </div>
                       <div style={{ fontWeight: 800, color: '#111' }}>{players.challenger}</div>
                       <div style={{ fontSize: 11, fontWeight: 800, color: '#7a12cc', textTransform: 'uppercase', marginTop: 4 }}>Challenger</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', gap: 12 }}>
                       <div style={{ background: '#7a12cc', color: 'white', padding: '12px', borderRadius: '50%', boxShadow: '0 0 20px rgba(122, 18, 204, 0.2)' }}>
                          <Sword size={24} fill="white" />
                       </div>
                       <div style={{ fontSize: 24, fontWeight: 800, color: '#7a12cc' }}>VS</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                       <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 800, border: '6px solid #f8f8f8' }}>
                          {players.opponent?.slice(0, 1).toUpperCase()}
                       </div>
                       <div style={{ fontWeight: 800, color: '#111' }}>{players.opponent}</div>
                       <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginTop: 4 }}>Opponent</div>
                    </div>
                 </div>

                 <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: '0 0 32px' }}>Arena Ready</h2>
                 
                 <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                    <button 
                      onClick={() => alert("Connecting to battle server...")}
                      style={{ 
                        background: '#7a12cc', color: 'white', border: 'none', 
                        padding: '16px 32px', borderRadius: 16, fontSize: 16, 
                        fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px rgba(122, 18, 204, 0.3)' 
                      }}
                    >
                       START BATTLE
                    </button>
                 </div>
               </motion.div>
             )}
          </motion.div>

        ) : activeTab === 'leaderboard' ? (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ background: 'white', borderRadius: 24, border: '1.5px solid #7a12cc', overflow: 'hidden' }}>
              {!isMobile && (
                <div style={{ padding: '24px 32px', borderBottom: '1.5px solid #f5eeff', display: 'grid', gridTemplateColumns: '80px 1fr 120px 120px', fontSize: 11, fontWeight: 800, color: '#7a12cc99', textTransform: 'uppercase', background: '#fdfbff' }}>
                  <span>Rank</span><span>Scholar</span><span style={{ textAlign: 'center' }}>Streak</span><span style={{ textAlign: 'right' }}>Total XP</span>
                </div>
              )}
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}><Loader2 className="animate-spin" color="#7a12cc" /></div>
              ) : (
                leaderboard.map((student) => (
                  <div key={student.rank} style={{ 
                    padding: isMobile ? '16px' : '24px 32px', 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '48px 1fr 80px' : '80px 1fr 120px 120px', 
                    alignItems: 'center', 
                    borderBottom: '1px solid #f8f8f8' 
                  }}>
                    <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: student.rank <= 3 ? '#7a12cc' : '#111' }}>#{student.rank}</div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: '#111', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{student.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{isMobile && student.xp.toLocaleString() + ' XP'} {!isMobile && student.uni}</div>
                    </div>
                    {!isMobile && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f5eeff', color: '#7a12cc', padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 800 }}>
                          <Flame size={14} fill="#7a12cc" /> {student.streak}
                        </div>
                      </div>
                    )}
                    <div style={{ textAlign: 'right', fontSize: isMobile ? 14 : 18, fontWeight: 800, color: isMobile ? '#7a12cc' : '#111' }}>
                      {isMobile ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <Flame size={12} fill="#7a12cc" /> {student.streak}
                        </div>
                      ) : (
                        student.xp.toLocaleString() + ' XP'
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="arena" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: isMobile ? 20 : 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
               <div style={{ 
                 background: 'linear-gradient(135deg, #2D0B4F 0%, #111111 100%)', 
                 borderRadius: 30, padding: isMobile ? '40px 24px' : '56px 48px', 
                 color: 'white', border: '1.5px solid #7a12cc' 
               }}>
                  <h2 style={{ fontSize: isMobile ? 30 : 38, fontWeight: 800, margin: '0 0 16px' }}>The Arena.</h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>Match with live students for a 120s speed duel.</p>
                  <button onClick={findOpponent} style={{ width: '100%', height: 60, borderRadius: 18, background: '#7a12cc', color: 'white', border: 'none', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>
                    ENTER BATTLE ARENA
                  </button>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div onClick={createInviteLink} style={{ background: 'white', padding: isMobile ? '24px 16px' : '32px 24px', borderRadius: 24, border: '1.5px solid #eee', textAlign: 'center', cursor: 'pointer' }}>
                     <Users size={24} color="#7a12cc" style={{ marginBottom: 12 }} />
                     <h4 style={{ fontWeight: 900, fontSize: 13 }}>Challenge Friend</h4>
                  </div>
                  <div style={{ background: 'white', padding: isMobile ? '24px 16px' : '32px 24px', borderRadius: 24, border: '1.5px solid #eee', textAlign: 'center', opacity: 0.5 }}>
                     <Shield size={24} style={{ marginBottom: 12 }} />
                     <h4 style={{ fontWeight: 900, fontSize: 13 }}>Professor Mode</h4>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
