import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiArrowLeftSLine as ChevronLeft, RiArrowRightSLine as ChevronRight, RiTrophyLine, RiFireLine, RiTimeLine, RiBook2Line, RiMedalLine } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import Header from '../shared/Header'

export default function LevelPage() {
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  
  const [gamificationData, setGamificationData] = useState(null)
  const [levelInfo, setLevelInfo] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!user) return
    loadGamificationData()
    loadLevelInfo()
    loadAchievements()
  }, [user])

  const loadGamificationData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading gamification data:', error)
        return
      }
      
      // If no data exists, create initial record
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('user_gamification')
          .insert({
            user_id: user.id,
            level: 1,
            xp: 0,
            coins: 0,
            total_study_time_minutes: 0,
            sessions_completed: 0,
            questions_answered: 0,
            materials_studied: 0
          })
          .select()
          .single()
        
        if (!insertError) setGamificationData(newData)
      } else {
        setGamificationData(data)
      }
    } catch (error) {
      console.error('Error loading gamification data:', error)
    }
  }

  const loadLevelInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('level', { ascending: true })
      
      if (!error) setLevelInfo(data)
    } catch (error) {
      console.error('Error loading level info:', error)
    }
  }

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })
      
      if (!error) setAchievements(data || [])
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLevelInfo = () => {
    if (!levelInfo || !gamificationData) return null
    return levelInfo.find(level => level.level === gamificationData.level) || levelInfo[0]
  }

  const getNextLevelInfo = () => {
    if (!levelInfo || !gamificationData) return null
    return levelInfo.find(level => level.level === gamificationData.level + 1)
  }

  const getProgressPercentage = () => {
    if (!gamificationData || !getCurrentLevelInfo() || !getNextLevelInfo()) return 0
    const current = gamificationData.xp - getCurrentLevelInfo().min_xp
    const total = getNextLevelInfo().max_xp - getCurrentLevelInfo().min_xp
    return Math.min(100, Math.max(0, (current / total) * 100))
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        fontFamily: "'Varela Round', sans-serif"
      }}>
        <div>Loading profile...</div>
      </div>
    )
  }

  const currentLevel = getCurrentLevelInfo()
  const nextLevel = getNextLevelInfo()

  return (
    <div className="dh-root" style={{ 
      padding: isMobile ? '24px 16px 80px' : '48px 40px', 
      maxWidth: 1200, 
      margin: '0 auto', 
      fontFamily: "'Varela Round', 'Inter', sans-serif",
      boxSizing: 'border-box',
      color: '#333'
    }}>
      <Header 
        showSearch={false}
        pageTitle="Level & Profile"
        showCreateButton={true}
        createButtonPath="/dashboard/upload"
      />
      
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 40,
          padding: '0 8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Avatar */}
          <div style={{
            width: isMobile ? 80 : 100,
            height: isMobile ? 80 : 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? 32 : 40,
            fontWeight: 700,
            color: 'white'
          }}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          {/* User Info */}
          <div>
            <h1 style={{ 
              fontSize: isMobile ? 28 : 36, 
              fontWeight: 800, 
              color: '#111', 
              margin: 0,
              lineHeight: 1.2
            }}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </h1>
            <p style={{ 
              fontSize: isMobile ? 16 : 18, 
              color: '#64748b', 
              margin: '4px 0 0',
              fontWeight: 500
            }}>
              Level {gamificationData?.level || 1} • {currentLevel?.name || 'Novice Learner'}
            </p>
          </div>
        </div>

        {/* Level Badge */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg width={isMobile ? 60 : 80} height={isMobile ? 72 : 96} viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M14.9936 0.677492C12.8268 2.26076 10.5479 3.66886 8.91217 4.43512C6.50413 5.56309 3.60975 6.40891 0.959029 6.7591C0.611852 6.80501 0.250714 6.85849 0.156549 6.87803C-0.0147001 6.91354 -0.0147001 6.91354 0.0147078 13.244C0.0352042 17.6458 0.0712958 19.7555 0.133305 20.1688C0.552591 22.9655 1.39413 25.5485 2.58983 27.7088C5.16674 32.3646 9.24196 35.8051 14.2339 37.5394C15.7725 38.0739 15.8923 38.0894 16.6963 37.8587C20.044 36.8981 23.2063 35.0219 25.7263 32.501C29.0455 29.1808 31.0489 25.1043 31.787 20.1688C31.8487 19.7565 31.885 17.6353 31.9054 13.244C31.9348 6.91354 31.9348 6.91354 31.7635 6.87803C31.6694 6.85849 31.3082 6.80501 30.9611 6.7591C29.0555 6.50734 26.6524 5.90354 24.9136 5.23957C22.3382 4.25616 19.8307 2.81575 16.784 0.569628C16.359 0.256362 15.9909 0 15.9661 0C15.9412 0 15.5036 0.304871 14.9936 0.677492Z" fill={currentLevel?.badge_color || '#6745AE'}></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M15.1711 4.04622C13.3964 5.33183 11.5298 6.47521 10.1901 7.09741C8.21782 8.01332 5.84718 8.70013 3.67612 8.98448C3.39176 9.02176 3.09597 9.06519 3.01885 9.08105C2.87858 9.10989 2.87858 9.10989 2.90267 14.2502C2.91946 17.8245 2.94902 19.5376 2.99981 19.8731C3.34322 22.1441 4.03249 24.2415 5.01182 25.9957C7.12243 29.7761 10.4602 32.5698 14.5489 33.9781C15.809 34.4121 15.9072 34.4247 16.5657 34.2374C19.3076 33.4574 21.8977 31.9339 23.9617 29.8869C26.6803 27.1909 28.3212 23.8808 28.9257 19.8731C28.9762 19.5384 29.0059 17.816 29.0226 14.2502C29.0467 9.10989 29.0467 9.10989 28.9065 9.08105C28.8293 9.06519 28.5336 9.02176 28.2492 8.98448C26.6884 8.78005 24.7202 8.28977 23.2961 7.75062C21.1867 6.9521 19.1329 5.78248 16.6375 3.95863C16.2894 3.70426 15.988 3.49609 15.9676 3.49609C15.9472 3.49609 15.5888 3.74365 15.1711 4.04622Z" fill="#976EEE"></path>
              <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontWeight="700" fill="#fff" fontSize="1.1em">LV</text>
            </svg>
            <div style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              background: currentLevel?.badge_color || '#6745AE',
              color: 'white',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: isMobile ? 14 : 16,
              fontWeight: 700
            }}>
              {gamificationData?.level || 1}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Level Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ 
          background: 'white', 
          borderRadius: 20, 
          padding: isMobile ? '24px' : '32px', 
          border: '2px solid #f1f5f9', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          marginBottom: 32
        }}
      >
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px 0', color: '#111' }}>
          Level Progress
        </h3>
        
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
              Level {gamificationData?.level || 1} - {currentLevel?.name || 'Novice Learner'}
            </span>
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
              {nextLevel ? `Level ${nextLevel.level} - ${nextLevel.name}` : 'Max Level'}
            </span>
          </div>
          
          <div style={{
            height: 12,
            background: '#f1f5f9',
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 8
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${currentLevel?.badge_color || '#6745AE'}, ${nextLevel?.badge_color || '#976EEE'})`,
                borderRadius: 6
              }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              {gamificationData?.xp || 0} XP
            </span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              {nextLevel ? `${nextLevel.max_xp} XP` : 'Max Level'}
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: 16
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#111', marginBottom: 4 }}>
              {gamificationData?.xp || 0}
            </div>
            <div style={{ fontSize: 14, color: '#64748b' }}>Total XP</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>
              {gamificationData?.coins || 0}
            </div>
            <div style={{ fontSize: 14, color: '#64748b' }}>Coins</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
          gap: 20, 
          marginBottom: 32 
        }}
      >
        <div style={{ 
          background: 'white', 
          borderRadius: 20, 
          padding: isMobile ? '20px' : '28px', 
          border: '2px solid #f1f5f9', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            <RiFireLine color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, marginBottom: 4, color: '#111' }}>
              {gamificationData?.sessions_completed || 0}
            </div>
            <div style={{ fontSize: 15, color: '#64748b' }}>Sessions Completed</div>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          borderRadius: 20, 
          padding: isMobile ? '20px' : '28px', 
          border: '2px solid #f1f5f9', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            <RiTimeLine color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, marginBottom: 4, color: '#111' }}>
              {formatTime(gamificationData?.total_study_time_minutes || 0)}
            </div>
            <div style={{ fontSize: 15, color: '#64748b' }}>Study Time</div>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          borderRadius: 20, 
          padding: isMobile ? '20px' : '28px', 
          border: '2px solid #f1f5f9', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#fce7f3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            <RiBook2Line color="#ec4899" />
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, marginBottom: 4, color: '#111' }}>
              {gamificationData?.materials_studied || 0}
            </div>
            <div style={{ fontSize: 15, color: '#64748b' }}>Materials Studied</div>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          borderRadius: 20, 
          padding: isMobile ? '20px' : '28px', 
          border: '2px solid #f1f5f9', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#d1fae5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            <RiMedalLine color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, marginBottom: 4, color: '#111' }}>
              {achievements.length}
            </div>
            <div style={{ fontSize: 15, color: '#64748b' }}>Achievements</div>
          </div>
        </div>
      </motion.div>

      {/* Recent Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ 
          background: 'white', 
          borderRadius: 20, 
          padding: isMobile ? '24px' : '32px', 
          border: '2px solid #f1f5f9', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}
      >
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px 0', color: '#111' }}>
          Recent Achievements
        </h3>
        
        {achievements.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16
          }}>
            {achievements.slice(0, 6).map((userAchievement) => (
              <div key={userAchievement.id} style={{
                background: '#f8fafc',
                borderRadius: 12,
                padding: 16,
                textAlign: 'center',
                border: `2px solid ${userAchievement.achievement.badge_color}20`
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  {userAchievement.achievement.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>
                  {userAchievement.achievement.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {new Date(userAchievement.unlocked_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <RiTrophyLine size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <div>No achievements yet. Keep studying to unlock your first achievement!</div>
          </div>
        )}
      </motion.div>

    </div>
  )
}
