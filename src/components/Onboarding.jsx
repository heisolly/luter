import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  RiArrowLeftLine,
  RiBookOpenFill,
  RiCalendarCheckFill,
  RiCameraFill,
  RiCheckboxCircleFill,
  RiFileTextFill,
  RiGraduationCapFill,
  RiHeartFill,
  RiLink,
  RiLoader4Line,
  RiMapPin2Fill,
  RiNotificationFill,
  RiPencilFill,
  RiPresentationFill,
  RiSearchLine,
  RiSparklingFill,
  RiUploadCloudFill,
  RiYoutubeFill,
} from 'react-icons/ri';
import { PremiumButton } from './PageShared';
import { supabase } from '../supabaseClient';
import { uploadMaterial, addYoutubeMaterial } from '../services/materialsService';
import { clearLuterCaches } from '../utils/cacheUtils';
import { coursesFromJsonb, fetchCurriculumOffer } from '../services/curriculumService';
import { getSubjects } from '../data/curriculum';
import { getBrowserPosition, searchSchools } from '../services/schoolLookupService';
import {
  departmentSlugFromLabel,
  normalizeCourseCode,
  normalizeSemesterParam,
  universitySlugFromName,
} from '../lib/curriculumSlugs';

const APP_NAME = 'Luter';
const MASCOT_NAME = 'Lumi';
const TOTAL_STEPS = 9;
const FREE_CREDITS = 20000;
const MotionButton = motion.button;
const MotionDiv = motion.div;

const initialDraft = {
  firstName: '',
  lastName: '',
  username: '',
  age: '',
  grade: '',
  dailyGoal: '',
  purpose: '',
  level: '',
  fieldOfStudy: '',
  firstMaterialId: '',
  firstMaterialTitle: '',
  academicProfile: {
    country: 'Nigeria',
    institution: '',
    programme: '',
    level: '',
    semester: '',
  },
  academicCourses: [],
  selectedAcademicCourseCodes: [],
  notifications: '',
  reminderTime: '20:00',
};

const universityLevels = [
  '100 Level / 1st Year',
  '200 Level / 2nd Year',
  '300 Level / 3rd Year',
  '400 Level / 4th Year',
  'Postgraduate',
];

const gradeOptions = [
  'University / College',
  'High School',
  'Middle School',
  'Self-study',
];

const dailyGoalOptions = [
  { id: '15', label: '15 minutes', detail: 'A quick daily win', Icon: RiSparklingFill },
  { id: '30', label: '30 minutes', detail: 'A steady study block', Icon: RiCalendarCheckFill },
  { id: '60', label: '1 hour', detail: 'Deep focus mode', Icon: RiBookOpenFill },
];

const fields = [
  'Computer Science',
  'Medicine',
  'Law',
  'Engineering',
  'Business',
  'Education',
  'Sciences',
  'Arts & Humanities',
  'Economics',
  'Accounting',
  'Nursing',
  'Pharmacy',
  'Architecture',
  'Mass Communication',
  'Psychology',
  'Mathematics',
];

const notificationOptions = [
  { id: 'yes', label: 'Yes, remind me', detail: 'Daily study nudges', Icon: RiNotificationFill },
  { id: 'custom', label: 'Custom schedule', detail: 'I will set my own times', Icon: RiCalendarCheckFill },
  { id: 'off', label: 'Not right now', detail: 'Keep things quiet for now', Icon: RiHeartFill },
];

function useOnboardingDraft(userId) {
  const storageKey = userId ? `luter:onboarding:v4:${userId}` : 'luter:onboarding:v4:guest';
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        setStep(saved.step || 1);
        setHistory(saved.history || []);
        setDraft({
          ...initialDraft,
          ...(saved.draft || {}),
          academicProfile: {
            ...initialDraft.academicProfile,
            ...(saved.draft?.academicProfile || {}),
          },
          academicCourses: saved.draft?.academicCourses || [],
          selectedAcademicCourseCodes: saved.draft?.selectedAcademicCourseCodes || [],
        });
      }
    } catch {
      /* Ignore broken local draft and start fresh. */
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify({ step, history, draft }));
  }, [draft, history, hydrated, step, storageKey]);

  const clearDraft = () => {
    localStorage.removeItem(storageKey);
  };

  return { step, setStep, history, setHistory, draft, setDraft, hydrated, clearDraft };
}

function getNextStep(currentStep) {
  return Math.min(currentStep + 1, TOTAL_STEPS);
}

function splitName(name) {
  return (name || '').trim().split(/\s+/)[0] || '';
}

function cleanLevel(level) {
  const match = String(level || '').match(/\d{3}/);
  if (match) return match[0];
  if (/postgraduate/i.test(level || '')) return '500';
  return '';
}

function hasAcademicProfile(profile) {
  return Boolean(profile?.country && profile?.institution && profile?.programme && profile?.level && profile?.semester);
}

function normaliseCourseList(courses) {
  const seen = new Set();
  return (courses || []).reduce((acc, course) => {
    const code = normalizeCourseCode(course.code || course.course_code || '');
    if (!code || code === 'COURSE' || seen.has(code)) return acc;
    seen.add(code);
    acc.push({
      code,
      name: course.name || course.title || course.course_title || 'Course',
      source: course.source || 'curriculum',
    });
    return acc;
  }, []);
}

async function loadAcademicCoursePreview(profile) {
  if (!profile?.programme || !profile?.level || !profile?.semester) return [];

  const cleanAcademicLevel = cleanLevel(profile.level) || profile.level;
  const semester = normalizeSemesterParam(profile.semester);

  if (profile.institution) {
    const { row } = await fetchCurriculumOffer(
      supabase,
      profile.institution,
      profile.programme,
      String(cleanAcademicLevel),
      semester
    );
    const officialCourses = normaliseCourseList(coursesFromJsonb(row?.courses));
    if (officialCourses.length) {
      return officialCourses.map((course) => ({ ...course, source: row?.source || 'official' }));
    }
  }

  return normaliseCourseList(getSubjects(profile.programme, cleanAcademicLevel, semester))
    .map((course) => ({ ...course, source: 'suggested' }));
}

async function loadProgrammesForUniversity(institution) {
  const uniSlug = universitySlugFromName(institution);
  if (!uniSlug) return fields;

  const { data, error } = await supabase
    .from('curriculum_offers')
    .select('department_label, department_slug')
    .eq('university_slug', uniSlug)
    .eq('status', 'live')
    .limit(80);

  if (error || !Array.isArray(data)) return fields;

  const seen = new Set();
  const programmes = data
    .map((row) => row.department_label || row.department_slug)
    .filter(Boolean)
    .filter((programme) => {
      const key = programme.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return programmes.length ? programmes : fields;
}

function OptionCard({ selected, Icon, label, detail, onClick, compact = false }) {
  return (
    <MotionButton
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`onb-option ${selected ? 'is-selected' : ''} ${compact ? 'is-compact' : ''}`}
    >
      <span className="onb-option-icon">
        {React.createElement(Icon)}
      </span>
      <span className="onb-option-copy">
        <strong>{label}</strong>
        {detail && <small>{detail}</small>}
      </span>
      {selected && <RiCheckboxCircleFill className="onb-option-check" />}
    </MotionButton>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('pdf');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadText, setUploadText] = useState('');
  const [uploadLink, setUploadLink] = useState('');
  const [toast, setToast] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data?.user || null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const { step, setStep, history, setHistory, draft, setDraft, hydrated, clearDraft } = useOnboardingDraft(user?.id);
  const name = splitName(draft.firstName) || 'there';
  const progressStep = Math.min(step, TOTAL_STEPS);

  const updateDraft = useCallback((patch) => {
    setDraft((prev) => ({
      ...prev,
      ...patch,
      academicProfile: patch.academicProfile
        ? { ...prev.academicProfile, ...patch.academicProfile }
        : prev.academicProfile,
    }));
  }, [setDraft]);

  const updateAcademicCourses = useCallback((academicCourses, selectedAcademicCourseCodes) => {
    updateDraft({ academicCourses, selectedAcademicCourseCodes });
  }, [updateDraft]);

  const getCurrentUser = async () => {
    if (user?.id) return user;

    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      setUser(userData.user);
      return userData.user;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      setUser(sessionData.session.user);
      return sessionData.session.user;
    }

    return null;
  };

  useEffect(() => {
    if (!user?.user_metadata || draft.firstName) return;
    const metaName = user.user_metadata.full_name || user.user_metadata.name || '';
    const first = splitName(metaName);
    if (first) updateDraft({ firstName: first });
  }, [draft.firstName, updateDraft, user?.user_metadata]);

  const goTo = (nextStep) => {
    setError('');
    setHistory((prev) => [...prev, step]);
    setStep(nextStep);
  };

  const next = () => goTo(getNextStep(step, draft));

  const back = () => {
    setError('');
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((prev) => prev.slice(0, -1));
    setStep(previous);
  };

  const canContinue = useMemo(() => {
    if (step === 1) return splitName(draft.firstName).length >= 2;
    if (step === 2) return Number(draft.age) >= 8;
    if (step === 3) return String(draft.username || '').trim().length >= 3;
    if (step === 4) return Boolean(draft.grade);
    if (step === 5) return Boolean(draft.academicProfile.institution);
    if (step === 6) {
      return draft.academicProfile.programme.trim().length >= 2
        && Boolean(draft.academicProfile.level)
        && Boolean(draft.academicProfile.semester);
    }
    if (step === 7) return true;
    if (step === 8) return Boolean(draft.dailyGoal);
    return true;
  }, [draft, step]);

  const handleContinue = () => {
    if (!canContinue) {
      setError('Tiny pause. This one needs an answer before we move on.');
      return;
    }
    next();
  };

  const createTextMaterial = async (userId) => {
    const title = `Onboarding notes - ${new Date().toLocaleDateString()}`;
    const { data, error: textError } = await supabase
      .from('materials')
      .insert({
        user_id: userId,
        course_id: null,
        title,
        type: 'text',
        extracted_text: uploadText.trim(),
        owner_role: 'user',
        processing_status: 'ready',
        metadata: { source: 'onboarding_paste' },
      })
      .select()
      .single();
    if (textError) throw textError;
    return data;
  };

  const handleMaterialUpload = async () => {
    const activeUser = await getCurrentUser();

    if (!activeUser?.id) {
      setError('Please sign in again so I can attach this material to your account.');
      return;
    }

    const needsFile = ['pdf', 'pptx', 'image'].includes(uploadMode);
    if (needsFile && !uploadFile) {
      setError('Choose a file first, then I can start working on it.');
      return;
    }
    if (uploadMode === 'text' && uploadText.trim().length < 10) {
        setError('Paste a little more text so Lumi has something useful to study.');
      return;
    }
    if (uploadMode === 'youtube' && !uploadLink.trim()) {
      setError('Paste the YouTube link first.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      let material;
      if (uploadMode === 'youtube') {
        material = await addYoutubeMaterial({
          url: uploadLink.trim(),
          userId: activeUser.id,
          title: `Onboarding video - ${new Date().toLocaleDateString()}`,
        });
      } else if (uploadMode === 'text') {
        material = await createTextMaterial(activeUser.id);
      } else {
        const ext = uploadFile.name.split('.').pop().toLowerCase();
        const type = uploadMode === 'image' ? 'image' : ['ppt', 'pptx'].includes(ext) ? 'pptx' : 'pdf';
        material = await uploadMaterial({
          file: uploadFile,
          userId: activeUser.id,
          courseId: null,
          title: uploadFile.name,
          type,
        });
      }

      const materialPatch = {
        firstMaterialId: material?.id || '',
        firstMaterialTitle: material?.title || uploadFile?.name || 'Your first material',
      };
      const nextDraft = { ...draft, ...materialPatch };
      updateDraft(materialPatch);
      setToast('Nice. Lumi is preparing that material in the background.');
      // Upload is the last step — trigger finish
      await finish(nextDraft);
    } catch (uploadError) {
      console.error('Onboarding material upload failed:', uploadError);
      setError(uploadError.message || 'Upload failed. Try again in a moment.');
    } finally {
      setUploading(false);
    }
  };

  const saveAcademicCourses = async (userId, academicProfile, selectedCourses = []) => {
    if (!hasAcademicProfile(academicProfile)) return false;

    const level = cleanLevel(academicProfile.level);
    const normalizedSemester = normalizeSemesterParam(academicProfile.semester);
    const uniSlug = universitySlugFromName(academicProfile.institution);
    const deptSlug = departmentSlugFromLabel(academicProfile.programme);

    let courses = normaliseCourseList(selectedCourses);
    if (!courses.length) {
      courses = await loadAcademicCoursePreview(academicProfile);
    }
    if (!courses.length) return true;

    await Promise.all(
      courses.slice(0, 18).map(async (course) => {
        const code = normalizeCourseCode(course.code);
        let courseId;
        const { data: existing } = await supabase
          .from('courses')
          .select('id')
          .eq('code', code)
          .eq('university_slug', uniSlug)
          .maybeSingle();

        if (existing?.id) {
          courseId = existing.id;
        } else {
          const { data: created, error: createError } = await supabase
            .from('courses')
            .insert({
              code,
              name: course.name || code,
              faculty: academicProfile.programme,
              university_slug: uniSlug,
              department_slug: deptSlug,
              education_level: level,
              semester: normalizedSemester,
            })
            .select('id')
            .single();
          if (!createError) courseId = created?.id;
        }

        if (courseId) {
          await supabase
            .from('user_courses')
            .upsert({
              user_id: userId,
              course_id: courseId,
              semester: normalizedSemester,
              enrollment_source: 'onboarding',
            }, { onConflict: 'user_id,course_id' });
        }
      })
    );

    return true;
  };

  const saveCreditGrant = async (userId, activeDraft = draft) => {
    const payload = {
      user_id: userId,
      ai_credits_monthly: FREE_CREDITS,
      ai_credits_used: 0,
      total_xp: 0,
      streak_days: 0,
      reminder_time: `${activeDraft.reminderTime || '20:00'}:00`,
      reminders_enabled: activeDraft.notifications === 'yes' || activeDraft.notifications === 'custom',
      last_streak_update: null,
    };

    const { error: statError } = await supabase
      .from('user_stats')
      .upsert(payload, { onConflict: 'user_id' });

    if (!statError) return;

    await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        reminder_time: payload.reminder_time,
        reminders_enabled: payload.reminders_enabled,
        last_streak_update: null,
      }, { onConflict: 'user_id' });
  };

  const finish = async (draftOverride = draft) => {
    const activeUser = await getCurrentUser();

    if (!activeUser?.id) {
      setError('Your session is missing. Please sign in again and I will bring you back here.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const activeDraft = draftOverride;
      const academicReady = hasAcademicProfile(activeDraft.academicProfile);
      const profilePayload = {
        id: activeUser.id,
        full_name: `${activeDraft.firstName} ${activeDraft.lastName || ''}`.trim() || activeDraft.firstName,
        username: activeDraft.username || null,
        age: activeDraft.age ? parseInt(activeDraft.age, 10) : null,
        role: 'student',
        is_university_user: true,
        onboarding_complete: true,
        country: activeDraft.academicProfile.country || 'Nigeria',
        university: academicReady ? activeDraft.academicProfile.institution : null,
        faculty: academicReady ? activeDraft.academicProfile.programme : (activeDraft.fieldOfStudy || null),
        level: academicReady
          ? cleanLevel(activeDraft.academicProfile.level) || activeDraft.academicProfile.level
          : (activeDraft.level || null),
        semester: academicReady ? normalizeSemesterParam(activeDraft.academicProfile.semester) : null,
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });
      if (profileError) throw profileError;

      await saveCreditGrant(activeUser.id, activeDraft);
      let academicCoursesLoaded = false;
      try {
        const selectedCodes = new Set(activeDraft.selectedAcademicCourseCodes || []);
        const selectedCourses = selectedCodes.size
          ? (activeDraft.academicCourses || []).filter((course) => selectedCodes.has(course.code))
          : activeDraft.academicCourses;
        academicCoursesLoaded = await saveAcademicCourses(activeUser.id, activeDraft.academicProfile, selectedCourses);
      } catch (courseError) {
        console.warn('Academic course setup skipped:', courseError);
      }

      clearLuterCaches();
      clearDraft();
      setDone(true);
      setToast(academicCoursesLoaded ? 'Academic profile saved. Your course list will be ready on dashboard.' : '');
    } catch (finishError) {
      console.error('Onboarding finish error:', finishError);
      setError(finishError.message || 'Could not finish onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startStudying = () => {
    if (draft.firstMaterialId) {
      navigate(`/dashboard/workstation?materialId=${draft.firstMaterialId}`);
      return;
    }
    if (hasAcademicProfile(draft.academicProfile)) {
      navigate('/dashboard/courses');
      return;
    }
    navigate('/dashboard');
  };

  const handleNotificationChoice = async (choice) => {
    updateDraft({ notifications: choice });
    if (choice === 'yes' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        await Notification.requestPermission();
      } catch {
        /* Browser may block permission requests outside a direct gesture. */
      }
    }
  };

  if (!hydrated) {
    return (
      <div className="onb-page onb-loading">
        <RiLoader4Line className="spin" />
      </div>
    );
  }

  return (
    <div className="onb-page">
      <style>{onboardingCss}</style>
      <img src="/Header logo.png" alt="Luter" className="onb-brand-logo" />

      <main className="onb-shell">
        <section className="onb-card">
          <ProgressHeader step={progressStep} onBack={back} hideBack={step === 1 || done} />

          <AnimatePresence mode="wait">
            {done ? (
              <CompletionScreen
                key="done"
                draft={draft}
                name={name}
                saving={saving}
                onStart={startStudying}
              />
            ) : (
              <MotionDiv
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="onb-step"
              >
                {/* Step 1 – Personal Info */}
                {step === 1 && (
                  <StepSingleInput
                    title="What's your first name?"
                    subtitle="I can use your Google name if it is already available."
                    value={draft.firstName}
                    placeholder="Enter your first name"
                    onChange={(firstName) => updateDraft({ firstName })}
                    onNext={handleContinue}
                    autoFocus
                  />
                )}

                {/* Step 2 – University */}
                {step === 2 && (
                  <StepSingleInput
                    title="How old are you?"
                    subtitle="This helps Lumi keep your study setup age-appropriate."
                    value={draft.age}
                    placeholder="Enter your age"
                    inputMode="numeric"
                    type="number"
                    onChange={(age) => updateDraft({ age })}
                    onNext={handleContinue}
                    autoFocus
                  />
                )}

                {step === 3 && (
                  <StepUsername
                    username={draft.username}
                    onChange={(username) => updateDraft({ username })}
                    onNext={handleContinue}
                  />
                )}

                {step === 4 && (
                  <StepGrade
                    value={draft.grade}
                    onSelect={(grade) => updateDraft({ grade })}
                    onNext={handleContinue}
                  />
                )}

                {step === 5 && (
                  <StepUniversity
                    profile={draft.academicProfile}
                    onSelect={(school) => updateDraft({
                      academicProfile: {
                        ...draft.academicProfile,
                        institution: school.name,
                        country: school.country || draft.academicProfile.country || 'Nigeria',
                      },
                      academicCourses: [],
                      selectedAcademicCourseCodes: [],
                    })}
                    onNext={handleContinue}
                  />
                )}

                {/* Step 3 – Academic Profile */}
                {step === 6 && (
                  <StepAcademicProfile
                    profile={draft.academicProfile}
                    onChange={(academicProfile) => updateDraft({ academicProfile })}
                    onNext={handleContinue}
                  />
                )}

                {/* Step 4 – Notifications */}
                {step === 7 && (
                  <StepCourses
                    profile={draft.academicProfile}
                    courses={draft.academicCourses}
                    selectedCodes={draft.selectedAcademicCourseCodes}
                    onCoursesChange={updateAcademicCourses}
                    onNext={handleContinue}
                  />
                )}

                {step === 8 && (
                  <StepDailyGoal
                    name={name}
                    value={draft.dailyGoal}
                    time={draft.reminderTime}
                    onSelect={(dailyGoal) => updateDraft({
                      dailyGoal,
                      notifications: 'custom',
                    })}
                    onTime={(reminderTime) => updateDraft({ reminderTime })}
                    onNext={handleContinue}
                  />
                )}

                {/* Step 5 – Upload (LAST) */}
                {step === 9 && (
                  <StepUpload
                    uploadMode={uploadMode}
                    setUploadMode={setUploadMode}
                    uploadFile={uploadFile}
                    setUploadFile={setUploadFile}
                    uploadText={uploadText}
                    setUploadText={setUploadText}
                    uploadLink={uploadLink}
                    setUploadLink={setUploadLink}
                    fileInputRef={fileInputRef}
                    uploading={uploading}
                    onUpload={handleMaterialUpload}
                    onSkip={() => finish()}
                  />
                )}
              </MotionDiv>
            )}
          </AnimatePresence>

          {error && <p className="onb-error">{error}</p>}
        </section>
      </main>

      <AnimatePresence>
        {toast && (
          <MotionDiv
            className="onb-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onAnimationComplete={() => window.setTimeout(() => setToast(''), 2200)}
          >
            <RiCheckboxCircleFill /> {toast}
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressHeader({ step, onBack, hideBack }) {
  return (
    <div className="onb-progress-row">
      <button type="button" className="onb-back" onClick={onBack} disabled={hideBack} aria-label="Go back">
        <RiArrowLeftLine />
      </button>
      <div className="onb-progress">
        <motion.span animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>
      <span className="onb-step-count">Step {step} of {TOTAL_STEPS}</span>
    </div>
  );
}

function StepFrame({ kicker = `${MASCOT_NAME} is listening`, title, subtitle, children, footer, onSkip }) {
  return (
    <>
      <div className="onb-copy">
        <span className="onb-kicker">
          <img src="/mascot.png" alt="" />
          <span>{kicker}</span>
        </span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="onb-content">{children}</div>
      {footer && (
        <div className="onb-footer">
          {footer}
          {onSkip && (
            <button type="button" className="onb-skip-btn" onClick={onSkip}>
              Skip for now
            </button>
          )}
        </div>
      )}
    </>
  );
}


function StepSingleInput({
  title,
  subtitle,
  value,
  placeholder,
  onChange,
  onNext,
  onSkip,
  type = 'text',
  inputMode,
  autoFocus = false,
}) {
  const ready = String(value || '').trim().length > 0;
  return (
    <StepFrame
      title={title}
      subtitle={subtitle}
      onSkip={onSkip}
      footer={<PremiumButton size="lg" disabled={!ready} onClick={onNext} style={{ width: '100%' }} className="premium-button-dark">Continue</PremiumButton>}
    >
      <div className="onb-question-field">
        <input
          autoFocus={autoFocus}
          type={type}
          inputMode={inputMode}
          className="onb-input onb-big-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter' && ready) onNext(); }}
        />
      </div>
    </StepFrame>
  );
}

function StepUsername({ username, onChange, onNext, onSkip }) {
  const ready = String(username || '').trim().length >= 3;
  return (
    <StepFrame
      title="Set up a username"
      subtitle="This is how classmates can recognise you in Luter."
      onSkip={onSkip}
      footer={<PremiumButton size="lg" disabled={!ready} onClick={onNext} style={{ width: '100%' }} className="premium-button-dark">Continue</PremiumButton>}
    >
      <div className="onb-question-field">
        <div className="onb-username-wrap onb-big-username">
          <span className="onb-at">@</span>
          <input
            autoFocus
            className="onb-input onb-big-input"
            value={username}
            onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="micheal"
            onKeyDown={(e) => { if (e.key === 'Enter' && ready) onNext(); }}
          />
        </div>
      </div>
    </StepFrame>
  );
}

function StepGrade({ value, onSelect, onNext, onSkip }) {
  return (
    <StepFrame
      title="What grade are you in?"
      subtitle="Pick the closest one. You can change this later."
      onSkip={onSkip}
      footer={<PremiumButton size="lg" disabled={!value} onClick={onNext} style={{ width: '100%' }} className="premium-button-dark">Continue</PremiumButton>}
    >
      <div className="onb-choice-list">
        {gradeOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? 'is-selected' : ''}
            onClick={() => onSelect(option)}
          >
            <span>{option}</span>
            {value === option && <RiCheckboxCircleFill />}
          </button>
        ))}
      </div>
    </StepFrame>
  );
}

function StepUniversity({ profile, onSelect, onNext, onSkip }) {
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Finding schools near you...');

  useEffect(() => {
    let mounted = true;
    getBrowserPosition()
      .then(async (position) => {
        if (!mounted) return;
        setCoords(position);
        const list = await searchSchools(position);
        if (!mounted) return;
        setSchools(list);
        setStatus(list.length ? 'Nearest schools first' : 'Search for your school');
      })
      .catch(() => {
        if (!mounted) return;
        setStatus('Location is optional. Search and pick your school.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const term = query.trim();
    if (!term) return undefined;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const list = await searchSchools({ ...coords, query: term });
        if (!mounted) return;
        setSchools(list);
        setStatus(list.length ? 'Pick the closest match' : 'No school found yet. Try another spelling.');
      } catch {
        if (mounted) setStatus('Search is having a moment. Try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }, 320);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [coords, query]);

  const fallbackSchools = [
    { id: 'landmark', name: 'Landmark University', address: 'Omu-Aran, Kwara', distanceKm: null },
    { id: 'lasu', name: 'Lagos State University', address: 'Ojo, Lagos', distanceKm: null },
    { id: 'unilag', name: 'University of Lagos', address: 'Akoka, Lagos', distanceKm: null },
  ];
  const visibleSchools = schools.length ? schools : fallbackSchools;

  return (
    <StepFrame
      title="What university do you go to?"
      subtitle={status}
      onSkip={onSkip}
      footer={<PremiumButton size="lg" onClick={onNext} style={{ width: '100%' }} className="premium-button-dark">Continue</PremiumButton>}
    >
      <div className="onb-search-wrap onb-school-search">
        <RiSearchLine />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for your university"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && profile.institution) onNext();
          }}
        />
        {loading && <RiLoader4Line className="spin" />}
      </div>

      <div className="onb-school-list">
        {visibleSchools.map((school) => {
          const selected = profile.institution === school.name;
          return (
            <button
              key={school.id || school.name}
              type="button"
              className={selected ? 'is-selected' : ''}
              onClick={() => onSelect(school)}
            >
              <span className="onb-school-icon"><RiGraduationCapFill /></span>
              <span>
                <strong>{school.name}</strong>
                <small>{school.address || school.placeName || 'School match'}</small>
                {school.distanceKm != null && <em><RiMapPin2Fill /> {school.distanceKm} km away</em>}
              </span>
              {selected && <RiCheckboxCircleFill />}
            </button>
          );
        })}
      </div>
    </StepFrame>
  );
}

function StepAcademicProfile({ profile, onChange, onNext, onSkip }) {
  const ready = Boolean(profile.programme && profile.level && profile.semester);
  const [query, setQuery] = useState(profile.programme || '');
  const [showProgrammeSearch, setShowProgrammeSearch] = useState(!profile.programme);
  const [programmes, setProgrammes] = useState(fields);

  const levels = universityLevels;
  const filteredProgrammes = programmes
    .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    let mounted = true;
    loadProgrammesForUniversity(profile.institution)
      .then((list) => {
        if (mounted) setProgrammes(list);
      })
      .catch(() => {
        if (mounted) setProgrammes(fields);
      });
    return () => {
      mounted = false;
    };
  }, [profile.institution]);

  const update = (key, value) => {
    onChange({ ...profile, [key]: value });
  };

  return (
    <StepFrame
      title="Tell us more about yourself"
      subtitle="We use this to pull the exact curriculum and courses for you."
      onSkip={onSkip}
      footer={(
        <>
          <PremiumButton size="lg" disabled={!ready} onClick={onNext} style={{ width: '100%' }} className="premium-button-dark">
            Continue
          </PremiumButton>
        </>
      )}
    >
      <div className="onb-academic-form">
        
        <div className="onb-form-group">
          <label>What degree are you studying?</label>
          {!showProgrammeSearch ? (
            <div className="onb-selected-badge" onClick={() => setShowProgrammeSearch(true)}>
              <span><RiBookOpenFill /> {profile.programme}</span>
              <RiPencilFill />
            </div>
          ) : (
            <>
              <div className="onb-search-wrap">
                <RiSearchLine />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Computer Science, Medicine..."
                />
              </div>
              <div className="onb-programme-list-mini">
                {(filteredProgrammes.length ? filteredProgrammes : programmes.slice(0, 4)).map((prog) => (
                  <button key={prog} type="button" onClick={() => { update('programme', prog); setShowProgrammeSearch(false); setQuery(prog); }}>
                    {prog}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="onb-form-group">
          <label>What grade/level are you in?</label>
          <select className="onb-select" value={profile.level} onChange={(e) => update('level', e.target.value)}>
            <option value="" disabled>Select your level...</option>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="onb-form-group">
          <label>And which semester?</label>
          <div className="onb-semester-row">
            {['1st', '2nd', '3rd'].map((sem) => (
              <button
                key={sem}
                type="button"
                className={profile.semester === sem ? 'is-selected' : ''}
                onClick={() => update('semester', sem)}
              >
                {sem}
              </button>
            ))}
          </div>
        </div>

      </div>
    </StepFrame>
  );
}

function StepCourses({ profile, courses, selectedCodes, onCoursesChange, onNext, onSkip }) {
  const [query, setQuery] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(false);
  const selectedCourseSet = useMemo(() => new Set(selectedCodes || []), [selectedCodes]);
  const visibleCourses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return courses || [];
    return (courses || []).filter((course) => (
      course.code.toLowerCase().includes(term)
      || course.name.toLowerCase().includes(term)
    ));
  }, [courses, query]);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(async () => {
      if (!mounted) return;
      setLoadingCourses(true);
      try {
        const list = await loadAcademicCoursePreview(profile);
        if (!mounted) return;
        const normalized = normaliseCourseList(list);
        onCoursesChange(normalized, normalized.map((course) => course.code));
      } catch {
        if (mounted) onCoursesChange([], []);
      } finally {
        if (mounted) setLoadingCourses(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [onCoursesChange, profile]);

  const toggleCourse = (code) => {
    const next = selectedCourseSet.has(code)
      ? (selectedCodes || []).filter((item) => item !== code)
      : [...(selectedCodes || []), code];
    onCoursesChange(courses || [], next);
  };

  const addCourse = () => {
    const term = query.trim();
    if (!term) return;
    const code = normalizeCourseCode(term.split(' ')[0]);
    const exists = (courses || []).some((course) => course.code === code);
    if (exists) return;
    const newCourse = {
      code,
      name: term,
      source: 'manual',
    };
    onCoursesChange([...(courses || []), newCourse], [...(selectedCodes || []), code]);
    setQuery('');
  };

  return (
    <StepFrame
      title="Are these your courses?"
      subtitle="Add, remove, or search before Lumi builds your workspace."
      footer={<PremiumButton size="lg" onClick={onNext} style={{ width: '100%' }} className="premium-button-dark">Continue</PremiumButton>}
    >
      <div className="onb-search-wrap">
        <RiSearchLine />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or add a course code"
          onKeyDown={(e) => { if (e.key === 'Enter') addCourse(); }}
        />
      </div>
      <div className="onb-course-preview">
        <div className="onb-course-preview-head">
          <span><RiBookOpenFill /> {selectedCourseSet.size || 0} selected</span>
          {loadingCourses && <RiLoader4Line className="spin" />}
        </div>
        {visibleCourses.length ? (
          <div className="onb-course-list">
            {visibleCourses.map((course) => (
              <button
                key={course.code}
                type="button"
                className={selectedCourseSet.has(course.code) ? 'is-selected' : ''}
                onClick={() => toggleCourse(course.code)}
              >
                <span>
                  <strong>{course.code}</strong>
                  <small>{course.name}</small>
                </span>
                {selectedCourseSet.has(course.code) && <RiCheckboxCircleFill />}
              </button>
            ))}
          </div>
        ) : (
          <p className="onb-muted">
            {loadingCourses ? 'Lumi is checking your course list...' : 'No course found. Press Enter to add your search as a course.'}
          </p>
        )}
      </div>
    </StepFrame>
  );
}

function StepDailyGoal({ name, value, time, onSelect, onTime, onNext }) {
  return (
    <StepFrame
      title={`What's your daily learning goal, ${name}?`}
      subtitle="Pick a rhythm Lumi can help you keep."
      footer={<PremiumButton size="lg" onClick={onNext} disabled={!value} style={{ width: '100%' }} className="premium-button-dark">Continue</PremiumButton>}
    >
      <div className="onb-options">
        {dailyGoalOptions.map((option) => (
          <OptionCard key={option.id} {...option} selected={value === option.id} onClick={() => onSelect(option.id)} />
        ))}
      </div>
      {value && (
        <label className="onb-time">
          Preferred reminder time
          <input type="time" value={time} onChange={(event) => onTime(event.target.value)} />
        </label>
      )}
    </StepFrame>
  );
}

function CompletionScreen({ draft, name, onStart }) {
  return (
    <MotionDiv
      className="onb-step"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <StepFrame
        kicker="You're in!"
        title={`Welcome to Luter, ${name}!`}
        subtitle="Your personalised study space is all set and ready."
        footer={<PremiumButton size="lg" onClick={onStart} style={{ width: '100%' }} className="premium-button-dark">Start studying -&gt;</PremiumButton>}
      >
        <div className="onb-summary-card">
          {draft.academicProfile?.institution && (
            <div>
              <span>University</span>
              <strong>{draft.academicProfile.institution}</strong>
            </div>
          )}
          {(draft.fieldOfStudy || draft.academicProfile?.programme) && (
            <div>
              <span>Programme</span>
              <strong>{draft.fieldOfStudy || draft.academicProfile.programme}</strong>
            </div>
          )}
          <div>
            <span>Academic profile</span>
            <strong>{hasAcademicProfile(draft.academicProfile) ? 'Set up' : 'Basic'}</strong>
          </div>
          <div>
            <span>First material</span>
            <strong>{draft.firstMaterialTitle || 'Not uploaded yet'}</strong>
          </div>
        </div>
      </StepFrame>
    </MotionDiv>
  );
}


function TeamQuotes() {
  const team = [
    {
      name: 'Micheal Oluwayanmi',
      role: 'Co-Founder / CEO',
      quote: "When we built LUTER, we didn't just want to create another educational tool; we wanted to spark a movement. True learning happens when students connect, collaborate, and lift each other up. To every student on our platform: you are the driver of your own future, and LUTER is here to give you the keys. Let’s redefine what’s possible in education, together.",
    },
    {
      name: 'Matthew David',
      role: 'Co-Founder / COO',
      quote: "An idea is only as powerful as the impact it creates. At LUTER, our goal is to build a seamless, efficient ecosystem where knowledge flows effortlessly from student to student. We are working around the clock to ensure you have the best environment to grow, collaborate, and succeed. Your potential is limitless—let's unlock it.",
    },
    {
      name: 'Okosun Emmanuel',
      role: 'Co-Founder / CFO',
      quote: "Investing in knowledge always pays the best interest. With LUTER, we are making quality, peer-to-peer education accessible to everyone, ensuring that every student has the resources they need to thrive. We believe that your future is the most valuable asset you have—let's build it together, one breakthrough at a time.",
    },
    {
      name: 'David Momoh',
      role: 'Co-Founder / CMO',
      quote: "Education is a story of connection, and LUTER is where your voice matters. We didn't just build a platform; we built a community where students empower students. Every time you share what you know, you're lighting the path for someone else. Your story, your knowledge, and your success are what drive us forward. Let's make learning loud!",
    },
    {
      name: 'Popoola David',
      role: 'Co-Founder / CTO',
      quote: "Technology is at its best when it brings people closer together. With LUTER, we’ve built the digital infrastructure to bridge the gap between curiosity and knowledge, creating a space where students can seamlessly teach and learn from one another. Behind every line of code is our commitment to your future. Keep exploring, keep building, and keep learning.",
    },
  ];

  return (
    <div className="onb-team">
      {team.map((m) => (
        <div key={m.name} className="onb-team-card">
          <div className="onb-team-card-head">
            <div className="onb-team-name">{m.name}</div>
            <div className="onb-team-role">{m.role}</div>
          </div>
          <p className="onb-team-quote">“{m.quote}”</p>
        </div>
      ))}
    </div>
  );
}


const onboardingCss = `
  .onb-page {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    background:
      radial-gradient(circle at 10% 14%, rgba(196, 181, 253, 0.22), transparent 28%),
      radial-gradient(circle at 90% 82%, rgba(152, 255, 152, 0.18), transparent 30%),
      radial-gradient(circle at 18% 88%, rgba(255, 210, 166, 0.24), transparent 26%),
      #F9FAFB;
    color: #333333;
    font-family: var(--font-varela, var(--font-outfit, "Nunito", system-ui, sans-serif));
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 44px 20px;
  }

  .onb-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.4;
    background-image: radial-gradient(rgba(196, 181, 253, 0.38) 1px, transparent 1px);
    background-size: 18px 18px;
  }

  .onb-brand-logo {
    position: fixed;
    top: 28px;
    left: 34px;
    width: 116px;
    height: auto;
    object-fit: contain;
    z-index: 12;
  }

  .onb-love-bg,
  .onb-glow,
  .onb-glow-one,
  .onb-glow-two,
  .onb-grid-bg,
  .onb-team-wrap,
  .onb-team,
  .onb-team-card,
  .onb-team-card-head,
  .onb-team-name,
  .onb-team-role,
  .onb-team-quote {
    display: none !important;
  }

  .onb-shell {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
  }

  .onb-card {
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(196, 181, 253, 0.38);
    border-radius: 24px;
    box-shadow: 0 18px 54px rgba(51, 51, 51, 0.08);
    padding: 34px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    backdrop-filter: blur(16px);
  }

  .onb-progress-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 6px;
  }

  .onb-back {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    background: rgba(249, 250, 251, 0.9);
    border: 1px solid rgba(196, 181, 253, 0.36);
    color: #333333;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .onb-back:hover:not(:disabled) {
    background: #F4EEFF;
    transform: translateY(-2px);
  }
  .onb-back:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .onb-progress {
    flex: 1;
    height: 6px;
    background: rgba(196, 181, 253, 0.22);
    border-radius: 999px;
    overflow: hidden;
  }
  .onb-progress span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #C4B5FD, #8B5CF6);
    border-radius: 999px;
  }

  .onb-step-count {
    font-size: 13px;
    color: rgba(51,51,51,0.5);
    font-weight: 600;
    white-space: nowrap;
  }

  .onb-step {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .onb-copy {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .onb-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    width: fit-content;
    color: #333333;
    font-size: 14px;
    font-weight: 800;
  }

  .onb-kicker img {
    width: 38px;
    height: 38px;
    object-fit: contain;
    border-radius: 12px;
    filter: drop-shadow(0 10px 18px rgba(139, 92, 246, 0.22));
  }

  .onb-copy h1 {
    font-family: var(--font-outfit, "Outfit", system-ui, sans-serif);
    font-size: clamp(28px, 4vw, 38px);
    font-weight: 900;
    line-height: 1.05;
    margin: 0;
    color: #333333;
  }

  .onb-copy p {
    font-size: 15px;
    color: rgba(51,51,51,0.65);
    line-height: 1.6;
    margin: 0;
  }

  .onb-content {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .onb-input,
  .onb-select {
    width: 100%;
    background: rgba(249, 250, 251, 0.92);
    border: 1px solid rgba(196, 181, 253, 0.38);
    color: #333333;
    font-size: 15px;
    padding: 13px 18px;
    border-radius: 16px;
    outline: none;
    transition: all 0.2s ease;
    box-sizing: border-box;
    font-family: inherit;
  }

  .onb-input:focus,
  .onb-select:focus {
    border-color: #C4B5FD;
    background: white;
    box-shadow: 0 10px 24px rgba(196,181,253,0.16);
  }

  .onb-input::placeholder {
    color: rgba(51,51,51,0.4);
  }

  .onb-input {
    text-align: center;
  }

  .onb-select option {
    background: white;
    color: #333333;
  }

  .onb-multi-input-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .onb-multi-input-grid label,
  .onb-form-group label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    color: rgba(51,51,51,0.7);
    font-weight: 600;
  }

  .onb-username-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .onb-at {
    position: absolute;
    left: 16px;
    color: rgba(51,51,51,0.4);
    font-weight: 700;
    pointer-events: none;
  }

  .onb-username-wrap .onb-input {
    padding-left: 40px;
  }

  .onb-form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .onb-form-group label {
    font-size: 14px;
    font-weight: 600;
    color: rgba(51,51,51,0.7);
  }

  .onb-selected-badge {
    background: rgba(249, 250, 251, 0.92);
    border: 1px solid rgba(196, 181, 253, 0.38);
    padding: 14px 16px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #333333;
    font-weight: 600;
  }

  .onb-selected-badge:hover {
    background: white;
    transform: translateY(-1px);
  }

  .onb-selected-badge span {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .onb-programme-list-mini {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .onb-programme-list-mini button {
    background: rgba(249, 250, 251, 0.92);
    border: 1px solid rgba(196, 181, 253, 0.36);
    color: #333333;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
  }

  .onb-programme-list-mini button:hover {
    background: white;
    border-color: rgba(51,51,51,0.12);
    transform: translateY(-1px);
  }

  .onb-academic-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .onb-footer {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .onb-footer .premium-button-dark {
    background: #C4B5FD !important;
    color: #2F2454 !important;
    border-radius: 16px !important;
    height: 50px !important;
    font-weight: 900 !important;
    border: 1px solid rgba(139, 92, 246, 0.35) !important;
    box-shadow: 0 12px 24px rgba(196, 181, 253, 0.26) !important;
  }

  .onb-skip {
    background: rgba(249, 250, 251, 0.9);
    border: 1px solid rgba(196, 181, 253, 0.36);
    color: #333333;
    font-weight: 700;
    cursor: pointer;
    padding: 14px;
    border-radius: 999px;
    transition: all 0.2s ease;
  }

  .onb-skip:hover {
    background: white;
    transform: translateY(-1px);
  }

  .onb-skip-btn {
    background: transparent;
    border: none;
    color: rgba(51, 51, 51, 0.5);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 12px;
    transition: all 0.2s ease;
    margin-top: 8px;
  }

  .onb-skip-btn:hover {
    color: rgba(51, 51, 51, 0.7);
    background: rgba(249, 250, 251, 0.5);
  }

  .onb-search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .onb-search-wrap svg {
    position: absolute;
    left: 16px;
    color: rgba(51,51,51,0.4);
    font-size: 18px;
  }

  .onb-search-wrap input {
    width: 100%;
    padding: 15px 16px 15px 44px;
    background: rgba(249, 250, 251, 0.92);
    border: 1px solid rgba(196, 181, 253, 0.44);
    border-radius: 18px;
    color: #333333;
    font-size: 16px;
    outline: none;
    transition: all 0.2s ease;
  }

  .onb-search-wrap input:focus {
    border-color: #C4B5FD;
    background: white;
    box-shadow: 0 12px 28px rgba(196,181,253,0.16);
  }

  .onb-school-search .spin {
    position: absolute;
    right: 14px;
    color: #8B5CF6;
    font-size: 16px;
  }

  .onb-school-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    max-height: 300px;
    overflow-y: auto;
  }

  .onb-school-list button {
    display: flex;
    align-items: center;
    gap: 14px;
    background: transparent;
    border: 0;
    border-bottom: 1px solid rgba(196, 181, 253, 0.28);
    padding: 15px 8px;
    border-radius: 0;
    color: #333333;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .onb-school-list button:hover {
    background: rgba(196, 181, 253, 0.08);
    border-color: rgba(196, 181, 253, 0.36);
    transform: translateY(-1px);
  }

  .onb-school-list button.is-selected {
    background: rgba(196, 181, 253, 0.18);
    border-color: rgba(139, 92, 246, 0.35);
    padding-inline: 14px;
    border-radius: 16px;
  }

  .onb-school-list button span:nth-child(2) {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .onb-school-list button strong {
    font-size: 15px;
    color: #333333;
    font-weight: 700;
  }

  .onb-school-list button small {
    color: rgba(51,51,51,0.55);
    font-size: 13px;
  }

  .onb-school-list button em {
    color: #8B5CF6;
    font-size: 12px;
    font-style: normal;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  }

  .onb-school-icon {
    width: 40px;
    height: 40px;
    background: white;
    border: 1px solid rgba(196, 181, 253, 0.35);
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 18px;
    color: #8B5CF6;
    flex-shrink: 0;
  }

  .onb-semester-row {
    display: flex;
    gap: 12px;
  }

  .onb-semester-row button {
    flex: 1;
    padding: 12px;
    background: rgba(249, 250, 251, 0.92);
    border: 1px solid rgba(196, 181, 253, 0.38);
    border-radius: 14px;
    color: #333333;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
  }

  .onb-semester-row button:hover {
    background: white;
    border-color: rgba(51,51,51,0.12);
    transform: translateY(-1px);
  }

  .onb-semester-row button.is-selected {
    background: #F4EEFF;
    border-color: #C4B5FD;
    color: #5B21B6;
  }

  .onb-course-preview {
    background: rgba(196, 181, 253, 0.14);
    border: 1px solid rgba(196, 181, 253, 0.45);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .onb-course-preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #333333;
    font-size: 14px;
    font-weight: 800;
  }

  .onb-course-preview-head span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .onb-course-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 260px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .onb-course-list button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    background: rgba(249, 250, 251, 0.9);
    border: 1px solid rgba(196, 181, 253, 0.42);
    border-radius: 14px;
    padding: 13px 14px;
    color: #333333;
    text-align: left;
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }

  .onb-course-list button:hover {
    transform: translateY(-1px);
    background: white;
    border-color: #C4B5FD;
  }

  .onb-course-list button.is-selected {
    background: rgba(196, 181, 253, 0.28);
    border-color: #8B5CF6;
  }

  .onb-course-list button span {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .onb-course-list strong {
    color: #5B21B6;
    font-size: 14px;
  }

  .onb-course-list small,
  .onb-muted {
    color: rgba(51, 51, 51, 0.64);
    font-size: 13px;
    line-height: 1.5;
  }

  .onb-course-list svg {
    color: #8B5CF6;
    flex-shrink: 0;
  }

  .onb-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .onb-opt-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: rgba(249, 250, 251, 0.92);
    border: 1px solid rgba(196, 181, 253, 0.36);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #333333;
  }

  .onb-opt-card:hover {
    background: white;
    border-color: rgba(51,51,51,0.12);
    transform: translateY(-1px);
  }

  .onb-opt-card.is-selected {
    background: rgba(196, 181, 253, 0.22);
    border-color: #C4B5FD;
  }

  .onb-opt-icon {
    width: 44px;
    height: 44px;
    background: #F4EEFF;
    border-radius: 12px;
    display: grid;
    place-items: center;
    color: #8B5CF6;
    font-size: 22px;
    flex-shrink: 0;
  }

  .onb-opt-card.is-selected .onb-opt-icon {
    background: #8B5CF6;
    color: white;
  }

  .onb-opt-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .onb-opt-text strong {
    font-size: 15px;
    font-weight: 700;
    color: #333333;
  }

  .onb-opt-text small {
    font-size: 13px;
    color: rgba(51,51,51,0.6);
  }

  .onb-upload-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .onb-upload-panel {
    background: rgba(249, 250, 251, 0.92);
    border: 1px solid rgba(196, 181, 253, 0.36);
    border-radius: 18px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .onb-file-drop {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: #F4EEFF;
    border: 2px dashed #8B5CF6;
    border-radius: 12px;
    padding: 28px 16px;
    color: #333333;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .onb-file-drop:hover {
    background: #F4EEFF;
  }

  .onb-file-drop svg {
    font-size: 32px;
    color: #8B5CF6;
  }

  .onb-upload-panel textarea {
    width: 100%;
    min-height: 120px;
    background: white;
    border: 1px solid rgba(51,51,51,0.06);
    border-radius: 10px;
    padding: 12px;
    color: #333333;
    resize: none;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .onb-upload-panel textarea:focus {
    border-color: #8B5CF6;
    box-shadow: 0 0 0 3px rgba(196,181,253,0.1);
  }

  .onb-link-input {
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    border: 1px solid rgba(51,51,51,0.06);
    border-radius: 10px;
    padding: 12px;
  }

  .onb-link-input input {
    flex: 1;
    background: none;
    border: none;
    color: #333333;
    outline: none;
  }

  .onb-summary-card {
    background: rgba(249, 250, 251, 0.92);
    border: 1px solid rgba(196, 181, 253, 0.36);
    border-radius: 18px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .onb-summary-card div {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: rgba(51,51,51,0.7);
  }

  .onb-summary-card strong {
    color: #333333;
    font-weight: 700;
  }

  .onb-error {
    background: #FEE2E2;
    color: #991B1B;
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 14px;
    margin: 0;
  }

  .onb-toast {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    background: #10B981;
    color: white;
    padding: 14px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    z-index: 1000;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }

  @media (max-width: 820px) {
    .onb-brand-logo {
      position: absolute;
      top: 18px;
      left: 20px;
      width: 96px;
    }
    .onb-card {
      padding: 28px 22px;
      border-radius: 20px;
    }
    .onb-multi-input-grid {
      grid-template-columns: 1fr;
    }
    .onb-upload-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .onb-page {
      padding: 76px 14px 18px;
      align-items: flex-start;
    }
    .onb-card {
      padding: 20px 16px;
      border-radius: 20px;
      box-shadow: 0 12px 30px rgba(51,51,51,0.08);
      gap: 18px;
    }
    .onb-progress-row {
      gap: 10px;
    }
    .onb-step-count {
      font-size: 12px;
    }
    .onb-back {
      width: 38px;
      height: 38px;
    }
    .onb-copy h1 {
      font-size: 27px;
    }
    .onb-copy p {
      font-size: 14px;
    }
    .onb-input,
    .onb-select {
      font-size: 15px;
      padding: 12px 16px;
    }
    .onb-multi-input-grid {
      gap: 12px;
    }
    .onb-footer {
      gap: 10px;
    }
    .onb-school-list,
    .onb-course-list {
      max-height: 240px;
    }
  }
`;




export default Onboarding;

