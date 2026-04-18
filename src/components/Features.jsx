import React from 'react';
import { BookOpen, FileText, Layers, GraduationCap, MessageSquare, Brain } from 'lucide-react';
import { PageBackground, SharedNavbar } from './PageShared';

const features = [
  {
    icon: <BookOpen size={24} />,
    title: 'AI Notes',
    description: 'Transform lectures into structured notes instantly'
  },
  {
    icon: <FileText size={24} />,
    title: 'AI Summary',
    description: 'Condense chapters into 3-minute reads'
  },
  {
    icon: <Layers size={24} />,
    title: 'AI Flashcards',
    description: 'Auto-generate spaced repetition cards'
  },
  {
    icon: <GraduationCap size={24} />,
    title: 'AI Quizzes',
    description: 'Practice with exam-style questions'
  },
  {
    icon: <MessageSquare size={24} />,
    title: 'AI Tutor',
    description: '24/7 personalized study assistance'
  },
  {
    icon: <Brain size={24} />,
    title: 'Smart Analytics',
    description: 'Track progress and identify weak spots'
  }
];

export default function Features() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#111' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 120 }}>

        {/* Header */}
        <div className="container-custom" style={{ textAlign: 'center', marginBottom: 100 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 24 }}>
            Features
          </h1>
          <p style={{ fontSize: 18, color: '#666', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Everything you need to excel in your studies, powered by AI.
          </p>
        </div>

        {/* Features Grid */}
        <div className="container-custom">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: 32,
            maxWidth: 1000,
            margin: '0 auto'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: 32,
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16,
                  marginBottom: 16
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    {feature.icon}
                  </div>
                  <h3 style={{ 
                    fontSize: 20, 
                    fontWeight: 700, 
                    margin: 0,
                    color: '#111',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {feature.title}
                  </h3>
                </div>
                <p style={{ 
                  fontSize: 15, 
                  color: '#666',
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: 'Outfit, sans-serif'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
