import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiUserFill as User, RiNotification3Fill as Bell, RiBankCardFill as CreditCard, RiShieldFill as Shield, RiLogoutCircleRFill as LogOut, 
  RiDeleteBin6Fill as Trash2, RiArrowRightSLine as ChevronRight, RiSaveFill as Save, RiLoader4Line as Loader2,
  RiCheckboxCircleFill as CheckCircle2, RiMagicFill as Sparkles, RiGraduationCapFill as GraduationCap,
  RiBriefcaseFill as Briefcase, RiComputerFill as Monitor, RiGithubFill as Github, RiMailFill as Mail,
  RiCloseLine as X, RiCheckLine as Check, RiExternalLinkFill as ExternalLink, RiShieldFlashFill as ShieldAlert,
  RiGhostFill as Ghost, RiBearSmileFill as Cat, RiRobotFill as Dog, RiSkullFill as Bird, RiAliensFill as Rabbit, RiMickeyFill as Turtle, RiEmotionFill as Smile
} from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'

const PRIMARY_COLOR = '#9718fb'
const PRIMARY_BG = '#F3E8FF'

const TABS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'academic', icon: GraduationCap, label: 'Academic' },
  { id: 'vault', icon: Briefcase, label: 'Vault' },
  { id: 'preferences', icon: Monitor, label: 'Preferences' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'social', icon: Bell, label: 'Alerts' },
]

const MASCOT_ICONS = [
  { id: 'ghost', icon: Ghost, color: '#FF7597' },
  { id: 'cat', icon: Cat, color: '#4FB0FF' },
  { id: 'dog', icon: Dog, color: '#00D084' },
  { id: 'bird', icon: Bird, color: PRIMARY_COLOR },
  { id: 'rabbit', icon: Rabbit, color: '#FFAB2D' },
  { id: 'turtle', icon: Turtle, color: '#111' },
  { id: 'smile', icon: Smile, color: '#A855F7' },
]

export default function SettingsPage() {
  const { user, isMobile } = useOutletContext()
  const { bundle, ready, refresh } = useDashboardPrefetch()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    username: '',
    bio: '',
    avatarUrl: 'ghost',
    university: '',
    faculty: '',
    level: '100',
    semester: '1',
    aiPersonality: 'Encouraging',
    readingMode: 'Annotator',
    language: 'English',
    liveVisibility: true,
    groupInvitePermission: 'Anyone',
    pushAlerts: true,
    emailReports: true,
    soundEffects: true
  })

  useEffect(() => {
    if (!user || !ready) return
    const fetchData = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (data) {
        setFormData(prev => ({
          ...prev,
          fullName: data.full_name || user?.user_metadata?.full_name || '',
          username: data.username || '',
          bio: data.bio || '',
          avatarUrl: data.avatar_url || 'ghost',
          university: data.university || '',
          faculty: data.faculty || '',
          level: data.level || '100',
          semester: data.semester || '1',
          aiPersonality: data.ai_personality || 'Encouraging',
          readingMode: data.reading_mode || 'Annotator',
          language: data.primary_language || 'English',
          liveVisibility: data.live_visibility ?? true,
          groupInvitePermission: data.group_invite_permission || 'Anyone',
          pushAlerts: data.push_alerts_enabled ?? true,
          emailReports: data.email_reports_enabled ?? true,
          soundEffects: data.sound_effects_enabled ?? true
        }))
      }
      setLoading(false)
    }
    fetchData()
  }, [user, ready])

  const handleUpdate = async (updates) => {
    setSaving(true)
    const newFormData = { ...formData, ...updates }
    setFormData(newFormData)
    
    await supabase.from('profiles').upsert({
      id: user.id,
      ...newFormData,
      primary_language: newFormData.language,
      live_visibility: newFormData.liveVisibility,
      group_invite_permission: newFormData.groupInvitePermission,
      push_alerts_enabled: newFormData.pushAlerts,
      email_reports_enabled: newFormData.emailReports,
      sound_effects_enabled: newFormData.soundEffects,
      updated_at: new Date()
    })

    if (updates.fullName && updates.fullName !== user?.user_metadata?.full_name) {
      await supabase.auth.updateUser({ data: { full_name: updates.fullName } })
    }
    setSaveSuccess(true)
    setSaving(false)
    setTimeout(() => setSaveSuccess(false), 2000)
    await refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff' }}>
      <Loader2 size={32} className="animate-spin" color={PRIMARY_COLOR} />
    </div>
  )

  const stats = bundle?.stats?.data || {}
  const aiCreditsLimit = stats.ai_credits_monthly || 50
  const aiCreditsUsed = stats.ai_credits_used || 0

  return (
    <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#111', fontFamily: "'Outfit', sans-serif", flex: 1 }}>
      
      {/* ── CRISP HEADER ── */}
      <div style={{ padding: isMobile ? '24px 20px 0' : '48px 60px 0', borderBottom: '1px solid #F1F5F9' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
               <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Settings</h1>
            </div>
            {!isMobile && (
              <button onClick={handleSignOut} style={signOutBtn}>
                 <LogOut size={14} strokeWidth={2} /> LOG OUT
              </button>
            )}
         </div>

         {/* ── SHARP TAB SYSTEM ── */}
         <div className="no-scrollbar" style={{ display: 'flex', gap: 32, overflowX: 'auto' }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 2px 14px', border: 'none', background: 'none',
                    color: active ? PRIMARY_COLOR : '#64748B', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    position: 'relative', whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: 'inherit'
                  }}
                >
                  <tab.icon size={16} strokeWidth={active ? 2.5 : 2} />
                  {tab.label}
                  {active && (
                    <motion.div layoutId="setting-tab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: PRIMARY_COLOR }} />
                  )}
                </button>
              )
            })}
         </div>
      </div>

      {/* ── HIGH DENSITY CONTENT ── */}
      <div style={{ flex: 1, padding: isMobile ? '24px 20px 100px' : '40px 60px', maxWidth: 900, width: '100%' }}>
        
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            
            {/* PROFILE PAGE */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                <div>
                   <Label>Mascot Selection</Label>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 16 }}>
                      <div style={{ 
                        width: 80, height: 80, borderRadius: 14, background: PRIMARY_COLOR, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: 32, fontWeight: 800, color: '#fff'
                      }}>
                         {formData.fullName.charAt(0)}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                         {MASCOT_ICONS.map(m => (
                           <button
                             key={m.id}
                             onClick={() => handleUpdate({ avatarUrl: m.id })}
                             style={{
                               width: 40, height: 40, borderRadius: 10, background: m.color, 
                               border: formData.avatarUrl === m.id ? '2px solid #000' : '1px solid transparent',
                               display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', 
                               cursor: 'pointer', transition: 'all 0.1s'
                             }}
                           >
                             <m.icon size={18} strokeWidth={2} />
                           </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                   <CleanEditableRow label="Full Name" value={formData.fullName} onSave={val => handleUpdate({ fullName: val })} />
                   <CleanEditableRow label="Username" value={formData.username} prefix="@" onSave={val => handleUpdate({ username: val })} />
                   <CleanEditableRow label="Bio / Research Focus" value={formData.bio} multiline onSave={val => handleUpdate({ bio: val })} />
                </div>
              </div>
            )}

            {/* ACADEMIC PAGE */}
            {activeTab === 'academic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                 <CleanEditableRow label="University" value={formData.university} onSave={val => handleUpdate({ university: val })} />
                 <CleanEditableRow label="Field of Study" value={formData.faculty} onSave={val => handleUpdate({ faculty: val })} />
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                    <CleanSelect label="Academic Level" value={formData.level} options={['100', '200', '300', '400', '500', '600', 'Postgrad']} onChange={val => handleUpdate({ level: val })} />
                    <CleanSelect label="Semester" value={formData.semester} options={['Semester 1', 'Semester 2']} valueMap={['1', '2']} onChange={val => handleUpdate({ semester: val })} />
                 </div>
              </div>
            )}

            {/* VAULT PAGE */}
            {activeTab === 'vault' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                 <div style={{ 
                   padding: 40, borderRadius: 16, background: '#111', color: '#fff', 
                   backgroundImage: `linear-gradient(135deg, ${PRIMARY_COLOR}22 0%, transparent 100%)`,
                   border: '1px solid #333'
                 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: PRIMARY_COLOR, marginBottom: 8 }}>MEMBERSHIP</div>
                    <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>The Scholar Vault</div>
                    
                    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                       <VaultSub label="AVAILABLE CREDITS" value={`${aiCreditsLimit - aiCreditsUsed}/${aiCreditsLimit}`} />
                       <VaultSub label="ACCOUNT TYPE" value="Luter Pro" />
                    </div>
                 </div>
                 
                 <button style={manageBtn}>
                    <ExternalLink size={14} strokeWidth={2} /> Manage Billing & Invoices
                 </button>
              </div>
            )}

            {/* PREFERENCES PAGE */}
            {activeTab === 'preferences' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <ToggleRow label="Focus Mode" desc="Automatically cleaner workspace when reading." active={formData.readingMode === 'Focus'} onToggle={v => handleUpdate({ readingMode: v ? 'Focus' : 'Annotator'})} />
                 <ToggleRow label="Socratic AI" desc="Guides you with prompts instead of straight answers." active={formData.aiPersonality === 'Socratic'} onToggle={v => handleUpdate({ aiPersonality: v ? 'Socratic' : 'Encouraging'})} />
                 <ToggleRow label="Feedback Sounds" desc="Productivity audio cues for workstation actions." active={formData.soundEffects} onToggle={v => handleUpdate({ soundEffects: v })} />
              </div>
            )}

            {/* SECURITY PAGE */}
            {activeTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                 <CleanEditableRow label="Primary Email" value={user.email} disabled />
                 
                 <div style={{ padding: 24, borderRadius: 12, background: '#FFF1F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: 15, fontWeight: 800, color: '#991B1B' }}>Delete Workspace</div>
                       <div style={{ fontSize: 13, color: '#B91C1C', fontWeight: 500, marginTop: 2 }}>Permanently remove all data.</div>
                    </div>
                    <button style={dangerBtn}>Delete Account</button>
                 </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* SYNC TOAST */}
      <AnimatePresence>
         {saveSuccess && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={toast}>
             <Check size={14} strokeWidth={3} /> Changes Saved
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  )
}

function CleanEditableRow({ label, value, onSave, multiline, prefix, disabled }) {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(value)
  return (
    <div style={{ paddingBottom: 24, borderBottom: '1px solid #F1F5F9' }}>
      <Label>{label}</Label>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
         <div style={{ flex: 1 }}>
            {isEditing ? (
              <input 
                autoFocus value={val} onChange={e => setVal(e.target.value)} 
                style={sInput} placeholder={prefix ? prefix : ''} 
              />
            ) : (
              <div style={{ fontSize: 16, fontWeight: 600, color: value ? '#000' : '#CBD5E1' }}>{prefix}{value || 'Not set'}</div>
            )}
         </div>
         {!disabled && (
           <button onClick={() => isEditing ? (onSave(val), setIsEditing(false)) : setIsEditing(true)} style={actionBtn}>
             {isEditing ? 'Save' : 'Edit'}
           </button>
         )}
      </div>
    </div>
  )
}

function CleanSelect({ label, value, options, valueMap, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
       <Label>{label}</Label>
       <select value={value} onChange={e => onChange(e.target.value)} style={sSelect}>
          {options.map((opt, i) => <option key={opt} value={valueMap ? valueMap[i] : opt}>{opt}</option>)}
       </select>
    </div>
  )
}

function ToggleRow({ label, desc, active, onToggle }) {
  return (
    <div style={{ padding: '20px 0', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
       <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#000' }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>{desc}</div>
       </div>
       <button onClick={() => onToggle(!active)} style={{ width: 36, height: 20, borderRadius: 20, background: active ? PRIMARY_COLOR : '#E2E8F0', position: 'relative', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
          <motion.div animate={{ x: active ? 18 : 2 }} style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2 }} />
       </button>
    </div>
  )
}

function VaultSub({ label, value }) {
  return (
    <div>
       <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.5, letterSpacing: '0.05em' }}>{label}</div>
       <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  )
}

const Label = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>{children}</div>

const sInput = { width: '100%', padding: '8px 0', border: 'none', borderBottom: `1px solid ${PRIMARY_COLOR}`, fontSize: 16, fontWeight: 600, outline: 'none', background: 'transparent', color: '#000', fontFamily: 'inherit' }
const sSelect = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, fontWeight: 600, outline: 'none', background: '#fff', color: '#000', fontFamily: 'inherit' }
const actionBtn = { background: 'none', border: 'none', color: PRIMARY_COLOR, fontWeight: 700, fontSize: 14, cursor: 'pointer' }
const manageBtn = { width: '100%', padding: '14px', borderRadius: 10, background: '#fff', border: '1px solid #E2E8F0', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#111' }
const dangerBtn = { padding: '8px 16px', borderRadius: 8, background: '#F43F5E', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
const signOutBtn = { padding: '8px 12px', borderRadius: 8, background: '#FFF1F2', color: '#F43F5E', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }
const toast = { position: 'fixed', bottom: 32, right: 32, background: '#000', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }
