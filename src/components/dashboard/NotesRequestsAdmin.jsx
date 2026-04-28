import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  CheckCircle, 
  Clock, 
  Warning, 
  ArrowSquareOut, 
  Funnel, 
  MagnifyingGlass,
  ChatCircle,
  FileArrowUp,
  User,
  Calendar,
  BookOpen,
  Flag,
  ArrowClockwise
} from '@phosphor-icons/react';

export default function NotesRequestsAdmin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status, resultUrl = null) {
    try {
      setUpdatingId(id);
      const updates = { status };
      if (resultUrl) updates.result_url = resultUrl;

      const { error } = await supabase
        .from('notes_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setRequests(requests.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ));
    } catch (err) {
      alert('Error updating request: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = 
      r.subject?.toLowerCase().includes(search.toLowerCase()) ||
      r.course?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <ArrowClockwise className="animate-spin" size={28} color="#7a12cc" />
      </div>
    )
  }

  return (
    <>
      <h1 className="adm-page-title">Study Requests</h1>
      <p className="adm-page-desc">
        Manage and fulfill student study note requests. Review, claim, and complete requests from students.
      </p>

      {/* Stats Cards */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Total Requests</div>
          <div className="adm-kpi-value">{requests.length || 0}</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Pending</div>
          <div className="adm-kpi-value">{requests.filter(r => r.status === 'pending').length}</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">In Progress</div>
          <div className="adm-kpi-value">{requests.filter(r => r.status === 'claimed').length}</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Completed</div>
          <div className="adm-kpi-value">{requests.filter(r => r.status === 'completed').length}</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="adm-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
            <MagnifyingGlass 
              size={20} 
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
            />
            <input
              type="text"
              placeholder="Search requests..."
              className="adm-input"
              style={{ paddingLeft: 40 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            {['all', 'pending', 'claimed', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`adm-btn ${filter === f ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                style={{ 
                  borderRadius: 0, 
                  borderRight: f !== 'completed' ? '1px solid #e5e7eb' : 'none',
                  textTransform: 'capitalize'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <button 
            onClick={fetchRequests}
            className="adm-btn adm-btn--ghost"
            disabled={loading}
          >
            <ArrowClockwise size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="adm-card" style={{ padding: 0 }}>
        {filteredRequests.length > 0 ? (
          <div style={{ borderBottom: '1px solid #e5e7eb' }}>
            {filteredRequests.map((req, index) => (
              <div 
                key={req.id}
                style={{ 
                  padding: 16, 
                  borderBottom: index < filteredRequests.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: index % 2 === 0 ? '#fafafa' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  {/* Request Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <StatusIndicator status={req.status} />
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        color: req.status === 'completed' ? '#059669' : 
                               req.status === 'claimed' ? '#2563eb' : '#d97706'
                      }}>
                        {req.status}
                      </span>
                      
                      {req.urgency !== 'normal' && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: req.urgency === 'urgent' ? '#fef2f2' : '#fff7ed',
                          color: req.urgency === 'urgent' ? '#dc2626' : '#ea580c',
                          textTransform: 'uppercase'
                        }}>
                          <Flag size={10} style={{ display: 'inline', marginRight: 2 }} />
                          {req.urgency}
                        </span>
                      )}
                      
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>
                      {req.subject}
                    </h3>
                    {req.topic && (
                      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6b7280' }}>
                        Topic: {req.topic}
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ 
                        background: '#f3f4f6', 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: 11, 
                        fontWeight: 600 
                      }}>
                        {req.course?.code}
                      </span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {req.course?.name} • Week {req.week_number}
                      </span>
                    </div>
                    
                    {req.description && (
                      <p style={{ 
                        margin: '8px 0 0', 
                        fontSize: 13, 
                        color: '#6b7280',
                        lineHeight: 1.4
                      }}>
                        {req.description}
                      </p>
                    )}
                    
                    <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
                      <User size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {req.user?.email || 'Unknown student'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                    {req.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(req.id, 'claimed')}
                        disabled={updatingId === req.id}
                        className="adm-btn adm-btn--primary"
                        style={{ fontSize: 12, padding: '6px 12px' }}
                      >
                        {updatingId === req.id ? (
                          <ArrowClockwise size={12} className="animate-spin" />
                        ) : (
                          'Claim'
                        )}
                      </button>
                    )}

                    {req.status === 'claimed' && (
                      <>
                        <button 
                          onClick={() => {
                            const url = prompt('Enter PDF Result URL:');
                            if (url) updateStatus(req.id, 'completed', url);
                          }}
                          disabled={updatingId === req.id}
                          className="adm-btn adm-btn--primary"
                          style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                          {updatingId === req.id ? (
                            <ArrowClockwise size={12} className="animate-spin" />
                          ) : (
                            <>
                              <FileArrowUp size={12} style={{ marginRight: 4 }} />
                              Complete
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => updateStatus(req.id, 'pending')}
                          disabled={updatingId === req.id}
                          className="adm-btn adm-btn--ghost"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          Unclaim
                        </button>
                      </>
                    )}

                    {req.status === 'completed' && req.result_url && (
                      <a 
                        href={req.result_url}
                        target="_blank"
                        rel="noreferrer"
                        className="adm-btn adm-btn--ghost"
                        style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none', display: 'inline-block' }}
                      >
                        <ArrowSquareOut size={12} style={{ marginRight: 4 }} />
                        View Result
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: 48, 
            textAlign: 'center', 
            color: '#9ca3af',
            fontSize: 14
          }}>
            <ChatCircle size={48} style={{ display: 'block', margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              No requests found
            </div>
            <div>
              {search || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Wait for students to submit some study requests.'}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredRequests.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
          Showing {filteredRequests.length} of {requests.length} requests
        </div>
      )}
    </>
  );
}

function StatusIndicator({ status }) {
  if (status === 'completed') return <CheckCircle color="#059669" size={16} />;
  if (status === 'claimed') return <Clock color="#2563eb" size={16} />;
  return <Warning color="#d97706" size={16} />;
}
