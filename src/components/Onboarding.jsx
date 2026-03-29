import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Search, ChevronDown, Bell, Clock, User, RefreshCw, Library, X, Sparkles } from 'lucide-react';
import logo from '../../asset/logo.png';
import { normalizeCourseRow } from '../lib/curriculumSlugs';
import {
  buildCurriculumKeyContext,
  publishCrowdCurriculum,
} from '../services/curriculumService';
import { aggregateSyllabusSources } from '../services/syllabusAggregator';
import { fetchGroqLiveCourseSearch, enrichManualCourseWithGroq } from '../groqClient';

/* ─── Static Data ─── */
const GOALS = [
  { id: 'first',  label: '1st Class',       sub: 'CGPA 4.5+',       emoji: '🏆', ai: "I'll push you hard — no shortcuts." },
  { id: 'second', label: '2nd Class Upper', sub: 'CGPA 3.5+',       emoji: '⭐', ai: "Solid goal. Let's build steady habits." },
  { id: 'pass',   label: 'Just let me pass',sub: 'Pass all courses', emoji: '🙏', ai: "Respect. I'll make sure nothing slips through." },
];

const SOURCES = [
  'Instagram', 'TikTok', 'ChatGPT', 'App Store',
  'Teacher/professor', 'Friend', 'Google', 'YouTube', 'other'
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
    color: ['#7a12cc','#9718fb','#f59e0b','#10B981','#3b82f6'][i % 5],
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
        background:'linear-gradient(135deg,#7a12cc 0%,#b04dfc 100%)',
        borderRadius:20, padding:'24px 20px', color:'white',
        width:210, flexShrink:0, boxShadow:'0 20px 50px rgba(122,18,204,0.35)',
        position:'relative', overflow:'hidden',
      }}
    >
      <div style={{ position:'absolute', top:-40, right:-40, width:100, height:100, background:'rgba(255,255,255,0.08)', borderRadius:'50%' }} />
      <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.1em', opacity:0.65, marginBottom:16 }}>LUTER AI · STUDENT ID</div>
      <motion.div key={`name-${name || 'default'}`} style={{ fontSize:18, fontWeight:900, color:'#fff', marginBottom:4, minHeight:22 }}>{name || 'Student'}</motion.div>
      <motion.div key={`university-${university || 'default'}`} style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.02em', minHeight:20, lineHeight: 1.2 }}>{university || '—'}</motion.div>
      <motion.div key={`course-${course || 'default'}`} style={{ fontSize:11, opacity:0.8, marginTop:8, minHeight:14, fontWeight: 600 }}>{course || 'Programme'}</motion.div>
      <motion.div key={`level-${level || 'default'}`} style={{ fontSize:10, opacity:0.6, marginTop:2, minHeight:12 }}>{level ? `${level} Level` : 'Level'}</motion.div>
      <div style={{ marginTop:18, display:'flex', gap:3 }}>
        {[1,2,3,4,5].map(i => <div key={i} style={{ flex:1, height:4, borderRadius:999, background:'rgba(255,255,255,0.25)' }} />)}
      </div>
    </motion.div>
  );
}

/* ─── Slide Transitions ─── */
const slide = {
  enter: d => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   d => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

/* ═══════════════════════════════════════════
   MAIN ONBOARDING
═══════════════════════════════════════════ */
export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep]             = useState(1);
  const [dir,  setDir]              = useState(1);
  const [authUser, setAuthUser]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showConfetti, setConfetti] = useState(false);
  const [showXP, setShowXP]         = useState(false);

  // Step 1 - Origin
  const [nickname, setNickname] = useState('');
  const [source, setSource] = useState('');

  // Step 2 - Registry 
  const [country, setCountry] = useState('');
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
  const [aiBaselineError, setAiBaselineError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualEnriching, setManualEnriching] = useState(false);

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
      if (!nickname && session.user.user_metadata?.full_name) {
        setNickname(session.user.user_metadata.full_name);
      }
      setLoading(false);
    });
  }, [navigate, nickname]);

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

  const runAiBaseline = async () => {
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

  const combinedHits = useMemo(() => {
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

  const pickCourse = (code, name, hitKind) => {
    setSelectedCourses((prev) => {
      if (prev.some((p) => p.code === code)) return prev;
      return [...prev, { code, name, hitKind }];
    });
    setCourseTypeahead('');
    setHitsOpen(false);
  };

  const removeFromSelected = (code) => {
    setSelectedCourses((prev) => prev.filter((p) => p.code !== code));
  };

  const addManualWithEnrich = async () => {
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
      if (next === 3 && step === 2) {
        loadCurriculumForStep3();
      }
      setDir(next > step ? 1 : -1);
      setStep(next);
    },
    [step, loadCurriculumForStep3],
  );

  const loadPct = Math.min(
    100,
    Math.round((selectedCourses.length / 14) * 100),
  );
  const aiMsg = () => {
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

    const finalName = nickname || authUser.user_metadata?.full_name || '';

    // 0. Update auth user metadata so the name is globally available
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

    // 1. Update primary profile using the specific metadata asked
    await supabase.from('profiles').upsert({
      id: authUser.id,
      full_name: finalName,
      university,
      faculty: courseOfStudy,
      academic_goal: chosenGoal,
      source,
      alarm_time: alarmTime,
      reminders_enabled: remindersEnabled,
      onboarding_complete: true,
      curriculum_context,
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
      await supabase.from('courses').upsert(coursesToUpsert, { onConflict: 'code' });

      // Step B: Force fetch the final official DB Row IDs (Supabase returns nothing if upsert hits identical data with no changes)
      const { data: globalCourses } = await supabase
        .from('courses')
        .select('id, code')
        .in('code', selectedCodes);

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
        
        if (!insertError) {
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

    // 5. Celebration mapping
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

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Loader2 className="animate-spin" size={32} color="#7a12cc" />
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#faf5ff 0%,#f0e8ff 50%,#fafafa 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'Outfit',sans-serif", position:'relative', overflow:'hidden' }}>

      <div style={{ position:'fixed', top:'-20%', right:'-10%', width:460, height:460, background:'radial-gradient(ellipse,rgba(151,24,251,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'-15%', left:'-10%', width:360, height:360, background:'radial-gradient(ellipse,rgba(122,18,204,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

      {showConfetti && <Confetti />}

      <AnimatePresence>
        {showXP && (
          <motion.div initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0 }}
            style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:1000, background:'white', borderRadius:24, padding:'32px 48px', textAlign:'center', boxShadow:'0 40px 80px rgba(122,18,204,0.25)', border:'2px solid rgba(122,18,204,0.15)' }}>
            <div style={{ fontSize:56 }}>🎓</div>
            <div style={{ fontSize:28, fontWeight:900, color:'#7a12cc', letterSpacing:'-0.03em', marginTop:8 }}>+500 XP</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#111', marginTop:4 }}>Setup Complete!</div>
            <div style={{ fontSize:13, color:'#666', marginTop:4 }}>You are now a <b style={{ color:'#7a12cc' }}>Freshman</b> rank</div>
            <div style={{ marginTop:16, fontSize:12, color:'#999', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Loader2 size={14} className="animate-spin" /> Launching your command center…
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ width:'100%', maxWidth: step === 3 ? 780 : 660, position:'relative', zIndex:1 }}>

        {/* Header Progress Tracker */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <img src={logo} alt="Luter AI" style={{ height:30 }} />
          <div style={{ display:'flex', gap:6 }}>
            {[1,2,3,4,5].map(s => (
              <div key={s} style={{ width: s===step ? 24 : 8, height:6, borderRadius:999, background: s<=step ? '#7a12cc' : '#e5e7eb', transition:'all 0.3s' }} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration:0.32, ease:[0.23,1,0.32,1] }}>

            {/* ══ STEP 1 — Profile / Intro ══ */}
            {step === 1 && (
              <div style={{ background:'white', borderRadius:24, padding:36, boxShadow:'0 20px 60px rgba(122,18,204,0.1)', border:'1px solid rgba(122,18,204,0.12)' }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:'#7a12cc', textTransform:'uppercase', marginBottom:6 }}>Step 1 of 5</div>
                <h2 style={{ fontSize:26, fontWeight:900, color:'#111', letterSpacing:'-0.03em', margin:'0 0 4px' }}>Welcome to Luter AI.</h2>
                <p style={{ color:'#888', fontSize:13, margin:'0 0 30px' }}>Let's start putting your profile together.</p>

                <div style={{ marginBottom: 26 }}>
                  <label style={{ fontSize:12, fontWeight:800, color:'#333', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                    <User size={15} color="#7a12cc" /> What should we call you?
                  </label>
                  <input 
                    value={nickname} onChange={e => setNickname(e.target.value)} 
                    placeholder="Nickname or First Name" 
                    style={nickname ? activeInputStyles : inputStyles} 
                  />
                </div>

                <div style={{ marginBottom: 30 }}>
                  <label style={{ fontSize:12, fontWeight:800, color:'#333', marginBottom:12, display:'block' }}>
                    Where did you first hear about us?
                  </label>
                  <div style={{ display: 'flex', flexWrap:'wrap', gap: 10 }}>
                    {SOURCES.map(s => (
                      <button key={s} onClick={() => setSource(s)}
                        style={{ padding: '10px 18px', borderRadius: 99, border: `1.5px solid ${source === s ? '#7a12cc' : '#e5e7eb'}`, background: source === s ? '#faf5ff' : 'white', color: source === s ? '#7a12cc' : '#555', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => goTo(2)} disabled={!nickname || !source}
                  style={{ width:'100%', padding:'14px', borderRadius:12, background: nickname&&source?'#7a12cc':'#e5e7eb', color: nickname&&source?'white':'#9ca3af', fontSize:14, fontWeight:700, border:'none', cursor: nickname&&source?'pointer':'not-allowed', fontFamily:'inherit', boxShadow: nickname&&source?'0 6px 20px rgba(122,18,204,0.3)':'none', transition:'all 0.2s' }}>
                  Next step →
                </button>
              </div>
            )}

            {/* ══ STEP 2 — Academic Registry ══ */}
            {step === 2 && (
              <div style={{ background:'white', borderRadius:24, padding:36, boxShadow:'0 20px 60px rgba(122,18,204,0.1)', border:'1px solid rgba(122,18,204,0.12)' }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:'#7a12cc', textTransform:'uppercase', marginBottom:6 }}>Step 2 of 5</div>
                <h2 style={{ fontSize:26, fontWeight:900, color:'#111', letterSpacing:'-0.03em', margin:'0 0 4px' }}>Where do you study, {nickname}?</h2>
                <p style={{ color:'#888', fontSize:13, margin:'0 0 26px' }}>We&apos;ll use this to load your courses on the next step.</p>

                <div className="stack-on-mobile" style={{ display:'flex', gap:32, alignItems:'flex-start' }}>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>
                    <div>
                      <label style={{ fontSize:11, fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Country</label>
                      <div style={{ position: 'relative' }}>
                        <select value={country} onChange={e => setCountry(e.target.value)} style={country ? activeInputStyles : inputStyles}>
                          <option value="">Select country...</option>
                          <option value="Nigeria">Nigeria</option>
                          <option value="Ghana">Ghana</option><option value="Kenya">Kenya</option><option value="South Africa">South Africa</option><option value="United States">United States</option><option value="United Kingdom">United Kingdom</option>
                        </select>
                        <ChevronDown size={14} color="#888" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize:11, fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>University</label>
                      <div style={{ position:'relative' }}>
                        <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#bbb', display:'flex' }}><Search size={14} /></div>
                        <input value={uniSearch}
                          onChange={e => { setUniSearch(e.target.value); setUniDrop(true); if(!e.target.value) setUniversity(''); }}
                          onFocus={() => setUniDrop(true)} placeholder="Search university…"
                          style={{ ...inputStyles, paddingLeft: 36, ...(university ? activeInputStyles : {}) }}
                        />
                        {university && <CheckCircle2 size={15} color="#7a12cc" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }} />}
                        {showUniDrop && uniSearch && !university && filteredUnis.length > 0 && (
                          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1.5px solid #e5e7eb', borderRadius:12, marginTop:4, zIndex:20, boxShadow:'0 12px 28px rgba(0,0,0,0.08)', overflow:'hidden' }}>
                            {filteredUnis.map(u => (
                              <div key={u} onClick={() => { setUniversity(u); setUniSearch(u); setUniDrop(false); }} style={{ padding:'11px 16px', fontSize:13, cursor:'pointer', color:'#333', borderBottom:'1px solid #f3f4f6' }}>{u}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize:11, fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Programme / Course</label>
                      <div style={{ position:'relative' }}>
                        <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#bbb', display:'flex' }}><Search size={14} /></div>
                        <input 
                          value={courseSearch}
                          onChange={(e) => { 
                            setCourseSearch(e.target.value)
                            setShowCourseDrop(true)
                            if(!e.target.value) {
                              setCourseOfStudy('')
                              setShowCourseDrop(false)
                            }
                          }}
                          onFocus={() => setShowCourseDrop(true)}
                          placeholder="Search or type your programme..." 
                          style={{ 
                            ...inputStyles, 
                            paddingLeft: 36, 
                            ...(courseOfStudy ? activeInputStyles : {})
                          }} 
                        />
                        {courseOfStudy && <CheckCircle2 size={15} color="#7a12cc" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }} />}
                        {showCourseDrop && courseSearch && !courseOfStudy && filteredCourses.length > 0 && (
                          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1.5px solid #e5e7eb', borderRadius:12, marginTop:4, zIndex:20, boxShadow:'0 12px 28px rgba(0,0,0,0.08)', overflow:'hidden' }}>
                            {filteredCourses.map(course => (
                              <button
                                key={course}
                                onClick={() => {
                                  setCourseOfStudy(course)
                                  setCourseSearch(course)
                                  setShowCourseDrop(false)
                                }}
                                style={{ 
                                  width:'100%', 
                                  padding:'12px 14px', 
                                  border:'none', 
                                  background:'white', 
                                  textAlign:'left', 
                                  fontSize:14, 
                                  color:'#111', 
                                  cursor:'pointer', 
                                  fontFamily:'inherit',
                                  borderBottom:'1px solid #f3f4f6',
                                  transition:'background 0.15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                {course}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize:11, fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Level</label>
                        <div style={{ position: 'relative' }}>
                          <select value={level} onChange={e => setLevel(e.target.value)} style={level ? activeInputStyles : inputStyles}>
                            <option value="">Select level...</option>
                            {['100','200','300','400','500'].map(l => <option key={l} value={l}>{l} Level</option>)}
                          </select>
                          <ChevronDown size={14} color="#888" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize:11, fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Semester</label>
                        <div style={{ position: 'relative' }}>
                          <select value={semester} onChange={e => setSemester(e.target.value)} style={semester ? activeInputStyles : inputStyles}>
                            <option value="">Select semester...</option>
                            <option value="1st">1st Semester</option><option value="2nd">2nd Semester</option>
                          </select>
                          <ChevronDown size={14} color="#888" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:10, marginTop: 8 }}>
                      <button onClick={() => goTo(1)} style={{ padding:'14px 18px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'white', color:'#555', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                      <button onClick={() => goTo(3)} disabled={!country || !university || !courseOfStudy || !level || !semester}
                        style={{ flex:1, padding:'14px', borderRadius:12, background: country&&university&&courseOfStudy&&level&&semester?'#7a12cc':'#e5e7eb', color: country&&university&&courseOfStudy&&level&&semester?'white':'#9ca3af', fontSize:14, fontWeight:700, border:'none', cursor: country&&university&&courseOfStudy&&level&&semester?'pointer':'not-allowed', fontFamily:'inherit', boxShadow: country&&university&&courseOfStudy&&level&&semester?'0 6px 20px rgba(122,18,204,0.3)':'none', transition:'all 0.2s' }}>
                        Continue →
                      </button>
                    </div>
                  </div>

                  <div className="full-width-mobile" style={{ display: 'flex', justifyContent: 'center', width: 'auto' }}>
                    <IDCard name={nickname} university={university} course={courseOfStudy} level={level} />
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 3 — Search & pick courses ══ */}
            {step === 3 && (
              <div style={{ background:'white', borderRadius:24, padding:36, boxShadow:'0 20px 60px rgba(122,18,204,0.1)', border:'1px solid rgba(122,18,204,0.12)' }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:'#7a12cc', textTransform:'uppercase', marginBottom:6 }}>Step 3 of 5</div>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:4 }}>
                  <div>
                    <h2 style={{ fontSize:24, fontWeight:900, color:'#111', letterSpacing:'-0.03em', margin:'0 0 4px' }}>Your courses</h2>
                    <p style={{ color:'#888', fontSize:13, margin:0 }}>
                      Search by code or course name (uppercase). We match your programme and semester in real time—tap a row to add it. Use &quot;Add &amp; verify&quot; only if it doesn&apos;t appear.
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                      <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em', padding:'6px 10px', borderRadius:8, background:'#f0e8ff', color:'#6d28d9', border:'1px solid rgba(122,18,204,0.2)' }}>
                        <Library size={12} style={{ display:'inline', verticalAlign:'middle', marginRight:4 }} />
                        {fetchingSyllabus
                          ? 'Getting courses…'
                          : curriculumSlotMeta.fromRepository
                            ? 'Includes your school&apos;s list'
                            : isPioneerMode
                              ? 'First for this programme — add anything missing'
                              : 'Course list ready'}
                      </span>
                    </div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    <div style={{ fontSize:20, fontWeight:900, color:'#7a12cc' }}>{selectedCourses.length}</div>
                    <div style={{ fontSize:10, color:'#999' }}>selected</div>
                  </div>
                </div>

                {fetchingSyllabus ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 0' }}>
                    <Loader2 className="animate-spin" size={32} color="#7a12cc" />
                    <div style={{ marginTop:16, fontSize:15, fontWeight:800, color:'#111' }}>Getting courses…</div>
                    <div style={{ fontSize:12, color:'#888', marginTop:4, fontWeight:600, textAlign:'center', maxWidth:320 }}>
                      {courseOfStudy} · {level} Level · {university}
                    </div>
                  </div>
                ) : (
                  <>
                    {isPioneerMode && (
                      <div style={{ marginBottom:14, padding:14, borderRadius:14, background:'linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)', border:'1px solid #f59e0b55' }}>
                        <div style={{ fontSize:13, fontWeight:800, color:'#92400e', marginBottom:6 }}>You&apos;re the first here for this programme.</div>
                        <p style={{ fontSize:12, color:'#78350f', margin:0, lineHeight:1.5, fontWeight:600 }}>
                          Search and add your courses below. When you finish onboarding we save this list for students after you—and you earn <strong>+500 XP</strong>.
                        </p>
                      </div>
                    )}

                    <div style={{ marginBottom:12 }}>
                      <label style={{ fontSize:10, fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Search courses</label>
                      <div style={{ position:'relative' }}>
                        <Search size={14} color="#aaa" style={{ position:'absolute', left:12, top:14, pointerEvents:'none' }} />
                        <input
                          value={courseTypeahead}
                          onChange={(e) => {
                            const v = e.target.value.toUpperCase();
                            setCourseTypeahead(v);
                            setHitsOpen(true);
                          }}
                          onFocus={() => setHitsOpen(true)}
                          placeholder="E.G. MCE303, THERMO, GST111…"
                          style={{ ...inputStyles, paddingLeft:36, margin:0, textTransform:'uppercase', fontWeight:700, letterSpacing:'0.04em' }}
                        />
                        {liveSearchLoading && courseTypeahead.trim().length >= 2 && (
                          <Loader2 className="animate-spin" size={16} color="#7a12cc" style={{ position:'absolute', right:14, top:14 }} />
                        )}
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:10, marginTop:8 }}>
                        <span style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>
                          {courseTypeahead.trim().length < 1
                            ? 'Type to search your library and live matches'
                            : `${combinedHits.length} match${combinedHits.length === 1 ? '' : 'es'}`}
                        </span>
                        <button
                          type="button"
                          onClick={runAiBaseline}
                          disabled={aiBaselineLoading}
                          style={{
                            display:'inline-flex',
                            alignItems:'center',
                            gap:8,
                            padding:'8px 12px',
                            borderRadius:10,
                            border:'1.5px solid rgba(122,18,204,0.35)',
                            background:'#faf5ff',
                            color:'#6d28d9',
                            fontSize:11,
                            fontWeight:800,
                            cursor: aiBaselineLoading ? 'wait' : 'pointer',
                            fontFamily:'inherit',
                          }}
                        >
                          {aiBaselineLoading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                          {aiBaselineLoading ? 'Refreshing…' : 'Refresh library'}
                        </button>
                      </div>
                      {aiBaselineError && (
                        <p style={{ fontSize:11, color:'#b45309', margin:'8px 0 0', fontWeight:600 }}>{aiBaselineError}</p>
                      )}
                    </div>

                    {courseTypeahead.trim() && !liveSearchLoading && combinedHits.length === 0 && (
                      <p style={{ fontSize:12, color:'#9ca3af', margin:'0 0 12px', fontWeight:600 }}>
                        No matches yet—try another keyword or add the course manually below.
                      </p>
                    )}

                    {hitsOpen && combinedHits.length > 0 && (
                      <div
                        style={{
                          maxHeight:220,
                          overflowY:'auto',
                          border:'1.5px solid #e5e7eb',
                          borderRadius:12,
                          marginBottom:14,
                          background:'#fafafa',
                        }}
                      >
                        {combinedHits.map((h) => {
                          const taken = selectedCourses.some((p) => p.code === h.code);
                          return (
                            <button
                              key={h.code}
                              type="button"
                              disabled={taken}
                              onClick={() => !taken && pickCourse(h.code, h.name, h.hitKind)}
                              style={{
                                width:'100%',
                                textAlign:'left',
                                padding:'12px 14px',
                                border:'none',
                                borderBottom:'1px solid #eee',
                                background: taken ? '#f3f4f6' : 'white',
                                cursor: taken ? 'default' : 'pointer',
                                fontFamily:'inherit',
                                display:'block',
                              }}
                            >
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                                <div>
                                  <div style={{ fontSize:12, fontWeight:900, color:'#7a12cc', letterSpacing:'0.06em' }}>{h.code}</div>
                                  <div style={{ fontSize:13, fontWeight:600, color:'#111', marginTop:2 }}>{h.name}</div>
                                </div>
                                <span style={{ fontSize:9, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', flexShrink:0 }}>
                                  {h.hitKind === 'library' ? 'From list' : 'Match'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedCourses.length > 0 && (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:10, fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Selected</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                          {selectedCourses.map((c) => (
                            <span
                              key={c.code}
                              style={{
                                display:'inline-flex',
                                alignItems:'center',
                                gap:6,
                                padding:'8px 12px',
                                borderRadius:999,
                                background:'#f0e8ff',
                                border:'1px solid rgba(122,18,204,0.25)',
                                fontSize:12,
                                fontWeight:700,
                                color:'#5b21b6',
                              }}
                            >
                              {c.code}
                              <button
                                type="button"
                                onClick={() => removeFromSelected(c.code)}
                                style={{ border:'none', background:'transparent', padding:0, cursor:'pointer', display:'flex', color:'#7a12cc' }}
                                aria-label={`Remove ${c.code}`}
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom:18, padding:14, borderRadius:14, border:'1px dashed #e5e7eb', background:'#fafafa' }}>
                      <div style={{ fontSize:11, fontWeight:800, color:'#555', marginBottom:8 }}>Not listed? Add manually — we verify online &amp; save details</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr auto', gap:8, alignItems:'end' }}>
                        <input
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                          placeholder="CODE"
                          style={{ ...inputStyles, margin:0, textTransform:'uppercase', fontWeight:800 }}
                        />
                        <input
                          value={manualTitle}
                          onChange={(e) => setManualTitle(e.target.value)}
                          placeholder="Full course title"
                          style={{ ...inputStyles, margin:0 }}
                        />
                        <button
                          type="button"
                          onClick={() => addManualWithEnrich()}
                          disabled={manualEnriching}
                          style={{
                            padding:'12px 14px',
                            borderRadius:10,
                            border:'none',
                            background:'#7a12cc',
                            color:'white',
                            fontWeight:800,
                            fontSize:12,
                            cursor: manualEnriching ? 'wait' : 'pointer',
                            fontFamily:'inherit',
                            whiteSpace:'nowrap',
                          }}
                        >
                          {manualEnriching ? <Loader2 className="animate-spin" size={14} style={{ display:'inline', verticalAlign:'middle' }} /> : null}{' '}
                          {manualEnriching ? 'Verifying…' : 'Add & verify'}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom:20 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:10, fontWeight:800, color:'#666', textTransform:'uppercase', letterSpacing:'0.06em' }}>Semester load</span>
                        <span style={{ fontSize:11, fontWeight:800, color: loadPct >= 100 ? '#dc2626' : '#7a12cc' }}>{loadPct}%</span>
                      </div>
                      <div style={{ height:7, background:'#f0e8ff', borderRadius:999, overflow:'hidden' }}>
                        <motion.div
                          animate={{ width: `${loadPct}%` }}
                          transition={{ type:'spring', stiffness:200, damping:24 }}
                          style={{
                            height:'100%',
                            borderRadius:999,
                            background: loadPct >= 100 ? '#dc2626' : 'linear-gradient(90deg,#7a12cc,#b04dfc)',
                          }}
                        />
                      </div>
                      <AnimatePresence>
                        {aiMsg() && (
                          <motion.p
                            initial={{ opacity:0, y:-4 }}
                            animate={{ opacity:1, y:0 }}
                            exit={{ opacity:0 }}
                            style={{ fontSize:12, fontWeight:600, color:aiMsg().color, margin:'5px 0 0' }}
                          >
                            {aiMsg().msg}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => goTo(2)} style={{ padding:'12px 18px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'white', color:'#555', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                  <button
                    onClick={() => goTo(4)}
                    disabled={selectedCourses.length === 0}
                    style={{
                      flex:1,
                      padding:'12px',
                      borderRadius:12,
                      background: selectedCourses.length > 0 ? '#7a12cc' : '#e5e7eb',
                      color: selectedCourses.length > 0 ? 'white' : '#9ca3af',
                      fontSize:14,
                      fontWeight:700,
                      border:'none',
                      cursor: selectedCourses.length > 0 ? 'pointer' : 'not-allowed',
                      fontFamily:'inherit',
                      boxShadow: selectedCourses.length > 0 ? '0 6px 20px rgba(122,18,204,0.3)' : 'none',
                      transition:'all 0.2s',
                    }}
                  >
                    My Alarm →
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 4 — Study Schedule & Reminders ══ */}
            {step === 4 && (
              <div style={{ background:'white', borderRadius:24, padding:36, boxShadow:'0 20px 60px rgba(122,18,204,0.1)', border:'1px solid rgba(122,18,204,0.12)' }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:'#7a12cc', textTransform:'uppercase', marginBottom:6 }}>Step 4 of 5</div>
                <h2 style={{ fontSize:26, fontWeight:900, color:'#111', letterSpacing:'-0.03em', margin:'0 0 4px' }}>Create your study routine</h2>
                <p style={{ color:'#888', fontSize:13, margin:'0 0 32px' }}>Set up daily reminders to build consistent study habits</p>

                {/* Main Reminder Card */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #7a12cc 0%, #9718fb 100%)', 
                  borderRadius: 20, 
                  padding: 28, 
                  marginBottom: 24,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Background decoration */}
                  <div style={{ 
                    position: 'absolute', 
                    top: -20, 
                    right: -20, 
                    width: 80, 
                    height: 80, 
                    background: 'rgba(255,255,255,0.1)', 
                    borderRadius: '50%' 
                  }} />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: -30, 
                    left: -30, 
                    width: 100, 
                    height: 100, 
                    background: 'rgba(255,255,255,0.08)', 
                    borderRadius: '50%' 
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: 14, 
                          background: 'rgba(255,255,255,0.2)', 
                          color: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <Bell size={22} />
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 2 }}>Daily Study Reminder</div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                            {remindersEnabled ? `Get notified at ${alarmTime}` : 'Reminders turned off'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Toggle Switch */}
                      <motion.div 
                        onClick={() => setRemindersEnabled(!remindersEnabled)}
                        style={{ 
                          width: 52, 
                          height: 28, 
                          borderRadius: 99, 
                          background: remindersEnabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)', 
                          position: 'relative', 
                          cursor: 'pointer', 
                          transition: 'background 0.3s',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div 
                          initial={false}
                          animate={{ x: remindersEnabled ? 24 : 2 }}
                          style={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: '50%', 
                            background: 'white', 
                            position: 'absolute', 
                            top: 2, 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
                          }}
                        />
                      </motion.div>
                    </div>

                    {/* Time Selection */}
                    {remindersEnabled && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div style={{ 
                          background: 'rgba(255,255,255,0.15)', 
                          borderRadius: 12, 
                          padding: 16,
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                          <label style={{ 
                            fontSize: 11, 
                            fontWeight: 700, 
                            color: 'rgba(255,255,255,0.9)', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.06em', 
                            display: 'block', 
                            marginBottom: 8 
                          }}>
                            Study Time
                          </label>
                          <div style={{ position: 'relative' }}>
                            <Clock size={18} color="rgba(255,255,255,0.8)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                              type="time" 
                              value={alarmTime} 
                              onChange={e => setAlarmTime(e.target.value)}
                              style={{ 
                                width: '100%',
                                padding: '12px 14px 12px 42px', 
                                borderRadius: 10, 
                                border: '1px solid rgba(255,255,255,0.3)', 
                                fontSize: 16, 
                                fontWeight: 700, 
                                color: 'white',
                                background: 'rgba(255,255,255,0.1)',
                                outline: 'none',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s'
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Quick Time Options */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Quick Suggestions
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
                    {['06:00', '08:00', '12:00', '18:00', '20:00'].map(time => (
                      <motion.button
                        key={time}
                        onClick={() => setAlarmTime(time)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 12,
                          border: alarmTime === time ? '2px solid #7a12cc' : '1px solid #e5e7eb',
                          background: alarmTime === time ? '#faf5ff' : 'white',
                          color: alarmTime === time ? '#7a12cc' : '#555',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.2s',
                          boxShadow: alarmTime === time ? '0 4px 12px rgba(122,18,204,0.15)' : 'none'
                        }}
                      >
                        {time}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Info Card */}
                <div style={{ 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 12, 
                  padding: 16, 
                  marginBottom: 24 
                }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 8, 
                      background: '#e0e7ff', 
                      color: '#3730a3', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
                        Smart Reminders
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                        We'll send you gentle nudges at your preferred time to help you stay consistent with your studies.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <motion.button 
                    onClick={() => goTo(3)} 
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ 
                      padding:'14px 20px', 
                      borderRadius:12, 
                      border:'1.5px solid #e5e7eb', 
                      background:'white', 
                      color:'#555', 
                      fontSize:13, 
                      fontWeight:600, 
                      cursor:'pointer', 
                      fontFamily:'inherit',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    ← Back
                  </motion.button>
                  <motion.button 
                    onClick={() => goTo(5)} 
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ 
                      flex:1, 
                      padding:'14px', 
                      borderRadius:12, 
                      background: 'linear-gradient(135deg, #7a12cc 0%, #9718fb 100%)', 
                      color: 'white', 
                      fontSize:14, 
                      fontWeight:700, 
                      border:'none', 
                      cursor: 'pointer', 
                      fontFamily:'inherit', 
                      boxShadow: '0 6px 20px rgba(122,18,204,0.3)', 
                      transition:'all 0.2s'
                    }}
                  >
                    Continue to Goals →
                  </motion.button>
                </div>
              </div>
            )}

            {/* ══ STEP 5 — Goal ══ */}
            {step === 5 && (
              <div style={{ background:'white', borderRadius:24, padding:36, boxShadow:'0 20px 60px rgba(122,18,204,0.1)', border:'1px solid rgba(122,18,204,0.12)' }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:'#7a12cc', textTransform:'uppercase', marginBottom:6 }}>Step 5 of 5</div>
                <h2 style={{ fontSize:24, fontWeight:900, color:'#111', letterSpacing:'-0.03em', margin:'0 0 4px' }}>What's the target?</h2>
                <p style={{ color:'#888', fontSize:13, margin:'0 0 24px' }}>This sets how your AI tutor speaks to you.</p>

                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
                  {GOALS.map(g => (
                    <motion.button key={g.id} onClick={() => setGoal(g.id)}
                      whileHover={{ x:4 }} whileTap={{ scale:0.98 }}
                      style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderRadius:14, border:`2px solid ${goal===g.id?'#7a12cc':'#e5e7eb'}`, background: goal===g.id?'#faf5ff':'white', cursor:'pointer', textAlign:'left', fontFamily:'inherit', boxShadow: goal===g.id?'0 6px 20px rgba(122,18,204,0.15)':'none', transition:'border-color 0.18s,background 0.18s' }}>
                      <span style={{ fontSize:26 }}>{g.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:800, color: goal===g.id?'#7a12cc':'#111' }}>{g.label}</div>
                        <div style={{ fontSize:11, color:'#888', fontWeight:500, marginTop:2 }}>{g.sub}</div>
                      </div>
                      <AnimatePresence>
                        {goal===g.id && <motion.div initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}><CheckCircle2 size={20} color="#7a12cc" /></motion.div>}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {goal && (
                    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'#faf5ff', borderRadius:12, marginBottom:18, border:'1px solid rgba(122,18,204,0.12)' }}>
                      <img src={logo} alt="" style={{ width:26, height:26, objectFit:'contain' }} />
                      <span style={{ fontSize:12, fontWeight:600, color:'#555' }}>"{GOALS.find(g2=>g2.id===goal)?.ai}"</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => goTo(4)} style={{ padding:'12px 18px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'white', color:'#555', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                  <button onClick={() => !saving && goal && finish(goal)} disabled={!goal||saving}
                    style={{ flex:1, padding:'13px', borderRadius:12, background: goal?'#7a12cc':'#e5e7eb', color: goal?'white':'#9ca3af', fontSize:14, fontWeight:700, border:'none', cursor: goal?'pointer':'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow: goal?'0 6px 20px rgba(122,18,204,0.3)':'none', transition:'all 0.2s' }}>
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Compiling Platform…</> : '🚀 Compile Dashboard & Enter'}
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}