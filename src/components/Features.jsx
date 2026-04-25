import React from 'react';
import { RiBookOpenFill as BookOpen, RiFileTextFill as FileText, RiStackFill as Stack, RiGraduationCapFill as GraduationCap, RiMessage3Fill as ChatCenteredText, RiBrainFill as Brain, RiMagicFill as Sparkle, RiArrowRightSLine as CaretRight } from 'react-icons/ri';
import { PageBackground, SharedNavbar, SharedFooter, RevealDiv, SharedFAQ } from './PageShared';
import { Link } from 'react-router-dom';

const featureFaqs = [
  { q: 'Can I upload YouTube videos?', a: 'Yes! Simply paste the URL and Luter will transcribe and summarize the entire video for you.' },
  { q: 'How accurate is the AI tutor?', a: 'Luter uses the latest LLMs trained on academic contexts, ensuring high accuracy and context-aware responses.' },
  { q: 'Does it support handwriting?', a: 'Currently, we focus on digital documents and audio, but OCR for handwritten notes is in our roadmap!' },
  { q: 'Is there a limit on file size?', a: 'Pro users can upload files up to 100MB. Free users have a 10MB limit per file.' },
];

const features = [
  {
    icon: <BookOpen size={28} weight="bold" />,
    title: 'AI Note-Taking',
    description: 'Transform messy lectures and complex recordings into beautifully structured, actionable notes instantly.'
  },
  {
    icon: <FileText size={28} weight="bold" />,
    title: 'Instant Summaries',
    description: 'Condense 100-page textbooks or 2-hour videos into high-impact 5-minute reads without losing core details.'
  },
  {
    icon: <Stack size={28} weight="bold" />,
    title: 'Spaced Flashcards',
    description: 'Automatically generate high-quality flashcards designed for long-term retention using spaced repetition science.'
  },
  {
    icon: <GraduationCap size={28} weight="bold" />,
    title: 'Exam Simulation',
    description: 'Practice with AI-generated quizzes that mimic your real exam style, helping you fix weak spots fast.'
  },
  {
    icon: <ChatCenteredText size={28} weight="bold" />,
    title: 'Personal AI Tutor',
    description: 'A dedicated study partner that understands your specific material and answers your questions 24/7.'
  },
  {
    icon: <Brain size={28} weight="bold" />,
    title: 'Cognitive Analytics',
    description: 'Visualize your learning curve and get data-driven insights into which topics need your attention next.'
  }
];

export default function Features() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#111', fontFamily: 'var(--font-varela)' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 160, paddingBottom: 120 }}>

        {/* Hero Section */}
        <div className="container-full" style={{ textAlign: 'center', marginBottom: 120 }}>
          <RevealDiv>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'rgba(75, 0, 130, 0.06)', border: '1px solid rgba(75, 0, 130, 0.12)', 
              borderRadius: 9999, padding: '10px 24px', fontSize: 13, fontWeight: 800, 
              color: '#4B0082', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <Sparkle size={18} weight="bold" /> Powerful Tools for Modern Learners
            </div>
          </RevealDiv>
          
          <RevealDiv delay={0.1}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: '#111', marginBottom: 32, lineHeight: 1.1, letterSpacing: '-0.04em', fontFamily: 'var(--font-outfit)' }}>
              Your brain, <span style={{ background: 'linear-gradient(to right, #A855F7, #4B0082)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>supercharged.</span>
            </h1>
          </RevealDiv>
          
          <RevealDiv delay={0.2}>
            <p style={{ fontSize: 20, color: '#64748B', maxWidth: 650, margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
              Stop drowning in materials. Start mastering them. Luter combines cognitive science with state-of-the-art AI to transform how you learn.
            </p>
          </RevealDiv>
        </div>

        {/* Features Grid */}
        <div className="container-full" style={{ marginBottom: 120 }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 32,
            maxWidth: 1100,
            margin: '0 auto'
          }}>
            {features.map((feature, index) => (
              <RevealDiv key={index} delay={index * 0.1}>
                <div
                  style={{
                    background: 'white',
                    borderRadius: 32,
                    padding: 40,
                    border: '1.5px solid #F1F5F9',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                    transition: 'all 0.3s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.borderColor = '#4B0082';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(75, 0, 130, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#F1F5F9';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.02)';
                  }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: 20, background: 'rgba(75, 0, 130, 0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#4B0082', marginBottom: 32
                  }}>
                    {feature.icon}
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 16, fontFamily: 'var(--font-outfit)' }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                    {feature.description}
                  </p>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>

        <SharedFAQ items={featureFaqs} />

        {/* Closing CTA */}
        <div className="container-full">
          <RevealDiv>
            <div style={{
              background: 'linear-gradient(135deg, #4B0082 0%, #A855F7 100%)', 
              borderRadius: 40, padding: '100px 40px', textAlign: 'center',
              boxShadow: '0 30px 60px rgba(75, 0, 130, 0.2)', position: 'relative', overflow: 'hidden'
            }}>
              <h2 style={{ fontSize: 42, fontWeight: 800, color: 'white', marginBottom: 24, fontFamily: 'var(--font-outfit)' }}>Ready to change the way you study?</h2>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginBottom: 48, fontFamily: 'var(--font-varela)' }}>No credit card required. Cancel anytime.</p>
              <Link to="/signup" style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, background: 'white', color: '#4B0082',
                padding: '20px 48px', borderRadius: 9999, fontSize: 16, fontWeight: 800, textDecoration: 'none',
                transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Create Free Account <CaretRight size={22} weight="bold" />
              </Link>
            </div>
          </RevealDiv>
        </div>

      </div>
      <SharedFooter />
    </div>
  );
}
