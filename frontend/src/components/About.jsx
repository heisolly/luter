import React from 'react';
import { ArrowRight, Users, Zap, Brain, Globe, Shield, Heart, Sparkles, TrendingUp } from 'lucide-react';
import { PageBackground, HighlightedText, RevealDiv, SharedNavbar } from './PageShared';

const values = [
  { icon: <Brain size={28} />, color: '#7c3aed', bg: '#f5f3ff', title: 'Science-First', desc: 'Every feature is grounded in cognitive science — active recall, spaced repetition, and retrieval practice baked in by design.' },
  { icon: <Heart size={28} />, color: '#dc2626', bg: '#fef2f2', title: 'Student-Centered', desc: 'We build for students first. Real pain points, real curricula, real deadlines. Nothing is added unless it genuinely helps you learn.' },
  { icon: <Globe size={28} />, color: '#0284c7', bg: '#eff6ff', title: 'Global Access', desc: 'From Lagos to London to Singapore. Luter understands diverse curricula and university formats worldwide.' },
  { icon: <Shield size={28} />, color: '#059669', bg: '#ecfdf5', title: 'Privacy by Default', desc: 'Your documents are yours. Encrypted in transit and at rest. We never read, sell, or train models on your content.' },
];

const stats = [
  { num: '5M+', label: 'Active Students', icon: <Users size={20} /> },
  { num: '150+', label: 'Universities', icon: <Globe size={20} /> },
  { num: '10×', label: 'Faster Learning', icon: <TrendingUp size={20} /> },
  { num: '99%', label: 'Exam Relevance', icon: <Zap size={20} /> },
];

const team = [
  { initials: 'AO', name: 'Amara Osei', role: 'Co-Founder & CEO', color: '#7c3aed', bg: '#f5f3ff' },
  { initials: 'DJ', name: 'Daniel James', role: 'Co-Founder & CTO', color: '#0284c7', bg: '#eff6ff' },
  { initials: 'NM', name: 'Nadia Mensah', role: 'Head of Product', color: '#059669', bg: '#ecfdf5' },
  { initials: 'KP', name: 'Kai Petrov', role: 'Lead AI Engineer', color: '#d97706', bg: '#fffbeb' },
];

export default function About() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#111', position: 'relative' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 120 }}>

        {/* Hero */}
        <div className="container-custom" style={{ textAlign: 'center', paddingBottom: 100, maxWidth: 780 }}>
          <RevealDiv>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(151,24,251,0.07)', border: '1px solid rgba(151,24,251,0.15)', borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 24 }}>
              <Sparkles size={14} /> Our Story
            </div>
          </RevealDiv>
          <RevealDiv delay={0.1}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 24, lineHeight: 1.1 }}>
              Built for{' '}
              <HighlightedText texts={['students']} />
              {' '}who deserve better tools
            </h1>
          </RevealDiv>
          <RevealDiv delay={0.2}>
            <p style={{ fontSize: 20, color: '#555', lineHeight: 1.75, fontWeight: 500 }}>
              We started Luter because great learning tools shouldn't be reserved for those who can afford private tutors.
              AI can level that playing field.
            </p>
          </RevealDiv>
        </div>

        {/* Stats Bar */}
        <RevealDiv>
          <div style={{ background: 'white', borderTop: '1px solid #f0eaff', borderBottom: '1px solid #f0eaff', padding: '48px 0', marginBottom: 100 }}>
            <div className="container-full">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center' }}>
                {stats.map(s => (
                  <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ color: 'var(--primary)', display: 'flex' }}>{s.icon}</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-besley)', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealDiv>

        {/* Story */}
        <div className="container-custom" style={{ maxWidth: 860, marginBottom: 100 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, flexWrap: 'wrap' }}>
            <RevealDiv>
              <div>
                <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 20, lineHeight: 1.2 }}>
                  The problem we saw
                </h2>
                <p style={{ fontSize: 16, color: '#666', lineHeight: 1.8, fontWeight: 500 }}>
                  Students everywhere were drowning in material. 60-slide decks, 3-hour lectures, dense textbooks — with no intelligent tool to help them make sense of it all.
                </p>
                <p style={{ fontSize: 16, color: '#666', lineHeight: 1.8, fontWeight: 500, marginTop: 16 }}>
                  Generic chatbots weren't the answer. Students needed something purpose-built, something that understood <em>their</em> material, their exam format, and their schedule.
                </p>
              </div>
            </RevealDiv>
            <RevealDiv delay={0.15}>
              <div>
                <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 20, lineHeight: 1.2 }}>
                  Our answer
                </h2>
                <p style={{ fontSize: 16, color: '#666', lineHeight: 1.8, fontWeight: 500 }}>
                  Luter is the AI study companion we wish we had in university. It reads your material, understands your curriculum, and builds an entire study system in seconds.
                </p>
                <p style={{ fontSize: 16, color: '#666', lineHeight: 1.8, fontWeight: 500, marginTop: 16 }}>
                  Built on peer-reviewed cognitive science — active recall, spaced repetition, interleaved practice — not just summarization.
                </p>
              </div>
            </RevealDiv>
          </div>
        </div>

        {/* Values */}
        <div className="container-full" style={{ marginBottom: 100 }}>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 12 }}>What we stand for</h2>
              <p style={{ fontSize: 16, color: '#666', fontWeight: 500 }}>The principles that guide every decision we make.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
              {values.map((v, i) => (
                <RevealDiv key={v.title} delay={i * 0.08}>
                  <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1px solid #f0eaff', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', transition: 'all 0.3s', height: '100%' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.color, marginBottom: 20 }}>
                      {v.icon}
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 12, fontFamily: 'var(--font-besley)' }}>{v.title}</h3>
                    <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{v.desc}</p>
                  </div>
                </RevealDiv>
              ))}
            </div>
          </RevealDiv>
        </div>

        {/* NEW SECTION: A Letter to Students */}
        <div className="container-custom" style={{ maxWidth: 860, marginBottom: 100 }}>
          <RevealDiv>
            <div style={{ background: '#fff', borderRadius: 24, padding: '48px', border: '1px solid #f0eaff', boxShadow: '0 12px 32px rgba(151,24,251,0.05)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -20, left: 40, fontSize: 64, color: 'var(--primary)', opacity: 0.2, fontFamily: 'var(--font-besley)', lineHeight: 1 }}>"</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-besley)', marginBottom: 20, color: '#111' }}>A note from the founders</h3>
              <p style={{ fontSize: 16, color: '#555', lineHeight: 1.8, marginBottom: 20 }}>
                When we were in university, we spent more time organizing our notes than actually studying them. We'd spend hours copying textbook chapters, re-watching 2-hour lectures to catch one missed concept, and desperately trying to create flashcards the night before an exam.
              </p>
              <p style={{ fontSize: 16, color: '#555', lineHeight: 1.8, marginBottom: 20 }}>
                We realized that the hard part of studying shouldn't be the preparation. The hard part should be the <em>learning</em>.
              </p>
              <p style={{ fontSize: 16, color: '#555', lineHeight: 1.8, marginBottom: 32 }}>
                Luter exists to automate the busywork. We want to give you back your time so you can focus on understanding the material, passing your exams, and actually enjoying your university experience.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', gap: -8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f5f3ff', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 800, fontSize: 12 }}>AO</div>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontWeight: 800, fontSize: 12, marginLeft: -12 }}>DJ</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Amara & Daniel</div>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>Founders of Luter</div>
                </div>
              </div>
            </div>
          </RevealDiv>
        </div>

        {/* Team */}
        <div className="container-custom" style={{ marginBottom: 100, maxWidth: 860 }}>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 12 }}>Meet the team</h2>
              <p style={{ fontSize: 16, color: '#666', fontWeight: 500 }}>Ex-students, ex-researchers, full-time believers in better learning.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
              {team.map((member, i) => (
                <RevealDiv key={member.name} delay={i * 0.1}>
                  <div style={{ background: 'white', borderRadius: 20, padding: '28px 20px', textAlign: 'center', border: '1px solid #f0eaff', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.3s' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: member.bg, color: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, margin: '0 auto 16px', border: `2px solid ${member.color}22` }}>
                      {member.initials}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 4 }}>{member.name}</div>
                    <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{member.role}</div>
                  </div>
                </RevealDiv>
              ))}
            </div>
          </RevealDiv>
        </div>

        {/* CTA */}
        <RevealDiv>
          <div className="container-custom">
            <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #7180fe 100%)', borderRadius: 28, padding: '64px', textAlign: 'center', boxShadow: '0 24px 64px rgba(151,24,251,0.25)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'white', fontFamily: 'var(--font-besley)', marginBottom: 16, lineHeight: 1.2 }}>
                  Join 5 million students studying smarter
                </h2>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 36, fontWeight: 500, maxWidth: 500, margin: '0 auto 36px' }}>
                  Start free. No credit card. Cancel anytime.
                </p>
                <a href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: 'var(--primary)', padding: '16px 40px', borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: 'all 0.2s' }}>
                  Get Started Free <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </RevealDiv>

      </div>
    </div>
  );
}
