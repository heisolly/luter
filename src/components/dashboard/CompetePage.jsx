import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Users, Zap, Shield, Search, Sword, Target, 
  Crown, Star, Award, Flame, Timer, Loader2, ArrowRight,
  Copy, CheckCircle2, X
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function CompetePage({ user, setActivePage }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('leaderboard') 
  
  // Real-time Match States
  const [isSearching, setIsSearching] = useState(false)
  const [searchTarget, setSearchTarget] = useState(null)
  const [currentMatch, setCurrentMatch] = useState(null)
  const [matchingStep, setMatchingStep] = useState(0) 
  const [liveCount, setLiveCount] = useState(0)

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
         setSearchTarget(m.profiles?.full_name || 'Opponent')
         setMatchingStep(2)
         setCurrentMatch(m)
      } else if (m.challenger_id === user.id) {
         // I am the challenger
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
            setSearchTarget(updated.profiles?.full_name || 'Opponent')
            setMatchingStep(2)
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

  // 1. Fetch Leaderboard (Real Data)
  useEffect(() => {
    fetchLeaderboard()
    // Update last_active heartbeat
    const heartbeat = setInterval(async () => {
       if (user) await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id)
    }, 30000)
    return () => clearInterval(heartbeat)
  }, [user])

  const fetchLeaderboard = async () => {
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
      setLeaderboard(data.map((row, i) => ({
        rank: i + 1,
        name: row.profiles?.full_name || 'Anonymous Scholar',
        streak: row.streak_days || 0,
        xp: row.total_xp || 0,
        uni: row.profiles?.university || 'University Student',
        level: row.profiles?.level || 'L100'
      })))
    }
    setLoading(false)
  }

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
              setSearchTarget(oppPrf?.full_name || "New Opponent")
              setMatchingStep(2) 
              setTimeout(() => {
                 setMatchingStep(0)
                 alert(`The battle with ${oppPrf?.full_name} is starting!`)
              }, 2500)
           }
         }
       ).subscribe()
     return () => { supabase.removeChannel(channel) }
  }, [currentMatch, user])

  return (
    <div style={{ padding: '40px', maxWidth: 1000, margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* ── Header ── */}
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ maxWidth: 520 }}>
           <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(90deg, #f5eeff, #ffffff)', padding: '6px 14px', borderRadius: 99, marginBottom: 16, border: '1.5px solid #e9d5ff' }}>
              <Trophy size={14} color="#7a12cc" fill="#7a12cc" />
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7a12cc' }}>Arena v2.0</span>
           </div>
           <h1 style={{ fontSize: 44, fontWeight: 1000, color: '#111', margin: '0 0 12px', letterSpacing: '-0.05em', lineHeight: 1 }}>Study. Duel. <span style={{ color: '#7a12cc' }}>Conquer.</span></h1>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
             <p style={{ fontSize: 16, color: '#666', fontWeight: 500, margin: 0, lineHeight: 1.6 }}>Battle top students for XP dominance.</p>
             <div style={{ width: 1.5, height: 16, background: '#eee' }}></div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} className="animate-pulse" />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#111' }}>{liveCount} Online</span>
             </div>
           </div>
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#f5eeff50', padding: '6px', borderRadius: 20, border: '1.5px solid #f5eeff', backdropFilter: 'blur(10px)' }}>
            {['leaderboard', 'arena'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 28px', borderRadius: 14, fontSize: 13, fontWeight: 900,
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
              background: 'white', borderRadius: 40, border: '1.5px solid #7a12cc', padding: '80px 40px',
              textAlign: 'center', boxShadow: '20px 20px 0px rgba(122, 18, 204, 0.05)',
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
                 <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: '0 0 12px' }}>Searching...</h2>
               </>
             )}

             {matchingStep === 2 && (
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                 <div style={{ display: 'inline-flex', padding: 24, borderRadius: '50%', background: '#7a12cc', color: 'white', marginBottom: 32 }}>
                   <Sword size={48} fill="white" />
                 </div>
                 <h2 style={{ fontSize: 32, fontWeight: 1000, color: '#111', margin: '0 0 12px' }}>Match Found!</h2>
                 <div style={{ fontSize: 20, fontWeight: 800, color: '#7a12cc' }}>VS {searchTarget}</div>
               </motion.div>
             )}

             {matchingStep === 3 && (
               <>
                 <div style={{ display: 'inline-flex', padding: 32, borderRadius: '50%', background: '#fdfbff', border: '2.5px solid #7a12cc', marginBottom: 32 }}>
                    <Loader2 className="animate-spin" size={48} color="#7a12cc" />
                 </div>
                 <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: '0 0 12px' }}>Waiting for Opponent...</h2>
                 <button onClick={createInviteLink} style={{ background: '#7a12cc', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 16, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
                    <Copy size={16} style={{ marginRight: 8 }} /> {copiedLink ? 'COPIED' : 'COPY CHALLENGE LINK'}
                 </button>
               </>
             )}
          </motion.div>
        ) : activeTab === 'leaderboard' ? (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ background: 'white', borderRadius: 32, border: '1.5px solid #7a12cc', overflow: 'hidden' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1.5px solid #f5eeff', display: 'grid', gridTemplateColumns: '80px 1fr 120px 120px', fontSize: 11, fontWeight: 900, color: '#7a12cc99', textTransform: 'uppercase', background: '#fdfbff' }}>
                <span>Rank</span><span>Scholar</span><span style={{ textAlign: 'center' }}>Streak</span><span style={{ textAlign: 'right' }}>Total XP</span>
              </div>
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}><Loader2 className="animate-spin" color="#7a12cc" /></div>
              ) : (
                leaderboard.map((student) => (
                  <div key={student.rank} style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '80px 1fr 120px 120px', alignItems: 'center', borderBottom: '1px solid #f8f8f8' }}>
                    <div style={{ fontSize: 22, fontWeight: 1000, color: student.rank <= 3 ? '#7a12cc' : '#111' }}>#{student.rank}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{student.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{student.uni}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f5eeff', color: '#7a12cc', padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 900 }}>
                        <Flame size={14} fill="#7a12cc" /> {student.streak}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 18, fontWeight: 1000 }}>{student.xp.toLocaleString()} XP</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="arena" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
               <div style={{ background: 'linear-gradient(135deg, #2D0B4F 0%, #111111 100%)', borderRadius: 36, padding: '56px 48px', color: 'white', border: '1.5px solid #7a12cc' }}>
                  <h2 style={{ fontSize: 38, fontWeight: 1000, margin: '0 0 16px' }}>The Arena.</h2>
                  <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 40 }}>Match with live students for a 120s speed duel.</p>
                  <button onClick={findOpponent} style={{ width: '100%', height: 68, borderRadius: 22, background: '#7a12cc', color: 'white', border: 'none', fontSize: 17, fontWeight: 900, cursor: 'pointer' }}>
                    ENTER BATTLE ARENA
                  </button>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div onClick={createInviteLink} style={{ background: 'white', padding: '32px 24px', borderRadius: 28, border: '1.5px solid #eee', textAlign: 'center', cursor: 'pointer' }}>
                     <Users size={28} color="#7a12cc" style={{ marginBottom: 16 }} />
                     <h4 style={{ fontWeight: 900 }}>Challenge Friend</h4>
                  </div>
                  <div style={{ background: 'white', padding: '32px 24px', borderRadius: 28, border: '1.5px solid #eee', textAlign: 'center', opacity: 0.5 }}>
                     <Shield size={28} style={{ marginBottom: 16 }} />
                     <h4 style={{ fontWeight: 900 }}>Professor Mode</h4>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
