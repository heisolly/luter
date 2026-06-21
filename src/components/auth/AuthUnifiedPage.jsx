import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiCheckboxCircleFill as CheckCircle,
  RiLoader4Line as CircleNotch,
  RiLockFill as Lock,
  RiMailFill as Envelope,
  RiAppleFill as Apple
} from 'react-icons/ri';
import { supabase } from '../../supabaseClient';
import { clearLuterCaches } from '../../utils/cacheUtils';
import { PremiumButton } from '../PageShared';
import GoogleLoginButton from './GoogleLoginButton';
import AuthPageShell from './AuthPageShell';
import { useTheme } from '../../contexts/ThemeContext';

export default function AuthUnifiedPage({ initialMode = 'signin' }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const buttonStyle = {
    width: '100%',
    height: '56px',
    background: isDark 
      ? 'linear-gradient(135deg, #6D5BA5 0%, #4C3C88 100%)' 
      : 'linear-gradient(135deg, #111827 0%, #374151 100%)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '9999px',
    boxShadow: isDark
      ? '0 12px 28px rgba(109, 91, 165, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
      : '0 12px 28px rgba(17, 24, 39, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
    fontWeight: '700',
    fontSize: '16px',
    letterSpacing: '0.01em',
    transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)',
    color: isDark ? '#ffffff' : '#1f2937',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: 'none',
  };

  const [mode, setMode] = useState(initialMode);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState(null);
  
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

  const queryParams = new URLSearchParams(window.location.search);
  const redirectPath = queryParams.get('redirect') || (mode === 'signup' ? '/onboarding' : '/home');

  const switchMode = (nextMode, path) => {
    setMode(nextMode);
    setSignInError(null);
    setSignUpError(null);
    setSuccess(false);
    setShowEmailForm(false); // Reset to stacked buttons when switching modes
    window.history.pushState(null, '', path + window.location.search);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInLoading(true);
    setSignInError(null);

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });

    setSignInLoading(false);
    if (err) {
      setSignInError(err.message);
      return;
    }

    if (data?.session) {
      clearLuterCaches();
      if (redirectPath.startsWith('http')) {
        window.location.href = redirectPath;
      } else {
        const targetPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
        navigate(targetPath);
      }
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpLoading(true);
    setSignUpError(null);

    const { data, error: err } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
    });

    setSignUpLoading(false);
    if (err) {
      setSignUpError(err.message);
      return;
    }

    if (data?.session) {
      clearLuterCaches();
      if (redirectPath.startsWith('http')) {
        window.location.href = redirectPath;
      } else {
        const targetPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
        navigate(targetPath);
      }
      return;
    }

    setSuccessEmail(signUpEmail);
    setSuccess(true);
  };

  const isSignUp = mode === 'signup';
  const title = success ? 'Verify your email.' : isSignUp ? "Let's get started!" : "Welcome back!";
  const subtitle = success
    ? 'Check your inbox to finish setting up Luter.'
    : isSignUp
      ? 'Join Luter and turn your notes into flashcards, quizzes, and summaries.'
      : 'Sign in to pick up right where you left off.';

  return (
    <AuthPageShell
      type={mode}
      title={title}
      subtitle={subtitle}
      error={isSignUp ? signUpError : signInError}
      onModeChange={switchMode}
      footer={!success && !showEmailForm && (
        isSignUp ? (
          <>
            Already have an account?{' '}
            <button className="auth-inline-switch" type="button" onClick={() => switchMode('signin', '/signin')}>
              Sign in here
            </button>
          </>
        ) : (
          <>
            New to Luter?{' '}
            <button className="auth-inline-switch" type="button" onClick={() => switchMode('signup', '/signup')}>
              Create an account
            </button>
          </>
        )
      )}
    >
      {success ? (
        <div className="auth-success-card">
          <div className="auth-success-icon">
            <CheckCircle />
          </div>
          <h2>Magic link sent</h2>
          <p>
            We sent a verification link to <strong>{successEmail}</strong>.
            Open it to unlock your workspace.
          </p>
          <PremiumButton type="button" size="lg" style={buttonStyle} onClick={() => switchMode('signin', '/signin')}>
            Go to Sign In
          </PremiumButton>
        </div>
      ) : !showEmailForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <GoogleLoginButton mode={mode} />
          
          <div className="auth-divider">
            <span>Other options</span>
          </div>
          
          <button 
            type="button" 
            style={{...secondaryButtonStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}
            onClick={() => setShowEmailForm(true)}
            onMouseOver={(e) => e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)'}
            onMouseOut={(e) => e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)'}
          >
            <Envelope size={20} />
            {isSignUp ? 'Sign up with Email' : 'Sign in with Email'}
          </button>
        </div>
      ) : isSignUp ? (
        <form onSubmit={handleSignUp} className="auth-form">
          <label className="auth-input-wrap">
            <Envelope />
            <input
              className="auth-input"
              type="email"
              required
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
            />
          </label>

          <label className="auth-input-wrap">
            <Lock />
            <input
              className="auth-input"
              type="password"
              required
              minLength={6}
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              placeholder="Create password"
              autoComplete="new-password"
            />
          </label>

          <PremiumButton type="submit" disabled={signUpLoading} size="lg" className="auth-submit" style={buttonStyle}>
            {signUpLoading ? <CircleNotch className="animate-spin" size={24} /> : 'Create account'}
          </PremiumButton>
          
          <button 
            type="button" 
            className="auth-inline-switch" 
            onClick={() => setShowEmailForm(false)}
            style={{ marginTop: '16px', display: 'block', width: '100%', textAlign: 'center' }}
          >
            Back to options
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} className="auth-form">
          <label className="auth-input-wrap">
            <Envelope />
            <input
              className="auth-input"
              type="email"
              required
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
            />
          </label>

          <label className="auth-input-wrap">
            <Lock />
            <input
              className="auth-input"
              type="password"
              required
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
          </label>

          <PremiumButton type="submit" disabled={signInLoading} size="lg" className="auth-submit" style={buttonStyle}>
            {signInLoading ? <CircleNotch className="animate-spin" size={24} /> : 'Sign in'}
          </PremiumButton>

          <button 
            type="button" 
            className="auth-inline-switch" 
            onClick={() => setShowEmailForm(false)}
            style={{ marginTop: '16px', display: 'block', width: '100%', textAlign: 'center' }}
          >
            Back to options
          </button>
        </form>
      )}
    </AuthPageShell>
  );
}
