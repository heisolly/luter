import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

const GoogleLoginButton = ({ mode }) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams(window.location.search);
      let redirectPath = queryParams.get('redirect') || (mode === 'signup' ? '/onboarding' : '/home');
      if (!redirectPath.startsWith('/')) redirectPath = `/${redirectPath}`;
      
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + redirectPath
        }
      });
      
      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '16px', maxWidth: '100%', width: '100%' }}>
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{
          width: '100%',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          color: isDark ? '#ffffff' : '#374151',
          border: `1px solid ${isDark ? '#333333' : '#d1d5db'}`,
          borderRadius: '9999px',
          fontSize: '15px',
          fontWeight: '500',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.7 : 1,
          fontFamily: 'var(--font-outfit), sans-serif',
        }}
        onMouseOver={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = isDark ? '#262626' : '#f9fafb';
          }
        }}
        onMouseOut={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = isDark ? '#1a1a1a' : '#ffffff';
          }
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
          </g>
        </svg>
        {loading ? 'Connecting...' : 'Continue with Google'}
      </button>
      {error && (
        <p style={{ marginTop: '8px', fontSize: '12px', color: isDark ? '#FCA5A5' : '#DC2626', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default GoogleLoginButton;
