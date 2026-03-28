import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const handleSuccess = async (response) => {
    const { credential } = response;
    console.log('Google Login Success, JWT Captured');

    try {
      // Send token to backend for verification
      const verifyResponse = await fetch('/api/verify-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credential }),
      });

      const data = await verifyResponse.json();

      if (verifyResponse.ok) {
        console.log('User Verified:', {
          name: data.user.name,
          email: data.user.email
        });
        
        // Successful login, redirect to dashboard
        // In a real application, you would manage auth state here (Session/Token)
        navigate('/dashboard');
      } else {
        console.error('Verification failed:', data.error);
        alert('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during verification:', error);
      alert('An error occurred during authentication. Please check console for details.');
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 py-4">
      <div className="relative w-full flex items-center gap-4 my-2">
        <div className="flex-1 h-px bg-slate-200"></div>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Or continue with</span>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>
      
      <div className="w-full transition-transform hover:scale-[1.01] active:scale-[0.99]">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap
          theme="filled_blue"
          shape="rectangular"
          width="100%"
          text="continue_with"
        />
      </div>
    </div>
  );
};

export default GoogleLoginButton;
