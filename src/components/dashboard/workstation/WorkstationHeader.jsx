import React from 'react';
import { House, CaretRight, CaretDown, ArrowsOut, SignOut, DotsThree } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

export function WorkstationHeader({ courseCode = 'Course', fileName = 'Document', onExit }) {
  const navigate = useNavigate();

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(109, 40, 217, 0.08)',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            width: 34, height: 34, borderRadius: 10, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <House size={19} color="#6B7280" weight="duotone" />
        </button>

        <CaretRight size={13} color="#D1D5DB" />
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>{courseCode}</span>
        <CaretRight size={13} color="#D1D5DB" />
        
        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F5F3FF', border: '1px solid #DDD6FE',
            borderRadius: 9999, padding: '8px 14px', cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6D28D9' }}>{fileName}</span>
          <CaretDown size={13} color="#8B5CF6" weight="bold" />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {/* Top Navigation Tabs will go here */}
        <div style={{
          background: 'rgba(243, 244, 246, 0.6)',
          borderRadius: '9999px',
          padding: 4,
          display: 'inline-flex',
          gap: '4px',
        }}>
          <span style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>Tabs</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: '1px solid rgba(109, 40, 217, 0.12)',
            borderRadius: 9999, padding: '8px 16px', fontSize: 13, color: '#4B5563', fontWeight: 700,
            background: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer'
          }}
        >
          <ArrowsOut size={16} color="#7C3AED" weight="duotone" />
          Focus Mode
        </button>
        <button
          onClick={onExit}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: 9999, padding: '8px 16px', fontSize: 13, fontWeight: 700,
            color: '#EF4444', background: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer'
          }}
        >
          <SignOut size={16} color="#EF4444" weight="duotone" />
          Exit Session
        </button>
        <button style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <DotsThree size={22} color="#6B7280" weight="duotone"/>
        </button>
      </div>
    </header>
  );
}
