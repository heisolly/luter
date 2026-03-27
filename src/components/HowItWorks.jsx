import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, Play, BrainCircuit, Zap, CheckCircle2, RefreshCw, ArrowRight, BookOpen, MessageSquare, GraduationCap, Layers } from 'lucide-react';
import { PageBackground, HighlightedText, RevealDiv, SharedNavbar } from './PageShared';

const STEPS = [
  {
    num: '01',
    icon: <UploadCloud size={36} />,
    color: '#7c3aed',
    bg: '#f3e8ff',
    title: 'Drop It In',
    subtitle: 'Any format. Any subject. Instantly.',
    desc: 'Just upload your material — PDF, DOCX, PPTX, a YouTube link, or hit record for a live lecture. Luter accepts everything you throw at it.',
    bullets: ['PDFs, Word Docs, Slides', 'YouTube & Audio files', 'Live lecture recording'],
    visual: 'upload'
  },
  {
    num: '02',
    icon: <BrainCircuit size={36} />,
    color: '#0284c7',
    bg: '#eff6ff',
    title: 'AI Does the Heavy Lifting',
    subtitle: 'Like a tutor reading your notes.',
    desc: 'Our cognitive engine parses your content and extracts key ideas, arguments, definitions, and structure — in seconds, not hours.',
    bullets: ['Deep contextual understanding', 'Key topic extraction', 'Noise and fluff filtered out'],
    visual: 'process'
  },
  {
    num: '03',
    icon: <Zap size={36} />,
    color: 'var(--primary)',
    bg: '#f5f3ff',
    title: 'Your Study System Is Ready',
    subtitle: 'Notes, quizzes, flashcards — all done.',
    desc: 'In one click, get a complete study pack: structured notes, scannable summary, interactive flashcards, practice quizzes, and a 24/7 AI tutor.',
    bullets: ['AI Notes + Summary', 'Spaced-repetition flashcards', '24/7 AI Tutor on your content'],
    visual: 'output'
  }
];

function UploadVisual() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { setDone(true); clearInterval(t); return 100; }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(t);
  }, []);
  setTimeout(() => { if (done) { setProgress(0); setDone(false); } }, 2000);

  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0eaff', padding: 28, boxShadow: '0 12px 32px rgba(151,24,251,0.06)' }}>
      <div style={{ border: '2px dashed rgba(124,58,237,0.3)', borderRadius: 16, padding: '36px 24px', textAlign: 'center', background: '#faf5ff', position: 'relative', overflow: 'hidden' }}>
        <UploadCloud size={44} color="rgba(124,58,237,0.4)" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 4 }}>Drag & drop your material</div>
        <div style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>PDF · DOCX · PPTX · YouTube · Audio</div>
        <div className="float-element" style={{ position: 'absolute', top: 16, left: 16, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', fontSize: 10, fontWeight: 800, color: '#059669', boxShadow: '0 4px 8px rgba(0,0,0,0.06)' }}>📄 lecture.pdf</div>
        <div className="float-element" style={{ position: 'absolute', bottom: 16, right: 16, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', fontSize: 10, fontWeight: 800, color: '#dc2626', boxShadow: '0 4px 8px rgba(0,0,0,0.06)', animationDelay: '1.2s' }}>▶ Video</div>
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 6 }}>
          <span>lecture_notes.pdf</span><span style={{ color: done ? '#059669' : '#7c3aed' }}>{done ? '✓ Done' : `${progress}%`}</span>
        </div>
        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 99, transition: 'width 0.1s linear' }} />
        </div>
      </div>
    </div>
  );
}

function ProcessVisual() {
  const terms = ['Photosynthesis', 'ATP Synthesis', 'Cell Membrane', 'Diffusion', 'Enzyme'];
  const [active, setActive] = useState(0);
  useEffect(() => { const t = setInterval(() => setActive(i => (i + 1) % terms.length), 900); return () => clearInterval(t); }, []);
  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #bae6fd', padding: 28, boxShadow: '0 12px 32px rgba(2,132,199,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #f3f4f6' }}>
        <BrainCircuit size={18} color="#0284c7" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Analyzing document...</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#0284c7' }}>Live</span>
      </div>
      <div style={{ position: 'relative', padding: '10px 0' }}>
        {[80, 100, 60, 90, 75, 50, 85].map((w, i) => (
          <div key={i} style={{ height: 8, background: i === 2 ? '#dbeafe' : '#f3f4f6', borderRadius: 4, marginBottom: 8, width: `${w}%`, transition: 'background 0.3s' }} />
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: '#0284c7', boxShadow: '0 0 12px rgba(2,132,199,0.6)', animation: 'scan 2s ease-in-out infinite', top: '40%' }} />
      </div>
      <div style={{ marginTop: 16, padding: '10px 14px', background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7' }}>+ Key concept found:</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#111', transition: 'opacity 0.3s' }}>{terms[active]}</span>
      </div>
      <style>{`@keyframes scan { 0%{top:5%} 100%{top:95%} }`}</style>
    </div>
  );
}

function OutputVisual() {
  const outputs = [
    { icon: <BookOpen size={16} />, label: 'AI Notes', color: '#7c3aed', bg: '#f5f3ff', status: '✓ Ready' },
    { icon: <FileText size={16} />, label: 'Summary', color: '#059669', bg: '#ecfdf5', status: '✓ Ready' },
    { icon: <Layers size={16} />, label: 'Flashcards (24)', color: '#dc2626', bg: '#fef2f2', status: '✓ Ready' },
    { icon: <GraduationCap size={16} />, label: 'AI Quiz', color: '#d97706', bg: '#fffbeb', status: '✓ Ready' },
    { icon: <MessageSquare size={16} />, label: 'AI Tutor', color: '#0284c7', bg: '#eff6ff', status: '✓ Online' },
  ];
  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f0eaff', padding: 20, boxShadow: '0 12px 32px rgba(151,24,251,0.06)' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#111', marginBottom: 14, padding: '0 4px' }}>📦 Your Study Pack is Ready</div>
      {outputs.map((o, i) => (
        <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: o.bg, marginBottom: 8, border: `1px solid ${o.color}22` }}>
          <div style={{ color: o.color }}>{o.icon}</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#333', flex: 1 }}>{o.label}</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: o.color }}>{o.status}</span>
        </div>
      ))}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#111', position: 'relative' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 120 }}>

        {/* Header */}
        <div className="container-custom" style={{ textAlign: 'center', paddingBottom: 100 }}>
          <RevealDiv>
            <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20, background: 'rgba(151,24,251,0.07)', padding: '6px 16px', borderRadius: 99, border: '1px solid rgba(151,24,251,0.12)' }}>
              Dead Simple Process
            </div>
          </RevealDiv>
          <RevealDiv delay={0.1}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 20, lineHeight: 1.1 }}>
              From Raw Material to{' '}
              <HighlightedText texts={['Mastery']} />
              {' '}in Seconds
            </h1>
          </RevealDiv>
          <RevealDiv delay={0.2}>
            <p style={{ fontSize: 18, color: '#555', maxWidth: 560, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
              Three effortless steps stand between you and a complete study system.
            </p>
          </RevealDiv>
        </div>

        {/* Steps */}
        <div className="container-full">
          {STEPS.map((step, i) => {
            const isReversed = i % 2 !== 0;
            return (
              <RevealDiv key={step.num} delay={0.1}>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'center',
                  flexDirection: isReversed ? 'row-reverse' : 'row',
                  marginBottom: 120, maxWidth: 1100, margin: '0 auto 120px'
                }}>
                  {/* Text Side */}
                  <div style={{ flex: '1 1 420px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -50, left: -20, fontSize: 200, fontWeight: 900, color: `${step.color}08`, lineHeight: 1, pointerEvents: 'none', userSelect: 'none', fontFamily: 'var(--font-besley)' }}>{step.num}</div>
                    
                    <div style={{ width: 68, height: 68, borderRadius: 20, background: step.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.color, marginBottom: 24, border: `1px solid ${step.color}22`, boxShadow: `0 8px 24px ${step.color}18` }}>
                      {step.icon}
                    </div>
                    
                    <div style={{ fontSize: 12, fontWeight: 800, color: step.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                      Step {step.num}
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 800, color: '#111', marginBottom: 8, fontFamily: 'var(--font-besley)', lineHeight: 1.15 }}>{step.title}</h2>
                    <p style={{ fontSize: 16, fontWeight: 600, color: step.color, marginBottom: 20, fontStyle: 'italic' }}>{step.subtitle}</p>
                    <p style={{ fontSize: 16, color: '#666', lineHeight: 1.75, marginBottom: 32, fontWeight: 500 }}>{step.desc}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {step.bullets.map(b => (
                        <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: '#333' }}>
                          <CheckCircle2 size={18} color={step.color} /> {b}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual Side */}
                  <div style={{ flex: '1 1 380px' }}>
                    {step.visual === 'upload' && <UploadVisual />}
                    {step.visual === 'process' && <ProcessVisual />}
                    {step.visual === 'output' && <OutputVisual />}
                  </div>
                </div>
              </RevealDiv>
            );
          })}
        </div>

        {/* NEW SECTION: File Type Grid */}
        <div className="container-custom" style={{ marginTop: 40, marginBottom: 100 }}>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111' }}>Upload anything. Literally.</h3>
              <p style={{ fontSize: 16, color: '#666', marginTop: 12 }}>If your professor gave it to you, Luter can learn from it.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
              {[
                { icon: '📄', label: 'PDF Documents', desc: 'Books & Papers' },
                { icon: '📝', label: 'Word / Text', desc: 'Typed notes' },
                { icon: '📊', label: 'PowerPoint', desc: 'Lecture slides' },
                { icon: '▶️', label: 'YouTube Links', desc: 'Online lectures' },
                { icon: '🎙️', label: 'Audio / Video', desc: 'Recorded classes' },
              ].map((ft, i) => (
                <div key={ft.label} style={{ background: 'white', border: '1px solid #f0eaff', borderRadius: 20, padding: 24, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{ft.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>{ft.label}</div>
                  <div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>{ft.desc}</div>
                </div>
              ))}
            </div>
          </RevealDiv>
        </div>

        {/* Connector CTA */}
        <RevealDiv>
          <div className="container-custom">
            <div style={{ background: 'linear-gradient(135deg, #f9f5ff, #ede9fe)', borderRadius: 28, padding: '56px', textAlign: 'center', border: '1px solid rgba(151,24,251,0.12)', boxShadow: '0 24px 48px rgba(151,24,251,0.06)' }}>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 16 }}>
                Ready to try it?
              </h2>
              <p style={{ fontSize: 17, color: '#666', marginBottom: 32, fontWeight: 500 }}>Upload your first file in under 30 seconds. Free forever.</p>
              <a href="/signup" className="btn-primary" style={{ textDecoration: 'none', padding: '16px 40px', fontSize: 16 }}>
                Start For Free <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </RevealDiv>

      </div>
    </div>
  );
}
