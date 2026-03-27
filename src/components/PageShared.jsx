import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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

/* Highlighted static text */
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

/* Shared Navbar */
export function SharedNavbar() {
  const location = useLocation();
  return (
    <nav className="navbar" style={{ padding: '0 40px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', fontFamily: 'var(--font-varela)' }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <LuterLogo size={32} fontSize={24} />
      </Link>
      <div style={{ display: 'flex', gap: 32, fontSize: 15, fontWeight: 600 }}>
        {[['Features','/features'],['How it works','/how-it-works'],['Pricing','/pricing'],['About','/about']].map(([l,p]) => (
          <Link key={l} to={p} style={{ textDecoration: 'none', color: location.pathname === p ? 'var(--primary)' : '#555', transition: 'color 0.2s', borderBottom: location.pathname === p ? '2px solid var(--primary)' : '2px solid transparent', paddingBottom: 2 }}>{l}</Link>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Link to="/signin" style={{ fontSize: 15, fontWeight: 600, color: '#555', textDecoration: 'none', transition: 'color 0.2s' }}>
          Sign In
        </Link>
        <Link to="/signup" className="btn-primary" style={{ padding: '10px 20px', fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-varela)' }}>
          Get Started <ArrowRight style={{ width: 15, height: 15 }} />
        </Link>
      </div>
    </nav>
  );
}
