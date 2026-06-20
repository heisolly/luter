import { useState, useEffect } from 'react'
import { 
  RiSearchLine as Search, RiUploadCloudFill as Upload, RiFolderFill as Folder, RiFileTextFill as FileText, 
  RiStackFill as Layers, RiAddLine as Plus, RiFilterFill as Filter, RiMore2Fill as MoreVertical, 
  RiMagicFill as Sparkles, RiDeleteBin6Fill as Trash2, RiTimeFill as Clock, RiLayoutGridFill as Grid, RiListCheck as List,
  RiImageFill as ImageIcon, RiMusicFill as Music, RiVideoFill as Video, RiLoader4Line as Loader2
} from 'react-icons/ri'
import { CardSkeleton } from '../shared/LuterPageLoader'
import { supabase } from '../../supabaseClient'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlass, UploadSimple, Plus as PlusLight, Sparkle as SparkleLight, FileText as FileTextLight, SquaresFour, Rows } from '@phosphor-icons/react'

const VAULT_TABS = [
  { id: 'all', label: 'All Files', icon: Layers },
  { id: 'notes', label: 'Study Notes', icon: FileText },
  { id: 'projects', label: 'Personal Projects', icon: Folder },
  { id: 'trash', label: 'Trash', icon: Trash2 },
]

export default function VaultPage() {
  const { user, profile } = useOutletContext()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState([])
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    if (user) {
      fetchVaultFiles()
    }
  }, [user, activeTab])

  async function fetchVaultFiles() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, title, type, created_at, processing_status, metadata, course_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped = (data || [])
        .filter((item) => !item.course_id)
        .map((item) => ({
          id: item.id,
          name: item.title || 'Untitled material',
          type: item.type || 'document',
          size: item.metadata?.file_size ? `${(item.metadata.file_size / 1024 / 1024).toFixed(1)} MB` : 'Uploaded resource',
          date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently added',
          category: item.type === 'audio' ? 'projects' : 'notes',
          processingStatus: item.processing_status
        }))

      setFiles(mapped)
    } catch (error) {
      console.error('Failed to load vault files:', error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (activeTab === 'all' || f.category === activeTab)
  )

  return (
    <div className="dhd-root" style={{ minHeight: '100vh' }}>
      <header style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
             <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Backpack</h1>
             <span style={{ padding: '4px 12px', background: 'var(--primary-bg)', color: 'var(--primary)', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Beta</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 15, fontWeight: 500 }}>Your secure, AI-powered personal study library.</p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
           <button onClick={() => navigate('/upload')} className="btn-primary" style={{ padding: '12px 24px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
             <UploadSimple size={18} weight="light" />
             Upload
           </button>
           <button style={{ background: 'white', border: '1.5px solid #f1f5f9', width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>
             <PlusLight size={20} weight="light" />
           </button>
        </div>
      </header>

      {/* Tabs & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, borderBottom: '1.5px solid #f1f5f9', paddingBottom: 2 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          {VAULT_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 4px',
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--primary)' : '#64748b',
                background: 'none',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: 'var(--primary)', borderRadius: 2 }} 
                />
              )}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
           <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
              <button 
                onClick={() => setViewMode('grid')}
                style={{ padding: 6, borderRadius: 8, background: viewMode === 'grid' ? 'white' : 'transparent', border: 'none', color: viewMode === 'grid' ? '#111' : '#94a3b8', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
              >
                <SquaresFour size={16} weight="light" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                style={{ padding: 6, borderRadius: 8, background: viewMode === 'list' ? 'white' : 'transparent', border: 'none', color: viewMode === 'list' ? '#111' : '#94a3b8', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
              >
                <Rows size={16} weight="light" />
              </button>
           </div>
           <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
           <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search your vault..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '10px 16px 10px 40px', borderRadius: 12, border: '1.5px solid #f1f5f9', background: 'white', fontSize: 13, fontWeight: 600, width: 240, outline: 'none' }}
              />
              <MagnifyingGlass size={16} weight="light" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
           </div>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={6} />
      ) : filteredFiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 32, border: '2px dashed #f1f5f9' }}>
           <div style={{ width: 64, height: 64, background: 'var(--primary-bg)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--primary)' }}>
             <SparkleLight size={32} weight="light" />
           </div>
           <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>Start your research</h3>
           <p style={{ color: '#64748b', fontSize: 15, fontWeight: 500, maxWidth: 300, margin: '0 auto' }}>Upload your first document or research paper to begin your personal study session.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {filteredFiles.map((file) => (
            <FileCard key={file.id} file={file} onOpen={() => navigate(`/workstation?materialId=${file.id}`)} />
          ))}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 24, border: '1.5px solid #f1f5f9', overflow: 'hidden' }}>
          {filteredFiles.map((file, i) => (
            <div 
              key={file.id} 
              onClick={() => navigate(`/workstation?materialId=${file.id}`)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 20, 
                padding: '16px 24px', 
                borderBottom: i === filteredFiles.length - 1 ? 'none' : '1px solid #f1f5f9',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
               <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                 <FileText size={20} />
               </div>
               <div style={{ flex: 1 }}>
                 <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{file.name}</div>
                 <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{file.size} • {file.date}</div>
               </div>
               <button style={{ padding: 8, borderRadius: 8, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                 <MoreVertical size={18} />
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FileCard({ file, onOpen }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}
      onClick={onOpen}
      style={{
        background: 'white',
        borderRadius: 24,
        padding: 24,
        border: '1.5px solid #f1f5f9',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <FileTextLight size={24} weight="light" />
        </div>
        <button style={{ padding: 4, borderRadius: 8, color: '#cbd5e1', border: 'none', background: 'transparent' }}>
          <MoreVertical size={18} />
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</h3>
        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, margin: 0 }}>{file.size} • PDF Document</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, fontWeight: 500 }}>
            <Clock size={14} />
            {file.date}
         </div>
         <button style={{ width: 32, height: 32, borderRadius: 10, background: '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <ArrowRight size={14} />
         </button>
      </div>
    </motion.div>
  )
}

function ArrowRight({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
  )
}
