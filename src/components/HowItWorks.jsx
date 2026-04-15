import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PageBackground, SharedNavbar } from './PageShared';

export default function HowItWorks() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #fafafa, #ffffff)', color: '#0f172a', position: 'relative', overflow: 'visible', fontFamily: 'Outfit, sans-serif' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 140, paddingBottom: 120 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '6px 14px',
            background: 'white',
            border: '1px solid #f5f2ff',
            borderRadius: '20px',
            marginBottom: 24,
            boxShadow: '0 0.597144px 0.597144px -0.9375px rgba(42, 40, 46, 0.29), 0 1.81088px 1.81088px -1.875px rgba(42, 40, 46, 0.28), 0 4.78699px 4.78699px -2.8125px rgba(42, 40, 46, 0.24), 0 15px 15px -3.75px rgba(42, 40, 46, 0.1)'
          }}>
            <div style={{
              padding: '4px 12px',
              background: 'linear-gradient(316deg, #a58fff 0%, #3300ff 55.69%, #a58fff 100%)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Process
            </div>
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 4vw, 3rem)', 
            color: '#333', 
            fontWeight: 700, 
            lineHeight: '1.15',
            marginBottom: 0,
            fontFamily: 'Outfit, sans-serif'
          }}>
            How to get started with Luter
          </h1>
        </div>

        {/* Timeline Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
            {[
              {
                number: '01',
                step: 'Sign up',
                title: 'Create your account',
                description: 'Sign up in just a few clicks and create your personal Luter workspace. There\'s no complex setup, you can start studying immediately.',
                active: true
              },
              {
                number: '02',
                step: 'Ask',
                title: 'Show it your problem',
                description: 'Type your question, upload a problem set, or write directly on your canvas. Your tutor sees exactly what you\'re working on.',
                active: false
              },
              {
                number: '03',
                step: 'Learn',
                title: 'Get taught — live, out loud',
                description: 'Your tutor explains the concept step by step, in real-time voice. It draws diagrams, works through the math, and keeps going until it clicks.',
                active: false
              },
              {
                number: '04',
                step: 'Practice',
                title: 'Study, test, and reinforce',
                description: 'Work through the problem on your own. Write your answer, show your steps. Your tutor watches and waits.',
                active: false
              },
              {
                number: '05',
                step: 'Improve',
                title: 'Get corrected in real-time',
                description: 'Made a mistake? Your tutor spots it, marks exactly where you went wrong, and explains what to fix. Then you try again — until you actually have it.',
                active: false
              }
            ].map((item, index) => (
              <motion.div 
                key={item.number}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '120px 1fr', 
                  gap: 60, 
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                {/* Left: Number and Progress Bar */}
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    fontSize: '64px', 
                    fontWeight: 700, 
                    letterSpacing: '-0.5px',
                    background: item.active 
                      ? 'linear-gradient(321deg, #8554ff 0%, #7b00ff 48.13%, #3300ff 100%)'
                      : 'linear-gradient(321deg, #8554ff 0%, #7b00ff 48.13%, #3300ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    opacity: item.active ? 1 : 0.15,
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {item.number}
                  </div>
                  {index < 4 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '2px',
                      height: '60px',
                      background: item.active ? '#7b00ff' : '#e5e7eb',
                      marginTop: '20px'
                    }} />
                  )}
                </div>

                {/* Right: Content */}
                <div>
                  {/* Step Badge */}
                  <div style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px 14px',
                    background: 'white',
                    border: '1px solid #f5f2ff',
                    borderRadius: '20px',
                    marginBottom: 16,
                    boxShadow: '0 0.597144px 0.597144px -0.9375px rgba(42, 40, 46, 0.29), 0 1.81088px 1.81088px -1.875px rgba(42, 40, 46, 0.28), 0 4.78699px 4.78699px -2.8125px rgba(42, 40, 46, 0.24), 0 15px 15px -3.75px rgba(42, 40, 46, 0.1)'
                  }}>
                    <div style={{
                      padding: '4px 12px',
                      background: 'linear-gradient(316deg, #a58fff 0%, #3300ff 55.69%, #a58fff 100%)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      fontFamily: 'Outfit, sans-serif'
                    }}>
                      {item.step}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 style={{ 
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
                    color: '#333', 
                    fontWeight: 700, 
                    lineHeight: '1.2',
                    marginBottom: 16,
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {item.title}
                  </h2>

                  {/* Description */}
                  <p style={{ 
                    fontSize: '16px', 
                    color: '#666', 
                    fontWeight: 500, 
                    lineHeight: '1.6',
                    marginBottom: 24,
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {item.description}
                  </p>

                  {/* CTA Button */}
                  {index === 0 && (
                    <motion.a
                      href="/signup"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        background: '#1c1c1c',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '67px',
                        fontSize: '14px',
                        fontWeight: 600,
                        fontFamily: 'Outfit, sans-serif',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Get Started for Free
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

