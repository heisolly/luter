import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserMinus, Shield, ShieldAlert, Loader } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useSessionStore } from '../../store/useSessionStore'

const PROFILE_SELECT = 'id, full_name, username'

const getProfileName = (profile, fallback) => (
  profile?.username || profile?.full_name || fallback
)

export default function SessionMembersList({ session, user }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  
  const { removeMemberFromSession } = useSessionStore()

  const isOwner = session?.user_id === user?.id

  useEffect(() => {
    if (session?.id) {
      fetchMembers()
    }
  }, [session?.id])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('deck_session_members')
        .select('*')
        .eq('session_id', session.id)
      
      if (error) throw error

      if (data && data.length > 0) {
        const userIds = data.map(m => m.user_id)
        
        // Always include owner in the fetch if they aren't in the list
        if (session.user_id && !userIds.includes(session.user_id)) {
          userIds.push(session.user_id)
        }

        let profiles = []
        try {
          const { data: pData, error: pErr } = await supabase
            .from('profiles')
            .select(PROFILE_SELECT)
            .in('id', userIds)
          
          if (!pErr && pData) {
            profiles = pData
          } else if (pErr) {
            console.error('Error fetching profiles:', pErr)
          }
        } catch (e) {
          console.error('Error fetching profiles:', e)
        }

        const ownerProfile = profiles?.find(p => p.id === session.user_id)
        
        const mapped = data.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id)
          return {
            ...member,
            name: getProfileName(profile, member.user_id === user?.id ? user?.email?.split('@')[0] || 'You' : 'Peer Student'),
            email: member.user_id === user?.id ? user?.email || '' : ''
          }
        })

        // Ensure owner is at the top, even if not explicitly in deck_session_members yet
        const allMembers = []
        if (session.user_id) {
          allMembers.push({
            session_id: session.id,
            user_id: session.user_id,
            role: 'owner',
            name: getProfileName(ownerProfile, session.user_id === user?.id ? user?.email?.split('@')[0] || 'You' : 'Owner'),
            email: session.user_id === user?.id ? user?.email || '' : '',
            last_seen_at: session.updated_at
          })
        }

        mapped.forEach(m => {
          if (m.user_id !== session.user_id) {
            allMembers.push(m)
          }
        })

        setMembers(allMembers)
      } else {
        // Just show owner
        if (!session.user_id) {
          setMembers([])
          return
        }

        let ownerProfile = null
        try {
          const { data: opData } = await supabase
            .from('profiles')
            .select(PROFILE_SELECT)
            .eq('id', session.user_id)
            .maybeSingle()
          ownerProfile = opData
        } catch (e) {
          console.error('Error fetching owner profile:', e)
        }

        setMembers([{
          session_id: session.id,
          user_id: session.user_id,
          role: 'owner',
          name: getProfileName(ownerProfile, session.user_id === user?.id ? user?.email?.split('@')[0] || 'You' : 'Owner'),
          email: session.user_id === user?.id ? user?.email || '' : '',
          last_seen_at: session.updated_at
        }])
      }
    } catch (err) {
      console.error('Error fetching members:', err)
      // Fallback to just showing the owner if everything else fails
      if (session?.user_id) {
        setMembers([{
          session_id: session.id,
          user_id: session.user_id,
          role: 'owner',
          name: 'Owner',
          email: '',
          last_seen_at: session.updated_at
        }])
      } else {
        setMembers([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return
    setRemovingId(targetUserId)
    const result = await removeMemberFromSession(session.id, targetUserId)
    if (result.success) {
      setMembers(members.filter(m => m.user_id !== targetUserId))
    } else {
      alert("Failed to remove member: " + result.error)
    }
    setRemovingId(null)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Loader className="animate-spin" size={24} color="#7C3AED" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '16px'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#7C3AED'
        }}>
          <Users size={20} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1E293B' }}>Session Members</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Manage who has access to this collaborative session.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence>
          {members.map((member) => (
            <motion.div 
              key={member.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: member.role === 'owner' ? '#FEF3C7' : '#F1F5F9',
                  color: member.role === 'owner' ? '#D97706' : '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, fontSize: '16px'
                }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                      {member.name} {member.user_id === user?.id ? '(You)' : ''}
                    </h4>
                    {member.role === 'owner' && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '11px', fontWeight: 700, color: '#D97706',
                        background: '#FEF3C7', padding: '2px 8px', borderRadius: '12px'
                      }}>
                        <Shield size={12} />
                        Owner
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                    {member.email}
                  </div>
                </div>
              </div>

              {isOwner && member.user_id !== session.user_id && (
                <button
                  onClick={() => handleRemoveMember(member.user_id)}
                  disabled={removingId === member.user_id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 12px', borderRadius: '8px',
                    background: '#FEF2F2', color: '#EF4444', border: 'none',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: removingId === member.user_id ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#FEF2F2'}
                >
                  {removingId === member.user_id ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <UserMinus size={14} />
                  )}
                  Remove
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
