import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Download,
  AlertCircle,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudyRequestsPage() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    course_id: '',
    week_number: 1,
    subject: '',
    topic: '',
    urgency: 'normal',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Load user's enrolled courses for the form
      const { data: uc } = await supabase
        .from('user_courses')
        .select('course:courses(id, name, code)')
        .eq('user_id', user.id);
      
      setCourses(uc?.map(row => row.course) || []);

      // 2. Load all requests for the user's courses (sharing)
      const courseIds = uc?.map(row => row.course.id) || [];
      
      const { data: reqs, error } = await supabase
        .from('notes_requests')
        .select(`
          *,
          user:user_id (email),
          course:course_id (name, code)
        `)
        .in('course_id', courseIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(reqs || []);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('notes_requests')
        .insert({
          ...formData,
          user_id: user.id
        });

      if (error) throw error;
      
      setShowForm(false);
      setFormData({
        course_id: '',
        week_number: 1,
        subject: '',
        topic: '',
        urgency: 'normal',
        description: ''
      });
      loadData(); // Refresh
      alert('Request submitted! Our team will look into it.');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-[#fafbfc]">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1A102D] mb-2 font-outfit">Study Requests</h1>
          <p className="text-slate-500 font-medium">Request notes for missing topics in your courses.</p>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#7a12cc] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {showForm ? <Plus className="rotate-45" /> : <Plus />}
          {showForm ? 'Cancel Request' : 'New Note Request'}
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12"
          >
            <form onSubmit={handleSubmit} className="bg-white border-2 border-purple-100 rounded-3xl p-8 shadow-xl shadow-purple-50/50">
              <h2 className="text-xl font-bold text-[#1A102D] mb-6 flex items-center gap-2">
                <MessageSquare className="text-purple-600" size={24} />
                Tell us what you need
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Select Course*</label>
                  <select 
                    required
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                    value={formData.course_id}
                    onChange={e => setFormData({...formData, course_id: e.target.value})}
                  >
                    <option value="">Select a course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Week Number*</label>
                  <input 
                    type="number" min="1" max="16" required
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                    value={formData.week_number}
                    onChange={e => setFormData({...formData, week_number: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Urgency</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                    value={formData.urgency}
                    onChange={e => setFormData({...formData, urgency: e.target.value})}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Subject/Module Name*</label>
                  <input 
                    type="text" required placeholder="e.g. Introduction to Thermodynamics"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Specific Topic</label>
                  <input 
                    type="text" placeholder="e.g. Entropy and Heat engines"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                    value={formData.topic}
                    onChange={e => setFormData({...formData, topic: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-sm font-bold text-slate-700">Description (Optional)</label>
                <textarea 
                  rows="3"
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                  placeholder="Any specific details or sub-topics you want included?"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <button 
                disabled={submitting}
                className="w-full bg-[#1A102D] text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6">
        <h2 className="text-xl font-bold text-[#1A102D] mb-2 px-2">Recent Requests in your Courses</h2>
        {requests.map((req, idx) => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-purple-100/30 transition-all border-l-8"
            style={{ borderLeftColor: req.status === 'completed' ? '#22c55e' : req.status === 'claimed' ? '#3b82f6' : '#e2e8f0' }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    {req.course?.code}
                  </span>
                  <span className="text-slate-400 text-xs font-bold font-varela">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                  {req.user_id === user.id && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">YOUR REQUEST</span>
                  )}
                </div>
                
                <h3 className="text-xl font-extrabold text-[#1A102D] mb-1 font-outfit">
                  {req.subject}
                </h3>
                <p className="text-slate-500 font-bold text-sm mb-4">
                  {req.course?.name} — Week {req.week_number} • {req.topic}
                </p>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Clock size={14} />
                    STATUS: <span className="text-slate-700 font-black uppercase">{req.status}</span>
                  </div>
                  {req.urgency !== 'normal' && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                    <AlertCircle size={14} />
                    PRIORITY: <span className="font-black uppercase">{req.urgency}</span>
                  </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 min-w-[140px]">
                {req.status === 'completed' && req.result_url ? (
                  <a 
                    href={req.result_url}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                  >
                    <Download size={20} />
                    Get Notes
                  </a>
                ) : (
                  <div className={`px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 ${
                    req.status === 'claimed' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {req.status === 'claimed' ? (
                      <>
                        <Clock size={18} className="animate-pulse" />
                        In Progress
                      </>
                    ) : (
                      <>
                        <Clock size={18} />
                        Pending
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {requests.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <BookOpen size={64} className="mx-auto text-slate-200 mb-6" />
            <h3 className="text-2xl font-black text-[#1A102D] mb-2 font-outfit">No Requests Yet</h3>
            <p className="text-slate-400 max-w-sm mx-auto font-medium">Be the first to request notes for your course and we'll help you get them!</p>
          </div>
        )}
      </div>
      
      <style>{`
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-varela { font-family: 'Varela Round', sans-serif; }
      `}</style>
    </div>
  );
}
