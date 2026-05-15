import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useOutletContext } from 'react-router-dom'
import { Search, PenTool, Youtube, FileText, RotateCcw, Trash2 } from 'lucide-react'
import { LuterPageLoader } from '../shared/LuterPageLoader'

export default function TrashPage() {
  const { user } = useOutletContext()
  const [deletedItems, setDeletedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) fetchTrash()
  }, [user])

  async function fetchTrash() {
    setLoading(true)
    try {
      // 1. Fetch deleted materials
      const { data: materials, error: mErr } = await supabase
        .from('materials')
        .select('*, course:courses(name, code)')
        .not('deleted_at', 'is', null) // Filter for deleted items
        .eq('user_id', user.id)

      // 2. Fetch deleted notes
      const { data: notes, error: nErr } = await supabase
        .from('user_notes')
        .select('*, course:courses(name, code)')
        .not('deleted_at', 'is', null)
        .eq('user_id', user.id)

      if (mErr || nErr) console.error('Error fetching trash:', mErr || nErr)

      const allItems = [
        ...(materials || []).map(m => ({ ...m, itemType: 'material' })),
        ...(notes || []).map(n => ({ ...n, itemType: 'note' }))
      ].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at))

      setDeletedItems(allItems)
    } finally {
      setLoading(false)
    }
  }

  async function restoreItem(item) {
    const table = item.itemType === 'material' ? 'materials' : 'user_notes'
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .eq('id', item.id)

    if (error) {
      alert('Failed to restore item')
    } else {
      setDeletedItems(prev => prev.filter(i => i.id !== item.id))
    }
  }

  async function permanentlyDeleteItem(item) {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return

    const table = item.itemType === 'material' ? 'materials' : 'user_notes'
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', item.id)

    if (error) {
       alert('Failed to permanently delete item')
    } else {
       setDeletedItems(prev => prev.filter(i => i.id !== item.id))
    }
  }

  const filteredItems = deletedItems.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.course?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="dh-root">
        <div className="dh-topbar-right">
           <div style={{ position: 'relative', width: '300px' }}>
              <input 
                type="text" 
                placeholder="Search trash..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 16px', paddingRight: '40px', borderRadius: '12px', border: '1.5px solid #f0f0f0', fontSize: '14px' }}
              />
              <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
           </div>
        </div>

      <div className="trash-content">
        {loading ? (
          <LuterPageLoader message="Scanning trash..." />
        ) : filteredItems.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="trash-item"
                style={{
                  background: 'white',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  border: '1.5px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: item.itemType === 'material' ? '#7a12cc10' : '#0ea5e910',
                  color: item.itemType === 'material' ? '#7a12cc' : '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.itemType === 'note' ? <PenTool size={20} /> : (item.type === 'youtube' ? <Youtube size={20} /> : <FileText size={20} />)}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: 0 }}>{item.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', mt: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#666', background: '#f8f8f8', padding: '2px 6px', borderRadius: '4px' }}>
                      {item.course?.code || 'No Course'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#999' }}>Deleted on {new Date(item.deleted_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => restoreItem(item)}
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: '10px', 
                      border: '1px solid #e1e1e1', 
                      background: 'white', 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: '#444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={14} /> Restore
                  </button>
                  <button 
                    onClick={() => permanentlyDeleteItem(item)}
                    style={{ 
                      padding: '8px', 
                      borderRadius: '10px', 
                      background: '#fef2f2', 
                      color: '#ef4444', 
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '120px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={32} color="#ccc" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111' }}>Trash is empty</h2>
            <p style={{ color: '#666', marginTop: '4px' }}>Items you provide or delete will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
