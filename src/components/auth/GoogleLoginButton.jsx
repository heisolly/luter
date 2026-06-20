import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { supabase } from '../../supabaseClient';
import { clearLuterCaches } from '../../utils/cacheUtils';
import { useTheme } from '../../contexts/ThemeContext';

const queryParams = new URLSearchParams(window.location.search);
const redirectPath = queryParams.get('redirect') || '/dashboard';

const GoogleLoginButton = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSuccess = async (response) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      clearLuterCaches();
      
      const queryParams = new URLSearchParams(window.location.search);
      const redirectPath = queryParams.get('redirect') || '/dashboard';
      
      if (redirectPath.startsWith('http')) {
        window.location.href = redirectPath;
      } else {
        const targetPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
        navigate(targetPath);
      }
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleError = () => {
    setError('Google sign-in unavailable. Use email instead.');
  };

  return (
    <div style={{ marginBottom: '16px', maxWidth: '100%', width: '100%' }}>
      <div style={{ height: '52px' }}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          theme={isDark ? "filled_black" : "outline"}
          size="large"
          shape="pill"
          text="continue_with"
          disabled={loading}
        />
      </div>
      {error && (
        <p style={{ marginTop: '8px', fontSize: '12px', color: isDark ? '#FCA5A5' : '#DC2626', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default GoogleLoginButton;
