import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import EmailEditor from 'react-email-editor'
import { PaperPlaneTilt, FloppyDisk, CaretLeft, CircleNotch, List, MagnifyingGlass, Funnel, X, CheckSquareOffset, Square } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export default function AdminEmailMarketing() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Editor View State
  const [view, setView] = useState('list') // 'list' | 'editor'
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Editor Form State
  const [subject, setSubject] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('all') // 'all' | 'active' | 'specific'
  const [selectedUsers, setSelectedUsers] = useState([]) // Array of user IDs
  const [allUsers, setAllUsers] = useState([])

  const emailEditorRef = useRef(null)

  // Fetch all users for the specific filter
  useEffect(() => {
    async function fetchAllUsers() {
      const { data } = await supabase.from('profiles').select('id, full_name').order('full_name')
      if (data) setAllUsers(data)
    }
    fetchAllUsers()
  }, [])

  useEffect(() => {
    if (view === 'list') {
      loadCampaigns()
    }
  }, [view])

  const loadCampaigns = async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (e) setError(e.message)
    else setCampaigns(data || [])
    setLoading(false)
  }

  const createNewCampaign = () => {
    setEditingCampaign(null)
    setSubject('')
    setAudienceFilter('all')
    setSelectedUsers([])
    setView('editor')
  }

  const openCampaign = (campaign) => {
    setEditingCampaign(campaign)
    setSubject(campaign.subject || '')
    setAudienceFilter(campaign.audience_filter?.type || 'all')
    setSelectedUsers(campaign.audience_filter?.userIds || [])
    setView('editor')
  }

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const selectAllUsers = () => {
    if (selectedUsers.length === allUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(allUsers.map(u => u.id))
    }
  }

  const onEditorLoad = () => {
    if (editingCampaign?.design_json && emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.loadDesign(editingCampaign.design_json)
    }
  }

  const onEditorReady = () => {
    // Fired when editor is fully ready
  }

  const saveDraft = () => {
    if (!subject.trim()) {
      alert("Please enter a subject line before saving.")
      return
    }

    if (!emailEditorRef.current?.editor) return

    setSaving(true)
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data
      
      const payload = {
        subject: subject.trim(),
        design_json: design,
        html_body: html,
        audience_filter: { 
          type: audienceFilter,
          userIds: audienceFilter === 'specific' ? selectedUsers : null
        },
        status: 'draft',
      }

      try {
        let res
        if (editingCampaign?.id) {
          res = await supabase.from('email_campaigns').update(payload).eq('id', editingCampaign.id).select().single()
        } else {
          res = await supabase.from('email_campaigns').insert(payload).select().single()
        }

        if (res.error) throw new Error(res.error.message)
        
        setEditingCampaign(res.data)
        alert("Draft saved successfully!")
      } catch (err) {
        alert("Failed to save draft: " + err.message)
      } finally {
        setSaving(false)
      }
    })
  }

  const triggerSend = () => {
    if (!editingCampaign?.id) {
      alert("Please save as a draft first before sending.")
      return
    }
    
    if (!confirm("Are you sure you want to send this email to the selected audience? This cannot be undone.")) return

    if (!emailEditorRef.current?.editor) return

    setSending(true)
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { html } = data
      
      // Securely query user emails via RPC function (only accessible by admins)
      const { data: users, error: fetchErr } = await supabase.rpc('get_target_emails', {
        p_audience_filter: audienceFilter,
        p_specific_user_ids: audienceFilter === 'specific' ? selectedUsers : null
      })

      if (fetchErr) {
        alert("Failed to fetch target audience: " + fetchErr.message + ". Make sure you have pushed the latest database migrations.")
        setSending(false)
        return
      }

      const emails = users.filter(Boolean)

      if (emails.length === 0) {
        alert("No users found for this audience filter.")
        setSending(false)
        return
      }

      try {
        const BATTLE_SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
        const response = await fetch(`${BATTLE_SERVER_URL}/api/send-campaign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subject: editingCampaign.subject,
            html: html,
            emails: emails
          })
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Failed to send campaign")

        // Update status to 'sent'
        const { error } = await supabase
          .from('email_campaigns')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', editingCampaign.id)

        if (error) throw error
        
        alert(`Campaign dispatched successfully! Sent to ${emails.length} users.`)
        setView('list')
      } catch (err) {
        alert("Error sending campaign: " + err.message)
      } finally {
        setSending(false)
      }
    })
  }

  if (view === 'editor') {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 9999, 
        background: 'var(--adm-bg, #f8fafc)', 
        padding: '24px',
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        width: '100vw',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="adm-btn adm-btn--ghost" onClick={() => setView('list')}>
              <CaretLeft size={16} /> Back
            </button>
            <h1 className="adm-page-title" style={{ margin: 0, fontSize: 20 }}>
              {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="adm-btn adm-btn--ghost" onClick={saveDraft} disabled={saving || sending}>
              {saving ? <CircleNotch className="animate-spin" size={16} /> : <FloppyDisk size={16} />}
              Save Draft
            </button>
            <button className="adm-btn adm-btn--primary" onClick={triggerSend} disabled={saving || sending || (editingCampaign?.status === 'sent')}>
              {sending ? <CircleNotch className="animate-spin" size={16} /> : <PaperPlaneTilt size={16} />}
              {editingCampaign?.status === 'sent' ? 'Already Sent' : 'Send Campaign'}
            </button>
          </div>
        </div>

        <div className="adm-card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 24, flexShrink: 0, flexWrap: 'wrap' }}>
          <label style={{ flex: '1 1 300px' }}>
            <span className="adm-muted" style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Subject Line</span>
            <input 
              className="adm-input" 
              style={{ width: '100%' }} 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              placeholder="e.g., Important Update on your Luter Courses!"
            />
          </label>
          
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ width: '100%' }}>
              <span className="adm-muted" style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Target Audience</span>
              <select className="adm-input" style={{ width: '100%' }} value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}>
                <option value="all">All Users</option>
                <option value="active">Active within 30 days</option>
                <option value="admins_only">Test Mode (Admins Only)</option>
                <option value="specific">Specific Users</option>
              </select>
            </label>

            {audienceFilter === 'specific' && (
              <div style={{ 
                border: '1px solid var(--adm-border)', 
                borderRadius: 8, 
                background: 'white', 
                overflow: 'hidden',
                display: 'flex', 
                flexDirection: 'column',
                maxHeight: 200
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--adm-bg)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{selectedUsers.length} Selected</span>
                  <button onClick={selectAllUsers} className="adm-btn adm-btn--ghost" style={{ padding: '4px 8px', fontSize: 11, minHeight: 24 }}>
                    {selectedUsers.length === allUsers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, padding: 8 }}>
                  {allUsers.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', cursor: 'pointer', borderRadius: 4 }}>
                      {selectedUsers.includes(u.id) ? 
                        <CheckSquareOffset size={18} weight="fill" color="var(--adm-accent, #7a12cc)" /> : 
                        <Square size={18} color="var(--adm-text-muted)" />
                      }
                      <span style={{ fontSize: 13, userSelect: 'none' }}>{u.full_name}</span>
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleUserSelection(u.id)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  ))}
                  {allUsers.length === 0 && <div style={{ padding: 12, fontSize: 12, textAlign: 'center', color: 'var(--adm-text-muted)' }}>No users found.</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', borderRadius: 12 }}>
          <EmailEditor
            ref={emailEditorRef}
            onLoad={onEditorLoad}
            onReady={onEditorReady}
            minHeight="100%"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="adm-page-title">Email Marketing</h1>
          <p className="adm-page-desc">Design and dispatch mass email campaigns to your users.</p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={createNewCampaign}>
          Create Campaign
        </button>
      </div>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-card">
        <div className="adm-toolbar">
          <span className="adm-muted" style={{ fontWeight: 600 }}>Campaign History</span>
        </div>
        
        <div className="adm-table-wrap">
          {loading ? (
            <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
              <CircleNotch className="animate-spin" color="#7a12cc" />
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--adm-text-muted)' }}>
              No campaigns found. Create your first one above!
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Audience</th>
                  <th>Created</th>
                  <th>Sent At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.subject}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: 12, 
                        fontSize: 12, 
                        fontWeight: 700,
                        backgroundColor: c.status === 'sent' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: c.status === 'sent' ? '#10b981' : '#d97706'
                      }}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{c.audience_filter?.type || 'All'}</td>
                    <td className="adm-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="adm-muted">{c.sent_at ? new Date(c.sent_at).toLocaleString() : '—'}</td>
                    <td>
                      <button className="adm-btn adm-btn--ghost" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => openCampaign(c)}>
                        {c.status === 'sent' ? 'View' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
