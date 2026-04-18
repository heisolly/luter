import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, CheckCircle2, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { SharedNavbar } from './PageShared';
import GoogleLoginButton from './auth/GoogleLoginButton';

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');
  
  const queryParams = new URLSearchParams(window.location.search);
  const redirectPath = queryParams.get('redirect') || '/onboarding';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
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
        <div style={{ position: 'absolute', top: '12%', right: '5%', animation: 'float-up-down 7s ease-in-out infinite', opacity: 0.5 }}>
          <div style={{ width: 60, height: 60, background: 'rgba(151,24,251,0.08)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)', border: '1px solid rgba(151,24,251,0.15)' }}>
            <BookOpen size={28} color="var(--primary)" />
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '15%', left: '5%', animation: 'float-up-down 5s ease-in-out infinite reverse', opacity: 0.5 }}>
          <div style={{ width: 50, height: 50, background: 'rgba(2,132,199,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(2,132,199,0.15)' }}>
            <GraduationCap size={24} color="#0284c7" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="auth-content-mobile" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, width: '100%', padding: '20px' }}>
        
        {success ? (
          <div style={{ width: '100%', maxWidth: 440, textAlign: 'center', paddingTop: '100px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(151,24,251,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 style={{ width: 32, height: 32, color: 'var(--primary)' }} />
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.2rem)', fontWeight: 800, fontFamily: 'var(--font-varela)', color: '#111', marginBottom: 12 }}>Check your inbox</h2>
            <p style={{ fontSize: 16, color: '#666', lineHeight: 1.7, marginBottom: 32 }}>
              We sent a confirmation link to<br />
              <strong style={{ color: '#111' }}>{successEmail}</strong>
            </p>
            <Link to="/signin" className="btn-primary" style={{ padding: '14px 28px', fontSize: 15, textDecoration: 'none', display: 'inline-flex', borderRadius: 16 }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 440, paddingTop: '140px', paddingBottom: '60px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 2.8rem)', fontWeight: 800, fontFamily: 'var(--font-varela)', color: '#111', marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                Start your journey.
              </h2>
              <p style={{ fontSize: 16, color: '#666', fontWeight: 500 }}>Create your account to access Luter.</p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600, marginBottom: 24, border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <GoogleLoginButton />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0', opacity: 0.15 }}>
              <div style={{ flex: 1, height: 1, background: '#000' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#666' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#000' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div>
                <input 
                  type="text" 
                  required 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  style={inputStyle} 
                  placeholder="Full Name" 
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  style={inputStyle} 
                  placeholder="Email Address" 
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={inputStyle} 
                  placeholder="Create Password" 
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '16px', fontSize: 16, width: '100%', marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 16, boxShadow: '0 8px 24px rgba(151,24,251,0.25)' }}>
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Create Free Account <ArrowRight size={18} /></>}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 40, fontSize: 15, color: '#666', fontWeight: 500 }}>
              Already have an account? <Link to="/signin" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>Sign in here</Link>
            </div>

            <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#999', lineHeight: 1.5 }}>
              By signing up, you agree to our <br />
              <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
            </p>
            
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = { 
  width: '100%', 
  padding: '16px 20px', 
  borderRadius: 16, 
  border: '2px solid rgba(151,24,251,0.1)', 
  fontSize: 16, 
  outline: 'none', 
  transition: 'all 0.2s', 
  background: 'rgba(255,255,255,0.8)', 
  backdropFilter: 'blur(10px)', 
  fontFamily: 'var(--font-inter)', 
  color: '#111', 
  boxShadow: '0 4px 12px rgba(0,0,0,0.02)' 
};

const handleFocus = (e) => { 
  e.target.style.borderColor = 'var(--primary)'; 
  e.target.style.background = 'white'; 
};

const handleBlur = (e) => { 
  e.target.style.borderColor = 'rgba(151,24,251,0.1)'; 
  e.target.style.background = 'rgba(255,255,255,0.8)'; 
};