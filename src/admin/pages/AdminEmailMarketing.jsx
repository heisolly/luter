import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../supabaseClient'
import EmailEditor from 'react-email-editor'
import { PaperPlaneTilt, FloppyDisk, CaretLeft, CircleNotch, List, MagnifyingGlass, Funnel, X } from '@phosphor-icons/react'
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
  const [editorLoaded, setEditorLoaded] = useState(false)
  
  // Editor Form State
  const [subject, setSubject] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('all') // 'all' | 'active' | 'specific'
  const [selectedUsers, setSelectedUsers] = useState([]) // Array of { id, name, email }
  const [userSearchQ, setUserSearchQ] = useState('')
  const [userSearchResults, setUserSearchResults] = useState([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const emailEditorRef = useRef(null)

  // Live user search for "specific" audience filter
  useEffect(() => {
    if (audienceFilter !== 'specific' || !userSearchQ.trim()) {
      setUserSearchResults([])
      return
    }
    const handler = setTimeout(async () => {
      setIsSearchingUsers(true)
      try {
        // Query profiles for id and name. The backend RPC will resolve the emails via id.
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .ilike('full_name', `%${userSearchQ}%`)
          .limit(5)
        if (!error && data) setUserSearchResults(data)
      } catch (err) {
        console.error('Error searching users:', err)
      } finally {
        setIsSearchingUsers(false)
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [userSearchQ, audienceFilter])

  const toggleUserSelection = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
    setUserSearchQ('')
    setUserSearchResults([])
  }

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
    setEditorLoaded(false)
    setView('editor')
  }

  const openCampaign = (campaign) => {
    setEditingCampaign(campaign)
    setSubject(campaign.subject || '')
    setAudienceFilter(campaign.audience_filter?.type || 'all')
    setSelectedUsers(campaign.audience_filter?.userIds ? campaign.audience_filter.users || [] : [])
    setEditorLoaded(false)
    setView('editor')
  }

  const onEditorLoad = () => {
    if (editingCampaign && editingCampaign.design_json) {
      emailEditorRef.current.editor.loadDesign(editingCampaign.design_json)
    }
    // Fallback if onReady doesn't fire for some reason
    setTimeout(() => setEditorLoaded(true), 1500)
  }

  const saveDraft = async () => {
    if (!subject.trim()) {
      alert("Please enter a subject line before saving.")
      return
    }

    setSaving(true)
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data
      
      const payload = {
        subject: subject.trim(),
        design_json: design,
        html_body: html,
        audience_filter: { 
          type: audienceFilter,
          userIds: audienceFilter === 'specific' ? selectedUsers.map(u => u.id) : null,
          users: audienceFilter === 'specific' ? selectedUsers : null
        },
        status: 'draft',
      }

      let res
      if (editingCampaign?.id) {
        res = await supabase.from('email_campaigns').update(payload).eq('id', editingCampaign.id).select().single()
      } else {
        res = await supabase.from('email_campaigns').insert(payload).select().single()
      }

      if (res.error) {
        alert("Failed to save draft: " + res.error.message)
      } else {
        setEditingCampaign(res.data)
        alert("Draft saved successfully!")
      }
      setSaving(false)
    })
  }

  const triggerSend = async () => {
    if (!editingCampaign?.id) {
      alert("Please save as a draft first before sending.")
      return
    }
    if (!confirm("Are you sure you want to send this email to the selected audience? This cannot be undone.")) return
    
    setSending(true)
    
    // Securely query user emails via RPC function (only accessible by admins)
    const { data: users, error: fetchErr } = await supabase.rpc('get_target_emails', {
      p_audience_filter: audienceFilter,
      p_specific_user_ids: audienceFilter === 'specific' ? selectedUsers.map(u => u.id) : null
    })

    if (fetchErr) {
      alert("Failed to fetch target audience: " + fetchErr.message + ". Make sure you have pushed the latest database migrations.")
      setSending(false)
      return
    }

    // Since RPC returns SETOF TEXT, data is an array of strings
    const emails = users.filter(Boolean)

    if (emails.length === 0) {
      alert("No users found for this audience filter.")
      setSending(false)
      return
    }

    try {
      // Post to our local Express/Battle server which handles the Resend API
      const BATTLE_SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
      const response = await fetch(`${BATTLE_SERVER_URL}/api/send-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject: editingCampaign.subject,
          html: editingCampaign.html_body,
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
    }
    
    setSending(false)
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

        <div className="adm-card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 24, flexShrink: 0 }}>
          <label style={{ flex: 1 }}>
            <span className="adm-muted" style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Subject Line</span>
            <input 
              className="adm-input" 
              style={{ width: '100%' }} 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              placeholder="e.g., Important Update on your Luter Courses!"
            />
          </label>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ width: 250 }}>
              <span className="adm-muted" style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Target Audience</span>
              <select className="adm-input" style={{ width: '100%' }} value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}>
                <option value="all">All Users</option>
                <option value="active">Active within 30 days</option>
                <option value="admins_only">Test Mode (Admins Only)</option>
                <option value="specific">Specific Users</option>
              </select>
            </label>

            {audienceFilter === 'specific' && (
              <div style={{ position: 'relative', width: 250 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="adm-input"
                    style={{ width: '100%', paddingLeft: 32 }}
                    placeholder="Search users to add..."
                    value={userSearchQ}
                    onChange={(e) => setUserSearchQ(e.target.value)}
                  />
                  <MagnifyingGlass size={16} color="var(--adm-text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  {isSearchingUsers && <CircleNotch size={14} className="animate-spin" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }} />}
                </div>

                {userSearchResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'white', border: '1px solid var(--adm-border)',
                    borderRadius: 8, marginTop: 4, zIndex: 1000,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    maxHeight: 200, overflowY: 'auto'
                  }}>
                    {userSearchResults.map(u => (
                      <div
                        key={u.id}
                        onClick={() => toggleUserSelection(u)}
                        style={{
                          padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                          borderBottom: '1px solid var(--adm-border)',
                          background: selectedUsers.find(su => su.id === u.id) ? 'var(--adm-bg)' : 'white'
                        }}
                      >
                        {u.full_name}
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedUsers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {selectedUsers.map(u => (
                      <span key={u.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 8px', background: 'var(--adm-accent-light, #e0e7ff)',
                        color: 'var(--adm-accent-dark, #4338ca)', borderRadius: 16, fontSize: 12, fontWeight: 500
                      }}>
                        {u.full_name?.split(' ')[0]}
                        <X size={12} weight="bold" style={{ cursor: 'pointer' }} onClick={() => toggleUserSelection(u)} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="adm-card" style={{ flex: 1, overflow: 'hidden', border: '1px solid var(--adm-border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            {!editorLoaded && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(248, 250, 252, 0.8)', zIndex: 10,
                backdropFilter: 'blur(4px)', flexDirection: 'column', gap: 12
              }}>
                <CircleNotch size={32} className="animate-spin" color="var(--adm-accent, #7a12cc)" />
                <span style={{ fontWeight: 600, color: 'var(--adm-text)' }}>Initializing Editor...</span>
              </div>
            )}
            <EmailEditor
              ref={emailEditorRef}
              onLoad={onEditorLoad}
              onReady={() => setEditorLoaded(true)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: editorLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
              options={{
              features: {
                imageEditor: true, // Requires paid unlayer plan for advanced features, but basic is fine
              },
              appearance: {
                theme: 'light',
              }
            }}
          />
          </div>
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
