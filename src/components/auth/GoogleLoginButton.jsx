import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { clearLuterCaches } from '../../utils/cacheUtils';
import { DASHBOARD_URL } from '../../utils/urlUtils';

const GoogleLoginButton = () => {
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSuccess = async (response) => {
    const { credential } = response;
    console.log('Google Login Success, JWT Captured');
    setIsAuthenticating(true);

    try {
      // 1. Direct Supabase authentication - skip backend verification for faster UX
      const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
      });

      if (authError) {
        console.error('Supabase Auth Error:', authError.message);
        alert('Authentication failed: ' + authError.message);
        setIsAuthenticating(false);
        return;
      }

      // Clear caches upon login to ensure fresh data for the new session
      clearLuterCaches();

      // 2. Parallel operations: get redirect params and profile data simultaneously
      const redirectParam = new URLSearchParams(window.location.search).get('redirect');
      const safeRedirect =
        redirectParam &&
        redirectParam.startsWith('/') &&
        !redirectParam.startsWith('//')
          ? redirectParam
          : '/dashboard';

      // Start profile lookup immediately
      const profilePromise = supabase
        .from('profiles')
        .select('id, onboarding_complete')
        .eq('id', authData.user.id)
        .maybeSingle();

      // Optional: Log to backend in background without blocking
      fetch('/api/verify-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credential }),
      }).catch(err => console.warn('Background logging failed:', err));

      // Wait for profile lookup
      const { data: profile, error: profileError } = await profilePromise;

      if (profileError) {
        console.warn('Profile lookup:', profileError.message);
      }

      const needsOnboarding = profile?.onboarding_complete !== true;

      if (needsOnboarding) {
        console.log('Onboarding incomplete, routing to /onboarding');
        navigate('/onboarding');
      } else {
        console.log('Onboarding complete, routing to', safeRedirect);
        // Simple navigation on the same domain
        const targetPath = safeRedirect.startsWith('/') ? safeRedirect : `/${safeRedirect}`;
        navigate(targetPath);
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      alert('An error occurred during authentication. Please try again.');
      setIsAuthenticating(false);
    }
  };

  const handleError = (error) => {
    console.error('Google Login Failed', error);
    // Silent fail - users can use email/password instead
    // This handles cases where origin is not whitelisted in Google Cloud Console
  };

  return (
    <div className="w-full flex flex-col items-center auth-google-button" style={{ marginBottom: '16px', maxWidth: '100%' }}>
      {/* The Refined Custom Button Container */}
      <div className={`relative w-full h-[52px] max-w-full group active:scale-[0.99] transition-all duration-200 ${isAuthenticating ? 'pointer-events-none opacity-75' : ''}`}>
        
        {/* Styled Layer: Premium Sleek Design */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-[#F9FAFB] border-[1px] border-[#C4B5FD]/70 rounded-full transition-all duration-300 
          group-hover:border-[#FFD2A6] group-hover:shadow-[0_6px_18px_rgba(196,181,253,0.22)] pointer-events-none">
          
          {/* Custom Modern Google Icon or Loading Spinner */}
          <div className="w-5 h-5 flex items-center justify-center">
            {isAuthenticating ? (
              <div className="w-[18px] h-[18px] border-2 border-[#FFD2A6] border-t-[#C4B5FD] rounded-full animate-spin"></div>
            ) : (
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
          </div>
          
          <span className="auth-google-label text-[14px] font-bold text-[#333333] font-outfit uppercase tracking-wider">
            {isAuthenticating ? 'Signing in...' : 'Continue with Google'}
          </span>
        </div>

        {/* Invisible Google iframe layer — covers the styled button exactly for click capture */}
        <div className="absolute inset-0 z-10" style={{ opacity: 0.01, overflow: 'visible' }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            theme="outline"
            shape="rectangular"
            text="continue_with"
            disabled={isAuthenticating}
          />
        </div>
      </div>
      <style>{`
        .auth-google-button,
        .auth-google-button > div {
          min-width: 0;
        }

        .auth-google-button iframe,
        .auth-google-button div[role="button"] {
          max-width: 100% !important;
        }

        @media (max-width: 420px) {
          .auth-google-button {
            margin-bottom: 13px !important;
          }

          .auth-google-button > div {
            height: 50px !important;
          }

          .auth-google-label {
            font-size: 12px !important;
            letter-spacing: 0.04em !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GoogleLoginButton;
