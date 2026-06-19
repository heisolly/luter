import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Lightning,
  Shield,
  Heart,
  Sparkle,
  GraduationCap,
  RocketLaunch,
  Globe,
  BookOpen,
  Cards,
  ChartLine
} from '@phosphor-icons/react';
import { SharedNavbar, SharedFooter, StyledFAQ, PremiumButton, RevealDiv } from './PageShared';
import FallingElements from './shared/FallingElements';
import { getAppUrl } from '../utils/urlUtils';
import { useTheme } from '../contexts/ThemeContext';

const aboutFaqs = [
  { q: 'Who is Luter for?', a: 'Luter is designed for students at every level — high school, university, and lifelong learners — who want to master complex information faster and with less stress.' },
  { q: 'Is my data used for training AI?', a: 'No. We have a strict privacy policy. Your personal study materials and notes are never used to train global AI models. Your data is yours, always.' },
  { q: 'Who built Luter?', a: 'Luter was founded by Michael Oluwayanmi and a team of educators and engineers passionate about applying cognitive science to modern learning tools.' },
  { q: 'Can I export my notes and flashcards?', a: 'Yes! You can export your AI-generated notes and flashcards to PDF, Notion, or Anki anytime with just a few clicks.' },
  { q: 'Is Luter available globally?', a: 'Yes. Luter is available in 7 languages including English, French, Spanish, Italian, German, Swedish, and Polish — and we\'re adding more.' },
];



const VALUES = [
  {
    icon: <Brain size={28} weight="duotone" />,
    title: 'Science First',
    desc: 'Every feature is grounded in cognitive research. Active recall, spaced repetition, retrieval practice — not just buzzwords, but proven methods.',
    tag: 'Evidence-based',
  },
  {
    icon: <Lightning size={28} weight="duotone" />,
    title: 'Simple by Design',
    desc: 'Upload and forget. We handle all the complexity so you don\'t have to. No steep learning curve — just instant results.',
    tag: 'Effortless UX',
  },
  {
    icon: <Shield size={28} weight="duotone" />,
    title: 'Privacy Always',
    desc: 'Your notes are yours. Encrypted, private, and never shared or sold. Focus on learning, not on privacy concerns.',
    tag: 'Zero data sharing',
  },
  {
    icon: <Globe size={28} weight="duotone" />,
    title: 'Built for Everyone',
    desc: 'From Lagos to London, Tokyo to Toronto. Luter is built with global students in mind, supporting 7 languages and growing.',
    tag: 'Global platform',
  },
];


// Wave badge (same as landing page)
function WaveBadge({ text, badgeStyle = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'inline-block', padding: '2px 20px', borderRadius: '20px', margin: '0 4px', cursor: 'default', ...badgeStyle }}
    >
      {text.split('').map((char, i) => (
        <span key={i} style={{ display: 'inline-block', transform: hovered ? 'translateY(-6px)' : 'translateY(0px)', transition: `transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.04}s` }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}


export default function About() {
  const { isDark } = useTheme();
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className={isDark ? 'dark' : ''} style={{ background: 'var(--background)', minHeight: '100vh', color: 'var(--foreground)', fontFamily: 'var(--font-body)', paddingTop: 72, overflowX: 'hidden' }}>
      <SharedNavbar />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: '100px 24px 120px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        background: 'radial-gradient(circle at 10% 20%, rgba(196,181,253,0.1) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(152,255,152,0.08) 0%, transparent 45%)',
      }}>
        {/* Ambient glows */}
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,181,253,0.14) 0%, transparent 70%)', top: '-150px', left: '-100px', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(152,255,152,0.1) 0%, transparent 70%)', bottom: '0px', right: '-80px', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)', borderRadius: 9999, padding: '8px 20px', fontSize: 13, fontWeight: 800, color: '#7c3aed', marginBottom: 36, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Sparkle size={14} weight="fill" color="#7c3aed" /> Our Story
          </div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 7vw, 5.2rem)', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 32, maxWidth: 900 }}>
          We're on a mission to make
          <br />
          <WaveBadge text="every student" badgeStyle={{ background: '#C4B5FD', color: '#2E1065', border: '2px solid rgba(167,139,250,0.8)', borderBottom: '6px solid rgba(167,139,250,1)', transform: 'rotate(-1.5deg)', boxShadow: '0 8px 16px rgba(167,139,250,0.15)' }} />
          <WaveBadge text="unstoppable." badgeStyle={{ background: '#98FF98', color: '#065F46', border: '2px solid #6EE7B7', borderBottom: '6px solid #34D399', transform: 'rotate(1.5deg)', boxShadow: '0 8px 16px rgba(52,211,153,0.15)' }} />
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          style={{ fontFamily: 'var(--font-body)', fontSize: '1.2rem', color: 'var(--tt-gray-light-a-600)', maxWidth: 620, margin: '0 auto 56px', lineHeight: 1.8 }}>
          Luter started with a simple belief: great learning tools shouldn't be complicated. They should work quietly in the background, letting you focus on what matters most — understanding.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <PremiumButton to={getAppUrl('/signup')} size="lg" style={{ width: 220, borderRadius: '16px' }}>
            Start for Free
          </PremiumButton>
          <PremiumButton to={getAppUrl('/features')} variant="outline" size="lg" style={{ width: 220, borderRadius: '16px' }}>
            See Features
          </PremiumButton>
        </motion.div>
      </section>


      {/* ── ORIGIN STORY ── */}
      <section style={{ padding: '120px 24px', background: 'var(--background)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)', borderRadius: 9999, padding: '8px 20px', fontSize: 13, fontWeight: 800, color: '#7c3aed', marginBottom: 24, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <RocketLaunch size={14} weight="fill" color="#7c3aed" /> The Origin
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                From a dorm room frustration<br />to a global platform
              </h2>
            </div>
          </RevealDiv>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            {[
              { emoji: '😤', title: 'The Problem', text: '60-slide presentations. 3-hour lectures. Dense textbooks. Scattered notes across dozens of apps. Students were drowning — and running out of time.' },
              { emoji: '💡', title: 'The Idea', text: 'What if AI could do the heavy lifting? Transform any material into smart flashcards, summaries, and quizzes automatically — so students could just focus on learning.' },
              { emoji: '🚀', title: 'The Launch', text: 'Luter launched and students immediately got it. Today, over 100,000 students worldwide use Luter to master their curricula faster and retain more.' },
            ].map((card, i) => (
              <RevealDiv key={i} delay={i * 0.1}>
                <div style={{ background: 'rgba(196,181,253,0.08)', border: '1.5px solid rgba(167,139,250,0.25)', borderRadius: 28, padding: '40px 36px', height: '100%', boxSizing: 'border-box', transition: 'all 0.3s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,181,253,0.14)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(196,181,253,0.08)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)'; }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: 20 }}>{card.emoji}</div>
                  <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, padding: '4px 12px', background: 'rgba(196,181,253,0.2)', borderRadius: 999, border: '1px solid rgba(167,139,250,0.3)' }}>
                    {card.title}
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--tt-gray-light-a-600)', lineHeight: 1.75, fontWeight: 500 }}>
                    {card.text}
                  </p>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ padding: '120px 24px', background: `radial-gradient(ellipse 80% 60% at 0% 50%, rgba(151,24,251,0.08) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 100% 50%, rgba(113,128,254,0.08) 0%, transparent 60%), var(--background)` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)', borderRadius: 9999, padding: '8px 20px', fontSize: 13, fontWeight: 800, color: '#7c3aed', marginBottom: 24, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <Heart size={14} weight="fill" color="#7c3aed" /> What We Stand For
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                Our core values
              </h2>
            </div>
          </RevealDiv>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {VALUES.map((val, i) => (
              <RevealDiv key={i} delay={i * 0.08}>
                <div style={{
                  background: 'var(--background)', border: '1.5px solid rgba(167,139,250,0.2)',
                  borderRadius: 28, padding: '40px 32px',
                  transition: 'all 0.3s ease', cursor: 'default',
                  boxShadow: '0 4px 16px rgba(167,139,250,0.06)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(139,92,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(167,139,250,0.06)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)'; }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(196,181,253,0.15)', border: '1.5px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: '#7c3aed' }}>
                    {val.icon}
                  </div>
                  <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#7c3aed', background: 'rgba(196,181,253,0.15)', padding: '4px 12px', borderRadius: 999, marginBottom: 16, letterSpacing: '0.04em', border: '1px solid rgba(167,139,250,0.2)' }}>
                    {val.tag}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--foreground)', marginBottom: 12 }}>
                    {val.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--tt-gray-light-a-600)', lineHeight: 1.75 }}>
                    {val.desc}
                  </p>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── LETTER FROM CEO ── */}
      <section style={{ padding: '120px 24px', background: 'var(--background)', display: 'flex', justifyContent: 'center' }}>
        <RevealDiv style={{ width: '100%', maxWidth: 860 }}>
          <div style={{
            position: 'relative', background: 'var(--card-bg-light, #ffffff)',
            padding: '80px 56px', borderRadius: 32,
            boxShadow: 'var(--card-shadow-letter, 0 25px 50px -12px rgba(0,0,0,0.06))',
            border: 'var(--card-border-letter, none)',
            fontFamily: "'Caveat', cursive",
            color: 'var(--card-text-letter, #334155)',
            fontSize: '2.2rem', lineHeight: 1.55, fontWeight: 600,
            textAlign: 'center',
          }}>
            {/* Floating stickers */}
            <div style={{ position: 'absolute', top: -28, right: 64, fontSize: '3.5rem', transform: 'rotate(15deg)', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.1))', zIndex: 3 }}>🚀</div>
            <div style={{ position: 'absolute', bottom: 80, left: -18, fontSize: '3.5rem', transform: 'rotate(-15deg)', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.1))', zIndex: 3 }}>🧠</div>
            <div style={{ position: 'absolute', top: 56, left: -18, fontSize: '2.8rem', transform: 'rotate(-25deg)', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.1))', zIndex: 3 }}>✨</div>
            <div style={{ position: 'absolute', bottom: -18, right: 90, fontSize: '3rem', transform: 'rotate(10deg)', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.1))', zIndex: 3 }}>🎓</div>

            {/* Big quote mark */}
            <div style={{ position: 'absolute', top: 10, left: 36, fontSize: '13rem', color: 'var(--card-quote-mark)', fontFamily: 'Georgia, serif', lineHeight: 1, zIndex: 1, opacity: 0.8 }}>"</div>

            <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
              <div style={{ marginBottom: 28, color: 'var(--foreground)', fontSize: '3rem', fontWeight: 700 }}>
                They say studying is hard...
              </div>
              <div style={{ marginBottom: 20 }}>
                But we believe it's just a puzzle waiting to be solved. We built Luter because every student deserves to experience that "Aha!" moment.
              </div>
              <div style={{ marginBottom: 40 }}>
                Don't let exams intimidate you — turn your confusion into confidence and your hard work into top grades. Start learning today, and soon you'll realize...
              </div>
              <div style={{ fontSize: '3.2rem', color: '#2563EB', transform: 'rotate(-2deg)', marginBottom: 48, display: 'block' }}>
                "You were always capable of brilliance."
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32 }}>
                <img src="/signature.png" alt="Michael Oluwayanmi Signature" style={{ height: 100, objectFit: 'contain', opacity: 0.9, mixBlendMode: 'multiply' }} />
                <div style={{ fontSize: '1.1rem', color: 'var(--tt-gray-light-a-600)', marginTop: 4, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Michael Oluwayanmi</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--tt-gray-light-a-600)', marginTop: 4, fontFamily: 'var(--font-body)' }}>CEO & Co-Founder, Luter</div>
              </div>
            </div>
          </div>
        </RevealDiv>
      </section>


      {/* ── FEATURES STRIP ── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--background)', overflow: 'hidden' }}>
        <RevealDiv style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            Everything you need to ace your exams
          </h2>
        </RevealDiv>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: <Cards size={24} weight="duotone" color="#7c3aed" />, label: 'Smart Flashcards', desc: 'Generated from your notes' },
            { icon: <Brain size={24} weight="duotone" color="#7c3aed" />, label: 'AI Assistant', desc: 'Chat with your documents' },
            { icon: <ChartLine size={24} weight="duotone" color="#7c3aed" />, label: 'Progress Analytics', desc: 'Track your growth' },
            { icon: <BookOpen size={24} weight="duotone" color="#7c3aed" />, label: 'AI Notes', desc: 'Structured study notes' },
            { icon: <GraduationCap size={24} weight="duotone" color="#7c3aed" />, label: 'Mock Exams', desc: 'Real exam practice' },
          ].map((feat, i) => (
            <RevealDiv key={i} delay={i * 0.06}>
              <div style={{
                background: 'var(--background)', border: '1.5px solid rgba(167,139,250,0.2)',
                borderRadius: 20, padding: '24px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.25s ease', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.1)'; e.currentTarget.style.background = 'rgba(196,181,253,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'var(--background)'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(196,181,253,0.15)', border: '1.5px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {feat.icon}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{feat.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--tt-gray-light-a-600)', fontFamily: 'var(--font-body)', marginTop: 2 }}>{feat.desc}</div>
                </div>
              </div>
            </RevealDiv>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <StyledFAQ items={aboutFaqs} />

      {/* ── FALLING ELEMENTS PHYSICS PLAYGROUND ── */}
      <section style={{ padding: '80px 24px 0', background: 'var(--background)' }}>
        <RevealDiv style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)', borderRadius: 9999, padding: '8px 20px', fontSize: 13, fontWeight: 800, color: '#7c3aed', marginBottom: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Lightning size={14} weight="fill" color="#7c3aed" /> Powered by AI
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: 12 }}>
            Everything Luter can do for you
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--tt-gray-light-a-600)' }}>
            Drag these around — it's more fun than studying the old way 😄
          </p>
        </RevealDiv>
        <div style={{ height: 340, maxWidth: 1000, margin: '0 auto', borderRadius: 24, border: '1.5px solid var(--border)', overflow: 'hidden', background: 'var(--background)' }}>
          <FallingElements
            gravity={0.6}
            restitution={0.75}
            loop={true}
            elements={[
              { text: '⚡ Flashcards',  color: '#7c3aed', bgColor: 'rgba(196,181,253,0.15)', borderColor: 'rgba(167,139,250,0.35)' },
              { text: '🧠 AI Notes',    color: '#7c3aed', bgColor: 'rgba(196,181,253,0.15)', borderColor: 'rgba(167,139,250,0.35)' },
              { text: '📝 Mock Exams',  color: '#7c3aed', bgColor: 'rgba(196,181,253,0.15)', borderColor: 'rgba(167,139,250,0.35)' },
              { text: '🎯 Quizzes',     color: '#7c3aed', bgColor: 'rgba(196,181,253,0.15)', borderColor: 'rgba(167,139,250,0.35)' },
              { text: '📊 Analytics',   color: '#7c3aed', bgColor: 'rgba(196,181,253,0.15)', borderColor: 'rgba(167,139,250,0.35)' },
              { text: '🤖 AI Chat',     color: '#7c3aed', bgColor: 'rgba(196,181,253,0.15)', borderColor: 'rgba(167,139,250,0.35)' },
              { text: '📚 Summaries',   color: '#7c3aed', bgColor: 'rgba(196,181,253,0.15)', borderColor: 'rgba(167,139,250,0.35)' },
              { text: '🎓 Study Path',  color: '#7c3aed', bgColor: 'rgba(196,181,253,0.15)', borderColor: 'rgba(167,139,250,0.35)' },
            ]}
          />
        </div>
      </section>

      {/* ── SHARED FOOTER (includes CTA section) ── */}
      <SharedFooter />
    </div>
  );
}
