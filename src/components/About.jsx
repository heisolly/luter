import React from 'react';
import { Link } from 'react-router-dom';
import { RiArrowRightSLine as CaretRight } from 'react-icons/ri';
import { SharedNavbar, SharedFooter, SharedFAQ } from './PageShared';

const aboutFaqs = [
  { q: 'Who is Luter for?', a: 'Luter is designed for students, researchers, and lifelong learners who want to master complex information faster and with less stress.' },
  { q: 'Is my data used for training?', a: 'No. We have a strict privacy policy. Your personal study materials are never used to train global AI models.' },
  { q: 'Who built Luter?', a: 'Luter was founded by a team of educators and engineers passionate about applying cognitive science to modern learning tools.' },
  { q: 'Can I export my notes?', a: 'Yes! You can export your AI-generated notes and flashcards to PDF, Notion, or Anki anytime.' },
];

export default function About() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff', 
      color: '#0f172a', 
      position: 'relative',
      fontFamily: 'var(--font-varela)'
    }}>
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 140, paddingBottom: 120 }}>

        {/* Hero Section */}
        <section style={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          padding: '0 20px', 
          textAlign: 'center',
          marginBottom: 160 
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            background: 'rgba(75, 0, 130, 0.06)', 
            border: '1px solid rgba(75, 0, 130, 0.12)', 
            borderRadius: 9999, 
            padding: '8px 20px', 
            fontSize: 13, 
            fontWeight: 800, 
            color: '#4B0082', 
            marginBottom: 48,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            About Luter
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            fontWeight: 800, 
            color: '#111', 
            marginBottom: 40, 
            lineHeight: 1.1,
            fontFamily: 'var(--font-outfit)',
            letterSpacing: '-0.02em'
          }}>
            We believe learning
            <br />
            <span style={{
              background: 'linear-gradient(to right, #A855F7, #4B0082)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              should be simple
            </span>
          </h1>
          
          <p style={{ 
            fontSize: 18, 
            color: '#64748B', 
            lineHeight: 1.8, 
            fontWeight: 500,
            maxWidth: 600,
            margin: '0 auto',
            fontFamily: 'var(--font-varela)'
          }}>
            Great learning tools shouldn't be complicated. 
            They should work quietly in the background, 
            letting you focus on what matters most — understanding.
          </p>
        </section>

        {/* Story Section */}
        <section style={{ 
          maxWidth: 900, 
          margin: '0 auto', 
          padding: '0 20px', 
          marginBottom: 160 
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 80,
            alignItems: 'start'
          }}>
            <div>
              <h2 style={{ 
                fontSize: 14, 
                fontWeight: 800, 
                color: '#94A3B8', 
                marginBottom: 16,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-outfit)'
              }}>
                The Problem
              </h2>
              
              <p style={{ 
                fontSize: 32, 
                fontWeight: 800, 
                color: '#111', 
                marginBottom: 24,
                lineHeight: 1.2,
                fontFamily: 'var(--font-outfit)'
              }}>
                Students were drowning in complexity
              </p>
              
              <p style={{ 
                fontSize: 16, 
                color: '#64748B', 
                lineHeight: 1.8, 
                fontWeight: 500,
                fontFamily: 'var(--font-varela)'
              }}>
                60-slide presentations. 3-hour lectures. Dense textbooks. 
                Scattered notes across dozens of apps. 
                No time to actually learn.
              </p>
            </div>
            
            <div>
              <h2 style={{ 
                fontSize: 14, 
                fontWeight: 800, 
                color: '#94A3B8', 
                marginBottom: 16,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-outfit)'
              }}>
                The Solution
              </h2>
              
              <p style={{ 
                fontSize: 32, 
                fontWeight: 800, 
                color: '#111', 
                marginBottom: 24,
                lineHeight: 1.2,
                fontFamily: 'var(--font-outfit)'
              }}>
                AI that understands how you learn
              </p>
              
              <p style={{ 
                fontSize: 16, 
                color: '#64748B', 
                lineHeight: 1.8, 
                fontWeight: 500,
                fontFamily: 'var(--font-varela)'
              }}>
                Upload anything. Get everything. 
                Notes, flashcards, quizzes, and a tutor that never sleeps. 
                Built on science, designed for students.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section style={{ 
          maxWidth: 1000, 
          margin: '0 auto', 
          padding: '0 20px', 
          marginBottom: 160 
        }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ 
              fontSize: 14, 
              fontWeight: 800, 
              color: '#94A3B8', 
              marginBottom: 24,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-outfit)'
            }}>
              What We Stand For
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 48 
          }}>
            {[
              { title: 'Science First', desc: 'Every feature grounded in cognitive research. Active recall, spaced repetition, retrieval practice. Not just buzzwords.' },
              { title: 'Simple by Design', desc: 'Upload and forget. We handle the complexity so you don\'t have to. No learning curve, just results.' },
              { title: 'Privacy Always', desc: 'Your notes are yours. Encrypted, private, never shared. Focus on learning, not on privacy concerns.' }
            ].map((value, i) => (
              <div key={i}>
                <h3 style={{ 
                  fontSize: 22, 
                  fontWeight: 800, 
                  color: '#111', 
                  marginBottom: 16,
                  fontFamily: 'var(--font-outfit)'
                }}>
                  {value.title}
                </h3>
                <p style={{ 
                  fontSize: 16, 
                  color: '#64748B', 
                  lineHeight: 1.7, 
                  fontWeight: 500,
                  fontFamily: 'var(--font-varela)'
                }}>
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <SharedFAQ items={aboutFaqs} />

        {/* CTA Section */}
        <section style={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          padding: '0 20px', 
          textAlign: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #4B0082 0%, #A855F7 100%)',
            borderRadius: 32,
            padding: '80px 60px',
            color: 'white',
            boxShadow: '0 20px 40px rgba(75, 0, 130, 0.2)'
          }}>
            <h2 style={{ 
              fontSize: 36, 
              fontWeight: 800, 
              marginBottom: 20,
              fontFamily: 'var(--font-outfit)'
            }}>
              Start learning smarter
            </h2>
            
            <p style={{ 
              fontSize: 18, 
              color: 'rgba(255,255,255,0.9)', 
              marginBottom: 40,
              fontFamily: 'var(--font-varela)',
              fontWeight: 500
            }}>
              Join thousands of students who've transformed their study habits
            </p>
            
            <Link
              to="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: 'white',
                color: '#4B0082',
                padding: '16px 40px',
                borderRadius: 9999,
                fontSize: 15,
                fontWeight: 800,
                textDecoration: 'none',
                fontFamily: 'var(--font-varela)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'all 0.2s ease'
              }}
            >
              Get Started Free <CaretRight size={20} weight="bold" />
            </Link>
          </div>
        </section>

      </div>
      
      <SharedFooter />
    </div>
  );
}
