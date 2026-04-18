import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Search, ChevronDown, Bell, Clock, User, RefreshCw, Library, X, Sparkles, ArrowRight, ArrowLeft, Trash2, GraduationCap as GradIcon, Target, Award, Calendar, Layout, ShieldCheck, Activity, Zap, MapPin } from 'lucide-react';
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
  { name: '1:1 Tutoring with Kai', teacher: false, student: true },
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
      initial={{ rotateY:-15, scale:0.92, opacity:0 }}
      animate={{ rotateY:0, scale:1, opacity:1 }}
      transition={{ type:'spring', stiffness:150, damping:20 }}
      style={{
        background: 'white',
        borderRadius: 24, padding: '32px 24px', color: '#111',
        width: 280, flexShrink: 0, 
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(151, 24, 251, 0.12)',
        position: 'relative', overflow: 'hidden',
        fontFamily: 'var(--font-outfit)'
      }}
    >
      {/* Visual Accents */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'linear-gradient(135deg, rgba(151, 24, 251, 0.03) 0%, rgba(151, 24, 251, 0.08) 100%)', clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, background: 'var(--primary-bg)', borderRadius: '50%', opacity: 0.3, zIndex: 0 }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', color: 'var(--primary)', textTransform: 'uppercase' }}>Luter · Official ID</div>
          <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LuterLogo size={18} whiteOnly />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <motion.div key={`name-${name || 'default'}`} style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 4, letterSpacing: '-0.02em' }}>{name || 'Student Name'}</motion.div>
          <motion.div key={`university-${university || 'default'}`} style={{ fontSize: 14, fontWeight: 600, color: '#666', lineHeight: 1.2 }}>{university || 'Your Institution'}</motion.div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>Programme</div>
            <motion.div key={`course-${course || 'default'}`} style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{course || 'Course of Study'}</motion.div>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>Clearance Level</div>
            <motion.div key={`level-${level || 'default'}`} style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{level ? `${level} Level` : 'Undergraduate'}</motion.div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i === 1 ? 'var(--primary)' : 'rgba(0,0,0,0.05)' }} />)}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Slide Transitions ─── */
const slide = {
  enter: d => ({ x: d > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   d => ({ x: d > 0 ? -100 : 100, opacity: 0 }),
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
  const [step, setStep]             = useState(1);
  const [totalSteps]                = useState(9);
  const [dir,  setDir]              = useState(1);
  const [authUser, setAuthUser]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showConfetti, setConfetti] = useState(false);
  const [showXP, setShowXP]         = useState(false);

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

  // Step 8 - Referral
  const [referralCode, setReferralCode] = useState('');

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

  /* ── Auth check ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/signin'); return; }
      setAuthUser(session.user);
      if (!fullName && session.user.user_metadata?.full_name) {
        setFullName(session.user.user_metadata.full_name);
      }
      setLoading(false);
    });
  }, [navigate, fullName]);

  const [fetchingSyllabus, setFetchingSyllabus] = useState(false);

  const loadCurriculumForStep3 = useCallback(async () => {
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
      if (next === 5 && step < 5) {
        loadCurriculumForStep3();
      }
      setDir(next > step ? 1 : -1);
      setStep(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [step, loadCurriculumForStep3],
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

    // 1. Update primary profile using the specific metadata asked
    await supabase.from('profiles').upsert({
      id: authUser.id,
      full_name: fullName || authUser.user_metadata?.full_name || '',
      username: userName || authUser.email?.split('@')[0],
      birthday: birthday || null,
      role: role,
      university: university?.name || university,
      level: level,
      faculty: courseOfStudy,
      academic_goal: chosenGoal,
      source: source || 'Direct',
      alarm_time: alarmTime,
      reminders_enabled: remindersEnabled,
      onboarding_complete: true,
      referral_code_used: referralCode,
      curriculum_context: clean_curriculum_context,
    });

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
        if (upsertErr.code === '42501') {
           alert('Database Security Error: Missing permission for courses/semester_weeks. Please contact admin to run RLS fixes.');
        }
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
        
        // Insert user courses first
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
        total_xp: pioneerXp,
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

  const COLORS = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1'];
  const inputStyles = { width:'100%', padding:'12px 14px', borderRadius:12, border: '1.5px solid #e5e7eb', fontSize:14, color:'#111', outline:'none', fontFamily:'inherit', background:'white', boxSizing:'border-box', transition:'all 0.18s', appearance: 'none' };
  const activeInputStyles = { ...inputStyles, border: '1.5px solid #7a12cc', background: '#faf5ff' };

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

      {/* ─── STICKY TOP BAR ─── */}
      <div style={{ 
        position:'fixed', top:0, left:0, right:0, height:80, 
        background:'rgba(255,255,255,0.7)', backdropFilter:'blur(20px)', 
        zIndex:100, borderBottom:'1px solid rgba(151, 24, 251, 0.08)', 
        display:'flex', alignItems:'center', justifyContent:'center' 
      }}>
        <div style={{ width:'100%', maxWidth:1100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px' }}>
          <LuterLogo size={32} fontSize={24} />

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {step > 1 && (
              <button 
                onClick={() => goTo(step - 1)}
                className="btn-secondary"
                style={{ padding:'10px 20px', fontSize:14 }}
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (step === totalSteps) finish(goal);
                else goTo(step + 1);
              }}
              disabled={
                saving || 
                (step === 3 && (!fullName || !userName || !birthday)) ||
                (step === 4 && (!university || !courseOfStudy || !level || !semester)) ||
                (step === 5 && !source)
              }
              className="btn-primary"
              style={{
                padding:'12px 28px', fontSize:14,
                opacity: (saving || (step === 3 && (!fullName || !userName || !birthday)) || (step === 4 && (!university || !courseOfStudy || !level || !semester)) || (step === 5 && !source)) ? 0.5 : 1,
              }}
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : step === totalSteps ? 'Complete Setup' : 'Continue'}
              <ArrowRight size={16} style={{ marginLeft: 4 }} />
            </button>
          </div>
        </div>

        {/* ─── Progress Bar ─── */}
        <div style={{ position:'absolute', bottom:0, left:0, height:2, background:'rgba(151, 24, 251, 0.05)', width:'100%' }}>
          <motion.div 
            initial={false}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            style={{ height:'100%', background:'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }} 
          />
        </div>
      </div>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main style={{ paddingTop:80, display:'flex', minHeight:'100vh', width:'100%' }}>
        
        {/* Left Pane - Brand/Mascot (Visible on Desktop) */}
        <div style={{ 
          flex:1, 
          background:'linear-gradient(135deg, #f2efff 0%, #e9e3ff 100%)',
          display: window.innerWidth <= 1024 ? 'none' : 'flex',
          flexDirection:'column',
          alignItems:'center',
          justifyContent:'center',
          position:'relative',
          overflow:'hidden',
          borderRight:'1px solid rgba(151, 24, 251, 0.05)'
        }}>
          {/* Decorative Circles */}
          <div style={{ position:'absolute', top:'-10%', left:'-10%', width:400, height:400, borderRadius:'50%', background:'rgba(151, 24, 251, 0.03)' }} />
          <div style={{ position:'absolute', bottom:'5%', right:'-5%', width:300, height:300, borderRadius:'50%', background:'rgba(151, 24, 251, 0.04)' }} />
          
          <motion.div
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.2 }}
            style={{ textAlign:'center', zIndex:1, padding:40, maxWidth:500 }}
          >
            <div style={{ marginBottom:32, position:'relative' }}>
              <motion.img 
                src="/onboard-mascot.png" 
                alt="Luter Mascot" 
                style={{ width:320, height:'auto', filter: 'drop-shadow(0 20px 40px rgba(151, 24, 251, 0.15))' }}
                animate={{ 
                  y: [0, -25, 0],
                  rotate: [0, -2, 2, 0],
                  scale: [1, 1.03, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </div>
            <h2 style={{ fontSize:32, color:'#111', fontWeight:800, marginBottom:16, letterSpacing:'-0.03em' }}>
              Your academic journey starts here.
            </h2>
            <p style={{ fontSize:16, color:'#666', fontWeight:500, lineHeight:1.6 }}>
              Luter is your personal AI study studio. We're setting everything up so you can focus on what matters most: learning.
            </p>
          </motion.div>
        </div>

        {/* Right Pane - Form Steps */}
        <div style={{ 
          flex:1, 
          display:'flex', 
          flexDirection:'column', 
          alignItems:'center', 
          padding: window.innerWidth <= 768 ? '40px 24px' : '60px 40px',
          overflowY:'auto',
          position: 'relative'
        }}>
          {/* Mobile Mascot - Bouncy Kai */}
          <div style={{ 
            display: window.innerWidth <= 1024 ? 'flex' : 'none', 
            justifyContent:'center', 
            marginBottom: 24,
            width: '100%' 
          }}>
            <motion.img 
              src="/onboard-mascot.png" 
              style={{ width: 80, height: 'auto' }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type:'spring', stiffness:300, damping:30 }}
              style={{ width:'100%', maxWidth: step === 6 ? 900 : 580 }}
            >

            {/* ══ STEP 1 — Welcome ══ */}
            {step === 1 && (
              <div style={{ 
                display:'flex', 
                flexDirection:'column', 
                alignItems:'center', 
                justifyContent:'center', 
                minHeight:'100vh',
                background:'white',
                position:'relative',
                padding: '40px 20px'
              }}>
                {/* Mascot */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type:'spring', stiffness: 200, damping: 20 }}
                  style={{ marginBottom: 40 }}
                >
                  <motion.img 
                    src="/onboard-mascot.png" 
                    alt="Luter Mascot" 
                    style={{ width: 180, height:'auto' }}
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, -2, 2, 0],
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                </motion.div>

                {/* Speech Bubble */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, type:'spring', stiffness: 200 }}
                  style={{
                    background:'white',
                    borderRadius:24,
                    padding:32,
                    border:'2px solid var(--primary)',
                    boxShadow:'0 12px 40px rgba(151, 24, 251, 0.15)',
                    position:'relative',
                    marginBottom: 60,
                    maxWidth: 400,
                    textAlign: 'center'
                  }}
                >
                  {/* Speech Bubble Tail */}
                  <div style={{
                    position:'absolute',
                    bottom:-12,
                    left:'50%',
                    transform:'translateX(-50%)',
                    width:24,
                    height:24,
                    background:'white',
                    borderRight:'2px solid var(--primary)',
                    borderBottom:'2px solid var(--primary)',
                    transform:'translateX(-50%) rotate(45deg)',
                    borderRadius:'0 0 6px 0'
                  }} />
                  
                  <h2 style={{ 
                    fontSize:28, 
                    fontWeight:800, 
                    color:'#111', 
                    margin:0, 
                    marginBottom:8,
                    fontFamily: 'var(--font-outfit)',
                    letterSpacing:'-0.02em'
                  }}>
                    Hi there! I'm Kai!
                  </h2>
                  <p style={{ 
                    fontSize:18, 
                    color:'#666', 
                    margin:0,
                    fontFamily: 'var(--font-outfit)',
                    fontWeight:500,
                    lineHeight: 1.4
                  }}>
                    Your personal AI study companion. Let's set up your academic journey together.
                  </p>
                </motion.div>

                {/* Continue Button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, type:'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  style={{
                    background:'var(--primary)',
                    color:'white',
                    border:'none',
                    borderRadius:16,
                    padding:'18px 48px',
                    fontSize:18,
                    fontWeight:800,
                    fontFamily: 'var(--font-outfit)',
                    cursor:'pointer',
                    boxShadow:'0 8px 24px rgba(151, 24, 251, 0.3)',
                    transition:'all 0.2s',
                    position: 'absolute',
                    bottom: 60,
                    right: 40
                  }}
                >
                  CONTINUE
                </motion.button>
              </div>
            )}

            {/* ══ STEP 2 — Profile ══ */}
            {step === 2 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 2: Your Profile</span>
                </div>
                <h1 style={{ fontSize: window.innerWidth <= 768 ? 28 : 36, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12, color:'#111', lineHeight:1.1 }}>Let's personalize your studio.</h1>
                <p style={{ color:'#666', fontSize:16, lineHeight:1.6, marginBottom:32, fontWeight:500 }}>Tell us a bit about yourself so Kai can tailor your experience.</p>
                
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
                    <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="@username" style={{ width:'100%', padding:'14px 16px', borderRadius:12, border:'1px solid #e2e8f0', background:'white', fontSize:15, outline:'none' }} />
                  </div>

                  <div style={{ position:'relative' }}>
                    <label style={{ fontSize:12, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Birthday</label>
                    <div onClick={() => setShowDatePicker(!showDatePicker)} style={{ width:'100%', padding:'14px 16px', borderRadius:12, border:'1px solid #e2e8f0', background:'white', fontSize:15, cursor:'pointer', color: birthday ? '#0F172A' : '#94A3B8', display:'flex', justifyContent:'space-between', alignItems: 'center' }}>
                      {birthday ? new Date(birthday).toLocaleDateString() : 'Select your birthday'}
                      <Calendar size={18} color="#94A3B8" />
                    </div>
                    {showDatePicker && (
                      <div style={{ position:'absolute', top:'100%', left:0, zIndex:10, marginTop:8, background:'white', border:'1px solid #e2e8f0', borderRadius:12, padding:12, boxShadow:'0 10px 30px rgba(0,0,0,0.08)' }}>
                        <input type="date" onChange={e => { setBirthday(e.target.value); setShowDatePicker(false); }} style={{ padding:8, borderRadius:8, border:'1px solid #e2e8f0' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 2 — Role Selection ══ */}
            {step === 2 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 2: Your Identity</span>
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
              </div>
            )}

            {/* ══ STEP 4 — Registry ══ */}
            {step === 4 && (
              <div style={{ display:'flex', gap:48, flexDirection: window.innerWidth <= 1024 ? 'column' : 'row' }}>
                <div style={{ flex:1.2 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                    <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 4: Academic Registry</span>
                  </div>
                  <h1 style={{ fontSize: 32, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12, color:'#111', lineHeight:1.1 }}>Where are you studying?</h1>
                  <p style={{ color:'#666', fontSize:15, marginBottom:32, fontWeight:500 }}>Kai needs this to find your official curriculum and courses.</p>

                  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                    <div style={{ position:'relative' }}>
                      <label style={{ fontSize:11, fontWeight:800, color:'#94A3B8', display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>Institution name</label>
                      <div style={{ position:'relative' }}>
                        <div style={{ position:'absolute', left:18, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}><Search size={18}/></div>
                        <input value={university} onChange={e => setUniversity(e.target.value)} onFocus={() => setUniDrop(true)} placeholder="Search for your university..." style={{ width:'100%', padding:'18px 18px 18px 48px', borderRadius:18, border:'1.5px solid #F1F5F9', background:'white', fontSize:15, fontWeight:700, outline:'none' }} />
                      </div>
                      {showUniDrop && filteredUnis.length > 0 && (
                        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:20, background:'white', borderRadius:18, padding:8, marginTop:8, boxShadow:'0 20px 50px rgba(0,0,0,0.1)', border:'1px solid #F1F5F9' }}>
                          {filteredUnis.map(u => (
                            <div key={u} onClick={() => { setUniversity(u); setUniDrop(false); }} style={{ padding:'12px 16px', borderRadius:12, cursor:'pointer', fontWeight:600, fontSize:14, color:'#334155' }} className="hover-bg-primary-lite">
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
                        <input value={courseOfStudy} onChange={e => setCourseOfStudy(e.target.value)} onFocus={() => setShowCourseDrop(true)} placeholder="Computer Science, Nursing, etc." style={{ width:'100%', padding:'18px 18px 18px 48px', borderRadius:18, border:'1.5px solid #F1F5F9', background:'white', fontSize:15, fontWeight:700, outline:'none' }} />
                      </div>
                      {showCourseDrop && filteredCourses.length > 0 && (
                        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:20, background:'white', borderRadius:18, padding:8, marginTop:8, boxShadow:'0 20px 50px rgba(0,0,0,0.1)', border:'1px solid #F1F5F9' }}>
                          {filteredCourses.map(c => (
                            <div key={c} onClick={() => { setCourseOfStudy(c); setShowCourseDrop(false); }} style={{ padding:'12px 16px', borderRadius:12, cursor:'pointer', fontWeight:600, fontSize:14, color:'#334155' }}>{c}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display:'flex', gap:20 }}>
                      <div style={{ flex:1 }}>
                        <label style={{ fontSize:11, fontWeight:800, color:'#94A3B8', display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>Current Level</label>
                        <select value={level} onChange={e => setLevel(e.target.value)} style={{ width:'100%', padding:'18px', borderRadius:18, border:'1.5px solid #F1F5F9', background:'white', fontSize:15, fontWeight:700, outline:'none', cursor:'pointer' }}>
                          <option value="">Select Level</option>
                          {['100', '200', '300', '400', '500', '600', 'Postgraduate'].map(l => <option key={l} value={l}>{l} Level</option>)}
                        </select>
                      </div>
                      <div style={{ flex:1 }}>
                        <label style={{ fontSize:11, fontWeight:800, color:'#94A3B8', display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>Academic term</label>
                        <select value={semester} onChange={e => setSemester(e.target.value)} style={{ width:'100%', padding:'18px', borderRadius:18, border:'1.5px solid #F1F5F9', background:'white', fontSize:15, fontWeight:700, outline:'none', cursor:'pointer' }}>
                          <option value="">Select Term</option>
                          <option value="1">1st Semester</option>
                          <option value="2">2nd Semester</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                {/* ID Card Preview */}
                <div style={{ flex:0.8, display:'flex', justifyContent:'center', alignItems: 'center' }}>
                  <div style={{ position:'relative', width: '100%', maxWidth: 320 }}>
                    <div style={{ position:'absolute', inset:-20, background:'var(--primary-bg)', filter:'blur(40px)', opacity:0.3, borderRadius:'50%', zIndex:0 }} />
                    <IDCard name={fullName} university={university} level={level} course={courseOfStudy} />
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 5 — Discovery ══ */}
            {step === 5 && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minHeight:'100vh', paddingTop:40 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:32 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 5: Insights</span>
                </div>
                
                {/* Mascot with Speech Bubble */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:40, marginBottom:48, width:'100%', maxWidth:800, justifyContent:'center' }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <motion.img 
                      src="/onboard-mascot.png" 
                      alt="Luter Mascot" 
                      style={{ width:120, height:'auto' }}
                      animate={{ 
                        y: [0, -8, 0],
                        rotate: [0, -1, 1, 0],
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                  </div>
                  
                  <div style={{ position:'relative', flex:1, maxWidth:400 }}>
                    {/* Speech Bubble */}
                    <div style={{
                      background:'white',
                      borderRadius:24,
                      padding:24,
                      border:'2px solid var(--primary)',
                      boxShadow:'0 8px 32px rgba(151, 24, 251, 0.15)',
                      position:'relative'
                    }}>
                      {/* Speech Bubble Tail */}
                      <div style={{
                        position:'absolute',
                        left:-12,
                        top:24,
                        width:24,
                        height:24,
                        background:'white',
                        borderLeft:'2px solid var(--primary)',
                        borderBottom:'2px solid var(--primary)',
                        transform:'rotate(45deg)',
                        borderRadius:'0 0 0 6px'
                      }} />
                      
                      <h2 style={{ 
                        fontSize:24, 
                        fontWeight:800, 
                        color:'#111', 
                        margin:0, 
                        marginBottom:8,
                        fontFamily: 'var(--font-outfit)',
                        letterSpacing:'-0.02em'
                      }}>
                        How did you hear about Luter?
                      </h2>
                      <p style={{ 
                        fontSize:16, 
                        color:'#666', 
                        margin:0,
                        fontFamily: 'var(--font-outfit)',
                        fontWeight:500
                      }}>
                        We're curious! Help us spread the word.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid Layout for Sources */}
                <div style={{ 
                  display:'grid', 
                  gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', 
                  gap:16, 
                  width:'100%', 
                  maxWidth:600,
                  marginBottom:48
                }}>
                  {[
                    { id: 'Instagram', icon: '📷', label: 'Instagram' },
                    { id: 'TikTok', icon: '🎵', label: 'TikTok' },
                    { id: 'ChatGPT', icon: '🤖', label: 'ChatGPT' },
                    { id: 'App Store', icon: '📱', label: 'App Store' },
                    { id: 'Teacher\u002Fprofessor', icon: '👨‍🏫', label: 'Teacher\u002Fprofessor' },
                    { id: 'Friend', icon: '👥', label: 'Friend' },
                    { id: 'Google', icon: '🔍', label: 'Google' },
                    { id: 'YouTube', icon: '📺', label: 'YouTube' },
                    { id: 'other', icon: '💡', label: 'Other' }
                  ].map(item => {
                    const isSel = (source === item.id);
                    return (
                      <motion.button
                        key={item.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSource(item.id)}
                        style={{
                          padding:'20px 16px',
                          borderRadius:16,
                          border: isSel ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                          background: isSel ? 'var(--primary-bg)' : 'white',
                          color: isSel ? 'var(--primary-dark)' : '#666',
                          fontWeight: 700, 
                          fontSize:14, 
                          cursor:'pointer', 
                          transition:'all 0.2s',
                          display:'flex',
                          flexDirection:'column',
                          alignItems:'center',
                          gap:8,
                          minHeight:100,
                          boxShadow: isSel ? '0 8px 24px rgba(151, 24, 251, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                      >
                        <div style={{ fontSize:28, lineHeight:1 }}>{item.icon}</div>
                        <div style={{ 
                          fontSize:13, 
                          fontWeight:700,
                          textAlign:'center',
                          lineHeight:1.3,
                          fontFamily: 'var(--font-outfit)'
                        }}>
                          {item.label}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
            )}

            {/* ══ STEP 6 — Academic Catalog ══ */}
            {step === 6 && (
              <div style={{ width:'100%', maxWidth:900, margin:'0 auto' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 6: Your Catalog</span>
                </div>
                <h1 style={{ fontSize: 36, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12, color:'#111', lineHeight:1.1 }}>What are you taking?</h1>
                <p style={{ color:'#666', fontSize:16, marginBottom:40, fontWeight:500 }}>Select your courses for the current semester. Kai will prepare tailored study materials for each.</p>

                <div style={{ display:'grid', gridTemplateColumns: window.innerWidth <= 1024 ? '1fr' : '1.8fr 1fr', gap:32, alignItems:'flex-start' }}>
                  
                  {/* Search & Suggestions */}
                  <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                    <div style={{ 
                      background:'white', borderRadius:24, border:'1px solid rgba(151, 24, 251, 0.08)', padding: window.innerWidth <= 768 ? 20 : 32,
                      boxShadow:'0 10px 40px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)' }}>
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h3 style={{ fontSize:16, fontWeight:800, color:'#111', margin:0 }}>Smart Course Discovery</h3>
                          <p style={{ fontSize:13, color:'#666', margin:0, fontWeight:500 }}>Based on your university and level</p>
                        </div>
                      </div>

                      <EnhancedCourseSuggestions
                        university={university}
                        department={courseOfStudy}
                        level={level}
                        semester={semester}
                        country={country}
                        selectedCourses={selectedCourses}
                        onCourseSelect={(c) => _pickCourse(c.code, c.name, c.hitKind || 'library')}
                      />

                      <div style={{ marginTop:24 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                          <div style={{ flex:1, height:1, background:'#f1f5f9' }} />
                          <span style={{ fontSize:11, fontWeight:800, color:'#94A3B8', textTransform:'uppercase' }}>or add manually</span>
                          <div style={{ flex:1, height:1, background:'#f1f5f9' }} />
                        </div>
                        <div style={{ display:'flex', gap:10 }}>
                          <input value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} placeholder="Code (e.g. CSC 101)" style={{ flex:0.4, padding:'14px', borderRadius:14, border:'1.5px solid #F1F5F9', background:'white', fontSize:14, fontWeight:700, outline:'none' }} />
                          <input value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="Course Title" style={{ flex:1, padding:'14px', borderRadius:14, border:'1.5px solid #F1F5F9', background:'white', fontSize:14, fontWeight:700, outline:'none' }} />
                          <button onClick={_addManualWithEnrich} style={{ width:48, height:48, borderRadius:14, background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Basket */}
                  <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                    <div style={{ 
                      background:'white', borderRadius:24, border:'1.5px solid var(--primary)', padding: 24,
                      position:'sticky', top:104, boxShadow:'0 20px 40px var(--primary-glow-subtle)'
                    }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                        <h3 style={{ fontSize:16, fontWeight:800, color:'#111', margin:0 }}>Enrolled ({selectedCourses.length})</h3>
                        <div style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 10px', borderRadius:8 }}>
                          {_loadPct}% Ready
                        </div>
                      </div>

                      <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                        {selectedCourses.length === 0 ? (
                          <div style={{ textAlign:'center', padding:'40px 0', opacity:0.5 }}>
                            <Library size={32} style={{ marginBottom:12, color:'var(--primary)' }} />
                            <p style={{ fontSize:13, fontWeight:600, color:'#666' }}>No courses selected yet</p>
                          </div>
                        ) : (
                          selectedCourses.map(c => (
                            <motion.div
                              layout
                              initial={{ opacity:0, scale:0.95 }}
                              animate={{ opacity:1, scale:1 }}
                              key={c.code}
                              style={{ 
                                padding:'12px 14px', borderRadius:14, background:'#f8fafc',
                                border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:12
                              }}
                            >
                              <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--primary)' }} />
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, fontWeight:800, color:'#111' }}>{c.code}</div>
                                <div style={{ fontSize:11, fontWeight:600, color:'#666', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:140 }}>{c.name}</div>
                              </div>
                              <button onClick={() => _removeFromSelected(c.code)} style={{ color:'#94A3B8', padding:4 }}><Trash2 size={16}/></button>
                            </motion.div>
                          ))
                        )}
                      </div>

                      {_aiMsg() && (
                        <div style={{ marginTop:20, padding:'12px', background: `${_aiMsg().color}10`, borderRadius:12, border: `1px solid ${_aiMsg().color}40` }}>
                          <p style={{ margin:0, fontSize:12, fontWeight:700, color: _aiMsg().color }}>{_aiMsg().msg}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 7 — Routine ══ */
            {step === 7 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 7: Habits</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12, color:'#111' }}>Build your routine.</h1>
                <p style={{ color:'#666', fontSize:16, marginBottom:40, fontWeight:500 }}>Kai will wake you up and send study reminders.</p>

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
                      <div style={{ fontSize:13, color:'#666', fontWeight:500 }}>Kai will nudge you when it's time to study.</div>
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
              </div>
            )}

            {/* ══ STEP 8 — Goals ══ */
            {step === 8 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 8: Ambition</span>
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
              </div>
            )}

            {/* ══ STEP 9 — Referral ══ */
            {step === 9 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--primary)', background:'var(--primary-bg)', padding:'4px 12px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>Step 9: Network</span>
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
              </div>
            )}

            {/* Bottom Navigation Buttons */}
            <div style={{ 
              display: 'flex', gap: 16, 
              marginTop: 60,
              width: '100%', 
              paddingBottom: 40
            }}>
              {step > 1 && (
                <button 
                  onClick={() => setStep(step - 1)} 
                  className="btn-secondary"
                  style={{ flex: 1, padding: '16px', borderRadius: 16 }}
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
              )}
              
              {step < 9 ? (
                <button 
                  onClick={() => {
                    if(step === 6 && selectedCourses.length === 0) return;
                    setStep(step + 1);
                  }}
                  disabled={step === 6 && selectedCourses.length === 0}
                  className="btn-primary"
                  style={{ 
                    flex: 2, padding: '16px', borderRadius: 16,
                    opacity: (step === 6 && selectedCourses.length === 0) ? 0.5 : 1
                  }}
                >
                  {step === 6 ? 'Continue to Routine' : 'Continue'}
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={() => finish()} 
                  disabled={saving}
                  className="btn-primary"
                  style={{ 
                    flex: 2, padding: '16px', borderRadius: 16,
                    background: 'var(--primary-dark)'
                  }}
                >
                  {saving ? (
                    <><Loader2 size={18} className="animate-spin" /> Preparing Studio...</>
                  ) : (
                    <>Launch Studio <Sparkles size={18} /></>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>

      {/* Completion Overlay */}
      <AnimatePresence mode="wait">
        {showConfetti && (
          <motion.div 
            initial={{ opacity:0 }} 
            animate={{ opacity:1 }} 
            exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(255,255,255,0.95)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backdropFilter:'blur(10px)' }}
          >
            <Confetti />
            <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', delay:0.2 }}>
              <div style={{ width:120, height:120, background:'var(--primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', marginBottom:24, boxShadow:'0 20px 40px var(--primary-glow)' }}>
                <CheckCircle2 size={64} />
              </div>
            </motion.div>
            <h2 style={{ fontSize:32, fontWeight:800, marginBottom:8 }}>Welcome to Luter, {fullName.split(' ')[0]}!</h2>
            <p style={{ fontSize:18, color:'#666', marginBottom:40 }}>Your personalized AI studio is ready.</p>
            {showXP && (
              <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} style={{ padding:'12px 32px', background:'var(--primary-bg)', borderRadius:99, border:'2px solid var(--primary)', color:'var(--primary-dark)', fontWeight:800, fontSize:20 }}>
                \\+100 XP EARNED
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
