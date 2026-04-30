import React from 'react';
import { DotmCircular7 } from '../ui/dotm-circular-7';

export const LuterPageLoader = ({ message = "Loading...", minHeight = "80vh" }) => {
  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight 
    }}>
      <DotmCircular7 size={100} dotSize={8} color="var(--primary)" />
      {message && (
        <p style={{ 
          marginTop: '24px', 
          fontFamily: 'var(--font-outfit)', 
          fontSize: '15px', 
          fontWeight: 700, 
          color: 'var(--text)',
          letterSpacing: '0.01em',
          opacity: 0.9
        }}>
          {message}
        </p>
      )}
    </div>
  );
};
