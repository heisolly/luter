import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Shield, 
  CreditCard, 
  Settings, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  TrendingUp,
  Users,
  MoreVertical,
  ArrowUpRight,
  Download
} from 'lucide-react';

export default function PaymentSettings() {
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'settings' | 'analytics'
  const [settings, setSettings] = useState({
    paystack_enabled: true,
    stripe_enabled: false,
    paystack_mode: 'test'
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [page, statusFilter, searchQuery, activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchSettings(), fetchTransactions()]);
    setLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .single();

      if (data && !error) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('payment_transactions')
        .select('*', { count: 'exact' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery) {
        query = query.or(`reference.ilike.%${searchQuery}%,user_id.eq.${searchQuery}`);
      }

      const { data: transactionsData, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (transactionsData && !error) {
        // Fetch profiles for all user_ids in the transactions
        const userIds = transactionsData.map(tx => tx.user_id).filter(Boolean);
        let profilesMap = {};
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);
          
          profilesMap = (profilesData || []).reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }

        // Merge transaction data with profile data
        const mergedData = transactionsData.map(tx => ({
          ...tx,
          profiles: profilesMap[tx.user_id] || null
        }));

        setTransactions(mergedData);
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const updateSettings = async (updates) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (data && !error) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error updating payment settings:', error);
      alert('Failed to update payment settings');
    } finally {
      setSaving(false);
    }
  };

  const markAsCompleted = async (id) => {
    if (!window.confirm('Manually mark this transaction as completed? This will grant the user access.')) return;
    
    try {
      const { error } = await supabase
        .from('payment_transactions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#dcfce7', text: '#16a34a', icon: <CheckCircle2 size={14} /> };
      case 'failed': return { bg: '#fee2e2', text: '#dc2626', icon: <XCircle size={14} /> };
      case 'pending': return { bg: '#fef3c7', text: '#d97706', icon: <Clock size={14} /> };
      default: return { bg: '#f1f5f9', text: '#64748b', icon: <Clock size={14} /> };
    }
  };

  if (loading && activeTab === 'settings') {
    return <div style={loadingContainerStyles}>Loading Payment Suite...</div>;
  }

  return (
    <div style={containerStyles}>
      {/* Header Section */}
      <div style={headerSectionStyles}>
        <div>
          <h1 style={titleStyles}>Payment Suite</h1>
          <p style={subtitleStyles}>Manage transactions, gateways, and revenue analytics</p>
        </div>
        <div style={headerActionsStyles}>
          <button style={exportBtnStyles} onClick={() => alert('Exporting data...')}>
            <Download size={18} /> Export CSV
          </button>
          <div style={statusBadgeStyles(settings.paystack_mode === 'live')}>
            {settings.paystack_mode === 'live' ? 'Live Mode' : 'Test Mode'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={tabNavStyles}>
        <button 
          onClick={() => setActiveTab('transactions')} 
          style={tabBtnStyles(activeTab === 'transactions')}
        >
          <CreditCard size={18} /> Transactions
        </button>
        <button 
          onClick={() => setActiveTab('analytics')} 
          style={tabBtnStyles(activeTab === 'analytics')}
        >
          <TrendingUp size={18} /> Analytics
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          style={tabBtnStyles(activeTab === 'settings')}
        >
          <Settings size={18} /> Gateway Settings
        </button>
      </div>

      {activeTab === 'transactions' && (
        <div style={contentWrapperStyles}>
          {/* Filters Bar */}
          <div style={filterBarStyles}>
            <div style={searchWrapperStyles}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search by reference or user ID..." 
                style={searchInputStyles}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <select 
                style={selectStyles} 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={thStyles}>Customer</th>
                  <th style={thStyles}>Reference</th>
                  <th style={thStyles}>Plan</th>
                  <th style={thStyles}>Amount</th>
                  <th style={thStyles}>Status</th>
                  <th style={thStyles}>Date</th>
                  <th style={{ ...thStyles, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const status = getStatusColor(tx.status);
                  return (
                    <tr key={tx.id} style={tableRowStyles}>
                      <td style={tdStyles}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{tx.profiles?.full_name || 'User'}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{tx.profiles?.email}</div>
                      </td>
                      <td style={tdStyles}>
                        <code style={codeStyles}>{tx.reference}</code>
                      </td>
                      <td style={tdStyles}>
                        <span style={planBadgeStyles}>{tx.plan_id}</span>
                      </td>
                      <td style={tdStyles}>
                        <div style={{ fontWeight: 700 }}>₦{tx.amount?.toLocaleString()}</div>
                      </td>
                      <td style={tdStyles}>
                        <div style={statusPillStyles(status)}>
                          {status.icon} {tx.status}
                        </div>
                      </td>
                      <td style={tdStyles}>
                        <div style={{ fontSize: 13 }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(tx.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td style={{ ...tdStyles, textAlign: 'right' }}>
                        {tx.status === 'pending' ? (
                          <button 
                            onClick={() => markAsCompleted(tx.id)}
                            style={actionBtnStyles}
                            title="Manually Complete"
                          >
                            Verify
                          </button>
                        ) : (
                          <MoreVertical size={16} color="#94a3b8" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={paginationStyles}>
            <div style={{ color: '#64748b', fontSize: 14 }}>
              Showing {(page-1)*pageSize + 1} to {Math.min(page*pageSize, totalCount)} of {totalCount} transactions
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                style={pageBtnStyles(page === 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={page * pageSize >= totalCount}
                style={pageBtnStyles(page * pageSize >= totalCount)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={analyticsGridStyles}>
          <div style={statCardStyles}>
            <div style={statIconStyles('#f0fdf4', '#16a34a')}><DollarSign size={24} /></div>
            <div>
              <div style={statLabelStyles}>Total Revenue</div>
              <div style={statValueStyles}>₦{transactions.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.amount : 0), 0).toLocaleString()}</div>
            </div>
          </div>
          <div style={statCardStyles}>
            <div style={statIconStyles('#eff6ff', '#3b82f6')}><Users size={24} /></div>
            <div>
              <div style={statLabelStyles}>Active Subscribers</div>
              <div style={statValueStyles}>{transactions.filter(t => t.status === 'completed').length}</div>
            </div>
          </div>
          <div style={statCardStyles}>
            <div style={statIconStyles('#fff7ed', '#f97316')}><ArrowUpRight size={24} /></div>
            <div>
              <div style={statLabelStyles}>Success Rate</div>
              <div style={statValueStyles}>
                {totalCount > 0 ? Math.round((transactions.filter(t => t.status === 'completed').length / totalCount) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={settingsContentStyles}>
          <div style={cardHeaderStyles}>
            <Settings size={20} color="#7a12cc" />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Gateway Configuration</h2>
          </div>
          
          <div style={gatewayOptionStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={gatewayIconStyles('#10b981')}>PS</div>
              <div>
                <div style={{ fontWeight: 600 }}>Paystack</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Currently handling all domestic payments</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => updateSettings({ paystack_mode: settings.paystack_mode === 'test' ? 'live' : 'test' })}
                style={modeToggleStyles(settings.paystack_mode === 'live')}
              >
                {settings.paystack_mode === 'live' ? 'LIVE' : 'TEST'}
              </button>
              <button 
                onClick={() => updateSettings({ paystack_enabled: !settings.paystack_enabled })}
                style={statusToggleStyles(settings.paystack_enabled)}
              >
                {settings.paystack_enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div style={gatewayOptionStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={gatewayIconStyles('#6366f1')}>ST</div>
              <div>
                <div style={{ fontWeight: 600 }}>Stripe</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Configured for international expansion</div>
              </div>
            </div>
            <button 
              onClick={() => updateSettings({ stripe_enabled: !settings.stripe_enabled })}
              style={statusToggleStyles(settings.stripe_enabled)}
            >
              {settings.stripe_enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div style={noticeBoxStyles}>
            <Shield size={16} color="#dc2626" />
            <div style={{ fontSize: 13, color: '#7f1d1d' }}>
              <strong>Security Note:</strong> Changing these settings will affect all future checkout attempts immediately. Ensure API keys in environment variables match the selected mode.
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── STYLES ──
const containerStyles = { maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: "'Outfit', sans-serif" };
const headerSectionStyles = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 };
const titleStyles = { fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' };
const subtitleStyles = { fontSize: 15, color: '#64748b', margin: 0 };
const headerActionsStyles = { display: 'flex', gap: 12, alignItems: 'center' };
const exportBtnStyles = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' };
const statusBadgeStyles = (isLive) => ({ padding: '6px 12px', background: isLive ? '#fef2f2' : '#fffbeb', border: `1px solid ${isLive ? '#fecaca' : '#fef3c7'}`, color: isLive ? '#dc2626' : '#d97706', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' });
const tabNavStyles = { display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 32 };
const tabBtnStyles = (active) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: active ? '2px solid #7a12cc' : '2px solid transparent', color: active ? '#7a12cc' : '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' });
const contentWrapperStyles = { background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' };
const filterBarStyles = { padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' };
const searchWrapperStyles = { display: 'flex', alignItems: 'center', gap: 10, background: '#ffffff', padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', width: 350 };
const searchInputStyles = { border: 'none', outline: 'none', fontSize: 14, width: '100%', color: '#1e293b' };
const selectStyles = { padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, color: '#475569', background: '#ffffff', cursor: 'pointer' };
const tableWrapperStyles = { overflowX: 'auto' };
const tableStyles = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderRowStyles = { background: '#f8fafc' };
const thStyles = { padding: '16px 20px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tableRowStyles = { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s ease' };
const tdStyles = { padding: '16px 20px', fontSize: 14, color: '#1e293b' };
const codeStyles = { background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, fontSize: 12, color: '#475569', fontFamily: 'monospace' };
const planBadgeStyles = { background: '#f5f3ff', color: '#7c3aed', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 };
const statusPillStyles = (status) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 12, background: status.bg, color: status.text, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' });
const actionBtnStyles = { padding: '6px 12px', background: '#7a12cc', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const paginationStyles = { padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' };
const pageBtnStyles = (disabled) => ({ padding: '8px', borderRadius: 6, border: '1px solid #e2e8f0', background: disabled ? '#f8fafc' : '#ffffff', color: disabled ? '#94a3b8' : '#475569', cursor: disabled ? 'default' : 'pointer' });
const analyticsGridStyles = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 10 };
const statCardStyles = { display: 'flex', alignItems: 'center', gap: 20, background: '#ffffff', padding: '32px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };
const statIconStyles = (bg, color) => ({ width: 56, height: 56, borderRadius: 14, background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' });
const statLabelStyles = { fontSize: 14, color: '#64748b', marginBottom: 4 };
const statValueStyles = { fontSize: 24, fontWeight: 800, color: '#1e293b' };
const settingsContentStyles = { background: '#ffffff', borderRadius: 16, padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };
const cardHeaderStyles = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 };
const gatewayOptionStyles = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 16 };
const gatewayIconStyles = (color) => ({ width: 44, height: 44, borderRadius: 12, background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 });
const modeToggleStyles = (live) => ({ padding: '8px 16px', background: live ? '#dc2626' : '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer' });
const statusToggleStyles = (on) => ({ padding: '8px 16px', background: on ? '#10b981' : '#f1f5f9', color: on ? 'white' : '#64748b', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' });
const noticeBoxStyles = { display: 'flex', gap: 12, padding: '20px', background: '#fff1f1', borderRadius: 12, border: '1px solid #fecaca', marginTop: 32 };
const loadingContainerStyles = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', fontSize: 14, color: '#64748b' };

