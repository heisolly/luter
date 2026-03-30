import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, FileText, BrainCircuit, Zap, CheckCircle2, 
  ArrowRight, BookOpen, MessageSquare, GraduationCap, Layers,
  Timer, Sparkles, FileSpreadsheet, Youtube, Mic
} from 'lucide-react';
import { PageBackground, HighlightedText, RevealDiv, SharedNavbar } from './PageShared';

const STEPS = [
  {
    num: '01',
    icon: <UploadCloud size={24} />,
    color: 'var(--primary)',
    bg: 'rgba(151,24,251,0.08)',
    title: 'Drop Any Material',
    desc: 'Upload PDFs, Word docs, PowerPoints, YouTube links, or record a live lecture. Our system accepts everything.',
    bullets: ['Instant parsing', 'No format limits', 'Secure storage'],
    visual: 'upload'
  },
  {
    num: '02',
    icon: <BrainCircuit size={24} />,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.08)',
    title: 'AI Processing Engine',
    desc: 'Luter reads, analyzes, and extracts key concepts, formulas, and arguments from your material in seconds flat.',
    bullets: ['Deep contextual AI', 'Noise filtering', 'Concept mapping'],
    visual: 'process'
  },
  {
    num: '03',
    icon: <Zap size={24} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    title: 'Your Study System',
    desc: 'Automatically generates structured notes, spaced-repetition flashcards, practice quizzes, and an AI tutor.',
    bullets: ['Ready in seconds', 'Interactive formats', '24/7 AI Tutor'],
    visual: 'output'
  }
];

function UploadVisual() {
  const [activeType, setActiveType] = useState(0);
  const types = ['PDF Document', 'Lecture Video', 'Audio Note', 'Slide Deck'];
  
  useEffect(() => {
    const t = setInterval(() => {
      setActiveType(prev => (prev + 1) % types.length);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: '#fff', borderRadius: 32, padding: 32, border: '1.5px solid #f1f5f9', boxShadow: '0 24px 64px -12px rgba(151,24,251,0.06)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, background: 'rgba(151,24,251,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />
      
      <div style={{ border: '2px dashed rgba(151,24,251,0.2)', borderRadius: 24, padding: '48px 24px', textAlign: 'center', background: '#fafbfc', transition: 'all 0.3s' }}>
        <motion.div
           animate={{ y: [0, -8, 0] }}
           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <UploadCloud size={48} color="var(--primary)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
        </motion.div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Drag & drop your files</div>
        <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          Currently processing: 
          <AnimatePresence mode="wait">
            <motion.span
              key={activeType}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              style={{ color: 'var(--primary)', fontWeight: 700 }}
            >
              {types[activeType]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ProcessVisual() {
  const [progress, setProgress] = useState(15);
  
  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => p >= 100 ? 15 : p + Math.random() * 15);
    }, 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: '#fff', borderRadius: 32, padding: 32, border: '1.5px solid #f1f5f9', boxShadow: '0 24px 64px -12px rgba(14,165,233,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={20} color="#0ea5e9" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Cognitive Engine</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0ea5e9' }}>Extracting insights...</div>
          </div>
        </div>
        <div style={{ padding: '6px 12px', background: '#f8fafc', borderRadius: 99, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
          {Math.min(99, Math.round(progress))}%
        </div>
      </div>
      
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 24 }}>
        <motion.div 
          animate={{ width: `${progress}%` }} 
          transition={{ ease: "linear", duration: 0.4 }}
          style={{ height: '100%', background: '#0ea5e9', borderRadius: 99 }} 
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { icon: <FileText size={14}/>, label: 'Reading Document' },
          { icon: <Sparkles size={14}/>, label: 'Identifying Core Concepts' },
          { icon: <Layers size={14}/>, label: 'Structuring Knowledge' }
        ].map((item, i) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: progress > (i + 1) * 30 ? '#f0f9ff' : '#f8fafc', borderRadius: 16, transition: 'all 0.3s' }}>
            <div style={{ color: progress > (i + 1) * 30 ? '#0ea5e9' : '#94a3b8' }}>{item.icon}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: progress > (i + 1) * 30 ? '#0369a1' : '#64748b' }}>{item.label}</span>
            {progress > (i + 1) * 30 && <CheckCircle2 size={16} color="#0ea5e9" style={{ marginLeft: 'auto' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function OutputVisual() {
  const outputs = [
    { icon: <BookOpen size={18} />, label: 'Structured Notes', delay: 0 },
    { icon: <Layers size={18} />, label: 'Flashcard Deck', delay: 0.1 },
    { icon: <GraduationCap size={18} />, label: 'Practice Exam', delay: 0.2 },
    { icon: <MessageSquare size={18} />, label: 'AI Tutor Instance', delay: 0.3 },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 32, padding: 32, border: '1.5px solid #f1f5f9', boxShadow: '0 24px 64px -12px rgba(245,158,11,0.06)' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(245,158,11,0.1)', borderRadius: 99, color: '#d97706', fontSize: 13, fontWeight: 800, marginBottom: 24 }}>
        <CheckCircle2 size={16} /> Workspace Generated
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {outputs.map((o, i) => (
          <motion.div 
            key={o.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: o.delay, duration: 0.4 }}
            viewport={{ once: true }}
            style={{ padding: 20, background: '#f8fafc', borderRadius: 20, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              {o.icon}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{o.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafbfc', color: '#0f172a', position: 'relative', overflow: 'hidden' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 140, paddingBottom: 120 }}>

        {/* Hero Section */}
        <div className="container-custom" style={{ textAlign: 'center', paddingBottom: 120 }}>
          <RevealDiv>
             <motion.div 
                whileHover={{ scale: 1.05 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 24, background: 'white', padding: '8px 20px', borderRadius: 99, border: '1.5px solid rgba(151,24,251,0.15)', boxShadow: '0 8px 16px rgba(151,24,251,0.06)' }}
             >
                <Timer size={14} /> Under 30 Seconds
             </motion.div>
          </RevealDiv>
          
          <RevealDiv delay={0.1}>
            <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 900, fontFamily: 'var(--font-besley)', color: '#0f172a', marginBottom: 24, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              How Luter Works.
            </h1>
          </RevealDiv>
          
          <RevealDiv delay={0.2}>
            <p style={{ fontSize: 20, color: '#64748b', maxWidth: 640, margin: '0 auto', fontWeight: 500, lineHeight: 1.6 }}>
              The smartest, fastest pipeline from raw material to total mastery. We transform your unstructured content into a fully interactive digital workstation.
            </p>
          </RevealDiv>
        </div>

        {/* Step-by-Step Flow */}
        <div className="container-custom">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            {STEPS.map((step, i) => {
              const isEven = i % 2 === 0;
              return (
                <RevealDiv key={step.num} delay={0.1}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                    gap: 48, 
                    alignItems: 'center',
                    background: '#fff',
                    borderRadius: 40,
                    padding: '48px',
                    border: '1.5px solid #f1f5f9',
                    boxShadow: '0 20px 60px -12px rgba(0,0,0,0.04)'
                  }}>
                    {/* Text Side */}
                    <div style={{ order: isEven ? 1 : 2 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', background: step.color, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {step.num}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: step.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Step {step.num}</span>
                      </div>
                      
                      <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 900, color: '#0f172a', marginBottom: 16, fontFamily: 'var(--font-besley)', lineHeight: 1.15 }}>
                        {step.title}
                      </h2>
                      <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.6, marginBottom: 32, fontWeight: 500 }}>
                        {step.desc}
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        {step.bullets.map(b => (
                          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 700, color: '#334155' }}>
                            <div style={{ width: 24, height: 24, borderRadius: 8, background: step.bg, color: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CheckCircle2 size={14} />
                            </div>
                            {b}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Visual Side */}
                    <div style={{ order: isEven ? 2 : 1 }}>
                      {step.visual === 'upload' && <UploadVisual />}
                      {step.visual === 'process' && <ProcessVisual />}
                      {step.visual === 'output' && <OutputVisual />}
                    </div>
                  </div>
                </RevealDiv>
              );
            })}
          </div>
        </div>

        {/* Features / Formats Grid */}
        <div className="container-custom" style={{ marginTop: 120, marginBottom: 120 }}>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: '#0ea5e9', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16, background: 'rgba(14,165,233,0.1)', padding: '6px 16px', borderRadius: 99 }}>
                Universal Compatibility
              </div>
              <h3 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, fontFamily: 'var(--font-besley)', color: '#0f172a' }}>
                Any Format. Any Subject.
              </h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
              {[
                { icon: <FileText size={28} />, label: 'PDFs & Docs', desc: 'Books, papers, typed notes.' },
                { icon: <FileSpreadsheet size={28} />, label: 'Presentations', desc: 'Slide decks (PPTX).' },
                { icon: <Youtube size={28} />, label: 'YouTube Links', desc: 'Paste a video URL to learn.' },
                { icon: <Mic size={28} />, label: 'Audio & Live', desc: 'Record a lecture in real-time.' },
              ].map((ft, i) => (
                <motion.div 
                  key={ft.label} 
                  whileHover={{ y: -8, boxShadow: '0 20px 40px -12px rgba(151,24,251,0.15)', borderColor: 'rgba(151,24,251,0.3)' }}
                  style={{ background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: 28, padding: 32, textAlign: 'center', transition: 'all 0.3s', cursor: 'pointer' }}
                >
                  <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: 20, background: '#f8fafc', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ft.icon}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{ft.label}</div>
                  <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, lineHeight: 1.5 }}>{ft.desc}</div>
                </motion.div>
              ))}
            </div>
          </RevealDiv>
        </div>

        {/* CTA Banner */}
        <RevealDiv>
          <div className="container-custom">
            <div style={{ position: 'relative', overflow: 'hidden', background: '#0f172a', borderRadius: 40, padding: '80px 40px', textAlign: 'center', boxShadow: '0 32px 64px -12px rgba(15,23,42,0.4)' }}>
              {/* Background Glow */}
              <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'rgba(151,24,251,0.3)', filter: 'blur(80px)', pointerEvents: 'none' }} />
              
              <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, fontFamily: 'var(--font-besley)', color: '#fff', marginBottom: 24, lineHeight: 1.1 }}>
                  Stop Reading. Start Mastering.
                </h2>
                <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 40, fontWeight: 500, lineHeight: 1.6 }}>
                  Upload your first syllabus or lecture note today and experience the workstation trusted by top-tier students.
                </p>
                
                <a href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '16px 40px', fontSize: 16, fontWeight: 800, background: 'var(--primary)', color: '#fff', borderRadius: 16, transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(151,24,251,0.3)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                  Join For Free <ArrowRight size={18} strokeWidth={2.5} />
                </a>
              </div>
            </div>
          </div>
        </RevealDiv>

      </div>
    </div>
  );
}

