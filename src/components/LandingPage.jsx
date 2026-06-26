import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LuterLogo from './shared/LuterLogo';
import MagicRings from './MagicRings';
import { SharedFooter, SharedFAQ, StyledFAQ, SharedNavbar, PremiumButton } from './PageShared';
import { getAppUrl } from '../utils/urlUtils';
import { useTheme } from '../contexts/ThemeContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useScroll } from 'framer-motion';
import LogoLoop from './LogoLoop';
import WallOfLove from '../pages/WallOfLove';
import { supabase } from '../supabaseClient';
import {
  Calculator,
  Plus,
  ArrowRight,
  BookOpen,
  FileText,
  GraduationCap,
  Clock,
  Star,
  Check,
  Stack,
  ChatsCircle as MessageSquare,
  Upload,
  Play,
  Shield,
  GlobeHemisphereWest as Globe,
  UsersThree as Users,
  TrendUp as TrendingUp,
  Trophy,
  Headphones,
  Folder,
  ArrowsClockwise as RefreshCw,
  Question as MessageCircleQuestion,
  CheckCircle,
  Cards,
  Brain,
  MonitorPlay,
  Lightning
} from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

// PremiumButton is now imported from PageShared

// Small helpers
const AvatarGroup = () => {
  const initials = ['AO', 'BK', 'CM', 'DL', 'EF'];
  const colors = ['#c4b5f7', '#a78bfa', '#ddd6fe', '#ede9fe', '#e0d9ff'];
  return (
    <div className="hero-avatars">
      {initials.map((init, i) => (
        <div key={i} className="hero-avatar" style={{ background: colors[i] }}>
          {init}
        </div>
      ))}
    </div>
  );
};

const Stars = ({ n = 5 }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {Array.from({ length: n }).map((_, i) => (
      <Star key={i} weight="fill" style={{ width: 12, height: 12, color: '#f59e0b' }} />
    ))}
  </div>
);

/* ── Floating Image Component with Beautiful Animations ── */
const FloatingImage = ({ src, alt, style, delay, opacity, rotate }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Mouse movement values for parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Transform mouse values to rotation
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [rotate - 2, rotate + 2]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [rotate + 2, rotate - 2]);
  
  // Smooth spring animations
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });
  
  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (event.clientX - centerX) / (rect.width / 2);
    const y = (event.clientY - centerY) / (rect.height / 2);
    mouseX.set(x * 0.5);
    mouseY.set(y * 0.5);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };
  
  return (
    <motion.div 
      className="floating-image"
      initial={{ opacity: 0, scale: 0.8, rotate: rotate }}
      animate={{ 
        opacity: isHovered ? Math.min(opacity * 2.5, 0.8) : opacity, 
        scale: isHovered ? 1.08 : 1, 
      }}
      transition={{ 
        duration: 0.8, 
        delay: delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 12px 40px rgba(151, 24, 251, 0.3)',
        rotate: 2,
        zIndex: 20
      }}
      whileTap={{ scale: 0.95 }}
    >
      <img 
        src={src} 
        alt={alt}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          display: 'block'
        }}
        animate={{
          rotateY: springRotateY,
          rotateX: springRotateX
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </motion.div>
  );
};

const UniversityLogoItem = ({ name, domain }) => {
  const [hovered, setHovered] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoUrl = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        padding: '10px 20px',
        borderRadius: '16px',
        background: hovered ? 'rgba(196, 181, 253, 0.08)' : 'transparent',
        border: hovered ? '1px solid rgba(167, 139, 250, 0.15)' : '1px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default'
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        boxShadow: hovered ? '0 4px 8px rgba(0,0,0,0.05)' : 'none',
        transition: 'all 0.3s ease',
        border: '1px solid #F1F5F9'
      }}>
        {!logoFailed ? (
          <img 
            src={logoUrl} 
            alt={`${name} logo`} 
            loading="lazy"
            onError={() => setLogoFailed(true)}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              filter: hovered ? 'grayscale(0%)' : 'grayscale(100%) opacity(70%)',
              transition: 'all 0.3s ease',
              padding: 2
            }} 
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            color: '#64748B',
            fontFamily: 'var(--font-display)'
          }}>
            {initial}
          </div>
        )}
      </div>
      <span style={{ 
        fontSize: '17px', 
        fontWeight: 700, 
        color: hovered ? '#2E1065' : '#64748B', 
        fontFamily: 'var(--font-display)',
        transition: 'color 0.3s ease',
        letterSpacing: '-0.01em'
      }}>
        {name}
      </span>
    </div>
  );
};

const UNIS = [
  { name: 'Stanford', domain: 'stanford.edu' },
  { name: 'UNILAG', domain: 'unilag.edu.ng' },
  { name: 'Harvard', domain: 'harvard.edu' },
  { name: 'UI', domain: 'ui.edu.ng' },
  { name: 'MIT', domain: 'mit.edu' },
  { name: 'OAU', domain: 'oauife.edu.ng' },
  { name: 'Yale', domain: 'yale.edu' },
  { name: 'Covenant', domain: 'covenantuniversity.edu.ng' },
  { name: 'Princeton', domain: 'princeton.edu' },
  { name: 'ABU', domain: 'abu.edu.ng' },
  { name: 'Oxford', domain: 'ox.ac.uk' },
  { name: 'UCLA', domain: 'ucla.edu' },
  { name: 'Columbia', domain: 'columbia.edu' },
  { name: 'NYU', domain: 'nyu.edu' },
  { name: 'Cambridge', domain: 'cam.ac.uk' },
  { name: 'Imperial', domain: 'imperial.ac.uk' }
];

// Global Styles for interactive elements
const GlobalStyles = () => (
  <style>{`
    .doodle-item {
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    }
    .doodle-item:hover {
      border-color: #4B0082 !important;
      border-style: solid !important;
      transform: translateY(-4px) scale(1.05) !important;
      box-shadow: 0 10px 20px rgba(75, 0, 130, 0.1) !important;
    }
    .floating-image {
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      border: 1px solid rgba(255,255,255,0.4);
      background: white;
    }
    input {
      text-transform: uppercase;
    }
    input::placeholder {
      text-transform: none;
    }
  `}</style>
);

// Draggable Doodle Component
const DraggableDoodle = ({ children, hoverContent, className = '', delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      className={className}
      style={{
        position: 'absolute',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : (isHovered ? 50 : 15),
        userSelect: 'none',
        touchAction: 'none'
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: delay }}
      whileHover={{ 
        scale: 1.05, 
        rotate: 3,
        filter: 'brightness(1.02)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ transition: 'all 0.3s ease', position: 'relative' }}>
        {children}
        <AnimatePresence>
          {isHovered && hoverContent && !isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 16,
                background: 'var(--background)',
                borderRadius: 20,
                padding: 16,
                boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.06)',
                zIndex: 1001,
                pointerEvents: 'none',
                width: 260,
                cursor: 'default',
              }}
            >
              {hoverContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const InteractiveFeatureCard = ({ children, style = {} }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <article 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', 
        background: 'var(--background)', borderRadius:32, padding:'32px 40px', margin:'16px 0', 
        gap:40, flexWrap:'wrap',
        border: '1px solid #F1F5F9',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0px)',
        boxShadow: isHovered ? '0 20px 40px rgba(75, 0, 130, 0.08)' : '0 4px 12px rgba(0,0,0,0.02)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {children}
    </article>
  );
};

/* ── Wave Badge: hover animates each letter with a staggered bounce ── */
const WaveBadge = ({ text, badgeStyle = {}, color, className = '' }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-block',
        padding: '2px 20px',
        borderRadius: '20px',
        margin: '0 4px',
        cursor: 'default',
        ...badgeStyle,
      }}
    >
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            transform: hovered ? 'translateY(-6px)' : 'translateY(0px)',
            transition: `transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.04}s`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

const ZIGZAG_FEATURES = [
  {
    id: 1,
    title: "Generate quality flashcards",
    description: "Upload your notes, and we'll turn them into smart, conceptual flashcards designed for maximum retention.",
    tag: "free. fun. effective.",
    tagColor: "#10B981", // green
    reverse: false,
    Visual: () => (
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, aspectRatio: '1', margin: '0 auto' }}>
        <div style={{ position: 'absolute', top: 20, left: 10, width: '100%', height: '100%', background: '#A7F3D0', borderRadius: 24, transform: 'rotate(-6deg)', zIndex: 1, border: '1px solid #6EE7B7' }} />
        <div style={{ position: 'absolute', top: 10, left: 5, width: '100%', height: '100%', background: '#6EE7B7', borderRadius: 24, transform: 'rotate(4deg)', zIndex: 2, border: '1px solid #34D399' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--background)', borderRadius: 24, display: 'flex', flexDirection: 'column', padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', zIndex: 3, transform: 'rotate(-2deg)', border: '1px solid #F1F5F9' }}>
           <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}>The Seat of Intelligence - Cerebrum</div>
           <p style={{ fontSize: 13, color: 'var(--tt-gray-light-a-600)', lineHeight: 1.6, fontWeight: 600 }}>"Ever wondered how you think? That's your cerebrum — the boss of your brain. It handles your thoughts, memories, decisions — basically, you being you. No cerebrum? No thinking. No learning."</p>
           <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--tt-gray-light-a-600)' }}>{'<'}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                 <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--tt-gray-light-a-600)' }}>▶</div>
                 <div style={{ width: 100, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '40%', height: '100%', background: '#94A3B8' }} />
                 </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--tt-gray-light-a-600)' }}>{'>'}</div>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "Study with Spaced Repetition",
    description: "Our algorithm knows exactly when you're about to forget, showing you concepts right before they fade away.",
    tag: "backed by science",
    tagColor: "#65A30D", // lime green
    reverse: true,
    Visual: () => (
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, aspectRatio: '1', margin: '0 auto' }}>
        <div style={{ position: 'absolute', top: 15, left: -10, width: '100%', height: '100%', background: '#FDE68A', borderRadius: 24, transform: 'rotate(8deg)', zIndex: 1, border: '1px solid #FCD34D' }} />
        <div style={{ position: 'absolute', top: 5, left: -5, width: '100%', height: '100%', background: '#FCD34D', borderRadius: 24, transform: 'rotate(-3deg)', zIndex: 2, border: '1px solid #FBBF24' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--background)', borderRadius: 24, display: 'flex', flexDirection: 'column', padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', zIndex: 3, transform: 'rotate(2deg)', border: '1px solid #F1F5F9' }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
               <div style={{ width: 24, height: 24, background: '#EF4444', borderRadius: '50%', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)' }} />
               <div style={{ fontSize: 16, fontWeight: 800, color: '#EF4444' }}>Champion</div>
             </div>
             <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--tt-gray-light-a-600)' }}>⏱ 155/185 Study Set</div>
           </div>
           
           <div style={{ width: '100%', height: 8, background: '#FEE2E2', borderRadius: 4, marginBottom: 32, overflow: 'hidden' }}>
             <div style={{ width: '80%', height: '100%', background: '#EF4444', borderRadius: 4 }} />
           </div>

           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, position: 'relative' }}>
             <div style={{ position: 'absolute', top: 14, left: 20, right: 20, height: 2, background: '#E2E8F0', zIndex: -1 }} />
             {[30, 60, 90, 120].map((day, i) => (
               <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                 <div style={{ width: 32, height: 32, borderRadius: 8, background: i === 0 ? '#F97316' : '#fff', border: i === 0 ? 'none' : '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#fff' : '#94A3B8', boxShadow: i === 0 ? '0 4px 8px rgba(249, 115, 22, 0.3)' : 'none' }}>
                   {i === 0 ? '✓' : '🔒'}
                 </div>
                 <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tt-gray-light-a-600)' }}>{day} Days</div>
               </div>
             ))}
           </div>

           <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
             <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: 'inset 0 0 0 3px #EF4444' }}>
               <span style={{ fontSize: 24, fontWeight: 900, color: '#F97316' }}>35</span>
             </div>
             <div>
               <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>Days Streak</div>
               <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tt-gray-light-a-600)' }}>You are doing great!</div>
             </div>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Test your knowledge with quizzes",
    description: "Take AI-generated quizzes to spot gaps in your understanding before the actual exam.",
    tag: "Adapts to exactly where you are",
    tagColor: "#3B82F6", // blue
    reverse: false,
    Visual: () => (
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, aspectRatio: '1', margin: '0 auto' }}>
        <div style={{ position: 'absolute', top: 20, right: 10, width: '100%', height: '100%', background: '#BFDBFE', borderRadius: 24, transform: 'rotate(-4deg)', zIndex: 1, border: '1px solid #93C5FD' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--background)', borderRadius: 24, display: 'flex', flexDirection: 'column', padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', zIndex: 2, transform: 'rotate(2deg)', border: '1px solid #F1F5F9' }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
             <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>Quiz: Cerebrum</div>
             <div style={{ width: 60, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
               <div style={{ width: '60%', height: '100%', background: '#3B82F6', borderRadius: 3 }} />
             </div>
           </div>
           <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, marginBottom: 12, background: '#F8FAFC', fontWeight: 600, display: 'flex', gap: 12, cursor: 'pointer', color: 'var(--tt-gray-light-a-600)', fontSize: 14 }}>
             <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #CBD5E1', flexShrink: 0 }} />
             A. Controls involuntary actions
           </div>
           <div style={{ border: 'none', borderRadius: 12, padding: 16, marginBottom: 12, background: '#3B82F6', color: '#fff', fontWeight: 600, display: 'flex', gap: 12, boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)', transform: 'scale(1.02)', fontSize: 14 }}>
             <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', fontSize: 12, flexShrink: 0, fontWeight: 900 }}>✓</div>
             B. The seat of intelligence
           </div>
           <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, background: '#F8FAFC', fontWeight: 600, display: 'flex', gap: 12, cursor: 'pointer', color: 'var(--tt-gray-light-a-600)', fontSize: 14 }}>
             <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #CBD5E1', flexShrink: 0 }} />
             C. Regulates heartbeat
           </div>
        </div>
      </div>
    )
  }
];

export default function LandingPage() {
  const containerRef = useRef(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const logoItems = UNIS.map(u => ({
    node: <UniversityLogoItem name={u.name} domain={u.domain} />,
    title: u.name
  }));

  useEffect(() => {
    // Redirect authenticated users to the dashboard instead of showing them the landing page
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/home');
      }
    });

    const ctx = gsap.context(() => {
      // hero animation
      const heroTargets = containerRef.current.querySelectorAll('.hero-content > *, .hero-mockup');
      if (heroTargets.length > 0) {
        gsap.from(heroTargets, {
          y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', delay: 0.1
        });
      }
      // scroll reveal
      gsap.utils.toArray('.reveal-child').forEach(el => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 85%' },
          y: 40, opacity: 0, duration: 0.8, ease: 'power2.out'
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={`landing-page ${isDark ? 'dark' : ''}`} style={{ background: 'var(--background)', minHeight: '100vh', paddingTop: 72 }}>
      <GlobalStyles />
      <style>{`
        .landing-page {
          overflow-x: clip;
        }
        .hero-content {
          width: min(100%, 950px);
        }
        .hero-cta-row {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .hero-mockup-body {
          display: flex;
          height: 500px;
          background: var(--background);
        }
        .hero-mockup-main {
          flex: 1;
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: left;
          font-family: var(--font-body);
          overflow: hidden;
          min-width: 0;
        }
        .hero-mockup-path {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .hero-mockup-split {
          display: flex;
          gap: 24px;
          flex: 1;
          flex-direction: row;
          min-width: 0;
        }
        .landing-logo-cloud,
        .landing-features-section,
        .landing-letter-section {
          padding-left: 24px;
          padding-right: 24px;
        }
        .landing-feature-stack {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 140px;
        }
        .landing-letter-card {
          position: relative;
          width: 100%;
          max-width: 850px;
          background: var(--card-bg-light, #ffffff);
          padding: 80px 40px;
          border-radius: 32px;
          box-shadow: var(--card-shadow-letter, 0 25px 50px -12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02));
          border: var(--card-border-letter, none);
          font-family: 'Varela Round', cursive;
          color: var(--card-text-letter, #334155);
          font-size: 2.4rem;
          line-height: 1.5;
          font-weight: 600;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .landing-letter-title {
          margin-bottom: 30px;
          color: var(--foreground);
          font-size: 3.2rem;
          font-weight: 700;
        }
        .landing-letter-pullquote {
          font-size: 3.6rem;
          color: #2563EB;
          transform: rotate(-2deg);
          margin-bottom: 50px;
        }
        .doodle-quiz { top: 15%; left: max(2%, calc(50% - 480px)); }
        .doodle-flashcards { top: 10%; right: max(2%, calc(50% - 480px)); }
        .doodle-summary { top: 55%; left: max(2%, calc(50% - 500px)); }
        .doodle-board { top: 60%; right: max(2%, calc(50% - 480px)); }
        .doodle-games { top: 35%; right: max(2%, calc(50% - 600px)); }

        @media (max-width: 1024px) {
          .doodle-quiz { top: 8%; left: 5%; }
          .doodle-flashcards { top: 6%; right: 5%; }
          .doodle-summary { top: 75%; left: 5%; }
          .doodle-board { top: 70%; right: 5%; }
          .doodle-games { top: 38%; right: 2%; }
          .hero-mockup {
            max-width: 920px !important;
          }
          .hero-mockup-body {
            height: 440px;
          }
          .hero-mockup-main {
            padding: 28px;
          }
        }

        @media (max-width: 768px) {
          .hero-section-inner { 
            padding: 76px 16px 64px !important;
          }
          .doodle-quiz,
          .doodle-flashcards,
          .doodle-summary,
          .doodle-board,
          .doodle-games {
            display: none;
          }
          .hero-content h1 {
            font-size: clamp(2.35rem, 11vw, 3.8rem) !important;
            line-height: 1.16 !important;
            margin-bottom: 22px !important;
          }
          .hero-wave-badge {
            display: inline-block;
            margin: 4px 0 !important;
            padding: 0 14px !important;
            border-bottom-width: 4px !important;
          }
          .hero-content p {
            font-size: 1rem !important;
            line-height: 1.65 !important;
            margin-bottom: 32px !important;
          }
          .hero-cta-row {
            gap: 12px;
          }
          .hero-cta-row a,
          .hero-cta-row button {
            width: min(100%, 320px) !important;
            max-width: 100% !important;
          }
          .hero-mockup {
            margin-top: 48px !important;
            border-radius: 18px !important;
            box-shadow: 0 8px 0 #333333 !important;
          }
          .hero-mockup-body {
            height: auto;
            min-height: 360px;
          }
          .hero-mockup-main {
            padding: 20px;
            gap: 18px;
          }
          .hero-mockup-path {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }
          .hero-mockup-path > div:first-child {
            font-size: 11px !important;
            line-height: 1.45 !important;
          }
          .hero-mockup-split {
            gap: 16px;
          }
          .hero-mockup input {
            font-size: 12px !important;
            text-overflow: ellipsis;
          }
          .landing-logo-cloud {
            padding-top: 56px !important;
            padding-bottom: 56px !important;
          }
          .landing-features-section {
            padding-top: 72px !important;
            padding-bottom: 72px !important;
          }
          .landing-feature-stack {
            gap: 84px;
          }
          .zigzag-row {
            gap: 36px !important;
          }
          .zigzag-row > div {
            flex-basis: auto !important;
            width: 100%;
          }
          .zigzag-row h2 {
            font-size: clamp(2rem, 9vw, 2.7rem) !important;
          }
          .zigzag-row p {
            font-size: 1rem !important;
            margin-bottom: 28px !important;
          }
          .landing-letter-section {
            padding-top: 80px !important;
            padding-bottom: 40px !important;
          }
          .landing-letter-card {
            padding: 56px 22px 44px !important;
            border-radius: 24px !important;
            font-size: clamp(1.55rem, 7vw, 2rem) !important;
            line-height: 1.4 !important;
          }
          .landing-letter-title {
            font-size: clamp(2.1rem, 10vw, 2.7rem) !important;
          }
          .landing-letter-pullquote {
            font-size: clamp(2.2rem, 10vw, 3rem) !important;
            margin-bottom: 34px !important;
          }
          .landing-letter-sticker {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .hero-section-inner {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
          .hero-content h1 {
            font-size: clamp(2.05rem, 12vw, 3rem) !important;
          }
          .hero-mockup-header-url {
            display: none !important;
          }
          .hero-mockup-main {
            padding: 16px;
          }
          .hero-mockup-card {
            padding: 16px !important;
            box-shadow: 0 4px 0 #333333 !important;
          }
          .hero-mockup-card p {
            font-size: 14px !important;
          }
          .hero-mockup-success {
            align-items: flex-start !important;
          }
          .landing-logo-cloud .trusted-badge {
            white-space: normal;
            border-radius: 18px !important;
          }
          .landing-letter-card img {
            height: 82px !important;
          }
        }

        .zigzag-row {
          display: flex;
          align-items: center;
          gap: 100px;
        }
        @media (max-width: 900px) {
          .zigzag-row {
            flex-direction: column !important;
            gap: 60px;
            text-align: center;
          }
        }
      `}</style>
      <SharedNavbar />

      {/* Hero Section */}
      <section className="hero-section-inner" style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: '70px 24px 80px', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(circle at 10% 20%, rgba(196, 181, 253, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(152, 255, 152, 0.08) 0%, transparent 40%)'
      }}>
        {/* Ambient Glows */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196, 181, 253, 0.12) 0%, transparent 70%)', top: '-100px', left: '-50px', filter: 'blur(40px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(152, 255, 152, 0.1) 0%, transparent 70%)', bottom: '100px', right: '-100px', filter: 'blur(40px)', zIndex: 0 }} />

        {/* Floating Draggable Learning Cards / Badges */}
        <DraggableDoodle 
          className="doodle-quiz"
          delay={0.2}
          hoverContent={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8, borderBottom: '1px solid #f0fdf4' }}>
                <CheckCircle size={16} color="#16a34a" weight="fill" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>Interactive Quiz</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', lineHeight: 1.3 }}>What is the powerhouse of the cell?</div>
              <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#dcfce7', border: '1px solid #bbf7d0', fontSize: 13, color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                  Mitochondria <CheckCircle weight="fill" color="#166534" size={16} />
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Nucleus</div>
              </div>
            </div>
          }
        >
          <div style={{ background: '#dcfce7', padding: '12px 20px', borderRadius: 16, border: '2px solid #166534', boxShadow: '0 6px 0 #166534', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 700, transform: 'rotate(-4deg)', fontSize: 14, color: '#166534' }}>
            <CheckCircle size={20} weight="fill" /> Quiz
          </div>
        </DraggableDoodle>

        <DraggableDoodle 
          className="doodle-flashcards"
          delay={0.4}
          hoverContent={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <div style={{ width: '100%', height: 110, background: '#fef3c7', border: '2px solid #fde68a', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.1)' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#92400e', textAlign: 'center', padding: '0 12px' }}>Capital of France?</span>
                <div style={{ position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: '#fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <ArrowRight color="#92400e" weight="bold" size={14} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 40, height: 6, borderRadius: 3, background: '#ef4444' }} />
                <div style={{ width: 40, height: 6, borderRadius: 3, background: '#10b981' }} />
              </div>
            </div>
          }
        >
          <div style={{ background: '#fef3c7', padding: '12px 20px', borderRadius: 16, border: '2px solid #92400e', boxShadow: '0 6px 0 #92400e', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 700, transform: 'rotate(5deg)', fontSize: 14, color: '#92400e' }}>
            <Cards size={20} weight="fill" /> Flashcards
          </div>
        </DraggableDoodle>

        <DraggableDoodle 
          className="doodle-summary"
          delay={0.6}
          hoverContent={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8, borderBottom: '1px solid #e0f2fe' }}>
                <Brain size={18} color="#0284c7" weight="duotone" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0284c7' }}>AI Summary</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
                <div style={{ width: '100%', height: 8, background: '#bae6fd', borderRadius: 4 }} />
                <div style={{ width: '85%', height: 8, background: '#bae6fd', borderRadius: 4 }} />
                <div style={{ width: '92%', height: 8, background: '#bae6fd', borderRadius: 4 }} />
                <div style={{ width: '65%', height: 8, background: '#bae6fd', borderRadius: 4 }} />
              </div>
            </div>
          }
        >
          <div style={{ background: '#e0f2fe', padding: '12px 20px', borderRadius: 16, border: '2px solid #0369a1', boxShadow: '0 6px 0 #0369a1', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 700, transform: 'rotate(-6deg)', fontSize: 14, color: '#0369a1' }}>
            <Brain size={20} weight="fill" /> Summary
          </div>
        </DraggableDoodle>

        <DraggableDoodle 
          className="doodle-board"
          delay={0.8}
          hoverContent={
            <div style={{ display: 'flex', gap: 10, height: 120 }}>
              <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', paddingLeft: 4 }}>TODO</span>
                <div style={{ background: 'var(--background)', height: 26, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }} />
                <div style={{ background: 'var(--background)', height: 26, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }} />
              </div>
              <div style={{ flex: 1, background: '#f3e8ff', borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#7e22ce', paddingLeft: 4 }}>DOING</span>
                <div style={{ background: 'var(--background)', height: 32, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #d8b4fe' }} />
              </div>
            </div>
          }
        >
          <div style={{ background: '#f3e8ff', padding: '12px 20px', borderRadius: 16, border: '2px solid #6b21a8', boxShadow: '0 6px 0 #6b21a8', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 700, transform: 'rotate(8deg)', fontSize: 14, color: '#6b21a8' }}>
            <MonitorPlay size={20} weight="fill" /> Board
          </div>
        </DraggableDoodle>

        <DraggableDoodle 
          className="doodle-games"
          delay={0.5}
          hoverContent={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 48, height: 48, background: '#fee2e2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fca5a5', boxShadow: '0 4px 8px rgba(239,68,68,0.15)' }}>
                  <Lightning color="#ef4444" weight="fill" size={24} />
                </div>
                <div style={{ width: 48, height: 48, background: '#dcfce7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #86efac', boxShadow: '0 4px 8px rgba(34,197,94,0.15)' }}>
                  <Star color="#22c55e" weight="fill" size={24} />
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#4b5563' }}>Match the pairs!</span>
            </div>
          }
        >
          <div style={{ background: '#ffe4e6', padding: '12px 20px', borderRadius: 16, border: '2px solid #be123c', boxShadow: '0 6px 0 #be123c', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 700, transform: 'rotate(-10deg)', fontSize: 14, color: '#be123c' }}>
            <Lightning size={20} weight="fill" /> Games
          </div>
        </DraggableDoodle>

        <div className="hero-content" style={{ position: 'relative', zIndex: 10, maxWidth: 950 }}>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6.5vw, 4.8rem)', 
            fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.25, letterSpacing: '-0.03em', marginBottom: 28 
          }}>
            Read <WaveBadge
              text="Smarter."
              className="hero-wave-badge"
              badgeStyle={{
                background: '#C4B5FD',
                color: '#2E1065',
                border: '2px solid rgba(167, 139, 250, 0.8)',
                borderBottom: '6px solid rgba(167, 139, 250, 1)',
                transform: 'rotate(-1.5deg)',
                boxShadow: '0 8px 16px rgba(167, 139, 250, 0.15)',
              }}
            /><br/>
            Understand <WaveBadge
              text="Deeper."
              className="hero-wave-badge"
              badgeStyle={{
                background: '#98FF98',
                color: '#065F46',
                border: '2px solid #6EE7B7',
                borderBottom: '6px solid #34D399',
                transform: 'rotate(1.5deg)',
                boxShadow: '0 8px 16px rgba(52, 211, 153, 0.15)',
              }}
            /><br/>
            Excel <WaveBadge
              text="Faster."
              className="hero-wave-badge"
              badgeStyle={{
                background: '#FFF917',
                color: '#854D0E',
                border: '2px solid #FDE047',
                borderBottom: '6px solid #FACC15',
                transform: 'rotate(-1deg)',
                boxShadow: '0 8px 16px rgba(250, 204, 21, 0.15)',
              }}
            />
          </h1>
          <p style={{ 
            fontFamily: 'var(--font-body)', fontSize: '1.25rem', color: 'var(--tt-gray-light-a-600)', 
            maxWidth: 620, margin: '0 auto 48px', lineHeight: 1.7 
          }}>
            Transform your academic journey with AI-powered tools that help you master your curriculum faster and remember longer. The intelligent way to excel.
          </p>
          <div className="hero-cta-row">
            <PremiumButton to={getAppUrl("/signup")} size="lg" style={{ width: 220, borderRadius: '16px' }}>
              Get Started
            </PremiumButton>
            <PremiumButton to="/demo" variant="outline" size="lg" style={{ width: 220, borderRadius: '16px' }}>
              Watch Demo
            </PremiumButton>
          </div>
        </div>

        {/* Dashboard Mockup under hero */}
        <div className="hero-mockup" style={{
          marginTop: 80, width: '100%', maxWidth: 1100, background: 'var(--background)', borderRadius: 24,
          border: '2px solid #333333', boxShadow: '0 12px 0 #333333', overflow: 'hidden', zIndex: 10
        }}>
          {/* Mockup Header */}
          <div style={{ height: 48, borderBottom: '2px solid #333333', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 8, background: 'var(--background)' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', border: '1.5px solid #333' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B', border: '1.5px solid #333' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#98FF98', border: '1.5px solid #333' }} />
            <div className="hero-mockup-header-url" style={{ marginLeft: 20, height: 28, background: 'var(--background)', borderRadius: 8, flex: 1, maxWidth: 400, border: '1.5px solid #333', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12, color: 'var(--tt-gray-light-a-600)', fontFamily: 'var(--font-body)' }}>luter.app/home</div>
          </div>
          {/* Mockup Body */}
          <div className="hero-mockup-body">
            {/* Sidebar */}
            <div className="hidden md:block" style={{ width: 220, borderRight: '2px solid #333333', padding: '32px 16px', background: 'var(--background)', textAlign: 'left', fontFamily: 'var(--font-display)' }}>
              {/* Logo inside sidebar */}
              <div style={{ padding: '0 8px 32px' }}>
                <LuterLogo size={24} fontSize={18} />
              </div>
              {/* Navigation Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Curriculums', icon: '🗂️', active: true },
                  { label: 'Flashcards', icon: '⚡' },
                  { label: 'Smart Quizzes', icon: '📝' },
                  { label: 'Progress Stats', icon: '📈' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                    background: item.active ? 'rgba(196, 181, 253, 0.15)' : 'transparent',
                    border: item.active ? '1.5px solid rgba(167, 139, 250, 0.3)' : '1.5px solid transparent',
                    color: item.active ? '#4B0082' : '#64748B',
                    fontWeight: item.active ? 700 : 500,
                    fontSize: 14, cursor: 'default'
                  }}>
                    <span>{item.icon}</span> {item.label}
                  </div>
                ))}
              </div>
            </div>
            {/* Main Content */}
            <div className="hero-mockup-main">
              {/* Path indicator */}
              <div className="hero-mockup-path">
                <div style={{ fontSize: 13, color: 'var(--tt-gray-light-a-600)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  CURRICULUMS &gt; AP PSYCHOLOGY &gt; <span style={{ color: '#4B0082' }}>NEURAL SIGNALS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, background: '#FEF3C7', color: '#B45309', padding: '4px 12px', borderRadius: 9999, fontWeight: 700, fontFamily: 'var(--font-display)', border: '1.5px solid #B45309' }}>
                  🔥 5 DAY STREAK
                </div>
              </div>

              {/* Split screen in main content */}
              <div className="hero-mockup-split">
                
                {/* Left Card: Active Flashcard */}
                <div className="hero-mockup-card" style={{
                  flex: 1.3, background: 'var(--background)', borderRadius: 16, border: '2px solid #333333',
                  boxShadow: '0 6px 0 #333333', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  position: 'relative'
                }}>
                  {/* Card Header tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, background: '#E0D9FF', color: '#4B0082', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontFamily: 'var(--font-display)', border: '1px solid rgba(167, 139, 250, 0.4)' }}>CONCEPT CARD</span>
                    <span style={{ fontSize: 12, color: 'var(--tt-gray-light-a-600)', fontWeight: 600 }}>Card 4 of 25</span>
                  </div>

                  {/* Card Body */}
                  <div style={{ margin: '12px 0' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tt-gray-light-a-600)', marginBottom: 6, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question:</h4>
                    <p style={{ fontSize: 16, color: 'var(--foreground)', lineHeight: 1.5, fontWeight: 600 }}>
                      What is the key biological function of the <span style={{ borderBottom: '3px solid #C4B5FD', fontWeight: 700 }}>myelin sheath</span> in neurons?
                    </p>
                  </div>

                  {/* Typing simulator & Success badge */}
                  <div>
                    <div style={{ position: 'relative', marginBottom: 12 }}>
                      <input 
                        disabled 
                        value="It is an insulating layer that speeds up electrical transmission"
                        style={{
                          width: '100%', height: 42, border: '2px solid #333333', borderRadius: 10,
                          padding: '0 12px', fontSize: 13, background: '#F8FAFC', color: 'var(--foreground)',
                          fontFamily: 'var(--font-body)', boxSizing: 'border-box'
                        }} 
                      />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#059669', fontSize: 16, fontWeight: 'bold' }}>✓</span>
                    </div>

                    <div className="hero-mockup-success" style={{
                      background: 'rgba(152, 255, 152, 0.15)', border: '2px solid #98FF98', borderRadius: 10,
                      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10
                    }}>
                      <span style={{ fontSize: 16 }}>🎉</span>
                      <div style={{ fontSize: 12, color: '#065F46', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        Correct concept matched! +15 XP gained
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Quick stats */}
                <div className="hidden lg:flex" style={{
                  flex: 0.8, background: 'var(--background)', borderRadius: 16, border: '2px solid #333333',
                  boxShadow: '0 6px 0 #333333', padding: 24, flexDirection: 'column', gap: 20
                }}>
                  {/* Streak Tracker */}
                  <div>
                    <h4 style={{ fontSize: 12, color: 'var(--tt-gray-light-a-600)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Weekly Activity</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                      {['M','T','W','T','F','S','S'].map((day, idx) => {
                        const active = idx < 5;
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%', background: active ? '#98FF98' : '#F1F5F9',
                              border: '1.5px solid #333333',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800,
                              color: active ? '#065F46' : '#94A3B8'
                            }}>
                              {active ? '✓' : ''}
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--tt-gray-light-a-600)', fontWeight: 600 }}>{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Small Bar chart */}
                  <div>
                    <h4 style={{ fontSize: 12, color: 'var(--tt-gray-light-a-600)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>XP Streak</h4>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 8, paddingTop: 10 }}>
                      {[30, 45, 60, 20, 80, 0, 0].map((val, idx) => (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{
                            width: '100%', height: `${val}%`, background: idx === 4 ? '#C4B5FD' : '#DDD6FE',
                            border: '1.5px solid #333',
                            borderRadius: '4px 4px 0 0'
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Cloud */}
      <section className="landing-logo-cloud" style={{ padding: '80px 0', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', background: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', marginBottom: 40, textAlign: 'center' }}>
          <div className="trusted-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#F1F5F9', padding: '8px 16px', borderRadius: 999, border: '1px solid #E2E8F0', marginBottom: 16 }}>
            <div style={{ display: 'flex' }}>
              {[
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Nkechi&backgroundColor=b6e3f4',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Tunde&backgroundColor=c0aede',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha&backgroundColor=ffdfbf',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Chidi&backgroundColor=d1d4f9',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Zainab&backgroundColor=b6e3f4'
              ].map((avatar, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: `url(${avatar}) center/cover`, border: '2px solid #F1F5F9', marginLeft: i === 0 ? 0 : -10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tt-gray-light-a-600)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Trusted by 100k+ Students</span>
          </div>
          <h3 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0 }}>
            Empowering students at top universities worldwide.
          </h3>
        </div>

        <LogoLoop
          logos={logoItems.slice(0, 8)}
          speed={60}
          direction="left"
          logoHeight={60}
          gap={24}
          hoverSpeed={0}
          scaleOnHover={true}
          fadeOut={true}
          fadeOutColor="var(--background)"
          ariaLabel="Partner universities row 1"
        />
        
        <div style={{ marginTop: 24 }}>
          <LogoLoop
            logos={logoItems.slice(8, 16)}
            speed={50}
            direction="right"
            logoHeight={60}
            gap={24}
            hoverSpeed={0}
            scaleOnHover={true}
            fadeOut={true}
            fadeOutColor="var(--background)"
            ariaLabel="Partner universities row 2"
          />
        </div>
      </section>

      {/* ZigZag Features Section */}
      <section className="landing-features-section" style={{ padding: '120px 24px', background: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
        <div className="landing-feature-stack">
          {ZIGZAG_FEATURES.map((feature, idx) => (
            <div key={feature.id} className="zigzag-row" style={{ flexDirection: feature.reverse ? 'row-reverse' : 'row' }}>
               {/* Text Content */}
               <div style={{ flex: '1 1 400px' }}>
                  <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 999, background: `${feature.tagColor}15`, color: feature.tagColor, fontWeight: 800, textTransform: 'lowercase', fontSize: 14, marginBottom: 20, letterSpacing: '0.05em', border: `2px solid ${feature.tagColor}30` }}>
                    {feature.tag}
                  </div>
                  <h2 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, marginBottom: 24, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--foreground)', lineHeight: 1.1 }}>
                    {feature.title}
                  </h2>
                  <p style={{ fontSize: '1.25rem', color: 'var(--tt-gray-light-a-600)', lineHeight: 1.6, marginBottom: 40, fontWeight: 500 }}>
                    {feature.description}
                  </p>
                  <PremiumButton>Try Luter - Full Access</PremiumButton>
               </div>
               
               {/* Visual Side */}
               <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <feature.Visual />
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* Combined Background Wrapper for CEO Letter and Wall of Love */}
      <div style={{
        position: 'relative',
        background: `
          radial-gradient(ellipse 80% 60% at 0% 50%, rgba(151,24,251,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 80% 60% at 100% 50%, rgba(113,128,254,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 70% 70% at 50% 0%, rgba(196,181,253,0.16) 0%, transparent 55%),
          var(--background)
        `
      }}>
        {/* Top Fade from previous section */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '150px', background: 'linear-gradient(to bottom, var(--background) 0%, transparent 100%)', zIndex: 1, pointerEvents: 'none' }} />

        {/* CEO Letter Section */}
        <section className="landing-letter-section" style={{
          padding: '140px 24px 60px 24px', 
          position: 'relative', 
          overflow: 'hidden', 
          display: 'flex', 
          justifyContent: 'center',
          zIndex: 2
        }}>
          <div className="landing-letter-card" style={{
            position: 'relative',
            width: '100%',
            maxWidth: 850,
            background: 'var(--card-bg-light, #ffffff)',
            padding: '80px 40px',
            borderRadius: 32,
            boxShadow: 'var(--card-shadow-letter, 0 25px 50px -12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02))',
            border: 'var(--card-border-letter, none)',
            fontFamily: "'Varela Round', cursive",
            color: 'var(--card-text-letter, #334155)',
            fontSize: '2.4rem',
            lineHeight: '1.5',
            fontWeight: 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            {/* Floating Stickers */}
            <div className="landing-letter-sticker" style={{ position: 'absolute', top: -30, right: 60, fontSize: '4rem', transform: 'rotate(15deg)', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', zIndex: 3 }}>🚀</div>
            <div className="landing-letter-sticker" style={{ position: 'absolute', bottom: 80, left: -20, fontSize: '4rem', transform: 'rotate(-15deg)', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', zIndex: 3 }}>🧠</div>
            <div className="landing-letter-sticker" style={{ position: 'absolute', top: 60, left: -20, fontSize: '3rem', transform: 'rotate(-25deg)', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', zIndex: 3 }}>✨</div>
            <div className="landing-letter-sticker" style={{ position: 'absolute', bottom: -20, right: 100, fontSize: '3.5rem', transform: 'rotate(10deg)', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', zIndex: 3 }}>🎓</div>

            {/* Decorative Quote Mark */}
            <div style={{
              position: 'absolute',
              top: 20,
              left: 40,
              fontSize: '14rem',
              color: 'var(--card-quote-mark)',
              fontFamily: 'Georgia, serif',
              lineHeight: 1,
              zIndex: 1
            }}>
              "
            </div>

            <div style={{ position: 'relative', zIndex: 2, maxWidth: 700 }}>
              <div className="landing-letter-title" style={{ marginBottom: 30, color: 'var(--foreground)', fontSize: '3.2rem', fontWeight: 700 }}>
                They say studying is hard...
              </div>
              <div style={{ letterSpacing: '0.01em', marginBottom: 20 }}>
                But we believe it's just a puzzle waiting to be solved. We built Luter because every student deserves to experience that "Aha!" moment.
              </div>
              <div style={{ letterSpacing: '0.01em', marginBottom: 40 }}>
                Don't let exams intimidate you—turn your confusion into confidence and your hard work into top grades. Start learning today, and soon you'll realize...
              </div>
              <div className="landing-letter-pullquote" style={{ fontSize: '3.6rem', color: '#2563EB', transform: 'rotate(-2deg)', marginBottom: 50 }}>
                "You were always capable of brilliance."
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
                <img src="/signature.png" alt="Michael Oluwayanmi Signature" style={{ height: 110, objectFit: 'contain', opacity: 0.9, mixBlendMode: 'multiply' }} />
                <div style={{ fontSize: '1.2rem', color: 'var(--tt-gray-light-a-600)', marginTop: 4, fontFamily: "'Outfit', sans-serif", fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Michael Oluwayanmi
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--tt-gray-light-a-600)', marginTop: 4, fontFamily: "'Outfit', sans-serif" }}>
                  CEO & Co-Founder
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wall of Love Section */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          
          <WallOfLove transparentBg={true} />

          {/* Bottom Fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '200px', background: 'var(--card-gradient-fade)', zIndex: 10, pointerEvents: 'none' }} />
        </div>
      </div>

      <SharedFooter />
    </div>
  );
}
