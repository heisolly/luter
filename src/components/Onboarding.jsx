import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useDashboardPrefetch } from '../context/DashboardPrefetchContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Search, ChevronDown, Bell, Clock, User, RefreshCw, Library, X, Sparkles, ArrowRight, ArrowLeft, Trash2, GraduationCap as GradIcon, Target, Award, Calendar, Layout, ShieldCheck, Activity, Zap, MapPin, Plus } from 'lucide-react';
import logo from '../../asset/logo.png';
import LuterLogo from './shared/LuterLogo';
import { normalizeCourseRow } from '../lib/curriculumSlugs';
import {
  buildCurriculumKeyContext,
  publishCrowdCurriculum,
} from '../services/curriculumService';
import { aggregateSyllabusSources } from '../services/syllabusAggregator';
import { fetchGroqLiveCourseSearch, enrichManualCourseWithGroq } from '../groqClient';
import { saveUserCourseSelections } from '../services/courseSuggestionService';
import EnhancedCourseSuggestions from './EnhancedCourseSuggestions';

/* ─── Static Data ─── */
const GOALS = [
  { id: 'first',  label: '1st Class',       sub: 'CGPA 4.5\\+',       emoji: '🏆', ai: "I'll push you hard — no shortcuts." },
  { id: 'second', label: '2nd Class Upper', sub: 'CGPA 3.5\\+',       emoji: '⭐', ai: "Solid goal. Let's build steady habits." },
  { id: 'pass',   label: 'Just let me pass',sub: 'Pass all courses', emoji: '🙏', ai: "Respect. I'll make sure nothing slips through." },
];

const ROLES = [
  { id: 'student', label: 'Student', icon: '🎓' },
  { id: 'teacher', label: 'Teacher', icon: '👨‍🏫' }
];

const FEATURES_COMPARISON = [
  { name: 'Notes & flashcards', teacher: true, student: true },
  { name: 'Live Record Class', teacher: true, student: true },
  { name: 'PDF Summarizer', teacher: true, student: true },
  { name: 'Mobile App Access', teacher: false, student: true },
  { name: 'AP, IB, SAT, etc. practice', teacher: false, student: true },
  { name: '1:1 Tutoring with Lute', teacher: false, student: true },
  { name: 'Take assessments', teacher: false, student: true },
  { name: 'Access monitored chats', teacher: false, student: true },
];

const SOURCES = [
  'Instagram', 'TikTok', 'ChatGPT', 'App Store',
  'Teacher\u002Fprofessor', 'Friend', 'Google', 'YouTube', 'other'
];

const COMMON_COURSES = [
  'Computer Science', 'Computer Engineering', 'Information Technology',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Medicine and Surgery', 'Nursing', 'Pharmacy',
  'Accounting', 'Business Administration', 'Economics',
  'Mass Communication', 'English Language', 'History', 
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Law', 'International Relations', 'Political Science',
  'Banking and Finance', 'Marketing', 'Human Resource Management'
];

/* ─── Confetti ─── */
function Confetti() {
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    id: i, x: Math.random() * 100,
    color: ['#9718fb','#7a12cc','#b04dfc','#6d28d9','#a78bfa'][i % 5],
    delay: Math.random() * 0.6, duration: 1.4 + Math.random() * 0.8,
  }));
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:999 }}>
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ x:`${p.x}vw`, y:'-10px', rotate:0, opacity:1 }}
          animate={{ y:'110vh', rotate:720, opacity:[1,1,0] }}
          transition={{ duration:p.duration, delay:p.delay, ease:'easeIn' }}
          style={{ position:'absolute', width:10, height:10, background:p.color, borderRadius:2 }}
        />
      ))}
    </div>
  );
}

/* ─── Live ID Card ─── */
function IDCard({ name, university, course, level }) {
  return (
    <motion.div
      initial={{ rotateY:-20, scale:0.9, opacity:0 }}
      animate={{ rotateY:0, scale:1, opacity:1 }}
      transition={{ type:'spring', stiffness:120, damping:20 }}
      style={{
        background: 'white', 
        borderRadius: 24, padding: '24px', color: '#111',
        width: 320, flexShrink: 0, 
        boxShadow: '0 40px 80px -15px rgba(151, 24, 251, 0.08), 0 10px 20px -5px rgba(0,0,0,0.03)',
        border: '1px solid #f1f5f9', 
        position: 'relative', overflow: 'hidden',
        fontFamily: 'var(--font-outfit)',
        perspective: 1000
      }}
    >
      {/* Soft Background Accents */}
      <div style={{ 
        position: 'absolute', top: -50, right: -50, width: 150, height: 150, 
        background: 'var(--primary-bg)', borderRadius: '50%', opacity: 0.4, filter: 'blur(30px)' 
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 2 }}>Luter</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>OFFICIAL MEMBER</div>
          </div>
          <div style={{ width: 44, height: 44, background: '#111', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
            <LuterLogo size={22} white showText={false} />
          </div>
        </div>

        {/* Student Name & Uni */}
        <div style={{ marginBottom: 32 }}>
          <motion.div 
            key={`name-${name || 'default'}`}
            style={{ fontSize: 28, fontWeight: 900, color: '#111', marginBottom: 4, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            {name || 'Prospective Scholar'}
          </motion.div>
          <motion.div 
            key={`university-${university || 'default'}`}
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', opacity: 0.8 }}
          >
            {university || 'Awaiting Institution'}
          </motion.div>
        </div>

        {/* Details Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
          <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: 16, border: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Faculty</div>
            <motion.div 
              key={`course-${course || 'default'}`}
              style={{ fontSize: 12, fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {course || 'Pending Set'}
            </motion.div>
          </div>
          <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: 16, border: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Level</div>
            <motion.div 
              key={`level-${level || 'default'}`}
              style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}
            >
              {level ? `${level} Level` : 'Auth Req.'}
            </motion.div>
          </div>
        </div>

        {/* Footer Bar */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          padding: '12px 16px', background: 'var(--primary-bg)', borderRadius: 14
        }}>
          <div style={{ display:'flex', gap:4 }}>
            {[1,2,3,4].map(idx => <div key={idx} style={{ width:6, height:6, borderRadius:'50%', background: idx === 1 ? 'var(--primary)' : 'rgba(151, 24, 251, 0.2)' }} />)}
          </div>
          <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em' }}>IDVERIFIED</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Slide Transitions ─── */
const slide = {
  enter: (d) => ({
    x: d > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.98
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: (d) => ({
    x: d > 0 ? -50 : 50,
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  }),
};

/* ═══════════════════════════════════════════
   ══ ONBOARDING USER FLOW STEPS ══════════════
   1. Welcome + Account Details
   2. Role Selection (Student\\u002FTeacher)
   3. Academic Registry (University, Major, Level, Term)
   4. Discovery Source (Where they heard about us)
   5. Academic Catalog (Course Selection)
   6. Study Routine (Habits, preferences)
   7. Goals (What they want to achieve)
   8. Referral (Optional)
═══════════════════════════════════════════ */
export default function Onboarding() {
  const navigate = useNavigate();
  const { refresh } = useDashboardPrefetch() || {};
  const [step, setStep]             = useState(1);
  const [totalSteps]                = useState(8);
  const [dir,  setDir]              = useState(1);
  const [authUser, setAuthUser]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showConfetti, setConfetti] = useState(false);
  const [showXP, setShowXP]         = useState(false);
  const [isMobile, setIsMobile]     = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // New Step 1 - Account Details
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // New Step 2 - Role
  const [role, setRole] = useState('student');

  // Step 3 - Registry (Old Step 2)
  const [country, setCountry] = useState('Nigeria');
  const [university, setUniversity] = useState('');
  const [universities, setUniversities] = useState([
    'University of Lagos', 'Obafemi Awolowo University', 'Covenant University',
    'Landmark University', 'University of Ibadan', 'Ahmadu Bello University',
    'University of Nigeria', 'Federal University of Technology', 'Lagos State University'
  ]);
  const [courseOfStudy, setCourseOfStudy] = useState('');
  const [level, setLevel] = useState('');
  const [semester, setSemester] = useState('');
  
  const [uniSearch,  setUniSearch]  = useState('');
  const [showUniDrop,setUniDrop]    = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseDrop, setShowCourseDrop] = useState(false);

  // Step 4 - Source (Old Step 1)
  const [source, setSource] = useState('');

  const [referralCode, setReferralCode] = useState('');

  // Username validation
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  useEffect(() => {
    if (!country) return;
    fetch(`https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json`)
      .then(res => res.json())
      .then(data => {
        const countryUnis = data.filter(u => u.country === country).map(u => u.name).sort();
        setUniversities([...new Set(countryUnis)])
      })
      .catch(err => {
        setUniversities(['Landmark University', 'University of Lagos', 'Obafemi Awolowo University', 'Covenant University'])
      })
  }, [country])

  // Step 3 — library + live search + picks
  const [catalog, setCatalog] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseTypeahead, setCourseTypeahead] = useState('');
  const [aiSearchResults, setAiSearchResults] = useState([]);
  const [liveSearchLoading, setLiveSearchLoading] = useState(false);
  const liveSearchSeqRef = useRef(0);
  const [hitsOpen, setHitsOpen] = useState(false);
  const [curriculumSlotMeta, setCurriculumSlotMeta] = useState({ sourceLabel: '', fromRepository: false });
  const [isPioneerMode, setIsPioneerMode] = useState(false);
  const [curriculumCtx, setCurriculumCtx] = useState(null);
  const [aiBaselineLoading, setAiBaselineLoading] = useState(false);
  const [_aiBaselineError, setAiBaselineError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [_manualEnriching, setManualEnriching] = useState(false);

  // Step 4 - Alarms & Reminders
  const [alarmTime, setAlarmTime] = useState('08:00');
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Step 5 - Goal
  const [goal, setGoal] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/signin'); return; }
      setAuthUser(session.user);
      if (!fullName && session.user.user_metadata?.full_name) {
        setFullName(session.user.user_metadata.full_name);
      }
      // Set initial username from email if not set
      if (!userName && session.user.email) {
        const defaultUser = session.user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        setUserName(defaultUser);
      }
      setLoading(false);
    });
  }, [navigate, fullName]);

  // Check username availability
  useEffect(() => {
    if (!userName || userName.length < 3) {
      setUsernameAvailable(false);
      setUsernameError(userName.length > 0 ? 'Username must be at least 3 characters' : '');
      return;
    }

    const checkAvailability = async () => {
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', userName)
          .single();

        if (error && error.code === 'PGRST116') { // No rows found
          setUsernameAvailable(true);
          setUsernameError('');
        } else if (data) {
          // If it's the current user, it's fine
          if (authUser && data.id === authUser.id) {
            setUsernameAvailable(true);
            setUsernameError('');
          } else {
            setUsernameAvailable(false);
            setUsernameError('This username is already taken');
          }
        } else {
          setUsernameAvailable(false);
          setUsernameError('Error checking username');
        }
      } catch (err) {
        console.error('Username check failed:', err);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [userName, authUser]);

  const [fetchingSyllabus, setFetchingSyllabus] = useState(false);

  const loadCurriculumData = useCallback(async () => {
    setFetchingSyllabus(true);
    setSelectedCourses([]);
    setCourseTypeahead('');
    setAiSearchResults([]);
    setHitsOpen(false);
    setAiBaselineError(null);
    try {
      const { catalog: next, hasLiveAdmin } = await aggregateSyllabusSources({
        university,
        department: courseOfStudy,
        level,
        semester,
        country,
      });
      setCatalog(next);
      setCurriculumCtx(buildCurriculumKeyContext(university, courseOfStudy, level, semester));
      setIsPioneerMode(!hasLiveAdmin);
      setCurriculumSlotMeta({
        sourceLabel: hasLiveAdmin ? 'merged' : 'merged_pioneer',
        fromRepository: hasLiveAdmin,
      });
    } catch (e) {
      console.warn(e);
      setCatalog([]);
      setAiBaselineError('Could not load courses. Try again.');
    }
    setFetchingSyllabus(false);
  }, [university, courseOfStudy, level, semester, country]);

  const _runAiBaseline = async () => {
    setAiBaselineLoading(true);
    setAiBaselineError(null);
    try {
      const { catalog: next, hasLiveAdmin } = await aggregateSyllabusSources({
        university,
        department: courseOfStudy,
        level,
        semester,
        country,
      });
      setCatalog(next);
      setSelectedCourses([]);
      setCurriculumCtx(buildCurriculumKeyContext(university, courseOfStudy, level, semester));
      setIsPioneerMode(!hasLiveAdmin);
      setCurriculumSlotMeta((prev) => ({
        ...prev,
        sourceLabel: 'refreshed',
        fromRepository: hasLiveAdmin,
      }));
    } catch (e) {
      console.warn(e);
      setAiBaselineError('Could not refresh the list. Try again or add courses below.');
    }
    setAiBaselineLoading(false);
  };

  const libraryHits = useMemo(() => {
    const q = courseTypeahead.trim().toUpperCase();
    if (!q) return [];
    return catalog
      .filter(
        (c) =>
          c.code.includes(q) || (c.name && c.name.toUpperCase().includes(q)),
      )
      .slice(0, 30);
  }, [catalog, courseTypeahead]);

  const _combinedHits = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const c of libraryHits) {
      if (seen.has(c.code)) continue;
      seen.add(c.code);
      out.push({ code: c.code, name: c.name, hitKind: 'library' });
    }
    for (const c of aiSearchResults) {
      if (!c?.code || seen.has(c.code)) continue;
      seen.add(c.code);
      out.push({ code: c.code, name: c.name, hitKind: 'match' });
    }
    return out.slice(0, 45);
  }, [libraryHits, aiSearchResults]);

  useEffect(() => {
    if (step !== 3) return;
    const q = courseTypeahead.trim();
    if (q.length < 2) {
      setAiSearchResults([]);
      setLiveSearchLoading(false);
      return;
    }
    const seq = ++liveSearchSeqRef.current;
    setLiveSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const rows = await fetchGroqLiveCourseSearch({
          query: q,
          country,
          university,
          department: courseOfStudy,
          level,
          semester,
        });
        if (liveSearchSeqRef.current !== seq) return;
        setAiSearchResults(Array.isArray(rows) ? rows : []);
      } catch {
        if (liveSearchSeqRef.current === seq) setAiSearchResults([]);
      } finally {
        if (liveSearchSeqRef.current === seq) setLiveSearchLoading(false);
      }
    }, 420);
    return () => clearTimeout(t);
  }, [courseTypeahead, step, country, university, courseOfStudy, level, semester]);

  const _pickCourse = (code, name, hitKind) => {
    setSelectedCourses((prev) => {
      if (prev.some((p) => p.code === code)) return prev;
      return [...prev, { code, name, hitKind }];
    });
    setCourseTypeahead('');
    setHitsOpen(false);
  };

  const _removeFromSelected = (code) => {
    setSelectedCourses((prev) => prev.filter((p) => p.code !== code));
  };

  const _addManualWithEnrich = async () => {
    if (!manualCode.trim() || !manualTitle.trim()) return;
    const n = normalizeCourseRow({ code: manualCode, name: manualTitle });
    if (!n.code) return;
    if (selectedCourses.some((p) => p.code === n.code)) return;
    setManualEnriching(true);
    try {
      let snippet = '';
      try {
        const r = await fetch('/api/v1/syllabus/web', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            university,
            department: courseOfStudy,
            level,
            semester,
            searchFocus: `${n.code} ${n.name} undergraduate course Nigeria`,
            includeSnippet: true,
          }),
        });
        const j = await r.json();
        snippet = j.snippet || '';
      } catch {
        /* optional web context */
      }
      let enrichment = null;
      try {
        enrichment = await enrichManualCourseWithGroq({
          code: n.code,
          name: n.name,
          country,
          university,
          department: courseOfStudy,
          level,
          semester,
          webSnippet: snippet,
        });
      } catch {
        /* still add course */
      }
      setCatalog((prev) =>
        prev.some((c) => c.code === n.code) ? prev : [...prev, { ...n, source: 'manual' }],
      );
      setSelectedCourses((prev) => [
        ...prev,
        { code: n.code, name: n.name, hitKind: 'manual', enrichment },
      ]);
      setManualCode('');
      setManualTitle('');
    } finally {
      setManualEnriching(false);
    }
  };

  const goTo = useCallback(
    (next) => {
      if (next === 6 && step < 6) {
        loadCurriculumData();
      }
      setDir(next > step ? 1 : -1);
      setStep(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [step, loadCurriculumData],
  );

  const _loadPct = Math.min(
    100,
    Math.round((selectedCourses.length / 14) * 100),
  );
  const _aiMsg = () => {
    const n = selectedCourses.length;
    if (n === 0) return null;
    if (n >= 12)
      return { msg: "Heavy load! Luter is ready to carry the weight.", color: '#dc2626' };
    if (n >= 6)
      return { msg: "Ambitious! I'll help manage this schedule.", color: '#d97706' };
    return { msg: `${n} course${n > 1 ? 's' : ''} added. Solid plan!`, color: '#10B981' };
  };

  /* ── Finish — write everything to Supabase ── */
  const finish = async (chosenGoal) => {
    if (!authUser) return;
    setSaving(true);

    const finalName = fullName || authUser.user_metadata?.full_name || '';

    // 0. Update auth user metadata
    if (finalName && finalName !== authUser.user_metadata?.full_name) {
      await supabase.auth.updateUser({
        data: { full_name: finalName }
      });
    }

    const ctx = curriculumCtx || buildCurriculumKeyContext(university, courseOfStudy, level, semester);
    const enriched_manual = {};
    for (const c of selectedCourses) {
      if (c.enrichment && c.code) enriched_manual[c.code] = c.enrichment;
    }
    const curriculum_context = {
      ...ctx,
      university_label: university,
      department_label: courseOfStudy,
      ...(Object.keys(enriched_manual).length > 0 ? { enriched_manual } : {}),
    };

    // Deep clone curriculum_context to avoid circular references
    const clean_curriculum_context = JSON.parse(JSON.stringify(curriculum_context));

    // 1. Update primary profile using the specific metadata and existing columns
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: authUser.id,
      full_name: fullName || authUser.user_metadata?.full_name || '',
      username: userName || authUser.email?.split('@')[0],
      university: university?.name || university,
      level: level,
      semester: semester,
      faculty: courseOfStudy,
      onboarding_complete: true,
      updated_at: new Date(),
    });

    if (profileErr) {
      if (profileErr.code === '23505') {
        setSaving(false);
        setStep(2); // Go back to profile step
        setUsernameError('This username is already taken. Please choose another.');
        setUsernameAvailable(false);
        return;
      }
      console.error('Profile upsert error:', profileErr);
    }

    const selectedCodes = selectedCourses.map((c) => c.code);
    const coursesToUpsert = selectedCourses.map((c) => ({
      code: c.code,
      name: c.name,
      faculty: courseOfStudy,
    }));

    // Auto-upserting missing syllabus directly
    if (coursesToUpsert.length > 0) {
      // Step A: Safely insert or update missing global catalog syllabus
      const { error: upsertErr } = await supabase.from('courses').upsert(coursesToUpsert, { onConflict: 'code' });
      if (upsertErr) {
        console.error('Onboarding courses upsert error:', upsertErr);
      }

      // Step B: Force fetch the final official DB Row IDs
      const { data: globalCourses, error: fetchErr } = await supabase
        .from('courses')
        .select('id, code')
        .in('code', selectedCodes);

      if (fetchErr) console.error('Onboarding courses fetch error:', fetchErr);

      // 3. Link real tracked user_courses
      if (globalCourses && globalCourses.length > 0) {
        const rows = globalCourses.map(c => ({
          user_id:   authUser.id,
          course_id: c.id,
          progress:  0,
          target_score: chosenGoal === 'first' ? 90 : chosenGoal === 'second' ? 75 : 50,
        }));
        
        // Insert user courses
        const { error: insertError } = await supabase.from('user_courses').upsert(rows, { onConflict: 'user_id,course_id' });
        
        if (insertError) {
          console.error('Onboarding user_courses link error:', insertError);
        } else {
          // Apply freemium locking (20% rule)
          const { error: lockingError } = await supabase.rpc('apply_freemium_locking', {
            p_user_id: authUser.id,
            p_course_ids: globalCourses.map(c => c.id)
          });
          
          if (lockingError) {
            console.error('Error applying freemium locking:', lockingError);
          }
        }
      }
    }

    let pioneerXp = 0;
    if (isPioneerMode) {
      const mergedMap = new Map(catalog.map((c) => [c.code, c]));
      for (const s of selectedCourses) {
        if (!mergedMap.has(s.code))
          mergedMap.set(s.code, { code: s.code, name: s.name });
      }
      if (mergedMap.size > 0) {
        const { error: pubErr } = await publishCrowdCurriculum(supabase, {
          ctx,
          universityName: university,
          departmentLabel: courseOfStudy,
          catalogCourses: [...mergedMap.values()],
          contributorId: authUser.id,
        });
        if (!pubErr) pioneerXp = 500;
      }
    }

    // 4. Initialize tracker (pioneers who map a new syllabus earn +500 XP)
    await supabase.from('user_stats').upsert(
      {
        user_id: authUser.id,
        total_xp: pioneerXp + 100,
        streak_days: 0,
        lives: 3,
        badges: [],
      },
      { onConflict: 'user_id' },
    );

    // 5. Save course selections for peer recommendations
    try {
      await saveUserCourseSelections(authUser.id, university, courseOfStudy, level, semester, selectedCourses);
    } catch (_error) {
      // Course selection save failed silently
    }

    // 6. Celebration mapping
    if (refresh) await refresh();
    setConfetti(true);
    setTimeout(() => setShowXP(true), 400);
    setTimeout(() => navigate('/dashboard'), 2800);
  };

  const filteredUnis = universities.filter(u =>
    u.toLowerCase().includes(uniSearch.toLowerCase())
  ).slice(0, 8);

  const filteredCourses = COMMON_COURSES.filter(c =>
    c.toLowerCase().includes(courseSearch.toLowerCase())
  ).slice(0, 8);

  const inputStyles = { 
    width:'100%', 
    padding:'16px 20px', 
    borderRadius:16, 
    border: '2px solid rgba(151,24,251,0.1)', 
    fontSize:16, 
    color:'#111', 
    outline:'none', 
    fontFamily:'inherit', 
    background:'rgba(255,255,255,0.8)', 
    backdropFilter: 'blur(10px)',
    boxSizing:'border-box', 
    transition:'all 0.2s', 
    appearance: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
  };
  const activeInputStyles = { ...inputStyles, border: '2px solid var(--primary)', background: 'white' };

  if (loading) {
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fbfcfd' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat:Infinity, duration:1, ease:'linear' }}
          style={{ width:40, height:40, border:'3px solid var(--primary)', borderTopColor:'transparent', borderRadius:'50%' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#fff', color:'#111', fontFamily:'var(--font-outfit)', overflowX: 'hidden' }}>

      {/* ─── PROGRESS BAR & BACK ─── */}
      <div style={{ 
        position:'fixed', top:0, left:0, right:0, height:60, 
        background:'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex:100, display:'flex', alignItems:'center', padding: '0 24px',
        borderBottom: '1px solid rgba(0,0,0,0.05)'
      }}>
        {step > 1 && (
          <button 
            onClick={() => goTo(step - 1)}
            style={{ color: '#afafaf', padding: 8, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#333'}
            onMouseLeave={(e) => e.target.style.color = '#afafaf'}
          >
            <ArrowLeft size={32} strokeWidth={3} />
          </button>
        )}
        <div style={{ flex: 1, height: 10, background: 'rgba(0,0,0,0.05)', borderRadius: 99, margin: '0 24px', position: 'relative', overflow: 'hidden' }}>
          <motion.div 
            initial={false}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            style={{ height: '100%', background: 'var(--primary)', borderRadius: 99 }} 
          />
        </div>
        <div style={{ width: 40 }} /> {/* Spacer */}
      </div>

      <div className="hero-bg">
        <div className="hero-bg-grid" />
        <div style={{ position: 'absolute', top: '15%', right: '10%', animation: 'float-up-down 8s ease-in-out infinite', opacity: 0.3 }}>
          <Library size={48} color="var(--primary)" />
        </div>
        <div style={{ position: 'absolute', bottom: '20%', left: '8%', animation: 'float-up-down 6s ease-in-out infinite reverse', opacity: 0.3 }}>
          <GradIcon size={40} color="var(--primary)" />
        </div>
      </div>

      <main style={{ 
        paddingTop: 80, 
        paddingBottom: 60,
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        minHeight: '100vh', 
        width: '100%',
        background: 'transparent',
        position: 'relative'
      }}>
        {/* Content Container (The Box) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            width: '100%', 
            maxWidth: (step === 6 ? 1100 : (step === 4 || step === 5) ? 1000 : 720), 
            zIndex: 20, 
            padding: isMobile ? '24px 20px' : '48px 60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 32,
            border: '1.5px solid rgba(255,255,255,0.2)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
            margin: 'auto 20px',
            position: 'relative'
          }}
        >
          {step > 1 && step < 9 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              style={{ 
                position: 'absolute', 
                top: -40, 
                left: -40, 
                zIndex: 40,
                pointerEvents: 'none'
              }}
            >
               <img 
                  src="/onboard-mascot.png" 
                  style={{ 
                    width: 100, 
                    height: 'auto', 
                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))' 
                  }}
                  alt="Lute"
                />
            </motion.div>
          )}
          
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ 
                width: '100%',
                background: 'transparent'
              }}
            >

            {/* ══ STEP 1 — Welcome ══ */}
            {step === 1 && (
              <div style={{
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                justifyContent:'center',
                textAlign: 'center',
                minHeight: 500,
                width: '100%',
                position: 'relative'
              }}>
                {/* Speech Bubble */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    background: 'white',
                    padding: '16px 32px',
                    borderRadius: 24,
                    border: '2px solid #E5E7EB',
                    position: 'relative',
                    marginBottom: 32,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                    maxWidth: 320
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>
                    Hi there! I'm Lute!
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#666', marginTop: 4 }}>
                    Let's get everything set up for you.
                  </div>
                  {/* Bubble Pointer */}
                  <div style={{
                    position: 'absolute',
                    bottom: -10,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: 20,
                    height: 20,
                    background: 'white',
                    borderRight: '2px solid #E5E7EB',
                    borderBottom: '2px solid #E5E7EB',
                    zIndex: -1
                  }} />
                </motion.div>

                {/* Mascot */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  style={{ marginBottom: 40 }}
                >
                  <motion.img 
                    src="/onboard-mascot.png" 
                    alt="Lute Mascot" 
                    style={{ width: 220, height: 'auto', filter: 'drop-shadow(0 20px 40px rgba(151, 24, 251, 0.15))' }}
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, -2, 2, 0]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                </motion.div>

                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <button 
                    onClick={() => goTo(2)}
                    className="btn-primary"
                    style={{ 
                      padding: '18px 48px', 
                      borderRadius: 18,
                      fontSize: 16,
                      fontWeight: 800,
                      width: 'fit-content',
                      minWidth: 280,
                      justifyContent: 'center',
                      boxShadow: '0 10px 30px var(--primary-glow)'
                    }}
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 2 — Profile ══ */}
            {step === 2 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 2: Your Profile</span>
                </div>
                <h1 style={{ fontSize: window.innerWidth <= 768 ? 28 : 36, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12, color:'#111', lineHeight:1.1 }}>Let's personalize Luter.</h1>
                <p style={{ color:'#666', fontSize:16, lineHeight:1.6, marginBottom:32, fontWeight:500 }}>Tell us a bit about yourself so Lute can tailor your experience.</p>
                
                <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative' }}>
                    <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary-dark), var(--primary))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:32, fontWeight:700, boxShadow:'0 8px 20px var(--primary-glow)' }}>
                      {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div style={{ flex:1 }}>
                      <label style={{ fontSize:12, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Full Name</label>
                      <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Olly Luter" style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid #e2e8f0', background:'white', fontSize:15, outline:'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Username</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        value={userName} 
                        onChange={e => setUserName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                        placeholder="luter_student" 
                        style={{ 
                          width:'100%', 
                          padding:'14px 16px', 
                          paddingRight: 40,
                          borderRadius:12, 
                          border:`1px solid ${usernameError ? '#ef4444' : usernameAvailable ? '#10b981' : '#e2e8f0'}`, 
                          background:'white', 
                          fontSize:15, 
                          outline:'none' 
                        }} 
                      />
                      <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                        {checkingUsername ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <RefreshCw size={16} color="#64748B" />
                          </motion.div>
                        ) : usernameAvailable ? (
                          <CheckCircle2 size={18} color="#10b981" />
                        ) : usernameError ? (
                          <AlertCircle size={18} color="#ef4444" />
                        ) : null}
                      </div>
                    </div>
                    {usernameError && (
                      <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4, fontWeight: 500 }}>{usernameError}</p>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 48, width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    onClick={() => goTo(3)}
                    disabled={!fullName || !userName || !usernameAvailable || checkingUsername}
                    className="btn-primary"
                    style={{ 
                      padding: '18px 48px', 
                      borderRadius: 18,
                      fontSize: 16,
                      fontWeight: 800,
                      width: 'fit-content',
                      minWidth: 280,
                      opacity: (!fullName || !userName || !usernameAvailable || checkingUsername) ? 0.3 : 1,
                      cursor: (!fullName || !userName || !usernameAvailable || checkingUsername) ? 'not-allowed' : 'pointer',
                      justifyContent: 'center',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 3 — Role Selection ══ */}
            {step === 3 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 3: Your Identity</span>
                </div>
                <h1 style={{ fontSize: window.innerWidth <= 768 ? 28 : 36, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12, color:'#111' }}>How will you use Luter?</h1>
                <p style={{ color:'#666', fontSize:16, marginBottom:40, fontWeight:500 }}>We'll customize your workspace based on your role.</p>
                
                <div style={{ display:'flex', gap:20, justifyContent:'center', marginBottom:48, flexDirection: window.innerWidth <= 640 ? 'column' : 'row' }}>
                  {ROLES.map(r => (
                    <motion.div
                      key={r.id}
                      whileHover={{ y:-4, boxShadow: '0 20px 40px rgba(151, 24, 251, 0.12)' }}
                      onClick={() => setRole(r.id)}
                      style={{
                        flex:1, 
                        maxWidth: window.innerWidth <= 640 ? '100%' : 240, 
                        padding:'40px 24px', borderRadius:24, cursor:'pointer',
                        border:'2px solid', borderColor: role === r.id ? 'var(--primary)' : '#e2e8f0',
                        background: role === r.id ? 'var(--primary-bg)' : 'white',
                        transition:'all 0.2s', textAlign:'center'
                      }}
                    >
                      <div style={{ fontSize:40, marginBottom:16 }}>{r.icon}</div>
                      <div style={{ fontWeight:800, fontSize:18, color:'#111' }}>{r.label}</div>
                    </motion.div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button 
                    onClick={() => goTo(4)}
                    className="btn-primary"
                    style={{ 
                      padding: '18px 60px', 
                      borderRadius: 18,
                      fontSize: 16,
                      fontWeight: 800,
                      justifyContent: 'center'
                    }}
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 4 — Registry ══ */}
            {step === 4 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display:'flex', gap:48, flexDirection: (isMobile || window.innerWidth <= 1024) ? 'column' : 'row', width: '100%' }}>
                  <div style={{ flex:1.5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
                      <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 4: Academic Registry</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12, color:'#111', lineHeight:1.1 }}>Where are you studying?</h1>
                    <p style={{ color:'#666', fontSize:15, marginBottom:32, fontWeight:500 }}>Lute needs this to find your official curriculum and courses.</p>

                    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                      <div style={{ position:'relative' }}>
                        <label style={{ fontSize:11, fontWeight:800, color:'#94A3B8', display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>Institution name</label>
                        <div style={{ position:'relative' }}>
                          <div style={{ position:'absolute', left:18, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}><Search size={18}/></div>
                          <input 
                            value={uniSearch} 
                            onChange={e => {
                              setUniSearch(e.target.value);
                              setUniversity(e.target.value);
                              setUniDrop(true);
                            }}
                            onFocus={() => {
                              setUniDrop(true);
                              setShowCourseDrop(false);
                            }} 
                            placeholder="Search for your university..." 
                            style={{ width:'100%', padding:'18px 18px 18px 48px', borderRadius:18, border:'1.5px solid #F1F5F9', background:'white', fontSize:15, fontWeight:700, outline:'none' }} 
                          />
                        </div>
                        {showUniDrop && uniSearch.length > 0 && filteredUnis.length > 0 && (
                          <div style={{ 
                            position:'absolute', top:'100%', left:0, right:0, zIndex:30, 
                            background:'white', borderRadius:18, padding:8, marginTop:8, 
                            boxShadow:'0 20px 50px rgba(0,0,0,0.1)', border:'1px solid #F1F5F9',
                            maxHeight: 250, overflowY: 'auto'
                          }}>
                            {filteredUnis.map(u => (
                              <div key={u} onClick={() => { setUniversity(u); setUniSearch(u); setUniDrop(false); }} style={{ padding:'12px 16px', borderRadius:12, cursor:'pointer', fontWeight:600, fontSize:14, color:'#334155' }} className="hover-bg-primary-lite">
                                {u}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ position:'relative' }}>
                        <label style={{ fontSize:11, fontWeight:800, color:'#94A3B8', display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>What's your major?</label>
                        <div style={{ position:'relative' }}>
                          <div style={{ position:'absolute', left:18, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}><GradIcon size={18}/></div>
                          <input 
                            value={courseSearch} 
                            onChange={e => {
                              setCourseSearch(e.target.value);
                              setCourseOfStudy(e.target.value);
                              setShowCourseDrop(true);
                            }}
                            onFocus={() => {
                              setShowCourseDrop(true);
                              setUniDrop(false);
                            }}
                            placeholder="Computer Science, Nursing, etc." 
                            style={{ width:'100%', padding:'18px 18px 18px 48px', borderRadius:18, border:'1.5px solid #F1F5F9', background:'white', fontSize:15, fontWeight:700, outline:'none' }} 
                          />
                        </div>
                        {showCourseDrop && courseSearch.length > 0 && filteredCourses.length > 0 && (
                          <div style={{ 
                            position:'absolute', top:'100%', left:0, right:0, zIndex:30, 
                            background:'white', borderRadius:18, padding:8, marginTop:8, 
                            boxShadow:'0 20px 50px rgba(0,0,0,0.1)', border:'1px solid #F1F5F9',
                            maxHeight: 250, overflowY: 'auto'
                          }}>
                            {filteredCourses.map(c => (
                              <div key={c} onClick={() => { setCourseOfStudy(c); setCourseSearch(c); setShowCourseDrop(false); }} style={{ padding:'12px 16px', borderRadius:12, cursor:'pointer', fontWeight:600, fontSize:14, color:'#334155' }} className="hover-bg-primary-lite">{c}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display:'flex', gap:16 }}>
                        <div style={{ flex:1, minWidth: 140 }}>
                          <label style={{ fontSize:11, fontWeight:800, color:'#94A3B8', display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>Current Level</label>
                          <select value={level} onChange={e => setLevel(e.target.value)} style={{ width:'100%', padding:'18px 12px', borderRadius:18, border:'1.5px solid #F1F5F9', background:'white', fontSize:14, fontWeight:700, outline:'none', cursor:'pointer' }}>
                            <option value="">Select Level</option>
                            {['100', '200', '300', '400', '500', '600', 'Postgraduate'].map(l => <option key={l} value={l}>{l} Level</option>)}
                          </select>
                        </div>
                        <div style={{ flex:1, minWidth: 140 }}>
                          <label style={{ fontSize:11, fontWeight:800, color:'#94A3B8', display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>Academic term</label>
                          <select value={semester} onChange={e => setSemester(e.target.value)} style={{ width:'100%', padding:'18px 12px', borderRadius:18, border:'1.5px solid #F1F5F9', background:'white', fontSize:14, fontWeight:700, outline:'none', cursor:'pointer' }}>
                            <option value="">Select Term</option>
                            <option value="1">1st Semester</option>
                            <option value="2">2nd Semester</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex:0.8, display:'flex', justifyContent:'center', alignItems: 'center' }}>
                    <div style={{ position:'relative', width: '100%', maxWidth: 320 }}>
                      <div style={{ position:'absolute', inset:-20, background:'var(--primary-bg)', filter:'blur(40px)', opacity:0.3, borderRadius:'50%', zIndex:0 }} />
                      <IDCard name={fullName} university={university} level={level} course={courseOfStudy} />
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                    <button 
                      onClick={() => goTo(5)}
                      disabled={!university || !courseOfStudy || !level || !semester}
                      className="btn-primary"
                      style={{ 
                        padding: '18px 48px', 
                        borderRadius: 18,
                        fontSize: 16,
                        fontWeight: 800,
                        width: 'fit-content',
                        minWidth: 280,
                        opacity: (!university || !courseOfStudy || !level || !semester) ? 0.3 : 1,
                        cursor: (!university || !courseOfStudy || !level || !semester) ? 'not-allowed' : 'pointer',
                        justifyContent: 'center'
                      }}
                    >
                      CONTINUE
                    </button>
                  </div>
              </div>
            )}

            {/* ══ STEP 5 — Academic Catalog ══ */}
            {step === 5 && (
              <div style={{ width:'100%', maxWidth:900, margin:'0 auto' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 5: Your Catalog</span>
                </div>
                 <div style={{ display:'grid', gridTemplateColumns: window.innerWidth <= 1024 ? '1fr' : '1.5fr 1fr', gap:48, alignItems:'flex-start' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
                    <EnhancedCourseSuggestions
                      university={university}
                      department={courseOfStudy}
                      level={level}
                      semester={semester}
                      country={country}
                      selectedCourses={selectedCourses}
                      onCourseSelect={(c) => _pickCourse(c.code, c.name, c.hitKind || 'library')}
                      onCourseRemove={_removeFromSelected}
                    />

                    {/* Manual Entry — Discreet */}
                    <div style={{ 
                      padding: 24, background: '#F8FAFC', borderRadius: 24, border: '1px solid #F1F5F9',
                      display: 'flex', flexDirection: 'column', gap: 16
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Can't find a course?
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input 
                          value={manualCode} 
                          onChange={e => setManualCode(e.target.value.toUpperCase())} 
                          placeholder="Code" 
                          style={{ width: 100, padding: '14px', borderRadius: 16, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 700, outline: 'none' }} 
                        />
                        <input 
                          value={manualTitle} 
                          onChange={e => setManualTitle(e.target.value)} 
                          placeholder="Course Title" 
                          style={{ flex: 1, padding: '14px', borderRadius: 16, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 700, outline: 'none' }} 
                        />
                        <button 
                          onClick={_addManualWithEnrich} 
                          style={{ width: 48, height: 48, borderRadius: 16, background: '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Registry / Basket */}
                  <div style={{ 
                    background: 'white', border: '1.5px solid #F1F5F9', borderRadius: 28, padding: 32,
                    position: 'sticky', top: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: 0 }}>Enrolled</h3>
                      <div style={{ padding: '4px 12px', background: 'var(--primary-bg)', borderRadius: 10, color: 'var(--primary)', fontSize: 12, fontWeight: 900 }}>
                        {selectedCourses.length} COURSES
                      </div>
                    </div>

                    {selectedCourses.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.4 }}>
                        <div style={{ marginBottom: 12 }}><Sparkles size={24} style={{ margin: '0 auto' }} /></div>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>Your catalog is empty.<br/>Select courses to start.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {selectedCourses.map((course) => (
                          <motion.div
                            key={course.code}
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, 
                              background: '#F8FAFC', border: '1px solid #F1F5F9' 
                            }}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'var(--primary)', border: '1px solid #F1F5F9' }}>
                              {course.code.substring(0, 3)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 800 }}>{course.code}</div>
                            </div>
                            <button 
                              onClick={() => _removeFromSelected(course.code)}
                              style={{ padding: 6, borderRadius: 8, color: '#94A3B8', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            >
                              <X size={16} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid #F1F5F9' }}>
                        <button 
                          onClick={() => goTo(6)}
                          disabled={selectedCourses.length === 0}
                          className="btn-primary"
                          style={{ 
                            width: '100%', 
                            opacity: selectedCourses.length === 0 ? 0.3 : 1,
                            padding: '18px 0',
                            borderRadius: 18,
                            fontSize: 14,
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            cursor: selectedCourses.length === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: selectedCourses.length > 0 ? '0 10px 25px var(--primary-glow)' : 'none'
                          }}
                        >
                          CONTINUE
                          <ArrowRight size={16} />
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 6 — Routine ══ */}
            {step === 6 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 6: Habits</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12, color:'#111' }}>Build your routine.</h1>
                <p style={{ color:'#666', fontSize:16, marginBottom:40, fontWeight:500 }}>Lute will wake you up and send study reminders.</p>

                <div style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
                   <div style={{ background:'white', padding:32, borderRadius:24, border:'1px solid #e2e8f0', boxShadow:'0 10px 30px rgba(0,0,0,0.03)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, justifyContent:'center' }}>
                      <Clock size={24} color="var(--primary)" />
                      <h3 style={{ fontSize:18, fontWeight:800, color:'#111', margin:0 }}>Study Wake-up</h3>
                    </div>
                    <input 
                      type="time" 
                      value={alarmTime}
                      onChange={e => setAlarmTime(e.target.value)}
                      style={{ 
                        width:'100%', padding:'16px', borderRadius:16, border:'2px solid var(--primary-bg)', 
                        background:'var(--primary-bg)', fontSize:32, fontWeight:800, textAlign:'center', 
                        color:'var(--primary-dark)', outline:'none' 
                      }}
                    />
                  </div>

                  <div onClick={() => setRemindersEnabled(!remindersEnabled)} style={{ 
                    display:'flex', alignItems:'center', gap:16, padding:24, borderRadius:20, 
                    border:'2px solid', borderColor: remindersEnabled ? 'var(--primary)' : '#e2e8f0',
                    background: remindersEnabled ? 'var(--primary-bg)' : 'white', cursor:'pointer', transition:'all 0.2s'
                  }}>
                    <div style={{ 
                      width:50, height:50, borderRadius:12, 
                      background: remindersEnabled ? 'var(--primary)' : '#f1f5f9', 
                      display:'flex', alignItems:'center', justifyContent:'center', color: remindersEnabled ? 'white' : '#94A3B8'
                    }}>
                      <Bell size={24} />
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <div style={{ fontWeight:800, fontSize:16, color:'#111' }}>Smart Reminders</div>
                      <div style={{ fontSize:13, color:'#666', fontWeight:500 }}>Lute will nudge you when it's time to study.</div>
                    </div>
                    <div style={{ 
                      width:44, height:24, borderRadius:99, background: remindersEnabled ? 'var(--primary)' : '#cbd5e1',
                      position:'relative', padding:4
                    }}>
                      <motion.div 
                        animate={{ x: remindersEnabled ? 20 : 0 }}
                        style={{ width:16, height:16, borderRadius:'50%', background:'white' }} 
                      />
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', maxWidth: 400, marginTop: 40, margin: '40px auto 0', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    onClick={() => goTo(7)}
                    className="btn-primary"
                    style={{ 
                      padding: '18px 48px', 
                      borderRadius: 18,
                      fontSize: 16,
                      fontWeight: 800,
                      width: 'fit-content', 
                      minWidth: 280,
                      justifyContent: 'center'
                    }}
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 7 — Goals ══ */}
            {step === 7 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 7: Ambition</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12, color:'#111' }}>Aim for the clouds.</h1>
                <p style={{ color:'#666', fontSize:16, marginBottom:40, fontWeight:500 }}>What's your target this semester?</p>

                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {GOALS.map(g => (
                    <motion.div
                      key={g.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setGoal(g.id)}
                      style={{
                        padding:24, borderRadius:24, cursor:'pointer',
                        border:'2px solid', borderColor: goal === g.id ? 'var(--primary)' : '#e2e8f0',
                        background: goal === g.id ? 'var(--primary-bg)' : 'white',
                        display:'flex', alignItems:'center', gap:20, textAlign:'left', transition:'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize:32 }}>{g.emoji}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:18, color:'#111' }}>{g.label}</div>
                        <div style={{ fontSize:14, color:'#666', fontWeight:500 }}>{g.sub}</div>
                      </div>
                      {goal === g.id && (
                        <div style={{ padding:12, background: 'rgba(151, 24, 251, 0.05)', borderRadius:16, maxWidth:200 }}>
                          <p style={{ margin:0, fontSize:12, color: 'var(--primary-dark)', fontWeight:600, fontStyle:'italic' }}>"{g.ai}"</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div style={{ width: '100%', maxWidth: 400, margin: '24px auto 0', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    onClick={() => goTo(8)}
                    className="btn-primary"
                    style={{ 
                      padding: '18px 48px', 
                      borderRadius: 18,
                      fontSize: 16,
                      fontWeight: 800,
                      width: 'fit-content',
                      minWidth: 280, 
                      justifyContent: 'center'
                    }}
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 8 — Referral ══ */}
            {step === 8 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 8: Network</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12, color:'#111' }}>Better with friends.</h1>
                <p style={{ color:'#666', fontSize:16, marginBottom:40, fontWeight:500 }}>If you were referred, enter the code below to earn 100 XP.</p>

                <div style={{ maxWidth: 400, margin: '0 auto' }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:18, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}><Award size={20}/></div>
                    <input value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder="REF-CODE" style={{ width:'100%', padding:'18px 18px 18px 48px', borderRadius:18, border:'1.5px solid #F1F5F9', background:'white', fontSize:18, fontWeight:800, outline:'none', letterSpacing:'0.1em' }} />
                  </div>
                  <div style={{ marginTop:24, padding:20, background: 'rgba(151,24,251,0.03)', borderRadius:20, border: '1px dashed var(--primary)' }}>
                    <p style={{ margin:0, fontSize:14, color: 'var(--primary-dark)', fontWeight:600 }}>Tip: You'll get your own referral code after finishing the setup!</p>
                  </div>
                </div>

                <div style={{ width: '100%', maxWidth: 400, margin: '24px auto 0', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    onClick={() => finish(goal)} 
                    disabled={saving}
                    className="btn-primary"
                    style={{ 
                      padding: '18px 48px', 
                      borderRadius: 18,
                      fontSize: 16,
                      fontWeight: 800,
                      width: 'fit-content',
                      minWidth: 280,
                      justifyContent: 'center',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {saving ? 'PREPARING...' : 'FINISH'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
          </AnimatePresence>
        </motion.div>

      {/* Completion Overlay — High Fidelity Celebration */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 2000, 
              background: 'white', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            <Confetti />
            
            {/* Background Studio Glows */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 500, height: 500, background: 'rgba(151, 24, 251, 0.04)', borderRadius: '50%', filter: 'blur(80px)' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 500, height: 500, background: 'rgba(151, 24, 251, 0.04)', borderRadius: '50%', filter: 'blur(80px)' }} />

            <motion.div 
              style={{ textAlign: 'center', zIndex: 10, position: 'relative' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* Celebrating Mascot */}
              <div style={{ marginBottom: 40, position: 'relative' }}>
                <motion.div
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  style={{ 
                    position: 'absolute', top: -30, right: -20, 
                    background: 'var(--primary)', color: 'white', 
                    padding: '8px 16px', borderRadius: 20, 
                    fontSize: 14, fontWeight: 900, 
                    boxShadow: '0 8px 20px var(--primary-glow)',
                    zIndex: 2
                  }}
                >
                  YEAH! 🚀
                </motion.div>
                <motion.img 
                  src="/onboard-mascot.png" 
                  alt="Celebration" 
                  style={{ width: 240, height: 'auto', filter: 'drop-shadow(0 30px 60px rgba(151, 24, 251, 0.2))' }}
                  animate={{ 
                    y: [0, -40, 0],
                    rotate: [0, -5, 5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
              </div>

              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', color: '#111', margin: '0 0 12px 0' }}
              >
                You're all set!
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{ fontSize: 18, color: '#666', fontWeight: 500, marginBottom: 48 }}
              >
                Your academic studio is ready for greatness, {fullName?.split(' ')[0] || 'Scholar'}.
              </motion.p>

              {/* XP Reward Card */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, type: 'spring' }}
                style={{ 
                  background: 'var(--primary-bg)', 
                  padding: '24px 40px', 
                  borderRadius: 32, 
                  border: '2px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  margin: '0 auto 64px',
                  width: 'fit-content'
                }}
              >
                <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24 }}>
                  <Award size={28} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Reward</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary-dark)' }}>+100 XP EARNED</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <button 
                  onClick={async () => {
                    if (refresh) await refresh();
                    navigate('/dashboard');
                  }}
                  className="btn-primary"
                  style={{ 
                    padding: '20px 64px', 
                    borderRadius: 20,
                    fontSize: 18,
                    fontWeight: 800,
                    width: 'fit-content',
                    minWidth: 320,
                    boxShadow: '0 20px 40px var(--primary-glow)',
                    cursor: 'pointer'
                  }}
                >
                  ENTER WORKSPACE
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}
