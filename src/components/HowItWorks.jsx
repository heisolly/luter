import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PageBackground, SharedNavbar } from './PageShared';

// Number component with bidirectional scroll animation
const AnimatedNumber = ({ children, index }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Transform scroll progress to animation values
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [60, 0, 0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.8, 1, 1, 0.8]);

  return (
    <motion.div 
      ref={ref}
      style={{ 
        position: 'relative',
        y,
        opacity,
        scale
      }}
    >
      <motion.div 
        style={{ 
          fontSize: '64px', 
          fontWeight: 700, 
          letterSpacing: '-0.5px',
          background: 'linear-gradient(321deg, #8554ff 0%, #7b00ff 48.13%, #3300ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: 'Outfit, sans-serif',
          filter: 'drop-shadow(0 4px 8px rgba(123, 0, 255, 0.3))'
        }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Progress line with bidirectional animation
const AnimatedProgressLine = ({ index }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const scaleY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '2px',
        height: '60px',
        background: 'linear-gradient(to bottom, #7b00ff, #e5e7eb)',
        marginTop: '20px',
        originY: 'top',
        scaleY,
        opacity
      }}
    />
  );
};

export default function HowItWorks() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #fafafa, #ffffff)', color: '#0f172a', position: 'relative', overflow: 'visible', fontFamily: 'Outfit, sans-serif' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 140, paddingBottom: 120 }}>
        {/* Header - Scroll Reveal */}
        <motion.div 
          style={{ textAlign: 'center', marginBottom: 80 }}
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '6px 14px',
              background: 'white',
              border: '1px solid #f5f2ff',
              borderRadius: '20px',
              marginBottom: 24,
              boxShadow: '0 0.597144px 0.597144px -0.9375px rgba(42, 40, 46, 0.29), 0 1.81088px 1.81088px -1.875px rgba(42, 40, 46, 0.28), 0 4.78699px 4.78699px -2.8125px rgba(42, 40, 46, 0.24), 0 15px 15px -3.75px rgba(42, 40, 46, 0.1)'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
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
          </motion.div>
          
          <motion.h1 
            style={{ 
              fontSize: 'clamp(2rem, 4vw, 3rem)', 
              color: '#333', 
              fontWeight: 700, 
              lineHeight: '1.15',
              marginBottom: 0,
              fontFamily: 'Outfit, sans-serif',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            How to get started with Luter
          </motion.h1>
        </motion.div>

        {/* Timeline Content - Scroll Reveal Animations */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
            {[
              {
                number: '01',
                step: 'Upload',
                title: 'Upload your study materials',
                description: 'Upload PDFs, PowerPoint slides, Word docs, YouTube links, audio recordings, or even record live lectures. Luter accepts all formats.'
              },
              {
                number: '02',
                step: 'Process',
                title: 'AI processes everything instantly',
                description: 'Luter\'s AI analyzes your content and automatically generates structured notes, summaries, flashcards, quizzes, and more in seconds.'
              },
              {
                number: '03',
                step: 'Study',
                title: 'Get your complete study system',
                description: 'Access AI-powered notes, quick summaries, spaced-repetition flashcards, practice quizzes, and a 24/7 AI tutor all in one place.'
              },
              {
                number: '04',
                step: 'Practice',
                title: 'Test your knowledge',
                description: 'Practice with auto-generated quizzes and flashcards using active recall. Identify weak spots and master the material before exams.'
              },
              {
                number: '05',
                step: 'Master',
                title: 'Learn 24/7 with AI Tutor',
                description: 'Chat with your AI tutor anytime to explain concepts, clear confusion, and get personalized help. No more waiting for office hours.'
              }
            ].map((item, index) => (
              <motion.div 
                key={item.number}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
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
                  <AnimatedNumber index={index}>
                    {item.number}
                  </AnimatedNumber>
                  
                  {/* Progress Line */}
                  {index < 4 && <AnimatedProgressLine index={index} />}
                </div>

                {/* Right: Content */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                  viewport={{ once: true }}
                >
                  {/* Step Badge */}
                  <motion.div 
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 14px',
                      background: 'white',
                      border: '1px solid #f5f2ff',
                      borderRadius: '20px',
                      marginBottom: 16,
                      boxShadow: '0 0.597144px 0.597144px -0.9375px rgba(42, 40, 46, 0.29), 0 1.81088px 1.81088px -1.875px rgba(42, 40, 46, 0.28), 0 4.78699px 4.78699px -2.8125px rgba(42, 40, 46, 0.24), 0 15px 15px -3.75px rgba(42, 40, 46, 0.1)'
                    }}
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05, y: -3 }}
                  >
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
                  </motion.div>

                  {/* Title */}
                  <motion.h2 
                    style={{ 
                      fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
                      color: '#333', 
                      fontWeight: 700, 
                      lineHeight: '1.2',
                      marginBottom: 16,
                      fontFamily: 'Outfit, sans-serif'
                    }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 + 0.4 }}
                    viewport={{ once: true }}
                  >
                    {item.title}
                  </motion.h2>

                  {/* Description */}
                  <motion.p 
                    style={{ 
                      fontSize: '16px', 
                      color: '#666', 
                      fontWeight: 500, 
                      lineHeight: '1.6',
                      marginBottom: 24,
                      fontFamily: 'Outfit, sans-serif'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 + 0.5 }}
                    viewport={{ once: true }}
                  >
                    {item.description}
                  </motion.p>

                  {/* CTA Button - Scroll Reveal */}
                  {index === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      viewport={{ once: true }}
                    >
                      <motion.a
                        href="/signup"
                        className="btn-primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '14px 28px',
                          background: 'var(--primary)',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: 'var(--radius-button)',
                          fontSize: '14px',
                          fontWeight: 600,
                          letterSpacing: '0.01em',
                          fontFamily: 'var(--font-inter)',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(151, 24, 251, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: '0 6px 20px rgba(151, 24, 251, 0.4), 0 2px 4px rgba(0,0,0,0.1)',
                          background: 'var(--primary-light)'
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span style={{ position: 'relative', zIndex: 1 }}>Get Started for Free</span>
                        <ArrowRight style={{ width: 15, height: 15, position: 'relative', zIndex: 1 }} />
                        <motion.div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)',
                            pointerEvents: 'none'
                          }}
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.6 }}
                        />
                      </motion.a>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

