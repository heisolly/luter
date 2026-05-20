import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Users, Sparkles, Share2, ToggleLeft, ToggleRight, Loader } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'
import { supabase } from '../../supabaseClient'

export default function ShareSessionModal({ isOpen, onClose, sessionId, session: initialSession }) {
  const { shareSession, updateSession } = useSessionStore()
  
  const [session, setSession] = useState(initialSession || null)
  const [isToggling, setIsToggling] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

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
    if (!sessionId) return
    setLoadingMembers(true)
    try {
      const { data, error } = await supabase
        .from('deck_session_members')
        .select('*')
        .eq('session_id', sessionId)
      
      if (error) throw error

      if (data && data.length > 0) {
        const userIds = data.map(m => m.user_id)
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)
        
        if (pErr) throw pErr

        const mapped = data.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id)
          return {
            ...member,
            name: profile?.full_name || profile?.email?.split('@')[0] || 'Peer Student',
            email: profile?.email || ''
          }
        })
        setMembers(mapped)
      } else {
        setMembers([])
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
      fetchMembers()
    }
  }, [isOpen, sessionId])

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
    const link = `${window.location.origin}/dashboard/sessions?join=${session.share_code}`
    navigator.clipboard.writeText(link)
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
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20
      }}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            border: '1px solid rgba(124, 58, 237, 0.15)',
            boxShadow: '0 20px 50px rgba(109, 40, 217, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
            padding: '32px',
            width: '100%',
            maxWidth: '480px',
            position: 'relative',
            fontFamily: 'var(--font-outfit, system-ui, sans-serif)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '6px',
              background: 'rgba(243, 244, 246, 0.6)',
              border: '1px solid rgba(229, 231, 235, 0.8)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FEE2E2'
              e.currentTarget.style.color = '#EF4444'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(243, 244, 246, 0.6)'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            <X size={18} />
          </button>

          {/* Title Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #C084FC 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
            }}>
              <Share2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Share Study Session
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 500 }}>
                {session?.session_name || 'Study Session'}
              </p>
            </div>
          </div>

          {/* Toggle Sharing Row */}
          <div style={{
            background: 'rgba(245, 243, 255, 0.5)',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Sparkles size={18} color="#7C3AED" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E1B4B' }}>
                  Enable Session Sharing
                </div>
                <div style={{ fontSize: '12px', color: '#6D28D9', fontWeight: 500 }}>
                  Let others join and study in real-time
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
                color: session?.is_shared ? '#7C3AED' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
            >
              {isToggling ? (
                <Loader size={30} className="animate-spin text-purple-600" />
              ) : session?.is_shared ? (
                <ToggleRight size={36} style={{ strokeWidth: 1.5 }} />
              ) : (
                <ToggleLeft size={36} style={{ strokeWidth: 1.5 }} />
              )}
            </button>
          </div>

          {/* Share Links and Code Details */}
          {session?.is_shared && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}
            >
              {/* Copy invite link */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Collaboration Link
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '4px 6px 4px 14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <span style={{
                    fontSize: '13px',
                    color: '#64748B',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {window.location.origin}/dashboard/sessions?join={session.share_code}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      padding: '8px 16px',
                      background: copiedLink ? '#10B981' : '#7C3AED',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                      boxShadow: copiedLink ? '0 2px 6px rgba(16, 185, 129, 0.2)' : '0 2px 6px rgba(124, 58, 237, 0.2)'
                    }}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Copy Code */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Invite Code
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '4px 6px 4px 14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#1E293B',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    flex: 1
                  }}>
                    {session.share_code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      padding: '8px 16px',
                      background: copiedCode ? '#10B981' : '#F3F4F6',
                      color: copiedCode ? 'white' : '#475569',
                      border: copiedCode ? 'none' : '1px solid #E2E8F0',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Session Members Listing */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Users size={15} />
                <span>Session Members</span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#7C3AED',
                background: '#F5F3FF',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid #EDE9FE'
              }}>
                {members.length} Total
              </span>
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingMembers ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', color: '#64748B', gap: '8px', fontSize: '13px' }}>
                  <Loader size={16} className="animate-spin" />
                  <span>Loading members...</span>
                </div>
              ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
                  No members have joined this session yet.
                </div>
              ) : (
                members.map((member) => {
                  const COLOURS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#0891B2'];
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
                        padding: '10px 12px',
                        background: '#F8FAFC',
                        borderRadius: '12px',
                        border: '1px solid #F1F5F9'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          color: 'white',
                          fontWeight: 700
                        }}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isOwner ? '#F5F3FF' : '#E2E8F0',
                        color: isOwner ? '#7C3AED' : '#475569',
                        letterSpacing: '0.04em'
                      }}>
                        {member.role}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
