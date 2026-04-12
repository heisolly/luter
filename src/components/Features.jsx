import React, { useState } from 'react';
import { BookOpen, FileText, Layers, GraduationCap, MessageSquare, ArrowRight, Sparkles, BarChart2, Clock } from 'lucide-react';
import { PageBackground, HighlightedText, RevealDiv, SharedNavbar } from './PageShared';

const features = [
  {
    icon: <BookOpen size={28} />, color: '#7c3aed', bg: '#f3e8ff',
    label: 'AI Notes',
    title: 'Notes That Write Themselves',
    desc: 'Upload any material — slides, videos, lectures — and get beautifully structured notes in seconds. Less typing, more understanding.',
    stats: ['98% accuracy', '< 10 sec', 'Any format'],
    mockup: (
      <div style={{ background: '#fafaf9', borderRadius: 12, padding: '20px', border: '1px solid #ede9fe' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['Original', 'AI Notes', 'Summary'].map((t, i) => (
            <div key={t} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: i === 1 ? '#7c3aed' : 'white', color: i === 1 ? 'white' : '#999', border: '1px solid #e5e7eb' }}>{t}</div>
          ))}
        </div>
        {[['Introduction to Photosynthesis', [90, 75, 100, 55]], ['Key Chemical Equations', [80, 100, 65]]].map(([head, lines]) => (
          <div key={head} style={{ marginBottom: 16 }}>
            <div style={{ height: 8, background: '#7c3aed', borderRadius: 4, width: '50%', marginBottom: 8, opacity: 0.7 }} />
            {lines.map((w, i) => <div key={i} style={{ height: 6, background: i === 0 ? '#ede9fe' : '#f3f4f6', borderRadius: 4, marginBottom: 5, width: `${w}%` }} />)}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6 }}>
          {['📌 Key term', '🔗 Linked', '⚡ Highlight'].map(t => <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'white', border: '1px solid #e5e7eb', color: '#555' }}>{t}</span>)}
        </div>
      </div>
    )
  },
  {
    icon: <FileText size={28} />, color: '#059669', bg: '#ecfdf5',
    label: 'AI Summary',
    title: 'Review Faster, Anytime',
    desc: 'Dense 60-page chapters condensed into crisp summaries you can read in 3 minutes. Built for time-starved students.',
    stats: ['60-page → 3 min', 'Bullet + prose', 'Shareable'],
    mockup: (
      <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '20px', border: '1px solid #a7f3d0' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📋</span> Key Takeaways
        </div>
        {['The cell is the fundamental unit of life', 'Mitochondria produce ATP via respiration', 'DNA is stored in the cell nucleus'].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <span style={{ fontSize: 8, color: 'white', fontWeight: 800 }}>✓</span>
            </div>
            <span style={{ fontSize: 12, color: '#374151', fontWeight: 500, lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
        <div style={{ marginTop: 14, height: 1, background: '#a7f3d0' }} />
        <div style={{ marginTop: 12, fontSize: 10, color: '#059669', fontWeight: 700 }}>⚡ Quick Overview (3 sections)</div>
      </div>
    )
  },
  {
    icon: <Layers size={28} />, color: '#dc2626', bg: '#fef2f2',
    label: 'AI Flashcards',
    title: 'Make It Impossible to Forget',
    desc: 'Active recall is the #1 learning method. Luter auto-generates Anki-style flashcards from any material using proven spaced repetition.',
    stats: ['Spaced repetition', 'Auto-generated', 'Export to Anki'],
    mockup: (
      <div style={{ position: 'relative', height: 180 }}>
        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, height: 140, background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: 4, left: 4, right: 4, height: 148, background: 'white', borderRadius: 14, border: '1px solid #fecaca', opacity: 0.7 }} />
        <div style={{ position: 'absolute', inset: 0, height: 160, background: 'white', borderRadius: 16, border: '1px solid #fecaca', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: '0 8px 24px rgba(220,38,38,0.08)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', letterSpacing: '0.1em', marginBottom: 10 }}>QUESTION</div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0, lineHeight: 1.5 }}>What is the powerhouse of the cell?</p>
          <div style={{ marginTop: 12, fontSize: 11, color: '#aaa', fontWeight: 600 }}>Tap to reveal →</div>
        </div>
      </div>
    )
  },
  {
    icon: <GraduationCap size={28} />, color: '#7c3aed', bg: '#f3e8ff',
    label: 'AI Quizzes',
    title: 'Test Yourself Before Exams Do',
    desc: 'Auto-generated MCQs and short answers that mirror your actual exam format. Spot weaknesses before they cost you marks.',
    stats: ['MCQ + Short answer', 'Exam-style format', 'Score analytics'],
    mockup: (
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #ede9fe', overflow: 'hidden' }}>
        <div style={{ background: '#f5f3ff', padding: '10px 14px', fontSize: 10, fontWeight: 800, color: '#7c3aed' }}>QUESTION 3 / 10</div>
        <div style={{ padding: '14px', fontSize: 12, fontWeight: 600, color: '#111', borderBottom: '1px solid #f3f4f6', lineHeight: 1.5 }}>Which organelle is responsible for producing ATP?</div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[['A', 'Nucleus', false], ['B', 'Mitochondria', true], ['C', 'Ribosome', false]].map(([l, t, c]) => (
            <div key={l} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 10px', borderRadius: 8, background: c ? '#f5f3ff' : '#f9fafb', border: `1px solid ${c ? '#c4b5f7' : '#f3f4f6'}` }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: c ? '#7c3aed' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: c ? 'white' : '#999', flexShrink: 0 }}>{l}</div>
              <span style={{ fontSize: 11, fontWeight: c ? 700 : 500, color: c ? '#7c3aed' : '#555' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    icon: <MessageSquare size={28} />, color: '#0284c7', bg: '#eff6ff',
    label: 'AI Tutor',
    title: 'Ask Questions. Get Clarity 24/7',
    desc: 'Your personal tutor, always online. Chat about your specific material, get explanations tailored to you, and never study confused again.',
    stats: ['24/7 availability', 'Source-grounded', 'Free follow-ups'],
    mockup: (
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #bae6fd', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ alignSelf: 'flex-end', background: '#f3f4f6', padding: '10px 14px', borderRadius: '12px 12px 0 12px', fontSize: 11, fontWeight: 600, color: '#555', maxWidth: '80%' }}>
          Can you explain osmosis simply?
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bae6fd', padding: '12px 14px', borderRadius: '12px 12px 12px 0', fontSize: 11, color: '#333', maxWidth: '100%' }}>
          <div style={{ fontWeight: 800, color: '#0284c7', fontSize: 10, marginBottom: 6 }}>⚡ LUTER AI</div>
          <p style={{ margin: 0, lineHeight: 1.6, fontWeight: 500 }}>Osmosis is water moving through a membrane from low → high concentration. Think of it as water "balancing itself out".</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Give an example', 'Quiz me', 'Deeper'].map(c => (
            <div key={c} style={{ padding: '4px 10px', background: '#eff6ff', border: '1px solid #bae6fd', borderRadius: 99, fontSize: 10, fontWeight: 700, color: '#0284c7', cursor: 'pointer' }}>{c}</div>
          ))}
        </div>
      </div>
    )
  },
  {
    icon: <BarChart2 size={28} />, color: '#d97706', bg: '#fffbeb',
    label: 'Progress Tracking',
    title: 'See Yourself Improve Daily',
    desc: 'Detailed analytics on flashcard performance, quiz scores, and study streaks. Know exactly what to study next and when.',
    stats: ['Daily streaks', 'Weak spot maps', 'Score trends'],
    mockup: (
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #fde68a', padding: '16px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706', marginBottom: 14 }}>📊 This Week's Progress</div>
        {[['Flashcards', 82], ['Quiz Score', 67], ['Coverage', 91], ['Streak', 100]].map(([l, w]) => (
          <div key={l} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#555', marginBottom: 4 }}>
              <span>{l}</span><span style={{ color: '#d97706' }}>{w}%</span>
            </div>
            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${w}%`, background: `linear-gradient(90deg, #f59e0b, #d97706)`, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }
];

export default function Features() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#111', position: 'relative' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 120 }}>

        {/* Hero Header */}
        <div className="container-custom" style={{ textAlign: 'center', paddingBottom: 80 }}>
          <RevealDiv>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(151,24,251,0.07)', border: '1px solid rgba(151,24,251,0.15)', borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 24, letterSpacing: '0.05em' }}>
              <Sparkles size={14} /> 6 Powerful AI Tools, One Platform
            </div>
          </RevealDiv>
          <RevealDiv delay={0.1}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, color: '#111', marginBottom: 24, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
              Your Complete{' '}
              <HighlightedText texts={['Study System']} />
              ,{' '}Built In.
            </h1>
          </RevealDiv>
          <RevealDiv delay={0.2}>
            <p style={{ fontSize: 18, color: '#555', maxWidth: 600, margin: '0 auto', fontWeight: 500, lineHeight: 1.7 }}>
              Six research-backed tools that transform raw lectures into a complete, interactive learning experience — all in one place.
            </p>
          </RevealDiv>
        </div>



        {/* Detailed Feature Cards Grid */}
        <div className="container-full">
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>The Toolbox</div>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#111', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Everything you need to succeed</h2>
            </div>
          </RevealDiv>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 32 }}>
            {features.map((f, i) => (
              <RevealDiv key={f.label} delay={i * 0.08}>
                <div
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    background: 'white', borderRadius: 32, padding: '40px', border: '1px solid #f0eaff',
                    boxShadow: hoveredIdx === i ? '0 32px 64px rgba(151,24,251,0.12)' : '0 4px 20px rgba(0,0,0,0.02)',
                    transform: hoveredIdx === i ? 'translateY(-8px)' : 'translateY(0)',
                    transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                    cursor: 'default', display: 'flex', flexDirection: 'column', gap: 28
                  }}>
                  
                  {/* Icon + Label */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, boxShadow: `0 8px 16px ${f.bg}` }}>
                      {React.cloneElement(f.icon, { size: 32 })}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: f.color, background: f.bg, padding: '6px 14px', borderRadius: 99, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{f.label}</span>
                  </div>

                  {/* Text */}
                  <div>
                    <h3 style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{f.title}</h3>
                    <p style={{ fontSize: 16, color: '#555', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{f.desc}</p>
                  </div>

                  {/* Mockup */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {f.mockup}
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid #f3f0ff', flexWrap: 'wrap' }}>
                    {f.stats.map(s => (
                      <span key={s} style={{ fontSize: 10, fontWeight: 800, color: f.color, background: f.bg, padding: '5px 12px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{s}</span>
                    ))}
                  </div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>

        {/* NEW SECTION: Deep Dive Feature Spotlight */}
        <div className="container-custom" style={{ marginTop: 140, marginBottom: 80 }}>
          <div style={{ background: '#111', borderRadius: 32, padding: '80px 40px', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '50%', height: '100%', background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            <RevealDiv>
              <div style={{ textAlign: 'center', marginBottom: 60 }}>
                <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, color: '#a78bfa', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Deep Dive</div>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', marginBottom: 20 }}>More than just a summary tool.</h2>
                <p style={{ fontSize: 18, color: '#a1a1aa', maxWidth: 600, margin: '0 auto' }}>Luter is built specifically to handle the rigors of university-level coursework.</p>
              </div>
            </RevealDiv>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
              <RevealDiv delay={0.1}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {[
                    { title: 'Complex Diagrams & Math', desc: 'Upload slides with complex formulas or anatomical diagrams. Our vision AI reads and explains them just like text.' },
                    { title: 'Cross-Document Synthesis', desc: 'Upload your syllabus, 5 lectures, and a textbook chapter. Luter connects the dots across all of them instantly.' },
                    { title: 'Nigerian University Ready', desc: 'Trained to understand local academic contexts, grading styles, and specific course structures.' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                      <div>
                        <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h4>
                        <p style={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: 15 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </RevealDiv>
              <RevealDiv delay={0.2}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 32, backdropFilter: 'blur(10px)' }}>
                   <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                     <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                     <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#eab308' }} />
                     <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
                   </div>
                   <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 20, fontFamily: 'monospace', color: '#a78bfa', fontSize: 14, lineHeight: 1.8 }}>
                     <span style={{ color: '#6ee7b7' }}>&gt; Analyzing MTH101_Lecture.pdf...</span><br/>
                     Extracting formulas... [Done]<br/>
                     Identifying core theorems... [Done]<br/>
                     <br/>
                     <span style={{ color: '#fff' }}>Generating practice questions tailored to UNILAG past questions...</span><br/>
                     <br/>
                     <span style={{ color: '#6ee7b7' }}>&gt; Ready. 45 Flashcards & 2 Quizzes created.</span>
                   </div>
                </div>
              </RevealDiv>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <RevealDiv>
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <p style={{ fontSize: 18, color: '#666', marginBottom: 24, fontWeight: 500 }}>Ready to study smarter than everyone else?</p>
            <a href="/signup" className="btn-primary" style={{ textDecoration: 'none', padding: '16px 40px', fontSize: 16 }}>
              Start Free — No Card Needed <ArrowRight size={16} />
            </a>
          </div>
        </RevealDiv>

      </div>
    </div>
  );
}
