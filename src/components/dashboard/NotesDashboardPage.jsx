import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import {
  NotePencil, Plus, Trash, Copy, Link, ArrowSquareOut,
  DotsThreeVertical, DownloadSimple, CheckSquare, Square,
  ClockCounterClockwise, Pencil
} from '@phosphor-icons/react'
import { ListSkeleton } from '../shared/LuterPageLoader'
import './NotesDashboardPage.css'

/* ── Helpers ──────────────────────────────────────────────────────── */
function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getSharedNotesKey(userId) {
  return `luter:shared-notes:${userId}`
}

function loadSharedNotes(userId) {
  if (!userId) return []
  try {
    return JSON.parse(localStorage.getItem(getSharedNotesKey(userId)) || '[]')
  } catch {
    return []
  }
}

function saveSharedNotes(userId, notes) {
  if (!userId) return
  localStorage.setItem(getSharedNotesKey(userId), JSON.stringify(notes.slice(0, 50)))
}

/* ── Context Menu ──────────────────────────────────────────────────── */
function ContextMenu({ note, onClose, onDelete, onDuplicate, onOpen, anchorRef }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target) && !anchorRef?.current?.contains(e.target)) {
        onClose()
      }
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/notes/editor?note=${note.id}&shared=1`)
    onClose()
  }

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(note.title || 'Untitled Note', 20, 20)
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(stripHtml(note.content_html || note.content || ''), 170)
    doc.text(lines, 20, 34)
    doc.save(`${note.title || 'note'}.pdf`)
    onClose()
  }

  return (
    <div className="nd-ctx" ref={menuRef}>
      <button className="nd-ctx-item" onClick={() => { onOpen(note); onClose() }}>
        <Pencil size={14} />
        Open note
      </button>
      <button className="nd-ctx-item" onClick={() => { onDuplicate(note); onClose() }}>
        <Copy size={14} />
        Duplicate
      </button>
      <button className="nd-ctx-item" onClick={downloadPDF}>
        <DownloadSimple size={14} />
        Download as PDF
      </button>
      <button className="nd-ctx-item" onClick={copyLink}>
        <Link size={14} />
        Copy link to note
        <span className="nd-ctx-hint">Anyone with the link can access</span>
      </button>
      <div className="nd-ctx-sep" />
      <button className="nd-ctx-item danger" onClick={() => { onDelete(note.id); onClose() }}>
        <Trash size={14} />
        Delete
      </button>
    </div>
  )
}

/* ── Note Row ─────────────────────────────────────────────────────── */
function NoteRow({ note, selected, onSelect, onOpen, onDelete, onDuplicate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const btnRef = useRef(null)
  const preview = stripHtml(note.content_html || note.content || '')

  return (
    <div className={`nd-row ${selected ? 'is-selected' : ''}`} onClick={() => onOpen(note)}>
      {/* Checkbox */}
      <div
        className="nd-row-check"
        onClick={e => { e.stopPropagation(); onSelect(note.id) }}
      >
        {selected
          ? <CheckSquare size={18} weight="fill" className="nd-check-icon checked" />
          : <Square size={18} weight="regular" className="nd-check-icon" />
        }
      </div>

      {/* Icon */}
      <div className="nd-row-icon">{note.icon || '📄'}</div>

      {/* Body */}
      <div className="nd-row-body">
        <span className="nd-row-title">{note.title || 'Untitled Note'}</span>
        {preview && (
          <span className="nd-row-preview">{preview.slice(0, 100)}{preview.length > 100 ? '…' : ''}</span>
        )}
        <span className="nd-row-meta">
          <ClockCounterClockwise size={11} weight="regular" />
          Edited {timeAgo(note.updated_at)} &bull; {note.shared ? 'Shared with you' : 'You'}
        </span>
      </div>

      {/* Actions */}
      <div className="nd-row-actions" onClick={e => e.stopPropagation()}>
        <div className="nd-row-menu-wrap">
          <button
            ref={btnRef}
            className={`nd-row-more ${menuOpen ? 'is-active' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
          >
            <DotsThreeVertical size={18} weight="bold" />
          </button>
          {menuOpen && (
            <ContextMenu
              note={note}
              anchorRef={btnRef}
              onClose={() => setMenuOpen(false)}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onOpen={onOpen}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function NotesDashboardPage() {
  const { user } = useOutletContext() || {}
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [notes, setNotes]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [creating, setCreating] = useState(false)
  const autoCreateHandledRef = useRef(false)

  const fetchNotes = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    const { data } = await supabase
      .from('notes').select('*').eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    const ownedNotes = data || []
    const ownedIds = new Set(ownedNotes.map((note) => note.id))
    const sharedNotes = loadSharedNotes(user.id).filter((note) => !ownedIds.has(note.id))
    setNotes([...ownedNotes, ...sharedNotes].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)))
    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleCreate = useCallback(async () => {
    if (!user?.id || creating) return
    setCreating(true)
    const newId = crypto.randomUUID()
    const now = new Date().toISOString()
    const emptyContent = '<p></p>'
    const { error } = await supabase.from('notes').insert({
      id: newId,
      user_id: user.id,
      title: 'Untitled Note',
      icon: '📄',
      cover_url: null,
      content_html: emptyContent,
      content: emptyContent,
      updated_at: now,
    })

    if (error) {
      console.error('Error creating note:', error)
      setCreating(false)
      return
    }

    navigate(`/notes/editor?note=${newId}`)
  }, [creating, navigate, user?.id])

  useEffect(() => {
    const sharedNoteId = searchParams.get('note')
    if (sharedNoteId) {
      navigate(`/notes/editor?note=${encodeURIComponent(sharedNoteId)}&shared=1`, { replace: true })
      return
    }

    if (searchParams.get('new') !== '1' || !user?.id || autoCreateHandledRef.current) return
    autoCreateHandledRef.current = true
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('new')
    setSearchParams(nextParams, { replace: true })
    handleCreate()
  }, [handleCreate, navigate, searchParams, setSearchParams, user?.id])

  const handleOpen = (noteOrId) => {
    const note = typeof noteOrId === 'object' ? noteOrId : notes.find((item) => item.id === noteOrId)
    const id = typeof noteOrId === 'object' ? noteOrId.id : noteOrId
    navigate(`/notes/editor?note=${encodeURIComponent(id)}${note?.shared ? '&shared=1' : ''}`)
  }

  const handleDelete = async (id) => {
    const note = notes.find((item) => item.id === id)
    if (note?.shared) {
      const nextShared = loadSharedNotes(user?.id).filter((item) => item.id !== id)
      saveSharedNotes(user?.id, nextShared)
      setNotes(prev => prev.filter(n => n.id !== id))
      setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
      return
    }

    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const handleDeleteSelected = async () => {
    const ids = [...selected]
    const sharedIds = ids.filter((id) => notes.find((note) => note.id === id)?.shared)
    const ownedIds = ids.filter((id) => !sharedIds.includes(id))
    if (ownedIds.length) await supabase.from('notes').delete().in('id', ownedIds)
    if (sharedIds.length) {
      const nextShared = loadSharedNotes(user?.id).filter((note) => !sharedIds.includes(note.id))
      saveSharedNotes(user?.id, nextShared)
    }
    setNotes(prev => prev.filter(n => !ids.includes(n.id)))
    setSelected(new Set())
  }

  const handleDuplicate = async (note) => {
    const newId = crypto.randomUUID()
    const duplicatedContent = note.content_html || note.content || '<p></p>'
    const { data } = await supabase.from('notes').insert({
      id: newId, user_id: user.id,
      title: `${note.title || 'Untitled'} (copy)`,
      icon: note.icon, cover_url: note.cover_url,
      content_html: duplicatedContent,
      content: duplicatedContent,
    }).select().single()
    if (data) setNotes(prev => [data, ...prev])
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
    })
  }

  const allSelected = notes.length > 0 && selected.size === notes.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(notes.map(n => n.id)))

  return (
    <div className="nd-page">

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="nd-topbar">
        <div className="nd-topbar-left">
          <NotePencil size={22} weight="duotone" className="nd-topbar-icon" />
          <span className="nd-topbar-title">Notes</span>
        </div>
        <button
          className={`nd-create-btn ${creating ? 'loading' : ''}`}
          onClick={handleCreate}
          disabled={creating}
        >
          {creating
            ? <span className="nd-btn-spinner" />
            : <Plus size={16} weight="bold" />
          }
          Create a note
        </button>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      {notes.length > 0 && (
        <div className="nd-toolbar">
          <button className="nd-select-all-btn" onClick={toggleAll}>
            {allSelected
              ? <CheckSquare size={16} weight="fill" style={{ color: '#7C3AED' }} />
              : <Square size={16} weight="regular" />
            }
            Select all
          </button>

          {selected.size > 0 && (
            <div className="nd-bulk-row">
              <span className="nd-bulk-count">{selected.size} selected</span>
              <button className="nd-bulk-action-btn" title="Download selected">
                <DownloadSimple size={15} />
              </button>
              <button className="nd-bulk-action-btn" title="Duplicate selected">
                <Copy size={15} />
              </button>
              <button
                className="nd-bulk-action-btn danger"
                title="Delete selected"
                onClick={handleDeleteSelected}
              >
                <Trash size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── List ────────────────────────────────────────────────── */}
      <div className="nd-list">
        {loading ? (
          <div style={{ padding: '0 4px' }}>
            <ListSkeleton count={6} />
          </div>
        ) : notes.length === 0 ? (
          <div className="nd-empty">
            <img
              src="/mascot.png" alt="Luter"
              className="nd-empty-mascot"
              onError={e => { e.target.style.display = 'none' }}
            />
            <h2>No notes yet</h2>
            <p>Create your first note — write anything, collaborate in real time, and let AI help you study smarter.</p>
            <button className="nd-create-btn" onClick={handleCreate}>
              <Plus size={16} weight="bold" />
              Create a note
            </button>
          </div>
        ) : (
          <div className="nd-list-inner">
            {notes.map(note => (
              <NoteRow
                key={note.id}
                note={note}
                selected={selected.has(note.id)}
                onSelect={toggleSelect}
                onOpen={handleOpen}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
