import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Search, ChevronDown, Bell, Clock, User } from 'lucide-react';
import logo from '../../asset/logo.png';
import { getSubjects } from '../data/curriculum';

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
      <motion.div key={name}
        style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, marginBottom:14 }}>
        {name ? name.slice(0,2).toUpperCase() : '?'}
      </motion.div>
      <motion.div key={university} style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.02em', minHeight:20, lineHeight: 1.2 }}>{university || '—'}</motion.div>
      <motion.div key={course} style={{ fontSize:11, opacity:0.8, marginTop:8, minHeight:14, fontWeight: 600 }}>{course || 'Programme'}</motion.div>
      <motion.div key={level} style={{ fontSize:10, opacity:0.6, marginTop:2, minHeight:12 }}>{level ? `${level} Level` : 'Level'}</motion.div>
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
  const [country, setCountry] = useState('Nigeria');
  const [university, setUniversity] = useState('');
  const [universities, setUniversities] = useState([]);
  const [courseOfStudy, setCourseOfStudy] = useState('Computer Science');
  const [level, setLevel] = useState('100');
  const [semester, setSemester] = useState('2nd');
  
  const [uniSearch,  setUniSearch]  = useState('');
  const [showUniDrop,setUniDrop]    = useState(false);

  useEffect(() => {
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

  // Step 3 — mapped from Curriculum DB
  const [catalog,  setCatalog]  = useState([]);
  const [selected, setSelected] = useState([]);
  const MAX = 14;

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

  const generateFallback = (course) => {
    const pfx = course ? course.replace(/[^a-zA-Z]/g, '').substring(0,3).toUpperCase() : 'GNS';
    return [
      { code: `${pfx}101`, name: `Introduction to ${course || 'Studies'}` },
      { code: `${pfx}102`, name: `Fundamentals of ${course || 'the field'}` },
      { code: `${pfx}103`, name: 'Research Methodology' },
      { code: `GNS101`, name: 'Use of English' },
      { code: `GST111`, name: 'Communication in English' },
      { code: `GNS102`, name: 'Philosophy and Logic' },
      { code: `GST121`, name: 'Nigerian Peoples and Culture' },
      { code: `CSC101`, name: 'Introduction to Computing' },
      { code: `ENT201`, name: 'Entrepreneurship Studies' }
    ];
  };

  const fetchRealSyllabus = async () => {
    setFetchingSyllabus(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer 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`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Luter AI Frontend API Request"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [{
            role: "user",
            content: `I am studying ${courseOfStudy} at ${university}, ${country}. I am in ${level} level, ${semester} semester. Provide a JSON array containing the typical 10-15 exact real-world courses (subjects) a student would take. Return ONLY a valid JSON array of objects, with no markdown, no backticks, and no extra text. Format: [{"code": "MTH101", "name": "General Mathematics I"}]`
          }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      let rawText = data.choices[0].message.content.trim();
      if (rawText.startsWith('```json')) rawText = rawText.substring(7);
      if (rawText.startsWith('```')) rawText = rawText.substring(3);
      if (rawText.endsWith('```')) rawText = rawText.substring(0, rawText.length - 3);
      const parsed = JSON.parse(rawText.trim());
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCatalog(parsed.map(c => ({ 
          code: c.code?.substring(0,8).toUpperCase() || 'UNK000', 
          name: c.name || 'Unknown Course' 
        })));
      } else {
        const fall = getSubjects(courseOfStudy, level, semester);
        setCatalog(fall && fall.length > 0 ? fall : generateFallback(courseOfStudy));
      }
    } catch(err) {
      console.error("LLM Syllabus fetch failed, using fallback mock", err);
      const fall = getSubjects(courseOfStudy, level, semester);
      setCatalog(fall && fall.length > 0 ? fall : generateFallback(courseOfStudy));
    }
    setFetchingSyllabus(false);
  }

  const goTo = useCallback((next) => {
    if (next === 3 && step === 2) { 
      setSelected([]); 
      fetchRealSyllabus(); 
    }
    setDir(next > step ? 1 : -1);
    setStep(next);
  }, [step, courseOfStudy, level, semester, university, country]);

  const toggleCourse = (code) => {
    setSelected(prev => {
      if (prev.includes(code)) return prev.filter(c => c !== code);
      if (prev.length >= MAX) return prev;
      return [...prev, code];
    });
  };

  const loadPct = Math.round((selected.length / MAX) * 100);
  const aiMsg = () => {
    if (selected.length === 0)         return null;
    if (selected.length >= MAX)        return { msg: "Heavy load! Luter is ready to carry the weight.", color:'#dc2626' };
    if (selected.length >= Math.round(MAX*0.6)) return { msg: "Ambitious! I'll help manage this schedule.", color:'#d97706' };
    return { msg: `${selected.length} course${selected.length>1?'s':''} equipped. Solid plan!`, color:'#10B981' };
  };

  /* ── Finish — write everything to Supabase ── */
  const finish = async (chosenGoal) => {
    if (!authUser) return;
    setSaving(true);

    // 1. Update primary profile using the specific metadata asked
    await supabase.from('profiles').upsert({
      id: authUser.id,
      full_name:           nickname || authUser.user_metadata?.full_name || '',
      university,
      faculty:             courseOfStudy,
      academic_goal:       chosenGoal,
      source:              source, 
      alarm_time:          alarmTime,
      reminders_enabled:   remindersEnabled,
      onboarding_complete: true,
    });

    // 2. Prep dynamic courses
    const coursesToUpsert = selected.map(code => {
      const c = catalog.find(x => x.code === code);
      return { code: c.code, name: c.name, faculty: courseOfStudy }
    });
    
    // Auto-upserting missing syllabus directly
    if (coursesToUpsert.length > 0) {
      // Step A: Safely insert or update missing global catalog syllabus
      await supabase.from('courses').upsert(coursesToUpsert, { onConflict: 'code' });
      
      // Step B: Force fetch the final official DB Row IDs (Supabase returns nothing if upsert hits identical data with no changes)
      const { data: globalCourses } = await supabase
        .from('courses')
        .select('id, code')
        .in('code', selected);

      // 3. Link real tracked user_courses
      if (globalCourses && globalCourses.length > 0) {
        const rows = globalCourses.map(c => ({
          user_id:   authUser.id,
          course_id: c.id,
          progress:  0,
          target_score: chosenGoal === 'first' ? 90 : chosenGoal === 'second' ? 75 : 50,
        }));
        await supabase.from('user_courses').upsert(rows, { onConflict: 'user_id,course_id' });
      }
    }

    // 4. Initialize tracker at zero
    await supabase.from('user_stats').upsert({
      user_id:    authUser.id,
      total_xp:   0,
      streak_days:0,
      lives:      3,
      badges:     [],
    }, { onConflict: 'user_id' });

    // 5. Celebration mapping
    setConfetti(true);
    setTimeout(() => setShowXP(true), 400);
    setTimeout(() => navigate('/dashboard'), 2800);
  };

  const filteredUnis = universities.filter(u =>
    u.toLowerCase().includes(uniSearch.toLowerCase())
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
                <p style={{ color:'#888', fontSize:13, margin:'0 0 26px' }}>Let's pull up your exact curriculum syllabus from our records.</p>

                <div className="stack-on-mobile" style={{ display:'flex', gap:32, alignItems:'flex-start' }}>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>
                    <div>
                      <label style={{ fontSize:11, fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Country</label>
                      <div style={{ position: 'relative' }}>
                        <select value={country} onChange={e => setCountry(e.target.value)} style={country ? activeInputStyles : inputStyles}>
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
                      <input value={courseOfStudy} onChange={e => setCourseOfStudy(e.target.value)} placeholder="e.g. Computer Science, Economics" style={courseOfStudy ? activeInputStyles : inputStyles} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize:11, fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Level</label>
                        <div style={{ position: 'relative' }}>
                          <select value={level} onChange={e => setLevel(e.target.value)} style={level ? activeInputStyles : inputStyles}>
                            {['100','200','300','400','500'].map(l => <option key={l} value={l}>{l} Level</option>)}
                          </select>
                          <ChevronDown size={14} color="#888" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize:11, fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Semester</label>
                        <div style={{ position: 'relative' }}>
                          <select value={semester} onChange={e => setSemester(e.target.value)} style={semester ? activeInputStyles : inputStyles}>
                            <option value="1st">1st Semester</option><option value="2nd">2nd Semester</option>
                          </select>
                          <ChevronDown size={14} color="#888" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:10, marginTop: 8 }}>
                      <button onClick={() => goTo(1)} style={{ padding:'14px 18px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'white', color:'#555', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                      <button onClick={() => goTo(3)} disabled={!university || !courseOfStudy}
                        style={{ flex:1, padding:'14px', borderRadius:12, background: university&&courseOfStudy?'#7a12cc':'#e5e7eb', color: university&&courseOfStudy?'white':'#9ca3af', fontSize:14, fontWeight:700, border:'none', cursor: university&&courseOfStudy?'pointer':'not-allowed', fontFamily:'inherit', boxShadow: university&&courseOfStudy?'0 6px 20px rgba(122,18,204,0.3)':'none', transition:'all 0.2s' }}>
                        Locate Syllabus →
                      </button>
                    </div>
                  </div>

                  <div className="full-width-mobile" style={{ display: 'flex', justifyContent: 'center', width: 'auto' }}>
                    <IDCard name={nickname} university={university} course={courseOfStudy} level={level} />
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 3 — Course Picker / Curriculum Sync ══ */}
            {step === 3 && (
              <div style={{ background:'white', borderRadius:24, padding:36, boxShadow:'0 20px 60px rgba(122,18,204,0.1)', border:'1px solid rgba(122,18,204,0.12)' }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:'#7a12cc', textTransform:'uppercase', marginBottom:6 }}>Step 3 of 5</div>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:4 }}>
                  <div>
                    <h2 style={{ fontSize:24, fontWeight:900, color:'#111', letterSpacing:'-0.03em', margin:'0 0 4px' }}>Confirm your subjects.</h2>
                    <p style={{ color:'#888', fontSize:13, margin:0 }}>We automatically matched your parameters. Select what you are taking.</p>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    <div style={{ fontSize:20, fontWeight:900, color:'#7a12cc' }}>{selected.length}</div>
                    <div style={{ fontSize:10, color:'#999' }}>equipped</div>
                  </div>
                </div>

                <div style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:10, fontWeight:800, color:'#666', textTransform:'uppercase', letterSpacing:'0.06em' }}>Semester Load</span>
                    <span style={{ fontSize:11, fontWeight:800, color: loadPct>=100?'#dc2626':'#7a12cc' }}>{loadPct}%</span>
                  </div>
                  <div style={{ height:7, background:'#f0e8ff', borderRadius:999, overflow:'hidden' }}>
                    <motion.div animate={{ width:`${loadPct}%` }} transition={{ type:'spring', stiffness:200, damping:24 }}
                      style={{ height:'100%', borderRadius:999, background: loadPct>=100?'#dc2626':'linear-gradient(90deg,#7a12cc,#b04dfc)' }} />
                  </div>
                  <AnimatePresence>
                    {aiMsg() && <motion.p initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={{ fontSize:12, fontWeight:600, color:aiMsg().color, margin:'5px 0 0' }}>{aiMsg().msg}</motion.p>}
                  </AnimatePresence>
                </div>

                {fetchingSyllabus ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 0' }}>
                    <Loader2 className="animate-spin" size={32} color="#7a12cc" />
                    <div style={{ marginTop:16, fontSize:15, fontWeight:800, color:'#111' }}>
                      Querying academic databases...
                    </div>
                    <div style={{ fontSize:12, color:'#888', marginTop:4, fontWeight:600 }}>
                      Extracting {courseOfStudy} {level}L syllabus for {university}
                    </div>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:9, marginBottom:22 }}>
                    {catalog.map((c, i) => {
                      const color = COLORS[i % COLORS.length];
                      const active = selected.includes(c.code);
                      return (
                        <motion.button key={c.code} onClick={() => toggleCourse(c.code)}
                          whileHover={{ scale:1.04 }} whileTap={{ scale:0.93 }}
                          style={{ padding:'12px 8px', borderRadius:13, border:`2px solid ${active?color:'#e5e7eb'}`, background: active?`${color}12`:'white', cursor:'pointer', textAlign:'center', fontFamily:'inherit', boxShadow: active?`0 4px 16px ${color}28`:'none', position:'relative', transition:'border-color 0.18s,background 0.18s' }}>
                          {active && (
                            <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                              style={{ position:'absolute', top:-6, right:-6, width:16, height:16, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <CheckCircle2 size={11} color="white" />
                            </motion.div>
                          )}
                          <div style={{ fontSize:11, fontWeight:900, color: active?color:'#888', letterSpacing:'0.04em' }}>{c.code}</div>
                          <div style={{ fontSize:11, fontWeight:600, color: active?'#111':'#555', marginTop:4, letterSpacing:'-0.01em', lineHeight: 1.2 }}>{c.name}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => goTo(2)} style={{ padding:'12px 18px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'white', color:'#555', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                  <button onClick={() => goTo(4)} disabled={selected.length===0}
                    style={{ flex:1, padding:'12px', borderRadius:12, background: selected.length>0?'#7a12cc':'#e5e7eb', color: selected.length>0?'white':'#9ca3af', fontSize:14, fontWeight:700, border:'none', cursor: selected.length>0?'pointer':'not-allowed', fontFamily:'inherit', boxShadow: selected.length>0?'0 6px 20px rgba(122,18,204,0.3)':'none', transition:'all 0.2s' }}>
                    My Alarm →
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 4 — Alarm / Reminder ══ */}
            {step === 4 && (
              <div style={{ background:'white', borderRadius:24, padding:36, boxShadow:'0 20px 60px rgba(122,18,204,0.1)', border:'1px solid rgba(122,18,204,0.12)' }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:'#7a12cc', textTransform:'uppercase', marginBottom:6 }}>Step 4 of 5</div>
                <h2 style={{ fontSize:26, fontWeight:900, color:'#111', letterSpacing:'-0.03em', margin:'0 0 4px' }}>Build the habit.</h2>
                <p style={{ color:'#888', fontSize:13, margin:'0 0 26px' }}>What time should we remind you to hit the books?</p>

                <div style={{ background: '#faf5ff', border: '1px solid rgba(122,18,204,0.15)', borderRadius: 16, padding: 24, marginBottom: 30 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#7a12cc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Daily Reminders</div>
                        <div style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>Push notifications for {alarmTime}</div>
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <div 
                      onClick={() => setRemindersEnabled(!remindersEnabled)}
                      style={{ width: 44, height: 24, borderRadius: 99, background: remindersEnabled ? '#10B981' : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
                    >
                      <motion.div 
                        initial={false}
                        animate={{ x: remindersEnabled ? 22 : 2 }}
                        style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                      />
                    </div>
                  </div>

                  {remindersEnabled && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                        Alarm Time
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Clock size={16} color="#7a12cc" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                          type="time" 
                          value={alarmTime} 
                          onChange={e => setAlarmTime(e.target.value)}
                          style={{ ...activeInputStyles, paddingLeft: 40, fontSize: 16, fontWeight: 700 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => goTo(3)} style={{ padding:'12px 18px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'white', color:'#555', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                  <button onClick={() => goTo(5)} 
                    style={{ flex:1, padding:'14px', borderRadius:12, background: '#7a12cc', color: 'white', fontSize:14, fontWeight:700, border:'none', cursor: 'pointer', fontFamily:'inherit', boxShadow: '0 6px 20px rgba(122,18,204,0.3)', transition:'all 0.2s' }}>
                    Set Target →
                  </button>
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