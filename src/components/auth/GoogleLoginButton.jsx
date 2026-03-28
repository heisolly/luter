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

      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        console.log('User Verified:', {
          name: data.user.name,
          email: data.user.email
        });
        
        // Successful login, redirect to dashboard
        navigate('/dashboard');
      } else {
        const errorText = await verifyResponse.text();
        console.error('Verification failed. Status:', verifyResponse.status, errorText);
        
        // Local dev warning for 404
        if (verifyResponse.status === 404) {
          alert('Local development error: The API route /api/verify-google was not found. Please use "vercel dev" to run the app with API support.');
        } else {
          alert('Authentication failed. Please try again.');
        }
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
    <div className="w-full flex flex-col items-center" style={{ marginBottom: '44px' }}>
      {/* The Refined Custom Button Container */}
      <div className="relative w-full h-[52px] group active:scale-[0.99] transition-all duration-200">
        
        {/* Styled Layer: Premium Sleek Design */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-white border-[1px] border-[#e8e8ec] rounded-xl transition-all duration-300 
          group-hover:border-[var(--primary)] group-hover:shadow-[0_4px_16px_rgba(151,24,251,0.08)] pointer-events-none">
          
          {/* Custom Modern Google Icon */}
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          
          <span className="text-[14px] font-bold text-[#111] font-outfit uppercase tracking-wider">Continue with Google</span>
        </div>

        {/* Hidden Interactive Google Component Layer */}
        <div className="absolute inset-0 opacity-0 cursor-pointer overflow-hidden z-10">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            theme="outline"
            shape="rectangular"
            width="400px" 
            text="continue_with"
          />
        </div>
      </div>
    </div>
  );
};

export default GoogleLoginButton;
