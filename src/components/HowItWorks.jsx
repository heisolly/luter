import React from 'react';
import { RiArrowRightSLine as CaretRight, RiMagicFill as Sparkle, RiUploadCloudFill as Upload, RiCpuFill as Cpu, RiBookOpenFill as BookOpen, RiEditFill as PencilLine } from 'react-icons/ri';
import { PageBackground, SharedNavbar, SharedFooter, RevealDiv, SharedFAQ } from './PageShared';
import { Link } from 'react-router-dom';

const howItWorksFaqs = [
  { q: 'How do I start?', a: 'Just click "Get Started", upload your first document, and watch Luter transform it into a study hub in seconds.' },
  { q: 'Can I collaborate with others?', a: 'Yes! You can share your generated flashcards and notes with classmates via a private link.' },
  { q: 'What happens to my old files?', a: 'Your files are stored securely in your private "Backpack" so you can revisit them anytime during the semester.' },
  { q: 'Does it work offline?', a: 'While Luter requires an internet connection to process files, you can download your generated notes and flashcards for offline study.' },
];

const steps = [
  {
    icon: <Upload size={32} weight="bold" />,
    title: 'Drop your materials',
    desc: 'PDFs, slides, Word docs, YouTube links, or lecture recordings. If you can study it, Luter can understand it.',
    color: 'rgba(239, 68, 68, 0.05)', iconColor: '#ef4444'
  },
  {
    icon: <Cpu size={32} weight="bold" />,
    title: 'AI Transformation',
    desc: 'Luter\'s neural engine dissects your material, identifying core concepts, key formulas, and high-yield exam topics.',
    color: 'rgba(75, 0, 130, 0.05)', iconColor: '#4B0082'
  },
  {
    icon: <BookOpen size={32} weight="bold" />,
    title: 'Instant Study Hub',
    desc: 'Automatically get structured notes, summaries, and spaced-repetition flashcards tailored perfectly to your material.',
    color: 'rgba(16, 185, 129, 0.05)', iconColor: '#10b981'
  },
  {
    icon: <PencilLine size={32} weight="bold" />,
    title: 'Practice & Master',
    desc: 'Test yourself with AI-generated quizzes and engage with your 24/7 AI tutor to clear any confusion instantly.',
    color: 'rgba(59, 130, 246, 0.05)', iconColor: '#3b82f6'
  }
];

export default function HowItWorks() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#111', position: 'relative', fontFamily: 'var(--font-varela)' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 160, paddingBottom: 120 }}>
        {/* Header */}
        <div className="container-full" style={{ textAlign: 'center', marginBottom: 120 }}>
          <RevealDiv>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'rgba(75, 0, 130, 0.06)', border: '1px solid rgba(75, 0, 130, 0.12)', 
              borderRadius: 9999, padding: '10px 24px', fontSize: 13, fontWeight: 800, 
              color: '#4B0082', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <Sparkle size={18} weight="bold" /> The Luter Workflow
            </div>
          </RevealDiv>
          
          <RevealDiv delay={0.1}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: '#111', marginBottom: 32, lineHeight: 1.1, letterSpacing: '-0.04em', fontFamily: 'var(--font-outfit)' }}>
              From complex data to <br /><span style={{ background: 'linear-gradient(to right, #A855F7, #4B0082)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>effortless understanding.</span>
            </h1>
          </RevealDiv>
        </div>

        {/* Steps Grid */}
        <div className="container-full" style={{ marginBottom: 160 }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 40,
            maxWidth: 1100,
            margin: '0 auto'
          }}>
            {steps.map((step, idx) => (
              <RevealDiv key={idx} delay={idx * 0.1}>
                <div style={{
                  background: 'white', borderRadius: 32, padding: 48,
                  border: '1.5px solid #F1F5F9',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                  height: '100%', transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = '#4B0082';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(75, 0, 130, 0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#F1F5F9';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.02)';
                }}>
                  <div style={{ 
                    width: 72, height: 72, borderRadius: 24, background: step.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: step.iconColor, marginBottom: 32
                  }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: step.iconColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'var(--font-outfit)' }}>
                    Step 0{idx + 1}
                  </div>
                  <h3 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 16, fontFamily: 'var(--font-outfit)' }}>{step.title}</h3>
                  <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.6, fontWeight: 500 }}>{step.desc}</p>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>

        <SharedFAQ items={howItWorksFaqs} />

        {/* Closing Section */}
        <div className="container-full">
          <RevealDiv>
            <div style={{
              background: 'linear-gradient(135deg, #4B0082 0%, #A855F7 100%)', 
              borderRadius: 40, padding: '100px 40px', textAlign: 'center',
              boxShadow: '0 30px 60px rgba(75, 0, 130, 0.2)'
            }}>
              <h2 style={{ fontSize: 42, fontWeight: 800, color: 'white', marginBottom: 24, fontFamily: 'var(--font-outfit)' }}>Stop studying hard. Start studying smart.</h2>
              <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>
                Join thousands of students who have automated their learning workflow with Luter.
              </p>
              <Link to="/signup" style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, background: 'white', color: '#4B0082',
                padding: '20px 48px', borderRadius: 9999, fontSize: 16, fontWeight: 800, textDecoration: 'none',
                transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Get Started Free <CaretRight size={22} weight="bold" />
              </Link>
            </div>
          </RevealDiv>
        </div>
      </div>
      <SharedFooter />
    </div>
  );
}

