import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiCheckboxCircleFill as CheckCircle,
  RiLoader4Line as CircleNotch,
  RiLockFill as Lock,
  RiMailFill as Envelope,
  RiUserFill as User
} from 'react-icons/ri';
import { supabase } from '../../supabaseClient';
import { clearLuterCaches } from '../../utils/cacheUtils';
import { PremiumButton } from '../PageShared';
import GoogleLoginButton from './GoogleLoginButton';
import AuthPageShell from './AuthPageShell';

const buttonStyle = {
  width: '100%',
  background: '#C4B5FD',
  color: '#333333',
  border: '1px solid #C4B5FD',
  borderBottom: '4px solid #FFD2A6',
  boxShadow: '0 10px 22px rgba(196, 181, 253, 0.32)'
};

export default function AuthUnifiedPage({ initialMode = 'signin' }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState(null);
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

  const queryParams = new URLSearchParams(window.location.search);
  const redirectPath = queryParams.get('redirect') || (mode === 'signup' ? '/onboarding' : '/dashboard');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        clearLuterCaches();
        const targetPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
        navigate(targetPath);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const switchMode = (nextMode, path) => {
    setMode(nextMode);
    setSignInError(null);
    setSignUpError(null);
    setSuccess(false);
    window.history.pushState(null, '', path);
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
      const targetPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
      navigate(targetPath);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpLoading(true);
    setSignUpError(null);

    const { data, error: err } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    setSignUpLoading(false);
    if (err) {
      setSignUpError(err.message);
      return;
    }

    if (data?.session) {
      clearLuterCaches();
      const targetPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
      navigate(targetPath);
      return;
    }

    setSuccessEmail(signUpEmail);
    setSuccess(true);
  };

  const isSignUp = mode === 'signup';
  const title = success ? 'Verify your email.' : isSignUp ? 'Create your study account.' : 'Welcome back.';
  const subtitle = success
    ? 'Check your inbox to finish setting up Luter.'
    : isSignUp
      ? 'Join Luter and turn your notes into flashcards, quizzes, summaries, and a cleaner study routine.'
      : 'Sign in and pick up from your flashcards, notes, quizzes, and study streak.';

  return (
    <AuthPageShell
      type={mode}
      title={title}
      subtitle={subtitle}
      error={isSignUp ? signUpError : signInError}
      onModeChange={switchMode}
      footer={!success && (
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
      bottomNote={isSignUp && !success && (
        <>
          By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </>
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
      ) : isSignUp ? (
        <>
          <GoogleLoginButton />

          <div className="auth-divider">
            <span>or use email</span>
          </div>

          <form onSubmit={handleSignUp} className="auth-form">
            <label className="auth-input-wrap">
              <User />
              <input
                className="auth-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
              />
            </label>

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
              {signUpLoading ? <CircleNotch className="animate-spin" size={24} /> : 'Create free account'}
            </PremiumButton>
          </form>
        </>
      ) : (
        <>
          <GoogleLoginButton />

          <div className="auth-divider">
            <span>or use email</span>
          </div>

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
          </form>
        </>
      )}
    </AuthPageShell>
  );
}
