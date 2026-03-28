import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { supabase } from '../supabaseClient';
import GoogleLoginButton from './auth/GoogleLoginButton';

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
    if (data?.session) { navigate(redirectPath); }
  };

  return (
    <div className="hero-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 0, background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
      
      {/* Navbar */}
      <SharedNavbar />

      {/* Hero Background */}
      <div className="hero-bg">
        <div className="hero-bg-grid" />
        <div style={{ position: 'absolute', top: '12%', left: '5%', animation: 'float-up-down 6s ease-in-out infinite', opacity: 0.5 }}>
          <div style={{ width: 50, height: 50, background: 'rgba(151,24,251,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-10deg)', border: '1px solid rgba(151,24,251,0.2)' }}>
            <Sparkles size={24} color="var(--primary)" />
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '15%', right: '5%', animation: 'float-up-down 8s ease-in-out infinite reverse', opacity: 0.5 }}>
          <div style={{ width: 60, height: 60, background: 'rgba(2,132,199,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(2,132,199,0.15)' }}>
            <BrainCircuit size={28} color="#0284c7" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="auth-content-mobile" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, width: '100%', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: 440, paddingTop: '140px', paddingBottom: '60px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 2.8rem)', fontWeight: 800, fontFamily: 'var(--font-varela)', color: '#111', marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 16, color: '#666', fontWeight: 500 }}>Sign in to continue your study session.</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600, marginBottom: 24, border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <GoogleLoginButton />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: -8 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.05)' }} />
              <span style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.05)' }} />
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            <div>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '2px solid rgba(151,24,251,0.1)', fontSize: 16, outline: 'none', transition: 'all 0.2s', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', fontFamily: 'var(--font-inter)', color: '#111', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} 
                placeholder="Email Address" 
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'white'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(151,24,251,0.1)'; e.target.style.background = 'rgba(255,255,255,0.8)'; }}
              />
            </div>
            <div>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '2px solid rgba(151,24,251,0.1)', fontSize: 16, outline: 'none', transition: 'all 0.2s', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', fontFamily: 'var(--font-inter)', color: '#111', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} 
                placeholder="Password" 
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'white'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(151,24,251,0.1)'; e.target.style.background = 'rgba(255,255,255,0.8)'; }}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '16px', fontSize: 16, width: '100%', marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 16, boxShadow: '0 8px 24px rgba(151,24,251,0.25)' }}>
              {loading ? <Loader2 className="animate-spin" size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 40, fontSize: 15, color: '#666', fontWeight: 500 }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>Sign up</Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}