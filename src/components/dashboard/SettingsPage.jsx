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
      
      {/* ── Header ── */}
      <div style={{ padding: isMobile ? '24px 20px 8px' : '40px 48px 0', background: '#fff' }}>
         <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, color: '#111', margin: 0, letterSpacing: '-0.04em' }}>
           {isMobile ? 'Account config' : 'Settings'}
         </h1>
         <p style={{ fontSize: isMobile ? 12 : 14, color: '#666', fontWeight: 700, margin: '4px 0 0' }}>
           {isMobile ? 'Manage your scholarly profile.' : 'Manage your Luter workstation and preferences.'}
         </p>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        flex: 1, 
        padding: isMobile ? '12px 16px 80px' : '40px 48px', 
        gap: isMobile ? 20 : 48, 
        maxWidth: 1200, 
        margin: isMobile ? '0' : '0 auto', 
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}>
        
        {/* ── Sidebar / Navigation ── */}
        <div style={{ width: isMobile ? '100%' : 260, flexShrink: 0 }}>
          <div className="no-scrollbar" style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'row' : 'column', 
            gap: isMobile ? 10 : 8,
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? 4 : 0,
            whiteSpace: 'nowrap',
            marginLeft: isMobile ? -16 : 0,
            padding: isMobile ? '0 16px' : 0,
            boxSizing: 'border-box'
          }}>
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '10px 18px' : '14px 20px',
                    borderRadius: 16, border: active ? '1.5px solid var(--primary)' : '1.5px solid #e5e7eb', background: active ? 'var(--primary-bg)' : 'white',
                    color: active ? 'var(--primary)' : '#111', fontWeight: 900,
                    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: active ? 'none' : '0 2px 8px rgba(0,0,0,0.02)',
                    transform: 'none',
                    transition: 'all 0.2s', textAlign: 'left',
                    flexShrink: 0
                  }}
                >
                  <Icon size={16} strokeWidth={2.5} fill={active ? 'var(--primary)' : 'transparent'} />
                  {tab.label}
                </button>
              )
            } )}
          </div>
          {isMobile && <div style={{ height: 1, background: '#eee', margin: '16px 0' }} />}

          {!isMobile && (
            <div style={{ marginTop: 40, borderTop: '1.5px solid #e5e7eb', paddingTop: 32 }}>
              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px',
                  width: '100%', borderRadius: 16, border: '1.5px solid #fee2e2', background: '#fef2f2',
                  color: '#dc2626', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(220,38,38,0.05)'
                }}
              >
                <LogOut size={18} /> SIGN OUT OF LUTER
              </button>
            </div>
          )}
        </div>

        {/* ── Content Area ── */}
        <div style={{ flex: 1 }}>
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{ 
                background: '#fff', 
                borderRadius: isMobile ? 28 : 40, 
                border: '1.5px solid #e5e7eb', 
                overflow: 'hidden', 
                boxShadow: '0 20px 60px -12px rgba(0,0,0,0.06)' 
              }}>
                <div style={{ 
                  padding: isMobile ? '24px' : '32px 40px', 
                  borderBottom: '1.5px solid #e5e7eb', 
                  background: 'linear-gradient(135deg, var(--primary-bg) 0%, #fff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h2 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, margin: 0, color: '#111', letterSpacing: '-0.02em' }}>Personal Profile</h2>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', margin: '4px 0 0' }}>Update your scholar details</p>
                  </div>
                  <User size={isMobile ? 24 : 32} color="var(--primary)" strokeWidth={2.5} />
                </div>
                
                <div style={{ padding: isMobile ? '24px' : '40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 1000, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Name</label>
                      <input 
                        value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})}
                        style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', fontWeight: 700, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 1000, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
                      <input 
                        value={profile.email} disabled
                        style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '2.5px solid #eee', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f5f5f5', color: '#999', cursor: 'not-allowed', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em' }}>University</label>
                      <input 
                        value={profile.university} onChange={e => setProfile({...profile, university: e.target.value})}
                        style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', fontWeight: 700 }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 1000, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Faculty & Level</label>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <input 
                          value={profile.faculty} onChange={e => setProfile({...profile, faculty: e.target.value})}
                          placeholder="Faculty"
                          style={{ flex: 2, padding: '16px 20px', borderRadius: 16, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', fontWeight: 700 }}
                        />
                         <input 
                          value={profile.level} onChange={e => setProfile({...profile, level: e.target.value})}
                          placeholder="Level"
                          style={{ flex: 1, padding: '16px 20px', borderRadius: 16, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', fontWeight: 700, textAlign: 'center' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  padding: isMobile ? '24px' : '32px 40px', 
                  borderTop: '1.5px solid #e5e7eb', 
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
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, 
                      padding: '16px 40px', borderRadius: 16, border: 'none', 
                      background: '#111', color: 'white', fontSize: 14, fontWeight: 800, 
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s', 
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)' 
                    }}
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={18} />} 
                    SAVE CHANGES
                  </button>
                </div>
              </div>

              {isMobile && (
                 <button
                    onClick={handleSignOut}
                    style={{
                   display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, 
                   padding: '18px',
                   marginTop: 24, width: '100%', borderRadius: 20, border: '1.5px solid #fee2e2', 
                   background: '#fef2f2',
                   color: '#dc2626', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                   fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(220,38,38,0.1)'
                 }}
               >
                 <LogOut size={18} strokeWidth={3} /> SIGN OUT
               </button>
              )}
            </motion.div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <div style={{ 
                background: '#fff', 
                borderRadius: isMobile ? 28 : 40, 
                border: '1.5px solid #e5e7eb', 
                overflow: 'hidden', 
                boxShadow: '0 20px 60px -12px rgba(0,0,0,0.06)' 
              }}>
                <div style={{ padding: isMobile ? '24px' : '32px 40px', borderBottom: '1.5px solid #e5e7eb', background: '#f0fdf4' }}>
                  <h2 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, margin: 0, color: '#111' }}>Plan & Subscription</h2>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#059669', margin: '4px 0 0' }}>Manage your scholarly benefits</p>
                </div>
                
                <div style={{ padding: isMobile ? '24px' : '40px' }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 24,
                    padding: isMobile ? '32px 24px' : '48px 40px', 
                    borderRadius: 32, 
                    background: 'linear-gradient(135deg, #fff 0%, var(--primary-bg) 100%)', 
                    color: '#111', 
                    border: '1.5px solid #e5e7eb',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={16} fill="var(--primary)" /> CURRENT TIER
                      </div>
                      <div style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Luter Scholar (Free)</div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#666', maxWidth: 400, lineHeight: 1.6 }}>You're currently using the fundamental workstation. Upgrade for unlimited AI support and advanced tracking.</p>
                    </div>

                    <button style={{ 
                      width: isMobile ? '100% ' : 'fit-content',
                      padding: '18px 40px', 
                      borderRadius: 16, 
                      background: 'var(--primary)', 
                      border: 'none', 
                      color: 'white', 
                      fontSize: 15, 
                      fontWeight: 800, 
                      cursor: 'pointer', 
                      fontFamily: 'inherit', 
                      boxShadow: '0 8px 24px -6px rgba(151,24,251,0.5)',
                      transition: 'all 0.2s'
                    }}>
                      UPGRADE TO SCHOLAR+
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
