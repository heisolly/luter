import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiTeamFill as Users, 
  RiAddLine as Plus, 
  RiArrowRightSLine as ChevronRight, 
  RiHome5Fill as Home, 
  RiLogoutBoxLine as LogOut, 
  RiFileCopyLine as Copy, 
  RiCheckLine as Check, 
  RiLinkM as LinkIcon,
  RiCloseLine as X,
  RiPaletteFill as Palette,
  RiUserSmileFill as Smile,
  RiLoader4Line as Loader2,
  RiDeleteBin6Fill as Trash2
} from 'react-icons/ri'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import useTourStore from '../../store/useTourStore'
import './study-groups.css'

// Curated Luter palette
const COLORS = [
  '#7C3AED', // Luter Purple
  '#F97316', // Luter Orange
  '#111111', // Luter Black
  '#111111', // Repeat for grid filling
  '#7C3AED', 
  '#F97316'
]

const EMOJIS = ['🤘', '🔥', '📚', '🚀', '🧠', '💡', '🎨', '⚡️', '🤝', '📖']

export default function StudyGroupsPage() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchGroups()
  }, [user])

  const { startTour, hasCompletedTour, completedTours, currentUserId, isLoadingTours } = useTourStore()

  useEffect(() => {
    if (user?.id && currentUserId === user.id && !loading && !isLoadingTours && !hasCompletedTour('study-groups')) {
      const timer = setTimeout(() => startTour('study-groups'), 2000)
      return () => clearTimeout(timer)
    }
  }, [user?.id, currentUserId, completedTours, loading, hasCompletedTour, startTour, isLoadingTours])

  async function fetchGroups() {
    try {
      setLoading(true)
      // Fetch groups where the user is a member
      const { data, error } = await supabase
        .from('study_group_members')
        .select(`
          group:study_groups (
            *,
            member_count:study_group_members(count)
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (error) throw error
      
      // Flatten the result
      const flattened = data.map(item => ({
        ...item.group,
        member_count: item.group.member_count[0].count
      }))
      
      setGroups(flattened)
    } catch (err) {
      console.error('Error fetching groups:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteGroup(id) {
    if (!confirm('Are you sure you want to delete this group? All members will be removed.')) return
    try {
      const { error } = await supabase.from('study_groups').delete().eq('id', id)
      if (error) throw error
      setGroups(groups.filter(g => g.id !== id))
    } catch (err) {
      alert('Failed to delete group')
    }
  }

  return (
    <div className="sg-container">
      {/* Breadcrumbs */}
      <div id="tour-groups-header" className="sg-header">
        <div className="sg-breadcrumbs">
          <button className="sg-breadcrumb-item" onClick={() => navigate('/home')}>
            <Home size={14} />
            <span>Home</span>
          </button>
          <ChevronRight size={14} className="sg-breadcrumb-sep" />
          <button className="sg-breadcrumb-item sg-breadcrumb-item--active">
            <Users size={14} />
            <span>Study Groups</span>
          </button>
        </div>
      </div>

      <div className="sg-content">
        {loading ? (
          <div className="sg-loader">
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : groups.length === 0 ? (
          <div className="sg-empty-state">
            <div className="sg-empty-visual">
              <div className="sg-empty-card-backdrop sg-empty-card-backdrop--1" />
              <div className="sg-empty-card-backdrop sg-empty-card-backdrop--2" />
              
              <motion.div 
                className="sg-empty-card"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="sg-empty-card-header" style={{ background: '#7C3AED' }}>
                  <div className="sg-member-avatars">
                    <img src="https://i.pravatar.cc/150?u=1" alt="m1" />
                    <img src="https://i.pravatar.cc/150?u=2" alt="m2" />
                  </div>
                  <div className="sg-card-emoji">🤘</div>
                </div>
                <div className="sg-empty-card-body">
                  <h3>First Study Group</h3>
                  <div className="sg-card-tags">
                    <span>2 members</span>
                    <span>0 decks</span>
                    <span>0 cards</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="sg-empty-text">
              <h2>Create a study group</h2>
              <p>Or join with a link to start sharing folders, decks and quizzes!</p>
            </div>
          </div>
        ) : (
          <div className="sg-groups-grid">
            {groups.map(group => (
              <motion.div 
                key={group.id} 
                className="sg-group-card"
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/study-groups/${group.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="sg-group-card-header" style={{ background: group.color }}>
                  <div className="sg-card-emoji-small">{group.emoji}</div>
                  {group.created_by === user?.id && (
                     <button className="sg-delete-group-btn" onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteGroup(group.id)
                     }}>
                        <Trash2 size={14} />
                     </button>
                  )}
                </div>
                <div className="sg-group-card-content">
                  <h3>{group.name}</h3>
                  <div className="sg-group-stats">
                    <div className="sg-stat">
                      <Users size={12} />
                      <span>{group.member_count || 1} members</span>
                    </div>
                  </div>
                  <div className="sg-invite-row" onClick={(e) => e.stopPropagation()}>
                    <code className="sg-invite-code">{group.invite_code}</code>
                    <button className="sg-copy-code-btn" onClick={() => {
                        const link = `${window.location.origin}/join/${group.invite_code}`
                        navigator.clipboard.writeText(link)
                        alert(`Link copied: ${link}`)
                    }}>
                      <LinkIcon size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation */}
      <div className="sg-floating-nav">
        <div className="sg-nav-pills">
          <button id="tour-groups-create" className="sg-nav-btn sg-nav-btn--primary" onClick={() => setShowCreateModal(true)}>
            <div className="sg-nav-icon-circle">
               <Plus size={18} strokeWidth={3} />
            </div>
            <span>Create Study Group</span>
          </button>
          <div className="sg-nav-divider" />
          <button className="sg-nav-btn sg-nav-btn--secondary" onClick={() => setShowJoinModal(true)}>
            <LogOut size={18} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
            <span>Join Study Group</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGroupModal 
            onClose={() => setShowCreateModal(false)} 
            user={user} 
            onCreated={fetchGroups}
          />
        )}
        {showJoinModal && (
          <JoinGroupModal 
            onClose={() => setShowJoinModal(false)} 
            user={user}
            onJoined={() => {
              setShowJoinModal(false)
              fetchGroups()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateGroupModal({ onClose, user, onCreated }) {
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0])
  const [creating, setCreating] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [createdGroup, setCreatedGroup] = useState(null)

  async function handleCreate() {
    if (!name || !user) return
    try {
      setCreating(true)
      
      // 1. Create group
      const { data: group, error: groupErr } = await supabase
        .from('study_groups')
        .insert({
          name,
          color: selectedColor,
          emoji: selectedEmoji,
          created_by: user.id
        })
        .select()
        .single()

      if (groupErr) throw groupErr

      // 2. Add creator as member
      const { error: memErr } = await supabase
        .from('study_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        })

      if (memErr) throw memErr

      setCreatedGroup(group)
      setShowInviteModal(true)
      onCreated()
    } catch (err) {
      console.error('Error creating group:', err)
      alert('Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  if (showInviteModal) {
    return <InviteGroupModal group={createdGroup} onClose={onClose} />
  }

  return (
    <motion.div className="sg-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="sg-modal sg-modal--create" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
        <button className="sg-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="sg-modal-header"><div className="sg-modal-title-tag">Create Study Group</div></div>

        <div className="sg-modal-layout">
          <div className="sg-modal-form">
            <div className="sg-form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label>Group Name</label>
                <div className="sg-label-icon">
                   <div className="sg-emoji-selector-wrap">
                      <select value={selectedEmoji} onChange={(e) => setSelectedEmoji(e.target.value)}>
                        {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                   </div>
                </div>
              </div>
              <input type="text" placeholder="e.g. Physics Room" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="sg-form-section">
              <label>Primary Theme</label>
              <div className="sg-color-grid">
                {COLORS.slice(0, 3).map(color => (
                  <button 
                    key={color}
                    className={`sg-color-dot ${selectedColor === color ? 'sg-color-dot--active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="sg-modal-preview">
            <div className="sg-preview-label"><Users size={14} /><span>Preview</span></div>
            <div className="sg-preview-container">
              <div className="sg-empty-card sg-empty-card--preview">
                <div className="sg-empty-card-header" style={{ background: selectedColor }}>
                  <div className="sg-card-emoji">{selectedEmoji}</div>
                </div>
                <div className="sg-empty-card-body">
                  <h3>{name || 'Physics Room'}</h3>
                  <div className="sg-card-tags"><span>1 member</span><span>0 decks</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sg-modal-footer">
          <button className="sg-submit-btn" disabled={!name || creating} onClick={handleCreate}>
             {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
             Create Group
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function InviteGroupModal({ group, onClose }) {
  const [copied, setCopied] = useState(false)
  const inviteLink = `${window.location.origin}/join/${group.invite_code}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div className="sg-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="sg-modal sg-modal--invite" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
        <button className="sg-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="sg-modal-header"><div className="sg-modal-title-tag"><Smile size={14} style={{ marginRight: 8 }} />Share Study Group</div></div>
        <div className="sg-invite-content">
          <h2>Invite your classmates!</h2>
          <p>Share the link and start studying together</p>
          <div className="sg-invite-card-wrap">
              <div className="sg-empty-card sg-empty-card--preview">
                <div className="sg-empty-card-header" style={{ background: group.color }}><div className="sg-card-emoji">{group.emoji}</div></div>
                <div className="sg-empty-card-body"><h3>{group.name}</h3><div className="sg-card-tags"><span>1 member</span></div></div>
              </div>
          </div>
          <div className="sg-invite-actions">
            <button className="sg-copy-link-btn" onClick={handleCopy}>
               {copied ? <Check size={18} /> : <LinkIcon size={18} />}
               {copied ? 'Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function JoinGroupModal({ onClose, user, onJoined }) {
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    if (!code || !user) return
    try {
      setJoining(true)
      // 1. Find group
      const { data: group, error: fetchErr } = await supabase
        .from('study_groups')
        .select('id')
        .eq('invite_code', code.toLowerCase().trim())
        .maybeSingle()

      if (fetchErr) throw fetchErr
      if (!group) return alert('Invalid invite code')

      // 2. Join
      const { error: joinErr } = await supabase
        .from('study_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        })

      if (joinErr) {
        if (joinErr.code === '23505') return alert('You are already in this group!')
        throw joinErr
      }

      onJoined()
    } catch (err) {
      console.error('Error joining group:', err)
      alert('Failed to join group')
    } finally {
      setJoining(false)
    }
  }

  return (
    <motion.div className="sg-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="sg-modal sg-modal--join" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
        <button className="sg-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="sg-join-content">
          <h2>Join with a friend's link</h2>
          <p>Enter the 8-character invite code shared by your friend.</p>
          <div className="sg-join-input-wrap">
             <input 
               className="sg-code-input" 
               placeholder="e.g. ab12cd34" 
               maxLength={8} 
               value={code} 
               onChange={(e) => setCode(e.target.value)}
             />
          </div>
          <button className="sg-gotit-btn" onClick={handleJoin} disabled={code.length < 8 || joining}>
             {joining ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Join Group
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
