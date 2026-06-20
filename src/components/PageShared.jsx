import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CaretRight as ChevronRight,
  CaretDown as ChevronDown,
  CaretDown,
  CaretUp,
  Stack,
  TrendUp as TrendingUp,
  UsersThree as Users,
  Lightning,
  XLogo as Twitter,
  InstagramLogo as Instagram,
  LinkedinLogo as Linkedin,
  Plus,
  Minus,
  FacebookLogo as Facebook,
  TiktokLogo as Music,
  List as Menu,
  Brain,
  Cards,
  CheckCircle,
  Pen,
  Check,
  MagnifyingGlass
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import FallingElements from './shared/FallingElements';
import { getAppUrl } from '../utils/urlUtils';
import ThemeToggle from './shared/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

export const PremiumButton = ({ 
  children, to, onClick, 
  style = {}, variant = 'primary', size = 'md',
  disabled = false, icon: Icon = null, type = 'button',
  isUpgradeButton = false,
  ...rest
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isLarge = size === 'lg';
  
  // User's specific RGB palette
  const colors = {
    bg: isUpgradeButton ? 'white' : 'rgba(196, 181, 253, 1)',      // primary-300
    border: isUpgradeButton ? '#FB923C' : 'rgba(167, 139, 250, 1)',  // primary-400
    text: isUpgradeButton ? '#FB923C' : 'rgba(46, 16, 101, 1)',      // primary-950
    hoverBg: isUpgradeButton ? '#FB923C' : 'rgba(221, 214, 254, 1)', // primary-200
    hoverBorder: isUpgradeButton ? '#FB923C' : 'rgba(196, 181, 253, 1)', // primary-300
    outlineBg: 'rgba(245, 243, 255, 0.5)',
    outlineBorder: 'rgba(196, 181, 253, 0.6)'
  };

  const height = isLarge ? '56px' : '44px';
  const borderRadius = isLarge ? '16px' : '12px';
  const padding = isLarge ? '0 32px' : '0 20px';
  const fontSize = isLarge ? '17px' : '15px';
  const fontWeight = 700; // Keep headings readable and prominent

  const getBackground = () => {
    if (disabled) return '#F3F4F6';
    if (isPrimary) return isHovered ? colors.hoverBg : colors.bg;
    if (isOutline) return isHovered ? colors.outlineBg : 'transparent';
    return 'white';
  };

  const getBorder = () => {
    if (disabled) return '1px solid #E5E7EB';
    if (isPrimary) return `1px solid ${isHovered ? colors.hoverBorder : colors.border}`;
    if (isOutline) return `1px solid ${isHovered ? colors.border : colors.outlineBorder}`;
    return `1px solid ${colors.border}`;
  };

  const getBorderBottom = () => {
    if (disabled) return '1px solid #E5E7EB';
    if (isPrimary) {
      const bColor = isHovered ? colors.hoverBorder : colors.border;
      return isPressed ? `1px solid ${bColor}` : `4px solid ${bColor}`;
    }
    if (isOutline) {
      const bColor = isHovered ? colors.border : colors.outlineBorder;
      return isPressed ? `1px solid ${bColor}` : `4px solid ${bColor}`;
    }
    return `1px solid ${colors.border}`;
  };

  const getTransform = () => {
    if (disabled) return 'none';
    if (isPressed) return 'translateY(3px)';
    if (isHovered) return 'translateY(-2px)';
    return 'translateY(0)';
  };

  const getBoxShadow = () => {
    if (disabled) return 'none';
    if (isPressed) return 'none';
    if (isHovered) {
      return isPrimary 
        ? '0 8px 16px rgba(167, 139, 250, 0.25)' 
        : '0 8px 16px rgba(196, 181, 253, 0.15)';
    }
    return isPrimary 
      ? '0 4px 8px rgba(167, 139, 250, 0.12)' 
      : 'none';
  };

  const getColor = () => {
    if (disabled) return '#9CA3AF';
    if (isUpgradeButton && isPrimary && isHovered) return 'white';
    return colors.text;
  };

  const baseStyle = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: height, padding: padding, borderRadius: borderRadius,
    background: getBackground(),
    color: getColor(),
    border: getBorder(),
    borderBottom: getBorderBottom(),
    fontSize: fontSize, 
    fontWeight: fontWeight, 
    fontFamily: 'var(--font-display)',
    textTransform: 'none',
    letterSpacing: isLarge ? '-0.01em' : 'normal',
    textDecoration: 'none', 
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box', gap: '10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: 1,
    transform: getTransform(),
    boxShadow: getBoxShadow(),
    width: '100%',
    maxWidth: style.width === '100%' ? '100%' : 'max-content',
    // Mobile touch improvements
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'manipulation',
    ...style
  };

  const Component = to ? (to.startsWith('http') ? 'a' : Link) : 'button';
  const componentProps = to ? (to.startsWith('http') ? { href: to } : { to }) : { onClick, disabled, type };

  const isTouchCapable = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover)').matches === false;

  const handleMouseEnter = () => { if (!disabled && !isTouchCapable()) setIsHovered(true); };
  const handleMouseLeave = () => { setIsHovered(false); setIsPressed(false); };
  const handleMouseDown = () => { if (!disabled && !isTouchCapable()) setIsPressed(true); };
  const handleMouseUp = () => setIsPressed(false);
  
  return (
    <Component 
      {...componentProps}
      {...rest}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {children}
        {(isPrimary || isLarge) && Icon && <Icon size={isLarge ? 22 : 18} weight="light" />}
        {isLarge && !Icon && variant === 'primary' && <ChevronRight size={20} weight="light" />}
      </span>
    </Component>
  );
};

export const AuthNavbar = ({ type = 'signin' }) => {
  const isSignIn = type === 'signin';
  
  return (
    <div className="auth-navbar" style={{
      position: 'relative', zIndex: 100,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      width: '100%', boxSizing: 'border-box'
    }}>
      <style>{`
        .auth-navbar {
          padding: 24px 80px;
        }

        .auth-navbar-logo {
          height: 44px;
          width: auto;
          display: block;
        }

        .auth-navbar-side {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        @media (max-width: 860px) {
          .auth-navbar {
            padding: 20px 28px;
          }

          .auth-navbar-logo {
            height: 38px;
          }

          .auth-navbar-side {
            gap: 12px;
          }

          .auth-navbar-side span {
            display: none;
          }
        }

        @media (max-width: 520px) {
          .auth-navbar {
            padding: 18px 18px;
          }

          .auth-navbar-logo {
            height: 34px;
          }
        }
      `}</style>
      <Link to={getAppUrl("/")} style={{ textDecoration: 'none' }}>
        <img src="/Header logo.png" alt="Luter" className="auth-navbar-logo" />
      </Link>
      
      <div className="auth-navbar-side">
        <span style={{ fontSize: 14, fontWeight: 500, color: '#64748B', fontFamily: 'var(--font-display)' }}>
          {isSignIn ? "Don't have an account?" : "Already have an account?"}
        </span>
        <PremiumButton 
          to={getAppUrl(isSignIn ? "/signup" : "/signin")} 
          variant={isSignIn ? "primary" : "secondary"}
          style={!isSignIn ? {
            background: 'transparent',
            border: '2px solid transparent',
            color: '#475569',
            borderRadius: '14px'
          } : {}}
          onMouseEnter={!isSignIn ? (e) => {
            e.currentTarget.style.borderColor = '#C7B9FF';
            e.currentTarget.style.color = '#4B0082';
            e.currentTarget.style.background = 'rgba(199, 185, 255, 0.05)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          } : undefined}
          onMouseLeave={!isSignIn ? (e) => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.color = '#475569';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'translateY(0px)';
          } : undefined}
        >
          {isSignIn ? "Sign up" : "Sign in"}
        </PremiumButton>
      </div>
    </div>
  );
};

/* Shared Animated Blob Background */
export function PageBackground() {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(151,24,251,0.08) 0%, transparent 70%)', top: '-200px', left: '-200px', animation: 'blobMove1 20s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(113,128,254,0.09) 0%, transparent 70%)', bottom: '-100px', right: '-100px', animation: 'blobMove2 25s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(193,77,255,0.06) 0%, transparent 70%)', top: '40%', left: '50%', animation: 'blobMove3 30s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, rgba(151,24,251,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(151,24,251,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <style>{`
        @keyframes blobMove1 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(120px,80px) scale(1.15)} }
        @keyframes blobMove2 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(-80px,-60px) scale(1.2)} }
        @keyframes blobMove3 { 0%{transform:translate(-50%,0) scale(1)} 100%{transform:translate(-50%,-80px) scale(0.85)} }
      `}</style>
    </div>
  );
}

export function HighlightedText({ texts, style = {} }) {
  const displayText = texts && texts.length > 0 ? texts[0] : '';
  return (
    <span style={{ 
      background: 'linear-gradient(90deg, var(--primary), #0284c7)', 
      WebkitBackgroundClip: 'text', 
      WebkitTextFillColor: 'transparent', 
      fontWeight: 800,
      borderBottom: '3px solid rgba(151,24,251,0.2)',
      paddingBottom: '2px',
      ...style 
    }}>
      {displayText}
    </span>
  );
}

/* Fade-in on scroll hook */
/* Fade-in on scroll hook */
export function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

export function RevealDiv({ children, style = {}, delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(40px)', transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

export function SharedFAQ({ items = [], title = "Frequently Asked Questions", subtitle = "We're on the hot seat." }) {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="container-full" style={{ padding: '100px 20px', background: 'white' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <RevealDiv>
          <h2 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 3rem)', 
            fontWeight: 800, 
            color: '#111', 
            marginBottom: 16, 
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display)'
          }}>
            {title}
          </h2>
          <p style={{ 
            fontSize: 20, 
            color: '#475569', 
            fontWeight: 500,
            fontFamily: 'var(--font-display)'
          }}>
            {subtitle}
          </p>
        </RevealDiv>
      </div>

      <div style={{ 
        maxWidth: 800, 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {items.map((item, idx) => (
          <RevealDiv key={idx} delay={idx * 0.05}>
            <div 
              onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
              style={{
                background: '#f8f9fb',
                borderRadius: 40,
                padding: activeIndex === idx ? '32px 40px' : '20px 40px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f8f9fb';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ 
                  color: '#111',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24
                }}>
                  <motion.div
                    animate={{ rotate: activeIndex === idx ? 0 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeIndex === idx ? <Minus size={20} weight="light" /> : <Plus size={20} weight="light" />}
                  </motion.div>
                </div>
                <h3 style={{ 
                  fontSize: 18, 
                  fontWeight: 800, 
                  color: '#111', 
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1.4,
                  letterSpacing: '-0.01em'
                }}>
                  {item.q}
                </h3>
              </div>
              
              <AnimatePresence>
                {activeIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 20 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{ 
                      fontSize: 16, 
                      color: '#475569', 
                      lineHeight: 1.7, 
                      fontWeight: 400, 
                      margin: '0 0 0 44px',
                      fontFamily: 'var(--font-body)'
                    }}>
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </RevealDiv>
        ))}
      </div>
    </div>
  );
}
/* ── Animated nav link with sliding underline ── */
const NavLink = ({ label, to: href, isActive, onMouseEnter, onMouseLeave, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const active = isActive || hovered;

  return (
    <Link
      to={href}
      onMouseEnter={(e) => {
        setHovered(true);
        if (onMouseEnter) onMouseEnter(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        if (onMouseLeave) onMouseLeave(e);
      }}
      style={{
        position: 'relative',
        textDecoration: 'none',
        fontSize: 16,
        fontWeight: isActive ? 800 : 600,
        color: isDark ? (isActive ? '#c4b5fd' : '#c4b5fd') : '#2e1065',
        fontFamily: 'var(--font-display)',
        paddingBottom: 4,
        transition: 'color 0.2s ease',
        letterSpacing: hovered ? '0.01em' : '0',
      }}
    >
      {label}
      <span style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 2, borderRadius: 2,
        background: 'linear-gradient(90deg,#C4B5FD,#A78BFA)',
        width: active ? '100%' : '0%',
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'block',
      }} />
    </Link>
  );
};

const featuresList = [
  { icon: <Pen size={20} weight="duotone" color="#8b5cf6" />, title: 'Curriculums', desc: 'AI-generated learning paths', bg: '#F3E8FF' },
  { icon: <Cards size={20} weight="duotone" color="#d97706" />, title: 'Flashcards', desc: 'Quality flashcards in seconds', bg: '#FEF3C7' },
  { icon: <Brain size={20} weight="duotone" color="#0284c7" />, title: 'AI Assistant', desc: 'Chat with your documents', bg: '#E0F2FE' },
  { icon: <CheckCircle size={20} weight="duotone" color="#16a34a" />, title: 'Quizzes', desc: 'Test your knowledge', bg: '#DCFCE7' },
];

const languages = [
  { code: 'EN', label: 'English (EN)' },
  { code: 'IT', label: 'Italian (IT)' },
  { code: 'ES', label: 'Spanish (ES)' },
  { code: 'FR', label: 'French (FR)' },
  { code: 'DE', label: 'German (DE)' },
  { code: 'SV', label: 'Swedish (SV)' },
  { code: 'PL', label: 'Polish (PL)' },
];

export function SharedNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [navWidth, setNavWidth] = useState(() => typeof window === 'undefined' ? 1200 : window.innerWidth);
  const location = useLocation();
  const { isDark } = useTheme();
  const isSmallNav = navWidth < 640;
  const isTinyNav = navWidth < 380;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    setScrolled(window.scrollY > 40);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => setNavWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        paddingTop: scrolled ? 12 : 0,
        transition: 'padding-top 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <motion.nav
          initial={false}
          animate={{
            width: scrolled ? (isSmallNav ? 'calc(100% - 24px)' : 'min(100% - 48px, 940px)') : '100%',
            borderRadius: scrolled ? 100 : 0,
            background: scrolled ? (isDark ? 'rgba(26,26,26,0.95)' : 'rgba(255,255,255,0.95)') : 'rgba(255,255,255,0)',
            border: scrolled ? (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)') : '1px solid rgba(0,0,0,0)',
            boxShadow: scrolled ? (isDark ? '0 4px 24px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)' : '0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)') : 'none',
            padding: scrolled ? (isSmallNav ? '0 8px 0 14px' : '0 12px 0 28px') : (isSmallNav ? '0 14px' : '0 48px'),
            height: scrolled ? (isSmallNav ? 56 : 58) : (isSmallNav ? 64 : 76),
          }}
          transition={{ type: 'spring', damping: 26, stiffness: 240, mass: 0.8 }}
          style={{
            pointerEvents: 'auto',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-display)',
            position: 'relative',
          }}
        >
          {/* Logo */}
          <Link to={getAppUrl('/')} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <motion.img
              src="/Header logo.png"
              alt="Luter"
              initial={{ height: scrolled ? (isSmallNav ? 28 : 32) : (isSmallNav ? 34 : 44) }}
              animate={{ height: scrolled ? (isSmallNav ? 28 : 32) : (isSmallNav ? 34 : 44) }}
              transition={{ duration: 0.3 }}
              style={{ width: 'auto', display: 'block' }}
            />
          </Link>



          {/* Desktop right buttons */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowLang(true)}
              onMouseLeave={() => setShowLang(false)}
            >
              <div
                style={{
                  fontSize: 14, fontWeight: 500,
                  padding: '0 16px', 
                  height: 38,
                  display: 'flex', alignItems: 'center', gap: 6,
                  borderRadius: 100,
                  color: '#2e1065',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
              >
                EN
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.5 }}>
                  <CaretUp size={10} weight="fill" style={{ marginBottom: -3 }} />
                  <CaretDown size={10} weight="fill" style={{ marginTop: -3 }} />
                </div>
              </div>

              {/* Language Popover */}
              <AnimatePresence>
                {showLang && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: 12,
                      width: 220,
                      background: 'var(--background)',
                      borderRadius: 16,
                      boxShadow: '0 12px 32px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MagnifyingGlass size={16} color="#9CA3AF" />
                      <input 
                        type="text" 
                        placeholder="Search Language" 
                        value={langSearch}
                        onChange={(e) => setLangSearch(e.target.value)}
                        style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', color: '#374151', fontFamily: 'var(--font-display)' }} 
                      />
                    </div>
                    <div style={{ maxHeight: 240, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {languages.filter(l => l.label.toLowerCase().includes(langSearch.toLowerCase())).map((l, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background: l.code === 'EN' ? '#F3F4F6' : 'transparent',
                            color: '#374151',
                            fontSize: 14,
                            fontWeight: l.code === 'EN' ? 500 : 400,
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={e => { if (l.code !== 'EN') e.currentTarget.style.background = 'rgba(0,0,0,0.02)' }}
                          onMouseLeave={e => { if (l.code !== 'EN') e.currentTarget.style.background = 'transparent' }}
                        >
                          <div style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                            {l.code === 'EN' && <Check size={14} weight="bold" color="#111" />}
                          </div>
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <Link
              to={getAppUrl('/signin')}
              style={{
                fontSize: 15, fontWeight: 600,
                padding: '0 8px', 
                height: scrolled ? 40 : 42,
                display: 'flex', alignItems: 'center',
                color: '#2e1065',
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#1e1040'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#2e1065'; }}
            >Log in</Link>
            
            <Link
              to={getAppUrl('/signup')}
              style={{
                fontSize: 15, fontWeight: 600,
                padding: scrolled ? '0 20px' : '0 24px', 
                height: scrolled ? 40 : 44,
                display: 'flex', alignItems: 'center',
                borderRadius: 100,
                color: '#2E1065',
                background: '#C4B5FD',
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.background = '#DDD6FE'; 
                e.currentTarget.style.transform = 'translateY(-1px)'; 
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.background = '#C4B5FD'; 
                e.currentTarget.style.transform = 'translateY(0)'; 
              }}
            >Get started</Link>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden" style={{ alignItems: 'center', gap: isTinyNav ? 4 : 8 }}>
            <ThemeToggle />
            <Link to={getAppUrl('/signup')} style={{ fontSize: isSmallNav ? 13 : 14, fontWeight: 600, padding: isSmallNav ? '0 12px' : '0 16px', height: isSmallNav ? 36 : 40, display: isTinyNav ? 'none' : 'flex', alignItems: 'center', borderRadius: 100, color: '#2E1065', background: '#C4B5FD', textDecoration: 'none', fontFamily: 'var(--font-display)' }}>Start free</Link>
            <button onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: isSmallNav ? 36 : 40, height: isSmallNav ? 36 : 40, borderRadius: '50%', background: scrolled ? 'rgba(0,0,0,0.04)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} aria-label={isOpen ? 'Close menu' : 'Open menu'}>
              <Menu size={22} weight="light" color="#374151" />
            </button>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(15px)',
              zIndex: 150,
              display: 'flex',
              flexDirection: 'column',
              padding: '110px 24px 40px',
              fontFamily: 'var(--font-body)'
            }}
          >
            {/* Top divider line */}
            <div style={{ position: 'absolute', top: 90, left: 24, right: 24, height: 1, background: 'rgba(0,0,0,0.05)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { l: 'Home', p: '/', i: <House size={22} weight="light" /> },
                { l: 'Login', p: '/signin', i: <TrendingUp size={22} weight="light" /> }
              ].map((item, idx) => (
                <motion.div
                  key={item.l}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                >
                  <Link 
                    to={getAppUrl(item.p)} 
                    onClick={() => setIsOpen(false)}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      fontSize: 18, 
                      fontWeight: 800, 
                      color: '#111',
                      textDecoration: 'none',
                      padding: '16px 20px',
                      borderRadius: 24,
                      background: 'rgba(0,0,0,0.02)',
                      border: '1px solid rgba(0,0,0,0.03)',
                      fontFamily: 'var(--font-display)'
                    }}
                  >
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 12, background: 'white', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', color: '#111'
                    }}>
                      {item.i}
                    </div>
                    {item.l}
                    <ChevronRight size={18} weight="light" style={{ marginLeft: 'auto', opacity: 0.3 }} />
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ marginTop: 'auto', padding: '0 4px' }}
            >
              <div style={{ 
                background: 'rgba(75, 0, 130, 0.05)', 
                padding: 20, borderRadius: 24, marginBottom: 20,
                border: '1px solid rgba(75, 0, 130, 0.1)'
              }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 4, fontFamily: 'var(--font-display)' }}>Level Up Your Grades</h4>
                <p style={{ fontSize: 13, color: '#111', opacity: 0.7, fontWeight: 500, fontFamily: 'var(--font-body)' }}>Join 5M+ students using AI to master their curriculum.</p>
              </div>
              <PremiumButton to={getAppUrl("/signup")} onClick={() => setIsOpen(false)} style={{ width: '100%', height: '56px' }}>
                Start Free Today
              </PremiumButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function StyledFAQ({ items = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const PALETTES = [
    { bg: "#F3E8FF", border: "rgba(151,24,251,0.12)",  glow: "rgba(151,24,251,0.22)"  },
    { bg: "#EFF6FF", border: "rgba(113,128,254,0.14)", glow: "rgba(113,128,254,0.24)" },
    { bg: "#FDF2F8", border: "rgba(236,72,153,0.12)",  glow: "rgba(236,72,153,0.22)"  },
    { bg: "#FEFCE8", border: "rgba(234,179,8,0.14)",   glow: "rgba(234,179,8,0.22)"   },
    { bg: "#F0FDF4", border: "rgba(34,197,94,0.12)",   glow: "rgba(34,197,94,0.22)"   },
    { bg: "#FFF7ED", border: "rgba(249,115,22,0.12)",  glow: "rgba(249,115,22,0.22)"  },
  ];

  return (
    <div style={{ padding: '120px 24px', background: `
      radial-gradient(ellipse 80% 60% at 0%   50%, rgba(151,24,251,0.10)  0%, transparent 60%),
      radial-gradient(ellipse 80% 60% at 100% 50%, rgba(113,128,254,0.10) 0%, transparent 60%),
      radial-gradient(ellipse 70% 70% at 50%  0%,  rgba(196,181,253,0.14) 0%, transparent 55%),
      #FAF8FF
    `, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{
            fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 800,
            color: 'var(--foreground)', fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0, marginBottom: 16
          }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: 16, color: '#6B7280', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
            Everything you need to know about Luter
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((item, idx) => {
            const pal = PALETTES[idx % PALETTES.length];
            return (
              <div key={idx}
                onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                style={{
                  background: pal.bg,
                  border: `1.5px solid ${pal.border}`,
                  borderRadius: 24,
                  padding: '22px 28px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 2px 8px ${pal.glow}`,
                  transform: activeIndex === idx ? 'scale(1.01)' : 'scale(1)',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 24px ${pal.glow}`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = `0 2px 8px ${pal.glow}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: 0, lineHeight: 1.4 }}>
                    {item.q}
                  </h3>
                  <motion.div animate={{ rotate: activeIndex === idx ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <Plus size={20} weight="bold" color="#6B7280" style={{ flexShrink: 0 }} />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {activeIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, fontWeight: 500, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SharedFooter() {
  const bemojiSeeds = [
    { seed: 'Felix', color: '#9718FB', top: '15%', left: '8%', rotate: -8 },
    { seed: 'Luna', color: '#FFF917', bottom: '25%', right: '10%', rotate: 6 },
    { seed: 'Jasper', color: '#7180FE', top: '20%', right: '5%', rotate: 12 },
    { seed: 'Milo', color: '#FF90E8', bottom: '15%', left: '12%', rotate: -4 },
  ];

  return (
    <footer style={{
      background: 'var(--background)',
      color: 'var(--foreground)',
      fontFamily: 'var(--font-display)',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Soft Background Pattern */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.15, pointerEvents: 'none' }} />

      {/* Lightweight Falling Shapes Pattern */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.7 }}>
        <FallingElements 
          gravity={0.4}
          restitution={0.8}
          loop={true}
          elements={[
            { text: "✦", fontSize: "2rem", color: "#9718FB", bgColor: "rgba(151,24,251,0.03)", borderColor: "rgba(151,24,251,0.08)" },
            { text: "●", fontSize: "2rem", color: "#7180FE", bgColor: "rgba(113,128,254,0.03)", borderColor: "rgba(113,128,254,0.08)" },
            { text: "▲", fontSize: "2rem", color: "#FF90E8", bgColor: "rgba(255,144,232,0.03)", borderColor: "rgba(255,144,232,0.08)" },
            { text: "■", fontSize: "2rem", color: "#F59E0B", bgColor: "rgba(245,158,11,0.03)", borderColor: "rgba(245,158,11,0.08)" },
            { text: "✦", fontSize: "2rem", color: "#38BDF8", bgColor: "rgba(56,189,248,0.03)", borderColor: "rgba(56,189,248,0.08)" },
            { text: "●", fontSize: "2rem", color: "#A855F7", bgColor: "rgba(168,85,247,0.03)", borderColor: "rgba(168,85,247,0.08)" },
            { text: "▲", fontSize: "2rem", color: "#EC4899", bgColor: "rgba(236,72,153,0.03)", borderColor: "rgba(236,72,153,0.08)" },
            { text: "✦", fontSize: "2rem", color: "#9718FB", bgColor: "rgba(151,24,251,0.03)", borderColor: "rgba(151,24,251,0.08)" }
          ]}
        />
      </div>

      {/* Floating Bemojis */}
      {bemojiSeeds.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: b.top,
          bottom: b.bottom,
          left: b.left,
          right: b.right,
          width: 120,
          height: 120,
          background: b.color,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
          borderRadius: 24,
          zIndex: 1,
          transform: `rotate(${b.rotate}deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${b.seed}&backgroundColor=transparent`} style={{ width: '130%', height: '130%', objectFit: 'contain', transform: 'translateY(15%)' }} alt="Student Bemoji" />
        </div>
      ))}

      {/* Main CTA Area */}
      <div style={{ padding: '120px 24px', position: 'relative', zIndex: 10, maxWidth: 1000, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6.5vw, 4.8rem)', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
          Ready to ace<br />your next exam?
        </h2>
        
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.25rem', color: 'var(--foreground)', maxWidth: 620, margin: '0 auto 48px', lineHeight: 1.7, opacity: 0.7 }}>
          Stop wasting time on inefficient study methods. Let our AI turn your notes into absolute mastery.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          <PremiumButton to={getAppUrl("/signup")} size="lg" style={{ width: 260, borderRadius: '16px' }}>
            Start Learning Free
          </PremiumButton>
          <PremiumButton to="/demo" variant="outline" size="lg" style={{ width: 220, borderRadius: '16px' }}>
            Watch Demo
          </PremiumButton>
        </div>
      </div>

      {/* Footer Links & Copyright */}
      <div style={{ position: 'relative', zIndex: 10, padding: '40px 24px', borderTop: '1px solid var(--border)', background: 'var(--background)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 32 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/Header logo.png" alt="Luter" style={{ height: 40 }} />
            </div>

            {/* Links */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
            </div>
          </div>

          <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', gap: 24, fontSize: 15, fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase' }}>
              <span>© 2026 Luter</span>
              <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
              <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
            </div>

            {/* Socials */}
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                {
                  name: 'X (Twitter)',
                  url: 'https://x.com/MomohDavid81322?s=20',
                  icon: (
                    <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )
                },
                {
                  name: 'Instagram',
                  url: 'https://www.instagram.com/luter.app?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
                  icon: (
                    <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                    </svg>
                  )
                },
                {
                  name: 'TikTok',
                  url: 'https://www.tiktok.com/@luter.ai',
                  icon: (
                    <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.92-5.3-.21-.93-.24-1.9-.09-2.81.24-1.58 1.05-3.06 2.2-4.14 1.6-1.47 3.8-2.1 5.95-1.74.02 1.34.01 2.68.01 4.02-1.15-.36-2.45-.19-3.48.45-1.01.62-1.68 1.64-1.84 2.8-.13.88.08 1.81.65 2.5 1.05 1.25 2.93 1.57 4.34.82 1.24-.65 2.01-1.91 2.09-3.29.13-4.25.06-8.5.09-12.75l-1.02.01z" />
                    </svg>
                  )
                }
              ].map((social) => (
                <a 
                  key={social.name} 
                  href={social.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: 'var(--foreground)', 
                    opacity: 0.6,
                    background: 'var(--background)', 
                    width: 44, 
                    height: 44, 
                    borderRadius: '50%', 
                    border: '1px solid var(--border)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
                    transition: 'transform 0.1s, box-shadow 0.1s, color 0.1s' 
                  }} 
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#9718FB'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--foreground)'; }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; }} 
                  onMouseUp={e => { e.currentTarget.style.transform = 'translate(0px, 0px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
