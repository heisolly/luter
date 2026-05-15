import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiArrowRightSLine as CaretRight, RiLoader4Line as CircleNotch, RiCheckboxCircleFill as CheckCircle, RiUserFill as User, RiMailFill as Envelope, RiLockFill as Lock, RiBookOpenFill as BookOpen, RiGraduationCapFill as GraduationCap } from 'react-icons/ri';
import { supabase } from '../supabaseClient';
import { clearLuterCaches } from '../utils/cacheUtils';

import GoogleLoginButton from './auth/GoogleLoginButton';
import { AuthNavbar, PremiumButton } from './PageShared';
import { DASHBOARD_URL } from '../utils/urlUtils';

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
    if (data?.session) { 
      clearLuterCaches();
      // Redirect to onboarding or dashboard on the correct domain
      const isAppPath = redirectPath.startsWith('/dashboard') || !['/onboarding', '/signin', '/signup'].includes(redirectPath);
      if (isAppPath) {
        const targetPath = redirectPath.startsWith('/dashboard') ? redirectPath : `/dashboard${redirectPath.startsWith('/') ? '' : '/'}${redirectPath}`;
        window.location.href = `${DASHBOARD_URL}${targetPath}`;
      } else {
        navigate(redirectPath);
      }
    }
    else { setSuccessEmail(email); setSuccess(true); }
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
        <div style={{ position: 'absolute', top: '15%', right: '8%', opacity: 0.1, animation: 'float 6s infinite ease-in-out' }}>
          <div style={{ padding: '20px', borderRadius: '24px', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <BookOpen size={40} color="#4B0082" weight="light" />
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '15%', left: '8%', opacity: 0.1, animation: 'float 7s infinite ease-in-out-reverse' }}>
          <div style={{ padding: '20px', borderRadius: '24px', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <GraduationCap size={40} color="#4B0082" weight="light" />
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <AuthNavbar type="signup" />

      <div style={{ 
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: '60px 20px', position: 'relative', zIndex: 1 
      }}>
        {success ? (
          <div style={cardStyle}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <CheckCircle size={40} weight="bold" color="#22c55e" />
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111', marginBottom: 16, fontFamily: 'var(--font-outfit)' }}>Verify your email</h2>
            <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.6, marginBottom: 40 }}>
              We've sent a magic link to <br /><strong style={{ color: '#111' }}>{successEmail}</strong>
            </p>
            <PremiumButton to="/signin" size="lg" style={{ width: '100%' }}>
              Go to Sign In
            </PremiumButton>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
            <div style={{ marginBottom: 48 }}>
              <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111', marginBottom: 16, letterSpacing: '-0.03em', fontFamily: 'var(--font-outfit)' }}>
                Start your journey.
              </h1>
              <p style={{ fontSize: 16, color: '#64748B', fontWeight: 500 }}>Create your account to access Luter.</p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: 24, fontSize: 14, fontWeight: 700, marginBottom: 32, border: '1px solid #fee2e2' }}>
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
                  type="text" required value={fullName} onChange={e => setFullName(e.target.value)} 
                  style={inputStyle} placeholder="FULL NAME" 
                />
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  style={inputStyle} placeholder="EMAIL ADDRESS" 
                />
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} 
                  style={inputStyle} placeholder="CREATE PASSWORD" 
                />
              </div>

              <PremiumButton type="submit" disabled={loading} size="lg" style={{ width: '100%', marginTop: '12px' }}>
                {loading ? <CircleNotch className="animate-spin" size={24} weight="light" /> : "CREATE FREE ACCOUNT"}
              </PremiumButton>
            </form>

            <div style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: '#64748B', fontWeight: 600 }}>
              Already have an account? <Link to="/signin" style={{ color: '#4B0082', fontWeight: 800, textDecoration: 'none' }}>Sign in here</Link>
            </div>

            <div style={{ marginTop: 40, fontSize: 12, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6 }}>
              By signing up, you agree to our <br />
              <Link to="#" style={{ color: '#64748B', textDecoration: 'underline' }}>Terms of Service</Link> and <Link to="#" style={{ color: '#64748B', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  width: '100%', 
  maxWidth: 480, 
  background: 'rgba(255, 255, 255, 0.7)', 
  backdropFilter: 'blur(20px)',
  padding: '48px', 
  borderRadius: '32px', 
  border: '1px solid rgba(255, 255, 255, 0.8)', 
  boxShadow: '0 20px 40px rgba(0,0,0,0.02)',
  fontFamily: 'var(--font-varela)',
  textAlign: 'center'
};

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