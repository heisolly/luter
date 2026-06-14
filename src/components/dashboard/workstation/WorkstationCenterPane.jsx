import React from 'react';

export function WorkstationCenterPane() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '24px',
      border: '1px solid rgba(139, 92, 246, 0.08)',
      boxShadow: '0 8px 32px rgba(109, 40, 217, 0.03)',
      overflow: 'hidden',
      height: '100%',
    }}>
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF' }}>
        Center Pane (Document / Board / Summary)
      </div>
    </div>
  );
}
