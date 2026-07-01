import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const QuitOverlaysWidget = () => {
  const { isDark } = useTheme();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '40px',
      width: '100%',
      maxWidth: '1000px',
      padding: '32px',
      backgroundColor: isDark ? '#111827' : '#F3F4F6',
      borderRadius: '32px',
      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
      marginTop: '40px'
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center' }}>
        
        {/* DESIGN 1: The Exact Clean Reference (Blue Primary) */}
        <div style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderRadius: '24px',
          padding: '40px 32px 32px 32px',
          boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Mascot */}
          <div style={{ width: '100px', height: '100px', marginBottom: '24px' }}>
            <img src="/mascot.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          
          {/* Single Bold Text block exactly like the reference */}
          <h3 style={{ 
            margin: '0 0 32px 0', 
            fontSize: '19px', 
            fontWeight: 700, 
            color: isDark ? '#F9FAFB' : '#4B5563', 
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            Wait, don't go! You'll lose your progress if you quit now
          </h3>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Primary Button (3D style) */}
            <button 
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#1CB0F6', // The classic friendly blue
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                borderBottom: '4px solid #1899D6', // The 3D lip
                fontSize: '15px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.borderBottom = '0px solid #1899D6';
                e.currentTarget.style.marginBottom = '4px';
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderBottom = '4px solid #1899D6';
                e.currentTarget.style.marginBottom = '0px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderBottom = '4px solid #1899D6';
                e.currentTarget.style.marginBottom = '0px';
              }}
            >
              KEEP LEARNING
            </button>
            
            {/* Secondary Ghost Button */}
            <button style={{
              width: '100%',
              padding: '16px',
              backgroundColor: 'transparent',
              color: '#FF4B4B', // The red from the reference
              border: 'none',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 75, 75, 0.1)' : '#FFF0F0'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              END SESSION
            </button>
          </div>
        </div>


        {/* DESIGN 2: The Exact Clean Reference (Mint Primary) */}
        <div style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderRadius: '24px',
          padding: '40px 32px 32px 32px',
          boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Mascot */}
          <div style={{ width: '100px', height: '100px', marginBottom: '24px' }}>
            <img src="/mascot.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          
          <h3 style={{ 
            margin: '0 0 32px 0', 
            fontSize: '19px', 
            fontWeight: 700, 
            color: isDark ? '#F9FAFB' : '#4B5563', 
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            Wait, don't go! You'll lose your progress if you quit now
          </h3>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Primary Button (Mint style) */}
            <button 
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#58CC02', // The classic vibrant green
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                borderBottom: '4px solid #58A700', // The 3D lip for green
                fontSize: '15px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.borderBottom = '0px solid #58A700';
                e.currentTarget.style.marginBottom = '4px';
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderBottom = '4px solid #58A700';
                e.currentTarget.style.marginBottom = '0px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderBottom = '4px solid #58A700';
                e.currentTarget.style.marginBottom = '0px';
              }}
            >
              KEEP LEARNING
            </button>
            
            {/* Secondary Ghost Button */}
            <button style={{
              width: '100%',
              padding: '16px',
              backgroundColor: 'transparent',
              color: '#FF4B4B',
              border: 'none',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 75, 75, 0.1)' : '#FFF0F0'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              END SESSION
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuitOverlaysWidget;
