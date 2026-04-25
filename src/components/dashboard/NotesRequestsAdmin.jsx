import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  RiCheckboxCircleFill as CheckCircle2, 
  RiTimeFill as Clock, 
  RiAlertFill as AlertCircle, 
  RiExternalLinkFill as ExternalLink, 
  RiFilterFill as Filter, 
  RiSearchLine as Search,
  RiChat3Fill as MessageSquare,
  RiFileUploadFill as FileUp
} from 'react-icons/ri';

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
        .select(`
          *,
          user:user_id (email),
          course:course_id (name, code)
        `)
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

  if (loading) return <div className="p-8 text-center">Loading requests...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notes Requests</h1>
          <p className="text-slate-500">Manage and fulfill student study note requests</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search requests..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
            {['all', 'pending', 'claimed', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  filter === f ? 'bg-purple-600 text-white' : 'hover:bg-slate-50 text-slate-600 border-l'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredRequests.map((req) => (
          <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    req.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                    req.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {req.urgency}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {req.subject} <span className="text-slate-500 font-normal">({req.topic})</span>
                </h2>
                <div className="flex items-center gap-2 text-purple-600 font-medium mb-3">
                  <span className="bg-purple-50 px-2 py-0.5 rounded">{req.course?.code}</span>
                  <span>{req.course?.name} - Week {req.week_number}</span>
                </div>
                
                <p className="text-slate-600 mb-4 whitespace-pre-wrap">{req.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 size={16} className="text-slate-400" />
                    Requested by: <span className="font-semibold text-slate-700">{req.user?.email}</span>
                  </div>
                </div>
              </div>

              <div className="lg:w-64 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <StatusIndicator status={req.status} />
                  <span className="text-sm font-semibold uppercase">{req.status}</span>
                </div>

                {req.status === 'pending' && (
                  <button 
                    onClick={() => updateStatus(req.id, 'claimed')}
                    className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors"
                  >
                    Claim Request
                  </button>
                )}

                {req.status === 'claimed' && (
                  <>
                    <button 
                      onClick={() => {
                        const url = prompt('Enter PDF Result URL:');
                        if (url) updateStatus(req.id, 'completed', url);
                      }}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileUp size={18} />
                      Mark Completed
                    </button>
                    <button 
                      onClick={() => updateStatus(req.id, 'pending')}
                      className="w-full text-slate-600 py-1 text-sm hover:underline"
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
                    className="w-full flex items-center justify-center gap-2 bg-purple-50 text-purple-700 py-2 rounded-lg font-bold hover:bg-purple-100 transition-colors"
                  >
                    <ExternalLink size={18} />
                    View Result
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredRequests.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No requests found</h3>
            <p className="text-slate-500 text-sm">Wait for students to submit some study requests.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIndicator({ status }) {
  if (status === 'completed') return <CheckCircle2 className="text-green-500" size={20} />;
  if (status === 'claimed') return <Clock className="text-blue-500" size={20} />;
  return <AlertCircle className="text-amber-500" size={20} />;
}
