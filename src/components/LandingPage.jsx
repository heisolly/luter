import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LuterLogo from './shared/LuterLogo';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Plus, ArrowRight, Brain, Zap, FileText, GraduationCap,
  ChevronRight, Clock, Star, Check, BookOpen, Cpu,
  BarChart2, Layers, MessageSquare, Upload, Play,
  Sparkles, Shield, Globe, Users, TrendingUp, Award,
  Headphones, Folder, RefreshCw, MessageCircleQuestion
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ── small helpers ── */
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
      <Star key={i} style={{ width: 12, height: 12, fill: '#f59e0b', color: '#f59e0b' }} />
    ))}
  </div>
);

/* ── FAQ item with toggle ── */
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <div className="faq-question" onClick={() => setOpen(o => !o)}>
        <h4>{q}</h4>
        <div className="faq-toggle-icon">
          <Plus style={{ width: 16, height: 16 }} />
        </div>
      </div>
      <div className="faq-answer">{a}</div>
    </div>
  );
};

/* ── universities for scrolling strip ── */
const UNIS = [
  { name: 'Princeton', icon: '🏛️' }, { name: 'Stanford', icon: '🌲' },
  { name: 'MIT', icon: '🤖' }, { name: 'Cambridge', icon: '🎓' },
  { name: 'Yale', icon: '🐶' }, { name: 'Michigan', icon: '〽️' },
  { name: 'NUS', icon: '🦁' }, { name: 'Toronto', icon: '🍁' },
  { name: 'Oxford', icon: '📙' }, { name: 'Columbia', icon: '👑' },
  { name: 'Harvard', icon: '🏅' }, { name: 'UNILAG', icon: '🇳🇬' },
];

/* ─────────────────────────────────────────────────── */
export default function LandingPage() {
  const containerRef = useRef(null);

  /* GSAP animations */
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

  return (
    <div ref={containerRef} style={{ background: '#fff', minHeight: '100vh' }}>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className="navbar" style={{ 
        padding: '20px 40px', 
        background: 'transparent', 
        zIndex: 200,
        position: 'absolute',
        top: 0, left: 0, right: 0
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

          <div style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 600, color: '#555' }}>
            {[['Features','#features'],['How it works','#howitworks'],['Pricing','/pricing'],['About','/about']].map(([l,h]) => (
              <Link key={l} to={h} style={{ transition: 'color 0.2s', color: 'inherit', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color='#000'}
                onMouseLeave={e => e.target.style.color='#555'}>{l}</Link>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/signin" style={{ fontSize: 14, fontWeight: 600, color: '#444', textDecoration: 'none' }}>Log in</Link>
            <Link to="/signup" className="btn-primary" style={{ padding: '10px 24px', fontSize: 14, textDecoration: 'none' }}>
              Get Started <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
        </div>

        {/* Mobile Navbar - Only on mobile screens */}
        <div className="flex md:hidden" style={{ 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%' 
        }}>
          <Link to="/" style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
            <LuterLogo size={32} fontSize={24} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/signup" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, textDecoration: 'none' }}>
              Get Started
            </Link>
            <button 
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 5, 
                padding: '8px',
                zIndex: 300,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: 22, height: 2, background: '#111', borderRadius: 2, transition: '0.3s', transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <div style={{ width: 16, height: 2, background: '#111', borderRadius: 2, transition: '0.3s', opacity: mobileOpen ? 0 : 1 }} />
              <div style={{ width: 22, height: 2, background: '#111', borderRadius: 2, transition: '0.3s', transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(10px)',
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        padding: '120px 40px 40px',
        transition: '0.5s cubic-bezier(0.23, 1, 0.32, 1)',
        transform: mobileOpen ? 'translateY(0)' : 'translateY(-100%)',
        opacity: mobileOpen ? 1 : 0,
        pointerEvents: mobileOpen ? 'all' : 'none'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[['Features','/features'],['How it works','/how-it-works'],['Pricing','/pricing'],['About','/about'],['Sign In','/signin']].map(([l,p]) => (
            <Link 
              key={l} 
              to={p} 
              onClick={() => setMobileOpen(false)}
              style={{ 
                fontSize: 32, 
                fontWeight: 800, 
                color: '#111',
                textDecoration: 'none',
                fontFamily: 'var(--font-besley)'
              }}
            >
              {l}
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Link 
            to="/signup" 
            onClick={() => setMobileOpen(false)}
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '18px', fontSize: 16, borderRadius: 16 }}
          >
            Start Free Today
          </Link>
        </div>
      </div>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hero-section" style={{ paddingTop: 120 }}>
        <div className="hero-bg">
          <div className="hero-bg-grid" />
        </div>

        <div className="hero-content">
          {/* Social proof row */}
          <div className="hero-social-proof">
            <AvatarGroup />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <Stars />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>
                <span style={{ color: '#111', fontWeight: 700 }}>5M+ students</span> · Studying smarter
              </span>
            </div>
          </div>

          {/* Badge */}
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            AI-Powered Study Platform
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', marginBottom: 20, maxWidth: 700, margin: '0 auto 20px' }}>
            Learn 10× Faster.{' '}
            <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Remember More.</span>{' '}
            Stress Less.
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 18, color: '#666', fontWeight: 450, maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Upload any lecture, PDF, or video — Luter instantly builds notes, flashcards, and
            mock exams tailored to <em>your</em> curriculum.
          </p>

          {/* CTA row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
            <Link to="/signup" className="btn-primary" style={{ padding: '15px 28px', fontSize: 15, textDecoration: 'none' }}>
              Start Free — No Card Needed <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <button className="btn-secondary" style={{ padding: '15px 24px', fontSize: 15 }}>
              <Play style={{ width: 15, height: 15, fill: 'currentColor' }} /> Watch Demo
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>Free forever tier · No credit card</p>
        </div>

        {/* ── Dashboard Mockup ── */}
        <div className="hidden md:block" style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
          <div className="dashboard-wrapper">
            <div className="dashboard-content" style={{ height: 560 }}>
              {/* Header bar */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #ebe9f5', background:'white' }}>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <LuterLogo size={22} fontSize={18} />
                  <div style={{ borderLeft: '1px solid #e8e8ec', height: 20, margin: '0 4px' }} />
                  <div style={{ width:1, height:20, background:'#e8e8ec' }} />
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#7180FE' }}>
                    <span>Home</span>
                    <ChevronRight style={{ width:12, height:12, color:'#bbb' }} />
                    <span style={{ color:'#111', fontWeight:600, textDecoration:'underline', textDecorationStyle:'dotted', textUnderlineOffset:3 }}>Earth Wiki Session</span>
                  </div>
                </div>
                <button style={{ background:'#7180FE', color:'white', padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6, border:'none', cursor:'pointer' }}>
                  <Plus style={{ width:13, height:13 }} /> New Session
                </button>
              </div>

              {/* Body */}
              <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
                {/* Left sidebar */}
                <div style={{ width:56, borderRight:'1px solid #ebe9f5', background:'white', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:20 }}>
                  {[BookOpen, Layers, Brain, BarChart2, MessageSquare].map((Icon, i) => (
                    <div key={i} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background: i===0 ? 'var(--primary-bg)' : 'transparent', cursor:'pointer' }}>
                      <Icon style={{ width:16, height:16, color: i===0 ? 'var(--primary)' : '#bbb' }} />
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#F7F5FF' }}>
                  <div style={{ display:'flex', gap:4, padding:'8px 8px 0', background:'transparent' }}>
                    {['Original', 'AI Notes', 'AI Summary', 'Flashcards', 'AI Quiz'].map((tab, i) => (
                      <div key={i} style={{
                        padding:'6px 12px', borderRadius:'8px 8px 0 0', fontSize:11, fontWeight:700, cursor:'pointer',
                        background: i===1 ? 'white' : 'transparent',
                        color: i===1 ? '#7180FE' : '#aaa',
                        boxShadow: i===1 ? '0 -1px 4px rgba(0,0,0,0.04)' : 'none'
                      }}>
                        {i>0 && <span style={{ color:'#A150FF', marginRight:3 }}>AI</span>}{tab.replace('AI ','')}
                      </div>
                    ))}
                  </div>
                  <div style={{ flex:1, background:'white', margin:'0 8px 8px', borderRadius:12, padding:28, overflow:'auto' }}>
                    <div style={{ maxWidth:560 }}>
                      <h2 style={{ fontFamily:'var(--font-besley)', fontSize:26, marginBottom:10 }}>Earth</h2>
                      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                        {['🌍 Planet','🔬 Science','📅 Formation'].map(t => (
                          <span key={t} style={{ fontSize:10, fontWeight:700, background:'#f3f4f6', padding:'3px 8px', borderRadius:99, color:'#777' }}>{t}</span>
                        ))}
                      </div>
                      <p style={{ fontSize:13, color:'#666', lineHeight:1.8, marginBottom:16 }}>
                        Earth is the <span style={{ background:'rgba(151,24,251,0.1)', color:'var(--primary)', borderRadius:3, padding:'1px 4px' }}>third planet</span> from the Sun and the only astronomical object known to harbor life. It is the largest of the four rocky planets...
                      </p>
                      {/* Simulated note bullets */}
                      {['Formed ~4.5 billion years ago from solar nebula', 'Core is iron-nickel alloy, 5,200°C', 'Has one natural satellite: the Moon'].map((pt, i) => (
                        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8 }}>
                          <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--primary)', marginTop:6, flexShrink:0 }} />
                          <span style={{ fontSize:13, color:'#555', lineHeight:1.6 }}>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Tutor sidebar */}
                <div style={{ width:320, borderLeft:'1px solid #ebe9f5', background:'white', display:'flex', flexDirection:'column', padding:16 }}>
                  <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.1em', color:'#ccc', textTransform:'uppercase', marginBottom:16 }}>AI Tutor</div>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14, overflow:'auto' }}>
                    <div style={{ alignSelf:'flex-end', maxWidth:'85%', background:'#F2F4F7', padding:'10px 14px', borderRadius:'14px 14px 0 14px', fontSize:12, fontWeight:600, color:'#555' }}>
                      What is the great oxidation event?
                    </div>
                    <div style={{ border:'1px solid #7180FE', padding:'14px 16px', borderRadius:'14px 14px 14px 0', fontSize:12, background:'white', boxShadow:'0 2px 8px rgba(113,128,254,0.1)' }}>
                      <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:8 }}>
                        <LuterLogo size={18} fontSize={14} />
                      </div>
                      <h4 style={{ fontWeight:700, fontSize:13, marginBottom:6, color:'#111' }}>The Great Oxidation Event</h4>
                      <p style={{ fontSize:11, color:'#888', lineHeight:1.7, fontWeight:500 }}>A significant rise in Earth's atmospheric O₂ ~2.4 billion years ago, caused by cyanobacteria photosynthesis.</p>
                    </div>
                    {/* Suggestion chips */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {['Explain like I\'m 12', 'Give me examples', 'Quiz me on this'].map(chip => (
                        <button key={chip} style={{ fontSize:10, fontWeight:600, background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:99, padding:'4px 10px', cursor:'pointer', color:'#555' }}>
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop:12, position:'relative' }}>
                    <input placeholder="Ask Luter anything..." style={{ width:'100%', background:'#F5F6FF', fontSize:12, fontWeight:500, padding:'11px 38px 11px 14px', borderRadius:10, border:'1px solid #ebe9f5', outline:'none', fontFamily:'var(--font-inter)' }} />
                    <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:24, height:24, background:'var(--primary)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <ArrowRight style={{ width:12, height:12, color:'white' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <section style={{ padding: '48px 0', background: '#fff', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container-full">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
            {[
              { num: '5M+', label: 'Active Students', icon: <Users style={{ width:20, height:20 }} /> },
              { num: '150+', label: 'Universities', icon: <GraduationCap style={{ width:20, height:20 }} /> },
              { num: '99%', label: 'Exam Relevance', icon: <Award style={{ width:20, height:20 }} /> },
              { num: '10×', label: 'Faster Learning', icon: <TrendingUp style={{ width:20, height:20 }} /> },
            ].map(({ num, label, icon }) => (
              <div key={label} className="stat-card reveal-child">
                <div style={{ display:'flex', justifyContent:'center', marginBottom:8, color:'var(--primary)' }}>{icon}</div>
                <div className="stat-number">{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST STRIP ═══════════════ */}
      <section style={{ padding: '40px 0', background: 'white' }}>
        <p style={{ textAlign:'center', fontSize:13, fontWeight:600, color:'#bbb', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20 }}>
          Trusted by students at
        </p>
        <div className="trust-strip">
          <div className="trust-scroll-track">
            {[...UNIS, ...UNIS].map((uni, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, color:'#bbb', fontWeight:800, fontSize:13, letterSpacing:'0.05em', textTransform:'uppercase' }}>
                <span style={{ fontSize:20 }}>{uni.icon}</span>
                {uni.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PROBLEM SECTION ═══════════════ */}
      <section id="problem" style={{ padding: '96px 0', background: '#F8F8F8' }}>
        <div className="container-custom">
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <p className="reveal-child" style={{ fontSize:15, fontWeight:500, color:'#666', fontFamily:'var(--font-inter)', marginBottom:12 }}>
              Sound familiar?
            </p>
            <h2 className="reveal-child" style={{ fontSize:'clamp(1.8rem, 3.5vw, 2.5rem)', maxWidth:640, margin:'0 auto', color:'#333', fontFamily:'var(--font-besley)', fontWeight:600, lineHeight:'130%' }}>
              Studying feels <span style={{ color:'var(--primary)', fontStyle:'italic' }}>harder than it should</span>
            </h2>
          </div>

          {/* 4 Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20, marginBottom:24 }}>
            {[
              { icon:<Headphones style={{ width:40, height:40 }} />, title:'Lost in long lectures', desc:'"I zoned out 20 minutes in… now I\'m completely lost"' },
              { icon:<Folder style={{ width:40, height:40 }} />, title:'Scattered notes', desc:'"Scattered across Google Docs, Notion, and random papers"' },
              { icon:<RefreshCw style={{ width:40, height:40 }} />, title:'Read it. Forgot it', desc:'"I read this chapter 3 times and still can\'t remember it"' },
              { icon:<MessageCircleQuestion style={{ width:40, height:40 }} />, title:'Stuck with no help', desc:'"It\'s midnight, I\'m confused, and there\'s no one to explain this to me"' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="reveal-child" style={{ background:'white', borderRadius:16, padding:'32px 24px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', border:'1px solid #e8e8ec', boxShadow:'0 4px 24px rgba(0,0,0,0.04)' }}>
                <div style={{ color:'#c4b5f7', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'center', fill:'rgba(196, 181, 247, 0.2)' }}>
                  {icon}
                </div>
                <h3 style={{ fontSize:16, fontWeight:700, fontFamily:'var(--font-inter)', color:'#333', marginBottom:12, lineHeight:'140%' }}>
                  {title}
                </h3>
                <p style={{ fontSize:14, color:'#888', fontStyle:'italic', lineHeight:'160%', fontFamily:'var(--font-inter)', margin:0 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Banner */}
          <div className="reveal-child" style={{ background:'white', borderRadius:16, padding:'28px 40px', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:24, border:'1px solid #e8e8ec', boxShadow:'0 4px 24px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize:17, fontWeight:500, color:'#666', maxWidth:540, fontFamily:'var(--font-inter)', lineHeight:'160%', margin:0 }}>
              <strong style={{ color:'#333', fontWeight:700 }}>There's a better way.</strong> Luter turns this chaos into a structured learning system automatically. Studying feels easier.
            </p>
            <button className="btn-primary" style={{ flexShrink:0, padding:'14px 24px', fontSize:14 }}>
              Start a Free Study Session <ArrowRight style={{ width:16, height:16 }} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ INTRODUCING LUTER — FEATURE LIST ═══════════════ */}
      <section style={{ padding: '96px 0', background: '#F8F8F8' }} aria-labelledby="features-heading">
        <div className="container-full" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>

          {/* Section Header */}
          <p className="reveal-child" style={{ color:'var(--primary)', fontFamily:'var(--font-inter)', fontWeight:500, fontSize:18, lineHeight:'140%' }}>
            Introducing Luter...
          </p>
          <h2 id="features-heading" className="reveal-child" style={{ fontSize:'clamp(1.8rem, 3.5vw, 2.5rem)', textAlign:'center', maxWidth:586, margin:'24px auto 16px', color:'#333333', fontFamily:'var(--font-besley)', fontWeight:600, lineHeight:'140%' }}>
            We turn your material into a&nbsp;<span style={{ color:'var(--primary)', fontStyle:'italic' }}>complete study system</span>
          </h2>
          <p className="reveal-child" style={{ fontSize:18, color:'#666', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', textAlign:'center', maxWidth:580, marginBottom:40 }}>
            Luter takes your material and builds your entire study session — notes, flashcards, quizzes, summary, and tutor included.
          </p>

          {/* Feature Cards List */}
          <ul style={{ width:'100%', listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>

            {/* 1. AI Notes */}
            <li style={{ width:'100%' }} className="reveal-child">
              <article style={{ display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', background:'white', borderRadius:16, padding:'32px 40px', margin:'16px 0', backgroundImage:'linear-gradient(to right, #FFF, #FFF3E3)', gap:40, flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 400px', minWidth:0 }}>
                  <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:28, marginBottom:28 }}>
                    <div style={{ width:88, height:88, background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <BookOpen style={{ width:40, height:40, color:'var(--primary)' }} />
                    </div>
                    <div>
                      <h3 style={{ color:'#333333', fontFamily:'var(--font-inter)', fontWeight:600, lineHeight:'140%', fontSize:24, marginBottom:6 }}>AI Notes</h3>
                      <p style={{ color:'#82837C', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', fontSize:18 }}>Notes that write themselves</p>
                    </div>
                  </div>
                  <p style={{ fontSize:17, color:'#666', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', maxWidth:443 }}>
                    Get structured notes in seconds — so you can focus on understanding, not typing. Less cognitive overload, more actual learning.
                  </p>
                </div>
                {/* Mockup */}
                <div style={{ width:320, flexShrink:0, background:'white', borderRadius:12, border:'1px solid #e8e8ec', padding:20, boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:12, borderBottom:'1px solid #f3f4f6' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--primary)' }}>AI Notes</span>
                    <div style={{ display:'flex', gap:6 }}>
                      {['A','A+','◫'].map(c => <span key={c} style={{ fontSize:11, fontWeight:700, color:'#ccc' }}>{c}</span>)}
                    </div>
                  </div>
                  {[
                    { heading:'Introduction to the Cell', lines:[85, 100, 70, 60] },
                    { heading:'Historical Context', lines:[90, 75, 55] },
                  ].map(({ heading, lines }) => (
                    <div key={heading} style={{ marginBottom:16 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#333', marginBottom:8 }}>{heading}</div>
                      {lines.map((w, i) => (
                        <div key={i} style={{ height:7, background: i===0 ? 'rgba(151,24,251,0.15)' : '#f3f4f6', borderRadius:99, marginBottom:5, width:`${w}%` }} />
                      ))}
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                        <span style={{ fontSize:10, color:'var(--primary)', fontWeight:600 }}>✦ Explore more</span>
                        <span style={{ fontSize:10, color:'#ccc' }}>Page 1</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </li>

            {/* 2. AI Summary */}
            <li style={{ width:'100%' }} className="reveal-child">
              <article style={{ display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', background:'white', borderRadius:16, padding:'32px 40px', margin:'16px 0', backgroundImage:'linear-gradient(to right, #FFF, #E8FFF6)', gap:40, flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 400px', minWidth:0 }}>
                  <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:28, marginBottom:28 }}>
                    <div style={{ width:88, height:88, background:'linear-gradient(135deg,#d1fae5,#a7f3d0)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <FileText style={{ width:40, height:40, color:'#059669' }} />
                    </div>
                    <div>
                      <h3 style={{ color:'#333333', fontFamily:'var(--font-inter)', fontWeight:600, lineHeight:'140%', fontSize:24, marginBottom:6 }}>AI Summary</h3>
                      <p style={{ color:'#82837C', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', fontSize:18 }}>Review faster, anytime</p>
                    </div>
                  </div>
                  <p style={{ fontSize:17, color:'#666', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', maxWidth:443 }}>
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
              </article>
            </li>

            {/* 3. AI Flashcards */}
            <li style={{ width:'100%' }} className="reveal-child">
              <article style={{ display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', background:'white', borderRadius:16, padding:'32px 40px', margin:'16px 0', backgroundImage:'linear-gradient(to right, #FFF, #FEE)', gap:40, flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 400px', minWidth:0 }}>
                  <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:28, marginBottom:28 }}>
                    <div style={{ width:88, height:88, background:'linear-gradient(135deg,#fee2e2,#fecaca)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Layers style={{ width:40, height:40, color:'#dc2626' }} />
                    </div>
                    <div>
                      <h3 style={{ color:'#333333', fontFamily:'var(--font-inter)', fontWeight:600, lineHeight:'140%', fontSize:24, marginBottom:6 }}>AI Flashcards</h3>
                      <p style={{ color:'#82837C', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', fontSize:18 }}>Make It Impossible to Forget</p>
                    </div>
                  </div>
                  <p style={{ fontSize:17, color:'#666', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', maxWidth:443 }}>
                    Auto-generate flashcards from your material and practice active recall — the science-backed method that makes information stick.
                  </p>
                </div>
                {/* Mockup — flashcard flip ui */}
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
              </article>
            </li>

            {/* 4. AI Quizzes */}
            <li style={{ width:'100%' }} className="reveal-child">
              <article style={{ display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', background:'white', borderRadius:16, padding:'32px 40px', margin:'16px 0', backgroundImage:'linear-gradient(to right, #FFF, #ECE7FF)', gap:40, flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 400px', minWidth:0 }}>
                  <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:28, marginBottom:28 }}>
                    <div style={{ width:88, height:88, background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <GraduationCap style={{ width:40, height:40, color:'var(--primary)' }} />
                    </div>
                    <div>
                      <h3 style={{ color:'#333333', fontFamily:'var(--font-inter)', fontWeight:600, lineHeight:'140%', fontSize:24, marginBottom:6 }}>AI Quizzes</h3>
                      <p style={{ color:'#82837C', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', fontSize:18 }}>Test yourself before exams do</p>
                    </div>
                  </div>
                  <p style={{ fontSize:17, color:'#666', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', maxWidth:443 }}>
                    Auto-generate quizzes directly from your material. Check your understanding, spot gaps early, and find weak spots before the exam does.
                  </p>
                </div>
                {/* Mockup — MCQ card */}
                <div style={{ width:320, flexShrink:0, background:'white', borderRadius:12, border:'1px solid #e8e8ec', padding:20, boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:11, fontWeight:800, color:'#888', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Question 3 of 12</div>
                  <p style={{ fontSize:13, fontWeight:600, color:'#333', lineHeight:1.6, marginBottom:14 }}>Which organelle is responsible for producing ATP?</p>
                  {[
                    { letter:'A', text:'Nucleus', correct:false },
                    { letter:'B', text:'Mitochondria', correct:true },
                    { letter:'C', text:'Ribosome', correct:false },
                    { letter:'D', text:'Golgi apparatus', correct:false },
                  ].map(({ letter, text, correct }) => (
                    <div key={letter} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 12px', borderRadius:8, marginBottom:6, border:`1px solid ${correct ? 'rgba(151,24,251,0.5)' : '#f3f4f6'}`, background: correct ? 'rgba(151,24,251,0.06)' : '#fafafa' }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, flexShrink:0, background: correct ? 'var(--primary)' : '#e5e7eb', color: correct ? 'white' : '#aaa' }}>{letter}</div>
                      <span style={{ fontSize:12, fontWeight: correct ? 700 : 400, color: correct ? 'var(--primary)' : '#666' }}>{text}</span>
                      {correct && <Check style={{ width:12, height:12, color:'var(--primary)', marginLeft:'auto' }} />}
                    </div>
                  ))}
                </div>
              </article>
            </li>

            {/* 5. AI Tutor */}
            <li style={{ width:'100%' }} className="reveal-child">
              <article style={{ display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', background:'white', borderRadius:16, padding:'32px 40px', margin:'16px 0', backgroundImage:'linear-gradient(to right, #FFF, #E4FAFF)', gap:40, flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 400px', minWidth:0 }}>
                  <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:28, marginBottom:28 }}>
                    <div style={{ width:88, height:88, background:'linear-gradient(135deg,#e0f2fe,#bae6fd)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <MessageSquare style={{ width:40, height:40, color:'#0284c7' }} />
                    </div>
                    <div>
                      <h3 style={{ color:'#333333', fontFamily:'var(--font-inter)', fontWeight:600, lineHeight:'140%', fontSize:24, marginBottom:6 }}>AI Tutor</h3>
                      <p style={{ color:'#82837C', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', fontSize:18 }}>Ask questions. Get clarity 24/7</p>
                    </div>
                  </div>
                  <p style={{ fontSize:17, color:'#666', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', maxWidth:443 }}>
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
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {['Give an example', 'Quiz me on this', 'Explain deeper'].map(chip => (
                        <button key={chip} style={{ fontSize:10, fontWeight:600, background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:99, padding:'4px 10px', cursor:'pointer', color:'#0284c7' }}>{chip}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop:12, position:'relative' }}>
                    <input placeholder="Ask anything..." style={{ width:'100%', background:'#f8fafc', fontSize:11, padding:'9px 36px 9px 12px', borderRadius:8, border:'1px solid #e2e8f0', outline:'none', fontFamily:'var(--font-inter)' }} />
                    <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', width:20, height:20, background:'#0284c7', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <ArrowRight style={{ width:10, height:10, color:'white' }} />
                    </div>
                  </div>
                </div>
              </article>
            </li>

          </ul>
        </div>
      </section>

      {/* ═══════════════ UPLOAD ANYTHING — FORMATS ═══════════════ */}
      <section style={{ padding: '96px 0', background: '#F8F8F8' }} aria-labelledby="supported-formats-heading">
        <div className="container-full" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>

          {/* Header */}
          <h2 id="supported-formats-heading" className="reveal-child" style={{ fontSize:'clamp(1.8rem, 3.5vw, 2.5rem)', textAlign:'center', maxWidth:586, margin:'0 auto 16px', color:'#333333', fontFamily:'var(--font-besley)', fontWeight:600, lineHeight:'140%' }}>
            Upload anything.&nbsp;<span style={{ color:'var(--primary)', fontStyle:'italic' }}>Learn everything</span>
          </h2>
          <p className="reveal-child" style={{ fontSize:18, color:'#666', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', textAlign:'center', maxWidth:640, marginBottom:56 }}>
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
              <div style={{ width:80, height:80, background:'linear-gradient(135deg,#ede9fe,#c4b5f7)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, boxShadow:'0 4px 20px rgba(151,24,251,0.2)' }}>
                <Brain style={{ width:38, height:38, color:'var(--primary)' }} />
              </div>
              <h4 style={{ color:'#333', textAlign:'center', fontFamily:'var(--font-inter)', fontWeight:700, lineHeight:'140%', fontSize:17, padding:'0 8px', marginBottom:10 }}>
                Any file. Any format. Any subject.
              </h4>
              <p style={{ color:'#888', textAlign:'center', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', fontSize:13, padding:'0 8px', marginBottom:20 }}>
                PDFs, slides, YouTube videos, audio, web links, and more
              </p>
              <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px 16px', fontSize:13 }}>
                Start a Free Study Session <ArrowRight style={{ width:15, height:15 }} />
              </button>
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

      {/* ═══════════════ CBT SIMULATOR (light theme) ═══════════════ */}
      <section id="cbt" style={{ padding: '120px 0', background: 'linear-gradient(to bottom, #FFFFFF, #FCFAFF)', position: 'relative', overflow: 'hidden' }}>
        <div className="container-custom" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
            
            {/* Left Content */}
            <div className="reveal-child">
              {/* Pill badge */}
              <div style={{ display:'inline-block', fontSize:11, fontFamily:'var(--font-inter)', fontWeight:800, letterSpacing:'0.08em', color:'var(--primary)', textTransform:'uppercase', border:'1px solid rgba(151,24,251,0.2)', borderRadius:99, padding:'6px 14px', marginBottom:28, background:'rgba(151,24,251,0.06)' }}>
                CBT Simulation
              </div>

              <h2 style={{ fontSize:'clamp(2.5rem, 4.5vw, 3.8rem)', color:'#333333', fontFamily:'var(--font-besley)', fontWeight:700, lineHeight:'1.15', marginBottom:28, letterSpacing:'-0.02em' }}>
                Score higher with<br/><span style={{ color:'var(--primary)' }}>AI mock exams.</span>
              </h2>
              <p style={{ fontSize:18, color:'#666', fontFamily:'var(--font-inter)', fontWeight:500, lineHeight:'180%', marginBottom:40, maxWidth:500 }}>
                Luter generates questions that mirror your university's real format. The more you practice, the sharper your instincts become.
              </p>
              
              <div style={{ display:'flex', flexDirection:'column', gap:18, marginBottom:48 }}>
                {[
                  'Trained on actual university past questions',
                  'Adaptive difficulty that grows with you',
                  'Detailed explanations for every answer'
                ].map((pt, index) => (
                  <div key={index} style={{ display:'flex', gap:14, alignItems:'center' }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(151,24,251,0.2)' }}>
                      <Check style={{ width:12, height:12, color:'white', strokeWidth:3 }} />
                    </div>
                    <span style={{ fontSize:16, color:'#555', fontFamily:'var(--font-inter)', fontWeight:600 }}>{pt}</span>
                  </div>
                ))}
              </div>

              <button className="btn-primary" style={{ padding:'14px 28px', fontSize:15, boxShadow:'0 4px 14px rgba(151,24,251,0.3)', display:'inline-flex', alignItems:'center', gap:8 }}>
                Start Practice Exam <Zap style={{ width:16, height:16 }} />
              </button>
            </div>

            {/* Right mock exam card (Light interface) */}
            <div className="reveal-child" style={{ position: 'relative' }}>
              {/* Decorative blurred blob */}
              <div style={{ position:'absolute', top:'-15%', right:'-15%', width:'400px', height:'400px', background:'linear-gradient(135deg, rgba(151,24,251,0.15), rgba(196,181,247,0.3))', borderRadius:'50%', filter:'blur(60px)', zIndex: 0 }} />
              <div style={{ position:'absolute', bottom:'-5%', left:'-10%', width:'250px', height:'250px', background:'linear-gradient(135deg, rgba(100,50,255,0.1), rgba(151,24,251,0.1))', borderRadius:'50%', filter:'blur(50px)', zIndex: 0 }} />
              
              <div style={{ position: 'relative', zIndex: 1, background:'white', borderRadius:32, padding:40, border:'1px solid #ebe9f5', boxShadow:'0 24px 64px rgba(151,24,251,0.08), 0 4px 12px rgba(0,0,0,0.02)' }}>
                
                <div style={{ marginBottom:32 }}>
                  <div style={{ fontSize:11, fontFamily:'var(--font-inter)', fontWeight:800, letterSpacing:'0.1em', color:'#a1a1aa', textTransform:'uppercase', marginBottom:12 }}>Question 14 of 30</div>
                  <div style={{ background:'#fafafa', borderRadius:16, padding:'24px 28px', fontSize:16, fontFamily:'var(--font-inter)', color:'#333', fontWeight:600, lineHeight:1.6, border:'1px solid #f4f4f5' }}>
                    Which of the following best describes the role of the hypothalamus?
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    { letter:'A', text:'Regulates body temperature and hunger', correct:true },
                    { letter:'B', text:'Controls voluntary muscle movement', correct:false },
                    { letter:'C', text:'Processes visual information', correct:false },
                    { letter:'D', text:'Manages long-term memory storage', correct:false },
                  ].map(({ letter, text, correct }) => (
                    <div key={letter} style={{
                      display:'flex', gap:16, alignItems:'center', padding:'16px 20px', borderRadius:16,
                      border:`1px solid ${correct ? 'rgba(151,24,251,0.3)' : '#f4f4f5'}`,
                      background: correct ? 'rgba(151,24,251,0.04)' : 'white',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ 
                        width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, fontFamily:'var(--font-inter)', flexShrink:0, 
                        background: correct ? 'var(--primary)' : '#f3f4f6', 
                        color: correct ? 'white' : '#9ca3af' 
                      }}>
                        {letter}
                      </div>
                      <span style={{ fontSize:15, fontFamily:'var(--font-inter)', color: correct ? '#111' : '#6b7280', fontWeight: correct ? 700 : 500 }}>{text}</span>
                      {correct && <Check style={{ width:16, height:16, color:'var(--primary)', marginLeft:'auto', flexShrink:0 }} />}
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:32, paddingTop:24, borderTop:'1px solid #ebe9f5' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, color:'#a1a1aa', fontSize:13, fontFamily:'var(--font-inter)', fontWeight:700 }}>
                    <Clock style={{ width:14, height:14 }} /> 8:45 remaining
                  </div>
                  <button className="btn-primary" style={{ padding:'10px 24px', borderRadius:10, fontSize:14, fontFamily:'var(--font-inter)', paddingLeft:24, paddingRight:20 }}>
                    Next <ArrowRight style={{ width:14, height:14 }} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>



      {/* ═══════════════ COMPARISON ═══════════════ */}
      <section style={{ padding: '80px 0', background: '#fafafa' }}>
        <div className="container-custom">
          <h2 className="reveal-child" style={{ textAlign:'center', fontSize:'clamp(1.8rem,3.5vw,2.6rem)', marginBottom:48 }}>
            The smarter way to study.
          </h2>
          <div className="reveal-child" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:'1px solid var(--border)', borderRadius:28, overflow:'hidden', boxShadow:'var(--card-shadow)' }}>
            {/* Old way */}
            <div style={{ padding:'48px 40px', background:'white' }}>
              <h4 style={{ fontSize:12, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'#ddd', marginBottom:32 }}>The Old Way</h4>
              {['Scanning 50 slides one by one','Zero practice questions','Notes scattered everywhere','Zoning out during lectures','Cramming the night before'].map((item) => (
                <div key={item} className="comparison-item-old">
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'#f3f4f6', border:'1px solid #e5e7eb', flexShrink:0 }} />
                  {item}
                </div>
              ))}
            </div>
            {/* Luter way */}
            <div style={{ padding:'48px 40px', background:'var(--primary)' }}>
              <h4 style={{ fontSize:12, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:32 }}>The Luter Way</h4>
              {['Instant AI-powered summaries','Auto-generated CBT exams','One unified study workspace','Focused, active learning sessions','Science-based retention system'].map((item) => (
                <div key={item} className="comparison-item-new">
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Check style={{ width:12, height:12, color:'white' }} strokeWidth={3} />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOR WHOM ═══════════════ */}
      <section style={{ padding: '80px 0', background: 'white' }}>
        <div className="container-custom">
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <h2 className="reveal-child" style={{ fontSize:'clamp(1.8rem,3.5vw,2.6rem)', marginBottom:12 }}>Built for every kind of learner.</h2>
            <p className="reveal-child" style={{ color:'#aaa', fontSize:16 }}>Luter adapts to your goals, not the other way around.</p>
          </div>
          <div className="section-16-grid">
            {[
              { emoji:'🎓', role:'University Students', desc:'Ace your semester with AI-powered notes, summaries, and mock exams tailored to your courses.' },
              { emoji:'📚', role:'Self-Learners', desc:'Master any subject at your own pace with structured content and intelligent revision reminders.' },
              { emoji:'🏥', role:'Professionals', desc:'Stay sharp on industry knowledge, certifications, and continuing education requirements.' },
              { emoji:'✏️', role:'Tutors & Teachers', desc:'Create course materials instantly and track how well concepts are landing with your students.' },
            ].map(({ emoji, role, desc }) => (
              <div key={role} className="role-card reveal-child">
                <div className="role-icon">{emoji}</div>
                <h4 style={{ fontSize:17, fontWeight:700, fontFamily:'var(--font-inter)', marginBottom:10, color:'#111' }}>{role}</h4>
                <p style={{ fontSize:14, color:'#888', lineHeight:1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section style={{ padding: '96px 0', background: '#fafafa' }}>
        <div className="container-custom">
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <h2 className="reveal-child" style={{ fontSize:'clamp(2rem,4vw,3rem)', marginBottom:12 }}>Voices of Excellence.</h2>
            <p className="reveal-child" style={{ color:'#aaa', fontSize:16 }}>Real students. Real results.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {[
              { text:'"Luter predicted my final exam questions almost perfectly. I went from a 2.5 to a 4.2 GPA in one semester."', name:'Tobe Okafor', school:'UNILAG — Computer Science', initials:'TO', color:'#c084fc' },
              { text:'"I used to spend weekends rewriting notes. Now Luter does it in minutes. I actually have free time now."', name:'Amara Diallo', school:'University of Ghana — Medicine', initials:'AD', color:'#60a5fa' },
              { text:'"The AI Tutor explained thermodynamics at 2am when I was panicking before my exam. Absolute game changer."', name:'James Osei', school:'Stellenbosch University — Engineering', initials:'JO', color:'#34d399' },
            ].map(({ text, name, school, initials, color }) => (
              <div key={name} className="testimonial-card reveal-child">
                <div className="testimonial-quote">"</div>
                <div style={{ display:'flex', gap:2, marginBottom:4 }}><Stars /></div>
                <p style={{ fontSize:15, color:'#555', lineHeight:1.8, fontStyle:'italic', flex:1 }}>{text}</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background: color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'white', flexShrink:0 }}>{initials}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#111' }}>{name}</div>
                    <div style={{ fontSize:12, color:'#aaa' }}>{school}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING TEASER ═══════════════ */}
      <section id="pricing" style={{ padding:'80px 0', background:'white' }}>
        <div className="container-custom" style={{ maxWidth:680, textAlign:'center' }}>
          <div className="badge reveal-child" style={{ marginBottom:16 }}>Simple Pricing</div>
          <h2 className="reveal-child" style={{ fontSize:'clamp(1.8rem,3.5vw,2.6rem)', marginBottom:12 }}>Start free. Upgrade when you're ready.</h2>
          <p className="reveal-child" style={{ color:'#aaa', fontSize:16, marginBottom:48 }}>No credit card required to start. Cancel anytime.</p>
          <div className="reveal-child" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {[
              { plan:'Free', price:'$0', period:'/mo', features:['5 sessions/month','AI Notes & Summaries','Basic flashcards','Web access'], cta:'Get Started Free', primary:false },
              { plan:'Pro', price:'$12', period:'/mo', features:['Unlimited sessions','CBT Mock Exams','AI Tutor 24/7','Mobile app access','Priority support'], cta:'Start 7-day Free Trial', primary:true },
            ].map(({ plan, price, period, features, cta, primary }) => (
              <div key={plan} style={{ background: primary ? 'var(--primary)' : 'white', border: primary ? 'none' : '1px solid var(--border)', borderRadius:24, padding:32, textAlign:'left', boxShadow: primary ? '0 20px 60px rgba(151,24,251,0.3)' : 'var(--card-shadow)' }}>
                <div style={{ fontSize:13, fontWeight:700, color: primary ? 'rgba(255,255,255,0.6)' : '#aaa', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>{plan}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:24 }}>
                  <span style={{ fontSize:40, fontWeight:800, color: primary ? 'white' : '#111', fontFamily:'var(--font-besley)' }}>{price}</span>
                  <span style={{ fontSize:14, color: primary ? 'rgba(255,255,255,0.5)' : '#aaa' }}>{period}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
                  {features.map(f => (
                    <div key={f} style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <Check style={{ width:15, height:15, color: primary ? 'rgba(255,255,255,0.8)' : 'var(--primary)', flexShrink:0 }} />
                      <span style={{ fontSize:14, color: primary ? 'rgba(255,255,255,0.8)' : '#555', fontWeight:500 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button style={{
                  width:'100%', padding:'13px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer',
                  background: primary ? 'white' : 'var(--primary)',
                  color: primary ? 'var(--primary)' : 'white',
                  border: 'none',
                  transition: 'all 0.2s',
                }}>{cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section style={{ padding:'80px 0', background:'#fafafa' }}>
        <div className="container-custom" style={{ maxWidth:680 }}>
          <h2 className="reveal-child" style={{ textAlign:'center', fontSize:'clamp(1.8rem,3.5vw,2.4rem)', marginBottom:48 }}>Frequently Asked Questions</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { q:'Is Luter free for students?', a:'Yes! Luter has a generous free tier — 5 study sessions per month with AI notes and summaries included. Pro unlocks unlimited sessions, CBT exams, and the 24/7 AI Tutor.' },
              { q:'Does it work offline?', a:'Your generated notes and flashcards are cached on mobile so you can study on the go without internet. AI Tutor and new generations require an active connection.' },
              { q:'How accurate is the mock exam feature?', a:'Our AI is trained on actual university past questions across hundreds of institutions, delivering over 99% topical relevance to your specific curriculum.' },
              { q:'What file formats does Luter support?', a:'Luter processes PDFs, PowerPoint files, Word docs, YouTube links, web article URLs, audio recordings (MP3/M4A), and even photos of handwritten notes.' },
              { q:'Is my data private?', a:'Absolutely. All uploaded content is encrypted in transit and at rest. We never sell your data or use it to train our models without explicit consent.' },
            ].map(item => <FAQItem key={item.q} {...item} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL ═══════════════ */}
      <section style={{ padding:'80px 0 96px', background:'white' }}>
        <div className="container-custom">
          <div className="cta-section reveal-child" style={{ padding:'80px 48px', textAlign:'center', position:'relative' }}>
            <div className="cta-glow-1" />
            <div className="cta-glow-2" />
            <div className="badge-dark reveal-child" style={{ marginBottom:24, position:'relative', zIndex:1 }}>
              <Sparkles style={{ width:12, height:12, display:'inline', marginRight:4, verticalAlign:'middle' }}/>
              Start for free today
            </div>
            <h2 style={{ fontSize:'clamp(2.4rem, 6vw, 5rem)', color:'white', marginBottom:20, position:'relative', zIndex:1, lineHeight:1.1 }}>
              The future of learning<br />
              <span style={{ color:'#c084fc', fontStyle:'italic' }}>starts now.</span>
            </h2>
            <p style={{ fontSize:17, color:'rgba(255,255,255,0.45)', maxWidth:440, margin:'0 auto 40px', position:'relative', zIndex:1, lineHeight:1.7 }}>
              Join 5 million students who've replaced stress with strategy.
            </p>
            <div style={{ display:'flex', gap:14, justifyContent:'center', position:'relative', zIndex:1 }}>
              <button className="btn-primary" style={{ background:'white', color:'var(--primary)', padding:'16px 36px', fontSize:16, fontWeight:800 }}>
                Get Started — It's Free <ArrowRight style={{ width:18, height:18 }} />
              </button>
              <button className="btn-secondary" style={{ border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.07)', color:'white', padding:'16px 28px', fontSize:15 }}>
                <Play style={{ width:15, height:15, fill:'white' }} /> Watch Demo
              </button>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', marginTop:20, position:'relative', zIndex:1, fontWeight:500 }}>
              Free forever · No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer style={{ borderTop:'1px solid var(--border-light)', padding:'56px 0 40px', background: '#fafafa' }}>
        <div className="container-full">
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:48, marginBottom:48 }}>
            {/* Brand */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <LuterLogo size={32} fontSize={28} />
              </div>
              <p style={{ fontSize:14, color:'#aaa', lineHeight:1.8, maxWidth:240 }}>
                The AI-powered study platform built to help you learn faster, remember more, and stress less.
              </p>
            </div>
            {/* Links */}
            {[
              { title:'Product', links:['Features','Pricing','How it works','Changelog'] },
              { title:'Company', links:['About','Blog','Careers','Press'] },
              { title:'Legal', links:['Privacy','Terms','Cookie Policy','Security'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'#ccc', marginBottom:16 }}>{title}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {links.map(l => (
                    <a key={l} href="#" style={{ fontSize:14, color:'#999', fontWeight:500, transition:'color 0.15s' }}
                      onMouseEnter={e => e.target.style.color='#111'}
                      onMouseLeave={e => e.target.style.color='#999'}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid var(--border-light)', paddingTop:28, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <span style={{ fontSize:13, color:'#ccc', fontWeight:500 }}>© 2025 Luter AI Corp. All rights reserved.</span>
            <div style={{ display:'flex', gap:20 }}>
              {['Twitter','Instagram','LinkedIn','YouTube'].map(s => (
                <a key={s} href="#" style={{ fontSize:13, color:'#bbb', fontWeight:600, transition:'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color='#111'}
                  onMouseLeave={e => e.target.style.color='#bbb'}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
