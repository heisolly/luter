import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiCameraLine, 
  RiFireFill, 
  RiVipCrownFill, 
  RiMedalFill, 
  RiUserAddLine, 
  RiMapPin2Fill,
  RiSettings3Fill
} from 'react-icons/ri'
import { Lightning, Coins } from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'

export default function LevelPage() {
  const { user, isMobile } = useOutletContext()
  const { bundle, refresh } = useDashboardPrefetch()
  
  const stats = bundle?.stats?.data || {}
  const profile = bundle?.profile?.data || {}
  
  const [levelInfo, setLevelInfo] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Use the synchronized stats
  const gamificationData = {
    xp: stats.total_xp || 0,
    coins: stats.coins || 0,
    level: Math.max(1, Math.floor((stats.total_xp || 0) / 100)), // simple math fallback
    streak: stats.streak_days || 0
  }

  const loadAvatar = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
      if (!error && data?.avatar_url) setAvatarUrl(data.avatar_url)
    } catch (e) { console.error('Error loading avatar:', e) }
  }

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
        setUploading(false)
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('Image size must be less than 20MB')
        setUploading(false)
        return
      }

      const fileExt = file.name.split('.').pop().toLowerCase()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      if (updateError) throw updateError

      setAvatarUrl(`${publicUrl}?v=${Date.now()}`)
      setTimeout(() => { refresh(); loadAvatar() }, 500)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      alert(`Failed to upload image: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const loadLevelInfo = async () => {
    try {
      const { data, error } = await supabase.from('levels').select('*').order('level', { ascending: true })
      if (!error) setLevelInfo(data)
    } catch (error) { console.error('Error loading level info:', error) }
  }

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`*, achievement:achievements(*)`)
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })
      if (!error) setAchievements(data || [])
    } catch (error) { console.error('Error loading achievements:', error) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (user?.id) {
      loadAvatar()
      loadLevelInfo()
      loadAchievements()
    }
  }, [user?.id])

  const triggerFileInput = () => fileInputRef.current?.click()

  const isDark = document.body.classList.contains('dark-mode')
  
  // Premium Luter Tokens
  const bgCard = isDark ? '#1F2937' : '#FFFFFF'
  const borderCard = isDark ? '#374151' : '#E5E7EB'
  const textTitle = isDark ? '#F9FAFB' : '#111827'
  const textBody = isDark ? '#9CA3AF' : '#6B7280'
  const iconBg = isDark ? '#374151' : '#F3F4F6'
  
  // Sleek neutral gradient for banner instead of vivid blue
  const bannerGradient = isDark 
    ? 'linear-gradient(135deg, #1F2937 0%, #111827 100%)' 
    : 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)'

  const joinedDate = profile.created_at ? new Date(profile.created_at).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'April 2026'
  const fullName = profile.full_name || user?.email?.split('@')[0] || 'User'
  const handle = profile.username ? `@${profile.username}` : `@${user?.email?.split('@')[0]}`

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '24px', height: '240px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: '140px', background: isDark ? '#374151' : '#E5E7EB', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: isDark ? '#4B5563' : '#D1D5DB', position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', border: `4px solid ${bgCard}`, animation: 'pulse 1.5s infinite' }} />
        </div>
        <div style={{ height: '240px', background: bgCard, border: `1px solid ${borderCard}`, borderRadius: '24px', animation: 'pulse 1.5s infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '48px 24px', display: 'flex', flexDirection: 'column', gap: '32px', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Main Profile Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Banner Card */}
        <div style={{ 
          position: 'relative', 
          background: bgCard, 
          borderRadius: '32px', 
          overflow: 'hidden', 
          border: `1px solid ${borderCard}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingBottom: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          {/* Banner */}
          <div style={{ 
            height: '160px', 
            width: '100%', 
            background: bannerGradient,
            position: 'relative',
            borderBottom: `1px solid ${borderCard}`
          }}>
            <button style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)', border: 'none', color: textTitle, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
              <RiSettings3Fill size={20} />
            </button>
          </div>
          
          {/* Avatar (overlapping) */}
          <div 
            onClick={triggerFileInput}
            style={{ 
              width: '140px', 
              height: '140px', 
              borderRadius: '50%', 
              background: avatarUrl ? '#fff' : iconBg, 
              border: `8px solid ${bgCard}`, 
              marginTop: '-70px', 
              position: 'relative', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 48, fontWeight: 800, color: '#FFF' }}>{fullName.charAt(0)}</span>
            )}
            
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s', ':hover': { opacity: 1 } }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              <RiCameraLine size={32} color="#FFF" />
            </div>

            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />

          {/* Name & Handle */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: textTitle }}>{fullName}</h1>
            <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 500, color: textBody }}>{handle}</p>
            <p style={{ margin: '12px 0 0', fontSize: '14px', fontWeight: 600, color: textBody, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <RiMapPin2Fill size={16} /> Joined {joinedDate}
            </p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: textTitle, margin: '16px 0 0 8px' }}>Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '16px' }}>
            
            <div style={{ padding: '24px', background: bgCard, borderRadius: '24px', border: `1px solid ${borderCard}`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiFireFill size={24} color={textTitle} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: textTitle, lineHeight: 1.2 }}>{gamificationData.streak}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: textBody }}>Day streak</div>
              </div>
            </div>

            <div style={{ padding: '24px', background: bgCard, borderRadius: '24px', border: `1px solid ${borderCard}`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightning size={24} weight="fill" color={textTitle} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: textTitle, lineHeight: 1.2 }}>{gamificationData.xp}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: textBody }}>Total XP</div>
              </div>
            </div>

            <div style={{ padding: '24px', background: bgCard, borderRadius: '24px', border: `1px solid ${borderCard}`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiMedalFill size={24} color={textTitle} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: textTitle, lineHeight: 1.2 }}>{achievements.length}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: textBody }}>Achievements</div>
              </div>
            </div>

          </div>
        </div>

        {/* Achievements Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginTop: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: textTitle, margin: 0 }}>Recent Badges</h2>
          </div>
          
          <div style={{ background: bgCard, borderRadius: '32px', border: `1px solid ${borderCard}`, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            {achievements.length > 0 ? (
              achievements.slice(0, 3).map((userAchievement, idx) => (
                <div key={userAchievement.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: idx !== Math.min(achievements.length, 3)-1 ? '20px' : '0', borderBottom: idx !== Math.min(achievements.length, 3)-1 ? `1px solid ${borderCard}` : 'none' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                    {userAchievement.achievement.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: textTitle }}>{userAchievement.achievement.name}</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: textBody, fontWeight: 500 }}>{userAchievement.achievement.description || 'Achievement unlocked!'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: textBody }}>
                <RiMedalFill size={48} style={{ opacity: 0.2, marginBottom: '16px', color: textTitle }} />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: textTitle }}>No achievements yet</h4>
                <p style={{ margin: '4px 0 0', fontSize: '14px' }}>Keep studying to earn your first badge!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }
`
document.head.appendChild(style)
