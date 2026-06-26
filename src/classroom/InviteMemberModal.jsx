import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X, Copy, Check } from '@phosphor-icons/react';

export default function InviteMemberModal({ classId, classCode, initialRole, onClose, onInviteSuccess }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(initialRole || 'student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/classroom?code=${classCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return;

    setLoading(true);

    try {
      // 1. Find profile by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .eq('email', targetEmail)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        setError('No user found with this email in Luter. Ask them to sign up first!');
        setLoading(false);
        return;
      }

      // 2. Add them as a member of this classroom session
      const { error: joinError } = await supabase
        .from('deck_session_members')
        .upsert({
          session_id: classId,
          user_id: profile.id,
          role: role,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'session_id,user_id' });

      if (joinError) throw joinError;

      setSuccess(`Successfully added ${profile.username || profile.full_name || email} as a ${role}!`);
      setEmail('');
      if (onInviteSuccess) onInviteSuccess();
    } catch (err) {
      console.error('[Invite] Error adding member:', err);
      setError(err.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyinit: 'center', justifyContent: 'center', zIndex: 1200
    }}>
      <div style={{
        background: 'white', borderRadius: '8px', padding: '24px',
        width: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#202124', fontWeight: 600 }}>
            Invite {role === 'teacher' ? 'Teachers' : 'Students'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#5f6368" />
          </button>
        </div>

        {/* Invite link/code details */}
        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #dadce0' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#3c4043', marginBottom: '6px' }}>Class Invite Link</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              readOnly
              value={inviteLink}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #dadce0',
                background: '#e9ecef', fontSize: '12px', color: '#495057', outline: 'none'
              }}
            />
            <button onClick={handleCopyLink} style={{
              background: '#1a73e8', color: 'white', border: 'none', padding: '8px 12px',
              borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#70757a', marginTop: '8px' }}>
            Class Code: <strong style={{ color: '#1a73e8' }}>{classCode}</strong>
          </div>
        </div>

        {/* Email form to add directly */}
        <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            Add by Email
            <input
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: '10px 14px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '14px', outline: 'none' }}
              onFocus={e => e.target.style.border = '1px solid #1a73e8'}
              onBlur={e => e.target.style.border = '1px solid #dadce0'}
            />
          </label>

          <label style={{ fontSize: '13px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '14px' }}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </label>

          {error && <div style={{ color: '#d93025', fontSize: '13px', fontWeight: 500 }}>{error}</div>}
          {success && <div style={{ color: '#1e7e34', fontSize: '13px', fontWeight: 500 }}>{success}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: '1px solid #dadce0', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                background: loading || !email.trim() ? '#f1f3f4' : '#1a73e8',
                color: loading || !email.trim() ? '#70757a' : 'white',
                border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 500
              }}
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
