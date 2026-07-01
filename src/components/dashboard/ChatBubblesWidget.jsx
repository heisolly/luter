import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ChatBubble = ({ text, color, isDark, tailPosition = 'left' }) => {
  // Determine if it's a solid background or just a border
  // For this design, we'll keep the background matching the theme (white/dark) 
  // and use the color for the border and text to give it a clean look.
  
  const bgColor = isDark ? '#1F2937' : '#FFFFFF';
  
  return (
    <div style={{
      position: 'relative',
      padding: '16px 24px',
      backgroundColor: bgColor,
      border: `1.5px solid ${color}`,
      borderRadius: '24px',
      display: 'inline-block',
      maxWidth: '80%',
      boxShadow: isDark ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.02)',
      marginBottom: '16px'
    }}>
      <span style={{ 
        fontSize: '18px', 
        fontWeight: 500, 
        color: isDark ? '#F9FAFB' : '#1F2937',
        position: 'relative',
        zIndex: 3
      }}>
        {text}
      </span>

      {/* The Normal Chat Handle (Outer Border) */}
      <div style={{
        position: 'absolute',
        bottom: '14px',
        left: '-10px',
        width: 0,
        height: 0,
        borderTop: '10px solid transparent',
        borderBottom: '10px solid transparent',
        borderRight: `10px solid ${color}`,
        zIndex: 1
      }} />
      
      {/* The Normal Chat Handle (Inner Fill) */}
      <div style={{
        position: 'absolute',
        bottom: '15.5px', // slightly offset to create the 1.5px border
        left: '-7px',     // offset to show the left border of the triangle
        width: 0,
        height: 0,
        borderTop: '8.5px solid transparent',
        borderBottom: '8.5px solid transparent',
        borderRight: `8.5px solid ${bgColor}`,
        zIndex: 2
      }} />
    </div>
  );
};

const ChatBubblesWidget = () => {
  const { isDark } = useTheme();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      width: '100%',
      maxWidth: '600px',
      padding: '32px',
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      borderRadius: '32px',
      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
      marginTop: '40px'
    }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 800, color: isDark ? '#F3F4F6' : '#111827' }}>
        Speech Bubbles
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
        {/* 1. Minimalist Gray (Like the image) */}
        <ChatBubble 
          text="What's your daily learning goal?" 
          color={isDark ? '#4B5563' : '#D1D5DB'} 
          isDark={isDark} 
        />

        {/* 2. Luter Lavender */}
        <ChatBubble 
          text="You've maintained a 5-day streak! Keep it up!" 
          color="#C4B5FD" 
          isDark={isDark} 
        />

        {/* 3. Fresh Mint */}
        <ChatBubble 
          text="Your new learning materials are ready." 
          color="#98FF98" 
          isDark={isDark} 
        />

        {/* 4. Warm Peach */}
        <ChatBubble 
          text="Don't forget to take your quiz today!" 
          color="#FFD2A6" 
          isDark={isDark} 
        />

        {/* 5. Neon Cyber Blue */}
        <ChatBubble 
          text="Level up! You are now a Master Explorer." 
          color="#3B82F6" 
          isDark={isDark} 
        />
      </div>
    </div>
  );
};

export default ChatBubblesWidget;
