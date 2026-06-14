import React from 'react';
import { Trash, ChatCircle, Palette } from '@phosphor-icons/react';

export default function HighlightPopup({ 
  position, 
  currentColor, 
  isDark, 
  onColorChange, 
  onDelete,
  onAddComment
}) {
  const [showColors, setShowColors] = React.useState(false);
  if (!position) return null;

  const bg = isDark ? '#1F2937' : '#FFFFFF';
  const border = isDark ? '#374151' : '#E5E7EB';
  const text = isDark ? '#F9FAFB' : '#111827';
  const hoverBg = isDark ? '#374151' : '#F3F4F6';

  const HIGHLIGHT_PALETTE = [
    ['#3B82F6', '#16A34A', '#EAB308', '#F97316', '#EF4444', '#A855F7', '#8B5CF6'], // Blue, Green, Yellow, Orange, Red, Fuchsia, Violet
    ['#67E8F9', '#BEF264', '#FEF08A', '#FDBA74', '#FCA5A5', '#F0ABFC', '#C4B5FD'], // Light variants
    ['#FFFFFF', '#E5E7EB', '#9CA3AF', '#4B5563', '#374151', '#1F2937', '#000000']  // Grayscale
  ];

  return (
    <div 
      className="highlight-popup"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y - 65, 
        transform: 'translateX(-50%)',
        zIndex: 999999,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '16px',
        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 10px 30px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        gap: '12px',
        animation: 'toolboxAppear 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onPointerDown={(e) => {
        // e.preventDefault() removed so clicks inside will work natively!
        e.stopPropagation();
      }}
    >
      <button
        title="Add Comment"
        onClick={(e) => {
          e.stopPropagation();
          onAddComment?.();
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          borderRadius: '8px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = hoverBg}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <ChatCircle size={22} weight="regular" />
      </button>

      <div style={{ position: 'relative', display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button
          onClick={() => setShowColors(!showColors)}
          title="Change Color"
          style={{
            background: 'transparent',
            border: 'none',
            color: text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '8px',
            transition: 'all 0.2s',
            position: 'relative'
          }}
          onMouseEnter={e => e.currentTarget.style.background = hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Palette size={22} weight="regular" />
          <div style={{
            position: 'absolute',
            bottom: '4px', right: '4px',
            width: '10px', height: '10px',
            borderRadius: '50%',
            background: currentColor || '#FEF3C7',
            border: `2px solid ${bg}`
          }}/>
        </button>
        
        {showColors && (
          <div style={{
            position: 'absolute',
            bottom: '100%', // Open above
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '16px',
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 1000000
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: text, marginBottom: '4px' }}>
              Colors
            </div>
            {HIGHLIGHT_PALETTE.map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px' }}>
                {row.map(c => (
                  <div
                    key={c}
                    onClick={() => {
                      onColorChange(c);
                      setShowColors(false);
                    }}
                    style={{
                      width: 26, height: 26,
                      backgroundColor: c,
                      cursor: 'pointer',
                      border: c === '#FFFFFF' ? '1px solid #E5E7EB' : '1px solid transparent',
                      boxShadow: currentColor === c ? `0 0 0 2px ${bg}, 0 0 0 4px #3B82F6` : 'none',
                      borderRadius: '50%',
                      transition: 'transform 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {currentColor === c && (
                      <div style={{ color: c === '#FFFFFF' ? '#000' : (['#FEF08A', '#FEF3C7'].includes(c) ? '#000' : '#FFF') }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: 1, height: 24, background: border, margin: '0 4px' }} />

      <button
        onClick={onDelete}
        title="Delete Highlight"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#EF4444',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          borderRadius: '8px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Trash size={22} weight="regular" />
      </button>
    </div>
  );
}
