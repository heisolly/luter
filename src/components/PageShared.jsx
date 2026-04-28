import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CaretRight as ChevronRight,
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
  List as Menu
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import LuterLogo from './shared/LuterLogo';

export const PremiumButton = ({ 
  children, to, onClick, 
  style = {}, variant = 'primary', size = 'md',
  disabled = false, icon: Icon = null, type = 'button',
  isUpgradeButton = false 
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

  const height = isLarge ? '52px' : '36px';
  const borderRadius = isLarge ? '16px' : '14px';
  const padding = isLarge ? '0 32px' : '0 16px';
  const fontSize = isLarge ? '18px' : '16px';
  const fontWeight = isLarge ? 700 : 500;

  const getBackground = () => {
    if (disabled) return '#F3F4F6';
    if (isPrimary) return isHovered ? colors.hoverBg : colors.bg;
    if (isOutline) return isHovered ? colors.outlineBg : 'transparent';
    return 'white';
  };

  const getBorder = () => {
    if (disabled) return '1px solid #E5E7EB';
    if (isPrimary) return `1px solid ${isHovered ? colors.hoverBorder : colors.border}`;
    if (isOutline) return `2px solid ${isHovered ? colors.border : colors.outlineBorder}`;
    return `1px solid ${colors.border}`;
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
    borderBottom: (isPrimary && !disabled) ? (isHovered ? `1px solid ${colors.hoverBorder}` : `2px solid ${colors.border}`) : getBorder().replace('2px', '1px'),
    fontSize: fontSize, 
    fontWeight: fontWeight, 
    fontFamily: 'var(--font-outfit)',
    textTransform: 'none',
    letterSpacing: isLarge ? '-0.01em' : 'normal',
    textDecoration: 'none', 
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box', gap: '10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: 1,
    transform: isPressed ? 'scale(0.98) translateY(1px)' : (isHovered ? 'translateY(-2px)' : 'translateY(0px)'),
    boxShadow: (isPrimary && isHovered && !disabled) ? '0 12px 24px -8px rgba(75, 0, 130, 0.15)' : 'none',
    width: '100%',
    maxWidth: style.width === '100%' ? '100%' : 'max-content',
    // Mobile touch improvements
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'manipulation',
    minHeight: isLarge ? '52px' : '44px',
    ...style
  };

  const Component = to ? Link : 'button';
  const componentProps = to ? { to } : { onClick, disabled, type };
  
  return (
    <Component 
      {...componentProps}
      style={baseStyle}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
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
    <div style={{ 
      position: 'relative', zIndex: 100, padding: '24px 80px', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      width: '100%', boxSizing: 'border-box'
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <LuterLogo size={36} fontSize={28} />
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#64748B', fontFamily: 'var(--font-outfit)' }}>
          {isSignIn ? "Don't have an account?" : "Already have an account?"}
        </span>
        <PremiumButton 
          to={isSignIn ? "/signup" : "/signin"} 
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
            fontFamily: 'var(--font-outfit)'
          }}>
            {title}
          </h2>
          <p style={{ 
            fontSize: 20, 
            color: '#475569', 
            fontWeight: 500,
            fontFamily: 'var(--font-outfit)'
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
                  fontFamily: 'var(--font-outfit)',
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
                      fontFamily: 'var(--font-varela)'
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

export function SharedNavbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="navbar" style={{ 
        padding: '0 24px', 
        background: 'transparent', 
        paddingTop: 12,
        fontFamily: 'var(--font-varela)',
        zIndex: 200,
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        border: 'none',
        boxShadow: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none'
      }}>
        {/* Desktop Navbar - Locked to md+ screens */}
        <div className="hidden md:flex" style={{ 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%',
          fontFamily: 'var(--font-varela)'
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <LuterLogo size={36} fontSize={28} />
          </Link>

          <div style={{ display: 'flex', gap: 32, fontSize: 15, fontWeight: 500, color: '#475569' }}>
            {[['Features','/features'],['How it works','/how-it-works'],['Pricing','/pricing'],['About','/about']].map(([l,h]) => (
              <Link key={l} to={h} style={{ 
                transition: 'color 0.2s', 
                color: location.pathname === h ? '#2E1065' : '#475569', 
                textDecoration: 'none', 
                fontFamily: 'var(--font-outfit)',
                fontWeight: location.pathname === h ? 700 : 500
              }}
                onMouseEnter={e => e.target.style.color='#2E1065'}
                onMouseLeave={e => e.target.style.color = location.pathname === h ? '#2E1065' : '#475569'}>{l}</Link>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link 
              to="/signin" 
              style={{ 
                fontSize: '14px', 
                fontWeight: 500,
                height: '36px',
                padding: '0 16px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '2px solid transparent',
                fontFamily: 'var(--font-outfit)',
                letterSpacing: 'normal'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '2px solid #C7B9FF';
                e.currentTarget.style.background = '#FAF8FF';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '2px solid transparent';
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
            >
              Sign in
            </Link>
            <PremiumButton to="/signup">
              Sign up
            </PremiumButton>
          </div>
        </div>

        {/* Mobile Navbar - Only on mobile screens */}
        <div className="flex md:hidden" style={{ 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%'
        }}>
          <Link to="/" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
            <LuterLogo size={28} fontSize={22} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PremiumButton to="/signup">
              Get Started
            </PremiumButton>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                zIndex: 300,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              <Menu size={24} weight="light" color="#111" />
            </button>
          </div>
        </div>
      </nav>

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
              fontFamily: 'var(--font-varela)'
            }}
          >
            {/* Top divider line */}
            <div style={{ position: 'absolute', top: 90, left: 24, right: 24, height: 1, background: 'rgba(0,0,0,0.05)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                { [
                  { l: 'Features', p: '/features', i: <Stack size={22} weight="light" /> },
                  { l: 'How it works', p: '/how-it-works', i: <BookOpen size={22} weight="light" /> },
                  { l: 'Pricing', p: '/pricing', i: <Lightning size={22} weight="light" /> },
                  { l: 'About', p: '/about', i: <Users size={22} weight="light" /> },
                  { l: 'Sign In', p: '/signin', i: <TrendingUp size={22} weight="light" /> }
                ].map((item, idx) => (
                <motion.div
                  key={item.l}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                >
                  <Link 
                    to={item.p} 
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
                      fontFamily: 'var(--font-outfit)'
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
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 4, fontFamily: 'var(--font-outfit)' }}>Level Up Your Grades</h4>
                <p style={{ fontSize: 13, color: '#111', opacity: 0.7, fontWeight: 500, fontFamily: 'var(--font-varela)' }}>Join 5M+ students using AI to master their curriculum.</p>
              </div>
              <PremiumButton to="/signup" onClick={() => setIsOpen(false)} style={{ width: '100%', height: '56px' }}>
                Start Free Today
              </PremiumButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function SharedFooter() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <footer style={{ 
      background: '#fff',
      padding: '80px 0 40px',
      borderTop: '1px solid #f1f5f9',
      fontFamily: 'var(--font-outfit)'
    }}>
      <div className="container-full">
        {/* Top Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 40,
          marginBottom: 60
        }}>
          {/* Left: Brand & Contact */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <LuterLogo size={32} fontSize={24} />
            </div>
            <div style={{ display: 'flex', gap: 40, marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontFamily: 'var(--font-outfit)' }}>Email</div>
                <a href="mailto:hello@luter.ai" style={{ fontSize: 16, color: '#111', fontWeight: 400, textDecoration: 'none', fontFamily: 'var(--font-varela)' }}>hello@luter.ai</a>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontFamily: 'var(--font-outfit)' }}>Community</div>
                <a href="#" style={{ fontSize: 16, color: '#111', fontWeight: 400, textDecoration: 'none', fontFamily: 'var(--font-varela)' }}>discord.gg/luter</a>
              </div>
            </div>

            {/* Social Links */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { icon: <Music size={18} weight="light" />, label: 'TikTok' },
                { icon: <Instagram size={18} weight="light" />, label: 'Instagram' },
                { icon: <Facebook size={18} weight="light" />, label: 'Facebook' },
                { icon: <Twitter size={18} weight="light" />, label: 'Twitter' },
                { icon: <Linkedin size={18} weight="light" />, label: 'LinkedIn' }
              ].map((s, i) => (
                <a 
                  key={i}
                  href="#" 
                  aria-label={s.label}
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: '50%', 
                    background: 'white', 
                    border: '1px solid #f1f5f9',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#111',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Right: CTA & Buttons */}
          <div style={{ textAlign: 'right', maxWidth: 450 }}>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 24, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Get started with your personal AI tutor now
            </h3>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <PremiumButton to="/signup">
                Try Luter
              </PremiumButton>
              <Link to="/demo" style={{
                height: 44, padding: '0 24px', background: '#fff', color: '#111',
                borderRadius: '14px', fontSize: 15, fontWeight: 700, display: 'flex', 
                alignItems: 'center', gap: 8, textDecoration: 'none', border: '2px solid #F1F5F9',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: 'var(--font-outfit)', textTransform: 'none', letterSpacing: '0.02em'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#C7B9FF';
                  e.currentTarget.style.color = '#4B0082';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#F1F5F9';
                  e.currentTarget.style.color = '#111';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
              >
                Watch Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Divider line */}
        <div style={{ height: 1, background: '#f1f5f9', width: '100%', marginBottom: 32 }} />


        {/* Legal Minimal */}
        <div style={{ marginTop: 40, display: 'flex', gap: 24, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
          <span>© 2026 Luter Learning</span>
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
        </div>
      </div>
    </footer>
  );
}
