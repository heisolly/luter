import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiTeamFill as Users, 
  RiArrowLeftSLine as ChevronLeft, 
  RiShareFill as Share2, 
  RiLinkM as LinkIcon, 
  RiAddLine as Plus, 
  RiMoreFill as MoreHorizontal,
  RiLogoutBoxLine as LogOut,
  RiFolderFill as Folder,
  RiFileTextFill as FileText,
  RiBrainFill as Brain,
  RiChat3Fill as MessageSquare,
  RiShieldFill as Shield,
  RiLoader4Line as Loader2,
  RiCheckLine as Check,
  RiLayoutMasonryFill as Layout,
  RiAddCircleFill as PlusCircle
} from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import './study-groups.css'

export default function StudyGroupDetailsPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useOutletContext()
  
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('Materials') // Materials or Members

  useEffect(() => {
    if (groupId && user) fetchGroupDetails()
  }, [groupId, user])

  async function fetchGroupDetails() {
    try {
      setLoading(true)
      
      // 1. Fetch group data
      const { data: g, error: gErr } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .single()
      
      if (gErr) throw gErr
      setGroup(g)

      // 2. Fetch members (TWO-STEP FETCH to bypass FK error)
      const { data: mRows, error: mErr } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', groupId)
      
      if (mErr) throw mErr

      if (mRows && mRows.length > 0) {
        const userIds = mRows.map(r => r.user_id)
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)
        
        if (pErr) throw pErr

        const joinedMembers = mRows.map(row => ({
          ...row,
          profile: profiles.find(p => p.id === row.user_id)
        }))
        setMembers(joinedMembers)
      } else {
        setMembers([])
      }

    } catch (err) {
      console.error('Error fetching group details:', err)
      navigate('/dashboard/study-groups')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!group) return
    const link = `${window.location.origin}/join/${group.invite_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="sg-loader" style={{ height: '80vh' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
    </div>
  )

  if (!group) return null

  return (
    <div className="sg-olly-container">
      {/* Olly Style Header */}
      <div className="sg-olly-header">
        <div className="sg-olly-title-wrap">
          <button className="sg-olly-back" onClick={() => navigate('/dashboard/study-groups')}>
            <ChevronLeft size={20} />
          </button>
          <h1 className="sg-olly-logo">{group.name}</h1>
        </div>
        
        <div className="sg-olly-actions">
           <button className="sg-olly-add-btn">
             <span>Add a set</span>
           </button>
           <button className="sg-olly-more">
             <MoreHorizontal size={20} />
           </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sg-olly-tabs">
        {['Materials', 'Members'].map(tab => (
          <button 
            key={tab}
            className={`sg-olly-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="sg-olly-content">
        {activeTab === 'Materials' ? (
          <div className="sg-materials-view">
            <div className="sg-olly-list-card">
              <div className="sg-list-icon"><Layout size={20} /></div>
              <div className="sg-list-info">
                <h4>Course Material: {group.name} Docs</h4>
                <p>Documents • 14 files • by you</p>
              </div>
              <button className="sg-list-more"><MoreHorizontal size={18} /></button>
            </div>

            {/* Empty State Visual with Connector */}
            <div className="sg-olly-empty-visual-wrap">
               <div className="sg-visual-grid">
                  <div className="sg-visual-deck-card">
                     <div className="sg-deck-top" />
                     <div className="sg-deck-body">
                        <strong>Your deck</strong>
                        <span>76 cards</span>
                     </div>
                     <div className="sg-shared-tag"><LinkIcon size={10} style={{ marginRight: 4 }} /> Shared</div>
                  </div>

                  <div className="sg-visual-connector">
                     <div className="sg-connector-dash" />
                     <div className="sg-team-pill">
                        <Users size={14} style={{ marginRight: 8 }} />
                        <span>Your study team</span>
                     </div>
                     <div className="sg-connector-dash" />
                  </div>

                  <div className="sg-visual-members-orbit">
                     {members.slice(0, 4).map((m, i) => (
                        <div key={i} className={`sg-orbit-avatar orbit-${i+1}`}>
                           {m.profile?.avatar_url ? (
                             <img src={m.profile.avatar_url} alt="m" />
                           ) : (
                             <div className="sg-orbit-placeholder">{m.profile?.full_name?.charAt(0) || 'S'}</div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>

               <div className="sg-olly-empty-footer">
                  <p>Other members of the group can view your sets and create quizzes.<br />
                  When you edit your study sets, everyone sees the changes.</p>
                  <button className="sg-olly-big-add-btn">
                    <PlusCircle size={18} />
                    <span>Add Deck</span>
                  </button>
               </div>
            </div>
          </div>
        ) : (
          <div className="sg-members-view">
             <div className="sg-olly-members-list">
                {members.map(member => (
                  <div key={member.id} className="sg-olly-member-card">
                    <div className="sg-member-avatar-wrap">
                      {member.profile?.avatar_url ? (
                        <img src={member.profile.avatar_url} alt="pfp" />
                      ) : (
                        <div className="sg-member-avatar-placeholder">
                          {member.profile?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="sg-member-info">
                      <span className="sg-member-name">{member.profile?.full_name || 'Anonymous User'}</span>
                      <span className="sg-member-role">{member.role === 'admin' ? 'Group Admin' : 'Member'}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
