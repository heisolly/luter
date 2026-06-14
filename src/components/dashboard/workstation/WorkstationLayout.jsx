import React from 'react';
import { WorkstationHeader } from './WorkstationHeader';
import { WorkstationCenterPane } from './WorkstationCenterPane';
import { WorkstationSidePane } from './WorkstationSidePane';

export function WorkstationLayout({ children }) {
  return (
    <div style={{
      background: 'radial-gradient(120% 120% at 50% 0%, #FAF5FF 0%, #F5F3FF 50%, #F9FAFB 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <WorkstationHeader />
      
      <main style={{
        display: 'flex',
        flexDirection: 'row',
        background: 'transparent',
        overflow: 'hidden',
        padding: '12px',
        gap: '12px',
        flex: 1,
        height: 'calc(100vh - 52px)',
        position: 'relative',
        boxSizing: 'border-box',
      }}>
        <WorkstationCenterPane />
        <WorkstationSidePane />
      </main>
    </div>
  );
}
