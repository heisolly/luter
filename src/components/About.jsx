import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SharedNavbar, SharedFooter } from './PageShared';

export default function About() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff', 
      color: '#0f172a', 
      position: 'relative',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 140, paddingBottom: 120 }}>

        {/* Hero Section */}
        <section style={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          px: 20, 
          textAlign: 'center',
          marginBottom: 160 
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            background: 'rgba(151,24,251,0.06)', 
            border: '1px solid rgba(151,24,251,0.12)', 
            borderRadius: 20, 
            padding: '6px 16px', 
            fontSize: 12, 
            fontWeight: 600, 
            color: 'var(--primary)', 
            marginBottom: 48,
            letterSpacing: '0.5px'
          }}>
            About Luter
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            fontWeight: 700, 
            color: '#111', 
            marginBottom: 40, 
            lineHeight: 1.1,
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '-0.02em'
          }}>
            We believe learning
            <br />
            <span style={{
              background: 'linear-gradient(321deg, #8554ff 0%, #7b00ff 48.13%, #3300ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              should be simple
            </span>
          </h1>
          
          <p style={{ 
            fontSize: 18, 
            color: '#666', 
            lineHeight: 1.8, 
            fontWeight: 400,
            maxWidth: 600,
            margin: '0 auto',
            fontFamily: 'Outfit, sans-serif'
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
          px: 20, 
          marginBottom: 160 
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 120,
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                color: '#888', 
                marginBottom: 16,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontFamily: 'Outfit, sans-serif'
              }}>
                The Problem
              </h2>
              
              <p style={{ 
                fontSize: 32, 
                fontWeight: 700, 
                color: '#111', 
                marginBottom: 24,
                lineHeight: 1.2,
                fontFamily: 'Outfit, sans-serif'
              }}>
                Students were drowning in complexity
              </p>
              
              <p style={{ 
                fontSize: 16, 
                color: '#666', 
                lineHeight: 1.8, 
                fontWeight: 400,
                fontFamily: 'Outfit, sans-serif'
              }}>
                60-slide presentations. 3-hour lectures. Dense textbooks. 
                Scattered notes across dozens of apps. 
                No time to actually learn.
              </p>
            </div>
            
            <div>
              <h2 style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                color: '#888', 
                marginBottom: 16,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontFamily: 'Outfit, sans-serif'
              }}>
                The Solution
              </h2>
              
              <p style={{ 
                fontSize: 32, 
                fontWeight: 700, 
                color: '#111', 
                marginBottom: 24,
                lineHeight: 1.2,
                fontFamily: 'Outfit, sans-serif'
              }}>
                AI that understands how you learn
              </p>
              
              <p style={{ 
                fontSize: 16, 
                color: '#666', 
                lineHeight: 1.8, 
                fontWeight: 400,
                fontFamily: 'Outfit, sans-serif'
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
          px: 20, 
          marginBottom: 160 
        }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#888', 
              marginBottom: 24,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontFamily: 'Outfit, sans-serif'
            }}>
              What We Stand For
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 48 
          }}>
            <div>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: '#111', 
                marginBottom: 12,
                fontFamily: 'Outfit, sans-serif'
              }}>
                Science First
              </h3>
              <p style={{ 
                fontSize: 15, 
                color: '#666', 
                lineHeight: 1.7, 
                fontWeight: 400,
                fontFamily: 'Outfit, sans-serif'
              }}>
                Every feature grounded in cognitive research. 
                Active recall, spaced repetition, retrieval practice. 
                Not just buzzwords.
              </p>
            </div>
            
            <div>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: '#111', 
                marginBottom: 12,
                fontFamily: 'Outfit, sans-serif'
              }}>
                Simple by Design
              </h3>
              <p style={{ 
                fontSize: 15, 
                color: '#666', 
                lineHeight: 1.7, 
                fontWeight: 400,
                fontFamily: 'Outfit, sans-serif'
              }}>
                Upload and forget. 
                We handle the complexity so you don't have to. 
                No learning curve, just results.
              </p>
            </div>
            
            <div>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: '#111', 
                marginBottom: 12,
                fontFamily: 'Outfit, sans-serif'
              }}>
                Privacy Always
              </h3>
              <p style={{ 
                fontSize: 15, 
                color: '#666', 
                lineHeight: 1.7, 
                fontWeight: 400,
                fontFamily: 'Outfit, sans-serif'
              }}>
                Your notes are yours. 
                Encrypted, private, never shared. 
                Focus on learning, not on privacy concerns.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          px: 20, 
          textAlign: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #7180fe 100%)',
            borderRadius: 24,
            padding: '80px 60px',
            color: 'white'
          }}>
            <h2 style={{ 
              fontSize: 32, 
              fontWeight: 700, 
              marginBottom: 20,
              fontFamily: 'Outfit, sans-serif'
            }}>
              Start learning smarter
            </h2>
            
            <p style={{ 
              fontSize: 16, 
              color: 'rgba(255,255,255,0.9)', 
              marginBottom: 40,
              fontFamily: 'Outfit, sans-serif'
            }}>
              Join thousands of students who've transformed their study habits
            </p>
            
            <a
              href="/signup"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'white',
                color: 'var(--primary)',
                padding: '14px 32px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              Get Started Free <ArrowRight size={16} />
            </a>
          </div>
        </section>

      </div>
      
      <SharedFooter />
    </div>
  );
}
