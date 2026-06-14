import { useEffect, useState } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  FolderSimple,
  UploadSimple,
  MagnifyingGlass,
  Plus,
  PlayCircle,
  BookOpen,
  ShareNetwork,
  DotsThreeVertical
} from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import { fetchCourseMaterials } from '../../services/materialsService'
import UserUpload from './UserUpload'
import SharedMaterialPreview from '../shared/SharedMaterialPreview'
import './luterPages.css'
import './SessionsRedesign.css'

function dateLabel(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function materialLabel(material) {
  return material.title || material.file_name || material.name || 'Untitled material'
}

const COLORS = ['purple', 'mint', 'peach']

export default function BackpackFolderView() {
  const { folderId } = useParams()
  const { user } = useOutletContext()
  const navigate = useNavigate()

  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [previewMaterial, setPreviewMaterial] = useState(null)
  const [activeTab, setActiveTab] = useState('All Materials')

  useEffect(() => {
    if (folderId && user?.id) {
      loadFolderData()
      loadMaterials()
    }
  }, [folderId, user?.id])

  async function loadFolderData() {
    const { data } = await supabase
      .from('courses')
      .select('name, code')
      .eq('id', folderId)
      .single()
    if (data) {
      setCourseName(data.name)
      setCourseCode(data.code)
    }
  }

  async function loadMaterials() {
    setLoading(true)
    try {
      const mats = await fetchCourseMaterials(folderId, user.id)
      setMaterials(mats || [])
    } catch (err) {
      console.error('Failed to load materials:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMaterials = materials
    .filter((m) => !search || materialLabel(m).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const handleOpenMaterial = (material) => navigate(`/dashboard/workstation/${material.id}`, { state: { material } })
  const handleStudyMaterial = (material) => navigate(`/dashboard/workstation/${material.id}`, { state: { material } })

  return (
    <div className="sr-container">
      <div className="sr-content">

        {/* ── Breadcrumb ── */}
        <button
          onClick={() => navigate('/dashboard/backpack')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--sr-muted)', fontSize: 13, fontWeight: 600,
            padding: 0, width: 'fit-content'
          }}
        >
          <ArrowLeft size={16} /> Back to Courses
        </button>

        {/* ── Hero Header ── */}
        <div className="sr-hero">
          <div className="sr-hero-text" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(196,181,253,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FolderSimple size={26} weight="fill" color="#7C3AED" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--sr-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {courseCode}
              </p>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--sr-text)', letterSpacing: '-0.02em' }}>
                {courseName || 'Loading…'}
              </h1>
            </div>
          </div>

          <div className="sr-hero-actions">
            <button className="sr-btn" style={{ gap: 8, padding: '10px 16px', borderRadius: 999 }}>
              <ShareNetwork size={16} weight="bold" /> Share
            </button>
            <button
              className="sr-btn sr-btn-primary"
              style={{ gap: 8, padding: '10px 20px', borderRadius: 999, background: '#98FF98', color: '#14532D', border: 'none', fontWeight: 700 }}
              onClick={() => setShowUpload(true)}
            >
              <UploadSimple size={16} weight="bold" /> Upload Document
            </button>
            <button className="sr-btn" style={{ padding: '10px', borderRadius: 999, minWidth: 'unset' }}>
              <DotsThreeVertical size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* ── Tabs + Stats Row ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['All Materials', 'Recent'].map(tab => (
              <button
                key={tab}
                className={`sr-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: 'rgba(196,181,253,0.2)', color: '#7C3AED'
            }}>
              Total: {materials.length}
            </span>
            <div className="sr-search" style={{ maxWidth: 240 }}>
              <MagnifyingGlass size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--sr-muted)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this folder…"
                style={{
                  width: '100%', padding: '9px 14px 9px 36px',
                  borderRadius: 999, border: '1px solid var(--sr-border)',
                  background: 'var(--sr-surface)', color: 'var(--sr-text)',
                  fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="sr-empty">
            <div className="sr-empty-icon"><FolderSimple size={28} weight="duotone" /></div>
            <h3>Loading Folder</h3>
            <p>Fetching your materials…</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="sr-empty">
            <div className="sr-empty-icon">
              <FileText size={28} weight="duotone" />
            </div>
            <h3>{search ? 'Nothing matched' : 'Folder is empty'}</h3>
            <p>{search ? 'Try a different search term.' : 'Upload a PDF, note, video, or other study file to begin.'}</p>
            {!search && (
              <button
                className="sr-btn sr-btn-primary"
                style={{ borderRadius: 999, padding: '10px 20px', background: '#98FF98', color: '#14532D', border: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                onClick={() => setShowUpload(true)}
              >
                <Plus size={16} weight="bold" /> Upload material
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16
          }}>
            {filteredMaterials.map((material, index) => {
              const color = COLORS[index % COLORS.length]
              const isPdf = material.type === 'pdf'
              const isDoc = material.type === 'docx'
              const isYt = material.type === 'youtube'
              const typeLabel = (material.type || 'file').toUpperCase()

              const thumbBg = {
                purple: '#1E1B4B',
                mint: '#14532D',
                peach: '#7C2D12',
              }[color]

              return (
                <motion.div
                  key={material.id}
                  className="sr-card"
                  data-color={color}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => handleOpenMaterial(material)}
                  style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', gap: 0 }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    height: 110,
                    background: thumbBg,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: '16px 16px 0 0',
                    gap: 4, position: 'relative'
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', position: 'absolute', top: 10, left: 12 }}>
                      {typeLabel}
                    </span>
                    {isPdf && <BookOpen size={32} weight="fill" color="rgba(255,255,255,0.8)" />}
                    {isDoc && <FileText size={32} weight="fill" color="rgba(255,255,255,0.8)" />}
                    {isYt && <PlayCircle size={32} weight="fill" color="rgba(255,255,255,0.8)" />}
                    {!isPdf && !isDoc && !isYt && <FileText size={32} weight="fill" color="rgba(255,255,255,0.8)" />}
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Document Preview
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px 14px' }}>
                    <h3 style={{
                      margin: '0 0 6px', fontSize: 13, fontWeight: 700,
                      color: 'var(--sr-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {materialLabel(material)}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--sr-muted)', fontWeight: 500 }}>0 cards</span>
                      <span style={{ fontSize: 11, color: '#C4B5FD', fontWeight: 600 }}>0 to-do</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Upload CTA at bottom */}
        {!loading && filteredMaterials.length > 0 && (
          <button
            onClick={() => setShowUpload(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, height: 48, border: '2px dashed var(--sr-border)', borderRadius: 12,
              background: 'transparent', color: 'var(--sr-muted)', fontFamily: 'inherit',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Plus size={16} /> Add More Materials
          </button>
        )}

      </div>

      {/* ── Upload Modal ── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="lp-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="lp-modal"
              style={{ width: 'min(760px, 100%)' }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Upload to {courseCode} · {courseName}</h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--lp-muted)', fontSize: 14 }}>Files uploaded here will be saved in this folder.</p>
                </div>
                <button className="lp-btn" onClick={() => { setShowUpload(false); loadMaterials() }}>Close</button>
              </div>
              <UserUpload initialCourseId={folderId} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Preview Modal ── */}
      <AnimatePresence>
        {previewMaterial && (
          <motion.div
            className="lp-modal-backdrop"
            style={{ zIndex: 1000, padding: '24px' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreviewMaterial(null)}
          >
            <motion.div
              className="lp-modal"
              style={{ width: 'min(1000px, 100%)', height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--lp-border)' }}>
                <h2 style={{ fontSize: 18, margin: 0 }}>{materialLabel(previewMaterial)}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="lp-btn lp-btn-primary"
                    onClick={() => handleStudyMaterial(previewMaterial)}
                  >
                    <PlayCircle size={18} /> Open in Workstation
                  </button>
                  <button className="lp-btn" onClick={() => setPreviewMaterial(null)}>Close</button>
                </div>
              </div>
              <div style={{ flex: 1, background: '#f8f9fa', position: 'relative', overflow: 'hidden' }}>
                <SharedMaterialPreview material={previewMaterial} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
