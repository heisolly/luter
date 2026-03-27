import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, CheckCircle2, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { SharedNavbar } from './PageShared';

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');
  
  const queryParams = new URLSearchParams(window.location.search);
  const redirectPath = queryParams.get('redirect') || '/onboarding';

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`
      }
    });
    setGoogleLoading(false);
    if (err) { setError(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.session) { navigate(redirectPath); }
    else { setSuccessEmail(email); setSuccess(true); }
  };

  return (
    <div className="hero-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 0, background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
      
      {/* Navbar */}
      <SharedNavbar />

      {/* Hero Background */}
      <div className="hero-bg">
        <div className="hero-bg-grid" />
        <div style={{ position: 'absolute', top: '18%', right: '15%', animation: 'float-up-down 7s ease-in-out infinite' }}>
          <div style={{ width: 72, height: 72, background: 'rgba(5,150,105,0.08)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)', border: '1px solid rgba(5,150,105,0.15)' }}>
            <BookOpen size={32} color="#059669" />
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '15%', left: '8%', animation: 'float-up-down 5s ease-in-out infinite reverse' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(220,38,38,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(220,38,38,0.15)' }}>
            <GraduationCap size={30} color="#dc2626" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '120px 20px 40px', width: '100%' }}>
        
        {success ? (
          <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(151,24,251,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 style={{ width: 32, height: 32, color: 'var(--primary)' }} />
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.2rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 12 }}>Check your inbox</h2>
            <p style={{ fontSize: 16, color: '#666', lineHeight: 1.7, marginBottom: 32 }}>
              We sent a confirmation link to<br />
              <strong style={{ color: '#111' }}>{successEmail}</strong>
            </p>
            <Link to="/signin" className="btn-primary" style={{ padding: '14px 28px', fontSize: 15, textDecoration: 'none', display: 'inline-flex', borderRadius: 16 }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 440 }}>
            
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 12, lineHeight: 1.2 }}>
                Create an account
              </h2>
              <p style={{ fontSize: 16, color: '#666', fontWeight: 500 }}>Start studying 10x faster today.</p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600, marginBottom: 24, border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '16px', borderRadius: 16, border: '2px solid rgba(0,0,0,0.05)', background: 'white', fontSize: 16, fontWeight: 600, color: '#111', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                {googleLoading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign up with Google
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.05)' }} />
                <span style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.05)' }} />
              </div>

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
                  minLength={6}
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '2px solid rgba(151,24,251,0.1)', fontSize: 16, outline: 'none', transition: 'all 0.2s', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', fontFamily: 'var(--font-inter)', color: '#111', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} 
                  placeholder="Password (min 6 chars)" 
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(151,24,251,0.1)'; e.target.style.background = 'rgba(255,255,255,0.8)'; }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '16px', fontSize: 16, width: '100%', marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 16, boxShadow: '0 8px 24px rgba(151,24,251,0.25)' }}>
                {loading ? <Loader2 className="animate-spin" size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <>Create Account <ArrowRight size={18} /></>}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 40, fontSize: 15, color: '#666', fontWeight: 500 }}>
              Already have an account? <Link to="/signin" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>Sign in</Link>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}