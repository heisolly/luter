import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LuterLogo from './shared/LuterLogo';
import MagicRings from './MagicRings';
import { SharedFooter, SharedFAQ, SharedNavbar, PremiumButton } from './PageShared';
import { getAppUrl } from '../utils/urlUtils';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Calculator,
  Plus,
  ArrowRight,
  BookOpen,
  Lightning,
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
  Question as MessageCircleQuestion
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

/* ── universities for scrolling strip ── */

/* ── universities for scrolling strip ── */
const UNIS = [
  { name: 'Princeton', icon: '🏛️' }, { name: 'Stanford', icon: '🌲' },
  { name: 'MIT', icon: '🤖' }, { name: 'Cambridge', icon: '🎓' },
  { name: 'Yale', icon: '🐶' }, { name: 'Michigan', icon: '〽️' },
  { name: 'NUS', icon: '🦁' }, { name: 'Toronto', icon: '🍁' },
  { name: 'Oxford', icon: '📙' }, { name: 'Columbia', icon: '👑' },
  { name: 'Harvard', icon: '🏅' }, { name: 'UNILAG', icon: '🇳🇬' },
];

const plans = [
  {
    name: 'BASIC', 
    trial: 'BASIC PLAN',
    priceMonthly: 0, 
    priceSemester: 0,
    isPopular: false,
    bg: 'white', 
    color: '#111', 
    border: '#e5e7eb',
    buttonText: 'START FOR FREE',
    features: ['5 UPLOADS PER MONTH', 'SMART NOTES (BASIC)', 'SUMMARY', 'FLASHCARD GENERATION', 'COMMUNITY SUPPORT']
  },
  {
    name: 'UNIVERSITY PRO', 
    trial: 'MOST POPULAR FOR STUDENTS',
    priceMonthly: 4000, 
    priceSemester: 9000,
    isPopular: true,
    bg: 'linear-gradient(135deg, #4B0082 0%, #A855F7 100%)', 
    color: 'white', 
    border: 'transparent',
    buttonText: 'GET STARTED',
    features: ['UNLIMITED UPLOADS', 'ADVANCED SMART NOTES', 'SUMMARY + QUIZZES', 'SPACED-REP FLASHCARDS', 'MATH EXPERT', 'LIVE LECTURE RECORDING', 'PRIORITY SUPPORT']
  },
  {
    name: 'PREMIUM', 
    trial: 'FOR POWER USERS',
    priceMonthly: 7000, 
    priceSemester: 16000,
    isPopular: false,
    bg: 'white', 
    color: '#111', 
    border: '#e5e7eb',
    buttonText: 'GET STARTED',
    features: ['EVERYTHING IN UNIVERSITY PRO', 'ANALYZE IMAGES', 'MULTI-FILE SESSIONS', 'TEAM COLLABORATION', 'DEDICATED SUPPORT', 'EARLY FEATURE ACCESS']
  }
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
const DraggableDoodle = ({ children, initialX, initialY, delay = 0 }) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <motion.div
      ref={dragRef}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 15,
        userSelect: 'none',
        touchAction: 'none'
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: delay }}
      whileHover={{ 
        scale: 1.1, 
        rotate: 5,
        filter: 'brightness(1.05)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ transition: 'all 0.3s ease' }}>
        {children}
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
        background:'white', borderRadius:32, padding:'32px 40px', margin:'16px 0', 
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

const homeFaqs = [
  { q: 'Is Luter free for students?', a: 'Yes! Luter has a generous free tier — 5 study sessions per month with AI notes and summaries included. Pro unlocks unlimited sessions, CBT exams, and the 24/7 AI Tutor.' },
  { q: 'Does it work offline?', a: 'Your generated notes and flashcards are cached on mobile so you can study on the go without internet. AI Tutor and new generations require an active connection.' },
  { q: 'How accurate is the mock exam feature?', a: 'Our AI is trained on actual university past questions across hundreds of institutions, delivering over 99% topical relevance to your specific curriculum.' },
  { q: 'What file formats does Luter support?', a: 'Luter processes PDFs, PowerPoint files, Word docs, YouTube links, web article URLs, audio recordings (MP3/M4A), and even photos of handwritten notes.' },
  { q: 'Is my data private?', a: 'Absolutely. All uploaded content is encrypted in transit and at rest. We never sell your data or use it to train our models without explicit consent.' },
];

export default function LandingPage() {
  const containerRef = useRef(null);

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTargets = containerRef.current.querySelectorAll('.hero-content > *');
      if (heroTargets.length > 0) {
        gsap.from(heroTargets, {
          y: 48, opacity: 0, duration: 1, stagger: 0.14, ease: 'power3.out', delay: 0.1
        });
      }

      const dashWrapper = containerRef.current.querySelector('.dashboard-wrapper');
      if (dashWrapper) {
        gsap.from(dashWrapper, {
          y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', delay: 0.5
        });
      }

      // Parallax effect for floating images
      const floatingImages = containerRef.current.querySelectorAll('.floating-image');
      floatingImages.forEach((img, index) => {
        gsap.to(img, {
          yPercent: -20,
          ease: 'none',
          scrollTrigger: {
            trigger: img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1 + (index * 0.2),
          }
        });
      });

      gsap.utils.toArray('section').forEach(sec => {
        const children = sec.querySelectorAll('.reveal-child');
        if (children.length > 0) {
          gsap.from(children, {
            scrollTrigger: { trigger: sec, start: 'top 82%' },
            y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power2.out'
          });
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  /* mobile nav */
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSemester, setIsSemester] = useState(true);

  // Placeholder for RevealDiv - assuming it's defined elsewhere or will be added.
  // For the purpose of this change, we'll just use a simple div.
  const RevealDiv = ({ children, delay = 0 }) => {
    const ref = useRef(null);
    useEffect(() => {
      gsap.fromTo(ref.current, 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.9, ease: 'power2.out', delay: delay }
      );
    }, [delay]);
    return <div ref={ref}>{children}</div>;
  };


  return (
    <div ref={containerRef} style={{ background: '#fff', minHeight: '100vh' }}>
      <GlobalStyles />

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <SharedNavbar />

      {/* ═══════════════ HERO ═══════════════ */}
      <section style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #ffffff 0%, #faf8ff 100%)'
      }}>
        {/* MagicRings Background */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 1, 
          background: 'transparent' 
        }}>
          <MagicRings
            color="#4B0082"
            colorTwo="#A855F7"
            ringCount={8}
            speed={0.6}
            attenuation={15}
            lineThickness={2}
            baseRadius={0.2}
            radiusStep={0.08}
            scaleRate={0.12}
            opacity={0.15}
            blur={1}
            noiseAmount={0.01}
            rotation={10}
            ringGap={1.6}
            fadeIn={0.7}
            fadeOut={0.3}
            followMouse={true}
            mouseInfluence={0.08}
            hoverScale={1.02}
            parallax={0.04}
            clickBurst={false}
          />
        </div>

        {/* Subtle Floating Elements */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 2,
          pointerEvents: 'none'
        }}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                borderRadius: '50%',
                background: `rgba(75, 0, 130, ${Math.random() * 0.1 + 0.05})`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 3 + 4,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div style={{ 
          position: 'relative', 
          zIndex: 10, 
          textAlign: 'center',
          maxWidth: '900px',
          padding: '0 24px',
          width: '100%'
        }}>


          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              fontFamily: 'var(--font-outfit)',
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              fontWeight: '800',
              lineHeight: '1.1',
              letterSpacing: '-0.03em',
              color: '#111',
              marginBottom: '24px'
            }}
          >
            Read Smarter.
            <br />
            <span style={{ 
              color: '#4B0082',
              background: 'linear-gradient(135deg, #4B0082 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Understand Deeper.
            </span>
            <br />
            Excel Faster.
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{
              fontFamily: 'var(--font-varela)',
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              lineHeight: '1.6',
              color: '#475569',
              maxWidth: '600px',
              margin: '0 auto 48px',
              fontWeight: '400'
            }}
          >
            Transform your academic journey with AI-powered tools that help you master your curriculum faster and remember longer. The intelligent way to excel.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <PremiumButton to={getAppUrl("/signup")} size="lg">
              START LEARNING NOW
            </PremiumButton>
          </motion.div>
        </div>

        
        {/* Draggable Doodles Around Hero */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, pointerEvents: 'none' }}>
          {/* Desktop: Show all doodles */}
          <div className="hidden md:block">
            {/* Top Left Corner */}
            <DraggableDoodle initialX={50} initialY={50} delay={1.0}>
              <div 
                className="doodle-item"
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#fef3c7',
                  border: '2px dashed #f59e0b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  pointerEvents: 'auto'
                }}
              >
                💡
              </div>
            </DraggableDoodle>

            {/* Top Right Corner */}
            <DraggableDoodle initialX={window.innerWidth - 150} initialY={80} delay={1.2}>
              <div 
                className="doodle-item"
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#dbeafe',
                  border: '2px solid #3b82f6',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  transform: 'rotate(15deg)',
                  pointerEvents: 'auto'
                }}
              >
                📚
              </div>
            </DraggableDoodle>

            {/* Left Side */}
            <DraggableDoodle initialX={30} initialY={300} delay={1.4}>
              <div 
                className="doodle-item"
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f3e8ff',
                  border: '2px solid #8b5cf6',
                  borderRadius: '12px',
                  fontFamily: 'var(--font-outfit)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b21a8',
                  transform: 'rotate(-5deg)',
                  pointerEvents: 'auto'
                }}
              >
                Study Smarter! 🎯
              </div>
            </DraggableDoodle>

            {/* Right Side */}
            <DraggableDoodle initialX={window.innerWidth - 200} initialY={250} delay={1.6}>
              <div 
                className="doodle-item"
                style={{
                  width: 70,
                  height: 70,
                  backgroundColor: '#dcfce7',
                  border: '3px solid #22c55e',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  pointerEvents: 'auto'
                }}
              >
                ✨
              </div>
            </DraggableDoodle>

            {/* Bottom Left */}
            <DraggableDoodle initialX={80} initialY={window.innerHeight - 200} delay={1.8}>
              <div 
                className="doodle-item"
                style={{
                  padding: '16px 20px',
                  backgroundColor: '#fff7ed',
                  border: '2px dashed #ea580c',
                  borderRadius: '20px',
                  fontFamily: 'var(--font-outfit)',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#c2410c',
                  transform: 'rotate(8deg)',
                  pointerEvents: 'auto'
                }}
              >
                AI-Powered 🤖
              </div>
            </DraggableDoodle>

            {/* Bottom Right */}
            <DraggableDoodle initialX={window.innerWidth - 180} initialY={window.innerHeight - 150} delay={2.0}>
              <div 
                className="doodle-item"
                style={{
                  width: 90,
                  height: 90,
                  backgroundColor: '#fce7f3',
                  border: '2px solid #ec4899',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  transform: 'rotate(-10deg)',
                  pointerEvents: 'auto'
                }}
              >
                🚀
              </div>
            </DraggableDoodle>

            {/* Scattered Elements */}
            <DraggableDoodle initialX={200} initialY={120} delay={2.2}>
              <div style={{
                width: 40,
                height: 40,
                backgroundColor: '#e0e7ff',
                border: '2px solid #6366f1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                pointerEvents: 'auto'
              }}>
                📝
              </div>
            </DraggableDoodle>

            <DraggableDoodle initialX={window.innerWidth - 300} initialY={400} delay={2.4}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12px',
                fontWeight: '500',
                color: '#166534',
                pointerEvents: 'auto'
              }}>
                Learn Faster! ⚡
              </div>
            </DraggableDoodle>

            <DraggableDoodle initialX={150} initialY={window.innerHeight - 300} delay={2.6}>
              <div style={{
                width: 50,
                height: 50,
                backgroundColor: '#fef2f2',
                border: '2px dotted #ef4444',
                borderRadius: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                pointerEvents: 'auto'
              }}>
                🔥
              </div>
            </DraggableDoodle>
          </div>

          {/* Mobile: Show only 3 doodles */}
          <div className="md:hidden">
            <DraggableDoodle initialX={20} initialY={120} delay={1.0}>
              <div style={{
                width: 35,
                height: 35,
                backgroundColor: '#fef3c7',
                border: '2px dashed #f59e0b',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                pointerEvents: 'auto'
              }}>
                💡
              </div>
            </DraggableDoodle>

            <DraggableDoodle initialX={window.innerWidth - 70} initialY={180} delay={1.3}>
              <div style={{
                width: 45,
                height: 45,
                backgroundColor: '#dbeafe',
                border: '2px solid #3b82f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transform: 'rotate(10deg)',
                pointerEvents: 'auto'
              }}>
                📚
              </div>
            </DraggableDoodle>

            <DraggableDoodle initialX={30} initialY={window.innerHeight - 100} delay={1.6}>
              <div style={{
                padding: '6px 10px',
                backgroundColor: '#f3e8ff',
                border: '2px solid #8b5cf6',
                borderRadius: '6px',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '10px',
                fontWeight: '600',
                color: '#6b21a8',
                transform: 'rotate(-3deg)',
                pointerEvents: 'auto'
              }}>
                Study Smart! 🎯
              </div>
            </DraggableDoodle>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </section>



      


      {/* ═══════════════ PROBLEM SECTION ═══════════════ */}
      <section id="problem" style={{ padding: '96px 0', background: '#F8F8F8' }}>
        <div className="container-custom">
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <p className="reveal-child" style={{ fontSize:15, fontWeight:600, color:'#6B7280', fontFamily:'var(--font-varela)', marginBottom:12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Sound familiar?
            </p>
            <h2 className="reveal-child" style={{ fontSize:'clamp(1.8rem, 3.5vw, 2.5rem)', maxWidth:640, margin:'0 auto', color:'#111', fontFamily:'var(--font-outfit)', fontWeight:800, lineHeight:'130%', letterSpacing: '-0.02em' }}>
              Studying feels <span style={{ color:'#4B0082', fontStyle:'italic' }}>harder than it should</span>
            </h2>
          </div>

          {/* 4 Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:24, marginBottom:32 }}>
            {[
              { icon:<Headphones style={{ width:40, height:40 }} weight="light" />, title:'Lost in long lectures', desc:'"I zoned out 20 minutes in… now I\'m completely lost"' },
              { icon:<Folder style={{ width:40, height:40 }} weight="light" />, title:'Scattered notes', desc:'"Scattered across Google Docs, Notion, and random papers"' },
              { icon:<RefreshCw style={{ width:40, height:40 }} weight="light" />, title:'Read it. Forgot it', desc:'"I read this chapter 3 times and still can\'t remember it"' },
              { icon:<MessageCircleQuestion style={{ width:40, height:40 }} weight="light" />, title:'Stuck with no help', desc:'"It\'s midnight, I\'m confused, and there\'s no one to explain this to me"' },
            ].map(({ icon, title, desc }) => (
              <InteractiveFeatureCard key={title} style={{ padding:'32px 24px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
                <div style={{ color:'#111', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {icon}
                </div>
                <h3 style={{ fontSize:17, fontWeight:700, fontFamily:'var(--font-outfit)', color:'#111', marginBottom:12, lineHeight:'140%' }}>
                  {title}
                </h3>
                <p style={{ fontSize:15, color:'#64748B', fontStyle:'italic', lineHeight:'160%', fontFamily:'var(--font-outfit)', margin:0, fontWeight:500 }}>
                  {desc}
                </p>
              </InteractiveFeatureCard>
            ))}
          </div>

          {/* Bottom Banner */}
          <div className="reveal-child">
            <InteractiveFeatureCard style={{ padding:'28px 40px', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:24 }}>
              <p style={{ fontSize:18, fontWeight:500, color:'#475569', maxWidth:540, fontFamily:'var(--font-varela)', lineHeight:'160%', margin:0 }}>
                <strong style={{ color:'#111', fontWeight:700, fontFamily: 'var(--font-outfit)' }}>There's a better way.</strong> Luter turns this chaos into a structured learning system automatically. Studying feels easier.
              </p>
              <PremiumButton style={{ height:'52px', padding:'0 32px' }}>
                Start a Free Study Session <ArrowRight size={20} weight="light" style={{ marginLeft: 8 }} />
              </PremiumButton>
            </InteractiveFeatureCard>
          </div>
        </div>
      </section>

      {/* ═══════════════ INTRODUCING LUTER — FEATURE LIST ═══════════════ */}
      <section style={{ padding: '96px 0', background: '#F8F8F8' }} aria-labelledby="features-heading">
        <div className="container-full" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>

          {/* Section Header */}
          <p className="reveal-child" style={{ color:'#4B0082', fontFamily:'var(--font-outfit)', fontWeight:800, fontSize:18, lineHeight:'140%', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Introducing Luter...
          </p>
          <h2 id="features-heading" className="reveal-child" style={{ fontSize:'clamp(1.8rem, 3.5vw, 3rem)', textAlign:'center', maxWidth:650, margin:'24px auto 16px', color:'#111', fontFamily:'var(--font-outfit)', fontWeight:800, lineHeight:'120%', letterSpacing: '-0.02em' }}>
            We turn your material into a <span style={{ color:'#4B0082', fontStyle:'italic' }}>complete study system</span>
          </h2>
          <p className="reveal-child" style={{ fontSize:18, color:'#475569', fontFamily:'var(--font-varela)', fontWeight:400, lineHeight:'180%', textAlign:'center', maxWidth:580, marginBottom:40 }}>
            Luter takes your material and builds your entire study session — notes, flashcards, quizzes, summary, and tutor included.
          </p>

          {/* Feature Cards List */}
          <ul style={{ width:'100%', listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>

            {/* 1. AI Notes */}
            <li style={{ width:'100%', maxWidth: 1000 }} className="reveal-child">
              <InteractiveFeatureCard style={{ backgroundImage:'linear-gradient(to right, #FFF, #FFF3E3)' }}>
                <div style={{ flex:'1 1 400px', minWidth:0 }}>
                  <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:28, marginBottom:28 }}>
                    <div style={{ width:88, height:88, background:'linear-gradient(135deg,#F8FAFC,#E2E8F0)', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
                      <BookOpen style={{ width:40, height:40, color:'#111' }} weight="light" />
                    </div>
                    <div>
                      <h3 style={{ color:'#111', fontFamily:'var(--font-outfit)', fontWeight:800, lineHeight:'140%', fontSize:28, marginBottom:4, letterSpacing: '-0.01em' }}>AI Notes</h3>
                      <p style={{ color:'#4B0082', fontFamily:'var(--font-varela)', fontWeight:700, lineHeight:'140%', fontSize:16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes that write themselves</p>
                    </div>
                  </div>
                  <p style={{ fontSize:17, color:'#475569', fontFamily:'var(--font-varela)', fontWeight:400, lineHeight:'180%', maxWidth:443 }}>
                    Get structured notes in seconds — so you can focus on understanding, not typing. Less cognitive overload, more actual learning.
                  </p>
                </div>
                {/* Mockup */}
                <div style={{ width:320, flexShrink:0, background:'white', borderRadius:12, border:'1px solid #e8e8ec', padding:20, boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:12, borderBottom:'1px solid #f3f4f6' }}>
                    <span style={{ fontSize:11, fontWeight:800, color:'#4B0082', textTransform: 'uppercase' }}>AI Notes</span>
                    <div style={{ display:'flex', gap:6 }}>
                      {['A','A+','◫'].map(c => <span key={c} style={{ fontSize:11, fontWeight:700, color:'#ccc' }}>{c}</span>)}
                    </div>
                  </div>
                  {[
                    { heading:'Introduction to the Cell', lines:[85, 100, 70, 60] },
                    { heading:'Historical Context', lines:[90, 75, 55] },
                  ].map(({ heading, lines }) => (
                    <div key={heading} style={{ marginBottom:16 }}>
                      <div style={{ fontSize:12, fontWeight:800, color:'#111', marginBottom:8, fontFamily: 'var(--font-outfit)' }}>{heading}</div>
                      {lines.map((w, i) => (
                        <div key={i} style={{ height:7, background: i===0 ? 'rgba(75, 0, 130, 0.15)' : '#f3f4f6', borderRadius:99, marginBottom:5, width:`${w}%` }} />
                      ))}
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                        <span style={{ fontSize:10, color:'#4B0082', fontWeight:700, fontFamily: 'var(--font-varela)' }}>✦ Explore more</span>
                        <span style={{ fontSize:10, color:'#ccc' }}>Page 1</span>
                      </div>
                    </div>
                  ))}
                </div>
              </InteractiveFeatureCard>
            </li>

            {/* 2. AI Summary */}
            <li style={{ width:'100%', maxWidth: 1000 }} className="reveal-child">
              <InteractiveFeatureCard style={{ backgroundImage:'linear-gradient(to right, #FFF, #E8FFF6)' }}>
                <div style={{ flex:'1 1 400px', minWidth:0 }}>
                  <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:28, marginBottom:28 }}>
                    <div style={{ width:88, height:88, background:'linear-gradient(135deg,#D1FAE5,#10B981)', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)' }}>
                      <FileText style={{ width:40, height:40, color:'white' }} weight="light" />
                    </div>
                    <div>
                      <h3 style={{ color:'#111', fontFamily:'var(--font-outfit)', fontWeight:800, lineHeight:'140%', fontSize:28, marginBottom:4, letterSpacing: '-0.01em' }}>AI Summary</h3>
                      <p style={{ color:'#059669', fontFamily:'var(--font-varela)', fontWeight:700, lineHeight:'140%', fontSize:16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review faster, anytime</p>
                    </div>
                  </div>
                  <p style={{ fontSize:17, color:'#475569', fontFamily:'var(--font-varela)', fontWeight:400, lineHeight:'180%', maxWidth:443 }}>
                    Turn lengthy lectures, articles, or textbooks into quick, scannable summaries so you understand the topic fast. Perfect before tests or quick revision.
                  </p>
                </div>
                {/* Mockup */}
                <div style={{ width:320, flexShrink:0, background:'white', borderRadius:12, border:'1px solid #e8e8ec', padding:20, boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:12, borderBottom:'1px solid #f3f4f6' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#059669' }}>AI Summary</span>
                    <div style={{ display:'flex', gap:6 }}>
                      {['A','A+','◫'].map(c => <span key={c} style={{ fontSize:11, fontWeight:700, color:'#ccc' }}>{c}</span>)}
                    </div>
                  </div>
                  <div style={{ background:'#f0fdf4', borderRadius:10, padding:14, marginBottom:12 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#059669', marginBottom:8 }}>📋 Key Takeaways</div>
                    {[95,80,70,60].map((w,i) => <div key={i} style={{ height:7, background:'rgba(5,150,105,0.15)', borderRadius:99, marginBottom:5, width:`${w}%` }} />)}
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#333', marginBottom:8 }}>⚡ Quick Overview</div>
                  {[100,85,65].map((w,i) => <div key={i} style={{ height:7, background:'#f3f4f6', borderRadius:99, marginBottom:5, width:`${w}%` }} />)}
                </div>
              </InteractiveFeatureCard>
            </li>

            {/* 3. AI Flashcards */}
            <li style={{ width:'100%', maxWidth: 1000 }} className="reveal-child">
              <InteractiveFeatureCard style={{ backgroundImage:'linear-gradient(to right, #FFF, #FEE)' }}>
                <div style={{ flex:'1 1 400px', minWidth:0 }}>
                  <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:28, marginBottom:28 }}>
                    <div style={{ width:88, height:88, background:'linear-gradient(135deg,#FEE2E2,#EF4444)', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)' }}>
                      <Stack style={{ width:40, height:40, color:'white' }} weight="light" />
                    </div>
                    <div>
                      <h3 style={{ color:'#111', fontFamily:'var(--font-outfit)', fontWeight:800, lineHeight:'140%', fontSize:28, marginBottom:4, letterSpacing: '-0.01em' }}>AI Flashcards</h3>
                      <p style={{ color:'#DC2626', fontFamily:'var(--font-varela)', fontWeight:700, lineHeight:'140%', fontSize:16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Make It Impossible to Forget</p>
                    </div>
                  </div>
                  <p style={{ fontSize:17, color:'#475569', fontFamily:'var(--font-varela)', fontWeight:400, lineHeight:'180%', maxWidth:443 }}>
                    Auto-generate flashcards from your material and practice active recall — the science-backed method that makes information stick.
                  </p>
                </div>
                {/* Mockup */}
                <div style={{ width:320, flexShrink:0 }}>
                  <div style={{ background:'white', borderRadius:16, border:'1px solid #fecaca', padding:24, boxShadow:'0 4px 24px rgba(0,0,0,0.06)', marginBottom:10, minHeight:120, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={{ fontSize:10, fontWeight:800, color:'#dc2626', letterSpacing:'0.08em', textTransform:'uppercase' }}>Question</span>
                    <p style={{ fontSize:13, fontWeight:600, color:'#333', textAlign:'center', lineHeight:1.5 }}>What is the powerhouse of the cell?</p>
                    <div style={{ height:1, width:'60%', background:'#fee2e2', margin:'4px 0' }} />
                    <p style={{ fontSize:12, fontWeight:500, color:'#aaa', textAlign:'center' }}>Tap to reveal answer →</p>
                  </div>
                  <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
                    {[{l:'✗ Again', c:'#fee2e2', t:'#dc2626'},{l:'~ Hard', c:'#fef3c7', t:'#d97706'},{l:'✓ Easy', c:'#d1fae5', t:'#059669'}].map(({l,c,t}) => (
                      <div key={l} style={{ flex:1, background:c, borderRadius:8, padding:'7px 4px', textAlign:'center', fontSize:11, fontWeight:700, color:t }}>{l}</div>
                    ))}
                  </div>
                </div>
              </InteractiveFeatureCard>
            </li>

            {/* 4. AI Quizzes */}
            <li style={{ width:'100%', maxWidth: 1000 }} className="reveal-child">
              <InteractiveFeatureCard style={{ backgroundImage:'linear-gradient(to right, #FFF, #ECE7FF)' }}>
                <div style={{ flex:'1 1 400px', minWidth:0 }}>
                  <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:28, marginBottom:28 }}>
                    <div style={{ width:88, height:88, background:'linear-gradient(135deg,#F8FAFC,#E2E8F0)', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
                      <GraduationCap style={{ width:40, height:40, color:'#111' }} weight="light" />
                    </div>
                    <div>
                      <h3 style={{ color:'#111', fontFamily:'var(--font-outfit)', fontWeight:800, lineHeight:'140%', fontSize:28, marginBottom:4, letterSpacing: '-0.01em' }}>AI Quizzes</h3>
                      <p style={{ color:'#4B0082', fontFamily:'var(--font-varela)', fontWeight:700, lineHeight:'140%', fontSize:16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Test yourself before exams do</p>
                    </div>
                  </div>
                  <p style={{ fontSize:17, color:'#475569', fontFamily:'var(--font-varela)', fontWeight:400, lineHeight:'180%', maxWidth:443 }}>
                    Auto-generate quizzes directly from your material. Check your understanding, spot gaps early, and find weak spots before the exam does.
                  </p>
                </div>
                {/* Mockup */}
                <div style={{ width:320, flexShrink:0, background:'white', borderRadius:12, border:'1px solid #e8e8ec', padding:20, boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:11, fontWeight:800, color:'#888', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Question 3 of 12</div>
                  <p style={{ fontSize:13, fontWeight:600, color:'#333', lineHeight:1.6, marginBottom:14 }}>Which organelle is responsible for producing ATP?</p>
                  {[
                    { letter:'A', text:'Nucleus', correct:false },
                    { letter:'B', text:'Mitochondria', correct:true },
                    { letter:'C', text:'Ribosome', correct:false },
                    { letter:'D', text:'Golgi apparatus', correct:false },
                  ].map(({ letter, text, correct }) => (
                    <div key={letter} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 12px', borderRadius:8, marginBottom:6, border:`1px solid ${correct ? 'rgba(75, 0, 130, 0.5)' : '#f3f4f6'}`, background: correct ? 'rgba(75, 0, 130, 0.06)' : '#fafafa' }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, flexShrink:0, background: correct ? '#4B0082' : '#e5e7eb', color: correct ? 'white' : '#aaa' }}>{letter}</div>
                      <span style={{ fontSize:12, fontWeight: correct ? 700 : 400, color: correct ? '#4B0082' : '#666' }}>{text}</span>
                      {correct && <Check style={{ width:12, height:12, color:'#111', marginLeft:'auto' }} weight="light" />}
                    </div>
                  ))}
                </div>
              </InteractiveFeatureCard>
            </li>

            {/* 5. AI Tutor */}
            <li style={{ width:'100%', maxWidth: 1000 }} className="reveal-child">
              <InteractiveFeatureCard style={{ backgroundImage:'linear-gradient(to right, #FFF, #E4FAFF)' }}>
                <div style={{ flex:'1 1 400px', minWidth:0 }}>
                  <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:28, marginBottom:28 }}>
                    <div style={{ width:88, height:88, background:'linear-gradient(135deg,#E0F2FE,#0284C7)', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)' }}>
                      <MessageSquare style={{ width:40, height:40, color:'white' }} weight="light" />
                    </div>
                    <div>
                      <h3 style={{ color:'#111', fontFamily:'var(--font-outfit)', fontWeight:800, lineHeight:'140%', fontSize:28, marginBottom:4, letterSpacing: '-0.01em' }}>AI Tutor</h3>
                      <p style={{ color:'#0284C7', fontFamily:'var(--font-varela)', fontWeight:700, lineHeight:'140%', fontSize:16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ask questions. Get clarity 24/7</p>
                    </div>
                  </div>
                  <p style={{ fontSize:17, color:'#475569', fontFamily:'var(--font-varela)', fontWeight:400, lineHeight:'180%', maxWidth:443 }}>
                    Chat with the AI Tutor, available 24/7, to explain concepts, clear confusion, and help you learn at your own pace. No more waiting for office hours.
                  </p>
                </div>
                {/* Mockup — chat bubbles */}
                <div style={{ width:320, flexShrink:0, background:'white', borderRadius:12, border:'1px solid #e8e8ec', padding:20, boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <div style={{ alignSelf:'flex-end', maxWidth:'80%', background:'#f3f4f6', padding:'10px 14px', borderRadius:'12px 12px 0 12px', fontSize:12, fontWeight:600, color:'#555' }}>
                      Can you explain osmosis simply?
                    </div>
                    <div style={{ maxWidth:'100%', background:'rgba(2,132,199,0.06)', border:'1px solid rgba(2,132,199,0.2)', padding:'12px 14px', borderRadius:'12px 12px 12px 0', fontSize:12, color:'#333' }}>
                      <div style={{ fontWeight:700, color:'#0284c7', marginBottom:6, fontSize:11 }}>⚡ LUTER AI</div>
                      <p style={{ lineHeight:1.7, fontWeight:400 }}>Osmosis is the movement of water molecules through a membrane from low to high concentration — like water trying to "balance itself out" across a barrier.</p>
                    </div>
                  </div>
                </div>
              </InteractiveFeatureCard>
            </li>

          </ul>
        </div>
      </section>

      {/* ═══════════════ UPLOAD ANYTHING — FORMATS ═══════════════ */}
      <section style={{ padding: '96px 0', background: '#F8F8F8' }} aria-labelledby="supported-formats-heading">
        <div className="container-full" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>

          {/* Header */}
          <h2 id="supported-formats-heading" className="reveal-child" style={{ fontSize:'clamp(1.8rem, 3.5vw, 3rem)', textAlign:'center', maxWidth:650, margin:'0 auto 16px', color:'#111', fontFamily:'var(--font-outfit)', fontWeight:800, lineHeight:'120%', letterSpacing: '-0.02em' }}>
            Upload anything. <span style={{ color:'#4B0082', fontStyle:'italic' }}>Learn everything</span>
          </h2>
          <p className="reveal-child" style={{ fontSize:18, color:'#475569', fontFamily:'var(--font-varela)', fontWeight:400, lineHeight:'180%', textAlign:'center', maxWidth:640, marginBottom:56 }}>
            Record live lectures or upload any file. Luter instantly turns them into notes, summaries, flashcards, quizzes, and a 24/7 AI tutor.
          </p>

          {/* Three-column layout */}
          <div className="reveal-child" style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:36, alignItems:'center', width:'100%', maxWidth:960 }}>

            {/* Left icon grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, justifyItems:'end' }}>
              {[
                { emoji:'📄', label:'PDF', color:'#ede9fe', accent:'#7c3aed' },
                { emoji:'🎙️', label:'Record', color:'#fce7f3', accent:'#db2777' },
                { emoji:'🎧', label:'Audio', color:'#e0f2fe', accent:'#0284c7' },
                { emoji:'🔗', label:'Links', color:'#fef3c7', accent:'#d97706' },
              ].map(({ emoji, label, color, accent }, i) => (
                <div key={label} style={{
                  width: 88, height: 88,
                  background: 'white',
                  borderRadius: 16,
                  border: '1px solid #e8e8ec',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  marginTop: i % 2 === 0 ? 24 : 0,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 28px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ width:44, height:44, background:color, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                    {emoji}
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:'#aaa' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Center card */}
            <article style={{ display:'flex', flexDirection:'column', alignItems:'center', background:'white', borderRadius:20, padding:'32px 24px', border:'1px solid #e8e8ec', maxWidth:240, width:'100%', boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>
              {/* Logo icon */}
              <div style={{ width:80, height:80, background:'linear-gradient(135deg,#F8FAFC,#E2E8F0)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, boxShadow:'0 8px 24px rgba(15,23,42,0.08)' }}>
                <BookOpen style={{ width:38, height:38, color:'#111' }} weight="bold" />
              </div>
              <h4 style={{ color:'#111', textAlign:'center', fontFamily:'var(--font-outfit)', fontWeight:800, lineHeight:'140%', fontSize:18, padding:'0 8px', marginBottom:10 }}>
                Any file. Any format. Any subject.
              </h4>
              <p style={{ color:'#475569', textAlign:'center', fontFamily:'var(--font-varela)', fontWeight:400, lineHeight:'180%', fontSize:14, padding:'0 8px', marginBottom:20 }}>
                PDFs, slides, YouTube videos, audio, web links, and more
              </p>
              <PremiumButton size="lg" style={{ width: '100%' }}>
                Start Now
              </PremiumButton>
            </article>

            {/* Right icon grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, justifyItems:'start' }}>
              {[
                { emoji:'📝', label:'Docs', color:'#dcfce7', accent:'#16a34a' },
                { emoji:'📚', label:'Books', color:'#fce7f3', accent:'#db2777' },
                { emoji:'📊', label:'Slides', color:'#fff7ed', accent:'#ea580c' },
                { emoji:'▶️', label:'YouTube', color:'#fee2e2', accent:'#dc2626' },
              ].map(({ emoji, label, color, accent }, i) => (
                <div key={label} style={{
                  width: 88, height: 88,
                  background: 'white',
                  borderRadius: 16,
                  border: '1px solid #e8e8ec',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  marginTop: i % 2 === 0 ? 24 : 0,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 28px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ width:44, height:44, background:color, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                    {emoji}
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:'#aaa' }}>{label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      


      {/* ═══════════════ COMPARISON ═══════════════ */}
      <section style={{ padding: '80px 0', background: '#fafafa' }}>
        <div className="container-custom">
          <h2 className="reveal-child" style={{ textAlign:'center', fontSize:'clamp(1.8rem,3.5vw,3rem)', marginBottom:48, fontFamily: 'var(--font-outfit)', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
            The smarter way to study.
          </h2>
          <div className="reveal-child" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:'1px solid var(--border)', borderRadius:28, overflow:'hidden', boxShadow:'var(--card-shadow)' }}>
            {/* Old way */}
            <div style={{ padding:'48px 40px', background:'white' }}>
              <h4 style={{ fontSize:13, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:32, fontFamily: 'var(--font-outfit)' }}>The Old Way</h4>
              {['Scanning 50 slides one by one','Zero practice questions','Notes scattered everywhere','Zoning out during lectures','Cramming the night before'].map((item) => (
                <div key={item} className="comparison-item-old" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, color: '#64748B', fontFamily: 'var(--font-varela)', fontWeight: 500 }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'#f3f4f6', border:'1px solid #e5e7eb', flexShrink:0 }} />
                  {item}
                </div>
              ))}
            </div>
            {/* Luter way */}
            <div style={{ padding:'48px 40px', background:'#4B0082' }}>
              <h4 style={{ fontSize:13, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:32, fontFamily: 'var(--font-outfit)' }}>The Luter Way</h4>
              {['Instant AI-powered summaries','Auto-generated CBT exams','One unified study workspace','Focused, active learning sessions','Science-based retention system'].map((item) => (
                <div key={item} className="comparison-item-new" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, color: 'white', fontFamily: 'var(--font-varela)', fontWeight: 600 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Check style={{ width:12, height:12, color:'white' }} weight="light" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      
      {/* ═══════════════ PRICING TEASER ═══════════════ */}
      <section id="pricing" style={{ padding:'80px 0', background:'white' }}>
        <div style={{ position: 'relative', zIndex: 1, paddingBottom: 60 }}>
          <div className="container-custom" style={{ textAlign: 'center', marginBottom: 60 }}>
            <RevealDiv>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#4B0082', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20, background: 'rgba(75, 0, 130, 0.07)', padding: '8px 20px', borderRadius: 99, border: '1px solid rgba(75, 0, 130, 0.12)', fontFamily: 'var(--font-outfit)' }}>
                <Lightning size={14} weight="light" color="#111" /> Upgrade anytime
              </div>
            </RevealDiv>
            <RevealDiv delay={0.1}>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, fontFamily: 'var(--font-outfit)', color: '#111', marginBottom: 20, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                Simple pricing for{' '}
                <span style={{ color:'#4B0082', fontStyle:'italic' }}>students</span>
              </h2>
            </RevealDiv>
            <RevealDiv delay={0.15}>
              <p style={{ fontSize: 18, color: '#475569', maxWidth: 560, margin: '0 auto 36px', fontWeight: 400, lineHeight: 1.7, fontFamily: 'var(--font-varela)' }}>
                Start free. Upgrade when you're ready. No tricks, no hidden fees.
              </p>
            </RevealDiv>
            <RevealDiv delay={0.2}>
              <div style={{ display: 'inline-flex', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: 6, gap: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <button onClick={() => setIsSemester(false)} style={{ padding: '10px 32px', borderRadius: 99, background: !isSemester ? '#4B0082' : 'transparent', color: !isSemester ? 'white' : '#64748B', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'var(--font-outfit)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly</button>
                <button onClick={() => setIsSemester(true)} style={{ padding: '10px 32px', borderRadius: 99, background: isSemester ? '#4B0082' : 'transparent', color: isSemester ? 'white' : '#64748B', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-outfit)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Per Semester <span style={{ fontSize: 10, background: '#D1FAE5', color: '#059669', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>Best Value</span>
                </button>
              </div>
            </RevealDiv>
          </div>

          <div className="container-full">
            <RevealDiv>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0, maxWidth: 1050, margin: '0 auto' }}>
                {plans.map((plan) => (
                  <div key={plan.name} style={{
                    flex: '1 1 300px', maxWidth: 360,
                    background: plan.bg, color: plan.color,
                    borderRadius: 24, padding: plan.isPopular ? '44px 32px' : '36px 28px',
                    border: plan.isPopular ? 'none' : `1px solid ${plan.border}`,
                    boxShadow: plan.isPopular ? '0 32px 64px rgba(113,128,254,0.25)' : '0 4px 20px rgba(0,0,0,0.03)',
                    transform: plan.isPopular ? 'scaleY(1.04)' : 'scaleY(1)',
                    position: 'relative', zIndex: plan.isPopular ? 10 : 1,
                    display: 'flex', flexDirection: 'column',
                    margin: plan.isPopular ? '-8px 0' : '8px 0'
                  }}>
                    {plan.isPopular && (
                      <div style={{ display: 'inline-flex', alignSelf: 'center', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', color: 'white', padding: '6px 16px', borderRadius: 99, fontSize: 11, fontWeight: 800, marginBottom: 20, border: '1px solid rgba(255,255,255,0.3)', fontFamily: 'var(--font-outfit)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Lightning size={12} weight="light" color="white" /> MOST POPULAR
                      </div>
                    )}
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px 0' }}>{plan.name}</h3>
                      <span style={{ fontSize: 12, fontWeight: 600, color: plan.isPopular ? 'rgba(255,255,255,0.8)' : '#888' }}>{plan.trial}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 28 }}>
                      <span style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{plan.priceMonthly === 0 ? '₦0' : `₦${isSemester ? plan.priceSemester.toLocaleString() : plan.priceMonthly.toLocaleString()}`}</span>
                      {plan.priceMonthly > 0 && <span style={{ fontSize: 14, fontWeight: 600, color: plan.isPopular ? 'rgba(255,255,255,0.7)' : '#aaa', marginBottom: 8 }}>/{isSemester ? 'semester' : 'mo'}</span>}
                    </div>
                    <PremiumButton 
                      to="/signup" 
                      size="lg"
                      variant={plan.isPopular ? 'primary' : 'outline'}
                      style={{ width: '100%', marginBottom: 32 }}
                    >
                      {plan.buttonText}
                    </PremiumButton>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                      {plan.features.map(f => (
                        <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: plan.isPopular ? 'rgba(255,255,255,0.2)' : 'rgba(75, 0, 130, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                            <Check size={10} color={plan.isPopular ? 'white' : '#111'} weight="light" />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: plan.isPopular ? 'white' : '#475569', fontFamily: 'var(--font-varela)' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </RevealDiv>
          </div>
        </div>
      </section>

      <SharedFAQ items={homeFaqs} />

      
      <SharedFooter />
    </div>
  );
}
