import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronRight, Layers, TrendingUp, Users, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LuterLogo from './shared/LuterLogo';

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

export function SharedNavbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
    <nav className="navbar" style={{ 
        padding: '0 24px', 
        background: 'transparent', 
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
        {/* Desktop Navbar */}
        <div className="hidden md:flex" style={{ 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%'
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <LuterLogo size={36} fontSize={28} />
          </Link>

          <div style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 600 }}>
            {[['Features','/features'],['How it works','/how-it-works'],['Pricing','/pricing'],['About','/about']].map(([l,p]) => (
              <Link key={l} to={p} style={{ 
                textDecoration: 'none', 
                color: location.pathname === p ? 'var(--primary)' : '#555', 
                transition: 'color 0.2s', 
                borderBottom: location.pathname === p ? '2px solid var(--primary)' : '2px solid transparent', 
                paddingBottom: 2 
              }}>{l}</Link>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link to="/signin" style={{ fontSize: 14, fontWeight: 600, color: '#555', textDecoration: 'none', transition: 'color 0.2s' }}>
              Sign In
            </Link>
            <Link to="/signup" className="btn-primary" style={{ padding: '10px 24px', fontSize: 14, textDecoration: 'none' }}>
              Get Started <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className="flex md:hidden" style={{ 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%'
        }}>
          <Link to="/" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
            <LuterLogo size={28} fontSize={22} />
          </Link>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link to="/signup" className="btn-primary" style={{ 
              padding: '8px 18px', 
              fontSize: 13, 
              textDecoration: 'none', 
              fontFamily: 'var(--font-varela)',
              borderRadius: 10,
              boxShadow: '0 4px 15px rgba(151, 24, 251, 0.3)',
              fontWeight: 800
            }}>
              Get Started
            </Link>
            
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              style={{ 
                zIndex: 300, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 5, 
                padding: '8px',
                background: 'transparent',
                border: 'none'
              }}
            >
              <div style={{ width: 22, height: 2, background: '#111', borderRadius: 2 }} />
              <div style={{ width: 22, height: 2, background: '#111', borderRadius: 2 }} />
              <div style={{ width: 22, height: 2, background: '#111', borderRadius: 2 }} />
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
              {[
                { l: 'Features', p: '/features', i: <Layers size={22} /> },
                { l: 'How it works', p: '/how-it-works', i: <BookOpen size={22} /> },
                { l: 'Pricing', p: '/pricing', i: <Zap size={22} /> },
                { l: 'About', p: '/about', i: <Users size={22} /> },
                { l: 'Sign In', p: '/signin', i: <TrendingUp size={22} /> }
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
                      fontWeight: 700, 
                      color: '#111',
                      textDecoration: 'none',
                      padding: '16px 20px',
                      borderRadius: 16,
                      background: 'rgba(0,0,0,0.02)',
                      border: '1px solid rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 12, background: 'white', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', color: 'var(--primary)'
                    }}>
                      {item.i}
                    </div>
                    {item.l}
                    <ChevronRight size={18} style={{ marginLeft: 'auto', opacity: 0.3 }} />
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
                background: 'var(--primary-bg)', 
                padding: 20, borderRadius: 24, marginBottom: 20,
                border: '1px solid rgba(151,24,251,0.1)'
              }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>Level Up Your Grades</h4>
                <p style={{ fontSize: 13, color: 'var(--primary)', opacity: 0.7, fontWeight: 500 }}>Join 5M+ students using AI to master their curriculum.</p>
              </div>
              <Link 
                to="/signup" 
                onClick={() => setIsOpen(false)}
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '18px', fontSize: 16, borderRadius: 16, fontFamily: 'var(--font-varela)', boxShadow: '0 10px 30px rgba(151,24,251,0.3)' }}
              >
                Start Free Today <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
