import React from 'react';

/**
 * Global Icon Provider — sets default icon color/size via CSS.
 * (lucide-react removed IconContext; icons inherit currentColor automatically.)
 */
export function IconProvider({ children }) {
  return (
    <div style={{ display: 'contents', '--lucide-color': 'currentColor' }}>
      {children}
    </div>
  );
}
