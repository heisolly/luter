import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Trash2, HardDrive, Clock, Search, AlertTriangle } from 'lucide-react';
import { LuterPageLoader } from '../../components/shared/LuterPageLoader';
import { addDays, format, isPast, formatDistanceToNow } from 'date-fns';

export default function AdminStorageManager() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  useEffect(() => {
    fetchStorageData();
  }, []);

  async function fetchStorageData() {
    setLoading(true);
    try {
      // Fetch all materials
      const { data: rawMaterials, error } = await supabase
        .from('materials')
        .select('id, title, type, created_at, source_url, user_id');

      if (error) throw error;

      // Filter in javascript to avoid PostgREST 400 syntax errors
      const materialsData = (rawMaterials || []).filter(m => 
        m.source_url && !m.source_url.includes('youtube.com')
      );

      // Extract unique user IDs
      const userIds = [...new Set((materialsData || []).map(m => m.user_id).filter(Boolean))];

      // Fetch profiles
      const profileMap = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesErr } = await supabase
          .from('profiles')
          .select('id, full_name, is_premium')
          .in('id', userIds);

        if (profilesErr) throw profilesErr;

        (profilesData || []).forEach(p => {
          profileMap[p.id] = p;
        });
      }

      // Filter for free users, calculate deletion date
      const processed = (materialsData || [])
        .map(mat => {
          const profile = profileMap[mat.user_id];
          const isFree = profile ? !profile.is_premium : true;
          const uploadDate = new Date(mat.created_at);
          const deletionDate = isFree ? addDays(uploadDate, 7) : null;
          
          return {
            ...mat,
            profiles: profile,
            isFree,
            deletionDate,
            isExpired: isFree ? isPast(deletionDate) : false
          };
        })
        .filter(mat => mat.isFree) // Only show free users for the deletion tracker
        .sort((a, b) => a.deletionDate - b.deletionDate);

      setMaterials(processed);
    } catch (err) {
      console.error('Failed to fetch storage data:', err);
      alert('Error fetching storage data');
    } finally {
      setLoading(false);
    }
  }

  const handleManualDelete = async (material) => {
    if (window.confirm(`Are you sure you want to permanently delete "${material.title}"?`)) {
      try {
        // Delete from storage
        const url = new URL(material.source_url);
        const pathParts = url.pathname.split('/storage/v1/object/public/materials/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          await supabase.storage.from('materials').remove([filePath]);
        }
        
        // Delete from DB
        await supabase.from('materials').delete().eq('id', material.id);
        
        setMaterials(prev => prev.filter(m => m.id !== material.id));
      } catch (err) {
        console.error('Manual deletion failed', err);
        alert('Failed to delete material');
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (allIds) => {
    const allSelected = allIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach(id => next.delete(id));
      } else {
        allIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} selected document(s)?`)) return;

    setIsDeletingBulk(true);
    try {
      const toDelete = materials.filter(m => selectedIds.has(m.id));
      
      // Delete from storage
      const storagePaths = toDelete.map(mat => {
        try {
          const url = new URL(mat.source_url);
          const pathParts = url.pathname.split('/storage/v1/object/public/materials/');
          return pathParts.length > 1 ? pathParts[1] : null;
        } catch(e) { return null; }
      }).filter(Boolean);

      if (storagePaths.length > 0) {
        await supabase.storage.from('materials').remove(storagePaths);
      }
      
      // Delete from DB
      const idsToDelete = Array.from(selectedIds);
      await supabase.from('materials').delete().in('id', idsToDelete);
      
      setMaterials(prev => prev.filter(m => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk deletion failed', err);
      alert('Failed to delete materials in bulk');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const filteredMaterials = materials.filter(mat => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const docMatch = mat.title?.toLowerCase().includes(term);
    const userMatch = mat.profiles?.full_name?.toLowerCase().includes(term);
    return docMatch || userMatch;
  });

  const groupedMaterials = React.useMemo(() => {
    const groups = {};
    filteredMaterials.forEach(mat => {
      const uid = mat.user_id || 'unknown';
      if (!groups[uid]) {
        groups[uid] = {
          profile: mat.profiles,
          materials: [],
          totalDocs: 0
        };
      }
      groups[uid].materials.push(mat);
      groups[uid].totalDocs++;
    });
    // Sort by who has the most documents
    return Object.values(groups).sort((a, b) => b.totalDocs - a.totalDocs);
  }, [filteredMaterials]);

  if (loading) return <LuterPageLoader message="Loading Storage Data..." />;

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div className="header-left">
          <h1>Storage & Retention Manager</h1>
          <p>Track documents slated for the 7-day automated deletion policy (Free Users)</p>
        </div>
      </header>

      <div className="admin-card">
        <div className="table-toolbar" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div className="search-box" style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#6b7280' }} />
            <input 
              type="text" 
              placeholder="Search by document name or user..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>
          <div className="stats-box" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ padding: '8px 16px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{materials.filter(m => m.isExpired).length} Expired Documents</span>
            </div>
            {selectedIds.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                style={{ 
                  padding: '8px 16px', 
                  background: '#dc2626', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: isDeletingBulk ? 'not-allowed' : 'pointer',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontWeight: '500',
                  opacity: isDeletingBulk ? 0.7 : 1
                }}
              >
                <Trash2 size={16} />
                {isDeletingBulk ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>
                <th style={{ padding: '12px 16px', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={filteredMaterials.length > 0 && selectedIds.size === filteredMaterials.length}
                    onChange={() => toggleSelectAll(filteredMaterials.map(m => m.id))}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px 16px' }}>Document</th>
                <th style={{ padding: '12px 16px' }}>Upload Date</th>
                <th style={{ padding: '12px 16px' }}>Deletion Schedule</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedMaterials.map((group, groupIdx) => {
                const groupIds = group.materials.map(m => m.id);
                const allGroupSelected = groupIds.every(id => selectedIds.has(id));
                const someGroupSelected = groupIds.some(id => selectedIds.has(id)) && !allGroupSelected;

                return (
                <React.Fragment key={groupIdx}>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td colSpan="5" style={{ padding: '8px 16px', fontWeight: '600', color: '#374151', borderTop: groupIdx > 0 ? '2px solid #e5e7eb' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input 
                          type="checkbox" 
                          checked={allGroupSelected}
                          ref={el => { if (el) el.indeterminate = someGroupSelected }}
                          onChange={() => toggleSelectAll(groupIds)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>
                          {group.profile?.full_name || 'Unknown User'} <span style={{ fontWeight: 'normal', color: '#6b7280', fontSize: '13px', marginLeft: '4px' }}>({group.totalDocs} document{group.totalDocs !== 1 ? 's' : ''})</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                  {group.materials.map(mat => (
                    <tr key={mat.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(mat.id)}
                          onChange={() => toggleSelect(mat.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', paddingLeft: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <HardDrive size={16} color="#6b7280" />
                          <span style={{ fontWeight: '500' }}>{mat.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4b5563' }}>
                        {format(new Date(mat.created_at), 'MMM d, yyyy')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {mat.isExpired ? (
                          <span style={{ color: '#dc2626', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={14} /> Expired {formatDistanceToNow(mat.deletionDate)} ago
                          </span>
                        ) : (
                          <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} /> In {formatDistanceToNow(mat.deletionDate)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleManualDelete(mat)}
                          style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} /> Delete Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
                );
              })}
              
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                    No free user documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
