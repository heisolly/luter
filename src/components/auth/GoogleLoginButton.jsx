import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

const GoogleLoginButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch {
      setError('Could not connect to Google. Try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '16px', maxWidth: '100%', width: '100%' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          width: '100%',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: '#F9FAFB',
          border: '1px solid rgba(196, 181, 253, 0.7)',
          borderRadius: '9999px',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.75 : 1,
          transition: 'all 0.2s',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.borderColor = '#FFD2A6';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(196,181,253,0.22)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(196, 181, 253, 0.7)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {loading ? (
          <div style={{ width: '18px', height: '18px', border: '2px solid #FFD2A6', borderTopColor: '#C4B5FD', borderRadius: '50%', animation: 'google-spin 0.6s linear infinite' }} />
        ) : (
          <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', flexShrink: 0 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#333', fontFamily: 'var(--font-outfit)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {loading ? 'Redirecting...' : 'Continue with Google'}
        </span>
      </button>
      {error && (
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#DC2626', textAlign: 'center' }}>
          {error}
        </p>
      )}
      <style>{`
        @keyframes google-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default GoogleLoginButton;
