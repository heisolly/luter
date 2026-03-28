import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Bell, CreditCard, Shield, LogOut, 
  Trash2, ChevronRight, Save, Loader2,
  CheckCircle2, Sparkles
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useNavigate } from 'react-router-dom'

const TABS = [
  { id: 'profile', icon: User, label: 'Profile & Academic' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'billing', icon: CreditCard, label: 'Plan & Billing' },
  { id: 'security', icon: Shield, label: 'Security' },
]

export default function SettingsPage({ user, isMobile }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profile Form State
  const [profile, setProfile] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    university: '',
    faculty: '',
    level: '',
  })

  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfile(p => ({
          ...p,
          university: data.university || '',
          faculty: data.faculty || '',
          level: data.level || '',
        }))
      }
      setLoading(false)
    }
    fetchProfile()
  }, [user])

  const handleSaveProfile = async () => {
    setSaving(true)
    await supabase.auth.updateUser({
      data: { full_name: profile.fullName }
    })
    
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: profile.fullName,
      university: profile.university,
      faculty: profile.faculty,
      level: profile.level
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Loader2 size={28} className="animate-spin" color="#7a12cc" />
    </div>
  )

  return (
    <div className="dh-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Topbar ── */}
      <div className="dh-topbar" style={{ background: isMobile ? 'transparent' : '#fff', borderBottom: isMobile ? 'none' : '1px solid #eee', padding: isMobile ? '20px 20px 0' : '20px 40px' }}>
        <div className="dh-topbar-left">
          <h1 className="dh-page-title" style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900 }}>Settings</h1>
          <p className="dh-page-sub" style={{ fontSize: isMobile ? 12 : 14, opacity: 0.6 }}>Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        flex: 1, 
        padding: isMobile ? '12px 16px 80px' : '32px 40px', 
        gap: isMobile ? 16 : 40, 
        maxWidth: 1100, 
        margin: '0 auto', 
        width: '100%' 
      }}>
        
        {/* ── Sidebar / Tabs ── */}
        <div style={{ width: isMobile ? '100%' : 240, flexShrink: 0 }}>
          <div className="no-scrollbar" style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'row' : 'column', 
            gap: isMobile ? 8 : 6,
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? 4 : 0,
            whiteSpace: 'nowrap',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}>
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '10px 16px' : '12px 16px',
                    borderRadius: 12, border: isMobile ? '1.5px solid #111' : '2px solid #111', background: active ? '#111' : 'white',
                    color: active ? 'white' : '#111', fontWeight: 900,
                    fontSize: isMobile ? 12 : 13, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: active ? 'none' : isMobile ? '3px 3px 0px #111' : '4px 4px 0px #111',
                    transform: active ? 'translate(2px, 2px)' : 'none',
                    transition: 'all 0.1s', textAlign: 'left',
                    flexShrink: 0
                  }}
                >
                  <Icon size={12} strokeWidth={2.5} />
                  {isMobile ? tab.label.split(' ')[0] : tab.label}
                </button>
              )
            })}
          </div>

          {!isMobile && (
            <div style={{ marginTop: 40, borderTop: '2.5px solid #111', paddingTop: 24 }}>
              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                  width: '100%', borderRadius: 16, border: '2px solid #111', background: '#fef2f2',
                  color: '#dc2626', fontWeight: 900, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.1s',
                  boxShadow: '4px 4px 0px #111'
                }}
              >
                <LogOut size={16} /> SIGN OUT
              </button>
            </div>
          )}
        </div>

        {/* ── Content Area ── */}
        <div style={{ flex: 1 }}>
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
              <div style={{ 
                background: '#fff', 
                borderRadius: isMobile ? 24 : 28, 
                border: isMobile ? '1.5px solid #111' : '2.5px solid #111', 
                overflow: 'hidden', 
                boxShadow: isMobile ? '4px 4px 0px #111' : '8px 8px 0px #111' 
              }}>
                <div style={{ padding: isMobile ? '16px 20px' : '24px 32px', borderBottom: isMobile ? '1.5px solid #111' : '2.5px solid #111', background: 'var(--primary-bg)' }}>
                  <h2 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 1000, margin: '0 0 2px', color: '#111' }}>Personal Information</h2>
                  <p style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Update details</p>
                </div>
                
                <div style={{ padding: isMobile ? '20px' : '32px', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 24 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 9, fontWeight: 1000, color: '#111', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full Name</label>
                      <input 
                        value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})}
                        style={{ width: '100%', padding: isMobile ? '10px 14px' : '14px 18px', borderRadius: 12, border: isMobile ? '1.5px solid #111' : '2.5px solid #111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 9, fontWeight: 1000, color: '#111', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</label>
                      <input 
                        value={profile.email} disabled
                        style={{ width: '100%', padding: isMobile ? '10px 14px' : '14px 18px', borderRadius: 12, border: isMobile ? '1.5px solid #eee' : '2.5px solid #eee', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8f8f8', color: '#999', cursor: 'not-allowed', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 24 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 9, fontWeight: 1000, color: '#111', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>University</label>
                      <input 
                        value={profile.university} onChange={e => setProfile({...profile, university: e.target.value})}
                        style={{ width: '100%', padding: isMobile ? '10px 14px' : '14px 18px', borderRadius: 12, border: isMobile ? '1.5px solid #111' : '2.5px solid #111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 9, fontWeight: 1000, color: '#111', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Faculty / Level</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input 
                          value={profile.faculty} onChange={e => setProfile({...profile, faculty: e.target.value})}
                          placeholder="Faculty"
                          style={{ flex: 2, padding: isMobile ? '10px 14px' : '14px 18px', borderRadius: 12, border: isMobile ? '1.5px solid #111' : '2.5px solid #111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', fontWeight: 700 }}
                        />
                         <input 
                          value={profile.level} onChange={e => setProfile({...profile, level: e.target.value})}
                          placeholder="Lv"
                          style={{ flex: 1, padding: isMobile ? '10px 14px' : '14px 18px', borderRadius: 12, border: isMobile ? '1.5px solid #111' : '2.5px solid #111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', fontWeight: 700, textAlign: 'center' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  padding: isMobile ? '16px 20px' : '24px 32px', 
                  borderTop: isMobile ? '1.5px solid #111' : '2.5px solid #111', 
                  background: '#fafafa', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: isMobile ? 'stretch' : 'flex-end', 
                  gap: 16 
                }}>
                  <button 
                    onClick={handleSaveProfile} 
                    disabled={saving} 
                    style={{ 
                      flex: isMobile ? 1 : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                      padding: isMobile ? '12px' : '14px 32px', borderRadius: 12, border: isMobile ? '1.5px solid #111' : '2.5px solid #111', 
                      background: '#111', color: 'white', fontSize: 13, fontWeight: 900, 
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s', 
                      boxShadow: isMobile ? '3px 3px 0px rgba(0,0,0,0.1)' : '4px 4px 0px rgba(0,0,0,0.1)' 
                    }}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                    SAVE PROFILE
                  </button>
                </div>
              </div>

              {isMobile && (
                 <button
                    onClick={handleSignOut}
                    style={{
                   display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, 
                   padding: '14px',
                   marginTop: 16, width: '100%', borderRadius: 16, border: '1.5px solid #111', 
                   background: '#fef2f2',
                   color: '#dc2626', fontWeight: 1000, fontSize: 14, cursor: 'pointer',
                   fontFamily: 'inherit', boxShadow: '4px 4px 0px #111'
                 }}
               >
                 <LogOut size={16} strokeWidth={3} /> SIGN OUT
               </button>
              )}
            </motion.div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{ 
                background: '#fff', 
                borderRadius: isMobile ? 24 : 28, 
                border: isMobile ? '1.5px solid #111' : '2.5px solid #111', 
                overflow: 'hidden', 
                boxShadow: isMobile ? '4px 4px 0px #111' : '8px 8px 0px #111' 
              }}>
                <div style={{ padding: isMobile ? '16px 20px' : '24px 32px', borderBottom: isMobile ? '1.5px solid #111' : '2.5px solid #111', background: '#f0fdf4' }}>
                  <h2 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 1000, margin: '0 0 2px', color: '#111' }}>Plan & Billing</h2>
                  <p style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: '#059669', margin: 0 }}>Subscription status</p>
                </div>
                
                <div style={{ padding: isMobile ? '16px 20px' : '32px' }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 16,
                    padding: isMobile ? '24px 16px' : '32px 24px', 
                    borderRadius: 20, 
                    background: 'white', 
                    color: '#111', 
                    border: isMobile ? '1.5px solid #111' : '2.5px solid #111',
                    boxShadow: isMobile ? '3px 3px 0px #111' : '6px 6px 0px #111',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 1000, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={14} fill="var(--primary)" /> STATUS
                      </div>
                      <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 1000, marginBottom: 4 }}>Luter Scholar (Free)</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Fundamental workstation tools enabled.</div>
                    </div>

                    <button style={{ 
                      width: '100%',
                      padding: '14px', 
                      borderRadius: 14, 
                      background: 'var(--primary)', 
                      border: '1.5px solid #111', 
                      color: 'white', 
                      fontSize: 13, 
                      fontWeight: 1000, 
                      cursor: 'pointer', 
                      fontFamily: 'inherit', 
                      boxShadow: '3px 3px 0px #111'
                    }}>
                      UPGRADE TO PRO
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}
