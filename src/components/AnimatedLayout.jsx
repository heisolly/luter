import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiArrowRightLine as ArrowRight } from 'react-icons/ri';
import logo from '../../asset/logo.png';

export default function AnimatedLayout({ children, title, subtitle }) {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#fafafa', color: '#111' }}>
      {/* Animated Background */}
      <div className="animated-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="noise-overlay-custom"></div>
      </div>

      {/* Navbar */}
      <nav className="navbar" style={{ padding: '0 40px', background: 'transparent', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src={logo} alt="Luter AI logo" style={{ height: 32, width: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-besley)', color: '#111' }}>Luter</span>
        </Link>

        <div className="hidden md:flex" style={{ gap: 32, fontSize: 14, fontWeight: 600, color: '#555' }}>
          {[['Features','/features'],['How it works','/how-it-works'],['Pricing','/pricing'],['About','/about']].map(([l,p]) => (
            <Link key={l} to={p} style={{ transition: 'color 0.2s', color: location.pathname === p ? '#111' : '#555', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color='#000'}
              onMouseLeave={e => e.target.style.color= location.pathname === p ? '#111' : '#555'}>{l}</Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
            Get Started <ArrowRight style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 120 }}>
        {title && (
          <div className="container-custom" style={{ textAlign: 'center', padding: '60px 20px 40px', color: '#111' }}>
            <h1 className="page-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, fontFamily: 'var(--font-besley)', marginBottom: 20, letterSpacing: '-0.02em' }}>{title}</h1>
            {subtitle && <p style={{ fontSize: 20, color: '#666', maxWidth: 600, margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>{subtitle}</p>}
          </div>
        )}
        {children}
      </div>

    </div>
  );
}
