import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  universitySlugFromName,
  departmentSlugFromLabel,
  normalizeCourseCode,
} from "../lib/curriculumSlugs";
import { uploadMaterial, addYoutubeMaterial } from "../services/materialsService";
import { clearLuterCaches } from "../utils/cacheUtils";
import { Search, ChevronLeft, ChevronRight, ChevronDown, Globe, Building, School, Briefcase, Check, MapPin, FileText as FileTextIcon, Camera, Clipboard, Youtube } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   NIGERIA — MAPBOX BOUNDING BOX + TOKEN
   bbox: [minLng, minLat, maxLng, maxLat]
   Nigeria: 2.676932°E to 14.678014°E, 4.240594°N to 13.865924°N
───────────────────────────────────────────────────────────────── */
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiaGVpc29sbHkiLCJhIjoiY21wc3Z0ang5MG5ybzJxcjF6djk0MDZiayJ9.SmwYAfMPqsJnD8snIKMz1Q";
const NIGERIA_BBOX = "2.676932,4.240594,14.678014,13.865924";
const NIGERIA_CENTER = "7.49508,9.05785"; // Abuja (lng,lat)

/* ─────────────────────────────────────────────────────────────────
   COMPREHENSIVE NIGERIAN UNIVERSITIES LIST
───────────────────────────────────────────────────────────────── */
const NIGERIA_UNIS = [
  // Federal Universities
  "Abubakar Tafawa Balewa University, Bauchi",
  "Ahmadu Bello University, Zaria",
  "Bayero University, Kano",
  "Federal University, Dutse",
  "Federal University, Dutsin-Ma",
  "Federal University, Gashua",
  "Federal University, Gusau",
  "Federal University, Kashere",
  "Federal University, Lafia",
  "Federal University, Lokoja",
  "Federal University, Ndufu-Alike",
  "Federal University, Otuoke",
  "Federal University, Oye-Ekiti",
  "Federal University, Wukari",
  "Federal University of Agriculture, Abeokuta",
  "Federal University of Agriculture, Makurdi",
  "Federal University of Petroleum Resources, Effurun",
  "Federal University of Technology, Akure",
  "Federal University of Technology, Minna",
  "Federal University of Technology, Owerri",
  "Michael Okpara University of Agriculture, Umudike",
  "Modibbo Adama University of Technology, Yola",
  "National Open University of Nigeria, Abuja",
  "Nigerian Defence Academy, Kaduna",
  "Nnamdi Azikiwe University, Awka",
  "Obafemi Awolowo University, Ile-Ife",
  "University of Abuja",
  "University of Agriculture, Abeokuta",
  "University of Benin",
  "University of Calabar",
  "University of Ibadan",
  "University of Ilorin",
  "University of Jos",
  "University of Lagos",
  "University of Maiduguri",
  "University of Nigeria, Nsukka",
  "University of Port Harcourt",
  "University of Uyo",
  "Usmanu Danfodiyo University, Sokoto",
  // State Universities
  "Abia State University, Uturu",
  "Adamawa State University, Mubi",
  "Adekunle Ajasin University, Akungba",
  "Ambrose Alli University, Ekpoma",
  "Anambra State University, Uli",
  "Benue State University, Makurdi",
  "Bukar Abba Ibrahim University, Damaturu",
  "Cross River University of Technology, Calabar",
  "Delta State University, Abraka",
  "Ebonyi State University, Abakaliki",
  "Ekiti State University, Ado-Ekiti",
  "Enugu State University of Science and Technology",
  "Gombe State University",
  "Ibrahim Badamasi Babangida University, Lapai",
  "Ignatius Ajuru University of Education, Port Harcourt",
  "Imo State University, Owerri",
  "Jigawa State University, Kafin Hausa",
  "Kaduna State University",
  "Kano University of Science and Technology, Wudil",
  "Kebbi State University of Science and Technology, Aliero",
  "Kogi State University, Anyigba",
  "Kwara State University, Malete",
  "Lagos State University, Ojo",
  "Nasarawa State University, Keffi",
  "Niger Delta University, Wilberforce Island",
  "Northwest University, Kano",
  "Ogun State University (Olabisi Onabanjo University), Ago-Iwoye",
  "Ondo State University of Science and Technology, Okitipupa",
  "Osun State University, Osogbo",
  "Plateau State University, Bokkos",
  "Rivers State University, Port Harcourt",
  "Sokoto State University",
  "Tai Solarin University of Education, Ijebu-Ode",
  "Taraba State University, Jalingo",
  "Umar Musa Yar'Adua University, Katsina",
  "Yobe State University, Damaturu",
  "Zamfara State University, Talata Mafara",
  // Private Universities
  "Achievers University, Owo",
  "Adeleke University, Ede",
  "Afe Babalola University, Ado-Ekiti",
  "African University of Science and Technology, Abuja",
  "Al-Hikmah University, Ilorin",
  "Al-Qalam University, Katsina",
  "Babcock University, Ilishan-Remo",
  "Baze University, Abuja",
  "Bells University of Technology, Ota",
  "Benson Idahosa University, Benin City",
  "Bingham University, New Karu",
  "Bowen University, Iwo",
  "Caleb University, Lagos",
  "Caritas University, Enugu",
  "CETEP City University, Lagos",
  "Chrisland University, Owode",
  "Christopher University, Mowe",
  "Covenant University, Ota",
  "Crawford University, Igbesa",
  "Crescent University, Abeokuta",
  "Dominican University, Ibadan",
  "Edwin Clark University, Kiagbodo",
  "Elizade University, Ilara-Mokin",
  "Evangel University, Akaeze",
  "Fountain University, Osogbo",
  "Glorious Vision University, Ogwa",
  "Gregory University, Uturu",
  "Hallmark University, Ijebu-Itele",
  "Hezekiah University, Umudi",
  "Igbinedion University, Okada",
  "Joseph Ayo Babalola University, Ikeji-Arakeji",
  "Kings University, Ode-Omu",
  "Kola Daisi University, Ibadan",
  "Kwararafa University, Wukari",
  "Landmark University, Omu-Aran",
  "Lead City University, Ibadan",
  "McPherson University, Seriki Sotayo",
  "Michael and Cecilia Ibru University",
  "Mountain Top University, Ibafo",
  "Nexus University, Abuja",
  "Nigerian Turkish Nile University, Abuja",
  "Novena University, Ogume",
  "Oduduwa University, Ipetumodu",
  "Pan-Atlantic University, Lagos",
  "Paul University, Awka",
  "Philomath University, Kuje",
  "Precious Cornerstone University, Ibadan",
  "Redeemer's University, Ede",
  "Renaissance University, Ugbawka",
  "Rhema University, Obeama-Asa",
  "Ritman University, Ikot Ekpene",
  "Robert Mensah University",
  "Salem University, Lokoja",
  "Samuel Adegboyega University, Ogwa",
  "Spiritan University, Nneochi",
  "Ss. Peter and Paul University, Abia",
  "Summit University, Offa",
  "Thomas Adewumi University, Oko",
  "Toma University, Abeokuta",
  "Tansian University, Umunya",
  "Trinity University, Ogun State",
  "Wellspring University, Evbuobanosa",
  "Wesley University, Ondo",
  "Western Delta University, Oghara",
  "Wigwe University, Isiokpo",
];

/* ─────────────────────────────────────────────────────────────────
   STATIC DEGREES
───────────────────────────────────────────────────────────────── */
const STATIC_DEGREES = [
  "Computer Science",
  "Mechanical Engineering",
  "Chemical Engineering",
  "International Relations and National Security Studies",
  "Civil Engineering",
  "Microbiology",
  "Food Science",
  "Computer and Information Sciences",
  "Physics",
  "Chemistry",
  "Economics",
  "Law",
  "Medicine & Surgery",
  "Electrical Engineering",
  "Mathematics",
  "Biochemistry",
  "Business Administration",
  "Mass Communication",
  "Architecture",
  "Accounting",
  "Pharmacy",
  "Nursing Science",
  "Political Science",
  "Sociology",
  "English Language",
  "Statistics",
  "Geology",
  "Agriculture",
  "Veterinary Medicine",
  "Psychology",
];

const LANGUAGES = [
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "yo", label: "Yorùbá",   flag: "🇳🇬" },
  { code: "ig", label: "Igbo",     flag: "🇳🇬" },
  { code: "ha", label: "Hausa",    flag: "🇳🇬" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español",  flag: "🇪🇸" },
];

/* ─────────────────────────────────────────────────────────────────
   FALLBACK COURSES GENERATOR
───────────────────────────────────────────────────────────────── */
const generateFallbackCourses = (major, level, semester) => {
  const cleanMajor = (major || "").toLowerCase();
  const lvl = level || "100";
  const sem = semester || "1st";

  const csCourses = {
    "100": {
      "1st": [
        { code: "CSC 101", name: "Introduction to Computer Science" },
        { code: "MTH 101", name: "Elementary Mathematics I" },
        { code: "PHY 101", name: "General Physics I" },
        { code: "GST 111", name: "Communication in English I" },
      ],
      "2nd": [
        { code: "CSC 102", name: "Introduction to Problem Solving" },
        { code: "MTH 102", name: "Elementary Mathematics II" },
        { code: "PHY 102", name: "General Physics II" },
        { code: "GST 112", name: "Logic & Critical Thinking" },
      ],
    },
    "200": {
      "1st": [
        { code: "CSC 201", name: "Computer Programming I" },
        { code: "CSC 203", name: "Data Structures & Algorithms" },
        { code: "MTH 201", name: "Linear Algebra" },
        { code: "GST 201", name: "Nigerian Peoples & Culture" },
      ],
      "2nd": [
        { code: "CSC 202", name: "Computer Programming II" },
        { code: "CSC 204", name: "Computer Organization & Architecture" },
        { code: "MTH 202", name: "Discrete Structures" },
        { code: "CSC 206", name: "Numerical Computing" },
      ],
    },
    "300": {
      "1st": [
        { code: "CSC 301", name: "Operating Systems" },
        { code: "CSC 303", name: "Database Management Systems" },
        { code: "CSC 305", name: "Software Engineering I" },
        { code: "MTH 301", name: "Numerical Methods" },
      ],
      "2nd": [
        { code: "CSC 302", name: "Computer Networks" },
        { code: "CSC 304", name: "Compiler Construction" },
        { code: "CSC 306", name: "Artificial Intelligence" },
        { code: "CSC 308", name: "Human-Computer Interaction" },
      ],
    },
    "400": {
      "1st": [
        { code: "CSC 401", name: "Final Year Project I" },
        { code: "CSC 403", name: "Distributed Systems" },
        { code: "CSC 405", name: "Machine Learning" },
        { code: "CSC 407", name: "Information Security" },
      ],
      "2nd": [
        { code: "CSC 402", name: "Final Year Project II" },
        { code: "CSC 404", name: "Cybersecurity" },
        { code: "CSC 406", name: "Cloud Computing" },
        { code: "CSC 408", name: "Mobile Application Development" },
      ],
    },
    "500": {
      "1st": [
        { code: "CSC 501", name: "Research Methodology" },
        { code: "CSC 503", name: "Advanced Machine Learning" },
      ],
      "2nd": [
        { code: "CSC 502", name: "Thesis" },
        { code: "CSC 504", name: "Advanced Database Systems" },
      ],
    },
  };

  if (
    cleanMajor.includes("computer") ||
    cleanMajor.includes("software") ||
    cleanMajor.includes("information")
  ) {
    return csCourses[lvl]?.[sem] || csCourses["100"]["1st"];
  }

  const prefix = (major || "GEN").slice(0, 3).toUpperCase();
  return [
    { code: `${prefix} ${lvl}01`, name: `Introduction to ${major || "Studies"} I` },
    { code: `${prefix} ${lvl}03`, name: `Foundations of ${major || "Subject"}` },
    { code: `${prefix} ${lvl}05`, name: `${major || "Studies"} Seminar` },
    { code: `GST ${lvl}11`, name: sem === "1st" ? "Communication in English" : "Logic and Philosophy" },
  ];
};

/* ─────────────────────────────────────────────────────────────────
   LUTER DESIGN TOKENS
   Primary colors from the brand spec:
   #F9FAFB (white-ish), #98FF98 (mint), #FFD2A6 (peach), #C4B5FD (lavender)
───────────────────────────────────────────────────────────────── */
const C = {
  white:    "#F9FAFB",
  mint:     "#98FF98",
  peach:    "#FFD2A6",
  lavender: "#C4B5FD",
  // Landing page button exact style
  btnBg:        "#C4B5FD",         // lavender
  btnBorder:    "rgba(167,139,250,1)", // a78bfa
  btnText:      "#2E1065",
  btnHoverBg:   "#DDD6FE",
  // Misc
  nearBlack:  "#111827",
  darkGray:   "#374151",
  midGray:    "#6B7280",
  lightGray:  "#9CA3AF",
  divider:    "#E5E7EB",
  divider2:   "#F3F4F6",
  blueFocus:  "#93C5FD",
  success:    "#10B981",
  danger:     "#EF4444",
  brand:      "#7C39F6",   // vivid purple accent
};

/* Mapbox Geocoding — Nigeria locked */
async function searchNigeriaSchools(query) {
  const term = (query || "").trim();
  const q    = term || "university";

  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    autocomplete:  "true",
    limit:         "10",
    types:         "poi,place",
    country:       "NG",                // Nigeria only
    bbox:          NIGERIA_BBOX,
    proximity:     NIGERIA_CENTER,
  });

  const encoded = encodeURIComponent(q);
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?${params}`
  );
  if (!res.ok) throw new Error(`Mapbox ${res.status}`);
  const data = await res.json();
  return (data.features || [])
    .filter((f) => f.place_name)
    .map((f) => {
      const [lng, lat] = f.center || [];
      const name = f.text || f.place_name.split(",")[0];
      const address = f.place_name.replace(`${name}, `, "").trim();
      return { id: f.id, name, address, lat, lng };
    });
}

/* ─────────────────────────────────────────────────────────────────
   STEP PROGRESS
───────────────────────────────────────────────────────────────── */
const STEP_PCT = {
  1: 5, 2: 18, 3: 28, 4: 38, 5: 48,
  6: 57, 7: 66, 8: 74, 9: 82, 10: 90, 11: 96,
};

/* ─────────────────────────────────────────────────────────────────
   ICONS (inline SVG)
───────────────────────────────────────────────────────────────── */
const Ico = {
  Search,
  ChevLeft: ChevronLeft,
  ChevRight: ChevronRight,
  ChevDown: ChevronDown,
  Globe,
  Building,
  School,
  Briefcase,
  Check,
  Pin: MapPin,
  FilePDF: (props) => <FileTextIcon stroke="#EF4444" {...props} />,
  PPT: (props) => <FileTextIcon stroke="#F97316" {...props} />,
  Youtube: (props) => <Youtube color="#EF4444" {...props} />,
  Camera,
  Paste: Clipboard,
};

/* ─────────────────────────────────────────────────────────────────
   LUTER PREMIUM BUTTON — matches landing page exactly
───────────────────────────────────────────────────────────────── */
function LuterBtn({ children, onClick, disabled, variant = "primary", fullWidth = true }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);

  const isPrimary = variant === "primary";

  const bg = disabled
    ? "#F3F4F6"
    : isPrimary
    ? hov ? C.btnHoverBg : C.btnBg
    : "transparent";

  const border = disabled
    ? "1px solid #E5E7EB"
    : isPrimary
    ? `1px solid ${C.btnBorder}`
    : `1px solid ${hov ? C.btnBorder : C.divider}`;

  const borderBottom = disabled
    ? "1px solid #E5E7EB"
    : isPrimary
    ? press ? `1px solid ${C.btnBorder}` : `5px solid ${C.btnBorder}`
    : press ? `1px solid ${C.divider}` : `5px solid ${C.divider}`;

  const color = disabled ? "#9CA3AF" : isPrimary ? C.btnText : C.nearBlack;
  const transform = disabled ? "none" : press ? "translateY(3px)" : hov ? "translateY(-2px)" : "none";
  const shadow = disabled || !isPrimary ? "none"
    : hov ? "0 10px 20px rgba(167,139,250,0.30)" : "0 4px 10px rgba(167,139,250,0.16)";

  return (
    <button
      className="ob-btn"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => !disabled && setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: fullWidth ? "100%" : "auto",
        height: "56px", padding: "0 32px",
        borderRadius: "14px",
        background: bg, color, border, borderBottom,
        fontSize: "17px", fontWeight: 700,
        fontFamily: "'Outfit', var(--font-sans), sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        transform, boxShadow: shadow,
        transition: "all 0.15s cubic-bezier(0.4,0,0.2,1)",
        letterSpacing: "-0.01em", boxSizing: "border-box", gap: "8px",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   OTHER UI ATOMS
───────────────────────────────────────────────────────────────── */
const PillInput = ({ type = "text", placeholder, value, onChange, onKeyDown, autoFocus, min, max }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      className="ob-input"
      type={type} placeholder={placeholder} value={value}
      onChange={onChange} onKeyDown={onKeyDown} autoFocus={autoFocus}
      min={min} max={max}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: "100%", height: "60px", borderRadius: "14px",
        border: `2px solid ${focused || value ? C.blueFocus : C.divider}`,
        outline: "none", textAlign: "center", fontSize: "18px",
        color: value ? C.nearBlack : C.midGray, fontFamily: "inherit",
        padding: "0 24px", background: "#fff",
        transition: "border-color 0.2s ease", boxSizing: "border-box",
      }}
    />
  );
};

const SearchBar = ({ value, onChange, placeholder, autoFocus }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="ob-search-wrap" style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
        <Ico.Search />
      </div>
      <input
        className="ob-search-input"
        type="text" placeholder={placeholder} value={value}
        onChange={onChange} autoFocus={autoFocus}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", height: "54px", borderRadius: "14px",
          border: `2px solid ${focused ? C.blueFocus : C.divider}`,
          outline: "none", paddingLeft: "46px", paddingRight: "16px",
          fontSize: "16px", color: C.midGray, fontFamily: "inherit",
          background: "#fff", transition: "border-color 0.2s ease", boxSizing: "border-box",
        }}
      />
    </div>
  );
};

const OptionPill = ({ children, icon, onClick, selected }) => (
  <button className="ob-option-pill" onClick={onClick} style={{
    width: "100%", height: "60px", borderRadius: "14px",
    border: `2px solid ${selected ? C.btnBorder : C.divider}`,
    borderBottom: selected ? `5px solid ${C.btnBorder}` : `5px solid ${C.divider}`,
    background: selected ? "rgba(196,181,253,0.12)" : "#fff",
    color: selected ? C.btnText : C.nearBlack,
    fontSize: "17px", fontWeight: 600, fontFamily: "inherit",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
    cursor: "pointer", transition: "all 0.15s ease",
  }}>
    {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}
    {children}
  </button>
);

const Spinner = ({ size = 26, color = C.brand }) => (
  <div style={{
    width: size, height: size,
    border: `3px solid ${C.divider}`, borderTopColor: color,
    borderRadius: "50%", animation: "ob-spin 0.72s linear infinite",
  }} />
);

const Animated = ({ children, stepKey }) => {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVis(true));
    return () => cancelAnimationFrame(id);
  }, [stepKey]);
  return (
    <div style={{
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.24s ease, transform 0.24s ease", width: "100%",
    }}>
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   LANGUAGE SWITCHER
───────────────────────────────────────────────────────────────── */
function LangSwitcher({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cur = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderBottom: "3px solid rgba(255,255,255,0.25)",
          borderRadius: "10px", padding: "6px 12px 4px 10px",
          cursor: "pointer", color: C.nearBlack,
          fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
      >
        <Ico.Globe />
        <span>{cur.flag}</span>
        <span>{cur.code.toUpperCase()}</span>
        <Ico.ChevDown />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "white", borderRadius: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          overflow: "hidden", minWidth: "150px", zIndex: 100,
          border: `1px solid ${C.divider}`,
        }}>
          {LANGUAGES.map((l, i) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 16px",
                background: l.code === lang ? "rgba(196,181,253,0.1)" : "white",
                border: "none", borderBottom: i < LANGUAGES.length - 1 ? `1px solid ${C.divider2}` : "none",
                cursor: "pointer", fontFamily: "inherit", fontSize: "14px",
                fontWeight: l.code === lang ? 700 : 500,
                color: l.code === lang ? C.btnText : C.nearBlack,
                textAlign: "left", transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => { if (l.code !== lang) e.currentTarget.style.background = C.divider2; }}
              onMouseLeave={(e) => { if (l.code !== lang) e.currentTarget.style.background = "white"; }}
            >
              <span style={{ fontSize: "17px" }}>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function Onboarding() {
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [lang, setLang]     = useState("en");

  /* Profile */
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [userName, setUserName]     = useState("");
  const [age, setAge]               = useState("");
  const [purpose, setPurpose]       = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree]         = useState("");
  const [level, setLevel]           = useState("100");
  const [semester, setSemester]     = useState("First Semester");
  const [selectedCourses, setSelectedCourses] = useState([]);

  /* Username */
  const [usernameAvail, setUsernameAvail]   = useState(true);
  const [checkingUser, setCheckingUser]     = useState(false);

  /* Uploads */
  const [uploadType, setUploadType]   = useState(null);
  const [pastedNotes, setPastedNotes] = useState("");
  const [youtubeUrl, setYoutubeUrl]   = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showMore, setShowMore]         = useState(false);

  /* University search (Mapbox) */
  const [uniSearch, setUniSearch]       = useState("");
  const [mapboxResults, setMapboxResults] = useState([]);
  const [uniLoading, setUniLoading]     = useState(false);
  const uniTimer = useRef(null);

  /* Degree search */
  const [degreeSearch, setDegreeSearch] = useState("");

  const fileInputRef = useRef(null);

  /* ── Social pre-fill ── */
  useEffect(() => {
    const go = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const full = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
        if (full) {
          const p = full.split(" ");
          if (p[0]) setFirstName(p[0]);
          if (p.length > 1) setLastName(p.slice(1).join(" "));
        }
      } catch { /* silent */ }
    };
    go();
  }, []);

  /* ── Username debounce ── */
  useEffect(() => {
    const c = userName.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (c !== userName) { setUserName(c); return; }
    if (!c || c.length < 3) { setUsernameAvail(true); setCheckingUser(false); return; }
    setCheckingUser(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.from("profiles").select("username").eq("username", c).maybeSingle();
        setUsernameAvail(!data);
      } catch { /* silent */ } finally { setCheckingUser(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [userName]);

  /* ── University search — Nigeria-only Mapbox + local list ── */
  useEffect(() => {
    if (step !== 6) return;
    clearTimeout(uniTimer.current);
    const term = uniSearch.trim().toLowerCase();

    // Always show filtered local list immediately
    // Then augment with Mapbox results
    setUniLoading(true);

    uniTimer.current = setTimeout(async () => {
      try {
        const mapbox = await searchNigeriaSchools(uniSearch.trim() || "university college polytechnic");
        setMapboxResults(mapbox);
      } catch {
        setMapboxResults([]);
      } finally {
        setUniLoading(false);
      }
    }, term ? 350 : 100);

    return () => clearTimeout(uniTimer.current);
  }, [uniSearch, step]);

  /* Merge local + Mapbox, deduplicate, filter by search */
  const uniResults = useMemo(() => {
    const term = uniSearch.trim().toLowerCase();

    // Filter local list
    const localFiltered = term
      ? NIGERIA_UNIS.filter((u) => u.toLowerCase().includes(term))
      : NIGERIA_UNIS.slice(0, 8);

    // Map local to uniform shape
    const localShaped = localFiltered.slice(0, 8).map((u) => ({
      id:   u,
      name: u.split(",")[0].trim(),
      address: u.includes(",") ? u.substring(u.indexOf(",") + 1).trim() : "Nigeria",
      isLocal: true,
    }));

    // Merge Mapbox results (avoid duplicates by name stem)
    const localNames = new Set(localShaped.map((u) => u.name.toLowerCase()));
    const mapboxFiltered = mapboxResults.filter(
      (m) => !localNames.has(m.name.toLowerCase())
    ).slice(0, 5);

    return [...localShaped, ...mapboxFiltered];
  }, [uniSearch, mapboxResults]);

  /* ── Classmates seed ── */
  const classmates = useCallback((name) => {
    if (!name) return 0;
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return Math.abs(h % 1800) + 42;
  }, []);

  /* ── Filtered degrees ── */
  const filteredDegrees = useMemo(() => {
    const t = degreeSearch.toLowerCase().trim();
    return t ? STATIC_DEGREES.filter((d) => d.toLowerCase().includes(t)) : STATIC_DEGREES;
  }, [degreeSearch]);

  /* ── Load courses on step 10 — Admin DB first, then fallback ── */
  useEffect(() => {
    if (step !== 10) return;
    const load = async () => {
      setLoading(true);
      setSelectedCourses([]);
      const uniSlug  = universitySlugFromName(university);
      const deptSlug = departmentSlugFromLabel(degree);
      const semNorm  = semester === "First Semester" ? "1st" : "2nd";

      try {
        // 1) Try exact match: status=live
        let { data, error } = await supabase
          .from("curriculum_offers")
          .select("courses, status")
          .eq("university_slug", uniSlug)
          .eq("department_slug", deptSlug)
          .eq("level", String(level))
          .eq("semester", semNorm)
          .in("status", ["live", "draft"])   // accept draft too
          .order("status", { ascending: true }) // live before draft
          .limit(1)
          .maybeSingle();

        if (!error && data?.courses?.length > 0) {
          setSelectedCourses(
            data.courses.map((c) => ({
              code: normalizeCourseCode(c.code || c.course_code || ""),
              name: c.name || c.title || c.course_title || "",
              selected: true,
            }))
          );
        } else {
          // 2) Looser match: just university + department
          const { data: loose } = await supabase
            .from("curriculum_offers")
            .select("courses, level, semester")
            .eq("university_slug", uniSlug)
            .eq("department_slug", deptSlug)
            .in("status", ["live", "draft"])
            .limit(1)
            .maybeSingle();

          if (loose?.courses?.length > 0) {
            setSelectedCourses(
              loose.courses.map((c) => ({
                code: normalizeCourseCode(c.code || c.course_code || ""),
                name: c.name || c.title || c.course_title || "",
                selected: true,
              }))
            );
          } else {
            // 3) Smart fallback
            const fb = generateFallbackCourses(degree, level, semNorm);
            setSelectedCourses(fb.map((c) => ({ ...c, selected: true })));
          }
        }
      } catch {
        const fb = generateFallbackCourses(degree, level, semester === "First Semester" ? "1st" : "2nd");
        setSelectedCourses(fb.map((c) => ({ ...c, selected: true })));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [step, university, degree, level, semester]);

  /* ── Navigation ── */
  const nextStep = useCallback(() => {
    if (step === 1 && (!age || isNaN(age) || Number(age) < 5)) return;
    if (step === 2 && !firstName.trim()) return;
    if (step === 3 && !lastName.trim()) return;
    if (step === 4 && (!userName || userName.length < 3 || !usernameAvail || checkingUser)) return;
    if (step === 6 && !university) return;
    if (step === 7 && !degree) return;
    setStep((p) => p + 1);
  }, [step, age, firstName, lastName, userName, usernameAvail, checkingUser, university, degree]);

  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  const handleLastContinue = () => {
    if (!userName.trim()) {
      const base = `${firstName.toLowerCase().trim()}_${lastName.toLowerCase().trim()}`.replace(/[^a-z0-9_]/g, "");
      setUserName(base || "student");
    }
    nextStep();
  };

  /* ── Finish ── */
  const handleFinish = async (skipUpload = false) => {
    setLoading(true);
    setUploadStatus("Saving your profile…");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session.");
      const isUni  = purpose === "University";
      const semNorm = semester === "First Semester" ? "1st" : "2nd";

      const { error: pe } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        username: userName.trim().toLowerCase(),
        role: isUni ? "student" : "solo_learner",
        is_university_user: isUni,
        university: isUni ? university : null,
        level: isUni ? String(level) : null,
        semester: isUni ? semNorm : null,
        faculty: isUni ? degree : null,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (pe) throw pe;

      if (isUni) {
        const uniSlug  = universitySlugFromName(university);
        const deptSlug = departmentSlugFromLabel(degree);
        await Promise.all(
          selectedCourses.filter((c) => c.selected).map(async (course) => {
            let cid;
            const { data: ex } = await supabase.from("courses").select("id")
              .eq("code", course.code).eq("university_slug", uniSlug).maybeSingle();
            if (ex) {
              cid = ex.id;
            } else {
              const { data: nc } = await supabase.from("courses").insert({
                code: course.code, name: course.name, faculty: degree,
                university_slug: uniSlug, department_slug: deptSlug,
                education_level: level, semester: semNorm,
              }).select("id").single();
              if (nc) cid = nc.id;
            }
            if (cid) {
              await supabase.from("user_courses").upsert({
                user_id: user.id, course_id: cid,
                semester: semNorm, enrollment_source: "onboarding",
              }, { onConflict: "user_id,course_id" });
            }
          })
        );
      }

      let createdMaterialId = null;
      if (!skipUpload) {
        setUploadStatus("Uploading material…");
        if (uploadType === "youtube" && youtubeUrl.trim()) {
          const mat = await addYoutubeMaterial({ url: youtubeUrl.trim(), userId: user.id, title: `Onboarding Video - ${new Date().toLocaleDateString()}` });
          if (mat) createdMaterialId = mat.id;
        } else if (uploadType === "paste" && pastedNotes.trim()) {
          const blob = new Blob([pastedNotes], { type: "text/plain" });
          const mat = await uploadMaterial({ file: new File([blob], "Notes.txt", { type: "text/plain" }), userId: user.id, title: "Pasted Notes", type: "docx" });
          if (mat) createdMaterialId = mat.id;
        } else if (selectedFile) {
          const ext = selectedFile.name.split(".").pop().toLowerCase();
          const t = ["docx", "doc"].includes(ext) ? "docx" : ext === "pdf" ? "pdf" : "pptx";
          const mat = await uploadMaterial({ file: selectedFile, userId: user.id, title: selectedFile.name, type: t });
          if (mat) createdMaterialId = mat.id;
        }
      }

      await supabase.from("user_stats").upsert({ user_id: user.id, lives: 3, total_xp: 0, streak_days: 0 }, { onConflict: "user_id" });
      setUploadStatus("All done!");
      clearLuterCaches();
      setTimeout(() => { 
        if (createdMaterialId) {
          window.location.href = `/dashboard/workstation?materialId=${encodeURIComponent(createdMaterialId)}`;
        } else {
          window.location.href = "/dashboard"; 
        }
      }, 700);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  /* ── Titles ── */
  const TITLES = {
    1:  "How old are you?",
    2:  "What's your first name?",
    3:  "…and your last name?",
    4:  "Choose your username",
    5:  `${firstName ? `${firstName}, what` : "What"} brings you to Luter?`,
    6:  "What university do you go to?",
    7:  "What degree are you studying?",
    8:  "What level are you in?",
    9:  "Which semester?",
    10: `Your ${degree || "course"} ${level}L courses`,
    11: "Upload learning material and we'll learn it together",
  };

  const pct = STEP_PCT[step] || 5;

  /* ─────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────── */
  return (
    <div className="ob-page" style={{
      minHeight: "100vh", width: "100%",
      /* Luter palette background: white → mint → peach → lavender gradients */
      background: `
        radial-gradient(ellipse 90% 70% at 0% 0%,   rgba(196,181,253,0.55) 0%, transparent 55%),
        radial-gradient(ellipse 80% 60% at 100% 0%,  rgba(152,255,152,0.45) 0%, transparent 50%),
        radial-gradient(ellipse 70% 60% at 100% 100%,rgba(255,210,166,0.50) 0%, transparent 55%),
        radial-gradient(ellipse 60% 50% at 0% 100%,  rgba(196,181,253,0.35) 0%, transparent 50%),
        #F9FAFB
      `,
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      boxSizing: "border-box", padding: "0 16px 48px",
    }}>
      <style>{`
        @keyframes ob-spin { to { transform: rotate(360deg); } }
        .ob-page {
          min-height: 100dvh !important;
          overflow-x: clip;
        }
        .ob-shell {
          width: min(100%, 640px);
        }
        .ob-scroll-list {
          scrollbar-width: thin;
          scrollbar-color: rgba(124,57,246,0.2) transparent;
        }
        .ob-title {
          overflow-wrap: anywhere;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 99px; }
        /* Remove number input arrows */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        /* Keep placeholder lowercase */
        input::placeholder { text-transform: none !important; }
        textarea::placeholder { text-transform: none !important; }
        @media (max-width: 900px) {
          .ob-page {
            padding: 0 14px 32px !important;
          }
          .ob-header {
            max-width: 720px !important;
            padding: 18px 0 !important;
          }
          .ob-shell {
            max-width: 600px !important;
            min-height: min(600px, calc(100dvh - 112px)) !important;
            padding: 34px 40px 38px !important;
          }
        }
        @media (max-width: 640px) {
          .ob-page {
            align-items: stretch !important;
            min-height: 100svh !important;
            padding: 0 10px 20px !important;
          }
          .ob-header {
            padding: 14px 2px 12px !important;
          }
          .ob-header img {
            height: 27px !important;
          }
          .ob-shell {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 auto !important;
            border-radius: 22px !important;
            padding: 24px 18px 26px !important;
          }
          .ob-progress-row {
            gap: 10px !important;
            margin-bottom: 20px !important;
          }
          .ob-mascot-row {
            margin-bottom: 10px !important;
          }
          .ob-mascot-row img {
            width: 40px !important;
            height: 40px !important;
          }
          .ob-title {
            font-size: clamp(1.35rem, 6.8vw, 1.8rem) !important;
            line-height: 1.18 !important;
            margin-bottom: 22px !important;
            letter-spacing: 0 !important;
          }
          .ob-input,
          .ob-option-pill {
            height: 52px !important;
            min-height: 52px !important;
            font-size: 15px !important;
            border-radius: 13px !important;
          }
          .ob-btn {
            height: 52px !important;
            padding: 0 18px !important;
            font-size: 15px !important;
            border-radius: 13px !important;
          }
          .ob-search-input {
            height: 50px !important;
            font-size: 14px !important;
          }
          .ob-scroll-list {
            max-height: min(330px, calc(100svh - 320px)) !important;
          }
          .ob-scroll-list > button {
            height: auto !important;
            min-height: 50px !important;
            padding: 10px 12px !important;
            line-height: 1.25 !important;
            white-space: normal !important;
          }
        }
        @media (max-width: 420px) {
          .ob-page {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          .ob-shell {
            padding: 20px 14px 22px !important;
            border-radius: 18px !important;
          }
          .ob-title {
            font-size: clamp(1.22rem, 7vw, 1.55rem) !important;
          }
          .ob-input,
          .ob-option-pill,
          .ob-btn {
            height: 50px !important;
            min-height: 50px !important;
          }
          .ob-option-pill {
            gap: 8px !important;
          }
          .ob-scroll-list {
            max-height: min(300px, calc(100svh - 292px)) !important;
          }
        }
        @media (max-width: 340px) {
          .ob-shell {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          .ob-title {
            font-size: 1.18rem !important;
          }
          .ob-input,
          .ob-search-input,
          .ob-option-pill,
          .ob-btn {
            font-size: 14px !important;
          }
        }
      `}</style>

      {/* ── TOP NAV ── */}
      <header className="ob-header" style={{
        width: "100%", maxWidth: "1100px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "22px 0", boxSizing: "border-box",
      }}>
        {/* Logo */}
        <img
          src="/Header logo.png"
          alt="Luter"
          style={{ height: "30px", width: "auto", objectFit: "contain" }}
          onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
        />
        {/* Language switcher */}
        <LangSwitcher lang={lang} setLang={setLang} />
      </header>

      {/* ── CARD ── */}
      <main className="ob-shell" style={{
        width: "100%", maxWidth: "640px",
        minHeight: "600px",
        background: "rgba(255,255,255,0.90)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderRadius: "28px",
        boxShadow: "0 16px 60px rgba(100,60,200,0.12), 0 4px 12px rgba(0,0,0,0.06)",
        border: "1px solid rgba(196,181,253,0.35)",
        padding: "40px 52px 44px",
        boxSizing: "border-box",
        display: "flex", flexDirection: "column",
        margin: "auto", // This will push it to the vertical center of the flex container
      }}>

        {/* ── Progress bar row ── */}
        <div className="ob-progress-row" style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
          {step > 1 ? (
            <button onClick={prevStep}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexShrink: 0 }}
              aria-label="Back"
            >
              <Ico.ChevLeft />
            </button>
          ) : (
            <div style={{ width: "28px", flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, height: "6px", background: C.divider, borderRadius: "999px", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: `linear-gradient(90deg, ${C.btnBorder} 0%, ${C.lavender} 100%)`,
              borderRadius: "999px", transition: "width 0.35s ease",
            }} />
          </div>
        </div>

        {/* ── Mascot row ── */}
        <div className="ob-mascot-row" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <img
            src="/mascot.png" alt="Lumi"
            style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 2px 8px rgba(167,139,250,0.25)" }}
            onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
          />
          <span style={{ fontSize: "15px", fontWeight: 700, color: C.darkGray }}>Lumi</span>
        </div>

        {/* ── Title ── */}
        <h1 className="ob-title" style={{ fontSize: "27px", fontWeight: 800, color: C.nearBlack, margin: "0 0 30px", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
          {TITLES[step]}
        </h1>

        {/* ── Step body ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Animated stepKey={step}>

            {/* ════ 1 — Age ════ */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <PillInput type="number" placeholder="Enter your age"
                  value={age} onChange={(e) => setAge(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && age && !isNaN(age) && Number(age) >= 5 && nextStep()}
                  autoFocus min="5" max="120"
                />
                <div style={{ height: "8px" }} />
                <LuterBtn onClick={nextStep} disabled={!age || isNaN(age) || Number(age) < 5}>
                  Continue →
                </LuterBtn>
              </div>
            )}

            {/* ════ 2 — First Name ════ */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <PillInput placeholder="Enter your first name"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && firstName.trim() && nextStep()}
                  autoFocus
                />
                <div style={{ height: "8px" }} />
                <LuterBtn onClick={nextStep} disabled={!firstName.trim()}>Continue →</LuterBtn>
              </div>
            )}

            {/* ════ 3 — Last Name ════ */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <PillInput placeholder="Enter your last name"
                  value={lastName} onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lastName.trim() && handleLastContinue()}
                  autoFocus
                />
                <div style={{ height: "8px" }} />
                <LuterBtn onClick={handleLastContinue} disabled={!lastName.trim()}>Continue →</LuterBtn>
              </div>
            )}

            {/* ════ 4 — Username ════ */}
            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <PillInput placeholder="Enter unique username"
                  value={userName} onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && userName.length >= 3 && usernameAvail && !checkingUser && nextStep()}
                  autoFocus
                />
                <div style={{ textAlign: "center", minHeight: "22px" }}>
                  {checkingUser && <span style={{ fontSize: "14px", color: C.lightGray }}>Checking…</span>}
                  {!checkingUser && userName.length >= 3 && (
                    <span style={{ fontSize: "14px", fontWeight: 600, color: usernameAvail ? C.success : C.danger }}>
                      {usernameAvail ? "✓ Username is available" : "✗ Already taken"}
                    </span>
                  )}
                  {!checkingUser && userName.length > 0 && userName.length < 3 && (
                    <span style={{ fontSize: "14px", color: C.lightGray }}>Minimum 3 characters</span>
                  )}
                </div>
                <LuterBtn onClick={nextStep} disabled={!userName || userName.length < 3 || !usernameAvail || checkingUser}>
                  Continue →
                </LuterBtn>
              </div>
            )}

            {/* ════ 5 — Purpose ════ */}
            {step === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <OptionPill icon={<Ico.Building />} selected={purpose === "University"}
                  onClick={() => { setPurpose("University"); setTimeout(() => setStep(6), 180); }}>
                  University
                </OptionPill>
                <OptionPill icon={<Ico.School />} selected={purpose === "School"}
                  onClick={() => { setPurpose("School"); setUniversity("School"); setDegree("School"); setTimeout(() => setStep(9), 180); }}>
                  School
                </OptionPill>
                <OptionPill icon={<Ico.Briefcase />} selected={purpose === "Work"}
                  onClick={() => { setPurpose("Work"); setUniversity("Work"); setDegree("Work"); setTimeout(() => setStep(9), 180); }}>
                  Work
                </OptionPill>
                <button
                  onClick={() => { setPurpose("Other"); setUniversity("Other"); setDegree("Other"); setTimeout(() => setStep(9), 180); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "16px", color: C.midGray, padding: "12px 0", fontFamily: "inherit" }}>
                  Other
                </button>
              </div>
            )}

            {/* ════ 6 — University (Nigeria Mapbox + local list) ════ */}
            {step === 6 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: "12px" }}>
                  <SearchBar
                    value={uniSearch}
                    onChange={(e) => setUniSearch(e.target.value)}
                    placeholder="Search Nigerian university…"
                    autoFocus
                  />
                </div>
                {uniLoading && !uniResults.length && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: "10px" }}>
                    <Spinner size={20} />
                    <span style={{ fontSize: "13px", color: C.lightGray }}>Searching…</span>
                  </div>
                )}
                <div className="ob-scroll-list" style={{ maxHeight: "360px", overflowY: "auto" }}>
                  {uniResults.length > 0 && uniResults.map((uni, i) => (
                    <div key={uni.id}
                      onClick={() => { setUniversity(uni.name); setUniSearch(""); setStep(7); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "15px 6px",
                        borderBottom: i < uniResults.length - 1 ? `1px solid ${C.divider2}` : "none",
                        cursor: "pointer", borderRadius: "10px", transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                        <div style={{ color: C.lightGray, flexShrink: 0, marginTop: "3px" }}><Ico.Building /></div>
                        <div>
                          <div style={{ fontSize: "15px", fontWeight: 700, color: C.nearBlack, lineHeight: 1.3 }}>{uni.name}</div>
                          {uni.address && (
                            <div style={{ fontSize: "13px", color: C.lightGray, marginTop: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Ico.Pin />
                              {uni.address.length > 60 ? uni.address.slice(0, 60) + "…" : uni.address}
                            </div>
                          )}
                          <div style={{ fontSize: "13px", fontWeight: 600, color: C.brand, marginTop: "3px" }}>
                            {classmates(uni.name)} classmates
                          </div>
                        </div>
                      </div>
                      <Ico.ChevRight />
                    </div>
                  ))}
                  {uniResults.length === 0 && !uniLoading && uniSearch.trim() && (
                    <div
                      onClick={() => { setUniversity(uniSearch.trim()); setUniSearch(""); setStep(7); }}
                      style={{ padding: "20px 0", textAlign: "center", cursor: "pointer" }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 600, color: C.brand }}>Add: "{uniSearch}"</div>
                      <div style={{ fontSize: "13px", color: C.lightGray, marginTop: "4px" }}>Tap to continue with this name</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════ 7 — Degree ════ */}
            {step === 7 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: "12px" }}>
                  <SearchBar
                    value={degreeSearch}
                    onChange={(e) => setDegreeSearch(e.target.value)}
                    placeholder="e.g. Computer Science, Law…"
                    autoFocus
                  />
                </div>
                <div className="ob-scroll-list" style={{ maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "7px" }}>
                  {filteredDegrees.length > 0 ? (
                    filteredDegrees.map((deg) => (
                      <button key={deg}
                        onClick={() => { setDegree(deg); setDegreeSearch(""); nextStep(); }}
                        style={{
                          width: "100%", height: "54px", borderRadius: "14px",
                          border: `2px solid ${C.divider}`,
                          borderBottom: `5px solid ${C.divider}`,
                          background: "#fff", color: C.nearBlack,
                          fontSize: "16px", fontWeight: 600, fontFamily: "inherit",
                          cursor: "pointer", textAlign: "center", flexShrink: 0,
                          transition: "all 0.13s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = C.btnBorder;
                          e.currentTarget.style.borderBottomColor = C.btnBorder;
                          e.currentTarget.style.background = "rgba(196,181,253,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = C.divider;
                          e.currentTarget.style.borderBottomColor = C.divider;
                          e.currentTarget.style.background = "#fff";
                        }}
                      >
                        {deg}
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() => { setDegree(degreeSearch); setDegreeSearch(""); nextStep(); }}
                      style={{ width: "100%", height: "54px", borderRadius: "14px", border: `2px solid ${C.btnBorder}`, borderBottom: `5px solid ${C.btnBorder}`, background: "rgba(196,181,253,0.1)", color: C.btnText, fontSize: "16px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                      Use: "{degreeSearch}"
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ════ 8 — Level ════ */}
            {step === 8 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {["100", "200", "300", "400", "500"].map((lvl) => (
                  <OptionPill key={lvl} selected={level === lvl}
                    onClick={() => { setLevel(lvl); setTimeout(() => nextStep(), 180); }}>
                    {lvl} Level
                  </OptionPill>
                ))}
              </div>
            )}

            {/* ════ 9 — Semester ════ */}
            {step === 9 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {["First Semester", "Second Semester"].map((sem) => (
                  <OptionPill key={sem} selected={semester === sem}
                    onClick={() => { setSemester(sem); setTimeout(() => nextStep(), 180); }}>
                    {sem}
                  </OptionPill>
                ))}
              </div>
            )}

            {/* ════ 10 — Courses ════ */}
            {step === 10 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: "15px", color: C.midGray, margin: "-18px 0 16px" }}>
                  {selectedCourses.length > 0 ? `${selectedCourses.length} courses · ${semester}` : semester}
                </p>
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "14px" }}>
                    <Spinner />
                    <span style={{ fontSize: "15px", color: C.lightGray }}>Loading your courses…</span>
                  </div>
                ) : (
                  <>
                    <div className="ob-scroll-list" style={{ maxHeight: "340px", overflowY: "auto", marginBottom: "18px" }}>
                      {selectedCourses.map((c, idx) => (
                        <div key={c.code + idx}
                          onClick={() => setSelectedCourses((cs) => cs.map((x, i) => i === idx ? { ...x, selected: !x.selected } : x))}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "15px 4px",
                            borderBottom: idx < selectedCourses.length - 1 ? `1px solid ${C.divider2}` : "none",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: C.nearBlack }}>{c.code}</div>
                            <div style={{ fontSize: "14px", color: C.midGray, marginTop: "3px" }}>{c.name}</div>
                          </div>
                          <div style={{
                            width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                            border: `2px solid ${c.selected ? C.brand : C.divider}`,
                            background: c.selected ? C.brand : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.13s ease",
                          }}>
                            {c.selected && <Ico.Check />}
                          </div>
                        </div>
                      ))}
                    </div>
                    <LuterBtn onClick={nextStep} disabled={!selectedCourses.some((c) => c.selected)}>
                      These are my courses →
                    </LuterBtn>
                  </>
                )}
              </div>
            )}

            {/* ════ 11 — Upload ════ */}
            {step === 11 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ border: `1.5px solid ${C.divider}`, borderRadius: "14px", overflow: "hidden", marginBottom: "10px" }}>
                  {[
                    { id: "pdf",     label: "PDF",                      icon: <Ico.FilePDF /> },
                    { id: "paste",   label: "Paste notes",              icon: <Ico.Paste /> },
                    { id: "ppt",     label: "PowerPoint",               icon: <Ico.PPT /> },
                    ...(showMore ? [
                      { id: "youtube", label: "YouTube",                icon: <Ico.Youtube /> },
                      { id: "photo",   label: "Photograph your notes",  icon: <Ico.Camera /> },
                    ] : []),
                  ].map((item, i, arr) => (
                    <div key={item.id}
                      onClick={() => {
                        setUploadType(item.id); setSelectedFile(null); setYoutubeUrl(""); setPastedNotes("");
                        if (["pdf", "ppt", "photo"].includes(item.id)) setTimeout(() => fileInputRef.current?.click(), 80);
                      }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 18px",
                        borderBottom: i < arr.length - 1 ? `1px solid ${C.divider2}` : "none",
                        cursor: "pointer",
                        background: uploadType === item.id ? "rgba(196,181,253,0.1)" : "#fff",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => { if (uploadType !== item.id) e.currentTarget.style.background = "#F9FAFB"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = uploadType === item.id ? "rgba(196,181,253,0.1)" : "#fff"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {item.icon}
                        <span style={{ fontSize: "14px", fontWeight: 500, color: C.nearBlack }}>{item.label}</span>
                      </div>
                      <Ico.ChevRight />
                    </div>
                  ))}
                </div>

                {!showMore && (
                  <button onClick={() => setShowMore(true)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600, color: C.midGray,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "4px", margin: "0 auto 10px", fontFamily: "inherit",
                  }}>
                    Show more <Ico.ChevDown />
                  </button>
                )}

                {/* Sub inputs */}
                {uploadType === "youtube" && (
                  <div style={{ marginBottom: "10px", padding: "12px 14px", background: "#F9FAFB", borderRadius: "12px", border: `1px solid ${C.divider2}` }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.lightGray, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>YouTube link</label>
                    <input type="text" placeholder="https://youtube.com/watch?v=…" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: `1.5px solid ${C.divider}`, outline: "none", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                )}
                {uploadType === "paste" && (
                  <div style={{ marginBottom: "10px", padding: "12px 14px", background: "#F9FAFB", borderRadius: "12px", border: `1px solid ${C.divider2}` }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.lightGray, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Paste notes</label>
                    <textarea rows={4} placeholder="Type or paste your notes…" value={pastedNotes} onChange={(e) => setPastedNotes(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: `1.5px solid ${C.divider}`, outline: "none", fontSize: "13px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                  </div>
                )}
                {["pdf", "ppt", "photo"].includes(uploadType) && (
                  <div style={{ marginBottom: "10px", padding: "12px 14px", background: "#F9FAFB", borderRadius: "12px", border: `1px solid ${C.divider2}`, textAlign: "center" }}>
                    <input type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      accept={uploadType === "pdf" ? ".pdf" : uploadType === "ppt" ? ".ppt,.pptx" : "image/*"}
                      style={{ display: "none" }} />
                    {selectedFile ? (
                      <>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: C.nearBlack }}>{selectedFile.name}</div>
                        <div style={{ fontSize: "12px", color: C.success, marginTop: "4px" }}>Ready · {(selectedFile.size / 1048576).toFixed(2)} MB</div>
                      </>
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: C.brand, fontFamily: "inherit" }}>
                        Tap to select {uploadType.toUpperCase()} file
                      </button>
                    )}
                  </div>
                )}

                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "8px" }}>
                    <Spinner size={22} />
                    <span style={{ fontSize: "13px", color: C.brand, fontWeight: 600 }}>{uploadStatus}</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                    {uploadType && (
                      <LuterBtn
                        onClick={() => handleFinish(false)}
                        disabled={
                          (uploadType === "youtube" && !youtubeUrl.trim()) ||
                          (uploadType === "paste"   && !pastedNotes.trim()) ||
                          (["pdf", "ppt", "photo"].includes(uploadType) && !selectedFile)
                        }
                      >
                        Finish &amp; Start Learning →
                      </LuterBtn>
                    )}
                    <LuterBtn variant="outline" onClick={() => handleFinish(true)}>
                      I don't have anything
                    </LuterBtn>
                  </div>
                )}
              </div>
            )}

          </Animated>
        </div>
      </main>
    </div>
  );
}
