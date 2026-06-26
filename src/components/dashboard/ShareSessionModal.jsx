import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Users, Sparkles, Share2, ToggleLeft, ToggleRight, Loader } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'
import { supabase } from '../../supabaseClient'

const PROFILE_SELECT = 'id, full_name, username'

const getProfileName = (profile, fallback) => (
  profile?.username || profile?.full_name || fallback
)

export default function ShareSessionModal({ isOpen, onClose, sessionId, session: initialSession, materialId = null }) {
  const { shareSession, updateSession } = useSessionStore()
  
  const [session, setSession] = useState(initialSession || null)
  const [isToggling, setIsToggling] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const getInviteLink = () => {
    if (!session?.share_code) return ''
    const materialParam = materialId ? `&materialId=${encodeURIComponent(materialId)}` : ''
    return `${window.location.origin}/home?join=${session.share_code}${materialParam}`
  }

  // Load session from db if not passed, or refresh it
  const loadSessionDetails = async () => {
    if (!sessionId) return
    try {
      const { data, error } = await supabase
        .from('deck_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      if (!error && data) {
        setSession(data)
      }
    } catch (err) {
      console.error('[ShareModal] Failed to load session:', err)
    }
  }

  const fetchMembers = async () => {
    if (!sessionId || !session) return
    setLoadingMembers(true)
    try {
      const { data, error } = await supabase
        .from('deck_session_members')
        .select('*')
        .eq('session_id', sessionId)
      
      if (error) throw error

      if (data && data.length > 0) {
        const userIds = data.map(m => m.user_id)
        
        // Always include owner
        if (!userIds.includes(session.user_id)) {
          userIds.push(session.user_id)
        }

        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select(PROFILE_SELECT)
          .in('id', userIds)
        
        if (pErr) throw pErr

        const ownerProfile = profiles?.find(p => p.id === session.user_id)

        const mapped = data.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id)
          return {
            ...member,
            name: getProfileName(profile, 'Peer Student'),
            email: ''
          }
        })

        const allMembers = []
        if (ownerProfile) {
          allMembers.push({
            id: 'owner-' + session.user_id,
            user_id: session.user_id,
            role: 'owner',
            name: getProfileName(ownerProfile, 'Owner'),
            email: '',
          })
        }

        mapped.forEach(m => {
          if (m.user_id !== session.user_id) {
            allMembers.push(m)
          }
        })

        setMembers(allMembers)
      } else {
        // Fallback: Just show the owner
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select(PROFILE_SELECT)
          .eq('id', session.user_id)
          .single()

        if (ownerProfile) {
          setMembers([{
            id: 'owner-' + session.user_id,
            user_id: session.user_id,
            role: 'owner',
            name: getProfileName(ownerProfile, 'Owner'),
            email: '',
          }])
        } else {
          setMembers([])
        }
      }
    } catch (err) {
      console.error('[ShareModal] Error loading members:', err)
    } finally {
      setLoadingMembers(false)
    }
  }

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionDetails()
    }
  }, [isOpen, sessionId])

  useEffect(() => {
    if (isOpen && sessionId && session) {
      fetchMembers()
    }
  }, [isOpen, sessionId, session?.id, session?.user_id])

  const handleToggleShare = async () => {
    if (isToggling || !session) return
    setIsToggling(true)

    try {
      const targetState = !session.is_shared
      if (targetState) {
        // Turn ON sharing
        const result = await shareSession(session.id)
        if (result.success) {
          await loadSessionDetails()
          fetchMembers()
        }
      } else {
        // Turn OFF sharing
        const result = await updateSession(session.id, { is_shared: false })
        if (result.success) {
          await loadSessionDetails()
        }
      }
    } catch (err) {
      console.error('[ShareModal] Failed to toggle sharing:', err)
    } finally {
      setIsToggling(false)
    }
  }

  const handleCopyLink = () => {
    if (!session?.share_code) return
    navigator.clipboard.writeText(getInviteLink())
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCode = () => {
    if (!session?.share_code) return
    navigator.clipboard.writeText(session.share_code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30, 27, 75, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20
      }}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: '480px',
            position: 'relative',
            fontFamily: 'var(--font-display, system-ui, sans-serif)',
            overflow: 'hidden'
          }}
        >
          {/* Top Gradient Header */}
          <div style={{
            background: 'linear-gradient(135deg, #C4B5FD 0%, #98FF98 100%)',
            padding: '36px 32px 56px 32px',
            position: 'relative',
            color: '#1E1B4B'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.8)'
              }}>
                <Share2 size={26} color="#4C1D95" />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#1E1B4B' }}>
                  Share Session
                </h2>
                <p style={{ fontSize: '14px', margin: 0, color: 'rgba(30, 27, 75, 0.7)', fontWeight: 600 }}>
                  {session?.session_name || 'Study Session'}
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '24px', right: '24px', padding: '8px',
              background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '50%',
              cursor: 'pointer', color: '#4C1D95', transition: 'all 0.2s ease', backdropFilter: 'blur(4px)',
              zIndex: 10
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          {/* Content Body */}
          <div style={{ padding: '0 32px 32px 32px', marginTop: '-28px', position: 'relative' }}>
            
            {/* Toggle Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: session?.is_shared ? '0 8px 24px rgba(196, 181, 253, 0.25), 0 0 0 1.5px #C4B5FD' : '0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px #E2E8F0',
              marginBottom: '24px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: session?.is_shared ? 'rgba(152, 255, 152, 0.15)' : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.3s'
                }}>
                  <Sparkles size={20} color={session?.is_shared ? "#059669" : "#64748B"} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                    Enable Sharing
                  </div>
                  <div style={{ fontSize: '12px', color: session?.is_shared ? '#059669' : '#64748B', fontWeight: 600 }}>
                    Let others join and study with you
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleShare}
                disabled={isToggling}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: isToggling ? 'not-allowed' : 'pointer',
                  color: session?.is_shared ? '#10B981' : '#CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  transition: 'color 0.3s'
                }}
              >
                {isToggling ? (
                  <Loader size={36} className="animate-spin" color="#10B981" />
                ) : session?.is_shared ? (
                  <ToggleRight size={42} style={{ strokeWidth: 1.5 }} />
                ) : (
                  <ToggleLeft size={42} style={{ strokeWidth: 1.5 }} />
                )}
              </button>
            </div>

            {/* Share Links and Code Details */}
            <AnimatePresence>
              {session?.is_shared && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                    {/* Copy invite link */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Collaboration Link
                      </label>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '6px 6px 6px 16px',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={handleCopyLink}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#C4B5FD'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                      >
                        <span style={{
                          fontSize: '13px',
                          color: '#334155',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {getInviteLink()}
                        </span>
                        <button
                          style={{
                            padding: '8px 16px',
                            background: copiedLink ? '#98FF98' : '#7C3AED',
                            color: copiedLink ? '#065F46' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            boxShadow: copiedLink ? '0 4px 12px rgba(152, 255, 152, 0.2)' : '0 4px 12px rgba(124, 58, 237, 0.25)'
                          }}
                        >
                          {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                          {copiedLink ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Copy Code */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Invite Code
                      </label>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '6px 6px 6px 16px',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={handleCopyCode}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#C4B5FD'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                      >
                        <span style={{
                          fontSize: '16px',
                          fontWeight: 800,
                          color: '#7C3AED',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          flex: 1
                        }}>
                          {session.share_code}
                        </span>
                        <button
                          style={{
                            padding: '8px 16px',
                            background: copiedCode ? '#98FF98' : '#F1F5F9',
                            color: copiedCode ? '#065F46' : '#475569',
                            border: copiedCode ? 'none' : '1px solid #E2E8F0',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                          }}
                        >
                          {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                          {copiedCode ? 'Copied' : 'Copy Code'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Session Members Listing */}
            <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '20px', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Users size={16} color="#7C3AED" />
                  <span>Session Members</span>
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#1E1B4B',
                  background: 'linear-gradient(135deg, #C4B5FD, #98FF98)',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                }}>
                  {members.length} Total
                </div>
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {loadingMembers ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: '#64748B', gap: '10px', fontSize: '14px', fontWeight: 500 }}>
                    <Loader size={18} className="animate-spin" color="#7C3AED" />
                    <span>Loading members...</span>
                  </div>
                ) : members.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', fontSize: '14px', color: '#94A3B8', fontWeight: 500, background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
                    No one has joined yet. Share the link!
                  </div>
                ) : (
                  members.map((member) => {
                    const COLOURS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
                    const colorIdx = member.name.charCodeAt(0) % COLOURS.length;
                    const color = COLOURS[colorIdx];
                    const isOwner = member.role === 'owner' || member.role === 'teacher';

                    return (
                      <div
                        key={member.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          cursor: 'default'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            color: 'white',
                            fontWeight: 800,
                            boxShadow: `0 4px 10px ${color}40`
                          }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>
                              {member.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                              {member.email}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '4px 10px',
                          borderRadius: '99px',
                          background: isOwner ? '#F5F3FF' : '#F1F5F9',
                          color: isOwner ? '#7C3AED' : '#64748B',
                          letterSpacing: '0.05em'
                        }}>
                          {member.role}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
