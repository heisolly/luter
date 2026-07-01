import React, { useEffect, useState } from 'react';
import { GameController, Lightbulb, Trophy, Star, Lightning, Target, X, Heart } from '@phosphor-icons/react';

const GamifiedProgressBars = ({ isDark = false }) => {
  // Animation state to make the bars fill up on mount
  const [progress1, setProgress1] = useState(0);
  const [progress2, setProgress2] = useState(0);
  const [progress3, setProgress3] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress1(75), 300);
    const t2 = setTimeout(() => setProgress2(60), 500);
    const t3 = setTimeout(() => setProgress3(85), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '600px',
      padding: '32px',
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
      borderRadius: '32px',
      boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.05)',
      border: `1px solid ${isDark ? '#374151' : '#F3F4F6'}`
    }}>
      {/* DESIGN 3: The "Milestone / Other" Bar (Premium & Segmented) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#F9FAFB' : '#1F2937' }}>
            17 <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#6B7280' : '#9CA3AF' }}>/ 20</span>
          </span>
        </div>
        
        <div style={{ 
          height: '32px', 
          width: '100%', 
          backgroundColor: isDark ? '#1F2937' : '#F3F4F6', 
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          border: `2px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          padding: '2px'
        }}>
          {/* Fill */}
          <div style={{
            height: '100%',
            width: `${progress3}%`,
            backgroundColor: '#98FF98', // The mint green requested earlier
            borderRadius: '12px',
            transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '12px'
          }}>
             {/* Diagonal stripes overlay for texture */}
             <div style={{
               position: 'absolute',
               inset: 0,
               backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)',
               backgroundSize: '20px 20px',
               opacity: 0.6
             }} />
             <Star size={16} weight="fill" color="#059669" style={{ position: 'relative', zIndex: 1 }} />
          </div>
        </div>
      </div>

      {/* DESIGN 4: The "Pixel / Segmented" Bar (Blocky & Retro) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#F9FAFB' : '#1F2937', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
            45 <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#6B7280' : '#9CA3AF' }}>/ 100</span>
          </span>
        </div>
        
        <div style={{ 
          height: '24px', 
          width: '100%', 
          backgroundColor: isDark ? '#1F2937' : '#F3F4F6', 
          borderRadius: '4px', // Less rounded for pixel feel
          border: `2px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          padding: '2px',
          display: 'flex',
          gap: '4px'
        }}>
          {/* Create 10 segments */}
          {[...Array(10)].map((_, i) => {
            const isFilled = i < (progress3 / 100) * 10;
            return (
              <div 
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: isFilled ? '#FFD2A6' : 'transparent',
                  borderRadius: '2px',
                  transition: `background-color 0.3s ease ${i * 0.1}s`,
                  boxShadow: isFilled ? '0 0 8px rgba(255, 210, 166, 0.4)' : 'none'
                }}
              />
            )
          })}
        </div>
      </div>

      {/* DESIGN 5: The "Mascot Slider" Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#F9FAFB' : '#1F2937' }}>
            Level 7 <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#6B7280' : '#9CA3AF' }}>: 750 XP</span>
          </span>
        </div>
        
        <div style={{ 
          height: '40px', // slightly taller to fit the mascot nicely
          width: '100%', 
          backgroundColor: isDark ? '#1F2937' : '#F3F4F6', 
          borderRadius: '20px',
          position: 'relative',
          display: 'flex',
          border: `2px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          padding: '2px'
        }}>
          {/* Fill */}
          <div style={{
            height: '100%',
            width: `${progress3}%`,
            backgroundColor: '#C4B5FD',
            borderRadius: '16px',
            transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
             {/* Diagonal stripes overlay for texture */}
             <div style={{
               position: 'absolute',
               inset: 0,
               backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)',
               backgroundSize: '20px 20px',
               opacity: 0.6,
               borderRadius: '16px',
               overflow: 'hidden'
             }} />
             
             {/* Mascot riding the front edge of the progress */}
             <div style={{ 
               width: '36px', 
               height: '36px', 
               position: 'absolute', 
               right: '-18px', // Center it perfectly on the front edge
               zIndex: 10,
               display: 'flex',
               justifyContent: 'center',
               alignItems: 'center'
             }}>
               <img src="/mascot.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
             </div>
          </div>
        </div>
      </div>

      {/* DESIGN 4: The "Lesson Header" Bar (Duolingo Style) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '32px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Lesson Mode
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          width: '100%'
        }}>
          {/* Quit Button */}
          <button style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: isDark ? '#6B7280' : '#9CA3AF',
            transition: 'color 0.2s',
          }}>
            <X size={28} weight="bold" />
          </button>

          {/* Glossy Progress Bar */}
          <div style={{ 
            height: '18px', 
            flex: 1, 
            backgroundColor: isDark ? '#374151' : '#E5E7EB', 
            borderRadius: '999px',
            position: 'relative',
          }}>
            {/* Fill */}
            <div style={{
              height: '100%',
              width: `${progress1}%`,
              backgroundColor: '#58CC02', // Classic vibrant green
              borderRadius: '999px',
              transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
               {/* Glossy Top Shine */}
               <div style={{
                 position: 'absolute',
                 top: '3px', // Offset from top
                 left: '8px',
                 right: '8px', // Prevent it from touching the curved edges entirely
                 height: '4px', // Thin shine line
                 backgroundColor: 'rgba(255, 255, 255, 0.3)',
                 borderRadius: '999px',
               }} />
            </div>
          </div>

          {/* Hearts Counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#FF4B4B',
            fontWeight: 800,
            fontSize: '18px'
          }}>
            <Heart size={28} weight="fill" color="#FF4B4B" />
            <span>5</span>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default GamifiedProgressBars;
