import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  RiUserFill as User,
  RiAtLine as At,
  RiCalendarFill as Calendar,
  RiGraduationCapFill as GraduationCap,
  RiBookOpenFill as BookOpen,
  RiFocusFill as Target,
  RiRocketFill as Rocket,
  RiCheckLine as Check,
  RiArrowRightLine as ArrowRight,
  RiArrowLeftLine as ArrowLeft,
  RiSearchLine as Search,
  RiBookFill as Book,
  RiTeamFill as Users,
  RiBriefcaseFill as Briefcase,
  RiGlobalFill as Globe,
  RiMagicFill as Sparkle,
  RiArrowRightSLine as ChevronRight,
  RiArrowDownSLine as ChevronDown,
  RiNotificationFill as Bell,
  RiCloseLine as X,
  RiRefreshLine as RefreshCw,
  RiAddLine as Plus,
  RiYoutubeFill as Youtube,
  RiFileTextFill as FileText,
  RiMusicFill as Music,
  RiUploadFill as Upload,
  RiMicFill as Mic,
  RiLink as LinkIcon,
  RiCheckboxCircleFill as CheckCircle,
  RiFireFill as Flame,
} from "react-icons/ri";
import { Clock } from "@phosphor-icons/react";
import LuterLogo from "./shared/LuterLogo";
import LanguageToggle from "./LanguageToggle";
import { PremiumButton } from "./PageShared";
const Ballpit = React.lazy(() => import("./ui/Ballpit"));
import { supabase } from "../supabaseClient";
import {
  universitySlugFromName,
  departmentSlugFromLabel,
  normalizeSemesterParam,
  normalizeCourseCode,
} from "../lib/curriculumSlugs";
import { fetchGroqLiveCourseSearch } from "../groqClient";
import {
  uploadMaterial,
  addYoutubeMaterial,
} from "../services/materialsService";
import { clearLuterCaches } from "../utils/cacheUtils";

// Step progress bar component
const ProgressBar = ({ step, totalSteps, onBack }) => (
  <div
    style={{
      width: "100%",
      marginBottom: "40px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
    }}
  >
    {step > 1 && (
      <motion.button
        whileHover={{ scale: 1.1, x: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        style={{
          background: "#F3F4F6",
          border: "none",
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#111",
        }}
      >
        <ArrowLeft size={18} weight="light" />
      </motion.button>
    )}
    <div
      style={{
        flex: 1,
        height: "8px",
        background: "#F3F4F6",
        borderRadius: "4px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(step / totalSteps) * 100}%` }}
        style={{
          height: "100%",
          background: "linear-gradient(90deg, #A78BFA 0%, #C4B5FD 100%)",
          borderRadius: "4px",
        }}
      />
    </div>
    <span
      style={{
        fontSize: "14px",
        fontWeight: 700,
        color: "#4B0082",
        fontFamily: "var(--font-outfit)",
        minWidth: "45px",
      }}
    >
      {step}/{totalSteps}
    </span>
  </div>
);

// Constants
const ROLES = [
  { id: "student", labelKey: "student", subKey: "studentSub", icon: "🎓" },
  { id: "others", labelKey: "others", subKey: "soloSub", icon: "🚀" },
];

const INTERESTS = [
  { id: "science", label: "Science", icon: "🧬", color: "#3B82F6" },
  { id: "tech", label: "Technology", icon: "💻", color: "#10B981" },
  { id: "arts", label: "Arts", icon: "🎨", color: "#F59E0B" },
  { id: "business", label: "Business", icon: "📈", color: "#6366F1" },
  { id: "humanities", label: "Humanities", icon: "📚", color: "#EC4899" },
  { id: "languages", label: "Languages", icon: "🌎", color: "#8B5CF6" },
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
  { name: "UAE", flag: "🇦🇪" },
].sort((a, b) => a.name.localeCompare(b.name));

const MAJORS = [
  "Computer Science",
  "Software Engineering",
  "Artificial Intelligence",
  "Medicine",
  "Pharmacy",
  "Nursing",
  "Law",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Economics",
  "Business Administration",
  "Accounting",
  "Political Science",
  "Psychology",
  "International Relations",
  "Architecture",
  "Mass Communication",
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
  "Philosophy",
  "History",
].sort();

// Comprehensive list of Nigerian Universities to supplement API
const NIGERIAN_UNIVERSITIES = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "University of Benin (UNIBEN)",
  "University of Nigeria (UNN)",
  "Ahmadu Bello University (ABU)",
  "University of Ilorin (UNILORIN)",
  "Federal University of Technology Akure (FUTA)",
  "Federal University of Technology Owerri (FUTO)",
  "Federal University of Technology Minna (FUTMINNA)",
  "University of Abuja",
  "University of Port Harcourt (UNIPORT)",
  "University of Jos (UNIJOS)",
  "Bayero University Kano (BUK)",
  "Lagos State University (LASU)",
  "Olabisi Onabanjo University (OOU)",
  "Ekiti State University (EKSU)",
  "Kwara State University (KWASU)",
  "Delta State University (DELSU)",
  "Tai Solarin University of Education (TASUED)",
  "Covenant University",
  "Babcock University",
  "Landmark University",
  "Bells University of Technology",
  "Bowen University",
  "Pan-Atlantic University",
  "Nile University of Nigeria",
  "Baze University",
  "Lead City University",
  "Redeemer's University",
  "Afe Babalola University (ABUAD)",
  "American University of Nigeria (AUN)",
  "Mountain Top University",
  "Anchor University",
  "Augustine University",
  "Chrisland University",
  "Christopher University",
  "Hallmark University",
  "Kings University",
  "McPherson University",
  "Southwestern University",
  "Summit University",
  "Wellspring University",
  "Wesley University",
  "Western Delta University",
].sort();

const GOALS_STUDENT = [
  { id: "grades", label: "Ace my exams & GPA", emoji: "🎯" },
  { id: "research", label: "Master research skills", emoji: "🔬" },
  { id: "career", label: "Prep for dream job", emoji: "💼" },
];

const GOALS_OTHERS = [
  { id: "productivity", label: "Boost daily focus", emoji: "⚡" },
  { id: "knowledge", label: "Learn new subjects", emoji: "🧠" },
  { id: "organization", label: "Structure my life", emoji: "📅" },
];

// Helper components
const SearchInputWithSuggestions = ({
  placeholder,
  value,
  onChange,
  icon: Icon,
  suggestions,
  isCountry = false,
}) => {
  const [show, setShow] = useState(false);
  const filtered = suggestions.filter((s) => {
    const name = typeof s === "string" ? s : s.name;
    return name.toLowerCase().includes(value.toLowerCase());
  });

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <Icon
        style={{
          position: "absolute",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 1,
        }}
        color="#111"
        weight="light"
        size={18}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              marginTop: "12px",
              boxShadow:
                "0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
              zIndex: 50,
              maxHeight: "250px",
              overflowY: "auto",
              padding: "8px",
            }}
          >
            {filtered.map((s) => {
              const name = typeof s === "string" ? s : s.name;
              const flag = typeof s === "string" ? null : s.flag;
              return (
                <motion.div
                  key={name}
                  whileHover={{ x: 4, background: "rgba(199, 185, 255, 0.2)" }}
                  onClick={() => {
                    onChange(name);
                    setShow(false);
                  }}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#111",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "background 0.2s ease",
                    fontFamily: "var(--font-varela)",
                  }}
                >
                  {flag && <span style={{ fontSize: "18px" }}>{flag}</span>}
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

const CustomDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(
    value ? new Date(value) : new Date(),
  );
  const [showYearPicker, setShowYearPicker] = useState(false);
  const containerRef = useRef(null);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDay = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const selectDate = (day) => {
    const selected = new Date(currentYear, currentMonth, day);
    onChange(selected.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  const formattedDate = value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowYearPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...inputStyle,
          paddingLeft: "48px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          color: value ? "#111" : "#9CA3AF",
          fontFamily: "var(--font-outfit)",
          background: isOpen ? "#FFF" : "#F9FAFB",
          borderColor: isOpen ? "#A855F7" : "#F3F4F6",
          boxShadow: isOpen ? "4px 4px 0px rgba(168, 85, 247, 0.1)" : "none",
          borderRadius: "0px",
          border: "2px solid #111",
        }}
      >
        <Calendar
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
          color={isOpen ? "#A855F7" : "#111"}
          weight="light"
          size={18}
        />
        {formattedDate || "Select your birthday"}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: 0 }}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "320px",
              background: "white",
              borderRadius: "0px",
              padding: "24px",
              boxShadow: "8px 8px 0px rgba(0,0,0,0.05)",
              zIndex: 100,
              border: "2px solid #111",
              fontFamily: "var(--font-outfit)",
            }}
          >
            {!showYearPicker ? (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    onClick={() => setShowYearPicker(true)}
                    style={{
                      fontWeight: 800,
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#111",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {months[currentMonth]} {currentYear}{" "}
                    <ChevronDown size={14} />
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button
                      onClick={handlePrevMonth}
                      style={{
                        background: "#F3F4F6",
                        border: "1px solid #111",
                        borderRadius: "0px",
                        width: "32px",
                        height: "32px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      style={{
                        background: "#F3F4F6",
                        border: "1px solid #111",
                        borderRadius: "0px",
                        width: "32px",
                        height: "32px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "0px",
                    textAlign: "center",
                  }}
                >
                  {days.map((d) => (
                    <div
                      key={d}
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#111",
                        marginBottom: "16px",
                        textTransform: "uppercase",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                  {calendarDays.map((day, i) => (
                    <div
                      key={i}
                      style={{
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "0.5px solid #F3F4F6",
                      }}
                    >
                      {day && (
                        <motion.div
                          whileHover={{ background: "#F5F3FF" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => selectDate(day)}
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 700,
                            background:
                              value &&
                              new Date(value).getDate() === day &&
                              new Date(value).getMonth() === currentMonth &&
                              new Date(value).getFullYear() === currentYear
                                ? "#A855F7"
                                : "transparent",
                            color:
                              value &&
                              new Date(value).getDate() === day &&
                              new Date(value).getMonth() === currentMonth &&
                              new Date(value).getFullYear() === currentYear
                                ? "white"
                                : "#111",
                            borderRadius: "0px",
                          }}
                        >
                          {day}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: "24px",
                    paddingTop: "16px",
                    borderTop: "2px solid #111",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <button
                    onClick={() => {
                      onChange("");
                      setIsOpen(false);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#111",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      selectDate(new Date().getDate());
                      setViewDate(new Date());
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#A855F7",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Today
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{ maxHeight: "300px", overflowY: "auto" }}
                className="custom-scrollbar"
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "2px",
                  }}
                >
                  {Array.from(
                    { length: 100 },
                    (_, i) => new Date().getFullYear() - i,
                  ).map((year) => (
                    <div
                      key={year}
                      onClick={() => {
                        setViewDate(new Date(year, currentMonth, 1));
                        setShowYearPicker(false);
                      }}
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: currentYear === year ? 800 : 500,
                        background:
                          currentYear === year ? "#111" : "transparent",
                        color: currentYear === year ? "white" : "#111",
                        border: "1px solid #F3F4F6",
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "16px 16px 16px 48px",
  borderRadius: "12px",
  border: "2px solid #F3F4F6",
  background: "#F9FAFB",
  fontSize: "15px",
  fontWeight: 400,
  color: "#111",
  outline: "none",
  transition: "all 0.2s ease",
  fontFamily: "var(--font-outfit)",
  boxSizing: "border-box",
};

const selectStyle = {
  ...inputStyle,
  paddingLeft: "24px",
  appearance: "none",
  cursor: "pointer",
};

const onboardingPrimaryButtonStyle = {
  background: "#A855F7",
};

const StepWrapper = ({ children, title, subtitle, t, maxWidth = "560px" }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    style={{
      width: "100%",
      maxWidth: maxWidth,
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      margin: "0 auto",
      maxHeight: "none",
      overflowY: "visible",
      padding: "5px 0 40px 0",
    }}
    className="custom-scrollbar"
  >
    {title && (
      <h1
        style={{
          fontSize: "26px",
          fontWeight: 800,
          color: "#111",
          marginBottom: "6px",
          textAlign: "center",
          fontFamily: "var(--font-outfit)",
          letterSpacing: "-0.02em",
        }}
      >
        {t(title)}
      </h1>
    )}
    {subtitle && (
      <p
        style={{
          fontSize: "14px",
          color: "#6B7280",
          marginBottom: "24px",
          textAlign: "center",
          fontFamily: "var(--font-varela)",
          fontWeight: 400,
        }}
      >
        {t(subtitle)}
      </p>
    )}
    <div style={{ width: "100%" }}>{children}</div>
  </motion.div>
);

const Onboarding = () => {
  const { t } = useTranslation(["onboarding", "common"]);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const totalSteps = role === "others" ? 7 : 6;
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [level, setLevel] = useState("");
  const [semester, setSemester] = useState("");
  const [interests, setInterests] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [searchingAI, setSearchingAI] = useState(false);
  const [mainGoal, setMainGoal] = useState("");
  const [studyTime, setStudyTime] = useState("20:00");
  const [reminders, setReminders] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // New Solo State
  const [hearAboutUs, setHearAboutUs] = useState("");
  const [grade, setGrade] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);

  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Pre-fill full name from Google/Social metadata
  useEffect(() => {
    const getInitialUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && user.user_metadata) {
          // Priority: full_name > name > display_name
          const metadataName =
            user.user_metadata.full_name ||
            user.user_metadata.name ||
            user.user_metadata.display_name;
          if (metadataName && !fullName) {
            setFullName(metadataName);
          }
        }
      } catch (err) {
        console.warn("Could not pre-fill user data:", err);
      }
    };
    getInitialUserData();
  }, []); // Run only once on mount

  // Debounced Username Availability Check
  useEffect(() => {
    if (!userName || userName.length < 3) {
      setUsernameAvailable(true);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", userName)
          .maybeSingle();

        if (error) throw error;
        setUsernameAvailable(!data);
      } catch (err) {
        console.error("Error checking username:", err);
      } finally {
        setCheckingUsername(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [userName]);

  const focusHour = Number((studyTime || "20:00").split(":")[0] || 20);

  const focusProfile = useMemo(() => {
    const hour = focusHour;
    if (hour >= 5 && hour < 12)
      return {
        label: "Morning Catalyst",
        tone: "Clarity and fresh starts.",
        accent: "#F59E0B",
        surface: "#FFF7ED",
        glow: "rgba(245, 158, 11, 0.2)",
        sky: "linear-gradient(180deg, #FF9D6C 0%, #FBBF24 100%)",
        icon: "🌅",
        tagline: "Peak Cognitive Window",
      };
    if (hour >= 12 && hour < 17)
      return {
        label: "Afternoon Pulse",
        tone: "Sustained momentum and flow.",
        accent: "#0EA5E9",
        surface: "#F0F9FF",
        glow: "rgba(14, 165, 233, 0.2)",
        sky: "linear-gradient(180deg, #38BDF8 0%, #818CF8 100%)",
        icon: "☀️",
        tagline: "Deep Work Session",
      };
    if (hour >= 17 && hour < 21)
      return {
        label: "Twilight Rhythm",
        tone: "Structured revision and calm.",
        accent: "#8B5CF6",
        surface: "#F5F3FF",
        glow: "rgba(139, 92, 246, 0.2)",
        sky: "linear-gradient(180deg, #6366F1 0%, #EC4899 100%)",
        icon: "🌆",
        tagline: "Reflective Learning",
      };
    return {
      label: "Night Navigator",
      tone: "Silent hours for deep focus.",
      accent: "#111827",
      surface: "#F1F5F9",
      glow: "rgba(17, 24, 39, 0.1)",
      sky: "linear-gradient(180deg, #1E293B 0%, #0F172A 100%)",
      icon: "🌙",
      tagline: "Uninterrupted Mastery",
    };
  }, [focusHour]);

  const routinePresets = [
    { label: "Morning Kickstart", value: "07:00", icon: "🌅" },
    { label: "Prime Flow", value: "13:00", icon: "☀️" },
    { label: "Evening Ritual", value: "19:00", icon: "🌆" },
    { label: "Midnight Focus", value: "23:00", icon: "🌙" },
  ];

  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [isUniversityUser, setIsUniversityUser] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dynamic Lists
  const [country, setCountry] = useState("Nigeria");
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
        const res = await fetch(
          `https://universities.hipolabs.com/search?country=${encodeURIComponent(country)}`,
        );
        const data = await res.json();
        let names = data.map((u) => u.name);

        // Supplement with static Nigeria list if Nigeria is selected
        if (country === "Nigeria") {
          names = [...names, ...NIGERIAN_UNIVERSITIES];
        }

        const uniqueNames = Array.from(new Set(names)).sort();
        setUniversityList(uniqueNames);
      } catch (err) {
        console.warn("Failed to fetch universities, using fallback list:", err);
        // Fallback to static list if API fails and country is Nigeria
        if (country === "Nigeria" || !country) {
          setUniversityList(NIGERIAN_UNIVERSITIES);
        } else {
          // Empty list for other countries if API fails
          setUniversityList([]);
        }
      } finally {
        setFetchingUnis(false);
      }
    };

    fetchUnis();
  }, [country]);

  // Fetch Official Courses when reaching Step 5
  useEffect(() => {
    if (
      step === 5 &&
      role === "student" &&
      university &&
      major &&
      level &&
      semester
    ) {
      const fetchOfficial = async () => {
        setFetchingOfficialCourses(true);
        const uniSlug = universitySlugFromName(university);
        const deptSlug = departmentSlugFromLabel(major);
        const semNorm = normalizeSemesterParam(semester);

        try {
          const { data, error } = await supabase
            .from("curriculum_offers")
            .select("courses")
            .eq("university_slug", uniSlug)
            .eq("department_slug", deptSlug)
            .eq("level", String(level))
            .eq("semester", semNorm)
            .eq("status", "live")
            .maybeSingle();

          if (data && data.courses) {
            setOfficialCourses(data.courses);
            // Auto-select all official courses by default?
            // User usually wants to add all their courses.
            const newCourses = data.courses.map((c) => ({
              code: normalizeCourseCode(c.code),
              name: c.name,
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
          .from("courses")
          .select("code, title")
          .or(`code.ilike.%${courseSearch}%,title.ilike.%${courseSearch}%`)
          .limit(10);

        const dbMapped = (dbCourses || []).map((c) => ({
          code: c.code,
          name: c.title,
        }));

        // 2. Call AI to fill gaps or find courses not in DB
        const aiResults = await fetchGroqLiveCourseSearch({
          query: courseSearch,
          country,
          university,
          department: major,
          level,
          semester,
        });

        // 3. Merge and make unique
        const combined = [...dbMapped, ...aiResults];
        const unique = Array.from(
          new Map(
            combined.map((item) => [normalizeCourseCode(item.code), item]),
          ).values(),
        );

        // 4. Filter out what's already in official list
        const officialCodes = new Set(
          officialCourses.map((c) => normalizeCourseCode(c.code)),
        );
        setAiSuggestions(
          unique.filter((r) => !officialCodes.has(normalizeCourseCode(r.code))),
        );
      } catch (err) {
        console.warn("Course Search error:", err);
      } finally {
        setSearchingAI(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [
    courseSearch,
    step,
    country,
    university,
    major,
    level,
    semester,
    officialCourses,
  ]);

  const goToNext = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const goToBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const finish = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const normalizedRole = role === "others" ? "solo_learner" : "student";
      const isSoloLearner = normalizedRole === "solo_learner";
      const normalizedSemester =
        semester === "1" ? "1st" : semester === "2" ? "2nd" : null;
      const profilePayload = {
        id: user.id,
        full_name: fullName,
        username: userName,
        birthday: birthday || null,
        role: normalizedRole,
        is_university_user: !isSoloLearner,
        onboarding_complete: true,
        university: isSoloLearner ? null : university,
        country: country || "Nigeria",
        level: isSoloLearner ? grade || null : String(level || ""),
        semester: isSoloLearner ? null : normalizedSemester,
        faculty: isSoloLearner ? null : major,
        updated_at: new Date().toISOString(),
      };

      // 1. Update Profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (profileError) throw profileError;

      // 2. Save Courses (parallelized to avoid sequential network round-trips)
      if (!isSoloLearner && selectedCourses.length > 0) {
        const uniSlug = universitySlugFromName(university);
        const deptSlug = departmentSlugFromLabel(major);

        await Promise.all(
          selectedCourses.map(async (course) => {
            let courseId;
            // Scope course lookup by university to avoid code collisions across institutions
            const { data: existingCourse } = await supabase
              .from("courses")
              .select("id")
              .eq("code", course.code)
              .eq("university_slug", uniSlug)
              .maybeSingle();

            if (existingCourse) {
              courseId = existingCourse.id;
            } else {
              const { data: newCourse, error: createError } = await supabase
                .from("courses")
                .insert({
                  code: course.code,
                  name: course.name || course.code,
                  faculty: major, // This is actually the department/field of study
                  university_slug: uniSlug,
                  department_slug: deptSlug,
                  education_level: level,
                  semester: normalizedSemester,
                })
                .select("id")
                .single();

              if (createError)
                console.error("Error creating course:", createError);
              else courseId = newCourse.id;
            }

            if (courseId) {
              await supabase.from("user_courses").upsert(
                {
                  user_id: user.id,
                  course_id: courseId,
                  semester: normalizedSemester,
                  enrollment_source: "onboarding",
                },
                { onConflict: "user_id,course_id" },
              );
            }
          }),
        );
      }

      // 3. Process Uploaded Materials (parallelized)
      const materialPromises = [];
      if (youtubeLink) {
        materialPromises.push(
          addYoutubeMaterial({
            url: youtubeLink,
            userId: user.id,
            title: `Onboarding Video - ${new Date().toLocaleDateString()}`,
          }).catch((ytErr) =>
            console.error("YouTube onboarding ingestion failed:", ytErr),
          ),
        );
      }

      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop().toLowerCase();
        let type = "pdf";
        if (["docx", "doc"].includes(ext)) type = "docx";
        else if (["pptx", "ppt"].includes(ext)) type = "pptx";

        materialPromises.push(
          uploadMaterial({
            file: selectedFile,
            userId: user.id,
            title: selectedFile.name,
            type: type,
          }).catch((fileErr) =>
            console.error("File onboarding ingestion failed:", fileErr),
          ),
        );
      }

      if (selectedAudio) {
        materialPromises.push(
          uploadMaterial({
            file: selectedAudio,
            userId: user.id,
            title: selectedAudio.name,
            type: "audio",
          }).catch((audioErr) =>
            console.error("Audio onboarding ingestion failed:", audioErr),
          ),
        );
      }

      await Promise.all(materialPromises);

      // 4. Save Study Routine
      const { error: statsError } = await supabase.from("user_stats").upsert(
        {
          user_id: user.id,
          reminder_time: studyTime + ":00",
          reminders_enabled: reminders,
          last_streak_update: null, // Will be set on first study
        },
        { onConflict: "user_id" },
      );

      if (statsError) console.error("Error saving stats:", statsError);

      // 5. Clear all dashboard and workspace caches to ensure fresh data after onboarding
      clearLuterCaches();

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Onboarding finish error:", err);
      alert("Failed to complete onboarding: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#F9FAFB",
        overflowX: "hidden",
        overflowY: "auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Dynamic Background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <React.Suspense
          fallback={
            <div
              style={{ width: "100%", height: "100%", background: "#f8fafc" }}
            />
          }
        >
          <Ballpit
            count={40}
            gravity={0.7}
            friction={0.8}
            wallBounce={0.95}
            followCursor={true}
            colors={["#4338ca", "#6366f1", "#1e1b4b", "#ffffff", "#9ca3af"]}
            minSize={0.7}
            maxSize={1.4}
          />
        </React.Suspense>
      </div>

      {/* Custom Header */}
      <header
        style={{
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          zIndex: 1000,
        }}
      >
        <LuterLogo />
        <LanguageToggle />
      </header>

      {/* Main Container */}
      <div
        className="onboarding-main-card"
        style={{
          width: "calc(100vw - 32px)",
          minHeight: "calc(100vh - 120px)",
          maxWidth: "1200px",
          maxHeight: "900px",
          background: "white",
          borderRadius: "24px",
          padding: "24px 20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
          position: "relative",
          zIndex: 10,
          margin: "0 auto 24px",
          border: "1px solid #F3F4F6",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {step > 1 && (
          <ProgressBar step={step} totalSteps={totalSteps} onBack={goToBack} />
        )}

        <div
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            overflowY: "auto",
            paddingRight: "8px",
            paddingBottom: "80px",
          }}
          className="onboarding-step-content"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  fontFamily: "var(--font-outfit)",
                  margin: "0 auto",
                  paddingTop: "10px",
                }}
              >
                <SpeechBubble text="Hi there! I'm Lute!" />
                <div style={{ height: "16px" }} />
                <motion.img
                  src="/onboard-mascot.png"
                  alt="Lute"
                  style={{
                    width: "180px",
                    height: "auto",
                    marginBottom: "32px",
                    filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.1))",
                    display: "block",
                    margin: "0 auto",
                  }}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                />
                <div
                  style={{ width: "100%", maxWidth: "280px", margin: "0 auto" }}
                >
                  <PremiumButton onClick={goToNext} size="lg">
                    {t("common:continue")}
                  </PremiumButton>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <StepWrapper
                key="step2"
                title="pathTitle"
                subtitle="pathSub"
                t={t}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {ROLES.map((r) => (
                    <motion.div
                      key={r.id}
                      onClick={() => {
                        setRole(r.id);
                        setIsUniversityUser(r.id === "student");
                        goToNext();
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: "24px",
                        borderRadius: "12px",
                        border: "2px solid",
                        borderColor: role === r.id ? "#C7B9FF" : "#F3F4F6",
                        background: role === r.id ? "#F3E8FF" : "#F9FAFB",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        transition: "all 0.2s ease",
                        color: role === r.id ? "#4B0082" : "#6B7280",
                      }}
                    >
                      <div style={{ fontSize: "32px" }}>{r.icon}</div>
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: "16px",
                            fontWeight: 500,
                            color: role === r.id ? "#4B0082" : "#111",
                            marginBottom: "2px",
                            fontFamily: "var(--font-outfit)",
                          }}
                        >
                          {t(r.labelKey)}
                        </h3>
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: 400,
                            color: role === r.id ? "#A397D8" : "#6B7280",
                          }}
                        >
                          {t(r.subKey)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </StepWrapper>
            )}

            {step === 3 &&
              (role === "student" ? (
                <StepWrapper
                  key="step3-student"
                  title="idTitle"
                  subtitle="idSub"
                  t={t}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <User
                        style={{
                          position: "absolute",
                          left: "16px",
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                        color="#111"
                        weight="light"
                        size={18}
                      />
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t("fullName")}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ position: "relative" }}>
                      <At
                        style={{
                          position: "absolute",
                          left: "16px",
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                        color="#111"
                        weight="light"
                        size={18}
                      />
                      <input
                        value={userName}
                        onChange={(e) =>
                          setUserName(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, ""),
                          )
                        }
                        placeholder={t("username")}
                        style={{
                          ...inputStyle,
                          paddingRight: "120px",
                          borderColor:
                            !usernameAvailable && !checkingUsername
                              ? "#EF4444"
                              : userName.length >= 3 &&
                                  usernameAvailable &&
                                  !checkingUsername
                                ? "#C7B9FF"
                                : "#F3F4F6",
                          transition: "all 0.3s ease",
                        }}
                      />

                      <div
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {checkingUsername ? (
                            <motion.div
                              key="checking"
                              animate={{ rotate: 360 }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.2,
                                ease: "linear",
                              }}
                              style={{
                                width: "24px",
                                height: "24px",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {[0, 120, 240].map((deg) => (
                                <div
                                  key={deg}
                                  style={{
                                    position: "absolute",
                                    width: "5px",
                                    height: "5px",
                                    background: "#A855F7",
                                    borderRadius: "50%",
                                    transform: `rotate(${deg}deg) translateY(-8px)`,
                                  }}
                                />
                              ))}
                            </motion.div>
                          ) : userName.length >= 3 ? (
                            <motion.div
                              key={usernameAvailable ? "available" : "taken"}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 15,
                              }}
                            >
                              {usernameAvailable ? (
                                <CheckCircle size={24} color="#C7B9FF" />
                              ) : (
                                <X size={24} color="#EF4444" />
                              )}
                            </motion.div>
                          ) : userName.length === 0 && fullName ? (
                            <motion.div
                              key="suggestion"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              onClick={() =>
                                setUserName(
                                  fullName
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_]/g, ""),
                                )
                              }
                              style={{
                                background: "#F5F3FF",
                                border: "1px solid #DDD6FE",
                                borderRadius: "20px",
                                padding: "4px 12px",
                                fontSize: "11px",
                                color: "#7C3AED",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 700,
                                fontFamily: "var(--font-outfit)",
                                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.1)",
                              }}
                            >
                              <Sparkle size={12} />{" "}
                              {fullName.split(" ")[0].toLowerCase()}?
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </div>

                    <AnimatePresence>
                      {!usernameAvailable && !checkingUsername && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            color: "#EF4444",
                            fontSize: "12px",
                            paddingLeft: "16px",
                            marginTop: "-8px",
                            fontFamily: "var(--font-varela)",
                          }}
                        >
                          This username is already taken.
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <CustomDatePicker value={birthday} onChange={setBirthday} />
                    <div style={{ height: "12px" }} />
                    <PremiumButton
                      disabled={
                        !fullName ||
                        !userName ||
                        !birthday ||
                        !usernameAvailable ||
                        checkingUsername ||
                        userName.length < 3
                      }
                      onClick={goToNext}
                      size="lg"
                      style={{ width: "100%" }}
                    >
                      {t("common:continue")}
                    </PremiumButton>
                  </div>
                </StepWrapper>
              ) : (
                <StepWrapper
                  key="step3-others"
                  title="What's your current grade?"
                  subtitle="This helps us tailor the difficulty and content."
                  t={t}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {[
                      "Secondary School",
                      "High School Graduate",
                      "Self-Taught / Enthusiast",
                    ].map((g) => (
                      <motion.div
                        key={g}
                        onClick={() => {
                          setGrade(g);
                          goToNext();
                        }}
                        whileHover={{
                          y: -4,
                          background: "#F3E8FF",
                          borderColor: "#C7B9FF",
                        }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: "20px",
                          borderRadius: "16px",
                          border: "2px solid",
                          borderColor: grade === g ? "#C7B9FF" : "#F3F4F6",
                          background: grade === g ? "#F3E8FF" : "white",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          transition: "all 0.2s ease",
                          boxShadow:
                            grade === g
                              ? "0 10px 20px rgba(168, 85, 247, 0.1)"
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            background:
                              grade === g
                                ? "linear-gradient(135deg, #A855F7, #C7B9FF)"
                                : "#F9FAFB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <GraduationCap
                            size={22}
                            weight="light"
                            color={grade === g ? "white" : "#111"}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 500,
                            color: grade === g ? "#4B0082" : "#111",
                            fontFamily: "var(--font-outfit)",
                            textTransform: "uppercase",
                          }}
                        >
                          {g}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </StepWrapper>
              ))}

            {step === 4 &&
              (role === "student" ? (
                <StepWrapper
                  key="step4-student"
                  title="uniTitle"
                  subtitle="uniSub"
                  t={t}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <SearchInputWithSuggestions
                      placeholder="Which country are you studying in?"
                      value={country}
                      onChange={setCountry}
                      icon={Globe}
                      suggestions={COUNTRIES}
                      isCountry={true}
                    />

                    <SearchInputWithSuggestions
                      placeholder={
                        fetchingUnis
                          ? "Fetching universities..."
                          : "Search University..."
                      }
                      value={university}
                      onChange={(val) => setUniversity(val)}
                      icon={Search}
                      suggestions={universityList}
                    />

                    <SearchInputWithSuggestions
                      placeholder="Program of Study (Major)..."
                      value={major}
                      onChange={(val) => setMajor(val)}
                      icon={GraduationCap}
                      suggestions={MAJORS}
                    />

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          style={{ ...selectStyle, paddingLeft: "24px" }}
                        >
                          <option value="">Level</option>
                          <option value="100">100 Level</option>
                          <option value="200">200 Level</option>
                          <option value="300">300 Level</option>
                          <option value="400">400 Level</option>
                          <option value="500">500 Level</option>
                        </select>
                        <ChevronDown
                          size={16}
                          weight="light"
                          style={{
                            position: "absolute",
                            right: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                          }}
                          color="#4B0082"
                        />
                      </div>
                      <div style={{ position: "relative" }}>
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          style={{ ...selectStyle, paddingLeft: "24px" }}
                        >
                          <option value="">Semester</option>
                          <option value="1">1st Semester</option>
                          <option value="2">2nd Semester</option>
                        </select>
                        <ChevronDown
                          size={16}
                          weight="light"
                          style={{
                            position: "absolute",
                            right: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                          }}
                          color="#4B0082"
                        />
                      </div>
                    </div>
                    <div style={{ height: "12px" }} />
                    <PremiumButton
                      disabled={!university || !major || !level || !semester}
                      onClick={goToNext}
                      size="lg"
                    >
                      {t("common:continue")}
                    </PremiumButton>
                  </div>
                </StepWrapper>
              ) : (
                <StepWrapper
                  key="step4-others"
                  title="Tell us about yourself"
                  subtitle="This helps us personalize your learning experience."
                  t={t}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <User
                        style={{
                          position: "absolute",
                          left: "16px",
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                        color="#111"
                        weight="light"
                        size={18}
                      />
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t("fullName")}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ position: "relative" }}>
                      <At
                        style={{
                          position: "absolute",
                          left: "16px",
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                        color="#111"
                        weight="light"
                        size={18}
                      />
                      <input
                        value={userName}
                        onChange={(e) =>
                          setUserName(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, ""),
                          )
                        }
                        placeholder={t("username")}
                        style={{ ...inputStyle, paddingRight: "48px" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          right: "16px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {checkingUsername ? (
                            <motion.div
                              key="checking"
                              animate={{ rotate: 360 }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.2,
                                ease: "linear",
                              }}
                              style={{
                                width: "24px",
                                height: "24px",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {[0, 120, 240].map((deg) => (
                                <div
                                  key={deg}
                                  style={{
                                    position: "absolute",
                                    width: "5px",
                                    height: "5px",
                                    background: "#A855F7",
                                    borderRadius: "50%",
                                    transform: `rotate(${deg}deg) translateY(-8px)`,
                                  }}
                                />
                              ))}
                            </motion.div>
                          ) : userName.length >= 3 ? (
                            <motion.div
                              key={usernameAvailable ? "available" : "taken"}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 15,
                              }}
                            >
                              {usernameAvailable ? (
                                <CheckCircle size={24} color="#C7B9FF" />
                              ) : (
                                <X size={24} color="#EF4444" />
                              )}
                            </motion.div>
                          ) : userName.length === 0 && fullName ? (
                            <motion.div
                              key="suggestion"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              onClick={() =>
                                setUserName(
                                  fullName
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_]/g, ""),
                                )
                              }
                              style={{
                                background: "#F5F3FF",
                                border: "1px solid #DDD6FE",
                                borderRadius: "20px",
                                padding: "4px 12px",
                                fontSize: "11px",
                                color: "#7C3AED",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 700,
                                fontFamily: "var(--font-outfit)",
                                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.1)",
                              }}
                            >
                              <Sparkle size={12} />{" "}
                              {fullName.split(" ")[0].toLowerCase()}?
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </div>

                    <AnimatePresence>
                      {!usernameAvailable && !checkingUsername && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            color: "#EF4444",
                            fontSize: "12px",
                            paddingLeft: "16px",
                            marginTop: "-8px",
                            fontFamily: "var(--font-varela)",
                          }}
                        >
                          This username is already taken.
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <CustomDatePicker value={birthday} onChange={setBirthday} />
                    <div style={{ height: "12px" }} />
                    <PremiumButton
                      disabled={
                        !fullName ||
                        !userName ||
                        !birthday ||
                        !usernameAvailable ||
                        checkingUsername ||
                        userName.length < 3
                      }
                      onClick={goToNext}
                      size="lg"
                      style={{ width: "100%" }}
                    >
                      {t("common:continue")}
                    </PremiumButton>
                  </div>
                </StepWrapper>
              ))}

            {step === 5 &&
              (role === "student" ? (
                <StepWrapper
                  key="step5-student"
                  title="courseTitle"
                  subtitle="courseSub"
                  t={t}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    {fetchingOfficialCourses ? (
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        <RefreshCw
                          size={24}
                          className="animate-spin"
                          color="#7a12cc"
                        />
                        <p
                          style={{
                            marginTop: "10px",
                            fontSize: "14px",
                            color: "#6B7280",
                          }}
                        >
                          Loading your curriculum...
                        </p>
                      </div>
                    ) : officialCourses.length > 0 ? (
                      <div
                        style={{
                          background: "#F9FAFB",
                          borderRadius: "16px",
                          padding: "20px",
                          border: "1px solid #F3F4F6",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#111",
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontFamily: "var(--font-outfit)",
                          }}
                        >
                          <BookOpen size={16} color="#111" weight="light" />{" "}
                          Official {level}L {semester === "1" ? "1st" : "2nd"}{" "}
                          Sem Courses
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            maxHeight: "340px",
                            overflowY: "auto",
                            paddingRight: "8px",
                          }}
                          className="custom-scrollbar"
                        >
                          {officialCourses.map((c, idx) => {
                            const isSelected = selectedCourses.some(
                              (sc) => sc.code === normalizeCourseCode(c.code),
                            );
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCourses(
                                      selectedCourses.filter(
                                        (sc) =>
                                          sc.code !==
                                          normalizeCourseCode(c.code),
                                      ),
                                    );
                                  } else {
                                    setSelectedCourses([
                                      ...selectedCourses,
                                      {
                                        code: normalizeCourseCode(c.code),
                                        name: c.name,
                                      },
                                    ]);
                                  }
                                }}
                                style={{
                                  padding: "12px 16px",
                                  borderRadius: "12px",
                                  background: isSelected ? "#F3E8FF" : "white",
                                  border: "1.5px solid",
                                  borderColor: isSelected
                                    ? "#C7B9FF"
                                    : "#E5E7EB",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  transition: "all 0.2s",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: 500,
                                      color: isSelected ? "#4B0082" : "#111",
                                      fontFamily: "var(--font-varela)",
                                    }}
                                  >
                                    {c.code}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      color: "#6B7280",
                                      fontFamily: "var(--font-varela)",
                                    }}
                                  >
                                    {c.name}
                                  </span>
                                </div>
                                {isSelected ? (
                                  <Check
                                    size={18}
                                    color="#111"
                                    weight="light"
                                  />
                                ) : (
                                  <Plus
                                    size={18}
                                    color="#94A3B8"
                                    weight="light"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: "16px",
                          border: "2px dashed #E5E7EB",
                          textAlign: "center",
                        }}
                      >
                        <p style={{ fontSize: "14px", color: "#6B7280" }}>
                          No official courses found for your department yet.
                        </p>
                      </div>
                    )}

                    <div
                      style={{
                        borderTop: "1px solid #F3F4F6",
                        paddingTop: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#111",
                            fontFamily: "var(--font-outfit)",
                          }}
                        >
                          Search & Add Other Courses
                        </h4>
                        {searchingAI && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <RefreshCw
                              size={12}
                              className="animate-spin"
                              color="#111"
                              weight="light"
                            />
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                color: "#111",
                                fontFamily: "var(--font-varela)",
                              }}
                            >
                              Luter is searching...
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        style={{ position: "relative", marginBottom: "12px" }}
                      >
                        <Search
                          style={{
                            position: "absolute",
                            left: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                          color="#4B0082"
                          weight="light"
                          size={18}
                        />
                        <input
                          value={courseSearch}
                          onChange={(e) =>
                            setCourseSearch(e.target.value.toUpperCase())
                          }
                          placeholder="Search course code or name (e.g. MTH 301)..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.target.value) {
                              const code = normalizeCourseCode(e.target.value);
                              if (
                                !selectedCourses.some((c) => c.code === code)
                              ) {
                                setSelectedCourses([
                                  ...selectedCourses,
                                  { code, name: "" },
                                ]);
                              }
                              setCourseSearch("");
                            }
                          }}
                          style={{
                            ...inputStyle,
                            paddingLeft: "48px",
                            height: "48px",
                            fontSize: "14px",
                            background: "white",
                            textTransform: "uppercase",
                          }}
                        />
                      </div>

                      {/* AI Search Results */}
                      <AnimatePresence>
                        {aiSuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                              background: "rgba(122, 82, 255, 0.03)",
                              borderRadius: "16px",
                              padding: "12px",
                              border: "1px solid rgba(122, 82, 255, 0.1)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                              marginBottom: "16px",
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                            className="custom-scrollbar"
                          >
                            <p
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                color: "#7a12cc",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "4px",
                                opacity: 0.7,
                              }}
                            >
                              Luter Suggestions
                            </p>
                            {aiSuggestions.map((s, idx) => {
                              const isSelected = selectedCourses.some(
                                (sc) => sc.code === normalizeCourseCode(s.code),
                              );
                              return (
                                <motion.div
                                  key={`ai-${idx}`}
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedCourses(
                                        selectedCourses.filter(
                                          (sc) =>
                                            sc.code !==
                                            normalizeCourseCode(s.code),
                                        ),
                                      );
                                    } else {
                                      setSelectedCourses([
                                        ...selectedCourses,
                                        {
                                          code: normalizeCourseCode(s.code),
                                          name: s.name,
                                        },
                                      ]);
                                    }
                                  }}
                                  style={{
                                    padding: "10px 14px",
                                    borderRadius: "10px",
                                    background: isSelected
                                      ? "#F3E8FF"
                                      : "white",
                                    border: "1px solid",
                                    borderColor: isSelected
                                      ? "#C7B9FF"
                                      : "#F1F5F9",
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                  }}
                                  whileHover={{
                                    x: 2,
                                    background: isSelected
                                      ? "#F3E8FF"
                                      : "#F9FAFB",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: isSelected ? "#4B0082" : "#111",
                                        fontFamily: "var(--font-varela)",
                                      }}
                                    >
                                      {s.code}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "#6B7280",
                                        fontFamily: "var(--font-varela)",
                                      }}
                                    >
                                      {s.name}
                                    </span>
                                  </div>
                                  {isSelected ? (
                                    <Check
                                      size={14}
                                      color="#111"
                                      weight="light"
                                    />
                                  ) : (
                                    <Plus
                                      size={14}
                                      color="#94A3B8"
                                      weight="light"
                                    />
                                  )}
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginTop: "12px",
                        }}
                      >
                        {selectedCourses
                          .filter(
                            (sc) =>
                              !officialCourses.some(
                                (oc) =>
                                  normalizeCourseCode(oc.code) === sc.code,
                              ),
                          )
                          .map((c, i) => (
                            <motion.div
                              layout
                              key={`selected-custom-${i}`}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              style={{
                                background: "#F3F4F6",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              <span>{c.code}</span>
                              <X
                                size={14}
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  setSelectedCourses(
                                    selectedCourses.filter(
                                      (sc) => sc.code !== c.code,
                                    ),
                                  )
                                }
                              />
                            </motion.div>
                          ))}
                      </div>
                    </div>
                    <div style={{ height: "12px" }} />
                    <PremiumButton
                      disabled={selectedCourses.length === 0}
                      onClick={goToNext}
                      style={{ width: "100%" }}
                      size="lg"
                    >
                      {t("common:continue")}
                    </PremiumButton>
                  </div>
                </StepWrapper>
              ) : (
                <StepWrapper
                  key="step5-others"
                  title="How did you hear about us?"
                  subtitle="We're curious! Help us reach more people like you."
                  t={t}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "12px",
                    }}
                  >
                    {[
                      "Google Search",
                      "Twitter / X",
                      "Instagram",
                      "Friend / Family",
                      "TikTok",
                      "University Ad",
                      "LinkedIn",
                      "Other",
                    ].map((source) => (
                      <motion.div
                        key={source}
                        onClick={() => {
                          setHearAboutUs(source);
                          goToNext();
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: "16px",
                          borderRadius: "12px",
                          border: "2px solid",
                          borderColor:
                            hearAboutUs === source ? "#C7B9FF" : "#F3F4F6",
                          background:
                            hearAboutUs === source ? "#F3E8FF" : "white",
                          cursor: "pointer",
                          textAlign: "center",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: hearAboutUs === source ? "#4B0082" : "#6B7280",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {source}
                      </motion.div>
                    ))}
                  </div>
                </StepWrapper>
              ))}
            {step === 6 && (
              <StepWrapper
                key="step6"
                title="Study Rhythm"
                subtitle="Consistency is key. Set a daily nudge."
                t={t}
                maxWidth="500px"
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: isMobile ? "16px" : "24px",
                    padding: isMobile ? "0" : "10px 0",
                  }}
                >
                  {/* Fun Mascot Illustration - Smaller on Mobile */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{
                      position: "relative",
                      marginBottom: isMobile ? "0" : "10px",
                    }}
                  >
                    <img
                      src="/onboard-mascot.png"
                      alt="Mascot"
                      style={{
                        width: isMobile ? "120px" : "160px",
                        height: "auto",
                        objectFit: "contain",
                      }}
                    />
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        rotate: [0, 8, -8, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        background: "white",
                        width: isMobile ? "36px" : "44px",
                        height: isMobile ? "36px" : "44px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 25px rgba(139, 92, 246, 0.15)",
                        border: "1px solid #F5F3FF",
                      }}
                    >
                      <Bell
                        size={isMobile ? 18 : 22}
                        color="#8B5CF6"
                        weight="fill"
                      />
                    </motion.div>
                  </motion.div>

                  {/* Minimal Reminder Control - More Compact on Mobile */}
                  <div
                    style={{
                      width: "100%",
                      background: "#F9FAFB",
                      borderRadius: "24px",
                      padding: isMobile ? "16px" : "20px",
                      border: "1px solid #F1F5F9",
                      display: "flex",
                      flexDirection: "column",
                      gap: isMobile ? "12px" : "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: isMobile ? "15px" : "16px",
                            fontWeight: 800,
                            color: "#111",
                            fontFamily: "var(--font-outfit)",
                          }}
                        >
                          Enable Nudges
                        </h4>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            color: "#6B7280",
                            fontFamily: "var(--font-varela)",
                          }}
                        >
                          Build your habit daily
                        </p>
                      </div>
                      <motion.button
                        onClick={() => setReminders(!reminders)}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          width: "44px",
                          height: "22px",
                          borderRadius: "20px",
                          background: reminders ? "#8B5CF6" : "#CBD5E1",
                          position: "relative",
                          cursor: "pointer",
                          border: "none",
                          transition: "all 0.3s",
                        }}
                      >
                        <motion.div
                          animate={{ x: reminders ? 22 : 0 }}
                          style={{
                            width: "16px",
                            height: "16px",
                            background: "white",
                            borderRadius: "50%",
                            position: "absolute",
                            top: "3px",
                            left: "3px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        />
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {reminders && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            style={{
                              paddingTop: "10px",
                              borderTop: "1px dashed #E5E7EB",
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#4B5563",
                                  fontFamily: "var(--font-outfit)",
                                }}
                              >
                                Notification Time
                              </span>
                              <input
                                type="time"
                                value={studyTime}
                                onChange={(e) => setStudyTime(e.target.value)}
                                style={{
                                  border: "1px solid #F1F5F9",
                                  background: "white",
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                  fontSize: "15px",
                                  fontWeight: 800,
                                  color: "#111",
                                  outline: "none",
                                  fontFamily: "var(--font-outfit)",
                                  cursor: "pointer",
                                }}
                              />
                            </div>

                            {!isMobile && (
                              <motion.button
                                whileHover={{ background: "#EDE9FE" }}
                                onClick={async () => {
                                  if ("Notification" in window) {
                                    const res =
                                      await Notification.requestPermission();
                                    if (res === "granted")
                                      new Notification("Luter", {
                                        body: "Nudges active! 🔥",
                                      });
                                  }
                                }}
                                style={{
                                  width: "100%",
                                  padding: "10px",
                                  borderRadius: "12px",
                                  background: "#F5F3FF",
                                  color: "#8B5CF6",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  border: "none",
                                  cursor: "pointer",
                                  fontFamily: "var(--font-outfit)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                              >
                                <Bell size={14} /> Authorize Browser Alerts
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Routine Presets (Minimal Chips) - Smaller on Mobile */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: isMobile ? "6px" : "8px",
                    }}
                  >
                    {routinePresets.map((preset) => (
                      <motion.button
                        key={preset.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setStudyTime(preset.value)}
                        style={{
                          padding: isMobile ? "6px 12px" : "8px 14px",
                          borderRadius: "12px",
                          background:
                            studyTime === preset.value ? "#8B5CF6" : "white",
                          color:
                            studyTime === preset.value ? "white" : "#64748B",
                          border: "1px solid",
                          borderColor:
                            studyTime === preset.value ? "#8B5CF6" : "#E5E7EB",
                          fontSize: isMobile ? "11px" : "12px",
                          fontWeight: 700,
                          fontFamily: "var(--font-outfit)",
                          cursor: "pointer",
                        }}
                      >
                        {preset.icon} {preset.label}
                      </motion.button>
                    ))}
                  </div>

                  <div
                    style={{
                      width: "100%",
                      marginTop: isMobile ? "4px" : "8px",
                    }}
                  >
                    <PremiumButton
                      onClick={role === "student" ? finish : goToNext}
                      style={{
                        width: "100%",
                        height: isMobile ? "50px" : "56px",
                        borderRadius: "18px",
                        fontSize: "16px",
                      }}
                      disabled={saving}
                    >
                      {saving ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            justifyContent: "center",
                          }}
                        >
                          <span>
                            {role === "student"
                              ? "Launch Dashboard"
                              : "Continue"}
                          </span>
                          <ArrowRight size={18} />
                        </div>
                      )}
                    </PremiumButton>
                  </div>
                </div>
              </StepWrapper>
            )}

            {step === 7 && role === "others" && (
              <StepWrapper
                key="step7-solo"
                title="Do you have your document for study?"
                subtitle="Upload your Document, Audio or paste a Link"
                t={t}
                maxWidth="1000px"
              >
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
                  saving={saving}
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
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    style={{
      background: "white",
      padding: "16px 32px",
      borderRadius: "24px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
      position: "relative",
      marginBottom: "24px",
      border: "2px solid #f1f5f9",
      display: "inline-block",
      fontFamily: "var(--font-outfit)",
    }}
  >
    <p style={{ fontSize: "20px", fontWeight: 500, color: "#111", margin: 0 }}>
      {text}
    </p>
    <div
      style={{
        position: "absolute",
        bottom: "-12px",
        left: "50%",
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "12px solid transparent",
        borderRight: "12px solid transparent",
        borderTop: "12px solid white",
        zIndex: 1,
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: "-14px",
        left: "50%",
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "13px solid transparent",
        borderRight: "13px solid transparent",
        borderTop: "13px solid #f1f5f9",
        zIndex: 0,
      }}
    />
  </motion.div>
);

// ID Card Component
const IDCard = ({ name, role, info }) => (
  <motion.div
    initial={{ rotateY: -10, rotateX: 10, scale: 0.95 }}
    animate={{ rotateY: 0, rotateX: 0, scale: 1 }}
    transition={{ type: "spring", damping: 20 }}
    whileHover={{
      y: -5,
      rotateY: 5,
      rotateX: 5,
      boxShadow: "0 20px 40px rgba(199, 185, 255, 0.4)",
    }}
    style={{
      width: "100%",
      aspectRatio: "1.6/1",
      background: "white",
      borderRadius: "24px",
      padding: "32px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
      border: "1px solid #F3F4F6",
      position: "relative",
      overflow: "hidden",
      fontFamily: "var(--font-outfit)",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #F9FAFB 0%, white 100%)",
        zIndex: 0,
      }}
    />

    <div
      style={{
        position: "relative",
        zIndex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            background: "#A78BFA",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <Rocket size={24} weight="light" />
        </div>
        <div style={{ textAlign: "right" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 800,
              color: "#A78BFA",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: "4px",
            }}
          >
            Verified Learner
          </p>
          <div
            style={{
              width: "60px",
              height: "4px",
              background: "#A78BFA",
              borderRadius: "2px",
              marginLeft: "auto",
            }}
          />
        </div>
      </div>

      <div>
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#111",
            marginBottom: "4px",
            fontFamily: "var(--font-outfit)",
            letterSpacing: "-0.03em",
          }}
        >
          {name || "Learner Name"}
        </h2>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#6B7280",
            fontFamily: "var(--font-varela)",
          }}
        >
          {role} • {info}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#9CA3AF",
            fontFamily: "var(--font-varela)",
            letterSpacing: "0.05em",
          }}
        >
          LUTER CARD ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
        </div>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "#F3F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={16} color="#4B0082" weight="light" />
        </div>
      </div>
    </div>
  </motion.div>
);

const DocumentUploadStep = ({
  youtubeLink,
  setYoutubeLink,
  selectedFile,
  setSelectedFile,
  selectedAudio,
  setSelectedAudio,
  fileInputRef,
  audioInputRef,
  onSkip,
  onContinue,
  saving = false,
}) => {
  const isMobile = window.innerWidth <= 768;
  const hasYouTube = youtubeLink.trim().length > 0;
  const hasDocument = Boolean(selectedFile);
  const hasAudio = Boolean(selectedAudio);
  const hasAnySource = hasYouTube || hasDocument || hasAudio;

  const cardStyle = (active) => ({
    background: active ? "#F5F3FF" : "white",
    border: "2px solid",
    borderColor: active ? "#8B5CF6" : "#F1F5F9",
    borderRadius: "24px",
    padding: isMobile ? "16px" : "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "all 0.3s ease",
    boxShadow: active ? "0 10px 25px rgba(139, 92, 246, 0.1)" : "none",
  });

  const iconBox = (color) => ({
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: `${color}15`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: color,
  });

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? "16px" : "20px",
      }}
    >
      {/* Header with Mascot */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          gap: "16px",
          textAlign: isMobile ? "center" : "left",
        }}
      >
        <img
          src="/onboard-mascot.png"
          style={{ width: isMobile ? "80px" : "100px", height: "auto" }}
          alt="Mascot"
        />
        <div>
          <h2
            style={{
              fontSize: isMobile ? "22px" : "28px",
              fontWeight: 800,
              color: "#111",
              margin: 0,
              fontFamily: "var(--font-outfit)",
            }}
          >
            Ready to Study?
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#6B7280",
              margin: "4px 0 0 0",
              fontFamily: "var(--font-varela)",
            }}
          >
            Bring in your YouTube links, documents, or audio.
          </p>
        </div>
      </div>

      {/* Upload Options Stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* YouTube Card */}
        <motion.div whileTap={{ scale: 0.98 }} style={cardStyle(hasYouTube)}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={iconBox("#EF4444")}>
              <Youtube size={24} weight="fill" />
            </div>
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#111",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                YouTube Video
              </h4>
              {!hasYouTube && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "#6B7280",
                    fontFamily: "var(--font-varela)",
                  }}
                >
                  Ideal for tutorials & lessons
                </p>
              )}
            </div>
            {hasYouTube && (
              <CheckCircle size={20} color="#10B981" weight="fill" />
            )}
          </div>
          <div style={{ position: "relative" }}>
            <LinkIcon
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
              size={16}
              color="#94A3B8"
            />
            <input
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              placeholder="Paste link here..."
              style={{
                width: "100%",
                height: "44px",
                background: "white",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "0 12px 0 36px",
                fontSize: "14px",
                outline: "none",
                fontFamily: "var(--font-outfit)",
              }}
            />
          </div>
        </motion.div>

        {/* Document Card */}
        <motion.div whileTap={{ scale: 0.98 }} style={cardStyle(hasDocument)}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={iconBox("#3B82F6")}>
              <FileText size={24} weight="fill" />
            </div>
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#111",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                Upload Document
              </h4>
              {!hasDocument && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "#6B7280",
                    fontFamily: "var(--font-varela)",
                  }}
                >
                  PDF, DOCX, PPTX (Max 50MB)
                </p>
              )}
            </div>
            {hasDocument && (
              <CheckCircle size={20} color="#10B981" weight="fill" />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) =>
              e.target.files[0] && setSelectedFile(e.target.files[0])
            }
            accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
          />
          {!hasDocument ? (
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                width: "100%",
                height: "40px",
                background: "#F8FAFC",
                border: "1px dashed #CBD5E1",
                borderRadius: "12px",
                color: "#64748B",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Choose a file
            </button>
          ) : (
            <div
              style={{
                fontSize: "12px",
                color: "#111",
                fontWeight: 600,
                background: "#F1F5F9",
                padding: "8px 12px",
                borderRadius: "10px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedFile.name}
            </div>
          )}
        </motion.div>

        {/* Audio Card */}
        <motion.div whileTap={{ scale: 0.98 }} style={cardStyle(hasAudio)}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={iconBox("#F59E0B")}>
              <Mic size={24} weight="fill" />
            </div>
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#111",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                Lecture Audio
              </h4>
              {!hasAudio && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "#6B7280",
                    fontFamily: "var(--font-varela)",
                  }}
                >
                  Recordings or Voice Notes
                </p>
              )}
            </div>
            {hasAudio && (
              <CheckCircle size={20} color="#10B981" weight="fill" />
            )}
          </div>
          <input
            type="file"
            ref={audioInputRef}
            style={{ display: "none" }}
            onChange={(e) =>
              e.target.files[0] && setSelectedAudio(e.target.files[0])
            }
            accept="audio/*"
          />
          {!hasAudio ? (
            <button
              onClick={() => audioInputRef.current.click()}
              style={{
                width: "100%",
                height: "40px",
                background: "#F8FAFC",
                border: "1px dashed #CBD5E1",
                borderRadius: "12px",
                color: "#64748B",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Choose audio
            </button>
          ) : (
            <div
              style={{
                fontSize: "12px",
                color: "#111",
                fontWeight: 600,
                background: "#F1F5F9",
                padding: "8px 12px",
                borderRadius: "10px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedAudio.name}
            </div>
          )}
        </motion.div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: "auto",
        }}
      >
        <PremiumButton
          onClick={onContinue}
          style={{
            width: "100%",
            height: "56px",
            borderRadius: "20px",
            fontSize: "16px",
          }}
          disabled={saving}
        >
          {saving ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              <span>
                {hasAnySource ? "Prepare My Study" : "Go to Dashboard"}
              </span>
              <ArrowRight size={18} />
            </div>
          )}
        </PremiumButton>
        <button
          onClick={onSkip}
          style={{
            background: "none",
            border: "none",
            color: "#94A3B8",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
