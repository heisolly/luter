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

export default function SettingsPage({ user }) {
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
    // Update auth metadata
    await supabase.auth.updateUser({
      data: { full_name: profile.fullName }
    })
    
    // Update profiles table
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
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} className="animate-spin" color="var(--primary)" />
    </div>
  )

  return (
    <div className="dh-root" style={{ background: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Topbar ── */}
      <div className="dh-topbar" style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="dh-topbar-left">
          <h1 className="dh-page-title">Settings</h1>
          <p className="dh-page-sub">Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, padding: '32px 40px', gap: 40, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        
        {/* ── Sidebar ── */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderRadius: 12, border: 'none', background: active ? 'white' : 'transparent',
                    color: active ? '#111' : '#666', fontWeight: active ? 700 : 600,
                    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: active ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                    border: active ? '1px solid var(--border)' : '1px solid transparent',
                    transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <Icon size={16} color={active ? 'var(--primary)' : '#888'} />
                  {tab.label}
                  {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                width: '100%', borderRadius: 12, border: 'none', background: 'transparent',
                color: '#dc2626', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.2s' 
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* ── Content Area ── */}
        <div style={{ flex: 1 }}>
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#111' }}>Personal Information</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Update your identity and academic details.</p>
                </div>
                
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name</label>
                      <input 
                        value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fafafa' }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</label>
                      <input 
                        value={profile.email} disabled
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #eaeaea', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f5f5f5', color: '#888', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>University</label>
                      <input 
                        value={profile.university} onChange={e => setProfile({...profile, university: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fafafa' }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Faculty / College</label>
                      <input 
                        value={profile.faculty} onChange={e => setProfile({...profile, faculty: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fafafa' }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
                  {saved && <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={16} /> Saved successfully</span>}
                  <button onClick={handleSaveProfile} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 999, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(122,18,204,0.3)' }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#111' }}>Plan & Billing</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Manage your subscription</p>
                </div>
                
                <div style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderRadius: 16, background: 'linear-gradient(135deg, #7a12cc 0%, #b04dfc 100%)', color: 'white', boxShadow: '0 14px 30px rgba(122,18,204,0.25)' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={14} /> Current Plan</div>
                      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Luter Scholar (Free)</div>
                      <div style={{ fontSize: 14, opacity: 0.9 }}>You have full access to limited workstation queries.</div>
                    </div>
                    <button style={{ padding: '12px 24px', borderRadius: 999, background: 'white', border: 'none', color: '#7a12cc', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Upgrade to Pro
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
