import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiArrowRightSLine as CaretRight, RiLoader4Line as CircleNotch, RiLockFill as Lock, RiMailFill as Envelope, RiBookOpenFill as BookOpen, RiGraduationCapFill as GraduationCap } from 'react-icons/ri';
import { supabase } from '../supabaseClient';
import { clearLuterCaches } from '../utils/cacheUtils';

import GoogleLoginButton from './auth/GoogleLoginButton';
import { AuthNavbar, PremiumButton } from './PageShared';
import { DASHBOARD_URL } from '../utils/urlUtils';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const queryParams = new URLSearchParams(window.location.search);
  const redirectPath = queryParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.session) { 
      clearLuterCaches();
      // Force cross-subdomain redirect to the dashboard
      const targetPath = redirectPath.startsWith('/dashboard') ? redirectPath : `/dashboard${redirectPath.startsWith('/') ? '' : '/'}${redirectPath}`;
      window.location.href = `${DASHBOARD_URL}${targetPath}`; 
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#FFFFFF', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative', 
      overflow: 'hidden', 
      fontFamily: 'var(--font-varela)' 
    }}>
      <style>{`
        @keyframes moveGrid {
          0% { transform: translateY(0); }
          100% { transform: translateY(100px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>

      {/* Premium Nebula Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {/* Ambient Glows */}
        <div style={{ 
          position: 'absolute', bottom: '10%', left: '5%', width: '40%', height: '40%', 
          background: 'radial-gradient(circle, rgba(75, 0, 130, 0.08) 0%, transparent 70%)', 
          filter: 'blur(80px)', animation: 'pulseGlow 8s infinite ease-in-out' 
        }} />
        <div style={{ 
          position: 'absolute', top: '10%', right: '5%', width: '40%', height: '40%', 
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)', 
          filter: 'blur(80px)', animation: 'pulseGlow 10s infinite ease-in-out' 
        }} />

        {/* Moving Grid */}
        <div style={{ 
          position: 'absolute', inset: '-100px 0', 
          backgroundImage: `
            linear-gradient(rgba(75, 0, 130, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(75, 0, 130, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
          animation: 'moveGrid 20s linear infinite',
          opacity: 0.6
        }} />

        {/* Floating Icons Background */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', opacity: 0.08, animation: 'float 8s infinite ease-in-out' }}>
           <BookOpen size={48} color="#4B0082" weight="light" />
        </div>
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', opacity: 0.08, animation: 'float 9s infinite ease-in-out-reverse' }}>
           <GraduationCap size={48} color="#4B0082" weight="light" />
        </div>
      </div>

      {/* Navigation Bar */}
      <AuthNavbar type="signin" />

      <div style={{ 
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', 
        position: 'relative', zIndex: 1, padding: '60px 20px' 
      }}>
        <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111', marginBottom: 16, letterSpacing: '-0.03em', fontFamily: 'var(--font-outfit)' }}>
              Welcome back.
            </h1>
            <p style={{ fontSize: 16, color: '#64748B', fontWeight: 500 }}>Sign in to continue your journey.</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: 24, fontSize: 14, fontWeight: 700, marginBottom: 24, border: '1px solid #fee2e2' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 32 }}>
            <GoogleLoginButton />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '32px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#CBD5E1', letterSpacing: '0.1em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                style={inputStyle} 
                placeholder="EMAIL ADDRESS" 
              />
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                style={inputStyle} 
                placeholder="PASSWORD" 
              />
            </div>

            <PremiumButton type="submit" disabled={loading} size="lg" style={{ width: '100%', marginTop: '12px' }}>
              {loading ? <CircleNotch className="animate-spin" size={24} weight="light" /> : "SIGN IN"}
            </PremiumButton>
          </form>

          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: '#64748B', fontWeight: 600 }}>
            New to Luter? <Link to="/signup" style={{ color: '#4B0082', fontWeight: 800, textDecoration: 'none' }}>Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { 
  width: '100%', 
  padding: '18px 28px', 
  borderRadius: '9999px', 
  border: '1.5px solid #F1F5F9', 
  fontSize: '16px', 
  fontWeight: '500', 
  outline: 'none', 
  background: '#FFFFFF',
  transition: 'all 0.2s ease',
  color: '#111',
  fontFamily: 'var(--font-varela)'
};

const primaryButtonStyle = { 
  padding: '18px', 
  fontSize: '14px', 
  fontWeight: '800', 
  width: '100%', 
  marginTop: '12px', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  gap: '10px', 
  borderRadius: '9999px', 
  background: 'linear-gradient(135deg, #A855F7 0%, #C7B9FF 100%)', 
  color: 'white', 
  border: 'none', 
  cursor: 'pointer',
  boxShadow: '0 10px 25px rgba(168, 85, 247, 0.25)',
  transition: 'all 0.2s ease',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-outfit)'
};