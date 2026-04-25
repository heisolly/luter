import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  RiUserFill as User, RiAtLine as At, RiCalendarFill as Calendar, RiGraduationCapFill as GraduationCap, RiBookOpenFill as BookOpen, 
  RiFocusFill as Target, RiRocketFill as Rocket, RiCheckLine as Check, RiArrowRightLine as ArrowRight, RiArrowLeftLine as ArrowLeft,
  RiSearchLine as Search, RiBookFill as Book, RiTeamFill as Users, RiBriefcaseFill as Briefcase, RiGlobalFill as Globe, RiMagicFill as Sparkle,
  RiArrowRightSLine as ChevronRight, RiArrowDownSLine as ChevronDown, RiNotificationFill as Bell, RiCloseLine as X, RiRefreshLine as RefreshCw, RiAddLine as Plus,
  RiYoutubeFill as Youtube, RiFileTextFill as FileText, RiMusicFill as Music, RiUploadFill as Upload, RiMicFill as Mic, RiLink as LinkIcon, RiCheckboxCircleFill as CheckCircle
} from 'react-icons/ri';
import LuterLogo from './shared/LuterLogo';
import LanguageToggle from './LanguageToggle';
import { PremiumButton } from './PageShared';
import Ballpit from './ui/Ballpit';
import { supabase } from '../supabaseClient';
import { 
  universitySlugFromName, 
  departmentSlugFromLabel, 
  normalizeSemesterParam,
  normalizeCourseCode 
} from '../lib/curriculumSlugs';
import { fetchGroqLiveCourseSearch } from '../groqClient';
import { uploadMaterial, addYoutubeMaterial } from '../services/materialsService';

// Step progress bar component
const ProgressBar = ({ step, totalSteps, onBack }) => (
  <div style={{ width: '100%', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
    {step > 1 && (
      <motion.button
        whileHover={{ scale: 1.1, x: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        style={{ background: '#F3F4F6', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111' }}
      >
        <ArrowLeft size={18} weight="bold" />
      </motion.button>
    )}
    <div style={{ flex: 1, height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(step / totalSteps) * 100}%` }}
        style={{ height: '100%', background: 'linear-gradient(90deg, #A78BFA 0%, #C4B5FD 100%)', borderRadius: '4px' }}
      />
    </div>
    <span style={{ fontSize: '14px', fontWeight: 700, color: '#4B0082', fontFamily: 'var(--font-outfit)', minWidth: '45px' }}>
      {step}/{totalSteps}
    </span>
  </div>
);

// Constants
const ROLES = [
  { id: 'student', labelKey: 'student', subKey: 'studentSub', icon: '🎓' },
  { id: 'solo', labelKey: 'solo', subKey: 'soloSub', icon: '🚀' }
];

const INTERESTS = [
  { id: 'science', label: 'Science', icon: '🧬', color: '#3B82F6' },
  { id: 'tech', label: 'Technology', icon: '💻', color: '#10B981' },
  { id: 'arts', label: 'Arts', icon: '🎨', color: '#F59E0B' },
  { id: 'business', label: 'Business', icon: '📈', color: '#6366F1' },
  { id: 'humanities', label: 'Humanities', icon: '📚', color: '#EC4899' },
  { id: 'languages', label: 'Languages', icon: '🌎', color: '#8B5CF6' }
];

const COUNTRIES = [
  { name: "Nigeria", flag: "🇳🇬" },
  { name: "United States", flag: "🇺🇸" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "France", flag: "🇫🇷" },
  { name: "Ghana", flag: "🇬🇭" },
  { name: "South Africa", flag: "🇿🇦" },
  { name: "Kenya", flag: "🇰🇪" },
  { name: "India", flag: "🇮🇳" },
  { name: "China", flag: "🇨🇳" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "South Korea", flag: "🇰🇷" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "Sweden", flag: "🇸🇪" },
  { name: "UAE", flag: "🇦🇪" }
].sort((a, b) => a.name.localeCompare(b.name));

const MAJORS = [
  "Computer Science", "Software Engineering", "Artificial Intelligence", "Medicine", "Pharmacy", "Nursing", "Law", "Mechanical Engineering", "Civil Engineering", "Electrical Engineering", "Economics", "Business Administration", "Accounting", "Political Science", "Psychology", "International Relations", "Architecture", "Mass Communication", "Physics", "Chemistry", "Biology", "Mathematics", "Philosophy", "History"
].sort();

// Comprehensive list of Nigerian Universities to supplement API
const NIGERIAN_UNIVERSITIES = [
  "University of Lagos (UNILAG)", "University of Ibadan (UI)", "Obafemi Awolowo University (OAU)", "University of Benin (UNIBEN)", "University of Nigeria (UNN)", "Ahmadu Bello University (ABU)", "University of Ilorin (UNILORIN)", "Federal University of Technology Akure (FUTA)", "Federal University of Technology Owerri (FUTO)", "Federal University of Technology Minna (FUTMINNA)", "University of Abuja", "University of Port Harcourt (UNIPORT)", "University of Jos (UNIJOS)", "Bayero University Kano (BUK)", "Lagos State University (LASU)", "Olabisi Onabanjo University (OOU)", "Ekiti State University (EKSU)", "Kwara State University (KWASU)", "Delta State University (DELSU)", "Tai Solarin University of Education (TASUED)", "Covenant University", "Babcock University", "Landmark University", "Bells University of Technology", "Bowen University", "Pan-Atlantic University", "Nile University of Nigeria", "Baze University", "Lead City University", "Redeemer's University", "Afe Babalola University (ABUAD)", "American University of Nigeria (AUN)", "Mountain Top University", "Anchor University", "Augustine University", "Chrisland University", "Christopher University", "Hallmark University", "Kings University", "McPherson University", "Southwestern University", "Summit University", "Wellspring University", "Wesley University", "Western Delta University"
].sort();

const GOALS_STUDENT = [
  { id: 'grades', label: 'Ace my exams & GPA', emoji: '🎯' },
  { id: 'research', label: 'Master research skills', emoji: '🔬' },
  { id: 'career', label: 'Prep for dream job', emoji: '💼' }
];

const GOALS_SOLO = [
  { id: 'productivity', label: 'Boost daily focus', emoji: '⚡' },
  { id: 'knowledge', label: 'Learn new subjects', emoji: '🧠' },
  { id: 'organization', label: 'Structure my life', emoji: '📅' }
];

// Helper components
const SearchInputWithSuggestions = ({ placeholder, value, onChange, icon: Icon, suggestions, isCountry = false }) => {
  const [show, setShow] = useState(false);
  const filtered = suggestions.filter(s => {
    const name = typeof s === 'string' ? s : s.name;
    return name.toLowerCase().includes(value.toLowerCase());
  });
  
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Icon style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} color="#111" weight="bold" size={18} />
      <input 
        value={value} 
        onChange={e => onChange(e.target.value)}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        placeholder={placeholder} 
        style={inputStyle} 
      />
      <AnimatePresence>
        {show && filtered.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, 
              background: 'rgba(255, 255, 255, 0.9)', 
              backdropFilter: 'blur(10px)',
              borderRadius: '16px', marginTop: '12px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)', 
              zIndex: 50, maxHeight: '250px', overflowY: 'auto',
              padding: '8px'
            }}
          >
            {filtered.map(s => {
              const name = typeof s === 'string' ? s : s.name;
              const flag = typeof s === 'string' ? null : s.flag;
              return (
                <motion.div 
                  key={name} 
                  whileHover={{ x: 4, background: 'rgba(199, 185, 255, 0.2)' }}
                  onClick={() => { onChange(name); setShow(false); }} 
                  style={{ 
                    padding: '12px 16px', cursor: 'pointer', 
                    borderRadius: '10px',
                    fontSize: '14px', fontWeight: 500, color: '#111',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'background 0.2s ease',
                    fontFamily: 'var(--font-varela)'
                  }}
                >
                  {flag && <span style={{ fontSize: '18px' }}>{flag}</span>}
                  {name}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CustomDatePicker = ({ value, onChange }) => (
  <div style={{ position: 'relative' }}>
    <Calendar style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} color="#111" weight="bold" size={18} />
    <input 
      type="date" 
      value={value} 
      onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, paddingLeft: '48px' }} 
    />
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '16px 16px 16px 48px',
  borderRadius: '9999px',
  border: '2px solid #F3F4F6',
  background: '#F9FAFB',
  fontSize: '15px',
  fontWeight: 400,
  color: '#111',
  outline: 'none',
  transition: 'all 0.2s ease',
  fontFamily: 'var(--font-varela)',
  boxSizing: 'border-box'
};

const selectStyle = {
  ...inputStyle,
  paddingLeft: '24px',
  appearance: 'none',
  cursor: 'pointer'
};

const onboardingPrimaryButtonStyle = {
  background: '#A855F7'
};

const StepWrapper = ({ children, title, subtitle, t, maxWidth = '560px' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    style={{ 
      width: '100%', 
      maxWidth: maxWidth, 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'flex-start', 
      margin: '0 auto',
      maxHeight: '80vh',
      overflowY: 'auto',
      padding: '10px'
    }}
    className="custom-scrollbar"
  >
    {title && <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111', marginBottom: '8px', textAlign: 'center', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em' }}>{t(title)}</h1>}
    {subtitle && <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '40px', textAlign: 'center', fontFamily: 'var(--font-varela)', fontWeight: 400 }}>{t(subtitle)}</p>}
    <div style={{ width: '100%' }}>{children}</div>
  </motion.div>
);

const Onboarding = () => {
  const { t } = useTranslation(['onboarding', 'common']);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const totalSteps = role === 'solo' ? 7 : 6;
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [level, setLevel] = useState('');
  const [semester, setSemester] = useState('');
  const [interests, setInterests] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [searchingAI, setSearchingAI] = useState(false);
  const [mainGoal, setMainGoal] = useState('');
  const [studyTime, setStudyTime] = useState('20:00');
  const [reminders, setReminders] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  
  // New Solo State
  const [hearAboutUs, setHearAboutUs] = useState('');
  const [grade, setGrade] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const focusHour = Number((studyTime || '20:00').split(':')[0] || 20);
  const focusProfile = focusHour < 12
    ? { label: 'Morning focus', tone: 'Fresh starts and lighter mental load.', accent: '#F59E0B', surface: '#FFF7ED' }
    : focusHour < 17
      ? { label: 'Afternoon flow', tone: 'Best for deep work after the day settles in.', accent: '#0EA5E9', surface: '#F0F9FF' }
      : focusHour < 21
        ? { label: 'Evening rhythm', tone: 'A calm slot for structured revision and catch-up.', accent: '#8B5CF6', surface: '#F5F3FF' }
        : { label: 'Night owl mode', tone: 'Quiet hours for uninterrupted study sessions.', accent: '#111827', surface: '#F3F4F6' };

  const routinePresets = [
    { label: 'Before classes', value: '07:00' },
    { label: 'Lunch break', value: '13:00' },
    { label: 'After lectures', value: '18:00' },
    { label: 'Late night', value: '22:00' }
  ];
  
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [isUniversityUser, setIsUniversityUser] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dynamic Lists
  const [country, setCountry] = useState('Nigeria');
  const [universityList, setUniversityList] = useState([]);
  const [fetchingUnis, setFetchingUnis] = useState(false);
  
  // Official Courses
  const [officialCourses, setOfficialCourses] = useState([]);
  const [fetchingOfficialCourses, setFetchingOfficialCourses] = useState(false);

  // Fetch Universities when country changes
  useEffect(() => {
    if (!country) return;
    
    const fetchUnis = async () => {
      setFetchingUnis(true);
      try {
        const res = await fetch(`http://universities.hipolabs.com/search?country=${encodeURIComponent(country)}`);
        const data = await res.json();
        let names = data.map(u => u.name);
        
        // Supplement with static Nigeria list if Nigeria is selected
        if (country === 'Nigeria') {
          names = [...names, ...NIGERIAN_UNIVERSITIES];
        }
        
        const uniqueNames = Array.from(new Set(names)).sort();
        setUniversityList(uniqueNames);
      } catch (err) {
        console.error("Failed to fetch universities", err);
        // Fallback to static list if API fails and country is Nigeria
        if (country === 'Nigeria') {
          setUniversityList(NIGERIAN_UNIVERSITIES);
        }
      } finally {
        setFetchingUnis(false);
      }
    };

    fetchUnis();
  }, [country]);

  // Fetch Official Courses when reaching Step 5
  useEffect(() => {
    if (step === 5 && role === 'student' && university && major && level && semester) {
      const fetchOfficial = async () => {
        setFetchingOfficialCourses(true);
        const uniSlug = universitySlugFromName(university);
        const deptSlug = departmentSlugFromLabel(major);
        const semNorm = normalizeSemesterParam(semester);

        try {
          const { data, error } = await supabase
            .from('curriculum_offers')
            .select('courses')
            .eq('university_slug', uniSlug)
            .eq('department_slug', deptSlug)
            .eq('level', String(level))
            .eq('semester', semNorm)
            .eq('status', 'live')
            .maybeSingle();

          if (data && data.courses) {
            setOfficialCourses(data.courses);
            // Auto-select all official courses by default?
            // User usually wants to add all their courses.
            const newCourses = data.courses.map(c => ({
              code: normalizeCourseCode(c.code),
              name: c.name
            }));
            setSelectedCourses(newCourses);
          }
        } catch (err) {
          console.error("Error fetching official courses:", err);
        } finally {
          setFetchingOfficialCourses(false);
        }
      };

      fetchOfficial();
    }
  }, [step, role, university, major, level, semester]);

  // Course Searching Effect
  useEffect(() => {
    if (step !== 5 || !courseSearch || courseSearch.length < 2) {
      setAiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingAI(true);
      try {
        // 1. Search Database first for real matches
        const { data: dbCourses } = await supabase
          .from('courses')
          .select('code, title')
          .or(`code.ilike.%${courseSearch}%,title.ilike.%${courseSearch}%`)
          .limit(10);
        
        const dbMapped = (dbCourses || []).map(c => ({ code: c.code, name: c.title }));

        // 2. Call AI to fill gaps or find courses not in DB
        const aiResults = await fetchGroqLiveCourseSearch({
          query: courseSearch,
          country,
          university,
          department: major,
          level,
          semester
        });

        // 3. Merge and make unique
        const combined = [...dbMapped, ...aiResults];
        const unique = Array.from(new Map(combined.map(item => [normalizeCourseCode(item.code), item])).values());

        // 4. Filter out what's already in official list
        const officialCodes = new Set(officialCourses.map(c => normalizeCourseCode(c.code)));
        setAiSuggestions(unique.filter(r => !officialCodes.has(normalizeCourseCode(r.code))));
      } catch (err) {
        console.warn("Course Search error:", err);
      } finally {
        setSearchingAI(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [courseSearch, step, country, university, major, level, semester, officialCourses]);

  const goToNext = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const goToBack = () => setStep(prev => Math.max(prev - 1, 1));

  const finish = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const normalizedRole = role === 'solo' ? 'solo_learner' : 'student';
      const isSoloLearner = normalizedRole === 'solo_learner';
      const normalizedSemester = semester === '1' ? '1st' : semester === '2' ? '2nd' : null;
      const profilePayload = {
        id: user.id,
        full_name: fullName,
        username: userName,
        birthday: birthday || null,
        role: normalizedRole,
        is_university_user: !isSoloLearner,
        onboarding_complete: true,
        university: isSoloLearner ? null : university,
        country: country || 'Nigeria',
        level: isSoloLearner ? (grade || null) : String(level || ''),
        semester: isSoloLearner ? null : normalizedSemester,
        faculty: isSoloLearner ? null : major,
        updated_at: new Date().toISOString()
      };

      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileError) throw profileError;

      // 2. Save Courses
      if (!isSoloLearner && selectedCourses.length > 0) {
        for (const course of selectedCourses) {
          // Find or create course in master catalog
          let courseId;
          const { data: existingCourse } = await supabase
            .from('courses')
            .select('id')
            .eq('code', course.code)
            .maybeSingle();

          if (existingCourse) {
            courseId = existingCourse.id;
          } else {
            const { data: newCourse, error: createError } = await supabase
              .from('courses')
              .insert({
                code: course.code,
                name: course.name || course.code,
                faculty: major
              })
              .select('id')
              .single();
            
            if (createError) console.error("Error creating course:", createError);
            else courseId = newCourse.id;
          }

          // Link to user
          if (courseId) {
            await supabase
              .from('user_courses')
              .upsert({
                user_id: user.id,
                course_id: courseId,
                semester: normalizedSemester
              }, { onConflict: 'user_id,course_id' });
          }
        }
      }

      // 3. Process Uploaded Materials (Solo or Student if they have them)
      if (youtubeLink) {
        try {
          await addYoutubeMaterial({
            url: youtubeLink,
            userId: user.id,
            title: `Onboarding Video - ${new Date().toLocaleDateString()}`
          });
        } catch (ytErr) {
          console.error("YouTube onboarding ingestion failed:", ytErr);
        }
      }

      if (selectedFile) {
        try {
          const ext = selectedFile.name.split('.').pop().toLowerCase();
          let type = 'pdf';
          if (['docx', 'doc'].includes(ext)) type = 'docx';
          else if (['pptx', 'ppt'].includes(ext)) type = 'pptx';
          
          await uploadMaterial({
            file: selectedFile,
            userId: user.id,
            title: selectedFile.name,
            type: type
          });
        } catch (fileErr) {
          console.error("File onboarding ingestion failed:", fileErr);
        }
      }

      if (selectedAudio) {
        try {
          await uploadMaterial({
            file: selectedAudio,
            userId: user.id,
            title: selectedAudio.name,
            type: 'audio'
          });
        } catch (audioErr) {
          console.error("Audio onboarding ingestion failed:", audioErr);
        }
      }

      // 4. Create initial stats if missing
      await supabase.from('user_stats').upsert({ user_id: user.id }, { onConflict: 'user_id' });

      window.location.href = '/dashboard';
    } catch (err) {
      console.error("Onboarding finish error:", err);
      alert("Failed to complete onboarding: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#F9FAFB', 
      overflowX: 'hidden',
      overflowY: 'auto',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Dynamic Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Ballpit 
          count={40} 
          gravity={0.7} 
          friction={0.8} 
          wallBounce={0.95} 
          followCursor={true} 
          colors={['#4338ca', '#6366f1', '#1e1b4b', '#ffffff', '#9ca3af']}
          minSize={0.7}
          maxSize={1.4}
        />
      </div>

      {/* Custom Header */}
      <header style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1000 }}>
        <LuterLogo />
        <LanguageToggle />
      </header>

      {/* Main Container */}
      <div className="onboarding-main-card" style={{ 
        width: 'calc(100vw - 48px)', 
        height: 'calc(100vh - 120px)', 
        maxWidth: '1200px', 
        maxHeight: '900px', 
        background: 'white', 
        borderRadius: '32px', 
        padding: '48px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.04)', 
        position: 'relative', 
        zIndex: 10, 
        margin: '0 auto 24px', 
        border: '1px solid #F3F4F6', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        overflow: 'visible'
      }}>
        {step > 1 && <ProgressBar step={step} totalSteps={totalSteps} onBack={goToBack} />}
        
        <div style={{ 
          flex: 1, 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-start', 
          overflowY: 'auto',
          paddingRight: '8px',
          paddingBottom: '20px'
        }} className="onboarding-step-content">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                style={{ 
                  width: '100%', 
                  maxWidth: '600px', 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center', 
                  fontFamily: 'var(--font-outfit)',
                  margin: '0 auto'
                }}
              >
                <SpeechBubble text="Hi there! I'm Lute!" />
                <div style={{ height: '20px' }} />
                <motion.img 
                  src="/onboard-mascot.png" 
                  alt="Lute" 
                  style={{ 
                    width: '240px', 
                    height: 'auto', 
                    marginBottom: '40px', 
                    filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.1))',
                    display: 'block',
                    margin: '0 auto'
                  }} 
                  initial={{ scale: 0.8 }} 
                  animate={{ scale: 1 }} 
                />
                <div style={{ width: '100%', maxWidth: '280px', margin: '0 auto' }}>
                  <PremiumButton onClick={goToNext} style={{ ...onboardingPrimaryButtonStyle, width: '100%', height: '52px', fontSize: '16px' }}>{t('common:continue')}</PremiumButton>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <StepWrapper key="step2" title="pathTitle" subtitle="pathSub" t={t}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ROLES.map(r => (
                    <motion.div key={r.id} onClick={() => { setRole(r.id); setIsUniversityUser(r.id === 'student'); goToNext(); }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ padding: '24px', borderRadius: '12px', border: '2px solid', borderColor: role === r.id ? '#C7B9FF' : '#F3F4F6', background: role === r.id ? '#F3E8FF' : '#F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s ease', color: role === r.id ? '#4B0082' : '#6B7280' }}
                    >
                      <div style={{ fontSize: '32px' }}>{r.icon}</div>
                      <div style={{ flex: 1 }}><h3 style={{ fontSize: '16px', fontWeight: 500, color: role === r.id ? '#4B0082' : '#111', marginBottom: '2px', fontFamily: 'var(--font-outfit)' }}>{t(r.labelKey)}</h3><p style={{ fontSize: '14px', fontWeight: 400, color: role === r.id ? '#A397D8' : '#6B7280' }}>{t(r.subKey)}</p></div>
                    </motion.div>
                  ))}
                </div>
              </StepWrapper>
            )}

            {step === 3 && (
              role === 'student' ? (
                <StepWrapper key="step3-student" title="idTitle" subtitle="idSub" t={t}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ position: 'relative' }}><User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} color="#111" weight="bold" size={18} /><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t('fullName')} style={inputStyle} /></div>
                    <div style={{ position: 'relative' }}><At style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} color="#111" weight="bold" size={18} /><input value={userName} onChange={e => setUserName(e.target.value)} placeholder={t('username')} style={inputStyle} /></div>
                    <CustomDatePicker value={birthday} onChange={setBirthday} />
                    <div style={{ height: '12px' }} />
                    <PremiumButton 
                      disabled={!fullName || !userName || !birthday} 
                      onClick={goToNext}
                      style={{ ...onboardingPrimaryButtonStyle, width: '100%', height: '52px', fontSize: '16px' }}
                    >
                      {t('common:continue')}
                    </PremiumButton>
                  </div>
                </StepWrapper>
              ) : (
                <StepWrapper key="step3-solo" title="How did you hear about us?" subtitle="We're curious! Help us reach more people like you." t={t}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {['Google Search', 'Twitter / X', 'Instagram', 'Friend / Family', 'TikTok', 'University Ad', 'LinkedIn', 'Other'].map(source => (
                      <motion.div 
                        key={source} 
                        onClick={() => { setHearAboutUs(source); goToNext(); }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ 
                          padding: '16px', 
                          borderRadius: '12px', 
                          border: '2px solid', 
                          borderColor: hearAboutUs === source ? '#C7B9FF' : '#F3F4F6', 
                          background: hearAboutUs === source ? '#F3E8FF' : 'white', 
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: hearAboutUs === source ? '#4B0082' : '#6B7280',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {source}
                      </motion.div>
                    ))}
                  </div>
                </StepWrapper>
              )
            )}

            {step === 4 && (
              role === 'student' ? (
                <StepWrapper key="step4-student" title="uniTitle" subtitle="uniSub" t={t}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <SearchInputWithSuggestions 
                      placeholder="Which country are you studying in?"
                      value={country} 
                      onChange={setCountry} 
                      icon={Globe} 
                      suggestions={COUNTRIES} 
                      isCountry={true}
                    />

                    <SearchInputWithSuggestions 
                      placeholder={fetchingUnis ? "Fetching universities..." : "Search University..."}
                      value={university} 
                      onChange={val => setUniversity(val)} 
                      icon={Search} 
                      suggestions={universityList} 
                    />

                    <SearchInputWithSuggestions 
                      placeholder="Program of Study (Major)..."
                      value={major} 
                      onChange={val => setMajor(val)} 
                      icon={GraduationCap} 
                      suggestions={MAJORS} 
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ position: 'relative' }}>
                        <select value={level} onChange={e => setLevel(e.target.value)} style={{ ...selectStyle, paddingLeft: '24px' }}>
                          <option value="">Level</option>
                          <option value="100">100 Level</option>
                          <option value="200">200 Level</option>
                          <option value="300">300 Level</option>
                          <option value="400">400 Level</option>
                          <option value="500">500 Level</option>
                        </select>
                        <ChevronDown size={16} weight="bold" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} color="#4B0082" />
                      </div>
                      <div style={{ position: 'relative' }}>
                        <select value={semester} onChange={e => setSemester(e.target.value)} style={{ ...selectStyle, paddingLeft: '24px' }}>
                          <option value="">Semester</option>
                          <option value="1">1st Semester</option>
                          <option value="2">2nd Semester</option>
                        </select>
                        <ChevronDown size={16} weight="bold" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} color="#4B0082" />
                      </div>
                    </div>
                    <div style={{ height: '12px' }} />
                    <PremiumButton disabled={!university || !major || !level || !semester} onClick={goToNext} style={{ ...onboardingPrimaryButtonStyle, width: '100%', height: '52px', fontSize: '16px' }}>{t('common:continue')}</PremiumButton>
                  </div>
                </StepWrapper>
              ) : (
                <StepWrapper key="step4-solo" title="Tell us about yourself" subtitle="This helps us personalize your learning experience." t={t}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ position: 'relative' }}><User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} color="#111" weight="bold" size={18} /><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t('fullName')} style={inputStyle} /></div>
                    <div style={{ position: 'relative' }}><At style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} color="#111" weight="bold" size={18} /><input value={userName} onChange={e => setUserName(e.target.value)} placeholder={t('username')} style={inputStyle} /></div>
                    <CustomDatePicker value={birthday} onChange={setBirthday} />
                    <div style={{ height: '12px' }} />
                    <PremiumButton 
                      disabled={!fullName || !userName || !birthday} 
                      onClick={goToNext}
                      style={{ ...onboardingPrimaryButtonStyle, width: '100%', height: '52px', fontSize: '16px' }}
                    >
                      {t('common:continue')}
                    </PremiumButton>
                  </div>
                </StepWrapper>
              )
            )}

            {step === 5 && (
              role === 'student' ? (
                <StepWrapper key="step5-student" title="courseTitle" subtitle="courseSub" t={t}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {fetchingOfficialCourses ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <RefreshCw size={24} className="animate-spin" color="#7a12cc" />
                        <p style={{ marginTop: '10px', fontSize: '14px', color: '#6B7280' }}>Loading your curriculum...</p>
                      </div>
                    ) : officialCourses.length > 0 ? (
                      <div style={{ background: '#F9FAFB', borderRadius: '16px', padding: '20px', border: '1px solid #F3F4F6' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-outfit)' }}>
                          <BookOpen size={16} color="#111" weight="bold" /> Official {level}L {semester === '1' ? '1st' : '2nd'} Sem Courses
                        </h4>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '8px',
                          maxHeight: '340px',
                          overflowY: 'auto',
                          paddingRight: '8px'
                        }} className="custom-scrollbar">
                          {officialCourses.map((c, idx) => {
                            const isSelected = selectedCourses.some(sc => sc.code === normalizeCourseCode(c.code));
                            return (
                              <div 
                                key={idx} 
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCourses(selectedCourses.filter(sc => sc.code !== normalizeCourseCode(c.code)));
                                  } else {
                                    setSelectedCourses([...selectedCourses, { code: normalizeCourseCode(c.code), name: c.name }]);
                                  }
                                }}
                                style={{ 
                                  padding: '12px 16px', 
                                  borderRadius: '12px', 
                                  background: isSelected ? '#F3E8FF' : 'white', 
                                  border: '1.5px solid', 
                                  borderColor: isSelected ? '#C7B9FF' : '#E5E7EB',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 500, color: isSelected ? '#4B0082' : '#111', fontFamily: 'var(--font-varela)' }}>{c.code}</span>
                                  <span style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'var(--font-varela)' }}>{c.name}</span>
                                </div>
                                {isSelected ? <Check size={18} color="#111" weight="bold" /> : <Plus size={18} color="#94A3B8" weight="bold" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '20px', borderRadius: '16px', border: '2px dashed #E5E7EB', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: '#6B7280' }}>No official courses found for your department yet.</p>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111', fontFamily: 'var(--font-outfit)' }}>Search & Add Other Courses</h4>
                        {searchingAI && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={12} className="animate-spin" color="#111" weight="bold" /><span style={{ fontSize: '11px', fontWeight: 500, color: '#111', fontFamily: 'var(--font-varela)' }}>Luter is searching...</span></div>}
                      </div>
                      
                      <div style={{ position: 'relative', marginBottom: '12px' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} color="#4B0082" weight="bold" size={18} />
                        <input 
                          value={courseSearch}
                          onChange={e => setCourseSearch(e.target.value.toUpperCase())}
                          placeholder="Search course code or name (e.g. MTH 301)..." 
                          onKeyDown={e => { 
                            if (e.key === 'Enter' && e.target.value) { 
                              const code = normalizeCourseCode(e.target.value);
                              if (!selectedCourses.some(c => c.code === code)) {
                                setSelectedCourses([...selectedCourses, { code, name: '' }]); 
                              }
                              setCourseSearch(''); 
                            }
                          }}
                          style={{ ...inputStyle, paddingLeft: '48px', height: '48px', fontSize: '14px', background: 'white', textTransform: 'uppercase' }} 
                        />
                      </div>

                      {/* AI Search Results */}
                      <AnimatePresence>
                        {aiSuggestions.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ 
                              background: 'rgba(122, 82, 255, 0.03)', 
                              borderRadius: '16px', 
                              padding: '12px', 
                              border: '1px solid rgba(122, 82, 255, 0.1)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              marginBottom: '16px',
                              maxHeight: '200px',
                              overflowY: 'auto'
                            }}
                            className="custom-scrollbar"
                          >
                            <p style={{ fontSize: '10px', fontWeight: 800, color: '#7a12cc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', opacity: 0.7 }}>Luter Suggestions</p>
                            {aiSuggestions.map((s, idx) => {
                              const isSelected = selectedCourses.some(sc => sc.code === normalizeCourseCode(s.code));
                              return (
                                <motion.div 
                                  key={`ai-${idx}`}
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedCourses(selectedCourses.filter(sc => sc.code !== normalizeCourseCode(s.code)));
                                    } else {
                                      setSelectedCourses([...selectedCourses, { code: normalizeCourseCode(s.code), name: s.name }]);
                                    }
                                  }}
                                  style={{ 
                                    padding: '10px 14px', 
                                    borderRadius: '10px', 
                                    background: isSelected ? '#F3E8FF' : 'white',
                                    border: '1px solid',
                                    borderColor: isSelected ? '#C7B9FF' : '#F1F5F9',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                  }}
                                  whileHover={{ x: 2, background: isSelected ? '#F3E8FF' : '#F9FAFB' }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 500, color: isSelected ? '#4B0082' : '#111', fontFamily: 'var(--font-varela)' }}>{s.code}</span>
                                    <span style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'var(--font-varela)' }}>{s.name}</span>
                                  </div>
                                  {isSelected ? <Check size={14} color="#111" weight="bold" /> : <Plus size={14} color="#94A3B8" weight="bold" />}
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        {selectedCourses.filter(sc => !officialCourses.some(oc => normalizeCourseCode(oc.code) === sc.code)).map((c, i) => (
                          <motion.div 
                            layout
                            key={`selected-custom-${i}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ 
                              background: '#F3F4F6', padding: '6px 12px', borderRadius: '8px', 
                              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700 
                            }}
                          >
                            <span>{c.code}</span>
                            <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSelectedCourses(selectedCourses.filter(sc => sc.code !== c.code))} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: '12px' }} />
                    <PremiumButton disabled={selectedCourses.length === 0} onClick={goToNext} style={{ ...onboardingPrimaryButtonStyle, width: '100%', height: '52px', fontSize: '16px' }}>{t('common:continue')}</PremiumButton>
                  </div>
                </StepWrapper>
              ) : (
                <StepWrapper key="step5-solo" title="What's your current grade?" subtitle="This helps us tailor the difficulty and content." t={t}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['Secondary School', 'High School Graduate', 'Undergraduate', 'Postgraduate', 'Self-Taught / Enthusiast'].map(g => (
                      <motion.div 
                        key={g} 
                        onClick={() => { setGrade(g); goToNext(); }}
                        whileHover={{ y: -4, background: '#F3E8FF', borderColor: '#C7B9FF' }}
                        whileTap={{ scale: 0.98 }}
                        style={{ 
                          padding: '20px', 
                          borderRadius: '16px', 
                          border: '2px solid', 
                          borderColor: grade === g ? '#C7B9FF' : '#F3F4F6', 
                          background: grade === g ? '#F3E8FF' : 'white', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          transition: 'all 0.2s ease',
                          boxShadow: grade === g ? '0 10px 20px rgba(168, 85, 247, 0.1)' : 'none'
                        }}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: grade === g ? 'linear-gradient(135deg, #A855F7, #C7B9FF)' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <GraduationCap size={22} weight="bold" color={grade === g ? "white" : "#111"} />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 500, color: grade === g ? '#4B0082' : '#111', fontFamily: 'var(--font-outfit)', textTransform: 'uppercase' }}>{g}</span>
                      </motion.div>
                    ))}
                  </div>
                </StepWrapper>
              )
            )}
            {step === 6 && (
              <StepWrapper key="step6" title="routineTitle" subtitle="routineSub" t={t}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 0.9fr)', gap: '20px', alignItems: 'stretch' }}>
                  <div style={{ background: 'white', border: '1px solid #EAECEF', borderRadius: '28px', padding: '28px', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.05)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B5CF6', fontWeight: 600, fontFamily: 'var(--font-outfit)' }}>Focus Window</p>
                        <h3 style={{ margin: '8px 0 0 0', fontSize: '22px', lineHeight: 1.2, color: '#111', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>{focusProfile.label}</h3>
                      </div>
                      <div style={{ padding: '10px 14px', borderRadius: '999px', background: focusProfile.surface, color: focusProfile.accent, fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-varela)' }}>
                        {focusProfile.tone}
                      </div>
                    </div>

                    <div style={{ padding: '28px', borderRadius: '24px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', border: '1px solid #ECEEF2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500, fontFamily: 'var(--font-varela)' }}>Pick the time you usually lock in best.</span>
                        <span style={{ fontSize: '12px', color: '#111', fontWeight: 600, fontFamily: 'var(--font-outfit)' }}>Local time</span>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                        <input
                          type="time"
                          value={studyTime}
                          onChange={e => setStudyTime(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#111', fontSize: '56px', fontWeight: 600, outline: 'none', textAlign: 'center', width: '100%', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.04em' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      {routinePresets.map((preset) => {
                        const active = studyTime === preset.value;
                        return (
                          <motion.button
                            key={preset.value}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStudyTime(preset.value)}
                            style={{
                              borderRadius: '18px',
                              border: active ? '1px solid #C4B5FD' : '1px solid #E5E7EB',
                              background: active ? '#F5F3FF' : '#FCFCFD',
                              padding: '16px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <span style={{ fontSize: '14px', color: '#111', fontWeight: 600, fontFamily: 'var(--font-outfit)' }}>{preset.label}</span>
                            <span style={{ fontSize: '13px', color: active ? '#6D28D9' : '#6B7280', fontWeight: 400, fontFamily: 'var(--font-varela)' }}>{preset.value}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: focusProfile.surface, border: `1px solid ${focusProfile.accent}22`, borderRadius: '24px', padding: '24px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)' }}>
                        <Sparkle size={20} color={focusProfile.accent} weight="bold" />
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#111', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>Your study profile</h4>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#4B5563', fontWeight: 400, fontFamily: 'var(--font-varela)' }}>
                        Luter will use this window to shape reminders, quick prompts, and your first study rhythm.
                      </p>
                    </div>

                    <motion.div
                      onClick={() => setReminders(!reminders)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ padding: '22px', borderRadius: '24px', border: '1px solid', borderColor: reminders ? '#C4B5FD' : '#E5E7EB', background: reminders ? '#F5F3FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s ease', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)' }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: reminders ? '#A855F7' : '#F4F4F5', color: reminders ? 'white' : '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={20} weight="bold" color={reminders ? 'white' : '#111'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#111', fontFamily: 'var(--font-outfit)', margin: '0 0 4px 0' }}>Daily nudges</h4>
                        <p style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'var(--font-varela)', fontWeight: 400, margin: 0 }}>
                          {reminders ? 'We will nudge you around your chosen focus time.' : 'No reminders for now. You can change this later.'}
                        </p>
                      </div>
                      <div style={{ width: '48px', height: '24px', background: reminders ? '#A855F7' : '#E5E7EB', borderRadius: '9999px', padding: '4px', position: 'relative', flexShrink: 0 }}>
                        <motion.div animate={{ x: reminders ? 24 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </motion.div>

                    <PremiumButton onClick={role === 'student' ? finish : goToNext} style={{ ...onboardingPrimaryButtonStyle, width: '100%', height: '54px', fontSize: '16px' }}>
                      {role === 'student' ? t('enterDashboard') : t('common:continue')}
                    </PremiumButton>
                  </div>
                </div>
              </StepWrapper>
            )}

            {step === 7 && role === 'solo' && (
                <StepWrapper key="step7-solo" title="Do you have your document for study?" subtitle="Upload your Document, Audio or paste a Link" t={t} maxWidth="1000px">
                  <DocumentUploadStep 
                    youtubeLink={youtubeLink} 
                    setYoutubeLink={setYoutubeLink}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    selectedAudio={selectedAudio}
                    setSelectedAudio={setSelectedAudio}
                    fileInputRef={fileInputRef}
                    audioInputRef={audioInputRef}
                    onSkip={finish}
                    onContinue={finish}
                  />
                </StepWrapper>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Speech Bubble Component
const SpeechBubble = ({ text }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} style={{ background: 'white', padding: '16px 32px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative', marginBottom: '24px', border: '2px solid #f1f5f9', display: 'inline-block', fontFamily: 'var(--font-outfit)' }}>
    <p style={{ fontSize: '20px', fontWeight: 500, color: '#111', margin: 0 }}>{text}</p>
    <div style={{ position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid white', zIndex: 1 }} />
    <div style={{ position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '13px solid transparent', borderRight: '13px solid transparent', borderTop: '13px solid #f1f5f9', zIndex: 0 }} />
  </motion.div>
);

// ID Card Component
const IDCard = ({ name, role, info }) => (
  <motion.div 
    initial={{ rotateY: -10, rotateX: 10, scale: 0.95 }} 
    animate={{ rotateY: 0, rotateX: 0, scale: 1 }} 
    transition={{ type: 'spring', damping: 20 }}
    whileHover={{ y: -5, rotateY: 5, rotateX: 5, boxShadow: '0 20px 40px rgba(199, 185, 255, 0.4)' }}
    style={{ width: '100%', aspectRatio: '1.6/1', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-outfit)' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #F9FAFB 0%, white 100%)', zIndex: 0 }} />
    
    <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '48px', height: '48px', background: '#A78BFA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Rocket size={24} weight="bold" /></div>
        <div style={{ textAlign: 'right' }}><p style={{ fontSize: '10px', fontWeight: 800, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Verified Learner</p><div style={{ width: '60px', height: '4px', background: '#A78BFA', borderRadius: '2px', marginLeft: 'auto' }} /></div>
      </div>
      
      <div><h2 style={{ fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: '4px', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em' }}>{name || 'Learner Name'}</h2><p style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280', fontFamily: 'var(--font-varela)' }}>{role} • {info}</p></div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', fontFamily: 'var(--font-varela)', letterSpacing: '0.05em' }}>LUTER CARD ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} color="#4B0082" weight="bold" /></div>
      </div>
    </div>
  </motion.div>
);

const DocumentUploadStep = ({ 
  youtubeLink, setYoutubeLink, 
  selectedFile, setSelectedFile, 
  selectedAudio, setSelectedAudio,
  fileInputRef, audioInputRef,
  onSkip, onContinue 
}) => {
  const hasYouTube = youtubeLink.trim().length > 0;
  const hasDocument = Boolean(selectedFile);
  const hasAudio = Boolean(selectedAudio);
  const hasAnySource = hasYouTube || hasDocument || hasAudio;

  const panelStyle = {
    background: 'white',
    border: '1px solid #EAECEF',
    borderRadius: '28px',
    padding: '28px',
    boxShadow: '0 14px 40px rgba(15, 23, 42, 0.06)'
  };

  const tileBaseStyle = {
    background: '#FCFCFD',
    border: '1px solid #EAECEF',
    borderRadius: '24px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    minHeight: '100%'
  };

  const iconFrameStyle = {
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    background: '#F4F4F5',
    border: '1px solid #E4E4E7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#111'
  };

  const actionButtonStyle = {
    width: '100%',
    height: '50px',
    borderRadius: '16px',
    border: '1px solid #D6D6DB',
    background: '#111',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit)'
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: '620px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '999px', background: '#F5F3FF', color: '#4B0082', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-outfit)', marginBottom: '16px' }}>
            <img src="/onboard-mascot.png" style={{ width: '24px', height: '24px', display: 'block' }} alt="Lute" />
            Study Source
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, color: '#111', margin: '0 0 10px 0', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em' }}>
            Do you have your document ready to study?
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#6B7280', margin: 0, fontFamily: 'var(--font-varela)', fontWeight: 400 }}>
            Bring in a YouTube lesson, class document, or lecture audio. We will turn it into a study-ready workspace inside Luter.
          </p>
        </div>

        <button
          onClick={onSkip}
          style={{ background: 'transparent', border: 'none', color: '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-outfit)' }}
        >
          Skip for now
        </button>
      </div>

      <div style={panelStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} style={tileBaseStyle}>
            <div style={iconFrameStyle}>
              <Youtube size={28} color="#111" weight="bold" />
            </div>
            <div>
              <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#111', margin: '0 0 6px 0', fontFamily: 'var(--font-outfit)' }}>Paste a YouTube link</h4>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-varela)', fontWeight: 400 }}>Ideal for recorded lessons, tutorials, and explainers.</p>
            </div>
            <div style={{ width: '100%', position: 'relative', marginTop: 'auto' }}>
              <LinkIcon style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} size={18} color="#111" weight="bold" />
              <input
                value={youtubeLink}
                onChange={e => setYoutubeLink(e.target.value)}
                placeholder="https://youtu.be/..."
                style={{ ...inputStyle, height: '50px', fontSize: '13px', background: 'white', border: '1px solid #E4E4E7', padding: '0 16px 0 48px' }}
              />
            </div>
            <div style={{ minHeight: '22px', display: 'flex', alignItems: 'center' }}>
              {hasYouTube ? (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-varela)' }}>
                  <CheckCircle size={16} weight="bold" color="#111" /> Link ready
                </motion.div>
              ) : (
                <span style={{ fontSize: '12px', color: '#A1A1AA', fontFamily: 'var(--font-varela)' }}>Paste one link to continue with video study.</span>
              )}
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} style={tileBaseStyle}>
            <div style={iconFrameStyle}>
              <FileText size={28} color="#111" weight="bold" />
            </div>
            <div>
              <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#111', margin: '0 0 6px 0', fontFamily: 'var(--font-outfit)' }}>Upload a document</h4>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-varela)', fontWeight: 400 }}>PDF, DOCX, PPTX, DOC, PPT, or TXT up to 50MB.</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && setSelectedFile(e.target.files[0])}
              accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
            />
            <button onClick={() => fileInputRef.current.click()} style={{ ...actionButtonStyle, marginTop: 'auto' }}>
              {hasDocument ? <CheckCircle size={18} weight="bold" color="white" /> : <Upload size={18} weight="bold" color="white" />}
              {hasDocument ? 'Document attached' : 'Choose document'}
            </button>
            <div style={{ minHeight: '22px', display: 'flex', alignItems: 'center' }}>
              {hasDocument ? (
                <span style={{ fontSize: '12px', color: '#111', fontFamily: 'var(--font-varela)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile.name}
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: '#A1A1AA', fontFamily: 'var(--font-varela)' }}>Best for lecture slides, notes, and handouts.</span>
              )}
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} style={tileBaseStyle}>
            <div style={iconFrameStyle}>
              <Music size={28} color="#111" weight="bold" />
            </div>
            <div>
              <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#111', margin: '0 0 6px 0', fontFamily: 'var(--font-outfit)' }}>Upload lecture audio</h4>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-varela)', fontWeight: 400 }}>MP3, WAV, and other audio files up to 200MB.</p>
            </div>
            <input
              type="file"
              ref={audioInputRef}
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && setSelectedAudio(e.target.files[0])}
              accept="audio/*"
            />
            <button onClick={() => audioInputRef.current.click()} style={{ ...actionButtonStyle, marginTop: 'auto' }}>
              {hasAudio ? <CheckCircle size={18} weight="bold" color="white" /> : <Mic size={18} weight="bold" color="white" />}
              {hasAudio ? 'Audio attached' : 'Choose audio'}
            </button>
            <div style={{ minHeight: '22px', display: 'flex', alignItems: 'center' }}>
              {hasAudio ? (
                <span style={{ fontSize: '12px', color: '#111', fontFamily: 'var(--font-varela)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedAudio.name}
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: '#A1A1AA', fontFamily: 'var(--font-varela)' }}>Great for tutorials, voice notes, and class recordings.</span>
              )}
            </div>
          </motion.div>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #F0F1F3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '14px', color: '#6B7280', fontFamily: 'var(--font-varela)', fontWeight: 400, margin: 0 }}>
            Prefer something else? <span style={{ color: '#111', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }}>Anki import, text, describe, or manual mode</span>
          </p>

          <PremiumButton
            onClick={onContinue}
            style={{ ...onboardingPrimaryButtonStyle, width: '220px', height: '52px', fontSize: '15px', opacity: hasAnySource ? 1 : 0.92 }}
          >
            {hasAnySource ? "Continue with source" : "Continue anyway"}
          </PremiumButton>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
