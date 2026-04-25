import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { RiLoader4Line as Loader2, RiTeamFill as Users, RiAlertFill as AlertCircle } from 'react-icons/ri'

export default function JoinGroupPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (inviteCode) {
      handleJoin()
    }
  }, [inviteCode])

  async function handleJoin() {
    try {
      setLoading(true)
      
      // 1. Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Store the invite code to join after login
        sessionStorage.setItem('pending_invite_code', inviteCode)
        navigate(`/signin?redirect=/join/${inviteCode}`)
        return
      }

      // 2. Find the group by invite code
      const { data: group, error: groupErr } = await supabase
        .from('study_groups')
        .select('id, name')
        .eq('invite_code', inviteCode)
        .single()
      
      if (groupErr || !group) {
        throw new Error('Invalid or expired invite link.')
      }

      // 3. Join the group (upsert as member)
      const { error: joinErr } = await supabase
        .from('study_group_members')
        .upsert({
          group_id: group.id,
          user_id: user.id,
          role: 'member' // Default to member
        }, { onConflict: 'group_id, user_id' })
      
      if (joinErr) throw joinErr

      // 4. Success! Redirect to group details
      navigate(`/dashboard/study-groups/${group.id}`)
    } catch (err) {
      console.error('Error joining group:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#fff',
      padding: 24,
      fontFamily: "'Outfit', sans-serif"
    }}>
      {loading ? (
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} color="var(--primary)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Joining Study Group...</h2>
          <p style={{ color: '#666', fontWeight: 600 }}>Building your collaboration space.</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ 
            width: 64, height: 64, background: '#fee2e2', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 24px', color: '#dc2626' 
          }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Oops!</h2>
          <p style={{ color: '#666', fontWeight: 600, marginBottom: 32 }}>{error}</p>
          <button 
            onClick={() => navigate('/dashboard/study-groups')}
            style={{ 
              background: '#111', color: 'white', padding: '14px 28px', 
              borderRadius: 16, border: 'none', fontWeight: 800, cursor: 'pointer' 
            }}
          >
            Back to Study Groups
          </button>
        </div>
      ) : null}
    </div>
  )
}
