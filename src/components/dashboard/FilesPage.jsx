import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  ArrowRight,
  FileDoc,
  FilePdf,
  FilePpt,
  FileXls,
  FolderOpen,
  MagnifyingGlass,
  StackSimple,
  Trash,
  UploadSimple,
  VideoCamera,
  YoutubeLogo,
  Lock,
} from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import { deleteMaterial } from '../../services/materialsService'
import { LuterPageLoader } from '../shared/LuterPageLoader'
import { usePlanGate } from '../../hooks/usePlanGate'
import LockedOverlay from '../shared/LockedOverlay'
import { motion, AnimatePresence } from 'framer-motion'
import './FilesPage.css'

/* ── helpers ── */
function formatRelativeDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TYPE_LABEL = {
  pdf: 'PDF',
  docx: 'Word',
  doc: 'Word',
  pptx: 'PowerPoint',
  ppt: 'PowerPoint',
  xlsx: 'Excel',
  xls: 'Excel',
  youtube: 'YouTube',
  video: 'Video',
  audio: 'Audio',
  txt: 'Text',
  md: 'Markdown',
  image: 'Image',
}

function typeLabel(type) {
  return TYPE_LABEL[type?.toLowerCase()] || type?.toUpperCase() || 'File'
}

function TypeIcon({ type, size = 22 }) {
  const t = type?.toLowerCase()
  if (t === 'pdf')                         return <FilePdf size={size} weight="fill" />
  if (t === 'docx' || t === 'doc')         return <FileDoc size={size} weight="fill" />
  if (t === 'pptx' || t === 'ppt')         return <FilePpt size={size} weight="fill" />
  if (t === 'xlsx' || t === 'xls')         return <FileXls size={size} weight="fill" />
  if (t === 'youtube')                     return <YoutubeLogo size={size} weight="fill" />
  if (t === 'video')                       return <VideoCamera size={size} weight="fill" />
  return <FolderOpen size={size} weight="fill" />
}

function typeColor(type) {
  const t = type?.toLowerCase()
  if (t === 'pdf')                         return { bg: 'rgba(239,68,68,0.12)', color: '#DC2626' }
  if (t === 'docx' || t === 'doc')         return { bg: 'rgba(59,130,246,0.12)', color: '#2563EB' }
  if (t === 'pptx' || t === 'ppt')         return { bg: 'rgba(249,115,22,0.12)', color: '#EA580C' }
  if (t === 'xlsx' || t === 'xls')         return { bg: 'rgba(34,197,94,0.12)', color: '#16A34A' }
  if (t === 'youtube')                     return { bg: 'rgba(239,68,68,0.12)', color: '#DC2626' }
  return { bg: 'rgba(196,181,253,0.18)', color: 'var(--sb-purple-deep, #7a12cc)' }
}

const STATUS_CONFIG = {
  ready:      { label: 'Ready',      dot: '#22C55E' },
  pending:    { label: 'Processing', dot: '#F59E0B' },
  processing: { label: 'Processing', dot: '#F59E0B' },
  failed:     { label: 'Failed',     dot: '#EF4444' },
}

/* ════════════════════════════════════════════════════════ */

export default function FilesPage() {
  const navigate = useNavigate()
  const { user, profile } = useOutletContext()

  const [files, setFiles]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')  // all | pdf | doc | pptx | youtube
  const [deleting, setDeleting]   = useState(null)
  const [showResourceLock, setShowResourceLock] = useState(false)

  const { maxFiles, getLockedItemIds } = usePlanGate(profile)
  const lockedFiles = useMemo(() => getLockedItemIds(files, maxFiles), [files, maxFiles])

  /* ── Load all user materials (standalone + course-attached) ── */
  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, title, type, source_url, processing_status, created_at, course_id, metadata')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      setFiles(data || [])
    } catch (e) {
      console.error('FilesPage load error:', e)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  /* ── Filter + search ── */
  const filtered = files.filter(f => {
    const matchSearch = !search || f.title?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || f.type?.toLowerCase().startsWith(filter)
    return matchSearch && matchFilter
  })

  /* ── Soft delete ── */
  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Move this file to trash?')) return
    setDeleting(id)
    try {
      await deleteMaterial(id)
      setFiles(prev => prev.filter(f => f.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  /* ── Navigate to workstation ── */
  const handleOpen = (file) => {
    if (lockedFiles.has(file.id)) {
      setShowResourceLock(true)
      return
    }
    navigate(`/workstation?materialId=${encodeURIComponent(file.id)}`)
  }

  const FILTERS = [
    { key: 'all',     label: 'All' },
    { key: 'pdf',     label: 'PDFs' },
    { key: 'doc',     label: 'Word' },
    { key: 'pptx',   label: 'Slides' },
    { key: 'youtube', label: 'YouTube' },
  ]

  if (loading) {
    return <LuterPageLoader message="Loading your files..." minHeight="100vh" />
  }

  return (
    <div className="fp-root">

      {/* ── Topbar ── */}
      <header className="fp-topbar">
        <div className="fp-heading">
          <p className="fp-eyebrow">Library</p>
          <h1 className="fp-title">My Files</h1>
        </div>
        <button className="fp-upload-btn" onClick={() => navigate('/upload')}>
          <UploadSimple size={17} weight="bold" />
          Upload
        </button>
      </header>

      {/* ── Search + filters ── */}
      <div className="fp-controls">
        <div className="fp-search-wrap">
          <MagnifyingGlass size={16} weight="bold" className="fp-search-icon" />
          <input
            className="fp-search"
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="fp-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`fp-filter-chip${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="fp-empty">
          <StackSimple size={36} weight="fill" style={{ color: 'var(--sb-border, #E5E7EB)' }} />
          <strong>{search ? 'No files match your search' : 'No files yet'}</strong>
          <span>Upload a PDF, Word doc, slides or YouTube link to get started.</span>
          {!search && (
            <button className="fp-empty-cta" onClick={() => navigate('/upload')}>
              <UploadSimple size={16} weight="bold" /> Upload your first file
            </button>
          )}
        </div>
      )}

      {/* ── Grid ── */}
      {filtered.length > 0 && (
        <div className="fp-grid">
          {filtered.map(file => {
            const colors = typeColor(file.type)
            const status = STATUS_CONFIG[file.processing_status] || STATUS_CONFIG.ready
            const isLocked = lockedFiles.has(file.id)

            return (
              <article
                key={file.id}
                className="fp-card"
                onClick={() => handleOpen(file)}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleOpen(file)}
                role="button"
                aria-label={`Open ${file.title}`}
                style={{ opacity: isLocked ? 0.6 : 1 }}
              >
                {/* Thumbnail */}
                <div className="fp-card-thumb">
                  <div
                    className="fp-card-thumb-fallback"
                    style={{ background: colors.bg }}
                  >
                    <span style={{ color: colors.color }}>
                      <TypeIcon type={file.type} size={40} />
                    </span>
                    <span className="fp-thumb-type-label" style={{ color: colors.color }}>
                      {typeLabel(file.type)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="fp-card-body">
                  {/* Type badge */}
                  <div className="fp-card-meta-row">
                    <span
                      className="fp-type-badge"
                      style={{ background: colors.bg, color: colors.color }}
                    >
                      <TypeIcon type={file.type} size={12} />
                      {typeLabel(file.type)}
                    </span>
                  </div>

                  <p className="fp-card-title" title={file.title}>
                    {file.title || 'Untitled'}
                  </p>

                  <div className="fp-card-meta-row" style={{ marginTop: 8 }}>
                    <div className="fp-card-status">
                      {isLocked ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontWeight: 600, fontSize: 12 }}>
                          <Lock size={12} weight="bold" /> Locked
                        </span>
                      ) : (
                        <>
                          <span className="fp-status-dot" style={{ background: status.dot }} />
                          <span className="fp-status-label" style={{ color: status.dot }}>
                            {status.label}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="fp-card-footer">
                    <span className="fp-card-date">{formatRelativeDate(file.created_at)}</span>
                    <div className="fp-card-actions" onClick={e => e.stopPropagation()}>
                      <button
                        className="fp-icon-btn fp-icon-btn--open"
                        onClick={() => handleOpen(file)}
                        title="Open"
                      >
                        <ArrowRight size={14} weight="bold" />
                      </button>
                      <button
                        className="fp-icon-btn fp-icon-btn--delete"
                        onClick={e => handleDelete(file.id, e)}
                        disabled={deleting === file.id}
                        title="Delete"
                      >
                        {deleting === file.id
                          ? <span className="fp-spinner" />
                          : <Trash size={14} weight="bold" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Feature Gate Lock Modal */}
      <AnimatePresence>
        {showResourceLock && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowResourceLock(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--color-background-primary, #fff)',
                borderRadius: 20, width: '90%', maxWidth: 400,
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                overflow: 'hidden', position: 'relative',
              }}
            >
              <button
                onClick={() => setShowResourceLock(false)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-secondary, #666)', fontSize: 20,
                  zIndex: 2,
                }}
              >×</button>
              <LockedOverlay
                inline
                feature="File limit reached"
                description={`You've reached your maximum limit of files (${maxFiles}). Upgrade to unlock more.`}
                requiredPlan="Pro"
                onUpgrade={() => { setShowResourceLock(false); navigate('/upgrade') }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
